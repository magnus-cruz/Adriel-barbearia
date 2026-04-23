const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/* Garante que data/ existe */
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* Lê JSON e devolve padrão em caso de erro */
function ler(nomeArquivo, padrao = []) {
  const caminho = path.join(DATA_DIR, nomeArquivo);

  try {
    if (!fs.existsSync(caminho)) {
      return padrao;
    }

    const conteudo = fs.readFileSync(caminho, 'utf-8').trim();
    if (!conteudo) {
      return padrao;
    }

    return JSON.parse(conteudo);
  } catch (erro) {
    console.error('Erro ao ler ' + nomeArquivo + ':', erro.message);
    return padrao;
  }
}

/* Salva JSON formatado */
function salvar(nomeArquivo, dados) {
  const caminho = path.join(DATA_DIR, nomeArquivo);

  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
    return true;
  } catch (erro) {
    console.error('Erro ao salvar ' + nomeArquivo + ':', erro.message);
    return false;
  }
}

module.exports = { ler, salvar };