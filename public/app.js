'use strict';

const API_BASE = '/api';
const LOCAL_KEYS = {
  staffPin: 'qsys.staffPin',
  lang: 'qsys.lang',
  staffUnlocked: 'qsys.staffUnlocked'
};

const SUPPORTED_LANGS = ['en', 'ar'];
const LANG_META = {
  en: { locale: 'en-US', dir: 'ltr' },
  ar: { locale: 'ar', dir: 'rtl' }
};

const translations = {
  en: {
    'app.title': 'Q System',
    'brand.subtitle': 'Live queue control with realtime sync.',
    'header.copyCheckin': 'Copy check-in link',
    'header.openCheckin': 'Open check-in',
    'language.label': 'Language',
    'language.english': 'English',
    'language.arabic': 'Arabic',
    'metrics.active': 'Active in queue',
    'metrics.totalWait': 'Estimated total wait',
    'metrics.avgService': 'Average service time',
    'metrics.lastCheckin': 'Last check-in',
    'queue.title': 'Live Queue',
    'queue.subtitle': 'ETAs are driven by service averages and queue order.',
    'queue.refresh': 'Refresh',
    'queue.exportCsv': 'Export CSV',
    'queue.nowServing': 'Now serving',
    'queue.nextUp': 'Next up',
    'queue.projectedFinish': 'Projected finish',
    'queue.ticketLabel': 'Q-{number}',
    'queue.empty': 'No active check-ins yet.',
    'queue.guest': 'Guest',
    'queue.waitMinutes': '{minutes} min',
    'queue.etaMinutes': '{minutes} min ({time})',
    'queue.etaNow': 'Now',
    'table.number': 'Ticket',
    'table.name': 'Name',
    'table.phone': 'Phone',
    'table.service': 'Service',
    'table.status': 'Status',
    'table.wait': 'Wait',
    'table.eta': 'ETA',
    'table.actions': 'Actions',
    'share.title': 'Public Check-In',
    'share.subtitle': 'Share this link or QR code to accept arrivals.',
    'share.copy': 'Copy link',
    'share.qrAlt': 'QR code for check-in link',
    'share.qrNote': 'QR code generated from the current check-in URL.',
    'share.dataNote': 'Data is synced via the backend database.',
    'pin.title': 'Staff PIN',
    'pin.subtitle': 'Required for staff actions like notify, serve, cancel, and service edits.',
    'pin.placeholder': 'Enter PIN',
    'pin.save': 'Save',
    'pin.status.empty': 'Enter the staff PIN to unlock actions.',
    'pin.status.saved': 'PIN saved for this device.',
    'pin.status.cleared': 'PIN cleared. Enter the staff PIN to unlock actions.',
    'pin.status.invalid': 'Invalid PIN. Please re-enter.',
    'services.title': 'Services',
    'services.subtitle': 'Average service time (minutes) drives ETA math.',
    'services.add': 'Add service',
    'services.empty': 'No services yet. Add one to begin.',
    'service.new': 'New service',
    'service.default': 'Service',
    'service.remove': 'Remove',
    'checkin.chip': 'Public check-in',
    'checkin.title': 'Join the queue',
    'checkin.subtitle': 'Enter your details to reserve your spot.',
    'checkin.nameLabel': 'Full name',
    'checkin.namePlaceholder': 'Alex Johnson',
    'checkin.phoneLabel': 'Phone',
    'checkin.phonePlaceholder': '(555) 555-0199',
    'checkin.serviceLabel': 'Service',
    'checkin.submit': 'Check in',
    'checkin.status.generic': 'Checked in successfully. Your spot will update shortly.',
    'checkin.status.position': 'Checked in. Your number: {ticket}. Position {position}. ETA: {etaText}.',
    'checkin.eta.now': 'Now',
    'checkin.eta.approx': '~{minutes} min (around {time})',
    'checkin.serviceOption': '{name} ({minutes} min)',
    'checkin.noServices': 'No services available',
    'help.title': 'How it works',
    'help.subtitle': 'Your ETA is calculated from the queue ahead of you and the service time averages.',
    'help.item1': 'Queue position updates in real time.',
    'help.item2': 'Notifications are handled by staff on the dashboard.',
    'help.item3': 'Everything stays synced across devices.',
    'help.backToStaff': 'Staff dashboard',
    'footer.left': 'Q System · Realtime queue',
    'footer.right': 'Use ?checkin=1 for the public check-in view.',
    'lock.title': 'Staff access',
    'lock.subtitle': 'Enter the password to open the dashboard.',
    'lock.placeholder': 'Enter password',
    'lock.unlock': 'Unlock',
    'lock.status.empty': 'Password is required.',
    'lock.status.invalid': 'Invalid password. Try again.',
    'lock.status.checking': 'Checking...',
    'action.notify': 'Notify',
    'action.serve': 'Serve',
    'action.cancel': 'Cancel',
    'status.waiting': 'Waiting',
    'status.notified': 'Notified',
    'status.served': 'Served',
    'status.canceled': 'Canceled',
    'copy.copied': 'Copied',
    'copy.failed': 'Copy failed',
    'confirm.removeService': 'This service is used in the active queue. Remove it anyway?',
    'prompt.staffPin': 'Enter staff PIN',
    'csv.id': 'id',
    'csv.ticket': 'ticket',
    'csv.name': 'name',
    'csv.phone': 'phone',
    'csv.service': 'service',
    'csv.status': 'status',
    'csv.created_at': 'created_at',
    'csv.notified_at': 'notified_at',
    'csv.served_at': 'served_at',
    'csv.canceled_at': 'canceled_at'
  },
  ar: {
    'app.title': 'نظام Q',
    'brand.subtitle': 'تحكم مباشر بالطابور مع مزامنة فورية.',
    'header.copyCheckin': 'نسخ رابط التسجيل',
    'header.openCheckin': 'فتح التسجيل',
    'language.label': 'اللغة',
    'language.english': 'الإنجليزية',
    'language.arabic': 'العربية',
    'metrics.active': 'النشطون في الطابور',
    'metrics.totalWait': 'إجمالي الانتظار المتوقع',
    'metrics.avgService': 'متوسط وقت الخدمة',
    'metrics.lastCheckin': 'آخر تسجيل',
    'queue.title': 'الطابور المباشر',
    'queue.subtitle': 'تُحسب الأوقات المتوقعة بناءً على متوسطات الخدمة وترتيب الطابور.',
    'queue.refresh': 'تحديث',
    'queue.exportCsv': 'تصدير CSV',
    'queue.nowServing': 'يُخدم الآن',
    'queue.nextUp': 'التالي',
    'queue.projectedFinish': 'الانتهاء المتوقع',
    'queue.ticketLabel': 'Q-{number}',
    'queue.empty': 'لا توجد تسجيلات نشطة بعد.',
    'queue.guest': 'ضيف',
    'queue.waitMinutes': '{minutes} دقيقة',
    'queue.etaMinutes': '{minutes} دقيقة ({time})',
    'queue.etaNow': 'الآن',
    'table.number': 'الرقم',
    'table.name': 'الاسم',
    'table.phone': 'الهاتف',
    'table.service': 'الخدمة',
    'table.status': 'الحالة',
    'table.wait': 'الانتظار',
    'table.eta': 'الوقت المتوقع',
    'table.actions': 'إجراءات',
    'share.title': 'تسجيل عام',
    'share.subtitle': 'شارك هذا الرابط أو رمز QR لقبول القادمين.',
    'share.copy': 'نسخ الرابط',
    'share.qrAlt': 'رمز QR لرابط التسجيل',
    'share.qrNote': 'تم إنشاء رمز QR من رابط التسجيل الحالي.',
    'share.dataNote': 'تتم المزامنة عبر قاعدة بيانات الخادم.',
    'pin.title': 'رمز الموظفين',
    'pin.subtitle': 'مطلوب لإجراءات الموظفين مثل الإشعار، الخدمة، الإلغاء، وتعديل الخدمات.',
    'pin.placeholder': 'أدخل الرمز',
    'pin.save': 'حفظ',
    'pin.status.empty': 'أدخل رمز الموظفين لفتح الإجراءات.',
    'pin.status.saved': 'تم حفظ الرمز على هذا الجهاز.',
    'pin.status.cleared': 'تم مسح الرمز. أدخل رمز الموظفين لفتح الإجراءات.',
    'pin.status.invalid': 'رمز غير صحيح. يُرجى إعادة الإدخال.',
    'services.title': 'الخدمات',
    'services.subtitle': 'متوسط وقت الخدمة (بالدقائق) يحدد حسابات الوقت المتوقع.',
    'services.add': 'إضافة خدمة',
    'services.empty': 'لا توجد خدمات بعد. أضف واحدة للبدء.',
    'service.new': 'خدمة جديدة',
    'service.default': 'خدمة',
    'service.remove': 'إزالة',
    'checkin.chip': 'تسجيل عام',
    'checkin.title': 'انضم إلى الطابور',
    'checkin.subtitle': 'أدخل بياناتك لحجز دورك.',
    'checkin.nameLabel': 'الاسم الكامل',
    'checkin.namePlaceholder': 'أحمد محمد',
    'checkin.phoneLabel': 'الهاتف',
    'checkin.phonePlaceholder': '050 000 0000',
    'checkin.serviceLabel': 'الخدمة',
    'checkin.submit': 'تسجيل',
    'checkin.status.generic': 'تم التسجيل بنجاح. سيتم تحديث دورك قريبًا.',
    'checkin.status.position': 'تم التسجيل. رقمك: {ticket}. الترتيب {position}. الوقت المتوقع: {etaText}.',
    'checkin.eta.now': 'الآن',
    'checkin.eta.approx': '~{minutes} دقيقة (حوالي {time})',
    'checkin.serviceOption': '{name} ({minutes} دقيقة)',
    'checkin.noServices': 'لا توجد خدمات متاحة',
    'help.title': 'كيف يعمل',
    'help.subtitle': 'يتم حساب وقتك المتوقع بناءً على من قبلك في الطابور ومتوسطات وقت الخدمة.',
    'help.item1': 'يتم تحديث ترتيبك في الوقت الحقيقي.',
    'help.item2': 'يتولى الموظفون الإشعارات عبر لوحة التحكم.',
    'help.item3': 'يبقى كل شيء متزامنًا عبر الأجهزة.',
    'help.backToStaff': 'لوحة الموظفين',
    'footer.left': 'نظام Q · طابور فوري',
    'footer.right': 'استخدم ?checkin=1 لعرض صفحة التسجيل العامة.',
    'lock.title': 'دخول الموظفين',
    'lock.subtitle': 'أدخل كلمة المرور لفتح لوحة التحكم.',
    'lock.placeholder': 'أدخل كلمة المرور',
    'lock.unlock': 'فتح',
    'lock.status.empty': 'كلمة المرور مطلوبة.',
    'lock.status.invalid': 'كلمة المرور غير صحيحة.',
    'lock.status.checking': 'جار التحقق...',
    'action.notify': 'إشعار',
    'action.serve': 'خدمة',
    'action.cancel': 'إلغاء',
    'status.waiting': 'بانتظار',
    'status.notified': 'تم الإشعار',
    'status.served': 'تمت الخدمة',
    'status.canceled': 'ملغي',
    'copy.copied': 'تم النسخ',
    'copy.failed': 'فشل النسخ',
    'confirm.removeService': 'هذه الخدمة مستخدمة في الطابور النشط. هل تريد إزالتها رغم ذلك؟',
    'prompt.staffPin': 'أدخل رمز الموظفين',
    'csv.id': 'المعرف',
    'csv.ticket': 'الرقم',
    'csv.name': 'الاسم',
    'csv.phone': 'الهاتف',
    'csv.service': 'الخدمة',
    'csv.status': 'الحالة',
    'csv.created_at': 'تاريخ الإنشاء',
    'csv.notified_at': 'وقت الإشعار',
    'csv.served_at': 'وقت الخدمة',
    'csv.canceled_at': 'وقت الإلغاء'
  }
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
  staffLock: document.getElementById('staffLock'),
  staffLockInput: document.getElementById('staffLockInput'),
  staffLockButton: document.getElementById('staffLockButton'),
  staffLockStatus: document.getElementById('staffLockStatus'),
  checkinForm: document.getElementById('checkinForm'),
  checkinName: document.getElementById('checkinName'),
  checkinPhone: document.getElementById('checkinPhone'),
  checkinStatus: document.getElementById('checkinStatus'),
  copyCheckin: document.getElementById('copyCheckin'),
  copyCheckinHeader: document.getElementById('copyCheckinHeader'),
  languageSelect: document.getElementById('languageSelect'),
  refreshQueue: document.getElementById('refreshQueue'),
  exportCsv: document.getElementById('exportCsv'),
  staffPinInput: document.getElementById('staffPinInput'),
  saveStaffPin: document.getElementById('saveStaffPin'),
  staffPinStatus: document.getElementById('staffPinStatus')
};

