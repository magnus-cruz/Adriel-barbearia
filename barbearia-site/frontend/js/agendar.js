/* ================================================
   Alpha Barber - agendar.js
   Funcao: fluxo publico de agendamento com WhatsApp
   do barbeiro selecionado.
   ================================================ */

'use strict';

/* Dados dos barbeiros em memoria */
let barbeirosDisponiveis = [];

async function carregarServicosSelect() {
  const select = document.getElementById('select-servico');
  if (!select) return;

  const servicos = await API.servicos();
  select.innerHTML = '<option value="">Selecione</option>' +
    servicos.map((s) => `<option value="${s.nome}">${s.nome} - ${API.formatarMoeda(s.preco)}</option>`).join('');
}

async function carregarBarbeirosSelect() {
  const select = document.getElementById('select-barbeiro');
  if (!select) return;

  try {
    barbeirosDisponiveis = await API.barbeiros();
    select.innerHTML = '<option value="">Qualquer barbeiro disponivel</option>';

    barbeirosDisponiveis.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.nome;
      opt.dataset.id = b.id;
      opt.dataset.wpp = b.whatsapp || '';
      opt.dataset.esp = b.especialidade || '';
      opt.textContent = b.nome + (b.especialidade ? ` - ${b.especialidade}` : '');
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Barbeiros:', e.message);
  }
}

async function carregarHorariosDisponiveis() {
  const data = document.getElementById('input-data')?.value || '';
  const servico = document.getElementById('select-servico')?.value || '';
  const select = document.getElementById('select-horario');

  if (!select) return;

  if (!data) {
    select.innerHTML = '<option value="">Selecione a data</option>';
    return;
  }

  const horarios = await API.disponibilidade(data, servico);
  if (!horarios.length) {
    select.innerHTML = '<option value="">Sem horarios disponiveis</option>';
    return;
  }

  select.innerHTML = '<option value="">Selecione</option>' +
    horarios.map((h) => `<option value="${h}">${h}</option>`).join('');
}

/* WhatsApp no botao de confirmacao com dados do barbeiro */
function gerarLinkWhatsApp(dados) {
  const barbeiro = barbeirosDisponiveis.find((b) => b.nome === dados.barbeiro);
  const numero = barbeiro?.whatsapp ? `55${barbeiro.whatsapp}` : '55NUMERODABARBEARIA';

  const msg = encodeURIComponent(
    'Alpha Barber - Agendamento\n\n' +
    `Nome: ${dados.nome}\n` +
    `Servico: ${dados.servico}\n` +
    `Barbeiro: ${dados.barbeiro || 'Qualquer'}\n` +
    `Data: ${API.formatarData(dados.data)}\n` +
    `Horario: ${dados.horario}\n\n` +
    'Aguardo confirmacao!'
  );

  return `https://wa.me/${numero}?text=${msg}`;
}

/* Apos confirmar agendamento */
async function confirmarAgendamento(event) {
  event.preventDefault();

  const dados = {
    nome: document.getElementById('input-nome').value.trim(),
    telefone: document.getElementById('input-tel').value.trim(),
    servico: document.getElementById('select-servico').value,
    barbeiro: document.getElementById('select-barbeiro').value || 'Qualquer barbeiro',
    data: document.getElementById('input-data').value,
    horario: document.getElementById('select-horario').value
  };

  if (!dados.nome || !dados.telefone || !dados.servico || !dados.data || !dados.horario) {
    mostrarErro('Preencha todos os campos obrigatorios.');
    return;
  }

  try {
    await API.agendar({
      nome: dados.nome,
      nomeCliente: dados.nome,
      telefone: dados.telefone,
      servico: dados.servico,
      barbeiro: dados.barbeiro,
      data: dados.data,
      horario: dados.horario
    });

    mostrarSucesso('Agendamento confirmado!');

    const link = gerarLinkWhatsApp(dados);
    const botao = document.getElementById('btn-confirmar-wpp');
    const box = document.getElementById('confirmacao-box');
    if (botao) botao.href = link;
    if (box) box.style.display = 'block';
  } catch (e) {
    mostrarErro(e.message || 'Erro ao agendar.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await carregarServicosSelect();
    await carregarBarbeirosSelect();
    await carregarHorariosDisponiveis();

    document.getElementById('input-data')?.addEventListener('change', () => {
      carregarHorariosDisponiveis().catch((e) => mostrarErro(e.message));
    });

    document.getElementById('select-servico')?.addEventListener('change', () => {
      carregarHorariosDisponiveis().catch((e) => mostrarErro(e.message));
    });

    /* Ao mudar barbeiro selecionado */
    document.getElementById('select-barbeiro')?.addEventListener('change', function mudarBarbeiro() {
      const wrap = document.getElementById('info-barbeiro-wrap');
      const nomeEl = document.getElementById('info-barbeiro-nome');
      const especEl = document.getElementById('info-barbeiro-espec');
      const btnWpp = document.getElementById('btn-wpp-barbeiro');

      const valor = this.value;

      if (!valor) {
        if (wrap) wrap.style.display = 'none';
        return;
      }

      const opt = this.selectedOptions[0];
      const wpp = opt?.dataset.wpp || '';
      const esp = opt?.dataset.esp || '';

      if (nomeEl) nomeEl.textContent = valor;
      if (especEl) especEl.textContent = esp;

      if (btnWpp && wpp) {
        btnWpp.href = `https://wa.me/55${wpp}`;
        btnWpp.style.display = 'inline-flex';
      } else if (btnWpp) {
        btnWpp.style.display = 'none';
      }

      if (wrap) wrap.style.display = 'block';
    });

    document.getElementById('form-agendar')?.addEventListener('submit', (event) => {
      confirmarAgendamento(event).catch((e) => mostrarErro(e.message));
    });
  } catch (erro) {
    mostrarErro(erro.message || 'Falha ao carregar dados de agendamento.');
  }
});
