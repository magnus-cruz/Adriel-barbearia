/* ================================================
   Alpha Barber - loader.js
   Funcao: API do loader e ativacao automatica em links internos.
   ================================================ */

'use strict';

const AlphaLoader = (() => {
  const MSGS = [
    'Preparando a navalha...',
    'Afiando as tesouras...',
    'Ajustando a cadeira...',
    'Quase na cadeira...',
    'Alpha Barber te espera!'
  ];

  let overlay = null;
  let fillEl = null;
  let labelEl = null;
  let doneEl = null;
  let trackEl = null;
  let bgEl = null;
  let timer = null;
  let pct = 0;
  let finishCallback = null;
  let built = false;

  function ensureRefs() {
    overlay = document.getElementById('loader-overlay');
    fillEl = document.getElementById('progress-fill');
    labelEl = document.getElementById('progress-label');
    doneEl = document.getElementById('done-overlay');
    trackEl = document.getElementById('stripe-track');
    bgEl = document.getElementById('bg-lines');
    return !!(overlay && fillEl && labelEl && doneEl && trackEl && bgEl);
  }

  function buildDecorations() {
    if (built || !ensureRefs()) return;

    const pattern = ['s-red', 's-white', 's-blue', 's-white', 's-red', 's-white', 's-blue', 's-white'];
    for (let i = 0; i < 24; i += 1) {
      const stripe = document.createElement('div');
      stripe.className = 'stripe ' + pattern[i % pattern.length];
      trackEl.appendChild(stripe);
    }

    [80, 160, 240, 320, 400, 480, 560].forEach((left, index) => {
      const line = document.createElement('div');
      line.className = 'bg-line';
      line.style.left = left + 'px';
      line.style.animationDelay = index * 0.3 + 's';
      bgEl.appendChild(line);
    });

    built = true;
  }

  function reset() {
    clearTimeout(timer);
    pct = 0;
    if (!ensureRefs()) return;
    fillEl.style.width = '0%';
    labelEl.textContent = MSGS[0];
    doneEl.classList.remove('show');
    overlay.classList.remove('hidden');
  }

  function finish() {
    if (!ensureRefs()) return;
    fillEl.style.width = '100%';
    labelEl.textContent = MSGS[MSGS.length - 1];
    setTimeout(() => {
      doneEl.classList.add('show');
      if (typeof finishCallback === 'function') {
        setTimeout(() => finishCallback(), 600);
      }
    }, 300);
  }

  function step() {
    if (pct >= 100) {
      finish();
      return;
    }

    pct += Math.floor(Math.random() * 12) + 5;
    if (pct > 100) pct = 100;

    fillEl.style.width = pct + '%';
    labelEl.textContent = MSGS[Math.min(Math.floor(pct / 25), MSGS.length - 1)];
    timer = setTimeout(step, 280 + Math.random() * 380);
  }

  function show(cb) {
    finishCallback = cb || null;
    buildDecorations();
    reset();
    setTimeout(step, 400);
  }

  function hide() {
    if (!ensureRefs()) return;
    overlay.classList.add('hidden');
  }

  function bindLinks() {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('javascript')) return;
      if (link.target === '_blank') return;

      link.addEventListener('click', (event) => {
        event.preventDefault();
        const destino = link.href;
        show(() => {
          window.location.href = destino;
        });
      });
    });
  }

  function init() {
    buildDecorations();
    const isStandalone = document.body?.classList.contains('loader-page');

    if (isStandalone) {
      show(() => {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      });
      return;
    }

    hide();
    bindLinks();
  }

  return { show, hide, reset, init };
})();

window.AlphaLoader = AlphaLoader;

document.addEventListener('DOMContentLoaded', () => {
  AlphaLoader.init();
});
