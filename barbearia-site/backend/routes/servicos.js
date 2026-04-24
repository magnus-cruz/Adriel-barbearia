/* ================================================
   Alpha Barber - servicos.js
   Funcao: CRUD de servicos (publico e admin).
   ================================================ */

'use strict';

const express = require('express');
const { ler, salvar, proximoId } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'servicos.json';

router.get('/servicos', (req, res) => {
  const itens = ler(ARQUIVO, []);
  res.json(itens.filter((item) => item.ativo !== false));
});

router.get('/admin/servicos', autenticarAdmin, (req, res) => {
  res.json(ler(ARQUIVO, []));
});

router.post('/admin/servicos', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const payload = req.body || {};

  const novo = {
    id: proximoId(lista),
    nome: String(payload.nome || '').trim(),
    preco: Number(payload.preco || 0),
    duracaoMinutos: Number(payload.duracaoMinutos || 0),
    ativo: payload.ativo !== false
  };

  if (!novo.nome || novo.preco <= 0 || novo.duracaoMinutos <= 0) {
    return res.status(400).json({ status: 'error', mensagem: 'Dados invalidos do servico.' });
  }

  lista.push(novo);
  salvar(ARQUIVO, lista);
  return res.json(novo);
});

router.put('/admin/servicos/:id', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const idx = lista.findIndex((item) => Number(item.id) === id);

  if (idx === -1) {
    return res.status(404).json({ status: 'error', mensagem: 'Servico nao encontrado.' });
  }

  const payload = req.body || {};
  lista[idx] = {
    ...lista[idx],
    nome: String(payload.nome || lista[idx].nome).trim(),
    preco: Number(payload.preco ?? lista[idx].preco),
    duracaoMinutos: Number(payload.duracaoMinutos ?? lista[idx].duracaoMinutos),
    ativo: payload.ativo ?? lista[idx].ativo
  };

  salvar(ARQUIVO, lista);
  return res.json(lista[idx]);
});

router.delete('/admin/servicos/:id', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const novaLista = lista.filter((item) => Number(item.id) !== id);

  if (novaLista.length === lista.length) {
    return res.status(404).json({ status: 'error', mensagem: 'Servico nao encontrado.' });
  }

  salvar(ARQUIVO, novaLista);
  return res.json({ status: 'success', mensagem: 'Servico removido.' });
});

module.exports = router;