let services = [];
let queue = [];
let socket = null;
let refreshTimer = null;
let currentLang = 'en';
let currentLocale = LANG_META.en.locale;

const isCheckinView = new URLSearchParams(window.location.search).get('checkin') === '1';
document.body.dataset.view = isCheckinView ? 'checkin' : 'dashboard';

init();

async function init() {
  bindEvents();
  applyLanguage(getInitialLang());
  setupStaffLock();
  loadStaffPin();
  setShareableLink();
  await refreshData();
  connectSocket();
  startPolling();
}

function normalizeLang(value) {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('en')) return 'en';
  return '';
}

function getInitialLang() {
  const params = new URLSearchParams(window.location.search);
  const queryLang = normalizeLang(params.get('lang'));
  const storedLang = normalizeLang(localStorage.getItem(LOCAL_KEYS.lang));
  return queryLang || storedLang || 'ar';
}

function applyLanguage(lang) {
  const normalized = normalizeLang(lang) || 'en';
  currentLang = normalized;
  const meta = LANG_META[normalized] || LANG_META.en;
  currentLocale = meta.locale;
  document.documentElement.lang = normalized;
  document.documentElement.dir = meta.dir;
  localStorage.setItem(LOCAL_KEYS.lang, normalized);
  if (dom.languageSelect) {
    dom.languageSelect.value = normalized;
    dom.languageSelect.setAttribute('aria-label', t('language.label'));
  }
  document.title = t('app.title');
  translateStatic();
  renderAll();
  updateCheckinStatus();
  updatePinStatus();
  updateStaffLockStatus();
}

