const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'barbeiro-' + uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, ok.includes(file.mimetype));
  }
});

function whatsappValido(valor) {
  return /^\d{10,11}$/.test(String(valor || '').trim());
}

function proximoId(lista) {
  if (!lista.length) return 1;
  return Math.max(...lista.map((b) => Number(b.id) || 0)) + 1;
}

/* GET /api/barbeiros - publico (apenas ativos e nao pausados) */
router.get('/barbeiros', (req, res) => {
  const lista = ler('barbeiros.json', []);
  res.json(lista.filter((b) => b.ativo !== false && !b.pausado));
});

/* GET /api/admin/barbeiros */
router.get('/admin/barbeiros', autenticarAdmin, (req, res) => {
  res.json(ler('barbeiros.json', []));
});

/* POST /api/admin/barbeiros */
router.post('/admin/barbeiros', autenticarAdmin, upload.single('foto'), (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const whatsapp = String(req.body.whatsapp || '').trim();

    if (!nome) {
      return res.status(400).json({ status: 'error', mensagem: 'Nome e obrigatorio.' });
    }

    if (!whatsappValido(whatsapp)) {
      return res.status(400).json({ status: 'error', mensagem: 'WhatsApp invalido. Use 10 ou 11 digitos com DDD.' });
    }

    const fotoUrl = req.file ? 'http://localhost:8080/api/uploads/' + req.file.filename : null;
    const lista = ler('barbeiros.json', []);

    const novo = {
      id: proximoId(lista),
      nome,
      especialidade: String(req.body.especialidade || '').trim(),
      whatsapp,
      instagram: String(req.body.instagram || '').trim(),
      fotoUrl,
      ativo: true,
      pausado: false,
      motivoPausa: '',
      criadoEm: new Date().toISOString().slice(0, 10)
    };

    lista.push(novo);
    salvar('barbeiros.json', lista);

    return res.json({ status: 'success', mensagem: 'Barbeiro adicionado com sucesso.', barbeiro: novo });
  } catch (e) {
    return res.status(500).json({ status: 'error', mensagem: 'Erro ao salvar barbeiro: ' + e.message });
  }
});

/* PUT /api/admin/barbeiros/:id */
router.put('/admin/barbeiros/:id', autenticarAdmin, upload.single('foto'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lista = ler('barbeiros.json', []);
    const idx = lista.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
    }

    if (req.body.whatsapp !== undefined && !whatsappValido(req.body.whatsapp)) {
      return res.status(400).json({ status: 'error', mensagem: 'WhatsApp invalido. Use 10 ou 11 digitos com DDD.' });
    }

    if (req.file && lista[idx].fotoUrl) {
      const nomeAntigo = lista[idx].fotoUrl.split('/').pop();
      const caminhoAntigo = path.join(UPLOADS_DIR, nomeAntigo);
      if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
    }

    const atual = lista[idx];
    lista[idx] = {
      ...atual,
      nome: req.body.nome !== undefined ? String(req.body.nome).trim() : atual.nome,
      especialidade: req.body.especialidade !== undefined ? String(req.body.especialidade).trim() : atual.especialidade,
      whatsapp: req.body.whatsapp !== undefined ? String(req.body.whatsapp).trim() : atual.whatsapp,
      instagram: req.body.instagram !== undefined ? String(req.body.instagram).trim() : atual.instagram,
      ativo: req.body.ativo !== undefined ? req.body.ativo === true || req.body.ativo === 'true' : atual.ativo,
      fotoUrl: req.file ? 'http://localhost:8080/api/uploads/' + req.file.filename : atual.fotoUrl
    };

    salvar('barbeiros.json', lista);
    return res.json({ status: 'success', mensagem: 'Barbeiro atualizado.', barbeiro: lista[idx] });
  } catch (e) {
    return res.status(500).json({ status: 'error', mensagem: 'Erro ao atualizar: ' + e.message });
  }
});

/* PATCH /api/admin/barbeiros/:id/pausar */
router.patch('/admin/barbeiros/:id/pausar', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pausado, motivoPausa } = req.body || {};
    const lista = ler('barbeiros.json', []);
    const idx = lista.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
    }

    const estaPausado = pausado === true || pausado === 'true';
    lista[idx].pausado = estaPausado;
    lista[idx].motivoPausa = estaPausado ? String(motivoPausa || 'Indisponivel').trim() : '';

    salvar('barbeiros.json', lista);

    return res.json({
      status: 'success',
      mensagem: estaPausado ? 'Barbeiro pausado com sucesso.' : 'Barbeiro reativado com sucesso.',
      barbeiro: lista[idx]
    });
  } catch (e) {
    return res.status(500).json({ status: 'error', mensagem: 'Erro ao atualizar: ' + e.message });
  }
});

/* DELETE /api/admin/barbeiros/:id */
router.delete('/admin/barbeiros/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let lista = ler('barbeiros.json', []);
    const barbeiro = lista.find((b) => b.id === id);

    if (!barbeiro) {
      return res.status(404).json({ status: 'error', mensagem: 'Barbeiro nao encontrado.' });
    }

    if (barbeiro.fotoUrl) {
      const nome = barbeiro.fotoUrl.split('/').pop();
      const caminho = path.join(UPLOADS_DIR, nome);
      if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    }

    lista = lista.filter((b) => b.id !== id);
    salvar('barbeiros.json', lista);

    return res.json({ status: 'success', mensagem: 'Barbeiro removido com sucesso.' });
  } catch (e) {
    return res.status(500).json({ status: 'error', mensagem: 'Erro ao remover: ' + e.message });
  }
});

module.exports = router;
