/* ============================================================
   TomatoVPN — единая логика для ПК и телефона
   ============================================================ */

(function () {
  'use strict';

  // ---------- Состояние (общее для обоих макетов) ----------
  const state = {
    isConnected: false,
    isConnecting: false,
    sessionSeconds: 0,
    currentServer: { flag: '🇳🇱', name: 'Нидерланды · Амстердам' },
  };

  let sessionTimer = null;
  let speedTimer   = null;
  let toastTimer   = null;

  // ---------- Хелперы ----------
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function updateAll(selector, text) {
    $$(selector).forEach(el => el.textContent = text);
  }

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
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---------- Статус ----------
  function setStatus(status) {
    state.isConnected  = status === 'connected';
    state.isConnecting = status === 'connecting';

    $$('.js-connect-card').forEach(card => {
      card.classList.toggle('is-connected', status === 'connected');
      card.classList.toggle('is-connecting', status === 'connecting');
    });
    $$('.js-power').forEach(btn => {
      btn.classList.toggle('connected', status === 'connected');
      btn.classList.toggle('connecting', status === 'connecting');
    });

    const text =
      status === 'connected'  ? 'Защищено' :
      status === 'connecting' ? 'Подключение…' :
                                'Не подключено';
    updateAll('.js-status', text);
  }

  // ---------- Сессия ----------
  function startSession() {
    state.sessionSeconds = 0;
    updateAll('.js-time', '00:00');

    sessionTimer = setInterval(() => {
      state.sessionSeconds++;
      updateAll('.js-time', formatTime(state.sessionSeconds));
    }, 1000);

    updateAll('.js-down', randomSpeed(40, 180) + ' Мбит/с');
    updateAll('.js-up',   randomSpeed(15, 90)  + ' Мбит/с');
    $$('.js-time, .js-down, .js-up').forEach(el => el.classList.add('accent'));

    speedTimer = setInterval(() => {
      updateAll('.js-down', randomSpeed(40, 180) + ' Мбит/с');
      updateAll('.js-up',   randomSpeed(15, 90)  + ' Мбит/с');
    }, 1400);
  }

  function stopSession() {
    clearInterval(sessionTimer);
    clearInterval(speedTimer);
    sessionTimer = null;
    speedTimer = null;
    state.sessionSeconds = 0;

    updateAll('.js-time', '00:00');
    updateAll('.js-down', '0.0 Мбит/с');
    updateAll('.js-up',   '0.0 Мбит/с');
    $$('.js-time, .js-down, .js-up').forEach(el => el.classList.remove('accent'));
  }

  // ---------- Подключение ----------
  function connect() {
    if (state.isConnecting || state.isConnected) return;
    state.isConnecting = true;
    setStatus('connecting');

    setTimeout(() => {
      state.isConnecting = false;
      state.isConnected = true;
      setStatus('connected');
      updateAll('.js-ip', randomIP());
      $$('.js-ip').forEach(el => el.classList.add('accent'));
      startSession();
    }, 1100);
  }

  function disconnect() {
    state.isConnected  = false;
    state.isConnecting = false;
    setStatus('disconnected');
    stopSession();
    updateAll('.js-ip', '92.38.140.77');
    $$('.js-ip').forEach(el => el.classList.remove('accent'));
  }

  function toggleConnection() {
    if (state.isConnecting) return;
    state.isConnected ? disconnect() : connect();
  }

  // ---------- Выбор сервера ----------
  function selectServer(btn) {
    const flag = btn.dataset.flag;
    const name = btn.dataset.name;
    if (!flag || !name) return;

    state.currentServer = { flag, name };

    updateAll('.js-flag', flag);
    updateAll('.js-name', name);

    $$('[data-flag][data-name]').forEach(b => {
      b.classList.toggle('active', b.dataset.name === name);
    });

    if (!state.isConnected && !state.isConnecting) {
      updateAll('.js-ip', randomIP());
    }

    if (state.isConnected) {
      stopSession();
      state.isConnected = false;
      connect();
    }

    closeAllSheets();
  }

  // ---------- Шторки (только мобильная версия) ----------
  let activeSheet = null;

  function openSheet(id) {
    const sheet = document.getElementById(id);
    const overlay = document.getElementById('sheetOverlay');
    if (!sheet || !overlay) return;
    overlay.classList.add('open');
    sheet.classList.add('open');
    activeSheet = sheet;
  }

  function closeAllSheets() {
    const overlay = document.getElementById('sheetOverlay');
    if (overlay) overlay.classList.remove('open');
    $$('.sheet.open').forEach(s => s.classList.remove('open'));
    activeSheet = null;
  }

  // ---------- Инициализация ----------
  function init() {
    // Кнопки питания (в обоих макетах)
    $$('.js-power').forEach(btn => btn.addEventListener('click', toggleConnection));

    // Все кнопки выбора сервера (в обоих макетах)
    $$('[data-flag][data-name]').forEach(btn => {
      btn.addEventListener('click', () => selectServer(btn));
    });

    // Шторки — только мобильный макет
    const featuresBtn   = document.getElementById('featuresBtn');
    const premiumBtn    = document.getElementById('premiumBtn');
    const serverSelector = document.getElementById('serverSelector');
    const overlay       = document.getElementById('sheetOverlay');

    if (featuresBtn)   featuresBtn.addEventListener('click',   () => openSheet('featuresSheet'));
    if (premiumBtn)    premiumBtn.addEventListener('click',    () => openSheet('premiumSheet'));
    if (serverSelector) serverSelector.addEventListener('click', () => openSheet('sheet'));
    if (overlay)       overlay.addEventListener('click', closeAllSheets);

    // Тарифы (мобильный) → тост
    const premiumSheet = document.getElementById('premiumSheet');
    if (premiumSheet) {
      premiumSheet.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-buy');
        if (!btn) return;
        const plan = btn.dataset.buy;
        closeAllSheets();
        showToast(plan === 'Free' ? 'Бесплатный тариф активирован ✓' : `Тариф ${plan} оформлен ✓`);
      });
    }

    // Esc закрывает шторки
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllSheets();
    });

    // Лоадер (только мобильный)
    const loader = document.getElementById('loader');
    if (loader) {
      const hide = () => {
        loader.classList.add('hide');
        setTimeout(() => loader.remove(), 600);
      };
      window.addEventListener('load', () => setTimeout(hide, 1400));
      if (document.readyState === 'complete') setTimeout(hide, 1400);
    }
  }

  // ---------- Старт ----------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();