function translateStatic() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.alt = t(element.dataset.i18nAlt);
  });
}

function t(key, values = {}) {
  const langTable = translations[currentLang] || translations.en;
  const fallbackTable = translations.en;
  const template = langTable[key] || fallbackTable[key] || key;
  return template.replace(/\{(\w+)\}/g, (match, token) => {
    if (values[token] === undefined || values[token] === null) return match;
    return String(values[token]);
  });
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '');
  return number.toLocaleString(currentLocale);
}

function formatMinutes(minutes) {
  return t('queue.waitMinutes', { minutes: formatNumber(minutes) });
}

function formatEtaLabel(minutes) {
  if (!minutes) return t('queue.etaNow');
  return t('queue.etaMinutes', { minutes: formatNumber(minutes), time: formatEtaTime(minutes) });
}

function formatCheckinEtaText(minutes) {
  if (!minutes) return t('checkin.eta.now');
  return t('checkin.eta.approx', { minutes: formatNumber(minutes), time: formatEtaTime(minutes) });
}

function getStatusLabel(status) {
  const label = t(`status.${status}`);
  return label.startsWith('status.') ? status : label;
}

function isStaffUnlocked() {
  return localStorage.getItem(LOCAL_KEYS.staffUnlocked) === '1';
}

function setStaffUnlocked(value) {
  if (value) {
    localStorage.setItem(LOCAL_KEYS.staffUnlocked, '1');
  } else {
    localStorage.removeItem(LOCAL_KEYS.staffUnlocked);
  }
}

