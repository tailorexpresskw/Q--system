'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Exercise the real route with a database double; no production database is used.
function setup({ existing = null, insertFails = false } = {}) {
  let handler;
  let released = false;
  const statements = [];
  const entry = {
    id: 'ticket-id', name: 'Alex Johnson', phone: null, branch_id: 'branch-id',
    ticket_number: 1, status: 'waiting', created_at: new Date()
  };
  const client = {
    async query(sql, values) {
      statements.push({ sql, values });
      if (sql.includes('AS retry_at')) {
        return { rowCount: existing ? 1 : 0, rows: existing ? [existing] : [] };
      }
      if (sql.includes('UPDATE branches')) return { rows: [{ next_ticket: 1 }] };
      if (sql.includes('INSERT INTO queue')) {
        if (insertFails) throw new Error('Database unavailable');
        return { rows: [{ ...entry, name: values[1], phone: values[2] }] };
      }
      return { rows: [] };
    },
    release() { released = true; }
  };
  const pool = {
    query(sql) {
      // Hold startup so tests exercise only the check-in route.
      if (sql.includes('CREATE TABLE')) return new Promise(() => {});
      if (sql.includes('FROM services')) return Promise.resolve({ rowCount: 1, rows: [{ id: 'service-id' }] });
      if (sql.includes('FROM branches')) return Promise.resolve({ rowCount: 1, rows: [{ id: 'branch-id' }] });
      throw new Error(`Unexpected pool query: ${sql}`);
    },
    async connect() { return client; }
  };
  const app = { use() {}, get() {}, put() {}, delete() {}, post(route, ...handlers) {
    if (route === '/api/checkin') handler = handlers.at(-1);
  } };
  const express = Object.assign(() => app, { json() {}, static() {} });
  const filename = path.join(__dirname, '..', 'server.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require(id) {
      if (id === 'express') return express;
      if (id === 'pg') return { Pool: function () { return pool; } };
      return require(id);
    },
    __dirname: path.dirname(filename), console, URL,
    process: { env: { DATABASE_URL: 'postgresql://localhost/test' } }
  }, { filename });

  async function submit(body) {
    const response = { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; },
      set(key, value) { this.headers[key] = value; }, json(payload) { this.body = payload; return this; } };
    let failure;
    await handler({ body }, response, (error) => { failure = error; });
    return { response, failure };
  }
  return { submit, statements, entry, released: () => released };
}

test('API rejects missing, blank, and non-string customer names before touching the counter', async () => {
  for (const name of [undefined, null, '', ' \t\n ', 123, {}]) {
    const fixture = setup();
    const { response, failure } = await fixture.submit({ name });
    assert.equal(failure, undefined);
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.code, 'NAME_REQUIRED');
    assert.equal(fixture.statements.length, 0);
  }
});

test('new appointment locks the branch, checks duplicates, then increments and commits', async () => {
  const fixture = setup();
  const { response, failure } = await fixture.submit({ name: ' Alex   Johnson ', phone: '+٩٦٥ ۱۲۳۴-٥٦٧٨', branchId: 'branch-id' });
  assert.equal(failure, undefined);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.name, 'Alex Johnson');
  assert.equal(response.body.ticketNumber, 1);
  assert.equal(new Date(response.body.retryAt) - new Date(response.body.createdAt), 30 * 60000);
  const sql = fixture.statements.map((statement) => statement.sql);
  assert.equal(sql[0], 'BEGIN');
  assert.match(sql[1], /SELECT id FROM branches WHERE id = \$1 FOR UPDATE/);
  assert.match(sql[2], /AS retry_at/);
  assert.equal(fixture.statements[2].values[2], '96512345678');
  assert.equal(fixture.statements[2].values[3], 30);
  assert.match(sql[3], /UPDATE branches/);
  assert.match(sql[4], /INSERT INTO queue/);
  assert.equal(sql[5], 'COMMIT');
  assert.equal(fixture.released(), true);
});

test('duplicate returns the original ticket and retry time without incrementing the count', async () => {
  const existing = {
    id: 'existing-id', name: 'Alex Johnson', branch_id: 'branch-id', ticket_number: 7,
    created_at: new Date(Date.now() - 60000), retry_at: new Date(Date.now() + 29 * 60000)
  };
  const fixture = setup({ existing });
  const { response, failure } = await fixture.submit({ name: 'alex johnson', branchId: 'branch-id' });
  assert.equal(failure, undefined);
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.code, 'DUPLICATE_CHECKIN');
  assert.equal(response.body.entry.id, 'existing-id');
  assert.equal(response.body.entry.ticketNumber, 7);
  assert.equal(response.body.retryAt, existing.retry_at);
  assert.ok(Number(response.headers['Retry-After']) > 0);
  assert.equal(fixture.statements.at(-1).sql, 'ROLLBACK');
  assert.equal(fixture.statements.some(({ sql }) => /UPDATE branches|INSERT INTO queue/.test(sql)), false);
  assert.equal(fixture.released(), true);
});

test('failed insert rolls back the counter change and releases the connection', async () => {
  const fixture = setup({ insertFails: true });
  const { failure } = await fixture.submit({ name: 'Alex Johnson', branchId: 'branch-id' });
  assert.match(failure.message, /Database unavailable/);
  assert.equal(fixture.statements.at(-1).sql, 'ROLLBACK');
  assert.equal(fixture.statements.some(({ sql }) => sql === 'COMMIT'), false);
  assert.equal(fixture.released(), true);
});
