/* ================================================
   Alpha Barber - midia.js
   Funcao: upload, listagem e remocao de midias da galeria.
   ================================================ */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'midia-metadata.json';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `upload-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

function montarUrl(req, nomeArquivo) {
  return `${req.protocol}://${req.get('host')}/api/uploads/${nomeArquivo}`;
}

router.get('/galeria', (req, res) => {
  res.json(ler(ARQUIVO, []));
});

router.post('/admin/upload', autenticarAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', mensagem: 'Arquivo nao enviado.' });
  }

  const lista = ler(ARQUIVO, []);
  const item = {
    id: uuidv4(),
    nomeArquivo: req.file.filename,
    tipo: req.file.mimetype,
    categoria: String(req.body.categoria || 'galeria').trim(),
    titulo: String(req.body.titulo || req.file.originalname).trim(),
    url: montarUrl(req, req.file.filename),
    tamanhoKb: Math.round(req.file.size / 1024),
    dataUpload: new Date().toISOString().slice(0, 10)
  };

  lista.push(item);
  salvar(ARQUIVO, lista);

  return res.json({
    status: 'success',
    mensagem: 'Upload concluido com sucesso.',
    item
  });
});

router.post('/midias/video', autenticarAdmin, (req, res) => {
  const lista = ler(ARQUIVO, []);
  const payload = req.body || {};

  const item = {
    id: uuidv4(),
    nomeArquivo: String(payload.url || '').trim(),
    tipo: 'video/mp4',
    categoria: String(payload.categoria || 'galeria').trim(),
    titulo: String(payload.titulo || 'Video').trim(),
    url: String(payload.url || '').trim(),
    tamanhoKb: 0,
    dataUpload: new Date().toISOString().slice(0, 10)
  };

  if (!item.url || !item.titulo) {
    return res.status(400).json({ status: 'error', mensagem: 'Titulo e URL do video sao obrigatorios.' });
  }

  lista.push(item);
  salvar(ARQUIVO, lista);
  return res.json({ status: 'success', mensagem: 'Video adicionado.', item });
});

router.delete('/admin/galeria/:nomeArquivo', autenticarAdmin, (req, res) => {
  const nomeArquivo = decodeURIComponent(req.params.nomeArquivo || '');
  const lista = ler(ARQUIVO, []);
  const alvo = lista.find((item) => item.nomeArquivo === nomeArquivo);

  if (!alvo) {
    return res.status(404).json({ status: 'error', mensagem: 'Midia nao encontrada.' });
  }

  if (alvo.url.includes('/api/uploads/')) {
    const caminho = path.join(UPLOADS_DIR, nomeArquivo);
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
  }

  salvar(ARQUIVO, lista.filter((item) => item.nomeArquivo !== nomeArquivo));
  return res.json({ status: 'success', mensagem: 'Midia removida.' });
});

module.exports = router;