function setupStaffLock() {
  if (!dom.staffLock) return;
  if (isCheckinView) {
    hideStaffLock();
    return;
  }
  if (isStaffUnlocked()) {
    hideStaffLock();
    return;
  }
  showStaffLock();
}

function showStaffLock() {
  if (!dom.staffLock) return;
  dom.staffLock.classList.add('active');
  document.body.classList.add('locked');
  if (dom.staffLockInput) {
    dom.staffLockInput.focus();
  }
}

function hideStaffLock() {
  if (!dom.staffLock) return;
  dom.staffLock.classList.remove('active');
  document.body.classList.remove('locked');
}

function updateStaffLockStatus(key) {
  if (!dom.staffLockStatus) return;
  const nextKey = key || dom.staffLockStatus.dataset.statusKey;
  if (!nextKey) {
    dom.staffLockStatus.textContent = '';
    dom.staffLockStatus.dataset.statusKey = '';
    return;
  }
  dom.staffLockStatus.dataset.statusKey = nextKey;
  dom.staffLockStatus.textContent = t(nextKey);
}

async function handleStaffUnlock() {
  if (!dom.staffLockInput) return;
  const pin = dom.staffLockInput.value.trim();
  if (!pin) {
    updateStaffLockStatus('lock.status.empty');
    return;
  }

  updateStaffLockStatus('lock.status.checking');

  try {
    await verifyStaffPin(pin);
    setStaffPin(pin);
    setStaffUnlocked(true);
    dom.staffLockInput.value = '';
    updateStaffLockStatus('');
    hideStaffLock();
    updatePinStatus('pin.status.saved');
  } catch (error) {
    updateStaffLockStatus('lock.status.invalid');
  }
}

function formatTicketNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '';
  return t('queue.ticketLabel', { number: formatNumber(number) });
}

function getEntryTicket(entry, fallbackIndex) {
  if (!entry) return '';
  const ticket = formatTicketNumber(entry.ticketNumber);
  if (ticket) return ticket;
  return formatTicketNumber(fallbackIndex + 1);
}

function formatNowServing(entry, fallbackIndex) {
  if (!entry) return '—';
  const ticket = getEntryTicket(entry, fallbackIndex);
  const name = entry.name || t('queue.guest');
  return ticket ? `${ticket} · ${name}` : name;
}

function bindEvents() {
  if (dom.staffLockButton) {
    dom.staffLockButton.addEventListener('click', handleStaffUnlock);
  }

  if (dom.staffLockInput) {
    dom.staffLockInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleStaffUnlock();
      }
    });
  }

  if (dom.checkinForm) {
    dom.checkinForm.addEventListener('submit', handleCheckinSubmit);
  }

  if (dom.copyCheckin) {
    dom.copyCheckin.addEventListener('click', () => copyCheckinLink(dom.copyCheckin));
  }

  if (dom.copyCheckinHeader) {
    dom.copyCheckinHeader.addEventListener('click', () => copyCheckinLink(dom.copyCheckinHeader));
  }

  if (dom.languageSelect) {
    dom.languageSelect.addEventListener('change', (event) => {
      applyLanguage(event.target.value);
    });
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
        updatePinStatus('pin.status.cleared');
        return;
      }
      setStaffPin(pin);
      updatePinStatus('pin.status.saved');
    });
  }
}

