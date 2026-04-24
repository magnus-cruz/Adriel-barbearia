/* ================================================
   Alpha Barber - admin.js
   Funcao: gerenciar painel admin (abas, badges e CRUDs).
   ================================================ */

'use strict';

let cacheAgendamentos = [];
let cacheServicos = [];
let cacheBarbeiros = [];
let cacheMidias = [];
let cacheImprevistos = [];

function obterValorServico(nomeServico) {
  const servico = cacheServicos.find((item) => String(item.nome || '').trim() === String(nomeServico || '').trim());
  return servico ? Number(servico.preco || 0) : null;
}

function formatarMoedaRelatorio(valor) {
  return valor === null || Number.isNaN(Number(valor))
    ? '-'
    : API.formatarMoeda(valor);
}

function getAgendamentosFiltrados() {
  const status = document.getElementById('filtro-status')?.value || 'todos';
  const dataInicio = document.getElementById('filtro-data-inicio')?.value || '';
  const dataFim = document.getElementById('filtro-data-fim')?.value || '';

  return cacheAgendamentos.filter((item) => {
    const dataItem = String(item.data || '').trim();
    const statusItem = String(item.status || '').toLowerCase();

    if (dataInicio && dataItem < dataInicio) return false;
    if (dataFim && dataItem > dataFim) return false;
    if (status !== 'todos' && statusItem !== status) return false;
    return true;
  });
}

