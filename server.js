'use strict';

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const { Pool } = require('pg');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const STAFF_PIN = process.env.STAFF_PIN;
const ADMIN_PIN = process.env.ADMIN_PIN || STAFF_PIN;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

let sslMode = null;
try {
  const dbUrl = new URL(DATABASE_URL);
  sslMode = dbUrl.searchParams.get('sslmode');
} catch (error) {
  console.warn('Failed to parse DATABASE_URL for sslmode.');
}

const sslRequired = process.env.DATABASE_SSL === 'true' || (sslMode && sslMode !== 'disable');
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: sslRequired ? { rejectUnauthorized: false } : undefined
});

const DEFAULT_SERVICES = [
  { name: 'Walk-in', avgMinutes: 12 },
  { name: 'Consultation', avgMinutes: 20 },
  { name: 'Premium Service', avgMinutes: 35 }
];

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requirePin(req, res, next) {
  if (!STAFF_PIN) {
    return res.status(500).json({ error: 'STAFF_PIN is not configured.' });
  }

  const provided = req.header('x-qsys-pin');
  if (!provided || provided !== STAFF_PIN) {
    return res.status(401).json({ error: 'Invalid PIN.' });
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!ADMIN_PIN) {
    return res.status(500).json({ error: 'ADMIN_PIN is not configured.' });
  }

  const provided = req.header('x-qsys-admin-pin') || req.header('x-qsys-pin');
  if (!provided || provided !== ADMIN_PIN) {
    return res.status(401).json({ error: 'Invalid admin PIN.' });
  }

  return next();
}

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    avgMinutes: row.avg_minutes
  };
}

function mapQueue(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    serviceId: row.service_id,
    branchId: row.branch_id,
    ticketNumber: row.ticket_number,
    status: row.status,
    createdAt: row.created_at,
    notifiedAt: row.notified_at,
    servedAt: row.served_at,
    canceledAt: row.canceled_at
  };
}

function generateBranchCode() {
  return crypto.randomBytes(3).toString('hex');
}

async function ensureDefaultBranch() {
  const existing = await pool.query('SELECT id FROM branches ORDER BY created_at LIMIT 1');
  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const id = crypto.randomUUID();
  const name = 'Main';
  let code = 'main';
  const codeCheck = await pool.query('SELECT 1 FROM branches WHERE code = $1', [code]);
  if (codeCheck.rowCount) {
    code = generateBranchCode();
  }

  await pool.query(
    'INSERT INTO branches (id, name, code, next_ticket) VALUES ($1, $2, $3, 0)',
    [id, name, code]
  );

  return id;
}

async function getBranchByCode(code) {
  if (!code) return null;
  const result = await pool.query('SELECT id, name, code FROM branches WHERE code = $1', [code]);
  return result.rowCount ? result.rows[0] : null;
}

