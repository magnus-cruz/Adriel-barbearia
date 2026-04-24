/* ================================================
   Alpha Barber - loader.js
   Funcao: controlar tela de carregamento inicial.
   ================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const barra = document.getElementById('loader-barra');
  const label = document.getElementById('loader-pct');
  if (!barra || !label) return;

  let pct = 0;
  const timer = setInterval(() => {
    pct += 5;
    if (barra) barra.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}%`;

    if (pct >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 200);
    }
  }, 40);
});
