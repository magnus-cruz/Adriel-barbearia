/* ================================================
   Alpha Barber - noCache.js
   Funcao: aplicar headers anti-cache para respostas GET.
   ================================================ */

'use strict';

function noCache(req, res, next) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}

module.exports = { noCache };
