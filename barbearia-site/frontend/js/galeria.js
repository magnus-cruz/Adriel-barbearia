// Estado global da galeria para filtros e lightbox.
const galeriaState = {
  itens: [],
  filtro: "todos",
  indiceLightbox: -1,
  touchInicioX: 0
};

const API_GALERIA = "http://localhost:8080/api/galeria";
const API_EXCLUIR_BASE = "http://localhost:8080/api/admin/galeria/";

function mostrarSucesso(mensagem) {
  alert(mensagem);
}

function mostrarErro(mensagem) {
  alert(mensagem);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function categoriaLabel(categoria) {
  const mapa = {
    galeria: "Galeria",
    cortes: "Cortes",
    barba: "Barba",
    degrade: "DegradÃª",
    eventos: "Eventos"
  };
  const chave = String(categoria || "galeria").toLowerCase();
  return mapa[chave] || "Galeria";
}

function normalizarItem(item) {
  const categoria = String(item?.categoria || "galeria").toLowerCase();
  const titulo = String(item?.titulo || item?.nomeArquivo || "Sem tÃ­tulo").trim();
  const url = String(item?.url || "").trim();
  const nomeArquivo = String(item?.nomeArquivo || (url.split("/").pop() || "")).trim();

  return {
    ...item,
    categoria,
    titulo,
    url,
    nomeArquivo,
    tipo: String(item?.tipo || "image/jpeg")
  };
}

function itensFiltrados() {
  if (galeriaState.filtro === "todos") return galeriaState.itens;
  return galeriaState.itens.filter((item) => item.categoria === galeriaState.filtro);
}

function renderFiltros() {
  const filtrosEl = document.getElementById("filtros");
  if (!filtrosEl) return;

  const categorias = Array.from(new Set(galeriaState.itens.map((item) => item.categoria)));
  const base = ["todos", "galeria", "cortes", "barba", "degrade", "eventos"];
  const lista = Array.from(new Set([...base, ...categorias]));

  filtrosEl.innerHTML = lista.map((categoria) => `
    <button
      type="button"
      class="gallery-filter ${galeriaState.filtro === categoria ? "active" : ""}"
      data-categoria="${escapeHtml(categoria)}">
      ${categoria === "todos" ? "Todos" : escapeHtml(categoriaLabel(categoria))}
    </button>
  `).join("");

  filtrosEl.querySelectorAll(".gallery-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      galeriaState.filtro = btn.dataset.categoria;
      renderGaleria(galeriaState.itens);
    });
  });
}

function atualizarContador(totalVisiveis) {
  const contador = document.getElementById("galeria-contador");
  if (!contador) return;

  const total = galeriaState.itens.length;
  contador.textContent = total
    ? `${totalVisiveis} de ${total} itens exibidos`
    : "Nenhuma imagem cadastrada.";
}

function botaoExcluirCard(nomeArquivo) {
  return `
    <button class="btn-excluir-card" type="button" data-excluir="${escapeHtml(nomeArquivo)}" aria-label="Excluir imagem">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M9 3.75h6A1.25 1.25 0 0 1 16.25 5V6h3a.75.75 0 0 1 0 1.5h-1l-.74 10.1A2.25 2.25 0 0 1 15.26 19H8.74a2.25 2.25 0 0 1-2.25-2.4L5.75 7.5h-1a.75.75 0 0 1 0-1.5h3V5A1.25 1.25 0 0 1 9 3.75Z"/>
      </svg>
    </button>
  `;
}

function renderCard(item, indice) {
  const admin = typeof isAdminLogado === "function" && isAdminLogado() === true;
  const excluir = admin ? botaoExcluirCard(item.nomeArquivo) : "";

  return `
    <div class="gallery-card" data-id="${escapeHtml(item.id || String(indice))}" data-categoria="${escapeHtml(item.categoria)}">
      <div class="card-img-wrap" data-open-lightbox="${indice}">
        <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.titulo)}" loading="lazy" onerror="imgFallback(this)">
        ${excluir}
      </div>
      <div class="card-info">
        <span class="card-badge">${escapeHtml(categoriaLabel(item.categoria))}</span>
        <p class="card-titulo">${escapeHtml(item.titulo)}</p>
      </div>
    </div>
  `;
}

