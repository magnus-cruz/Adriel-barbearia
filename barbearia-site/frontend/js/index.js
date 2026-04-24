/* ================================================
   Alpha Barber - index.js
   Funcao: carregamento dinamico da pagina home.
   ================================================ */

'use strict';

/* Carrega tudo ao abrir a pagina */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    carregarServicosHome(),
    carregarGaleriaHome(),
    carregarBarbeirosHome()
  ]);
});

/* ── SERVIÇOS ── */
async function carregarServicosHome() {
  const container = document.getElementById('servicos-home');
  if (!container) return;

  try {
    const lista = await API.servicos();
    const ativos = lista.filter(s => s.ativo !== false);

    if (!ativos.length) {
      container.innerHTML = `
        <div style="padding:1.5rem;text-align:center;
          color:var(--pale-oak-dim);font-size:.84rem">
          Serviços em breve.
        </div>`;
      return;
    }

    container.innerHTML = ativos.map(s => `
      <div class="servico-card-home">
        <div class="servico-home-info">
          <div class="servico-home-nome">${s.nome}</div>
          <div class="servico-home-tempo">
            ${s.duracaoMinutos} minutos
          </div>
        </div>
        <div class="servico-home-preco">
          R$ ${parseFloat(s.preco).toFixed(2).replace('.', ',')}
        </div>
      </div>
    `).join('');

  } catch(e) {
    container.innerHTML = `
      <div style="padding:1rem;color:#e05555;
        font-size:.82rem">
        Erro ao carregar serviços.
      </div>`;
  }
}

/* ── GALERIA PREVIEW ── */
async function carregarGaleriaHome() {
  const grid = document.getElementById('galeria-preview-home');
  if (!grid) return;

  try {
    const lista = await API.galeria();

    if (!lista.length) {
      grid.innerHTML = `
        <div class="galeria-preview-vazia">
          <svg width="40" height="40" viewBox="0 0 24 24"
               fill="none" stroke="currentColor"
               stroke-width="1.5"
               style="color:var(--dark-goldenrod)">
            <rect x="3" y="3" width="18" height="18"
                  rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Fotos em breve</span>
          <a href="galeria.html"
             style="color:var(--dark-goldenrod);
                    font-size:.78rem">
            Ver galeria
          </a>
        </div>`;
      return;
    }

    /* Mostrar máximo 4 fotos */
    const preview = lista.slice(0, 4);

    grid.innerHTML = preview.map((item, i) => `
      <div class="galeria-preview-item"
           onclick="window.location.href='galeria.html'">
        <img
          src="${item.url}"
          alt="${item.titulo || 'Foto ' + (i+1)}"
          loading="${i === 0 ? 'eager' : 'lazy'}"
          onerror="this.parentElement.innerHTML=
            '<div class=\\'galeria-preview-item\\' style=\\'background:var(--carbon-black);\\'></div>'">
        <div class="preview-icon">
          <svg width="24" height="24" viewBox="0 0 24 24"
               fill="none" stroke="white" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8"  y1="11" x2="14" y2="11"/>
          </svg>
        </div>
      </div>
    `).join('');

  } catch(e) {
    grid.innerHTML = `
      <div class="galeria-preview-vazia">
        <span style="color:#e05555">
          Erro ao carregar galeria.
        </span>
      </div>`;
  }
}

/* ── BARBEIROS ── */
async function carregarBarbeirosHome() {
  const grid = document.getElementById('barbeiros-home');
  if (!grid) return;

  try {
    const lista = await API.barbeiros();
    const ativos = lista.filter(b => b.ativo !== false);

    if (!ativos.length) {
      grid.innerHTML = `
        <div class="barbeiros-vazio">
          Equipe em breve.
        </div>`;
      return;
    }

    grid.innerHTML = ativos.map(b => `
      <div class="barbeiro-card">
        <div class="barbeiro-foto-wrap">
          ${b.fotoUrl
            ? `<img src="${b.fotoUrl}" alt="${b.nome}"
                    onerror="this.parentElement.innerHTML=
                          '<div class=\\'barbeiro-foto-placeholder\\'>✂</div>'">`
            : '<div class="barbeiro-foto-placeholder">✂</div>'
          }
        </div>
        <div class="barbeiro-nome">${b.nome}</div>
        <div class="barbeiro-espec">
          ${b.especialidade || 'Barbeiro Profissional'}
        </div>
        ${b.instagram
          ? `<span class="barbeiro-insta">${b.instagram}</span>`
          : ''
        }
      </div>
    `).join('');

  } catch(e) {
    grid.innerHTML = `
      <div class="barbeiros-vazio"
           style="color:#e05555">
        Erro ao carregar equipe.
      </div>`;
  }
}