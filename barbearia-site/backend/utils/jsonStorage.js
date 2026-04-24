/* ================================================
   Alpha Barber - jsonStorage.js
   Funcao: ler, salvar e gerar ids para arquivos JSON.
   ================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function garantirDiretorio() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ler(arquivo, padrao = []) {
  garantirDiretorio();
  const caminho = path.join(DATA_DIR, arquivo);

  try {
    if (!fs.existsSync(caminho)) return padrao;
    const bruto = fs.readFileSync(caminho, 'utf-8');
    return JSON.parse(bruto);
  } catch (erro) {
    console.error('Erro ao ler', arquivo, ':', erro.message);
    return padrao;
  }
}

function salvar(arquivo, dados) {
  garantirDiretorio();
  const caminho = path.join(DATA_DIR, arquivo);

  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
    return true;
  } catch (erro) {
    console.error('Erro ao salvar', arquivo, ':', erro.message);
    return false;
  }
}

function proximoId(lista) {
  if (!Array.isArray(lista) || !lista.length) return 1;
  return Math.max(...lista.map((item) => Number(item.id) || 0)) + 1;
}

module.exports = { ler, salvar, proximoId };
