'use strict';

const API_BASE = '/api';
const LOCAL_KEYS = {
  staffPin: 'qsys.staffPin'
};

const dom = {
  metricActive: document.getElementById('metricActive'),
  metricTotalWait: document.getElementById('metricTotalWait'),
  metricAvgService: document.getElementById('metricAvgService'),
  metricLastCheckin: document.getElementById('metricLastCheckin'),
  nowServing: document.getElementById('nowServing'),
  nextUp: document.getElementById('nextUp'),
  projectedFinish: document.getElementById('projectedFinish'),
  queueTableBody: document.querySelector('#queueTable tbody'),
  checkinLink: document.getElementById('checkinLink'),
  qrImage: document.getElementById('qrImage'),
  servicesList: document.getElementById('servicesList'),
  checkinForm: document.getElementById('checkinForm'),
  checkinName: document.getElementById('checkinName'),
  checkinPhone: document.getElementById('checkinPhone'),
  checkinService: document.getElementById('checkinService'),
  checkinStatus: document.getElementById('checkinStatus'),
  copyCheckin: document.getElementById('copyCheckin'),
  copyCheckinHeader: document.getElementById('copyCheckinHeader'),
  refreshQueue: document.getElementById('refreshQueue'),
  exportCsv: document.getElementById('exportCsv'),
  addService: document.getElementById('addService'),
  staffPinInput: document.getElementById('staffPinInput'),
  saveStaffPin: document.getElementById('saveStaffPin'),
  staffPinStatus: document.getElementById('staffPinStatus')
};

let services = [];
let queue = [];
let socket = null;
let refreshTimer = null;

const isCheckinView = new URLSearchParams(window.location.search).get('checkin') === '1';
document.body.dataset.view = isCheckinView ? 'checkin' : 'dashboard';

init();

async function init() {
  bindEvents();
  loadStaffPin();
  setShareableLink();
  await refreshData();
  connectSocket();
  startPolling();
}

function bindEvents() {
  if (dom.checkinForm) {
    dom.checkinForm.addEventListener('submit', handleCheckinSubmit);
  }

  if (dom.copyCheckin) {
    dom.copyCheckin.addEventListener('click', () => copyCheckinLink(dom.copyCheckin));
  }

  if (dom.copyCheckinHeader) {
    dom.copyCheckinHeader.addEventListener('click', () => copyCheckinLink(dom.copyCheckinHeader));
  }

  if (dom.refreshQueue) {
    dom.refreshQueue.addEventListener('click', () => refreshData());
  }

  if (dom.exportCsv) {
    dom.exportCsv.addEventListener('click', exportToCsv);
  }

  if (dom.addService) {
    dom.addService.addEventListener('click', addServiceRow);
  }

  if (dom.saveStaffPin) {
    dom.saveStaffPin.addEventListener('click', () => {
      const pin = dom.staffPinInput ? dom.staffPinInput.value.trim() : '';
      if (!pin) {
        clearStaffPin();
        updatePinStatus('PIN cleared. Enter the staff PIN to unlock actions.');
        return;
      }
      setStaffPin(pin);
      updatePinStatus('PIN saved for this device.');
    });
  }
}

function loadStaffPin() {
  const pin = getStaffPin();
  if (dom.staffPinInput) {
    dom.staffPinInput.value = pin;
  }
  updatePinStatus(pin ? 'PIN saved for this device.' : 'Enter the staff PIN to unlock actions.');
}

function startPolling() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    refreshData();
  }, 20000);
}

async function refreshData() {
  try {
    const [servicesData, queueData] = await Promise.all([fetchServices(), fetchQueue()]);
    services = servicesData;
    queue = queueData;
    renderAll();
  } catch (error) {
    console.warn('Failed to refresh data.', error);
  }
}

async function fetchServices() {
  const response = await fetch(`${API_BASE}/services`);
  if (!response.ok) {
    throw new Error('Failed to load services.');
  }
  return response.json();
}

