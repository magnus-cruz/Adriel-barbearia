function requireAuth() {
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    window.location.href = "login.html";
  }
}

async function validarSessaoAdmin() {
  // Mantem verificacao simples local para o modo 100% sem dependencias externas.
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    alert("Sua sessao expirou. Faca login novamente.");
    window.location.href = "login.html";
    throw new Error("Sessao expirada");
  }
}

let horariosConfigCache = null;
let selectedUploadFile = null;
let agendamentosCache = [];

function mostrarSucesso(mensagem) {
  alert(mensagem);
}

function mostrarErro(mensagem) {
  alert(mensagem);
}

function atualizarEstadoBotaoUpload(ativo) {
  const botao = document.getElementById("btn-enviar");
  if (!botao) return;

  botao.disabled = !ativo;
  botao.style.opacity = ativo ? "1" : "0.4";
  botao.style.cursor = ativo ? "pointer" : "not-allowed";
}

function limparPreviewUpload() {
  selectedUploadFile = null;

  const input = document.getElementById("input-arquivo");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");

  if (input) input.value = "";
  if (previewWrap) previewWrap.style.display = "none";
  if (previewImg) previewImg.src = "";
  if (previewNome) previewNome.textContent = "";
  atualizarEstadoBotaoUpload(false);
}

function configurarUploadImagem() {
  const input = document.getElementById("input-arquivo");
  const titulo = document.getElementById("titulo-midia");
  const categoria = document.getElementById("categoria-midia");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");

  if (!input) return;

  if (titulo) titulo.required = true;
  if (categoria) categoria.required = true;
  limparPreviewUpload();

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) {
      limparPreviewUpload();
      return;
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!tiposPermitidos.includes(file.type)) {
      mostrarErro("Tipo nao permitido. Use JPG, PNG, WEBP ou MP4.");
      limparPreviewUpload();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      mostrarErro("Arquivo muito grande. Maximo de 10MB.");
      limparPreviewUpload();
      return;
    }

    selectedUploadFile = file;
    const leitor = new FileReader();
    leitor.onload = (event) => {
      if (previewImg) previewImg.src = event.target.result;
      if (previewNome) previewNome.textContent = `${file.name} — ${Math.round(file.size / 1024)} KB`;
      if (previewWrap) previewWrap.style.display = "block";
      atualizarEstadoBotaoUpload(true);
    };
    leitor.readAsDataURL(file);
  });
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.remove("active"));

      btn.classList.add("active");
      const painel = document.getElementById(btn.dataset.tab);
      if (painel) painel.classList.add("active");
    });
  });
}

function initTabsScrollHint() {
  const tabs = document.querySelector(".admin-tabs");
  if (!tabs || tabs.dataset.scrollBound === "true") return;

  const atualizarHint = () => {
    const possuiOverflow = tabs.scrollWidth > tabs.clientWidth + 2;
    const chegouFim = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2;
    tabs.classList.toggle("has-scroll-hint", possuiOverflow && !chegouFim && tabs.dataset.scrolled !== "true");
  };

  tabs.dataset.scrollBound = "true";
  tabs.dataset.scrolled = "false";

  tabs.addEventListener("scroll", () => {
    if (tabs.scrollLeft > 8) tabs.dataset.scrolled = "true";
    atualizarHint();
  });

  window.addEventListener("resize", atualizarHint);
  atualizarHint();
}

function abrirModalExcluir(nomeArquivo, cardElement) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" id="modal-card">
      <div class="modal-titulo">Excluir imagem</div>
      <div class="modal-mensagem">
        Tem certeza que deseja excluir esta imagem?<br>
        <strong style="color:#fdf0d5">${nomeArquivo}</strong><br>
        Esta acao nao pode ser desfeita.
      </div>
      <div class="modal-acoes">
        <button class="btn-modal-cancelar" id="btn-cancelar-modal" type="button">Cancelar</button>
        <button class="btn-modal-excluir" id="btn-confirmar-excluir" type="button">Excluir</button>
      </div>
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

async function carregarServicosAdmin() {
  const servicos = await API.adminServicos.list();
  const tabela = document.getElementById("servicos-tabela");
  if (!tabela) return;

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
}

