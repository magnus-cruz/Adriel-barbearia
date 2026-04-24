/* ================================================
   Alpha Barber - health.js
   Funcao: rotas de status e validacao de sessao admin.
   ================================================ */

'use strict';

const express = require('express');
const { tokenValido } = require('../middleware/auth');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'online' });
});

router.get('/admin/check', (req, res) => {
  const ok = tokenValido(req.headers.authorization || '');
  if (!ok) {
    return res.status(401).json({
      status: 'error',
      codigo: 401,
      mensagem: 'Nao autorizado. Token invalido.'
    });
  }

  res.json({ status: 'success', mensagem: 'Sessao valida.' });
});

router.post('/admin/login', (req, res) => {
  const { usuario, senha } = req.body || {};
  if (usuario === 'admin' && senha === 'barbearia123') {
    return res.json({
      status: 'success',
      token: 'barberco-admin-2026',
      mensagem: 'Login realizado com sucesso.'
    });
  }

  return res.status(401).json({
    status: 'error',
    codigo: 401,
    mensagem: 'Usuario ou senha invalidos.'
  });
});

module.exports = router;