async function fetchQueue() {
  const response = await fetch(`${API_BASE}/queue`);
  if (!response.ok) {
    throw new Error('Failed to load queue.');
  }
  return response.json();
}

function renderAll() {
  renderDashboard();
  renderServices();
  renderCheckinServices();
}

function renderDashboard() {
  if (!dom.queueTableBody) return;

  const activeQueue = getActiveQueue();
  const orderedQueue = sortByTime(activeQueue);
  const totalWait = orderedQueue.reduce((sum, entry) => sum + getServiceMinutes(entry.serviceId), 0);
  const avgService = services.length
    ? Math.round(services.reduce((sum, service) => sum + getServiceMinutes(service.id), 0) / services.length)
    : 0;
  const lastCheckin = queue
    .map((entry) => entry.createdAt)
    .sort()
    .pop();

  dom.metricActive.textContent = String(orderedQueue.length);
  dom.metricTotalWait.textContent = `${totalWait} min`;
  dom.metricAvgService.textContent = `${avgService} min`;
  dom.metricLastCheckin.textContent = lastCheckin ? formatTime(lastCheckin) : '—';

  const nowEntry = orderedQueue[0];
  const nextEntry = orderedQueue[1];
  dom.nowServing.textContent = nowEntry ? `${nowEntry.name} · ${getServiceName(nowEntry.serviceId)}` : '—';
  dom.nextUp.textContent = nextEntry ? `${nextEntry.name} · ${getServiceName(nextEntry.serviceId)}` : '—';
  dom.projectedFinish.textContent = totalWait ? formatEtaTime(totalWait) : '—';

  dom.queueTableBody.innerHTML = '';

  if (!orderedQueue.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'No active check-ins yet.';
    cell.className = 'muted';
    row.appendChild(cell);
    dom.queueTableBody.appendChild(row);
    return;
  }

  let runningMinutes = 0;
  orderedQueue.forEach((entry, index) => {
    const waitMinutes = Math.max(0, Math.round((Date.now() - new Date(entry.createdAt).getTime()) / 60000));
    const etaMinutes = runningMinutes;
    runningMinutes += getServiceMinutes(entry.serviceId);

    const row = document.createElement('tr');

    row.appendChild(createCell(String(index + 1)));
    row.appendChild(createCell(entry.name || 'Guest'));
    row.appendChild(createCell(entry.phone || '—'));
    row.appendChild(createCell(getServiceName(entry.serviceId)));

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `status-badge status-${entry.status}`;
    badge.textContent = entry.status;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    row.appendChild(createCell(`${waitMinutes} min`));
    row.appendChild(createCell(etaMinutes ? `${etaMinutes} min (${formatEtaTime(etaMinutes)})` : 'Now'));

    const actionsCell = document.createElement('td');
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'row-actions';

    const notifyBtn = createActionButton('Notify', 'ghost');
    notifyBtn.disabled = entry.status === 'notified';
    notifyBtn.addEventListener('click', () => updateStatus(entry.id, 'notified'));

    const serveBtn = createActionButton('Serve', 'primary');
    serveBtn.addEventListener('click', () => updateStatus(entry.id, 'served'));

    const cancelBtn = createActionButton('Cancel', 'danger');
    cancelBtn.addEventListener('click', () => updateStatus(entry.id, 'canceled'));

    actionsWrap.appendChild(notifyBtn);
    actionsWrap.appendChild(serveBtn);
    actionsWrap.appendChild(cancelBtn);
    actionsCell.appendChild(actionsWrap);
    row.appendChild(actionsCell);

    dom.queueTableBody.appendChild(row);
  });
}