function editarServico(servico) {
  document.getElementById("servico-id").value = servico.id;
  document.getElementById("servico-nome").value = servico.nome || "";
  document.getElementById("servico-preco").value = servico.preco ?? "";
  document.getElementById("servico-duracao").value = servico.duracaoMinutos ?? "";
  document.getElementById("servico-ativo").checked = !!servico.ativo;
}

async function excluirServico(id) {
  await API.adminServicos.delete(id);
  await carregarServicosAdmin();
}

async function salvarServico(e) {
  e.preventDefault();
  const id = document.getElementById("servico-id").value;
  const payload = {
    nome: document.getElementById("servico-nome").value,
    preco: Number(document.getElementById("servico-preco").value),
    duracaoMinutos: Number(document.getElementById("servico-duracao").value),
    ativo: document.getElementById("servico-ativo").checked
  };

  if (id) await API.adminServicos.update(id, payload);
  else await API.adminServicos.create(payload);

  e.target.reset();
  await carregarServicosAdmin();
}

async function carregarHorariosAdmin() {
  const data = await API.adminHorarios.get();
  horariosConfigCache = data;
  const dias = horariosConfigCache.configuracao?.diasSemana || {};

  const intervalo = document.getElementById("horario-intervalo");
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

  const tabela = document.getElementById("horarios-preview");
  if (!tabela) return;

  tabela.innerHTML = Object.keys(rotulos).map((dia) => {
    const d = dias[dia] || { ativo: false, inicio: null, fim: null };
    return `<tr><td>${rotulos[dia]}</td><td>${d.ativo ? "Ativo" : "Inativo"}</td><td>${d.inicio || "-"}</td><td>${d.fim || "-"}</td><td><button class="btn-acao btn-editar" type="button" onclick="editarHorario('${dia}')">Editar</button></td></tr>`;
  }).join("");

  preencherFormularioHorario(document.getElementById("horario-dia").value);
}

function preencherFormularioHorario(dia) {
  const dias = horariosConfigCache?.configuracao?.diasSemana || {};
  const confDia = dias[dia] || { ativo: false, inicio: null, fim: null };

  document.getElementById("horario-dia").value = dia;
  document.getElementById("horario-ativo").checked = !!confDia.ativo;
  document.getElementById("horario-inicio").value = confDia.inicio || "";
  document.getElementById("horario-fim").value = confDia.fim || "";
}

function editarHorario(dia) {
  preencherFormularioHorario(dia);
}

async function salvarHorarios(e) {
  e.preventDefault();

  const dia = document.getElementById("horario-dia").value;
  const ativo = document.getElementById("horario-ativo").checked;
  const inicio = document.getElementById("horario-inicio").value;
  const fim = document.getElementById("horario-fim").value;
  const intervalo = Number(document.getElementById("horario-intervalo").value);

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

  await API.adminHorarios.update(horariosConfigCache);
  alert("Horarios atualizados.");
  await carregarHorariosAdmin();
}

function limparFormularioHorario() {
  preencherFormularioHorario(document.getElementById("horario-dia").value);
}

async function carregarImprevistos() {
  const itens = await API.adminImprevistos.list();
  const tabela = document.getElementById("imprevistos-lista");
  if (!tabela) return;

  tabela.innerHTML = itens.map((item) => `
    <tr>
      <td>${item.data}</td>
      <td>${item.periodo}</td>
      <td>${item.motivo}</td>
      <td><button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirImprevisto(${item.id})">Excluir</button></td>
    </tr>
  `).join("");
}

async function excluirImprevisto(id) {
  await API.adminImprevistos.delete(id);
  await carregarImprevistos();
}

async function salvarImprevisto(e) {
  e.preventDefault();
  await API.adminImprevistos.create({
    data: document.getElementById("imp-data").value,
    periodo: document.getElementById("imp-periodo").value,
    motivo: document.getElementById("imp-motivo").value
  });
  e.target.reset();
  await carregarImprevistos();
}

async function carregarMidiasAdmin() {
  await API.carregarGaleria();
}

