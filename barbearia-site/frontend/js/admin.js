function requireAuth() {
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    window.location.href = "login.html";
  }
}

async function validarSessaoAdmin() {
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    alert("Sua sessao expirou. Faca login novamente.");
    window.location.href = "login.html";
    throw new Error("Sessao expirada");
  }
}

let horariosConfigCache = null;
let selectedUploadFile = null;
let agendamentosCache = [];
window.arquivoSelecionado = null;

/* ============================================================
   METADADOS E CONTROLE DE ABAS (sidebar)
   ============================================================ */
const abas = {
  servicos: {
    titulo: "Servicos e Precos",
    desc:   "Gerencie os servicos, precos e duracao.",
    fn:     () => carregarServicos()
  },
  barbeiros: {
    titulo: "Barbeiros",
    desc:   "Adicione e remova barbeiros da equipe.",
    fn:     () => carregarBarbeiros()
  },
  horarios: {
    titulo: "Horarios Disponiveis",
    desc:   "Configure os horarios de atendimento por dia.",
    fn:     () => carregarHorarios()
  },
  imprevistos: {
    titulo: "Imprevistos / Bloqueios",
    desc:   "Bloqueie datas e periodos especificos.",
    fn:     () => carregarImprevistos()
  },
  galeria: {
    titulo: "Galeria de Fotos",
    desc:   "Faca upload e gerencie as fotos do estabelecimento.",
    fn:     () => carregarMidiasAdmin()
  },
  cursos: {
    titulo: "Cursos Profissionais",
    desc:   "Gerencie os cursos disponiveis para venda.",
    fn:     () => carregarCursos()
  },
  agendamentos: {
    titulo: "Agendamentos",
    desc:   "Visualize e gerencie todos os agendamentos.",
    fn:     () => carregarAgendamentos()
  }
};

function switchTab(btn, chave) {
  document.querySelectorAll(".sidebar-item")
    .forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("ativo"));

  btn.classList.add("active");
  const tab = document.getElementById("tab-" + chave);
  if (tab) tab.classList.add("ativo");

  const meta = abas[chave];
  if (meta) {
    document.getElementById("breadcrumb-atual").textContent = meta.titulo;
    document.getElementById("secao-titulo").textContent = meta.titulo;
    document.getElementById("secao-desc").textContent = meta.desc;
    document.querySelector(".admin-main")
      .scrollTo({ top: 0, behavior: "smooth" });
    meta.fn();
  }
}

/* ============================================================
   BADGES (contadores da sidebar)
   ============================================================ */
async function atualizarBadges() {
  try {
    const [servicos, barbeiros, imprevistos, galeria, cursos, agendamentos] =
      await Promise.all([
        fetch("http://localhost:8080/api/servicos?_=" + Date.now())
          .then((r) => r.json()),
        fetch("http://localhost:8080/api/barbeiros?_=" + Date.now())
          .then((r) => r.json()),
        fetch("http://localhost:8080/api/admin/imprevistos?_=" + Date.now(), {
          headers: { Authorization: "Bearer " + getToken() }
        }).then((r) => r.json()),
        fetch("http://localhost:8080/api/galeria?_=" + Date.now())
          .then((r) => r.json()),
        fetch("http://localhost:8080/api/cursos?_=" + Date.now())
          .then((r) => r.json()),
        fetch("http://localhost:8080/api/agendamentos?_=" + Date.now() + "&status=confirmado")
          .then((r) => r.json())
      ]);

    setBadge("badge-servicos",     servicos.length);
    setBadge("badge-barbeiros",    barbeiros.length);
    setBadge("badge-imprevistos",  imprevistos.length);
    setBadge("badge-galeria",      galeria.length);
    setBadge("badge-cursos",       cursos.length);
    setBadge("badge-agendamentos", agendamentos.length);

  } catch (e) {
    console.error("Badges:", e.message);
  }
}

function setBadge(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  if (valor > 0) {
    el.textContent = valor > 99 ? "99+" : valor;
    el.classList.add("visivel");
  } else {
    el.classList.remove("visivel");
  }
}

/* ============================================================
   TOASTS E UTILITARIOS
   ============================================================ */
function mostrarSucesso(mensagem) {
  mostrarToast(mensagem, "sucesso");
}

function mostrarErro(mensagem) {
  mostrarToast(mensagem, "erro");
}

