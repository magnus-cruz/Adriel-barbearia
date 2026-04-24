/* ================================================
   Alpha Barber - agendar.js
   Funcao: fluxo publico de agendamento com WhatsApp
   do barbeiro selecionado.
   ================================================ */

'use strict';

/* Dados dos barbeiros em memoria */
let barbeirosDisponiveis = [];
let dadosAgendamentoAtual = null;
let linkWppBarbeiro = null;
let linkWppBarbearia = null;

function btnLoading(btn, loading, textoOriginal = 'Confirmar agendamento') {
  if (!btn) return;

  if (loading) {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent.trim();
    }

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Agendando...</span>';
    return;
  }

  btn.disabled = false;
  btn.removeAttribute('aria-busy');
  btn.textContent = btn.dataset.originalText || textoOriginal;
}

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

function construirMensagemBarbeiro(dados) {
  return encodeURIComponent(
    '✂ *Alpha Barber — Agendamento*\n\n' +
    '👤 Nome: ' + dados.nome + '\n' +
    '💈 Serviço: ' + dados.servico + '\n' +
    '👨 Barbeiro: ' + dados.barbeiro + '\n' +
    '📅 Data: ' + API.formatarData(dados.data) + '\n' +
    '🕐 Horário: ' + dados.horario + '\n\n' +
    'Aguardo confirmação!'
  );
}

function atualizarOpcaoBarbeiro(dados) {
  const wrap = document.getElementById('opcao-wpp-barbeiro-wrap');
  const nomeEl = document.getElementById('label-barbeiro-wpp');
  const barbeiroObj = barbeirosDisponiveis.find((b) => b.nome === dados.barbeiro);

  if (!wrap) return;

  if (!barbeiroObj || !barbeiroObj.whatsapp) {
    wrap.style.display = 'none';
    linkWppBarbeiro = null;
    return;
  }

  linkWppBarbeiro = `https://wa.me/55${barbeiroObj.whatsapp}?text=${construirMensagemBarbeiro(dados)}`;
  wrap.style.display = 'block';

  if (nomeEl) {
    nomeEl.textContent = `${barbeiroObj.nome} — ${barbeiroObj.especialidade || 'Barbeiro'}`;
  }
}

function abrirModalWpp() {
  const modal = document.getElementById('modal-agendar-wpp');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function fecharModalWpp() {
  const modal = document.getElementById('modal-agendar-wpp');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  limparFormulario();
  mostrarSucesso('Agendamento realizado com sucesso!');
}

function limparFormulario() {
  ['input-nome', 'input-tel', 'input-data'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const selectServico = document.getElementById('select-servico');
  if (selectServico) selectServico.selectedIndex = 0;

  const selectBarbeiro = document.getElementById('select-barbeiro');
  if (selectBarbeiro) selectBarbeiro.selectedIndex = 0;

  const selectHorario = document.getElementById('select-horario');
  if (selectHorario) {
    selectHorario.innerHTML = '<option value="">Selecione uma data primeiro</option>';
  }

  const infoWrap = document.getElementById('info-barbeiro-wrap');
  if (infoWrap) infoWrap.style.display = 'none';

  dadosAgendamentoAtual = null;
  linkWppBarbeiro = null;
  linkWppBarbearia = null;
}

function abrirWppBarbeiro() {
  if (linkWppBarbeiro) {
    window.open(linkWppBarbeiro, '_blank');
  }
  fecharModalWpp();
}

function abrirWppBarbearia() {
  if (linkWppBarbearia) {
    window.open(linkWppBarbearia, '_blank');
  }
  fecharModalWpp();
}

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
    mostrarErro('Preencha todos os campos obrigatórios.');
    return;
  }

  const btn = document.getElementById('btn-confirmar');
  if (btn) btnLoading(btn, true);
  const janelaNotificacao = window.open('about:blank', '_blank');

  try {
    const resp = await API.agendar({
      nome: dados.nome,
      nomeCliente: dados.nome,
      telefone: dados.telefone,
      servico: dados.servico,
      barbeiro: dados.barbeiro,
      data: dados.data,
      horario: dados.horario
    });

    dadosAgendamentoAtual = dados;
    linkWppBarbearia = resp.linkNotificacao || null;

    atualizarOpcaoBarbeiro(dados);

    if (resp.linkNotificacao) {
      if (janelaNotificacao) {
        janelaNotificacao.location.href = resp.linkNotificacao;
        janelaNotificacao.focus();
      } else {
        window.open(resp.linkNotificacao, '_blank');
      }
    }

    setTimeout(() => {
      abrirModalWpp();
    }, 800);
  } catch (e) {
    if (janelaNotificacao && !janelaNotificacao.closed) {
      janelaNotificacao.close();
    }
    mostrarErro(e.message || 'Erro ao agendar.');
  } finally {
    if (btn) btnLoading(btn, false, 'Confirmar agendamento');
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
      if (btnWpp) {
        if (wpp) {
          btnWpp.href = `https://wa.me/55${wpp}`;
          btnWpp.style.display = 'inline-flex';
        } else {
          btnWpp.style.display = 'none';
        }
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

window.abrirWppBarbeiro = abrirWppBarbeiro;
window.abrirWppBarbearia = abrirWppBarbearia;
window.fecharModalWpp = fecharModalWpp;
