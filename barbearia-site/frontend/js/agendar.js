let servicosCache = [];

function mostrarErro(msg) {
  alert(msg);
}

function mostrarSucesso(msg) {
  alert(msg);
}

function formatarData(data) {
  if (!data || !String(data).includes('-')) return data;
  const [ano, mes, dia] = String(data).split('-');
  return `${dia}/${mes}/${ano}`;
}

function prepararDataInicial() {
  const dataInput = document.getElementById('input-data');
  if (!dataInput) return;

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  const dataHoje = `${yyyy}-${mm}-${dd}`;
  dataInput.min = dataHoje;
  if (!dataInput.value) dataInput.value = dataHoje;
}

async function carregarServicosSelect() {
  const select = document.getElementById('select-servico');
  const info = document.getElementById('info-servico');
  if (!select) return;

  select.innerHTML = "<option value=''>Carregando servicos...</option>";
  if (info) info.textContent = '';

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
    `).join('');

    atualizarInfoServico();
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao carregar servicos</option>";
  }
}

async function carregarBarbeirosSelect() {
  const select = document.getElementById('select-barbeiro');
  if (!select) return;

  try {
    const res = await fetch('http://localhost:8080/api/barbeiros?_=' + Date.now());
    const lista = await res.json();
    const ativos = (Array.isArray(lista) ? lista : []).filter((b) => b.ativo !== false);

    select.innerHTML = '<option value="Qualquer barbeiro">Qualquer barbeiro disponivel</option>';

    ativos.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.nome;
      opt.textContent = b.nome + (b.especialidade ? ' - ' + b.especialidade : '');
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Erro ao carregar barbeiros:', e.message);
  }
}

function atualizarInfoServico() {
  const select = document.getElementById('select-servico');
  const info = document.getElementById('info-servico');
  if (!select || !info) return;

  const option = select.selectedOptions[0];
  if (!option) {
    info.textContent = '';
    return;
  }

  const duracao = option.dataset.duracao || '-';
  const preco = Number(option.dataset.preco || 0).toFixed(2);
  info.textContent = `Duracao: ${duracao} min | Valor: R$ ${preco}`;
}

async function tentarCarregarHorarios() {
  const data = document.getElementById('input-data')?.value;
  const servico = document.getElementById('select-servico')?.value;
  if (!data || !servico) return;
  await carregarHorariosDisponiveis(data, servico);
}

async function carregarHorariosDisponiveis(data, servico) {
  const select = document.getElementById('select-horario');
  if (!select) return;

  select.innerHTML = "<option value=''>Carregando horarios...</option>";
  try {
    const slots = await API.getDisponibilidade(data, servico);
    const lista = Array.isArray(slots) ? slots : [];

    if (!lista.length) {
      select.innerHTML = "<option value=''>Nenhum horario disponivel</option>";
      return;
    }

    select.innerHTML = lista.map((horario) => `<option value="${horario}">${horario}</option>`).join('');
  } catch (error) {
    select.innerHTML = "<option value=''>Erro ao buscar horarios</option>";
    console.error('Horarios:', error?.message || error);
  }
}

async function confirmarAgendamento(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById('nome')?.value.trim() || '',
    telefone: document.getElementById('telefone')?.value.trim() || '',
    servico: document.getElementById('select-servico')?.value || '',
    barbeiro: document.getElementById('select-barbeiro')?.value || 'Qualquer barbeiro',
    data: document.getElementById('input-data')?.value || '',
    horario: document.getElementById('select-horario')?.value || ''
  };

  if (!dados.nome || !dados.telefone || !dados.servico || !dados.data || !dados.horario) {
    mostrarErro('Preencha todos os campos obrigatorios.');
    return;
  }

  try {
    const res = await fetch('http://localhost:8080/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resp = await res.json();

    if (res.ok) {
      mostrarSucesso(resp.mensagem || 'Agendamento confirmado!');

      const msg = encodeURIComponent(
        'Ola! Gostaria de confirmar meu agendamento:\n'
        + 'Nome: ' + dados.nome + '\n'
        + 'Servico: ' + dados.servico + '\n'
        + 'Barbeiro: ' + dados.barbeiro + '\n'
        + 'Data: ' + formatarData(dados.data) + '\n'
        + 'Horario: ' + dados.horario
      );

      const numero = typeof WHATSAPP_NUMERO === 'string' ? WHATSAPP_NUMERO : '5561999999999';
      const botaoWpp = document.getElementById('btn-wpp-confirm');
      if (botaoWpp) {
        botaoWpp.href = 'https://wa.me/' + numero + '?text=' + msg;
      }

      const blocoConfirmacao = document.getElementById('confirmacao-wrap');
      if (blocoConfirmacao) {
        blocoConfirmacao.style.display = 'block';
      }

      await tentarCarregarHorarios();
    } else {
      mostrarErro(resp.mensagem || 'Erro ao agendar.');
    }
  } catch (e) {
    mostrarErro('Servidor offline.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  prepararDataInicial();

  await Promise.all([
    carregarServicosSelect(),
    carregarBarbeirosSelect()
  ]);

  const selectServico = document.getElementById('select-servico');
  const inputData = document.getElementById('input-data');
  const form = document.getElementById('agendamento-form');
  const btnWhats = document.getElementById('btn-whatsapp');

  selectServico?.addEventListener('change', () => {
    atualizarInfoServico();
    tentarCarregarHorarios();
  });
  inputData?.addEventListener('change', tentarCarregarHorarios);
  form?.addEventListener('submit', confirmarAgendamento);

  btnWhats?.addEventListener('click', () => {
    const numero = typeof WHATSAPP_NUMERO === 'string' ? WHATSAPP_NUMERO : '5561999999999';
    window.open(`https://wa.me/${numero}`, '_blank');
  });

  await tentarCarregarHorarios();
});
