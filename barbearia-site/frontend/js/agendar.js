async function carregarServicos() {
  const select = document.getElementById("servico");
  select.innerHTML = "<option value=''>Carregando servicos...</option>";

  try {
    const servicos = await API.getServicos();
    if (!servicos.length) {
      select.innerHTML = "<option value=''>Nenhum servico disponivel</option>";
      document.getElementById("duracao-info").textContent = "";
      return;
    }

    select.innerHTML = servicos
      .map((s) => `<option value="${s.nome}" data-duracao="${s.duracaoMinutos}">${s.nome} - R$ ${s.preco.toFixed(2)}</option>`)
      .join("");
    atualizarDuracao();
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar servicos</option>";
    document.getElementById("duracao-info").textContent = "Verifique se o backend esta em execucao.";
  }
}

function atualizarDuracao() {
  const select = document.getElementById("servico");
  const option = select.selectedOptions[0];
  document.getElementById("duracao-info").textContent = option
    ? `Duracao estimada: ${option.dataset.duracao} min`
    : "";
}

async function carregarHorarios() {
  const select = document.getElementById("horario");
  const data = document.getElementById("data").value;
  if (!data) {
    select.innerHTML = "<option value=''>Selecione uma data</option>";
    return;
  }

  select.innerHTML = "<option value=''>Carregando horarios...</option>";

  try {
    const disponibilidade = await API.getDisponibilidade(data);
    if (!disponibilidade.horarios.length) {
      select.innerHTML = "<option value=''>Sem horarios disponiveis</option>";
      return;
    }
    select.innerHTML = disponibilidade.horarios.map((h) => `<option value="${h}">${h}</option>`).join("");
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar horarios</option>";
  }
}

async function confirmarAgendamento(event) {
  event.preventDefault();
  const payload = {
    nome: document.getElementById("nome").value,
    telefone: document.getElementById("telefone").value,
    servico: document.getElementById("servico").value,
    data: document.getElementById("data").value,
    horario: document.getElementById("horario").value
  };

  try {
    await API.criarAgendamento(payload);
    alert("Agendamento confirmado com sucesso.");
    document.getElementById("agendamento-form").reset();
    prepararDataInicial();
    await carregarServicos();
    await carregarHorarios();
  } catch (error) {
    alert("Nao foi possivel confirmar o agendamento. Verifique os dados e tente novamente.");
  }
}

function prepararDataInicial() {
  const dataInput = document.getElementById("data");
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${yyyy}-${mm}-${dd}`;
  dataInput.min = dataHoje;
  if (!dataInput.value) {
    dataInput.value = dataHoje;
  }
}

function prepararBotaoWhatsApp() {
  const btn = document.getElementById("btn-whatsapp");
  btn.addEventListener("click", () => {
    const nome = document.getElementById("nome").value;
    const servico = document.getElementById("servico").value;
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    window.open(buildWhatsAppURL(nome, servico, data, horario), "_blank");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  prepararDataInicial();
  await carregarServicos();
  await carregarHorarios();
  prepararBotaoWhatsApp();
  document.getElementById("servico").addEventListener("change", atualizarDuracao);
  document.getElementById("data").addEventListener("change", carregarHorarios);
  document.getElementById("agendamento-form").addEventListener("submit", confirmarAgendamento);
});