function renderTabelaAdmin(itens) {
  const tabela = document.getElementById("midias-lista");
  if (!tabela) return;

  const admin = typeof isAdminLogado === "function" && isAdminLogado() === true;
  if (!itens.length) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhuma imagem cadastrada.</td></tr>';
    return;
  }

  tabela.innerHTML = itens.map((item) => `
    <tr>
      <td>${escapeHtml(item.tipo || "foto")}</td>
      <td>${escapeHtml(categoriaLabel(item.categoria))}</td>
      <td>${escapeHtml(item.titulo)}</td>
      <td><img class="gallery-admin-thumb" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.titulo)}" onerror="imgFallback(this)"></td>
      <td>${escapeHtml(item.nomeArquivo || "-")}</td>
      <td>
        ${admin
          ? `<button class="gallery-admin-delete" type="button" data-excluir="${escapeHtml(item.nomeArquivo)}" aria-label="Excluir"></button>`
          : '<span class="small">-</span>'}
      </td>
    </tr>
  `).join("");

  tabela.querySelectorAll("[data-excluir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nomeArquivo = btn.getAttribute("data-excluir") || "";
      abrirModalExcluir(nomeArquivo, null);
    });
  });
}

function imgFallback(elemento) {
  const wrap = elemento.closest(".card-img-wrap") || elemento.parentElement;
  if (!wrap) return;
  wrap.innerHTML = '<div class="img-fallback">Imagem indisponÃ­vel</div>';
}

function bindAcoesCards() {
  const grid = document.getElementById("galeria-grid") || document.getElementById("gallery-grid");
  if (!grid) return;

  grid.querySelectorAll("[data-open-lightbox]").forEach((wrap) => {
    wrap.addEventListener("click", (event) => {
      const alvoExcluir = event.target.closest(".btn-excluir-card");
      if (alvoExcluir) return;
      const indice = Number(wrap.getAttribute("data-open-lightbox") || "0");
      abrirLightbox(indice);
    });
  });

  grid.querySelectorAll(".btn-excluir-card").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const nomeArquivo = btn.getAttribute("data-excluir") || "";
      const card = btn.closest(".gallery-card");
      abrirModalExcluir(nomeArquivo, card);
    });
  });
}

function abrirModalExcluir(nomeArquivo, cardElement) {
  // Modal sempre no body para evitar recortes por containers com overflow.
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" id="modal-card">
      <div class="modal-titulo">Excluir imagem</div>
      <div class="modal-mensagem">
        Tem certeza que deseja excluir esta imagem?<br>
        <strong style="color:var(--pale-oak)">${escapeHtml(nomeArquivo)}</strong><br>
        Esta aÃ§Ã£o nÃ£o pode ser desfeita.
      </div>
      <div class="modal-acoes">
        <button class="btn-modal-cancelar" id="btn-cancelar-modal" type="button">Cancelar</button>
        <button class="btn-modal-excluir" id="btn-confirmar-excluir" type="button">Excluir</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  const fechar = () => {
    document.removeEventListener("keydown", escHandler);
    backdrop.remove();
    document.body.style.overflow = "";
  };

  const escHandler = (event) => {
    if (event.key === "Escape") fechar();
  };

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) fechar();
  });

  backdrop.querySelector("#btn-cancelar-modal")?.addEventListener("click", fechar);
  backdrop.querySelector("#btn-confirmar-excluir")?.addEventListener("click", () => {
    fechar();
    excluirImagem(nomeArquivo, cardElement);
  });

  document.addEventListener("keydown", escHandler);
}

async function excluirImagem(nomeArquivo, cardEl) {
  if (!isAdminLogado()) {
    mostrarErro("Acesso negado. FaÃ§a login como admin.");
    setTimeout(() => window.location.href = "/admin/login.html", 1500);
    return;
  }

  try {
    const res = await fetch(API_EXCLUIR_BASE + encodeURIComponent(nomeArquivo), {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + getToken(),
        "Cache-Control": "no-cache"
      }
    });

    if (res.status === 401) {
      mostrarErro("SessÃ£o expirada. FaÃ§a login novamente.");
      fazerLogout();
      return;
    }

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      mostrarErro(erro.mensagem || "Erro ao excluir.");
      return;
    }

    // Aplica fade-out antes de remover o card do DOM.
    if (cardEl) {
      cardEl.style.transition = "opacity .3s, transform .3s";
      cardEl.style.opacity = "0";
      cardEl.style.transform = "scale(0.9)";
      setTimeout(() => {
        cardEl.remove();
        if (!document.querySelector(".gallery-card")) {
          const grid = document.getElementById("gallery-grid") || document.getElementById("galeria-grid");
          if (grid) {
            grid.innerHTML = '<p class="galeria-vazia">Nenhuma imagem cadastrada.</p>';
          }
        }
      }, 300);
    }

    mostrarSucesso("Imagem excluÃ­da com sucesso!");
    await carregarGaleriaAdmin();
  } catch (e) {
    mostrarErro(e.message.includes("fetch")
      ? "Servidor offline. Inicie o Spring Boot."
      : "Erro: " + e.message);
  }
}

