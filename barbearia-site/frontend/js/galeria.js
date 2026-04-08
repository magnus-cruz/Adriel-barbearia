let midiasCache = [];

function renderMidias(categoria = "Todos") {
  const grid = document.getElementById("galeria-grid");
  const filtrado = categoria === "Todos" ? midiasCache : midiasCache.filter((m) => m.categoria === categoria);

  grid.innerHTML = filtrado.map((m) => {
    if (m.tipo === "video") {
      return `<article class="card"><iframe src="${m.url}" title="${m.titulo}" allowfullscreen></iframe><p class="small">${m.categoria} - ${m.titulo}</p></article>`;
    }
    const urlImagem = m.url.startsWith("http") ? m.url : `http://localhost:8080${m.url}`;
    return `<article class="card"><img src="${urlImagem}" data-img="${m.url}" alt="${m.titulo}"><p class="small">${m.categoria} - ${m.titulo}</p></article>`;
  }).join("");

  document.querySelectorAll("[data-img]").forEach((img) => {
    img.addEventListener("click", () => abrirLightbox(img.dataset.img));
    if (img.dataset.img.startsWith("http")) img.src = img.dataset.img;
    else img.src = `http://localhost:8080${img.dataset.img}`;
  });
}

function abrirLightbox(url) {
  const lightbox = document.getElementById("lightbox");
  const img = lightbox.querySelector("img");
  img.src = url.startsWith("http") ? url : `http://localhost:8080${url}`;
  lightbox.style.display = "grid";
}

async function iniciarGaleria() {
  midiasCache = await API.getMidias();
  const categorias = ["Todos", ...new Set(midiasCache.map((m) => m.categoria))];
  document.getElementById("filtros").innerHTML = categorias
    .map((c) => `<button class="tab-btn ${c === 'Todos' ? 'active' : ''}" data-cat="${c}">${c}</button>`)
    .join("");

  renderMidias();

  document.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-cat]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderMidias(btn.dataset.cat);
    });
  });

  document.getElementById("lightbox").addEventListener("click", () => {
    document.getElementById("lightbox").style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", iniciarGaleria);
