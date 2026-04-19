let servicosCache = [];

function prepararDataInicial() {
  const dataInput = document.getElementById("data");
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${yyyy}-${mm}-${dd}`;
  dataInput.min = dataHoje;
  if (!dataInput.value) dataInput.value = dataHoje;
}

async function carregarServicos() {
  const select = document.getElementById("servico");
  select.innerHTML = "<option value=''>Carregando servicos...</option>";
  try {
    const servicos = await API.getServicos();
    servicosCache = Array.isArray(servicos) ? servicos : [];
    if (!servicosCache.length) {
      select.innerHTML = "<option value=''>Nenhum servico disponivel</option>";
      return;
    }
    select.innerHTML = servicosCache.map((s) => `
      <option value="${s.nome}" data-duracao="${s.duracaoMinutos}" data-preco="${s.preco}">
        ${s.nome} (${s.duracaoMinutos}min) - R$ ${Number(s.preco).toFixed(2)}
      </option>`).join("");
    atualizarInfoServico();
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar servicos</option>";
  }
}

function atualizarInfoServico() {
  const select = document.getElementById("servico");
  const option = select.selectedOptions[0];
  const info = document.getElementById("duracao-info");
  if (!option) {
    info.textContent = "";
    return;
  }
  const duracao = option.dataset.duracao || "-";
  const preco = Number(option.dataset.preco || 0).toFixed(2);
  info.textContent = `Duracao: ${duracao} min | Valor: R$ ${preco}`;
}

async function carregarHorariosDisponiveis() {
  const data = document.getElementById("data").value;
  const servico = document.getElementById("servico").value;
  const select = document.getElementById("horario");

  if (!data || !servico) {
    select.innerHTML = "<option value=''>Selecione servico e data</option>";
    return;
  }

  select.innerHTML = "<option value=''>Carregando horarios...</option>";
  try {
    const resposta = await API.getDisponibilidade(data, servico);
    const horarios = Array.isArray(resposta.horarios) ? resposta.horarios : [];
    if (!horarios.length) {
      select.innerHTML = "<option value=''>Nenhum horario disponivel</option>";
      return;
    }
    select.innerHTML = horarios.map((h) => `<option value="${h}">${h}</option>`).join("");
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar horarios</option>";
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
  const servicoSelecionado = servicosCache.find((s) => s.nome === dados.servico) || {};
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
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    servico: document.getElementById("servico").value,
    data: document.getElementById("data").value,
    horario: document.getElementById("horario").value
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
    await carregarHorariosDisponiveis();
  } catch (error) {
    alert(error.message || "Nao foi possivel confirmar o agendamento.");
  }
}

function bindEventos() {
  document.getElementById("servico").addEventListener("change", async () => {
    atualizarInfoServico();
    await carregarHorariosDisponiveis();
  });

  document.getElementById("data").addEventListener("change", carregarHorariosDisponiveis);
  document.getElementById("agendamento-form").addEventListener("submit", confirmarAgendamento);
  document.getElementById("btn-whatsapp").addEventListener("click", () => {
    const dados = {
      nome: document.getElementById("nome").value.trim(),
      telefone: document.getElementById("telefone").value.trim(),
      servico: document.getElementById("servico").value,
      data: document.getElementById("data").value,
      horario: document.getElementById("horario").value
    };
    const mensagem = gerarMensagemWhatsApp(dados);
    const numero = typeof WHATSAPP_NUMERO === "string" ? WHATSAPP_NUMERO : "5561999999999";
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  prepararDataInicial();
  await carregarServicos();
  await carregarHorariosDisponiveis();
  bindEventos();
});
