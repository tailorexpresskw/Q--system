'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function setup(savedStorage = new Map()) {
  const buttons = [{ disabled: false }, { disabled: false }];
  const name = { value: 'Alex Johnson', setCustomValidity(value) { this.validationMessage = value; } };
  const phone = { value: '' };
  const feedback = {};
  const form = { dataset: {}, querySelectorAll: () => buttons, setAttribute() {}, reportValidity: () => !name.validationMessage };
  const elements = { checkinForm: form, checkinName: name, checkinPhone: phone, checkinFeedback: feedback };
  const storage = {
    getItem: (key) => savedStorage.get(key) || null,
    setItem: (key, value) => savedStorage.set(key, value),
    removeItem: (key) => savedStorage.delete(key)
  };
  const filename = path.join(__dirname, '..', 'public', 'app.js');
  // Bind the real functions to a small DOM double without starting polling/network initialization.
  const context = vm.createContext({
    document: { getElementById: (id) => elements[id] || null, querySelector: () => null, body: { dataset: {} } },
    window: { location: { search: '?checkin=1' } }, localStorage: storage,
    URLSearchParams, Headers, console: { warn() {} }, Date
  });
  vm.runInContext(fs.readFileSync(filename, 'utf8').replace(/^init\(\);$/m, ''), context, { filename });
  vm.runInContext(`
    currentBranch = { id: 'branch-id', code: 'main' };
    refreshData = async () => {};
    persistTicket = () => {};
    showCheckinStatus = () => {};
  `, context);
  return { context, buttons, name, phone, feedback, savedStorage,
    run(code) { return vm.runInContext(code, context); },
    submit() { return vm.runInContext('handleCheckinSubmit({ preventDefault() {} })', context); }
  };
}

test('both booking actions use native required-name validation', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert.match(html, /<input id="checkinName"[^>]*\brequired\b/);
  assert.match(html, /<button[^>]*type="submit"[^>]*id="quickCheckin"/);
});

test('whitespace-only name is rejected before sending a request', async () => {
  const fixture = setup();
  fixture.name.value = '   ';
  fixture.run('createCheckin = () => { throw new Error("Must not send"); }');
  await fixture.submit();
  assert.match(fixture.name.validationMessage, /full name/);
});

test('rapid submissions send one request and both buttons stay disabled during refresh', async () => {
  const fixture = setup();
  let resolveRequest;
  let finishRefresh;
  let calls = 0;
  fixture.context.createCheckin = () => {
    calls++;
    return new Promise((resolve) => { resolveRequest = resolve; });
  };
  fixture.context.refreshData = () => new Promise((resolve) => { finishRefresh = resolve; });
  const first = fixture.submit();
  await fixture.submit();
  assert.equal(calls, 1);
  assert.ok(fixture.buttons.every((button) => button.disabled));
  assert.equal(fixture.name.readOnly, true);
  resolveRequest({ id: 'entry-id', branchId: 'branch-id', retryAt: new Date(Date.now() + 30 * 60000).toISOString() });
  await new Promise((resolve) => setImmediate(resolve));
  fixture.run('updateCheckinControls()');
  assert.ok(fixture.buttons.every((button) => button.disabled));
  finishRefresh();
  await first;
  assert.ok(fixture.buttons.every((button) => button.disabled));
  assert.equal(fixture.name.readOnly, false);
  assert.match(fixture.feedback.textContent, /already booked/);
});

test('network failure re-enables both buttons and provides a retry message', async () => {
  const fixture = setup();
  fixture.context.createCheckin = async () => { throw new Error('Network error'); };
  await fixture.submit();
  assert.ok(fixture.buttons.every((button) => !button.disabled));
  assert.match(fixture.feedback.textContent, /try again/);
});

test('API duplicate restores the existing ticket and its cooldown', async () => {
  const fixture = setup();
  let restored;
  fixture.context.persistTicket = (entry) => { restored = entry.id; };
  fixture.context.createCheckin = async () => {
    throw Object.assign(new Error('Duplicate'), { payload: {
      code: 'DUPLICATE_CHECKIN', entry: { id: 'original-ticket', branchId: 'branch-id' },
      retryAt: new Date(Date.now() + 20 * 60000).toISOString()
    } });
  };
  await fixture.submit();
  assert.equal(restored, 'original-ticket');
  assert.ok(fixture.buttons.every((button) => button.disabled));
  assert.match(fixture.feedback.textContent, /20/);
});

test('cooldown survives reload, normalizes names and phones, and permits other customers', () => {
  const fixture = setup();
  fixture.phone.value = '+٩٦٥ ۱۲۳۴-٥٦٧٨';
  fixture.run(`rememberCheckin({ id: 'entry-id', branchId: 'branch-id' },
    new Date(Date.now() + 30 * 60000).toISOString(), checkinIdentity(dom.checkinName.value, dom.checkinPhone.value))`);
  const reloaded = setup(fixture.savedStorage);
  reloaded.name.value = ' ALEX   JOHNSON ';
  reloaded.run('updateCheckinControls()');
  assert.ok(reloaded.buttons.every((button) => button.disabled));
  reloaded.name.value = 'Another Customer';
  reloaded.phone.value = '96512345678';
  reloaded.run('updateCheckinControls()');
  assert.ok(reloaded.buttons.every((button) => button.disabled));
  reloaded.phone.value = '';
  reloaded.run('updateCheckinControls()');
  assert.ok(reloaded.buttons.every((button) => !button.disabled));
});

test('booking becomes available when the 30-minute cooldown expires', () => {
  const fixture = setup();
  fixture.run(`rememberCheckin({ id: 'entry-id', branchId: 'branch-id' },
    new Date(Date.now() - 1).toISOString(), checkinIdentity(dom.checkinName.value, ''));
    updateCheckinControls();`);
  assert.ok(fixture.buttons.every((button) => !button.disabled));
  assert.equal(fixture.feedback.textContent, '');
});

test('Arabic feedback explains the cooldown', () => {
  const fixture = setup();
  fixture.run(`currentLang = 'ar'; currentLocale = 'ar';
    rememberCheckin({ id: 'entry-id', branchId: 'branch-id' },
      new Date(Date.now() + 30 * 60000).toISOString(), checkinIdentity(dom.checkinName.value, ''));
    updateCheckinControls();`);
  assert.match(fixture.feedback.textContent, /تم حجز موعدك بالفعل/);
});

test('API errors retain duplicate details for the booking form', async () => {
  const fixture = setup();
  fixture.context.fetch = async () => ({ ok: false, status: 409,
    json: async () => ({ error: 'Already booked', code: 'DUPLICATE_CHECKIN', retryAt: 'retry-time' }) });
  await assert.rejects(fixture.run("apiFetch('/checkin', { method: 'POST', body: '{}' })"), (error) => {
    assert.equal(error.payload.code, 'DUPLICATE_CHECKIN');
    assert.equal(error.payload.retryAt, 'retry-time');
    return true;
  });
});
