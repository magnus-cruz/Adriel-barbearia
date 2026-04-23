const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const noCache = require('./middleware/noCache');

const app = express();
const PORT = 8080;

/* Pastas obrigatórias do projeto */
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
[DATA_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* CORS liberado para o frontend local */
const originsPermitidas = ['http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || originsPermitidas.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origem não permitida pelo CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Cache-Control',
      'Pragma',
      'Expires'
    ]
  })
);

/* Garantir charset UTF-8 nas respostas JSON */
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/uploads')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

/* Anti-cache nos GETs */
app.use(noCache);

/* Body parsers */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* Servir uploads */
app.use('/api/uploads', express.static(UPLOADS_DIR));

/* Rotas da API */
app.use('/api', require('./routes/health'));
app.use('/api', require('./routes/servicos'));
app.use('/api', require('./routes/horarios'));
app.use('/api', require('./routes/agendamentos'));
app.use('/api/admin', require('./routes/imprevistos'));
app.use('/api', require('./routes/cursos'));
app.use('/api', require('./routes/midia'));
app.use('/api', require('./routes/barbeiros'));

/* 404 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    mensagem: 'Rota não encontrada: ' + req.path
  });
});

/* Erro global */
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({
    status: 'error',
    mensagem: 'Erro interno do servidor.'
  });
});

app.listen(PORT, () => {
  console.log('=================================');
  console.log('Servidor Node.js iniciado com sucesso');
  console.log('Servidor: http://localhost:' + PORT);
  console.log('Dados em: ' + DATA_DIR);
  console.log('Uploads em: ' + UPLOADS_DIR);
  console.log('=================================');
});