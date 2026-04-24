/* ================================================
   Alpha Barber - server.js
   Funcao: iniciar API Node.js/Express e registrar rotas.
   ================================================ */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

const JSONsIniciais = {
  'servicos.json': [],
  'barbeiros.json': [],
  'agendamentos.json': [],
  'imprevistos.json': [],
  'midia-metadata.json': [],
  'config.json': {
    whatsappNotificacao: '5561983088897',
    nomeBarbearia: 'Alpha Barber',
    endereco: 'Rua XV de Novembro, 142 — Paracatu, MG'
  },
  'horarios.json': {
    configuracao: {
      intervaloPadrao: 30,
      diasSemana: {
        segunda: { inicio: '09:00', fim: '18:00', ativo: true },
        terca: { inicio: '09:00', fim: '18:00', ativo: true },
        quarta: { inicio: '09:00', fim: '18:00', ativo: true },
        quinta: { inicio: '09:00', fim: '18:00', ativo: true },
        sexta: { inicio: '09:00', fim: '19:00', ativo: true },
        sabado: { inicio: '08:00', fim: '17:00', ativo: true },
        domingo: { ativo: false }
      }
    }
  }
};

[dataDir, uploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Pasta criada:', dir);
  }
});

Object.entries(JSONsIniciais).forEach(([nome, valor]) => {
  const caminho = path.join(dataDir, nome);
  if (!fs.existsSync(caminho)) {
    fs.writeFileSync(caminho, JSON.stringify(valor, null, 2), 'utf-8');
    console.log('JSON criado:', nome);
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With']
}));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

app.use('/api', require('./routes/health'));
app.use('/api', require('./routes/servicos'));
app.use('/api', require('./routes/barbeiros'));
app.use('/api', require('./routes/horarios'));
app.use('/api', require('./routes/agendamentos'));
app.use('/api', require('./routes/config'));
app.use('/api', require('./routes/imprevistos'));
app.use('/api', require('./routes/midia'));

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    codigo: 404,
    mensagem: `Rota nao encontrada: ${req.method} ${req.path}`
  });
});

app.use((err, req, res, next) => {
  console.error('Erro global:', err.message);
  res.status(500).json({
    status: 'error',
    codigo: 500,
    mensagem: err.message || 'Erro interno do servidor.'
  });
});

app.listen(PORT, () => {
  console.log('\n================================');
  console.log('Alpha Barber API rodando');
  console.log(`http://localhost:${PORT}`);
  console.log(`Dados em: ${dataDir}`);
  console.log('Token: barberco-admin-2026');
  console.log('================================\n');
});
