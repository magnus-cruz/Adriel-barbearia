/* ================================================
   Alpha Barber - galeria.js
   Funcao: masonry, filtros com contador e lightbox.
   ================================================ */

'use strict';

let todasMidias = [];
let midiasFiltro = [];
let lightboxIdx = 0;

document.addEventListener('DOMContentLoaded', carregarGaleria);

async function carregarGaleria() {
  const grid = document.getElementById('galeria-grid');
  if (!grid) return;

  /* Skeleton */
  grid.innerHTML = Array(6).fill(`
    <div style="break-inside:avoid;margin-bottom:12px;border-radius:6px;overflow:hidden;background:var(--carbon-light)">
      <div style="height:${180 + (Math.random() * 120 | 0)}px;background:linear-gradient(90deg,rgba(68,58,46,.2) 25%,rgba(68,58,46,.4) 50%,rgba(68,58,46,.2) 75%);background-size:200% 100%;animation:skeleton 1.5s ease infinite"></div>
    </div>
  `).join('');

  try {
    todasMidias = await API.galeria();
    /* Normaliza categoria para comparacao segura */
    todasMidias = todasMidias.map((item) => ({
      ...item,
      categoria: String(item.categoria || 'galeria').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }));
    midiasFiltro = [...todasMidias];
    atualizarContadores();
    renderizarGrid(todasMidias);
  } catch (e) {
    grid.innerHTML = `<div style="columns:unset;grid-column:1/-1;text-align:center;padding:3rem;color:#e05555">Erro ao carregar galeria: ${e.message}</div>`;
  }
}

function atualizarContadores() {
  const categorias = ['todos', 'cortes', 'barba', 'degrade', 'eventos', 'galeria'];
  categorias.forEach((cat) => {
    const el = document.getElementById(`count-${cat}`);
    if (!el) return;
    const qtd = cat === 'todos' ? todasMidias.length : todasMidias.filter((m) => m.categoria === cat).length;
    el.textContent = qtd || '';
  });
}

function filtrar(categoria, btn) {
  document.querySelectorAll('.btn-filtro').forEach((b) => b.classList.remove('ativo'));
  btn.classList.add('ativo');

  midiasFiltro = categoria === 'todos' ? [...todasMidias] : todasMidias.filter((m) => m.categoria === categoria);

  const grid = document.getElementById('galeria-grid');
  grid.style.opacity = '0';
  grid.style.transform = 'translateY(8px)';

  setTimeout(() => {
    renderizarGrid(midiasFiltro);
    grid.style.transition = 'opacity .3s, transform .3s';
    grid.style.opacity = '1';
    grid.style.transform = 'translateY(0)';
  }, 200);
}

function renderizarGrid(lista) {
  const grid = document.getElementById('galeria-grid');
  const vazio = document.getElementById('galeria-vazia');

  if (!lista.length) {
    grid.innerHTML = '';
    if (vazio) vazio.style.display = 'flex';
    return;
  }

  if (vazio) vazio.style.display = 'none';

  const catLabels = {
    galeria: 'Galeria',
    cortes: 'Cortes',
    barba: 'Barba',
    degrade: 'Degrade',
    eventos: 'Eventos'
  };

  grid.innerHTML = lista.map((item, i) => `
    <div class="gallery-card" onclick="abrirLightbox(${i})" style="animation-delay:${i * 0.04}s">
      <img src="${item.url}" alt="${item.titulo || `Foto ${i + 1}`}" loading="${i < 4 ? 'eager' : 'lazy'}" onerror="this.src='';this.style.height='160px';this.style.background='var(--carbon-light)'">
      <div class="gallery-card-overlay">
        <div class="overlay-lupa">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <div class="overlay-titulo">${item.titulo || 'Foto'}</div>
        <div class="overlay-badge">${catLabels[item.categoria] || item.categoria}</div>
      </div>
    </div>
  `).join('');
}

function abrirLightbox(idx) {
  lightboxIdx = idx;
  const lb = document.getElementById('lightbox');
  const item = midiasFiltro[idx];
  if (!lb || !item) return;

  document.getElementById('lightbox-img').src = item.url;
  document.getElementById('lightbox-titulo').textContent = item.titulo || '';
  document.getElementById('lightbox-categoria').textContent = item.categoria || '';

  lb.classList.add('aberto');
  document.body.style.overflow = 'hidden';

  /* Swipe mobile */
  lb.addEventListener('touchstart', touchStart, { passive: true });
  lb.addEventListener('touchend', touchEnd, { passive: true });
}

function fecharLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lightbox-fechar')) {
    return;
  }

  const lb = document.getElementById('lightbox');
  lb?.classList.remove('aberto');
  document.body.style.overflow = '';
}

function navLightbox(dir, e) {
  e?.stopPropagation();
  lightboxIdx = (lightboxIdx + dir + midiasFiltro.length) % midiasFiltro.length;
  const item = midiasFiltro[lightboxIdx];
  if (!item) return;

  const img = document.getElementById('lightbox-img');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = item.url;
    document.getElementById('lightbox-titulo').textContent = item.titulo || '';
    document.getElementById('lightbox-categoria').textContent = item.categoria || '';
    img.style.transition = 'opacity .2s';
    img.style.opacity = '1';
  }, 150);
}

/* Swipe */
let touchX = 0;
function touchStart(e) { touchX = e.touches[0].clientX; }
function touchEnd(e) {
  const diff = touchX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) navLightbox(diff > 0 ? 1 : -1);
}

/* Teclado */
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb?.classList.contains('aberto')) return;
  if (e.key === 'ArrowRight') navLightbox(1);
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'Escape') fecharLightbox({ target: lb });
});

window.filtrar = filtrar;
window.abrirLightbox = abrirLightbox;
window.fecharLightbox = fecharLightbox;
window.navLightbox = navLightbox;