function mostrarToast(msg, tipo) {
  const cores = {
    sucesso: {
      bg: "rgba(23,23,20,0.97)",
      borda: "var(--dark-goldenrod)",
      texto: "var(--pale-oak)"
    },
    erro: {
      bg: "rgba(23,23,20,0.97)",
      borda: "#e05555",
      texto: "#e05555"
    }
  };
  const c = cores[tipo] || cores.sucesso;

  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    background: ${c.bg};
    border-left: 3px solid ${c.borda};
    color: ${c.texto};
    padding: 0.9rem 1.4rem;
    border-radius: 4px;
    font-family: 'Barlow', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 99998;
    max-width: 320px;
    line-height: 1.5;
    box-shadow: 2px 2px 12px rgba(0,0,0,0.5);
    animation: slideInToast 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function renderEstadoTabela(tbody, colunas, mensagem, cor = "rgba(253,240,213,.3)") {
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colunas}" style="text-align:center;color:${cor};padding:1.5rem">
        ${mensagem}
      </td>
    </tr>`;
}

function atualizarEstadoBotaoUpload(ativo) {
  const botao = document.getElementById("btn-enviar");
  if (!botao) return;
  botao.disabled = !ativo;
  botao.style.opacity = ativo ? "1" : "0.4";
  botao.style.cursor = ativo ? "pointer" : "not-allowed";
}

function atualizarProgresso(pct) {
  const wrap = document.getElementById("progress-wrap");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-pct");

  if (wrap) wrap.style.display = "block";
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
}

function resetarProgresso() {
  atualizarProgresso(0);
  const wrap = document.getElementById("progress-wrap");
  if (wrap) wrap.style.display = "none";
}

function limparPreviewUpload() {
  selectedUploadFile = null;
  window.arquivoSelecionado = null;

  const input = document.getElementById("file-upload");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");
  const dropZone = document.getElementById("drop-zone");
  const textoPrincipal = dropZone?.querySelector(".text span");
  const botao = document.getElementById("btn-enviar");

  if (input) input.value = "";
  if (previewWrap) previewWrap.style.display = "none";
  if (previewImg) previewImg.src = "";
  if (previewNome) previewNome.textContent = "";
  if (textoPrincipal) textoPrincipal.textContent = "Clique ou arraste a imagem aqui";
  if (dropZone) {
    dropZone.classList.remove("drag-over");
    dropZone.style.borderColor = "var(--taupe)";
  }
  if (botao) {
    botao.disabled = true;
    botao.style.opacity = "0.4";
    dropZone.style.borderColor = "var(--taupe)";
  }
  if (botao) {
    botao.disabled = true;
    botao.style.opacity = "0.4";
    botao.style.cursor = "not-allowed";
  }
}

function processarArquivo(arquivo) {
  const dropZone = document.getElementById("drop-zone");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");
  const textoPrincipal = dropZone?.querySelector(".text span");

  if (!arquivo) {
    limparPreviewUpload();
    return;
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
  if (!tiposPermitidos.includes(arquivo.type)) {
    mostrarErro("Tipo nao permitido. Use JPG, PNG, WEBP ou MP4.");
    limparPreviewUpload();
    return;
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    mostrarErro("Arquivo muito grande. Maximo de 10MB.");
    limparPreviewUpload();
    return;
  }

  selectedUploadFile = arquivo;
  window.arquivoSelecionado = arquivo;

  const leitor = new FileReader();
  leitor.onload = (event) => {
    if (previewImg) previewImg.src = event.target.result;
    if (previewNome) {
      previewNome.textContent = `${arquivo.name} - ${(arquivo.size / 1024).toFixed(0)} KB`;
    }
    if (previewWrap) previewWrap.style.display = "block";
    if (textoPrincipal) textoPrincipal.textContent = `✓ ${arquivo.name}`;
    if (dropZone) dropZone.style.borderColor = "var(--dark-goldenrod)";
    atualizarEstadoBotaoUpload(true);
  };
  leitor.readAsDataURL(arquivo);
}

function configurarUploadImagem() {
  const dropZone = document.getElementById("drop-zone");
  const input = document.getElementById("file-upload");

  if (!dropZone || !input) return;

  limparPreviewUpload();

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const arquivo = event.dataTransfer?.files?.[0];
    if (arquivo) processarArquivo(arquivo);
  });

  input.addEventListener("change", () => {
    const arquivo = input.files && input.files[0];
    if (arquivo) processarArquivo(arquivo);
    else limparPreviewUpload();
  });
}

/* ============================================================
   MODAIS
   ============================================================ */
function abrirModalExcluir(nomeArquivo, cardElement) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" id="modal-card">
      <div class="modal-titulo">Excluir imagem</div>
      <div class="modal-mensagem">
        Tem certeza que deseja excluir esta imagem?<br>
        <strong style="color:var(--pale-oak)">${nomeArquivo}</strong><br>
        Esta acao nao pode ser desfeita.
      </div>
      <div class="modal-acoes">
        <button class="btn-modal-cancelar" id="btn-cancelar-modal" type="button">Cancelar</button>
        <button class="btn-modal-excluir" id="btn-confirmar-excluir" type="button">Excluir</button>
      </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  function fechar() {
    document.removeEventListener("keydown", escHandler);
    backdrop.remove();
    document.body.style.overflow = "";
  }

  function escHandler(event) {
    if (event.key === "Escape") fechar();
  }

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

function abrirModalConfirmar(titulo, mensagem, onConfirmar) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" id="modal-card">
      <div class="modal-titulo">${titulo}</div>
      <div class="modal-mensagem">${mensagem}</div>
      <div class="modal-acoes">
        <button class="btn-modal-cancelar" id="btn-cancelar-modal" type="button">Cancelar</button>
        <button class="btn-modal-excluir" id="btn-confirmar-modal" type="button">Confirmar</button>
      </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  function fechar() {
    document.removeEventListener("keydown", escHandler);
    backdrop.remove();
    document.body.style.overflow = "";
  }

  function escHandler(event) {
    if (event.key === "Escape") fechar();
  }

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) fechar();
  });

  backdrop.querySelector("#btn-cancelar-modal")?.addEventListener("click", fechar);
  backdrop.querySelector("#btn-confirmar-modal")?.addEventListener("click", async () => {
    fechar();
    if (typeof onConfirmar === "function") await onConfirmar();
  });

  document.addEventListener("keydown", escHandler);
}

/* ============================================================
   CRUD — BARBEIROS
   ============================================================ */
async function carregarBarbeiros() {
  const tbody = document.getElementById("tbody-barbeiros");
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--pale-oak-dim);padding:2rem">Carregando...</td></tr>';

  try {
    const res = await fetch("http://localhost:8080/api/barbeiros?_=" + Date.now(), {
      headers: { "Cache-Control": "no-cache" }
    });
    const lista = await res.json();

    if (!Array.isArray(lista) || !lista.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--pale-oak-dim);padding:2rem">Nenhum barbeiro cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map((b) => `
      <tr id="barbeiro-${b.id}">
        <td>
          <img src="${b.fotoUrl || ""}" alt="${b.nome}" onerror="this.src=''" style="width:40px;height:40px;object-fit:cover;border-radius:50%;border:1px solid var(--taupe-border)">
        </td>
        <td>${b.nome}</td>
        <td>${b.especialidade || "-"}</td>
        <td style="color:var(--dark-goldenrod)">${b.instagram || "-"}</td>
        <td>
          <span style="font-size:.78rem;color:${b.ativo ? "#4caf50" : "var(--pale-oak-dim)"}">
            ${b.ativo ? "● Ativo" : "● Inativo"}
          </span>
        </td>
        <td class="acoes-cell">
          <button class="btn-acao btn-excluir-tabela" onclick="removerBarbeiro(${b.id}, '${String(b.nome).replace(/'/g, "\\'")}')">Remover</button>
        </td>
      </tr>
    `).join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#e05555;padding:2rem">Erro: ${e.message}</td></tr>`;
  }
}

