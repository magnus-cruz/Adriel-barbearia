/* ================================================
   Alpha Barber - auth.js
   Funcao: validar token administrativo da API.
   ================================================ */

'use strict';

const TOKEN = 'barberco-admin-2026';

function tokenValido(header) {
  if (!header) return false;
  return header.replace('Bearer ', '').trim() === TOKEN;
}

function autenticarAdmin(req, res, next) {
  const header = req.headers.authorization || '';

  if (!tokenValido(header)) {
    return res.status(401).json({
      status: 'error',
      codigo: 401,
      mensagem: 'Nao autorizado. Token invalido.'
    });
  }

  next();
}

module.exports = { TOKEN, tokenValido, autenticarAdmin };
