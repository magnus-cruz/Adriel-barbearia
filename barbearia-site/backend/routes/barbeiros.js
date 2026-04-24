/* ================================================
   Alpha Barber - barbeiros.js
   Funcao: CRUD de barbeiros com suporte a foto.
   ================================================ */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ler, salvar, proximoId } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'barbeiros.json';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `barbeiro-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

function normalizarUrl(req, nomeArquivo) {
  return `${req.protocol}://${req.get('host')}/api/uploads/${nomeArquivo}`;
}

function whatsappValido(valor) {
  return /^\d{10,11}$/.test(String(valor || '').trim());
}

router.get('/barbeiros', (req, res) => {
  const lista = ler(ARQUIVO, []);
  const disponiveis = lista.filter((b) => b.ativo !== false && !b.pausado);
  res.json(disponiveis);
});

router.get('/admin/barbeiros', autenticarAdmin, (req, res) => {
  res.json(ler(ARQUIVO, []));
});

router.post('/admin/barbeiros', autenticarAdmin, upload.single('foto'), (req, res) => {
  const lista = ler(ARQUIVO, []);
  const nome = String(req.body.nome || '').trim();
  const whatsapp = String(req.body.whatsapp || '').trim();

  if (!nome) {
    return res.status(400).json({ status: 'error', mensagem: 'Nome do barbeiro e obrigatorio.' });
  }

  if (!whatsappValido(whatsapp)) {
    return res.status(400).json({ status: 'error', mensagem: 'WhatsApp invalido. Use 10 ou 11 digitos com DDD.' });
  }

  const novo = {
    id: proximoId(lista),
    nome,
    especialidade: String(req.body.especialidade || '').trim(),
    whatsapp,
    instagram: String(req.body.instagram || '').trim(),
    ativo: true,
    pausado: false,
    motivoPausa: '',
    criadoEm: new Date().toISOString().slice(0, 10),
    fotoArquivo: req.file ? req.file.filename : '',
    fotoUrl: req.file ? normalizarUrl(req, req.file.filename) : ''
  };

  lista.push(novo);
  salvar(ARQUIVO, lista);
  res.json(novo);
});

router.put('/admin/barbeiros/:id', autenticarAdmin, upload.single('foto'), (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const idx = lista.findIndex((item) => Number(item.id) === id);

  if (idx === -1) {
    return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
  }

  const atual = lista[idx];
  const whatsappEntrada = req.body.whatsapp;

  if (whatsappEntrada !== undefined && !whatsappValido(whatsappEntrada)) {
    return res.status(400).json({ status: 'error', mensagem: 'WhatsApp invalido. Use 10 ou 11 digitos com DDD.' });
  }

  if (req.file && atual.fotoArquivo) {
    const antigo = path.join(UPLOADS_DIR, atual.fotoArquivo);
    if (fs.existsSync(antigo)) fs.unlinkSync(antigo);
  }

  lista[idx] = {
    ...atual,
    nome: String(req.body.nome || atual.nome).trim(),
    especialidade: String(req.body.especialidade || atual.especialidade || '').trim(),
    whatsapp: whatsappEntrada !== undefined ? String(whatsappEntrada).trim() : String(atual.whatsapp || '').trim(),
    instagram: String(req.body.instagram || atual.instagram || '').trim(),
    ativo: req.body.ativo !== undefined ? req.body.ativo === 'true' || req.body.ativo === true : atual.ativo,
    pausado: req.body.pausado !== undefined ? req.body.pausado === 'true' || req.body.pausado === true : !!atual.pausado,
    motivoPausa: req.body.pausado !== undefined
      ? (req.body.pausado === 'true' || req.body.pausado === true ? String(req.body.motivoPausa || atual.motivoPausa || 'Indisponivel').trim() : '')
      : String(atual.motivoPausa || ''),
    fotoArquivo: req.file ? req.file.filename : atual.fotoArquivo,
    fotoUrl: req.file ? normalizarUrl(req, req.file.filename) : atual.fotoUrl
  };

  salvar(ARQUIVO, lista);
  res.json(lista[idx]);
});

router.delete('/admin/barbeiros/:id', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const id = Number(req.params.id);
  const item = lista.find((barbeiro) => Number(barbeiro.id) === id);

  if (!item) {
    return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
  }

  if (item.fotoArquivo) {
    const caminho = path.join(UPLOADS_DIR, item.fotoArquivo);
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
  }

  salvar(ARQUIVO, lista.filter((barbeiro) => Number(barbeiro.id) !== id));
  return res.json({ status: 'success', mensagem: 'Barbeiro removido.' });
});

router.patch('/admin/barbeiros/:id/pausar', autenticarAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const { pausado, motivoPausa } = req.body || {};
    const lista = ler(ARQUIVO, []);
    const idx = lista.findIndex((item) => Number(item.id) === id);

    if (idx === -1) {
      return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
    }

    const estaPausado = pausado === true || pausado === 'true';
    lista[idx].pausado = estaPausado;
    lista[idx].motivoPausa = estaPausado ? String(motivoPausa || 'Indisponivel').trim() : '';

    salvar(ARQUIVO, lista);

    console.log('Barbeiro', lista[idx].nome, estaPausado ? 'pausado' : 'reativado');

    return res.json({
      status: 'success',
      mensagem: estaPausado ? 'Barbeiro pausado com sucesso.' : 'Barbeiro reativado com sucesso.',
      barbeiro: lista[idx]
    });
  } catch (e) {
    return res.status(500).json({ status: 'error', mensagem: `Erro ao atualizar: ${e.message}` });
  }
});

module.exports = router;
