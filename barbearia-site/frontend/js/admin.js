function requireAuth() {
  if (!localStorage.getItem("adminToken")) {
    window.location.href = "login.html";
  }
}

async function validarSessaoAdmin() {
  try {
    await API.adminCheck();
  } catch (error) {
    localStorage.removeItem("adminToken");
    alert("Sua sessao expirou. Faca login novamente.");
    window.location.href = "login.html";
    throw error;
  }
}

let horariosConfigCache = null;

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

async function carregarServicosAdmin() {
  const servicos = await API.adminServicos.list();
  document.getElementById("servicos-tabela").innerHTML = servicos.map((s) => `
    <tr>
      <td>${s.nome}</td>
      <td>R$ ${s.preco.toFixed(2)}</td>
      <td>${s.duracaoMinutos} min</td>
      <td>
        <button class="btn secondary" onclick='editarServico(${JSON.stringify(s)})'>Editar</button>
        <button class="btn secondary" onclick='excluirServico(${s.id})'>Excluir</button>
      </td>
    </tr>`).join("");
}

function editarServico(servico) {
  document.getElementById("servico-id").value = servico.id;
  document.getElementById("servico-nome").value = servico.nome;
  document.getElementById("servico-preco").value = servico.preco;
  document.getElementById("servico-duracao").value = servico.duracaoMinutos;
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

  document.getElementById("horario-intervalo").value = horariosConfigCache.configuracao?.intervaloPadrao || 30;

  const rotulos = {
    segunda: "Segunda",
    terca: "Terca",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sabado",
    domingo: "Domingo"
  };

  const html = Object.keys(rotulos).map((dia) => {
    const d = dias[dia] || { ativo: false, inicio: null, fim: null };
    return `<tr><td>${rotulos[dia]}</td><td>${d.ativo ? "Ativo" : "Inativo"}</td><td>${d.inicio || "-"}</td><td>${d.fim || "-"}</td><td><button class="btn secondary" onclick="editarHorario('${dia}')">Editar</button></td></tr>`;
  }).join("");

  document.getElementById("horarios-preview").innerHTML = html;
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
  document.getElementById("imprevistos-lista").innerHTML = itens.map((i) => `
    <tr><td>${i.data}</td><td>${i.periodo}</td><td>${i.motivo}</td>
    <td><button class="btn secondary" onclick="excluirImprevisto(${i.id})">Excluir</button></td></tr>`).join("");
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
  const midias = await API.adminMidias.list();
  document.getElementById("midias-lista").innerHTML = midias.map((m) => `
    <tr><td>${m.tipo}</td><td>${m.categoria}</td><td>${m.titulo}</td><td>${m.url}</td>
    <td><button class="btn secondary" onclick="excluirMidia(${m.id})">Excluir</button></td></tr>`).join("");
}

async function excluirMidia(id) {
  await API.adminMidias.delete(id);
  await carregarMidiasAdmin();
}

async function uploadFoto(e) {
  e.preventDefault();
  const arquivo = document.getElementById("foto-arquivo").files[0];
  if (!arquivo) {
    alert("Selecione uma imagem para enviar.");
    return;
  }

  const formData = new FormData();
  formData.append("arquivo", arquivo);
  formData.append("categoria", document.getElementById("foto-categoria").value);
  formData.append("titulo", document.getElementById("foto-titulo").value);

  try {
    await API.adminMidias.uploadFoto(formData);
    alert("Foto enviada com sucesso.");
    e.target.reset();
    await carregarMidiasAdmin();
  } catch (error) {
    const message = error?.message || "Falha ao enviar imagem.";
    if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("token")) {
      localStorage.removeItem("adminToken");
      alert("Sessao invalida. Faca login novamente.");
      window.location.href = "login.html";
      return;
    }
    alert(`Erro no upload: ${message}`);
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
  document.getElementById("cursos-lista").innerHTML = cursos.map((c) => `
    <tr><td>${c.titulo}</td><td>R$ ${c.preco.toFixed(2)}</td><td>${c.cargaHoraria}</td>
    <td><button class="btn secondary" onclick='editarCurso(${JSON.stringify(c)})'>Editar</button>
    <button class="btn secondary" onclick='excluirCurso(${c.id})'>Excluir</button></td></tr>`).join("");
}

function editarCurso(curso) {
  document.getElementById("curso-id").value = curso.id;
  document.getElementById("curso-titulo").value = curso.titulo;
  document.getElementById("curso-descricao").value = curso.descricao;
  document.getElementById("curso-preco").value = curso.preco;
  document.getElementById("curso-carga").value = curso.cargaHoraria;
  document.getElementById("curso-imagem").value = curso.imagemUrl;
  document.getElementById("curso-link").value = curso.linkCompra;
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
  const data = document.getElementById("filtro-data").value;
  const itens = await API.adminAgendamentos.list(data);
  document.getElementById("agendamentos-lista").innerHTML = itens.map((a) => `
    <tr><td>${a.nome}</td><td>${a.servico}</td><td>${a.data}</td><td>${a.horario}</td>
    <td class="status-${a.status}">${a.status}</td>
    <td><button class="btn secondary" onclick="cancelarAgendamento(${a.id})">Cancelar</button></td></tr>`).join("");
}

async function cancelarAgendamento(id) {
  await API.adminAgendamentos.cancel(id);
  await carregarAgendamentos();
}

function bindLogout() {
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "login.html";
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  await validarSessaoAdmin();
  bindTabs();
  bindLogout();

  document.getElementById("form-servico").addEventListener("submit", salvarServico);
  document.getElementById("form-horarios").addEventListener("submit", salvarHorarios);
  document.getElementById("horario-dia").addEventListener("change", (e) => preencherFormularioHorario(e.target.value));
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
