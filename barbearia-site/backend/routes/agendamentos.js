/* ================================================
   Alpha Barber - agendamentos.js
   Funcao: criar e gerenciar agendamentos.
   ================================================ */

'use strict';

const express = require('express');
const { ler, salvar, proximoId } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'agendamentos.json';
const CONFIG_PADRAO = {
  whatsappNotificacao: '5561983088897',
  nomeBarbearia: 'Alpha Barber',
  endereco: ''
};

router.post('/agendamentos', (req, res) => {
  const lista = ler(ARQUIVO, []);
  const payload = req.body || {};

  const novo = {
    id: proximoId(lista),
    nome: String(payload.nome || payload.nomeCliente || '').trim(),
    nomeCliente: String(payload.nomeCliente || payload.nome || '').trim(),
    telefone: String(payload.telefone || '').trim(),
    servico: String(payload.servico || '').trim(),
    barbeiro: String(payload.barbeiro || '').trim(),
    data: String(payload.data || '').trim(),
    horario: String(payload.horario || '').trim(),
    status: 'confirmado'
  };

  if (!novo.nomeCliente || !novo.telefone || !novo.servico || !novo.data || !novo.horario) {
    return res.status(400).json({ status: 'error', mensagem: 'Campos obrigatorios ausentes.' });
  }

  const conflito = lista.some((item) => item.data === novo.data && item.horario === novo.horario && (item.status || 'confirmado') !== 'cancelado');
  if (conflito) {
    return res.status(409).json({ status: 'error', mensagem: 'Horario ja reservado.' });
  }

  lista.push(novo);
  salvar(ARQUIVO, lista);

  const config = ler('config.json', CONFIG_PADRAO);
  const whatsappDestino = String(config.whatsappNotificacao || CONFIG_PADRAO.whatsappNotificacao).replace(/\D/g, '') || CONFIG_PADRAO.whatsappNotificacao;

  const msgNotificacao = encodeURIComponent(
    '🔔 *Novo Agendamento — ' +
    String(config.nomeBarbearia || CONFIG_PADRAO.nomeBarbearia) + '*\n\n' +
    '👤 Cliente: ' + novo.nome + '\n' +
    '📱 Telefone: ' + novo.telefone + '\n' +
    '💈 Serviço: ' + novo.servico + '\n' +
    '👨 Barbeiro: ' + (novo.barbeiro || 'Qualquer') + '\n' +
    '📅 Data: ' + novo.data + '\n' +
    '🕐 Horário: ' + novo.horario + '\n\n' +
    '✅ Agendamento #' + novo.id + ' confirmado.'
  );

  const linkNotificacao = 'https://wa.me/' + whatsappDestino + '?text=' + msgNotificacao;

  return res.json({
    status: 'success',
    id: novo.id,
    mensagem: 'Agendamento confirmado!',
    linkNotificacao,
    whatsappBarbearia: whatsappDestino,
    agendamento: novo
  });
});

router.get('/agendamentos', (req, res) => {
  const lista = ler(ARQUIVO, []);
  const status = String(req.query.status || '').trim().toLowerCase();

  if (!status) return res.json(lista);
  return res.json(lista.filter((item) => String(item.status || '').toLowerCase() === status));
});

router.get('/admin/agendamentos', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const dataInicio = String(req.query.dataInicio || req.query.data || '').trim();
  const dataFim = String(req.query.dataFim || '').trim();

  if (!dataInicio && !dataFim) return res.json(lista);

  return res.json(lista.filter((item) => {
    const dataItem = String(item.data || '').trim();
    if (!dataItem) return false;
    if (dataInicio && dataItem < dataInicio) return false;
    if (dataFim && dataItem > dataFim) return false;
    return true;
  }));
});

router.put('/admin/agendamentos/:id/cancelar', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const idx = lista.findIndex((item) => Number(item.id) === id);

  if (idx === -1) {
    return res.status(404).json({ status: 'error', mensagem: 'Agendamento nao encontrado.' });
  }

  lista[idx].status = 'cancelado';
  salvar(ARQUIVO, lista);
  return res.json({ status: 'success', mensagem: 'Agendamento cancelado.' });
});

router.delete('/admin/agendamentos/:id', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const idx = lista.findIndex((item) => Number(item.id) === id);

  if (idx === -1) {
    return res.status(404).json({ status: 'error', mensagem: 'Agendamento nao encontrado.' });
  }

  lista.splice(idx, 1);
  salvar(ARQUIVO, lista);
  return res.json({ status: 'success', mensagem: 'Agendamento excluido.' });
});

module.exports = router;
