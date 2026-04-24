/* ================================================
   Alpha Barber - setup.js
   Funcao: preparar pastas e JSONs iniciais do backend.
   ================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

const JSONS_INICIAIS = {
  'servicos.json': [],
  'barbeiros.json': [],
  'agendamentos.json': [],
  'imprevistos.json': [],
  'midia-metadata.json': [],
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

function garantir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function executarSetup() {
  garantir(DATA_DIR);
  garantir(UPLOADS_DIR);

  Object.entries(JSONS_INICIAIS).forEach(([nome, valor]) => {
    const caminho = path.join(DATA_DIR, nome);
    if (!fs.existsSync(caminho)) {
      fs.writeFileSync(caminho, JSON.stringify(valor, null, 2), 'utf-8');
      console.log('Arquivo criado:', nome);
    }
  });

  ['.gitkeep'].forEach((arquivo) => {
    const dataKeep = path.join(DATA_DIR, arquivo);
    const uploadsKeep = path.join(UPLOADS_DIR, arquivo);
    if (!fs.existsSync(dataKeep)) fs.writeFileSync(dataKeep, '', 'utf-8');
    if (!fs.existsSync(uploadsKeep)) fs.writeFileSync(uploadsKeep, '', 'utf-8');
  });

  console.log('Setup concluido com sucesso.');
}

executarSetup();
