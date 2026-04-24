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
  return res.json({ status: 'success', mensagem: 'Agendamento confirmado!', agendamento: novo });
});

router.get('/agendamentos', (req, res) => {
  const lista = ler(ARQUIVO, []);
  const status = String(req.query.status || '').trim().toLowerCase();

  if (!status) return res.json(lista);
  return res.json(lista.filter((item) => String(item.status || '').toLowerCase() === status));
});

router.get('/admin/agendamentos', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const data = String(req.query.data || '').trim();
  if (!data) return res.json(lista);
  return res.json(lista.filter((item) => item.data >= data));
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

module.exports = router;