async function salvarBarbeiro() {
  const nome = document.getElementById("nome-barbeiro")?.value.trim() || "";
  const espec = document.getElementById("espec-barbeiro")?.value.trim() || "";
  const insta = document.getElementById("insta-barbeiro")?.value.trim() || "";
  const fotoEl = document.getElementById("foto-barbeiro");
  const btn = document.getElementById("btn-salvar-barbeiro");

  if (!nome) {
    mostrarErro("Nome do barbeiro e obrigatorio.");
    return;
  }

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("especialidade", espec);
  formData.append("instagram", insta);
  if (fotoEl?.files?.[0]) formData.append("foto", fotoEl.files[0]);

  if (btn) {
    btn.textContent = "Salvando...";
    btn.disabled = true;
  }

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/api/admin/barbeiros");
    xhr.setRequestHeader("Authorization", "Bearer " + getToken());

    xhr.onload = async () => {
      if (btn) {
        btn.textContent = "Adicionar Barbeiro";
        btn.disabled = false;
      }
      let resp = {};
      try { resp = JSON.parse(xhr.responseText || "{}"); } catch (_) { resp = {}; }

      if (xhr.status === 200) {
        mostrarSucesso("Barbeiro adicionado!");
        document.getElementById("nome-barbeiro").value = "";
        document.getElementById("espec-barbeiro").value = "";
        document.getElementById("insta-barbeiro").value = "";
        if (fotoEl) fotoEl.value = "";
        const label = document.getElementById("label-foto-barbeiro");
        if (label) label.textContent = "Clique para selecionar foto";
        const preview = document.getElementById("preview-barbeiro");
        if (preview) preview.style.display = "none";
        await carregarBarbeiros();
      } else {
        mostrarErro(resp.mensagem || "Erro ao salvar.");
      }
    };

    xhr.onerror = () => {
      if (btn) {
        btn.textContent = "Adicionar Barbeiro";
        btn.disabled = false;
      }
      mostrarErro("Servidor offline.");
    };

    xhr.send(formData);
  } catch (e) {
    if (btn) {
      btn.textContent = "Adicionar Barbeiro";
      btn.disabled = false;
    }
    mostrarErro("Erro: " + e.message);
  }
}

