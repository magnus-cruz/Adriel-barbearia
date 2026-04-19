let servicosCache = [];

function prepararDataInicial() {
  const dataInput = document.getElementById("input-data");
  if (!dataInput) return;

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${yyyy}-${mm}-${dd}`;
  dataInput.min = dataHoje;
  if (!dataInput.value) dataInput.value = dataHoje;
}

async function carregarServicosSelect() {
  const select = document.getElementById("select-servico");
  const info = document.getElementById("info-servico");
  if (!select) return;

  select.innerHTML = "<option value=''>Carregando servicos...</option>";
  if (info) info.textContent = "";

  try {
    const lista = await API.getServicos();
    servicosCache = Array.isArray(lista) ? lista : [];
    const ativos = servicosCache.filter((servico) => servico.ativo !== false);

    if (!ativos.length) {
      select.innerHTML = "<option value=''>Nenhum servico disponivel</option>";
      return;
    }

    select.innerHTML = ativos.map((servico) => `
      <option value="${servico.nome}" data-duracao="${servico.duracaoMinutos}" data-preco="${servico.preco}">
        ${servico.nome} (${servico.duracaoMinutos}min) - R$ ${Number(servico.preco || 0).toFixed(2)}
      </option>
    `).join("");

    select.addEventListener("change", atualizarInfoServico);
    atualizarInfoServico();
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar servicos</option>";
  }
}

function atualizarInfoServico() {
  const select = document.getElementById("select-servico");
  const info = document.getElementById("info-servico");
  if (!select || !info) return;

  const option = select.selectedOptions[0];
  if (!option) {
    info.textContent = "";
    return;
  }

  const duracao = option.dataset.duracao || "-";
  const preco = Number(option.dataset.preco || 0).toFixed(2);
  info.textContent = `Duracao: ${duracao} min | Valor: R$ ${preco}`;
}

async function tentarCarregarHorarios() {
  const data = document.getElementById("input-data")?.value;
  const servico = document.getElementById("select-servico")?.value;
  if (!data || !servico) return;
  await carregarHorariosDisponiveis(data, servico);
}

async function carregarHorariosDisponiveis(data, servico) {
  const select = document.getElementById("select-horario");
  if (!select) return;

  select.innerHTML = "<option value=''>Carregando horarios...</option>";
  try {
    const slots = await API.getDisponibilidade(data, servico);
    const lista = Array.isArray(slots) ? slots : [];

    if (!lista.length) {
      select.innerHTML = "<option value=''>Nenhum horario disponivel</option>";
      return;
    }

    select.innerHTML = lista.map((horario) => `<option value="${horario}">${horario}</option>`).join("");
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao buscar horarios</option>";
    console.error("Horarios:", error?.message || error);
  }
}

function validarFormularioAgendamento(dados) {
  if (!dados.nome) return "Informe o nome.";
  if (!dados.telefone) return "Informe o telefone.";
  if (!dados.servico) return "Selecione um servico.";
  if (!dados.data) return "Selecione a data.";
  if (!dados.horario) return "Selecione o horario.";
  return "";
}

function gerarMensagemWhatsApp(dados) {
  const servicoSelecionado = servicosCache.find((servico) => servico.nome === dados.servico) || {};
  const duracao = servicoSelecionado.duracaoMinutos || "-";
  const preco = Number(servicoSelecionado.preco || 0).toFixed(2);
  const dataBr = (dados.data || "").split("-").reverse().join("/");

  return "Ola! Gostaria de confirmar meu agendamento:\n"
    + `Nome: ${dados.nome}\n`
    + `Servico: ${dados.servico} (${duracao}min)\n`
    + `Data: ${dataBr}\n`
    + `Horario: ${dados.horario}\n`
    + `Valor: R$ ${preco}`;
}

async function confirmarAgendamento(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById("nome")?.value.trim() || "",
    telefone: document.getElementById("telefone")?.value.trim() || "",
    servico: document.getElementById("select-servico")?.value || "",
    data: document.getElementById("input-data")?.value || "",
    horario: document.getElementById("select-horario")?.value || ""
  };

  const erro = validarFormularioAgendamento(dados);
  if (erro) {
    alert(erro);
    return;
  }

  try {
    const resposta = await API.criarAgendamento(dados);
    alert(resposta?.mensagem || "Agendamento confirmado!");

    if (confirm("Deseja abrir o WhatsApp para confirmar com a barbearia?")) {
      const mensagem = gerarMensagemWhatsApp(dados);
      const numero = typeof WHATSAPP_NUMERO === "string" ? WHATSAPP_NUMERO : "5561999999999";
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
    }

    await tentarCarregarHorarios();
  } catch (error) {
    alert(error?.message || "Nao foi possivel confirmar o agendamento.");
  }
}

function bindEventos() {
  const selectServico = document.getElementById("select-servico");
  const inputData = document.getElementById("input-data");
  const form = document.getElementById("agendamento-form");
  const btnWhats = document.getElementById("btn-whatsapp");

  selectServico?.addEventListener("change", tentarCarregarHorarios);
  inputData?.addEventListener("change", tentarCarregarHorarios);
  form?.addEventListener("submit", confirmarAgendamento);

  btnWhats?.addEventListener("click", () => {
    const dados = {
      nome: document.getElementById("nome")?.value.trim() || "",
      telefone: document.getElementById("telefone")?.value.trim() || "",
      servico: document.getElementById("select-servico")?.value || "",
      data: document.getElementById("input-data")?.value || "",
      horario: document.getElementById("select-horario")?.value || ""
    };

    const mensagem = gerarMensagemWhatsApp(dados);
    const numero = typeof WHATSAPP_NUMERO === "string" ? WHATSAPP_NUMERO : "5561999999999";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  prepararDataInicial();
  await carregarServicosSelect();
  bindEventos();
  await tentarCarregarHorarios();
});