function loadStaffPin() {
  const pin = getStaffPin();
  if (dom.staffPinInput) {
    dom.staffPinInput.value = pin;
  }
  updatePinStatus(pin ? 'pin.status.saved' : 'pin.status.empty');
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
    updateCheckinStatus();
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
  dom.metricTotalWait.textContent = formatMinutes(totalWait);
  dom.metricAvgService.textContent = formatMinutes(avgService);
  dom.metricLastCheckin.textContent = lastCheckin ? formatTime(lastCheckin) : '—';

  const nowEntry = orderedQueue[0];
  const nextEntry = orderedQueue[1];
  dom.nowServing.textContent = formatNowServing(nowEntry, 0);
  dom.nextUp.textContent = formatNowServing(nextEntry, 1);
  dom.projectedFinish.textContent = totalWait ? formatEtaTime(totalWait) : '—';

  dom.queueTableBody.innerHTML = '';

  if (!orderedQueue.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = t('queue.empty');
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

    row.appendChild(createCell(getEntryTicket(entry, index) || String(index + 1)));
    row.appendChild(createCell(entry.name || t('queue.guest')));
    row.appendChild(createCell(entry.phone || '—'));

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `status-badge status-${entry.status}`;
    badge.textContent = getStatusLabel(entry.status);
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    row.appendChild(createCell(formatMinutes(waitMinutes)));
    row.appendChild(createCell(formatEtaLabel(etaMinutes)));

    const actionsCell = document.createElement('td');
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'row-actions';

    const notifyBtn = createActionButton(t('action.notify'), 'ghost');
    notifyBtn.disabled = entry.status === 'notified';
    notifyBtn.addEventListener('click', () => updateStatus(entry.id, 'notified'));

    const serveBtn = createActionButton(t('action.serve'), 'primary');
    serveBtn.addEventListener('click', () => updateStatus(entry.id, 'served'));

    const cancelBtn = createActionButton(t('action.cancel'), 'danger');
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
    empty.textContent = t('services.empty');
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
      const name = nameInput.value.trim() || t('service.default');
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
    removeBtn.textContent = t('service.remove');
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
    const option = new Option(t('checkin.noServices'), '');
    option.disabled = true;
    option.selected = true;
    dom.checkinService.appendChild(option);
    toggleCheckinSubmit(false);
    return;
  }

  services.forEach((service) => {
    const option = new Option(
      t('checkin.serviceOption', { name: service.name, minutes: service.avgMinutes }),
      service.id
    );
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
  await createService({ name: t('service.new'), avgMinutes: 15 });
  await refreshData();
}

async function removeService(serviceId) {
  const usedInQueue = queue.some((entry) => entry.serviceId === serviceId && !['served', 'canceled'].includes(entry.status));
  if (usedInQueue && !window.confirm(t('confirm.removeService'))) {
    return;
  }

  await deleteService(serviceId);
  await refreshData();
}

async function handleCheckinSubmit(event) {
  event.preventDefault();

  const name = dom.checkinName.value.trim();
  const phone = dom.checkinPhone.value.trim();

  if (!name || !phone) return;

  const payload = { name, phone };
  const entry = await createCheckin(payload);
  await refreshData();

  dom.checkinForm.reset();
  showCheckinStatus(entry.id, entry.ticketNumber);
}

function showCheckinStatus(entryId, ticketNumber) {
  if (!dom.checkinStatus) return;
  dom.checkinStatus.dataset.entryId = entryId;
  if (ticketNumber) {
    dom.checkinStatus.dataset.ticketNumber = String(ticketNumber);
  } else {
    const entry = queue.find((item) => item.id === entryId);
    if (entry && entry.ticketNumber) {
      dom.checkinStatus.dataset.ticketNumber = String(entry.ticketNumber);
    }
  }
  updateCheckinStatus();
}

function updateCheckinStatus() {
  if (!dom.checkinStatus) return;
  const entryId = dom.checkinStatus.dataset.entryId;
  if (!entryId) return;

  const storedTicket = formatTicketNumber(dom.checkinStatus.dataset.ticketNumber);
  const orderedQueue = sortByTime(getActiveQueue());
  const positionIndex = orderedQueue.findIndex((item) => item.id === entryId);
  if (positionIndex === -1) {
    dom.checkinStatus.textContent = t('checkin.status.generic');
    dom.checkinStatus.classList.add('active');
    return;
  }

  const entry = orderedQueue[positionIndex];
  const position = positionIndex + 1;
  const etaMinutes = calculateEtaForEntry(entryId, orderedQueue);
  const etaText = formatCheckinEtaText(etaMinutes);
  const ticket = formatTicketNumber(entry.ticketNumber) || storedTicket || formatTicketNumber(position);

  dom.checkinStatus.textContent = t('checkin.status.position', { position, etaText, ticket });
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
  return service ? service.name : t('service.default');
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
    flashButton(button, t('copy.copied'));
  } catch (error) {
    console.warn('Copy failed.', error);
    flashButton(button, t('copy.failed'));
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
    t('csv.id'),
    t('csv.ticket'),
    t('csv.name'),
    t('csv.phone'),
    t('csv.status'),
    t('csv.created_at'),
    t('csv.notified_at'),
    t('csv.served_at'),
    t('csv.canceled_at')
  ];

  const rows = queue.map((entry) => [
    entry.id,
    entry.ticketNumber ?? '',
    entry.name,
    entry.phone,
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
  return date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
}

function formatEtaTime(minutes) {
  const date = new Date(Date.now() + minutes * 60000);
  return date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
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

async function verifyStaffPin(pin) {
  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'x-qsys-pin': pin
    }
  });

  if (!response.ok) {
    throw new Error('Invalid PIN');
  }

  return response.json();
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
    pin = window.prompt(t('prompt.staffPin'));
    if (!pin) return '';
    setStaffPin(pin.trim());
    updatePinStatus('pin.status.saved');
  }
  return pin;
}

function updatePinStatus(key) {
  if (!dom.staffPinStatus) return;
  const nextKey = key || dom.staffPinStatus.dataset.statusKey;
  if (!nextKey) return;
  dom.staffPinStatus.dataset.statusKey = nextKey;
  dom.staffPinStatus.textContent = t(nextKey);
}

function handleUnauthorized() {
  clearStaffPin();
  setStaffUnlocked(false);
  updatePinStatus('pin.status.invalid');
  updateStaffLockStatus('lock.status.invalid');
  showStaffLock();
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