function removerBarbeiro(id, nome) {
  abrirModalConfirmar(
    "Remover Barbeiro",
    `Tem certeza que deseja remover <strong>${nome}</strong>? Esta acao nao pode ser desfeita.`,
    async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/barbeiros/" + id, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + getToken() }
        });
        const resp = await res.json();
        if (res.ok) {
          mostrarSucesso("Barbeiro removido!");
          await carregarBarbeiros();
        } else {
          mostrarErro(resp.mensagem || "Erro ao remover.");
        }
      } catch (e) {
        mostrarErro("Erro: " + e.message);
      }
    }
  );
}

/* ============================================================
   CRUD — SERVICOS
   ============================================================ */
async function carregarServicos() {
  const tabela = document.getElementById("tbody-servicos");
  if (!tabela) return;

  renderEstadoTabela(tabela, 4, "Carregando...");

  try {
    const servicos = await API.adminServicos.list();
    if (!Array.isArray(servicos) || !servicos.length) {
      renderEstadoTabela(tabela, 4, "Nenhum servico cadastrado.");
      return;
    }

    tabela.innerHTML = servicos.map((servico) => `
    <tr>
      <td>${servico.nome}</td>
      <td>R$ ${Number(servico.preco || 0).toFixed(2)}</td>
      <td>${servico.duracaoMinutos} min</td>
      <td>
        <div class="acoes-cell">
          <button class="btn-acao btn-editar" type="button" onclick='editarServico(${JSON.stringify(servico)})'>Editar</button>
          <button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirServico(${servico.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
  } catch (erro) {
    renderEstadoTabela(tabela, 4, `Erro ao carregar. <br><small>${erro?.message || "Falha na API."}</small>`, "#e05555");
  }
}

function editarServico(servico) {
  document.getElementById("servico-id").value = servico.id;
  document.getElementById("nome-servico").value = servico.nome || "";
  document.getElementById("preco-servico").value = servico.preco ?? "";
  document.getElementById("duracao-servico").value = servico.duracaoMinutos ?? "";
  document.getElementById("ativo-servico").checked = !!servico.ativo;
}

async function excluirServico(id) {
  await API.adminServicos.delete(id);
  await carregarServicos();
}

async function salvarServico(e) {
  e.preventDefault();
  const id = document.getElementById("servico-id").value;
  const payload = {
    nome: document.getElementById("nome-servico").value,
    preco: Number(document.getElementById("preco-servico").value),
    duracaoMinutos: Number(document.getElementById("duracao-servico").value),
    ativo: document.getElementById("ativo-servico").checked
  };

  try {
    if (id) await API.adminServicos.update(id, payload);
    else await API.adminServicos.create(payload);

    e.target.reset();
    mostrarSucesso("Servico salvo com sucesso!");
    await carregarServicos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar servico: ${erro?.message || "falha desconhecida"}`);
  }
}

