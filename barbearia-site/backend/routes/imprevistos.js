/* ================================================
   Alpha Barber - imprevistos.js
   Funcao: CRUD administrativo de bloqueios.
   ================================================ */

'use strict';

const express = require('express');
const { ler, salvar, proximoId } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'imprevistos.json';

router.get('/admin/imprevistos', autenticarAdmin, (req, res) => {
  res.json(ler(ARQUIVO, []));
});

router.post('/admin/imprevistos', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const payload = req.body || {};

  const novo = {
    id: proximoId(lista),
    data: String(payload.data || '').trim(),
    periodo: String(payload.periodo || 'dia_todo').trim(),
    motivo: String(payload.motivo || '').trim()
  };

  if (!novo.data || !novo.motivo) {
    return res.status(400).json({ status: 'error', mensagem: 'Data e motivo sao obrigatorios.' });
  }

  lista.push(novo);
  salvar(ARQUIVO, lista);
  return res.json(novo);
});

router.delete('/admin/imprevistos/:id', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const novaLista = lista.filter((item) => Number(item.id) !== id);

  if (novaLista.length === lista.length) {
    return res.status(404).json({ status: 'error', mensagem: 'Imprevisto nao encontrado.' });
  }

  salvar(ARQUIVO, novaLista);
  return res.json({ status: 'success', mensagem: 'Imprevisto removido.' });
});

module.exports = router;