function renderServices() {
  if (!dom.servicesList) return;

  dom.servicesList.innerHTML = '';

  if (!services.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No services yet. Add one to begin.';
    dom.servicesList.appendChild(empty);
    return;
  }

  services.forEach((service) => {
    const row = document.createElement('div');
    row.className = 'service-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = service.name;

    const avgInput = document.createElement('input');
    avgInput.type = 'number';
    avgInput.min = '1';
    avgInput.value = String(service.avgMinutes);

    const updateServiceData = async () => {
      const name = nameInput.value.trim() || 'Service';
      const value = Number(avgInput.value);
      const avgMinutes = Number.isFinite(value) && value > 0 ? Math.round(value) : 10;
      avgInput.value = String(avgMinutes);
      await updateService(service.id, { name, avgMinutes });
      await refreshData();
    };

    nameInput.addEventListener('change', () => {
      updateServiceData();
    });

    avgInput.addEventListener('change', () => {
      updateServiceData();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn danger';
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeService(service.id));

    row.appendChild(nameInput);
    row.appendChild(avgInput);
    row.appendChild(removeBtn);

    dom.servicesList.appendChild(row);
  });
}

function renderCheckinServices() {
  if (!dom.checkinService) return;

  dom.checkinService.innerHTML = '';

  if (!services.length) {
    const option = new Option('No services available', '');
    option.disabled = true;
    option.selected = true;
    dom.checkinService.appendChild(option);
    toggleCheckinSubmit(false);
    return;
  }

  services.forEach((service) => {
    const option = new Option(`${service.name} (${service.avgMinutes} min)`, service.id);
    dom.checkinService.appendChild(option);
  });

  toggleCheckinSubmit(true);
}

function toggleCheckinSubmit(enabled) {
  if (!dom.checkinForm) return;
  const button = dom.checkinForm.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = !enabled;
  }
}

async function addServiceRow() {
  await createService({ name: 'New service', avgMinutes: 15 });
  await refreshData();
}

async function removeService(serviceId) {
  const usedInQueue = queue.some((entry) => entry.serviceId === serviceId && !['served', 'canceled'].includes(entry.status));
  if (usedInQueue && !window.confirm('This service is used in the active queue. Remove it anyway?')) {
    return;
  }

  await deleteService(serviceId);
  await refreshData();
}

async function handleCheckinSubmit(event) {
  event.preventDefault();

  const name = dom.checkinName.value.trim();
  const phone = dom.checkinPhone.value.trim();
  const serviceId = dom.checkinService.value;

  if (!name || !phone || !serviceId) return;

  const entry = await createCheckin({ name, phone, serviceId });
  await refreshData();

  dom.checkinForm.reset();
  showCheckinStatus(entry.id);
}

function showCheckinStatus(entryId) {
  const orderedQueue = sortByTime(getActiveQueue());
  const positionIndex = orderedQueue.findIndex((item) => item.id === entryId);
  if (positionIndex === -1) {
    dom.checkinStatus.innerHTML = 'Checked in successfully. Your spot will update shortly.';
    dom.checkinStatus.classList.add('active');
    return;
  }

  const position = positionIndex + 1;
  const etaMinutes = calculateEtaForEntry(entryId, orderedQueue);
  const etaText = etaMinutes === 0 ? 'Now' : `~${etaMinutes} min (around ${formatEtaTime(etaMinutes)})`;

  dom.checkinStatus.innerHTML = `Checked in successfully. Position ${position}. ETA: ${etaText}.`;
  dom.checkinStatus.classList.add('active');
}

async function updateStatus(entryId, status) {
  await updateQueueStatus(entryId, status);
  await refreshData();
}

function getActiveQueue() {
  return queue.filter((entry) => !['served', 'canceled'].includes(entry.status));
}

