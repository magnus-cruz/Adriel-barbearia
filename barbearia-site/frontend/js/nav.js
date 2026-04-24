/* ================================================
   Alpha Barber - nav.js
   Funcao: controlar menu hamburguer responsivo.
   ================================================ */

'use strict';

function toggleMenu() {
  const ham = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  const aberto = links?.classList.contains('aberto');
  if (aberto) {
    fecharMenu();
    return;
  }

  links?.classList.add('aberto');
  ham?.classList.add('aberto');
  overlay?.classList.add('visivel');
  ham?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function fecharMenu() {
  document.getElementById('nav-links')?.classList.remove('aberto');
  document.getElementById('hamburger')?.classList.remove('aberto');
  document.getElementById('nav-overlay')?.classList.remove('visivel');
  document.getElementById('hamburger')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', fecharMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fecharMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) fecharMenu();
  });

  const pagina = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href === pagina || href.endsWith(`/${pagina}`)) a.classList.add('nav-ativo');
  });
});

window.toggleMenu = toggleMenu;
window.fecharMenu = fecharMenu;
