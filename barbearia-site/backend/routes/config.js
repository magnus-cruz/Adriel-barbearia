/* ================================================
   Alpha Barber - config.js
   Funcao: ler e salvar configuracoes gerais da barbearia.
   ================================================ */

'use strict';

const express = require('express');
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'config.json';

const CONFIG_PADRAO = {
  whatsappNotificacao: '5561983088897',
  nomeBarbearia: 'Alpha Barber',
  endereco: ''
};

router.get('/admin/config', autenticarAdmin, (req, res) => {
  const config = ler(ARQUIVO, CONFIG_PADRAO);
  res.json({ ...CONFIG_PADRAO, ...config });
});

router.put('/admin/config', autenticarAdmin, (req, res) => {
  try {
    const atual = ler(ARQUIVO, {});
    const novo = { ...atual, ...req.body };
    salvar(ARQUIVO, novo);
    res.json({
      status: 'success',
      mensagem: 'Configuração salva.',
      config: novo
    });
  } catch (e) {
    res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar config: ' + e.message
    });
  }
});

module.exports = router;