function sortByTime(list) {
  return [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getServiceMinutes(serviceId) {
  const service = services.find((item) => item.id === serviceId);
  const minutes = service ? Number(service.avgMinutes) : 10;
  return Number.isFinite(minutes) ? minutes : 10;
}

function getServiceName(serviceId) {
  const service = services.find((item) => item.id === serviceId);
  return service ? service.name : 'Service';
}

function calculateEtaForEntry(entryId, orderedQueue) {
  let running = 0;
  for (const entry of orderedQueue) {
    if (entry.id === entryId) return running;
    running += getServiceMinutes(entry.serviceId);
  }
  return 0;
}

function setShareableLink() {
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const checkinUrl = `${baseUrl}?checkin=1`;

  if (dom.checkinLink) {
    dom.checkinLink.value = checkinUrl;
  }

  if (dom.qrImage) {
    dom.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkinUrl)}`;
  }
}

async function copyCheckinLink(button) {
  const link = dom.checkinLink ? dom.checkinLink.value : '';
  if (!link) return;

  try {
    if (navigator.clipboard && window.location.protocol !== 'file:') {
      await navigator.clipboard.writeText(link);
    } else {
      dom.checkinLink.select();
      document.execCommand('copy');
    }
    flashButton(button, 'Copied');
  } catch (error) {
    console.warn('Copy failed.', error);
    flashButton(button, 'Copy failed');
  }
}

function flashButton(button, label) {
  if (!button) return;
  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function exportToCsv() {
  if (!queue.length) return;

  const headers = [
    'id',
    'name',
    'phone',
    'service',
    'status',
    'created_at',
    'notified_at',
    'served_at',
    'canceled_at'
  ];

  const rows = queue.map((entry) => [
    entry.id,
    entry.name,
    entry.phone,
    getServiceName(entry.serviceId),
    entry.status,
    entry.createdAt,
    entry.notifiedAt || '',
    entry.servedAt || '',
    entry.canceledAt || ''
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `q-system-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function createActionButton(label, variant) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn ${variant}`;
  button.textContent = label;
  return button;
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatEtaTime(minutes) {
  const date = new Date(Date.now() + minutes * 60000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function createCheckin(payload) {
  return apiFetch('/checkin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function createService(payload) {
  return apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresPin: true
  });
}

async function updateService(serviceId, payload) {
  return apiFetch(`/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    requiresPin: true
  });
}

async function deleteService(serviceId) {
  return apiFetch(`/services/${serviceId}`, {
    method: 'DELETE',
    requiresPin: true
  });
}

async function updateQueueStatus(entryId, status) {
  return apiFetch(`/queue/${entryId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
    requiresPin: true
  });
}

async function apiFetch(path, options = {}) {
  const { requiresPin, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresPin) {
    const pin = ensureStaffPin();
    if (!pin) {
      throw new Error('Staff PIN required.');
    }
    headers.set('x-qsys-pin', pin);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(payload.error || 'Request failed.');
  }

  if (response.status === 204) return null;
  return response.json();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

function getStaffPin() {
  return localStorage.getItem(LOCAL_KEYS.staffPin) || '';
}

function setStaffPin(pin) {
  localStorage.setItem(LOCAL_KEYS.staffPin, pin);
}

function clearStaffPin() {
  localStorage.removeItem(LOCAL_KEYS.staffPin);
  if (dom.staffPinInput) {
    dom.staffPinInput.value = '';
  }
}

function ensureStaffPin() {
  let pin = getStaffPin();
  if (!pin) {
    pin = window.prompt('Enter staff PIN');
    if (!pin) return '';
    setStaffPin(pin.trim());
    updatePinStatus('PIN saved for this device.');
  }
  return pin;
}

function updatePinStatus(message) {
  if (dom.staffPinStatus) {
    dom.staffPinStatus.textContent = message;
  }
}

function handleUnauthorized() {
  clearStaffPin();
  updatePinStatus('Invalid PIN. Please re-enter.');
}

function connectSocket() {
  if (!window.location.host) return;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const socketUrl = `${protocol}://${window.location.host}/ws`;

  socket = new WebSocket(socketUrl);

  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'data.updated') {
        refreshData();
      }
    } catch (error) {
      console.warn('Failed to parse socket message.', error);
    }
  });

  socket.addEventListener('close', () => {
    setTimeout(() => connectSocket(), 2000);
  });
}
