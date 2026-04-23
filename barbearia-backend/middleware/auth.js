const TOKEN_ADMIN = 'barberco-admin-2026';

/* Middleware para proteger rotas administrativas */
function autenticarAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  console.log('Auth header:', authHeader);
  console.log('Token extraído:', token);

  if (token !== TOKEN_ADMIN) {
    return res.status(401).json({
      status: 'error',
      codigo: 401,
      mensagem: 'Não autorizado. Token inválido ou ausente.'
    });
  }

  return next();
}

/* Utilitário para validação isolada de token */
function tokenValido(authHeader) {
  if (!authHeader) {
    return false;
  }
  return authHeader.replace('Bearer ', '').trim() === TOKEN_ADMIN;
}

module.exports = { autenticarAdmin, tokenValido };