async function getBranchById(id) {
  if (!id) return null;
  const result = await pool.query('SELECT id, name, code FROM branches WHERE id = $1', [id]);
  return result.rowCount ? result.rows[0] : null;
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      code text NOT NULL UNIQUE,
      next_ticket integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      avg_minutes integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS queue (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      phone text NOT NULL,
      service_id uuid NOT NULL REFERENCES services(id),
      branch_id uuid REFERENCES branches(id),
      ticket_number integer,
      status text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      notified_at timestamptz,
      served_at timestamptz,
      canceled_at timestamptz
    );
  `);

  await pool.query(`ALTER TABLE queue ADD COLUMN IF NOT EXISTS ticket_number integer;`);
  await pool.query(`ALTER TABLE queue ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);`);
  await pool.query('CREATE SEQUENCE IF NOT EXISTS queue_ticket_seq;');
  await pool.query('CREATE INDEX IF NOT EXISTS queue_branch_created_idx ON queue (branch_id, created_at);');

  await pool.query('CREATE INDEX IF NOT EXISTS queue_created_at_idx ON queue (created_at);');

  const result = await pool.query('SELECT COUNT(*) FROM services');
  const count = Number(result.rows[0]?.count || 0);
  if (count === 0) {
    for (const service of DEFAULT_SERVICES) {
      await pool.query(
        'INSERT INTO services (id, name, avg_minutes) VALUES ($1, $2, $3)',
        [crypto.randomUUID(), service.name, service.avgMinutes]
      );
    }
  }

  const defaultBranchId = await ensureDefaultBranch();
  await pool.query('UPDATE queue SET branch_id = $1 WHERE branch_id IS NULL', [defaultBranchId]);
}

async function getDefaultServiceId() {
  const result = await pool.query('SELECT id FROM services ORDER BY created_at LIMIT 1');
  if (result.rowCount) {
    return result.rows[0].id;
  }

  const fallback = DEFAULT_SERVICES[0] || { name: 'Standard', avgMinutes: 10 };
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO services (id, name, avg_minutes) VALUES ($1, $2, $3)',
    [id, fallback.name, fallback.avgMinutes]
  );
  return id;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth', requirePin, (req, res) => {
  res.json({ ok: true });
});

app.get('/api/branches', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, code FROM branches ORDER BY created_at');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/branches', requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Invalid branch payload.' });
    }

    const id = crypto.randomUUID();
    let code = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateBranchCode();
      const exists = await pool.query('SELECT 1 FROM branches WHERE code = $1', [candidate]);
      if (!exists.rowCount) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return res.status(500).json({ error: 'Failed to allocate branch code.' });
    }

    await pool.query(
      'INSERT INTO branches (id, name, code, next_ticket) VALUES ($1, $2, $3, 0)',
      [id, name, code]
    );

    broadcast({ type: 'data.updated' });
    res.status(201).json({ id, name, code });
  } catch (error) {
    next(error);
  }
});

app.get('/api/services', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, avg_minutes FROM services ORDER BY name');
    res.json(result.rows.map(mapService));
  } catch (error) {
    next(error);
  }
});

app.post('/api/services', requirePin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const avgMinutes = Number(req.body.avgMinutes);

    if (!name || !Number.isFinite(avgMinutes) || avgMinutes <= 0) {
      return res.status(400).json({ error: 'Invalid service payload.' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO services (id, name, avg_minutes) VALUES ($1, $2, $3)',
      [id, name, Math.round(avgMinutes)]
    );

    broadcast({ type: 'data.updated' });
    res.status(201).json({ id, name, avgMinutes: Math.round(avgMinutes) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/services/:id', requirePin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const avgMinutes = Number(req.body.avgMinutes);

    if (!name || !Number.isFinite(avgMinutes) || avgMinutes <= 0) {
      return res.status(400).json({ error: 'Invalid service payload.' });
    }

    const id = req.params.id;
    const result = await pool.query(
      'UPDATE services SET name = $1, avg_minutes = $2 WHERE id = $3 RETURNING id, name, avg_minutes',
      [name, Math.round(avgMinutes), id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    broadcast({ type: 'data.updated' });
    res.json(mapService(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/services/:id', requirePin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const active = await pool.query(
      'SELECT COUNT(*) FROM queue WHERE service_id = $1',
      [id]
    );

    if (Number(active.rows[0]?.count || 0) > 0) {
      return res.status(409).json({ error: 'Service is still used by queue history.' });
    }

    const result = await pool.query('DELETE FROM services WHERE id = $1', [id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    broadcast({ type: 'data.updated' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/queue', async (req, res, next) => {
  try {
    const branchIdParam = String(req.query.branchId || '').trim();
    const branchCodeParam = String(req.query.branch || '').trim();
    let branch = null;

    if (branchIdParam) {
      branch = await getBranchById(branchIdParam);
    } else if (branchCodeParam) {
      branch = await getBranchByCode(branchCodeParam);
    } else {
      const defaultBranchId = await ensureDefaultBranch();
      branch = await getBranchById(defaultBranchId);
    }

    if (!branch) {
      return res.status(400).json({ error: 'Branch not found.' });
    }

    const result = await pool.query(
      'SELECT id, name, phone, service_id, branch_id, ticket_number, status, created_at, notified_at, served_at, canceled_at FROM queue WHERE branch_id = $1 ORDER BY created_at',
      [branch.id]
    );
    res.json(result.rows.map(mapQueue));
  } catch (error) {
    next(error);
  }
});

app.post('/api/checkin', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    let serviceId = String(req.body.serviceId || '').trim();
    const branchCode = String(req.body.branchCode || '').trim();
    const branchIdBody = String(req.body.branchId || '').trim();

    if (!name || !phone) {
      return res.status(400).json({ error: 'Invalid check-in payload.' });
    }

    if (serviceId) {
      const serviceCheck = await pool.query('SELECT id FROM services WHERE id = $1', [serviceId]);
      if (!serviceCheck.rowCount) {
        return res.status(400).json({ error: 'Service not found.' });
      }
    } else {
      serviceId = await getDefaultServiceId();
    }

    let branch = null;
    if (branchIdBody) {
      branch = await getBranchById(branchIdBody);
    } else if (branchCode) {
      branch = await getBranchByCode(branchCode);
    } else {
      const defaultBranchId = await ensureDefaultBranch();
      branch = await getBranchById(defaultBranchId);
    }

    if (!branch) {
      return res.status(400).json({ error: 'Branch not found.' });
    }

    const id = crypto.randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const counterResult = await client.query(
        'UPDATE branches SET next_ticket = next_ticket + 1 WHERE id = $1 RETURNING next_ticket',
        [branch.id]
      );
      const ticketNumber = Number(counterResult.rows[0]?.next_ticket || 0);

      const result = await client.query(
        `INSERT INTO queue (id, name, phone, service_id, branch_id, ticket_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting')
         RETURNING id, name, phone, service_id, branch_id, ticket_number, status, created_at, notified_at, served_at, canceled_at`,
        [id, name, phone, serviceId, branch.id, ticketNumber]
      );

      await client.query('COMMIT');
      broadcast({ type: 'data.updated' });
      res.status(201).json(mapQueue(result.rows[0]));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

app.post('/api/queue/:id/status', requirePin, async (req, res, next) => {
  try {
    const allowed = new Set(['waiting', 'notified', 'served', 'canceled']);
    const status = String(req.body.status || '').trim();

    if (!allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const timestamp = new Date().toISOString();
    let column = null;
    if (status === 'notified') column = 'notified_at';
    if (status === 'served') column = 'served_at';
    if (status === 'canceled') column = 'canceled_at';

    const result = await pool.query(
      `UPDATE queue
       SET status = $1,
           notified_at = CASE WHEN $2 = 'notified' THEN $3 ELSE notified_at END,
           served_at = CASE WHEN $2 = 'served' THEN $3 ELSE served_at END,
           canceled_at = CASE WHEN $2 = 'canceled' THEN $3 ELSE canceled_at END
       WHERE id = $4
       RETURNING id, name, phone, service_id, ticket_number, status, created_at, notified_at, served_at, canceled_at`,
      [status, status, timestamp, req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Queue entry not found.' });
    }

    broadcast({ type: 'data.updated' });
    res.json(mapQueue(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Server error.' });
});

let wss = null;

function broadcast(message) {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Q System server running on port ${PORT}.`);
    });

    wss = new WebSocketServer({ server, path: '/ws' });
  })
  .catch((error) => {
    console.error('Failed to initialize database.', error);
    process.exit(1);
  });