async function excluirMidia(id) {
  await API.adminMidias.delete(id);
  await carregarMidiasAdmin();
}

async function uploadFoto(e) {
  e.preventDefault();

  const arquivo = selectedUploadFile || document.getElementById("input-arquivo")?.files?.[0];
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

  const progressWrap = document.getElementById("upload-progress-wrap");
  const progress = document.getElementById("upload-progress");
  const progressLabel = document.getElementById("upload-progress-label");
  const cancelButton = document.getElementById("upload-cancel");

  if (progressWrap) progressWrap.style.display = "block";
  if (cancelButton) cancelButton.style.display = "inline-flex";
  if (progress) progress.value = 0;
  if (progressLabel) progressLabel.textContent = "0%";

  if (cancelButton) {
    cancelButton.onclick = () => API.cancelUpload();
  }

  try {
    const online = await API.checkServerOnline();
    if (!online) {
      throw new Error("Spring Boot nao esta rodando. Inicie o servidor.");
    }

    const payload = await API.uploadMidia(arquivo, { titulo, categoria }, (percentual) => {
      if (progress) progress.value = percentual;
      if (progressLabel) progressLabel.textContent = `${percentual}%`;
    });

    await API.carregarGaleria();
    mostrarSucesso("Imagem adicionada a galeria!");
    mostrarSucesso(`Upload concluido com sucesso. URL: ${payload?.arquivo?.url || "(sem URL)"}`);
    e.target.reset();
    limparPreviewUpload();
  } catch (error) {
    const message = error?.message || "Falha ao enviar imagem.";
    mostrarErro(`Erro no upload: ${message}`);
  } finally {
    if (cancelButton) cancelButton.style.display = "none";
    if (progressWrap) progressWrap.style.display = "none";
  }
}

async function salvarVideo(e) {
  e.preventDefault();
  await API.adminMidias.createVideo({
    categoria: document.getElementById("video-categoria").value,
    titulo: document.getElementById("video-titulo").value,
    url: document.getElementById("video-url").value
  });
  e.target.reset();
  await carregarMidiasAdmin();
}

