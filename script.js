/* ============================================================
   TomatoVPN — визуальный макет (без серверов и запросов)
   ============================================================ */

(function () {
  'use strict';

  // ---------- DOM ----------
  const card        = document.getElementById('connectCard');
  const powerBtn    = document.getElementById('powerBtn');
  const statusText  = document.getElementById('statusText');
  const ipValue     = document.getElementById('ipValue');
  const timeValue   = document.getElementById('timeValue');
  const downValue   = document.getElementById('downValue');
  const upValue     = document.getElementById('upValue');

  const serverSelector = document.getElementById('serverSelector');
  const selFlag     = document.getElementById('selFlag');
  const selName     = document.getElementById('selName');

  const overlay     = document.getElementById('sheetOverlay');
  const serverSheet = document.getElementById('sheet');
  const sheetList   = document.getElementById('sheetList');

  const featuresBtn   = document.getElementById('featuresBtn');
  const featuresSheet = document.getElementById('featuresSheet');

  const premiumBtn  = document.getElementById('premiumBtn');
  const premiumSheet = document.getElementById('premiumSheet');

  const toast       = document.getElementById('toast');
  const loader      = document.getElementById('loader');

  // ---------- Loader ----------
  function hideLoader() {
    if (!loader) return;
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 600);
  }

  window.addEventListener('load', () => {
    setTimeout(hideLoader, 1400);
  });
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 1400);
  }

  // ---------- Состояние ----------
  let isConnected  = false;
  let isConnecting = false;
  let sessionSeconds = 0;
  let sessionTimer = null;
  let speedTimer   = null;
  let activeSheet  = null;
  let toastTimer   = null;

  // ---------- Утилиты ----------
  function randomIP() {
    const o = () => Math.floor(Math.random() * 254) + 1;
    return `${o()}.${o()}.${o()}.${o()}`;
  }

  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function randomSpeed(min, max) {
    return (Math.random() * (max - min) + min).toFixed(1);
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---------- Статус ----------
  function setStatus(state) {
    card.classList.remove('is-connected', 'is-connecting');
    powerBtn.classList.remove('connected', 'connecting');

    if (state === 'connecting') {
      card.classList.add('is-connecting');
      powerBtn.classList.add('connecting');
      statusText.textContent = 'Подключение…';
    } else if (state === 'connected') {
      card.classList.add('is-connected');
      powerBtn.classList.add('connected');
      statusText.textContent = 'Защищено';
    } else {
      statusText.textContent = 'Не подключено';
    }
  }

  // ---------- Сессия ----------
  function startSession() {
    sessionSeconds = 0;
    timeValue.textContent = '00:00';

    sessionTimer = setInterval(() => {
      sessionSeconds++;
      timeValue.textContent = formatTime(sessionSeconds);
    }, 1000);

    downValue.textContent = randomSpeed(40, 180) + ' Мбит/с';
    upValue.textContent   = randomSpeed(15, 90)  + ' Мбит/с';
    timeValue.classList.add('accent');
    downValue.classList.add('accent');
    upValue.classList.add('accent');

    speedTimer = setInterval(() => {
      downValue.textContent = randomSpeed(40, 180) + ' Мбит/с';
      upValue.textContent   = randomSpeed(15, 90)  + ' Мбит/с';
    }, 1400);
  }

  function stopSession() {
    clearInterval(sessionTimer);
    clearInterval(speedTimer);
    sessionTimer = null;
    speedTimer = null;
    sessionSeconds = 0;

    timeValue.textContent = '00:00';
    downValue.textContent = '0.0 Мбит/с';
    upValue.textContent   = '0.0 Мбит/с';
    timeValue.classList.remove('accent');
    downValue.classList.remove('accent');
    upValue.classList.remove('accent');
  }

  function connect() {
    if (isConnecting || isConnected) return;
    isConnecting = true;
    setStatus('connecting');

    setTimeout(() => {
      isConnecting = false;
      isConnected = true;
      setStatus('connected');
      ipValue.textContent = randomIP();
      ipValue.classList.add('accent');
      startSession();
    }, 1100);
  }

  function disconnect() {
    isConnected = false;
    isConnecting = false;
    setStatus('disconnected');
    stopSession();
    ipValue.classList.remove('accent');
    ipValue.textContent = '92.38.140.77';
  }

  powerBtn.addEventListener('click', () => {
    if (isConnecting) return;
    isConnected ? disconnect() : connect();
  });

  // ---------- Bottom sheet управление ----------
  function openSheet(sheetEl) {
    overlay.classList.add('open');
    sheetEl.classList.add('open');
    activeSheet = sheetEl;
  }

  function closeSheets() {
    overlay.classList.remove('open');
    if (activeSheet) activeSheet.classList.remove('open');
    activeSheet = null;
  }

  overlay.addEventListener('click', closeSheets);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheets();
  });

  // ---------- Возможности (Щит) ----------
  featuresBtn.addEventListener('click', () => openSheet(featuresSheet));

  // ---------- Серверы ----------
  serverSelector.addEventListener('click', () => openSheet(serverSheet));

  sheetList.addEventListener('click', (e) => {
    const btn = e.target.closest('.srv');
    if (!btn) return;

    sheetList.querySelectorAll('.srv').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');

    selFlag.textContent = btn.dataset.flag;
    selName.textContent = btn.dataset.name;

    ipValue.textContent = randomIP();
    if (isConnected) {
      stopSession();
      isConnected = false;
      connect();
    }

    closeSheets();
  });

  // ---------- Тарифы (Корона) ----------
  premiumBtn.addEventListener('click', () => openSheet(premiumSheet));

  premiumSheet.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.btn-buy');
    if (!buyBtn) return;

    const plan = buyBtn.dataset.buy;
    closeSheets();

    if (plan === 'Free') {
      showToast('Бесплатный тариф активирован ✓');
    } else {
      showToast(`Тариф ${plan} оформлен ✓`);
    }
  });

})();