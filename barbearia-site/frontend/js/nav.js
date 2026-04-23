/* Controle do menu hambúrguer para mobile */
function toggleMenu() {
  const ham = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  if (!ham || !links || !overlay) return;

  const aberto = links.classList.contains('aberto');

  if (aberto) {
    fecharMenu();
  } else {
    links.classList.add('aberto');
    ham.classList.add('aberto');
    overlay.classList.add('visivel');
    ham.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
}

function fecharMenu() {
  const ham = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-overlay');

  if (!ham || !links || !overlay) return;

  links.classList.remove('aberto');
  ham.classList.remove('aberto');
  overlay.classList.remove('visivel');
  ham.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* Fecha ao clicar em qualquer link do menu */
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('#nav-links a');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      fecharMenu();
    });
  });
});

/* Fecha ao pressionar ESC */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharMenu();
  }
});

/* Fecha ao redimensionar para desktop */
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    fecharMenu();
  }
});

window.toggleMenu = toggleMenu;
window.fecharMenu = fecharMenu;