function abrirLightbox(indice) {
  const imagens = itensFiltrados().filter((item) => String(item.tipo || "").startsWith("image/"));
  if (!imagens.length) return;

  galeriaState.indiceLightbox = Math.max(0, Math.min(indice, imagens.length - 1));

  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  atualizarLightbox(imagens);
  lightbox.classList.add("open");
  document.body.classList.add("modal-open");
}

function atualizarLightbox(imagens) {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const item = imagens[galeriaState.indiceLightbox];
  const img = lightbox.querySelector("img");
  const caption = lightbox.querySelector(".lightbox-caption");

  if (img) {
    img.src = item.url;
    img.alt = item.titulo;
  }
  if (caption) {
    caption.textContent = item.titulo;
  }
}

function moverLightbox(direcao) {
  const imagens = itensFiltrados().filter((item) => String(item.tipo || "").startsWith("image/"));
  if (!imagens.length) return;

  galeriaState.indiceLightbox += direcao;
  if (galeriaState.indiceLightbox < 0) galeriaState.indiceLightbox = imagens.length - 1;
  if (galeriaState.indiceLightbox >= imagens.length) galeriaState.indiceLightbox = 0;
  atualizarLightbox(imagens);
}

function fecharLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  lightbox.classList.remove("open");
  document.body.classList.remove("modal-open");
  galeriaState.indiceLightbox = -1;
}

function bindLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox || lightbox.dataset.bound === "true") return;
  lightbox.dataset.bound = "true";

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) fecharLightbox();
  });

  lightbox.querySelector("[data-lightbox-close]")?.addEventListener("click", fecharLightbox);
  lightbox.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => moverLightbox(-1));
  lightbox.querySelector("[data-lightbox-next]")?.addEventListener("click", () => moverLightbox(1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") fecharLightbox();
    if (event.key === "ArrowLeft") moverLightbox(-1);
    if (event.key === "ArrowRight") moverLightbox(1);
  });

  const img = lightbox.querySelector("img");
  if (img) {
    img.addEventListener("touchstart", (event) => {
      galeriaState.touchInicioX = event.touches[0].clientX;
    }, { passive: true });

    img.addEventListener("touchend", (event) => {
      const delta = event.changedTouches[0].clientX - galeriaState.touchInicioX;
      if (Math.abs(delta) > 40) moverLightbox(delta > 0 ? -1 : 1);
    }, { passive: true });
  }
}

function renderGaleria(lista = []) {
  galeriaState.itens = (Array.isArray(lista) ? lista : []).map(normalizarItem);
  const visiveis = itensFiltrados();
  const grid = document.getElementById("galeria-grid") || document.getElementById("gallery-grid");

  renderFiltros();
  atualizarContador(visiveis.length);
  renderTabelaAdmin(galeriaState.itens);

  if (!grid) return;

  if (!visiveis.length) {
    grid.innerHTML = '<p class="galeria-vazia">Nenhuma imagem cadastrada.</p>';
    return;
  }

  grid.innerHTML = visiveis.map((item, indice) => renderCard(item, indice)).join("");
  bindAcoesCards();
  bindLightbox();
}

async function carregarGaleria() {
  const lista = await fetch(API_GALERIA, { cache: "no-store" })
    .then((res) => res.json())
    .catch(() => []);

  renderGaleria(lista);
  return lista;
}

async function carregarGaleriaAdmin() {
  return carregarGaleria();
}

window.renderCard = renderCard;
window.categoriaLabel = categoriaLabel;
window.imgFallback = imgFallback;
window.abrirModalExcluir = abrirModalExcluir;
window.excluirImagem = excluirImagem;
window.carregarGaleriaAdmin = carregarGaleriaAdmin;
window.carregarGaleria = carregarGaleria;

document.addEventListener("DOMContentLoaded", carregarGaleria);

