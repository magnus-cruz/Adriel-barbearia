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

/* GET /api/barbeiros - público */
router.get('/barbeiros', (req, res) => {
  res.json(ler('barbeiros.json', []));
});

/* POST /api/admin/barbeiros */
router.post('/admin/barbeiros', autenticarAdmin, upload.single('foto'), (req, res) => {
  try {
    const { nome, especialidade, instagram, ativo = true } = req.body;

    if (!nome) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Nome é obrigatório.'
      });
    }

    const fotoUrl = req.file
      ? 'http://localhost:8080/api/uploads/' + req.file.filename
      : null;

    const lista = ler('barbeiros.json', []);
    const novoId = lista.length > 0
      ? Math.max(...lista.map((b) => b.id)) + 1
      : 1;

    const novo = {
      id: novoId,
      nome,
      especialidade: especialidade || 'Barbeiro',
      instagram: instagram || '',
      fotoUrl,
      ativo: ativo !== 'false' && ativo !== false,
      criadoEm: new Date().toISOString().split('T')[0]
    };

    lista.push(novo);
    salvar('barbeiros.json', lista);

    console.log('Barbeiro adicionado:', novo.nome);
    return res.json({
      status: 'success',
      mensagem: 'Barbeiro adicionado com sucesso.',
      barbeiro: novo
    });
  } catch (e) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar barbeiro: ' + e.message
    });
  }
});

/* PUT /api/admin/barbeiros/:id */
router.put('/admin/barbeiros/:id', autenticarAdmin, upload.single('foto'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lista = ler('barbeiros.json', []);
    const idx = lista.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Barbeiro não encontrado.'
      });
    }

    if (req.file) {
      /* Remove foto antiga se existir */
      if (lista[idx].fotoUrl) {
        const nomeAntigo = lista[idx].fotoUrl.split('/').pop();
        const caminhoAntigo = path.join(UPLOADS_DIR, nomeAntigo);
        if (fs.existsSync(caminhoAntigo)) {
          fs.unlinkSync(caminhoAntigo);
        }
      }

      req.body.fotoUrl = 'http://localhost:8080/api/uploads/' + req.file.filename;
    }

    lista[idx] = { ...lista[idx], ...req.body, id };
    salvar('barbeiros.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Barbeiro atualizado.',
      barbeiro: lista[idx]
    });
  } catch (e) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao atualizar: ' + e.message
    });
  }
});

/* DELETE /api/admin/barbeiros/:id */
router.delete('/admin/barbeiros/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let lista = ler('barbeiros.json', []);
    const barbeiro = lista.find((b) => b.id === id);

    if (!barbeiro) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Barbeiro não encontrado.'
      });
    }

    /* Remove foto do disco */
    if (barbeiro.fotoUrl) {
      const nome = barbeiro.fotoUrl.split('/').pop();
      const caminho = path.join(UPLOADS_DIR, nome);
      if (fs.existsSync(caminho)) {
        fs.unlinkSync(caminho);
      }
    }

    lista = lista.filter((b) => b.id !== id);
    salvar('barbeiros.json', lista);

    console.log('Barbeiro removido:', barbeiro.nome);
    return res.json({
      status: 'success',
      mensagem: 'Barbeiro removido com sucesso.'
    });
  } catch (e) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao remover: ' + e.message
    });
  }
});

module.exports = router;