function montarHtmlImpressao(lista) {
  const total = lista.reduce((soma, item) => soma + (obterValorServico(item.servico) || 0), 0);
  const inicio = document.getElementById('filtro-data-inicio')?.value || 'início';
  const fim = document.getElementById('filtro-data-fim')?.value || 'fim';
  const titulo = document.getElementById('secao-titulo')?.textContent || 'Agendamentos';

  const linhas = lista.map((item) => `
    <tr>
      <td>${item.nomeCliente || item.nome || '-'}</td>
      <td>${item.telefone || '-'}</td>
      <td>${item.servico || '-'}</td>
      <td>${formatarMoedaRelatorio(obterValorServico(item.servico))}</td>
      <td>${item.barbeiro || '-'}</td>
      <td>${item.data || '-'}</td>
      <td>${item.horario || '-'}</td>
      <td>${item.status || '-'}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>${titulo} - Relatorio</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1d1d1d; }
        h1 { margin: 0 0 8px; font-size: 24px; }
        .meta { margin-bottom: 18px; color: #555; font-size: 13px; }
        .summary { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 18px; font-size: 13px; }
        .summary div { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f3f3f3; }
        tfoot td { font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <div class="meta">Período: ${inicio} até ${fim}</div>
      <div class="summary">
        <div><strong>Total de agendamentos:</strong> ${lista.length}</div>
        <div><strong>Valor total dos serviços:</strong> ${API.formatarMoeda(total)}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th><th>Telefone</th><th>Serviço</th><th>Valor</th><th>Barbeiro</th><th>Data</th><th>Horário</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${linhas || '<tr><td colspan="8">Nenhum agendamento encontrado.</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Totais</td>
            <td>${API.formatarMoeda(total)}</td>
            <td colspan="4">${lista.length} registro(s)</td>
          </tr>
        </tfoot>
      </table>
      <script>
        window.onload = () => {
          window.focus();
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>
    </body>
    </html>
  `;
}

function imprimirAgendamentos() {
  const lista = getAgendamentosFiltrados();
  if (!lista.length) {
    mostrarAviso('Nenhum agendamento para imprimir com os filtros atuais.');
    return;
  }

  const janela = window.open('', '_blank', 'width=1200,height=900');
  if (!janela) {
    mostrarErro('O navegador bloqueou a janela de impressão.');
    return;
  }

  janela.document.open();
  janela.document.write(montarHtmlImpressao(lista));
  janela.document.close();
}

const ABAS = {
  servicos: { titulo: 'Servicos e Precos', desc: 'Gerencie os servicos, precos e duracao.', carregar: carregarServicos },
  barbeiros: { titulo: 'Barbeiros', desc: 'Cadastre barbeiros e fotos da equipe.', carregar: carregarBarbeiros },
  horarios: { titulo: 'Horarios Disponiveis', desc: 'Defina horario por dia da semana.', carregar: carregarHorarios },
  imprevistos: { titulo: 'Imprevistos / Bloqueios', desc: 'Bloqueie datas e periodos.', carregar: carregarImprevistos },
  galeria: { titulo: 'Galeria', desc: 'Envie e gerencie fotos e videos.', carregar: carregarMidias },
  config: { titulo: 'Configuracoes', desc: 'Gerencie as informacoes da barbearia.', carregar: carregarConfig },
  agendamentos: { titulo: 'Agendamentos', desc: 'Acompanhe e cancele reservas.', carregar: carregarAgendamentos }
};

function setBadge(id, valor) {
  const badge = document.getElementById(id);
  if (!badge) return;
  if (valor > 0) {
    badge.textContent = valor > 99 ? '99+' : String(valor);
    badge.classList.add('visivel');
  } else {
    badge.classList.remove('visivel');
    badge.textContent = '';
  }
}

async function atualizarBadges() {
  try {
    const [servicos, barbeiros, imprevistos, midias, agendamentos] = await Promise.all([
      API.servicos(),
      API.barbeiros(),
      API.adminImprevistos.listar(),
      API.galeria(),
      API.agendar ? API.apiGet('/api/agendamentos?status=confirmado') : []
    ]);

    setBadge('badge-servicos', servicos.length);
    setBadge('badge-barbeiros', barbeiros.length);
    setBadge('badge-imprevistos', imprevistos.length);
    setBadge('badge-galeria', midias.length);
    setBadge('badge-agendamentos', agendamentos.length || 0);
  } catch (erro) {
    console.error('Falha ao atualizar badges:', erro.message);
  }
}

function switchTab(botao, aba) {
  document.querySelectorAll('.sidebar-item').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((item) => item.classList.remove('ativo'));

  botao.classList.add('active');
  document.getElementById(`tab-${aba}`)?.classList.add('ativo');

  const meta = ABAS[aba];
  if (meta) {
    document.getElementById('breadcrumb-atual').textContent = meta.titulo;
    document.getElementById('secao-titulo').textContent = meta.titulo;
    document.getElementById('secao-desc').textContent = meta.desc;
    meta.carregar().catch((erro) => mostrarErro(erro.message));
  }
}

function renderEstadoTabela(tbody, colunas, msg) {
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${colunas}" style="text-align:center;color:var(--pale-oak-dim);padding:1.3rem">${msg}</td></tr>`;
}

async function carregarServicos() {
  const tbody = document.getElementById('tbody-servicos');
  if (!tbody) return;

  cacheServicos = await API.adminServicos.listar();
  if (!cacheServicos.length) {
    renderEstadoTabela(tbody, 4, 'Nenhum servico cadastrado.');
    return;
  }

  tbody.innerHTML = cacheServicos.map((s) => `
    <tr>
      <td>${s.nome}</td>
      <td>${API.formatarMoeda(s.preco)}</td>
      <td>${s.duracaoMinutos} min</td>
      <td class="acoes-cell">
        <button type="button" class="btn-acao btn-editar" onclick='editarServico(${JSON.stringify(s)})'>Editar</button>
        <button type="button" class="btn-acao btn-excluir-tabela" onclick="excluirServico(${s.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function editarServico(servico) {
  document.getElementById('servico-id').value = servico.id;
  document.getElementById('nome-servico').value = servico.nome;
  document.getElementById('preco-servico').value = servico.preco;
  document.getElementById('duracao-servico').value = servico.duracaoMinutos;
  document.getElementById('ativo-servico').checked = !!servico.ativo;
}

async function excluirServico(id) {
  abrirModalConfirmar('Excluir servico', 'Deseja remover este servico?', async () => {
    await API.adminServicos.excluir(id);
    mostrarSucesso('Servico removido.');
    await carregarServicos();
    await atualizarBadges();
  });
}

async function salvarServico(event) {
  event.preventDefault();
  const id = document.getElementById('servico-id').value;
  const payload = {
    nome: document.getElementById('nome-servico').value.trim(),
    preco: Number(document.getElementById('preco-servico').value),
    duracaoMinutos: Number(document.getElementById('duracao-servico').value),
    ativo: document.getElementById('ativo-servico').checked
  };

  if (id) await API.adminServicos.atualizar(id, payload);
  else await API.adminServicos.criar(payload);

  event.target.reset();
  document.getElementById('servico-id').value = '';
  mostrarSucesso('Servico salvo com sucesso.');
  await carregarServicos();
  await atualizarBadges();
}

async function carregarBarbeiros() {
  const tbody = document.getElementById('tbody-barbeiros');
  if (!tbody) return;

  cacheBarbeiros = await API.adminBarbeiros.listar();
  if (!cacheBarbeiros.length) {
    renderEstadoTabela(tbody, 6, 'Nenhum barbeiro cadastrado.');
    return;
  }

  tbody.innerHTML = cacheBarbeiros.map((b) => `
    <tr id="barbeiro-${b.id}" style="${b.pausado ? 'opacity:.6;background:rgba(139,0,0,.05)' : ''}">
      <td><img src="${b.fotoUrl || ''}" alt="${b.nome}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid ${b.pausado ? '#e05555' : 'var(--dark-goldenrod)'}"></td>
      <td>
        ${b.nome}
        ${b.pausado ? `<span style="display:block;font-size:.65rem;color:#e05555;margin-top:2px">Pausado: ${b.motivoPausa || 'Indisponivel'}</span>` : ''}
      </td>
      <td>${b.especialidade || '-'}</td>
      <td>
        ${b.whatsapp ? `<a href="https://wa.me/55${b.whatsapp}" target="_blank" style="color:var(--dark-goldenrod);font-size:.8rem;text-decoration:none">${b.whatsapp}</a>` : '-'}
      </td>
      <td>
        <span style="font-size:.78rem;color:${b.pausado ? '#e05555' : b.ativo ? '#4caf50' : 'var(--pale-oak-dim)'}">
          ${b.pausado ? 'Pausado' : b.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="acoes-cell">
        <button class="btn-acao ${b.pausado ? 'btn-editar' : 'btn-excluir-tabela'}" onclick='togglePausaBarbeiro(${b.id}, ${JSON.stringify(b.nome || '')}, ${!!b.pausado})' style="${b.pausado ? 'color:var(--dark-goldenrod);border-color:var(--dark-goldenrod)' : ''}" type="button">${b.pausado ? 'Reativar' : 'Pausar'}</button>
        <button type="button" class="btn-acao btn-excluir-tabela" onclick="removerBarbeiro(${b.id})">Remover</button>
      </td>
    </tr>
  `).join('');
}

async function salvarBarbeiro() {
  const nome = document.getElementById('nome-barbeiro').value.trim();
  const wpp = document.getElementById('wpp-barbeiro').value.trim();

  if (!nome) {
    mostrarErro('Nome do barbeiro e obrigatorio.');
    return;
  }

  /* Validar WhatsApp antes de enviar */
  if (!wpp || !/^\d{10,11}$/.test(wpp)) {
    mostrarErro('Informe o WhatsApp com DDD (ex: 61999999999)');
    return;
  }

  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('especialidade', document.getElementById('espec-barbeiro').value.trim());
  formData.append('whatsapp', wpp);
  formData.append('instagram', document.getElementById('insta-barbeiro').value.trim());

  const foto = document.getElementById('foto-barbeiro').files?.[0];
  if (foto) formData.append('foto', foto);

  await API.adminBarbeiros.salvarComFoto(formData);
  mostrarSucesso('Barbeiro salvo com sucesso.');
  document.getElementById('nome-barbeiro').value = '';
  document.getElementById('espec-barbeiro').value = '';
  document.getElementById('wpp-barbeiro').value = '';
  document.getElementById('insta-barbeiro').value = '';
  document.getElementById('foto-barbeiro').value = '';
  await carregarBarbeiros();
  await atualizarBadges();
}

function togglePausaBarbeiro(id, nome, estaPausado) {
  if (!estaPausado) {
    /* Pedir motivo da pausa */
    const motivo = prompt(`Motivo da pausa para ${nome} (ex: Ferias, Doenca, Folga):`, 'Indisponivel');
    if (motivo === null) return;
    executarPausa(id, true, motivo);
  } else {
    abrirModalConfirmar(
      'Reativar Barbeiro',
      `Reativar <strong>${nome}</strong>?<br>Ele voltara a aparecer no agendamento.`,
      () => executarPausa(id, false, '')
    );
  }
}

async function executarPausa(id, pausado, motivo) {
  try {
    const data = await API.adminBarbeiros.pausar(id, pausado, motivo);
    mostrarSucesso(data.mensagem || 'Atualizado com sucesso.');
    await carregarBarbeiros();
  } catch (e) {
    mostrarErro(`Erro: ${e.message}`);
  }
}

function removerBarbeiro(id) {
  abrirModalConfirmar('Remover barbeiro', 'Deseja remover este barbeiro?', async () => {
    await API.adminBarbeiros.excluir(id);
    mostrarSucesso('Barbeiro removido.');
    await carregarBarbeiros();
    await atualizarBadges();
  });
}

async function carregarHorarios() {
  const dados = await API.horarios();
  const tbody = document.getElementById('tbody-horarios');
  const dias = dados.configuracao?.diasSemana || {};

  document.getElementById('intervalo-padrao').value = dados.configuracao?.intervaloPadrao || 30;

  const ordem = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  tbody.innerHTML = ordem.map((dia) => {
    const d = dias[dia] || { ativo: false };
    return `<tr><td>${dia}</td><td>${d.ativo ? 'Ativo' : 'Inativo'}</td><td>${d.inicio || '-'}</td><td>${d.fim || '-'}</td><td><button type="button" class="btn-acao btn-editar" onclick="editarHorario('${dia}')">Editar</button></td></tr>`;
  }).join('');

  window.__horariosCache = dados;
}

async function carregarConfig() {
  try {
    const cfg = await API.adminConfig.listar();
    const campos = {
      'cfg-nome': cfg.nomeBarbearia || '',
      'cfg-wpp': cfg.whatsappNotificacao ? String(cfg.whatsappNotificacao).replace(/^55/, '') : '',
      'cfg-end': cfg.endereco || ''
    };

    Object.entries(campos).forEach(([id, valor]) => {
      const el = document.getElementById(id);
      if (el) el.value = valor;
    });
  } catch (e) {
    mostrarErro('Erro ao carregar config: ' + e.message);
  }
}

async function salvarConfig() {
  const nome = document.getElementById('cfg-nome').value.trim();
  const wpp = document.getElementById('cfg-wpp').value.trim();
  const end = document.getElementById('cfg-end').value.trim();

  if (!wpp || !/^\d{10,11}$/.test(wpp)) {
    mostrarErro('WhatsApp inválido. Use apenas dígitos com DDD.');
    return;
  }

  try {
    await API.adminConfig.salvar({
      nomeBarbearia: nome,
      whatsappNotificacao: '55' + wpp,
      endereco: end
    });
    mostrarSucesso('Configurações salvas!');
    await carregarConfig();
  } catch (e) {
    mostrarErro('Erro: ' + e.message);
  }
}

function editarHorario(dia) {
  const dados = window.__horariosCache || { configuracao: { diasSemana: {} } };
  const d = dados.configuracao.diasSemana[dia] || { ativo: false, inicio: '', fim: '' };
  document.getElementById('dia-semana').value = dia;
  document.getElementById('dia-ativo').checked = !!d.ativo;
  document.getElementById('inicio-horario').value = d.inicio || '';
  document.getElementById('fim-horario').value = d.fim || '';
}

async function salvarHorario(event) {
  event.preventDefault();
  const dados = window.__horariosCache;
  const dia = document.getElementById('dia-semana').value;

  dados.configuracao.intervaloPadrao = Number(document.getElementById('intervalo-padrao').value || 30);
  dados.configuracao.diasSemana[dia] = {
    ativo: document.getElementById('dia-ativo').checked,
    inicio: document.getElementById('inicio-horario').value || null,
    fim: document.getElementById('fim-horario').value || null
  };

  await API.adminHorarios.salvar(dados);
  mostrarSucesso('Horarios atualizados.');
  await carregarHorarios();
}

async function carregarImprevistos() {
  const tbody = document.getElementById('tbody-imprevistos');
  if (!tbody) return;

  cacheImprevistos = await API.adminImprevistos.listar();
  if (!cacheImprevistos.length) {
    renderEstadoTabela(tbody, 4, 'Nenhum bloqueio cadastrado.');
    return;
  }

  tbody.innerHTML = cacheImprevistos.map((i) => `
    <tr>
      <td>${i.data}</td>
      <td>${i.periodo}</td>
      <td>${i.motivo}</td>
      <td><button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirImprevisto(${i.id})">Excluir</button></td>
    </tr>
  `).join('');
}

async function salvarImprevisto(event) {
  event.preventDefault();
  await API.adminImprevistos.criar({
    data: document.getElementById('data-imprevisto').value,
    periodo: document.getElementById('periodo-imprevisto').value,
    motivo: document.getElementById('motivo-imprevisto').value.trim()
  });
  event.target.reset();
  mostrarSucesso('Bloqueio adicionado.');
  await carregarImprevistos();
  await atualizarBadges();
}

function excluirImprevisto(id) {
  abrirModalConfirmar('Excluir bloqueio', 'Deseja remover este bloqueio?', async () => {
    await API.adminImprevistos.excluir(id);
    mostrarSucesso('Bloqueio removido.');
    await carregarImprevistos();
    await atualizarBadges();
  });
}

async function carregarMidias() {
  const tbody = document.getElementById('midias-lista');
  if (!tbody) return;

  cacheMidias = await API.galeria();
  if (!cacheMidias.length) {
    renderEstadoTabela(tbody, 6, 'Nenhuma midia cadastrada.');
    return;
  }

  tbody.innerHTML = cacheMidias.map((m) => `
    <tr>
      <td>${String(m.tipo || '').startsWith('video/') ? 'Video' : 'Foto'}</td>
      <td>${m.categoria || '-'}</td>
      <td>${m.titulo || '-'}</td>
      <td><a href="${m.url}" target="_blank" rel="noopener noreferrer">Abrir</a></td>
      <td>${m.nomeArquivo || '-'}</td>
      <td><button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirMidia('${encodeURIComponent(m.nomeArquivo || '')}')">Excluir</button></td>
    </tr>
  `).join('');

  const contador = document.getElementById('galeria-contador');
  if (contador) contador.textContent = `${cacheMidias.length} item(ns)`;
}

async function uploadFoto(event) {
  event.preventDefault();

  const arquivo = document.getElementById('file-upload').files?.[0];
  const titulo = document.getElementById('titulo-midia').value.trim();
  const categoria = document.getElementById('categoria-midia').value;

  if (!arquivo || !titulo) {
    mostrarErro('Selecione arquivo e informe titulo.');
    return;
  }

  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('titulo', titulo);
  formData.append('categoria', categoria);

  const progress = document.getElementById('progress-fill');
  const progressPct = document.getElementById('progress-pct');
  document.getElementById('progress-wrap').style.display = 'block';

  await API.adminMidia.upload(formData, (pct) => {
    if (progress) progress.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
  });

  event.target.reset();
  document.getElementById('progress-wrap').style.display = 'none';
  mostrarSucesso('Upload concluido.');
  await carregarMidias();
  await atualizarBadges();
}

function excluirMidia(nomeArquivoEncode) {
  const nomeArquivo = decodeURIComponent(nomeArquivoEncode);
  abrirModalConfirmar('Excluir midia', `Deseja remover ${nomeArquivo}?`, async () => {
    await API.adminMidia.excluir(nomeArquivo);
    mostrarSucesso('Midia removida.');
    await carregarMidias();
    await atualizarBadges();
  });
}

async function carregarAgendamentos() {
  const tbody = document.getElementById('tbody-agendamentos');
  if (!tbody) return;

  const dataInicio = document.getElementById('filtro-data-inicio')?.value || '';
  const dataFim = document.getElementById('filtro-data-fim')?.value || '';
  cacheAgendamentos = await API.adminAgendamentos.listar(dataInicio, dataFim);
  filtrarAgendamentos();
}

function filtrarAgendamentos() {
  const tbody = document.getElementById('tbody-agendamentos');
  const lista = getAgendamentosFiltrados();

  if (!lista.length) {
    renderEstadoTabela(tbody, 9, 'Nenhum agendamento encontrado.');
    return;
  }

  tbody.innerHTML = lista.map((a) => `
    <tr>
      <td>${a.nomeCliente || a.nome}</td>
      <td>${a.telefone || '-'}</td>
      <td>${a.servico}</td>
      <td>${formatarMoedaRelatorio(obterValorServico(a.servico))}</td>
      <td>${a.barbeiro || '-'}</td>
      <td>${a.data}</td>
      <td>${a.horario}</td>
      <td>${a.status}</td>
      <td class="acoes-cell">
        <button class="btn-acao btn-excluir-tabela" type="button" onclick="cancelarAgendamento(${a.id})">Cancelar</button>
        <button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirAgendamento(${a.id})">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function cancelarAgendamento(id) {
  abrirModalConfirmar('Cancelar agendamento', 'Deseja cancelar este agendamento?', async () => {
    await API.adminAgendamentos.cancelar(id);
    mostrarSucesso('Agendamento cancelado.');
    await carregarAgendamentos();
    await atualizarBadges();
  });
}

function excluirAgendamento(id) {
  abrirModalConfirmar('Excluir agendamento', 'Deseja excluir definitivamente este agendamento?', async () => {
    await API.adminAgendamentos.excluir(id);
    mostrarSucesso('Agendamento excluído.');
    await carregarAgendamentos();
    await atualizarBadges();
  });
}

function configurarPreviewBarbeiro() {
  const input = document.getElementById('foto-barbeiro');
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    const label = document.getElementById('label-foto-barbeiro');
    const preview = document.getElementById('preview-barbeiro');
    const img = document.getElementById('preview-barbeiro-img');

    if (!file) {
      label.textContent = 'Clique para selecionar foto';
      preview.style.display = 'none';
      return;
    }

    label.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (evt) => {
      img.src = evt.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

async function inicializar() {
  exigirAdmin();
  await API.adminCheck();

  document.getElementById('form-servico')?.addEventListener('submit', (e) => salvarServico(e).catch((erro) => mostrarErro(erro.message)));
  document.getElementById('form-horarios')?.addEventListener('submit', (e) => salvarHorario(e).catch((erro) => mostrarErro(erro.message)));
  document.getElementById('form-imprevisto')?.addEventListener('submit', (e) => salvarImprevisto(e).catch((erro) => mostrarErro(erro.message)));
  document.getElementById('form-foto')?.addEventListener('submit', (e) => uploadFoto(e).catch((erro) => mostrarErro(erro.message)));

  document.getElementById('btn-filtrar-data')?.addEventListener('click', () => carregarAgendamentos().catch((erro) => mostrarErro(erro.message)));
  document.getElementById('filtro-data-inicio')?.addEventListener('change', () => filtrarAgendamentos());
  document.getElementById('filtro-data-fim')?.addEventListener('change', () => filtrarAgendamentos());
  document.getElementById('filtro-status')?.addEventListener('change', () => filtrarAgendamentos());

  configurarPreviewBarbeiro();

  await Promise.all([
    carregarServicos(),
    carregarBarbeiros(),
    carregarHorarios(),
    carregarImprevistos(),
    carregarMidias(),
    carregarAgendamentos(),
    atualizarBadges()
  ]);
}

window.switchTab = switchTab;
window.editarServico = editarServico;
window.excluirServico = excluirServico;
window.removerBarbeiro = removerBarbeiro;
window.salvarBarbeiro = salvarBarbeiro;
window.editarHorario = editarHorario;
window.excluirImprevisto = excluirImprevisto;
window.togglePausaBarbeiro = togglePausaBarbeiro;
window.filtrarAgendamentos = filtrarAgendamentos;
window.cancelarAgendamento = cancelarAgendamento;
window.excluirAgendamento = excluirAgendamento;
window.imprimirAgendamentos = imprimirAgendamentos;
window.excluirMidia = excluirMidia;
window.carregarConfig = carregarConfig;
window.salvarConfig = salvarConfig;

document.addEventListener('DOMContentLoaded', () => {
  inicializar().catch((erro) => {
    console.error('Erro no painel:', erro);
    mostrarErro(erro.message || 'Falha ao inicializar painel.');
  });
});
