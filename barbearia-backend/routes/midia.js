const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* Configuração do armazenamento de upload */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = 'upload-' + uuidv4() + ext;
    cb(null, nome);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tiposOk = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (tiposOk.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Tipo não permitido.'), false);
  }
});

/* GET /api/galeria */
router.get('/galeria', (req, res) => {
  const metadados = ler('midia-metadata.json', []);
  res.json(metadados);
});

/* POST /api/admin/upload */
router.post('/admin/upload', autenticarAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Nenhum arquivo recebido.'
      });
    }

    const titulo = req.body.titulo || 'Sem título';
    const categoria = req.body.categoria || 'galeria';
    const url = 'http://localhost:8080/api/uploads/' + req.file.filename;

    const metadado = {
      id: uuidv4(),
      nomeArquivo: req.file.filename,
      titulo,
      categoria,
      url,
      tipo: req.file.mimetype,
      tamanhoKb: Math.round(req.file.size / 1024),
      dataUpload: new Date().toISOString().split('T')[0]
    };

    const lista = ler('midia-metadata.json', []);
    lista.push(metadado);
    salvar('midia-metadata.json', lista);

    console.log('Upload salvo:', req.file.filename);
    return res.json({
      status: 'success',
      mensagem: 'Arquivo enviado com sucesso.',
      arquivo: metadado
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro no upload: ' + erro.message
    });
  }
});

/* DELETE /api/admin/galeria/:nomeArquivo */
router.delete('/admin/galeria/:nomeArquivo', autenticarAdmin, (req, res) => {
  try {
    const nome = req.params.nomeArquivo;
    const caminho = path.join(UPLOADS_DIR, nome);

    if (fs.existsSync(caminho)) {
      fs.unlinkSync(caminho);
    }

    let lista = ler('midia-metadata.json', []);
    lista = lista.filter((m) => m.nomeArquivo !== nome);
    salvar('midia-metadata.json', lista);

    console.log('Arquivo excluído:', nome);
    return res.json({
      status: 'success',
      mensagem: 'Imagem excluída com sucesso.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao excluir: ' + erro.message
    });
  }
});

module.exports = router;