/* ============================================================
   CRUD — HORARIOS
   ============================================================ */
async function carregarHorarios() {
  const tabela = document.getElementById("tbody-horarios");
  if (!tabela) return;

  renderEstadoTabela(tabela, 5, "Carregando...");
  try {
    const data = await API.adminHorarios.get();
    horariosConfigCache = data;
    const dias = horariosConfigCache.configuracao?.diasSemana || {};

    const intervalo = document.getElementById("intervalo-padrao");
    if (intervalo) intervalo.value = horariosConfigCache.configuracao?.intervaloPadrao || 30;

    const rotulos = {
      segunda: "Segunda",
      terca: "Terca",
      quarta: "Quarta",
      quinta: "Quinta",
      sexta: "Sexta",
      sabado: "Sabado",
      domingo: "Domingo"
    };

    tabela.innerHTML = Object.keys(rotulos).map((dia) => {
      const d = dias[dia] || { ativo: false, inicio: null, fim: null };
      return `<tr><td>${rotulos[dia]}</td><td>${d.ativo ? "Ativo" : "Inativo"}</td><td>${d.inicio || "-"}</td><td>${d.fim || "-"}</td><td><button class="btn-acao btn-editar" type="button" onclick="editarHorario('${dia}')">Editar</button></td></tr>`;
    }).join("");

    preencherFormularioHorario(document.getElementById("dia-semana").value);
  } catch (erro) {
    renderEstadoTabela(tabela, 5, `Erro ao carregar horarios.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
  }
}

function preencherFormularioHorario(dia) {
  const dias = horariosConfigCache?.configuracao?.diasSemana || {};
  const confDia = dias[dia] || { ativo: false, inicio: null, fim: null };

  document.getElementById("dia-semana").value = dia;
  document.getElementById("dia-ativo").checked = !!confDia.ativo;
  document.getElementById("inicio-horario").value = confDia.inicio || "";
  document.getElementById("fim-horario").value = confDia.fim || "";
}

function editarHorario(dia) {
  preencherFormularioHorario(dia);
}

async function salvarHorario(e) {
  e.preventDefault();

  const dia = document.getElementById("dia-semana").value;
  const ativo = document.getElementById("dia-ativo").checked;
  const inicio = document.getElementById("inicio-horario").value;
  const fim = document.getElementById("fim-horario").value;
  const intervalo = Number(document.getElementById("intervalo-padrao").value);

  if (!horariosConfigCache?.configuracao) {
    horariosConfigCache = { configuracao: { intervaloPadrao: 30, diasSemana: {} } };
  }

  if (!horariosConfigCache.configuracao.diasSemana) {
    horariosConfigCache.configuracao.diasSemana = {};
  }

  horariosConfigCache.configuracao.intervaloPadrao = intervalo;
  horariosConfigCache.configuracao.diasSemana[dia] = {
    inicio: ativo ? inicio || null : null,
    fim: ativo ? fim || null : null,
    ativo
  };

  try {
    await API.adminHorarios.update(horariosConfigCache);
    mostrarSucesso("Horario salvo com sucesso!");
    await carregarHorarios();
  } catch (erro) {
    mostrarErro(`Erro ao salvar horario: ${erro?.message || "falha desconhecida"}`);
  }
}

function limparFormularioHorario() {
  preencherFormularioHorario(document.getElementById("dia-semana").value);
}

/* ============================================================
   CRUD — IMPREVISTOS
   ============================================================ */
async function carregarImprevistos() {
  const tabela = document.getElementById("tbody-imprevistos");
  if (!tabela) return;

  renderEstadoTabela(tabela, 4, "Carregando...");

  try {
    const itens = await API.adminImprevistos.list();
    if (!Array.isArray(itens) || !itens.length) {
      renderEstadoTabela(tabela, 4, "Nenhum imprevisto cadastrado.");
      return;
    }

    tabela.innerHTML = itens.map((item) => `
    <tr>
      <td>${item.data}</td>
      <td>${item.periodo}</td>
      <td>${item.motivo}</td>
      <td><button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirImprevisto(${item.id})">Excluir</button></td>
    </tr>
  `).join("");
  } catch (erro) {
    renderEstadoTabela(tabela, 4, `Erro ao carregar.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
  }
}

async function excluirImprevisto(id) {
  await API.adminImprevistos.delete(id);
  await carregarImprevistos();
}

async function salvarImprevisto(e) {
  e.preventDefault();
  try {
    await API.adminImprevistos.create({
      data: document.getElementById("data-imprevisto").value,
      periodo: document.getElementById("periodo-imprevisto").value,
      motivo: document.getElementById("motivo-imprevisto").value
    });
    e.target.reset();
    mostrarSucesso("Bloqueio adicionado!");
    await carregarImprevistos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar imprevisto: ${erro?.message || "falha desconhecida"}`);
  }
}

/* ============================================================
   CRUD — MIDIAS / GALERIA
   ============================================================ */
async function carregarMidiasAdmin() {
  await API.carregarGaleria();
}

async function excluirMidia(id) {
  await API.adminMidias.delete(id);
  await carregarMidiasAdmin();
}

function uploadMidia(arquivo, titulo, categoria, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
      reject(new Error("Faca login como administrador primeiro."));
      return;
    }

    const token = typeof getToken === "function" ? getToken() : "";
    if (!token) {
      reject(new Error("Token nao encontrado. Faca login novamente."));
      return;
    }

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("titulo", titulo);
    formData.append("categoria", categoria);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percentual = Math.round((event.loaded / event.total) * 100);
      onProgress(percentual);
    });

    xhr.addEventListener("load", () => {
      let resposta = {};
      try {
        resposta = JSON.parse(xhr.responseText || "{}");
      } catch (error) {
        reject(new Error("Resposta invalida do servidor."));
        return;
      }

      if (xhr.status === 200 && (resposta.status === "success" || resposta.status === "sucesso")) {
        resolve(resposta);
        return;
      }

      if (xhr.status === 401) {
        reject(new Error("Sessao expirada. Faca login novamente."));
        return;
      }

      reject(new Error(resposta.mensagem || "Falha desconhecida."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Servidor offline. Inicie o Spring Boot."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelado."));
    });

    xhr.open("POST", "http://localhost:8080/api/admin/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

function diagnosticarToken() {
  const token = typeof getToken === "function" ? getToken() : "";
  const logado = typeof isAdminLogado === "function" ? isAdminLogado() : false;

  console.log("=== DIAGNOSTICO TOKEN ===");
  console.log("Logado:", logado);
  console.log("Token:", token);
  console.log("Header que sera enviado:", `Bearer ${token}`);

  alert(`Logado: ${logado}\nToken: ${token}\nVerifique o console (F12).`);
}

async function uploadFoto(e) {
  e.preventDefault();

  const arquivo = window.arquivoSelecionado || selectedUploadFile || document.getElementById("file-upload")?.files?.[0];
  const titulo = (document.getElementById("titulo-midia")?.value || "").trim();
  const categoria = document.getElementById("categoria-midia")?.value || "galeria";

  if (!titulo) {
    mostrarErro("Informe um titulo para a imagem antes de enviar.");
    return;
  }

  if (!arquivo) {
    mostrarErro("Selecione uma imagem para enviar.");
    return;
  }

  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    mostrarErro("Faca login como administrador primeiro.");
    setTimeout(() => { window.location.href = "login.html"; }, 1500);
    return;
  }

  const progressWrap = document.getElementById("progress-wrap");
  if (progressWrap) progressWrap.style.display = "block";
  atualizarProgresso(0);

  try {
    const online = await API.checkServerOnline();
    if (!online) throw new Error("Spring Boot nao esta rodando. Inicie o servidor.");

    await uploadMidia(arquivo, titulo, categoria, (percentual) => {
      atualizarProgresso(percentual);
    });

    await API.carregarGaleria();
    mostrarSucesso("Imagem adicionada a galeria com sucesso!");
    e.target.reset();
    limparPreviewUpload();
  } catch (error) {
    const message = error?.message || "Falha ao enviar imagem.";
    if (message.toLowerCase().includes("sessao expirada")) {
      mostrarErro(message);
      if (typeof fazerLogout === "function") fazerLogout();
      return;
    }
    mostrarErro(`Erro no upload: ${message}`);
  } finally {
    resetarProgresso();
  }
}

async function salvarVideo(e) {