async function carregarCursos() {
  const cursos = await API.adminCursos.list();
  const tabela = document.getElementById("cursos-lista");
  if (!tabela) return;

  tabela.innerHTML = cursos.map((curso) => `
    <tr>
      <td>${curso.titulo}</td>
      <td>R$ ${Number(curso.preco || 0).toFixed(2)}</td>
      <td>${curso.cargaHoraria}</td>
      <td>
        <div class="acoes-cell">
          <button class="btn-acao btn-editar" type="button" onclick='editarCurso(${JSON.stringify(curso)})'>Editar</button>
          <button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirCurso(${curso.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function editarCurso(curso) {
  document.getElementById("curso-id").value = curso.id;
  document.getElementById("curso-titulo").value = curso.titulo || "";
  document.getElementById("curso-descricao").value = curso.descricao || "";
  document.getElementById("curso-preco").value = curso.preco ?? "";
  document.getElementById("curso-carga").value = curso.cargaHoraria || "";
  document.getElementById("curso-imagem").value = curso.imagemUrl || "";
  document.getElementById("curso-link").value = curso.linkCompra || "";
}

async function excluirCurso(id) {
  await API.adminCursos.delete(id);
  await carregarCursos();
}

async function salvarCurso(e) {
  e.preventDefault();
  const id = document.getElementById("curso-id").value;
  const payload = {
    titulo: document.getElementById("curso-titulo").value,
    descricao: document.getElementById("curso-descricao").value,
    preco: Number(document.getElementById("curso-preco").value),
    cargaHoraria: document.getElementById("curso-carga").value,
    imagemUrl: document.getElementById("curso-imagem").value,
    linkCompra: document.getElementById("curso-link").value
  };

  if (id) await API.adminCursos.update(id, payload);
  else await API.adminCursos.create(payload);

  e.target.reset();
  await carregarCursos();
}

async function carregarAgendamentos() {
  const data = document.getElementById("filtro-data")?.value || "";
  agendamentosCache = await API.adminAgendamentos.list(data);
  filtrarAgendamentos();
}

function formatarData(dataIso) {
  if (!dataIso || !String(dataIso).includes("-")) return dataIso || "-";
  const [ano, mes, dia] = String(dataIso).split("-");
  return `${dia}/${mes}/${ano}`;
}

function badgeStatus(status) {
  const valor = String(status || "pendente").toLowerCase();
  const estilos = {
    confirmado: "color:#4caf50",
    pendente: "color:#f59e0b",
    cancelado: "color:#c1121f",
    concluido: "color:rgba(253,240,213,0.4)"
  };
  const estilo = estilos[valor] || estilos.pendente;
  return `<span style="font-size:0.82rem;${estilo}">● ${valor}</span>`;
}

function renderizarAgendamento(ag) {
  const status = String(ag?.status || "pendente").toLowerCase();
  const jaFinalizado = status === "cancelado" || status === "concluido";

  const acoes = jaFinalizado
    ? `<span style="font-size:0.75rem;color:rgba(253,240,213,0.25);letter-spacing:0.08em;text-transform:uppercase;">-</span>`
    : `<button class="btn secondary btn-cancelar-ag" type="button" onclick="cancelarAgendamento(${ag.id}, this)">Cancelar</button>`;

  return `
    <tr>
      <td>${ag.nome || "-"}</td>
      <td>${ag.servico || "-"}</td>
      <td>${formatarData(ag.data)}</td>
      <td>${ag.horario || "-"}</td>
      <td>${badgeStatus(status)}</td>
      <td>${acoes}</td>
    </tr>
  `;
}

function filtrarAgendamentos() {
  const tabela = document.getElementById("agendamentos-lista");
  if (!tabela) return;

  const filtro = (document.getElementById("filtro-status")?.value || "todos").toLowerCase();
  const filtrados = agendamentosCache.filter((agendamento) => {
    const status = String(agendamento?.status || "pendente").toLowerCase();
    return filtro === "todos" || status === filtro;
  });

  if (!filtrados.length) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum agendamento encontrado para o filtro selecionado.</td></tr>';
    return;
  }

  tabela.innerHTML = filtrados.map((agendamento) => renderizarAgendamento(agendamento)).join("");
}

async function cancelarAgendamento(id, botao) {
  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Cancelando...";
    }

    await API.adminAgendamentos.cancel(id);
    await carregarAgendamentos();
  } catch (error) {
    alert(error?.message || "Nao foi possivel cancelar o agendamento.");
  }
}

function bindLogout() {
  const botao = document.getElementById("logout");
  if (!botao) return;
  botao.addEventListener("click", () => {
    if (typeof fazerLogout === "function") {
      fazerLogout();
    } else {
      window.location.href = "login.html";
    }
  });
}

window.abrirModalExcluir = abrirModalExcluir;
window.filtrarAgendamentos = filtrarAgendamentos;
window.editarServico = editarServico;
window.excluirServico = excluirServico;
window.editarHorario = editarHorario;
window.excluirImprevisto = excluirImprevisto;
window.excluirCurso = excluirCurso;
window.cancelarAgendamento = cancelarAgendamento;

window.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  await validarSessaoAdmin();

  bindTabs();
  initTabsScrollHint();
  bindLogout();
  configurarUploadImagem();

  document.getElementById("form-servico").addEventListener("submit", salvarServico);
  document.getElementById("form-horarios").addEventListener("submit", salvarHorarios);
  document.getElementById("horario-dia").addEventListener("change", (event) => preencherFormularioHorario(event.target.value));
  document.getElementById("horarios-reset").addEventListener("click", limparFormularioHorario);
  document.getElementById("form-imprevisto").addEventListener("submit", salvarImprevisto);
  document.getElementById("form-foto").addEventListener("submit", uploadFoto);
  document.getElementById("form-video").addEventListener("submit", salvarVideo);
  document.getElementById("form-curso").addEventListener("submit", salvarCurso);
  document.getElementById("btn-filtrar-data").addEventListener("click", carregarAgendamentos);

  await carregarServicosAdmin();
  await carregarHorariosAdmin();
  await carregarImprevistos();
  await carregarMidiasAdmin();
  await carregarCursos();
  await carregarAgendamentos();
});
