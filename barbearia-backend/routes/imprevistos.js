const express = require('express');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

/* GET /api/admin/imprevistos */
router.get('/imprevistos', autenticarAdmin, (req, res) => {
  res.json(ler('imprevistos.json', []));
});

/* POST /api/admin/imprevistos */
router.post('/imprevistos', autenticarAdmin, (req, res) => {
  try {
    const { data, periodo, motivo } = req.body;

    if (!data || !motivo) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Data e motivo são obrigatórios.'
      });
    }

    const lista = ler('imprevistos.json', []);
    const novoId = lista.length > 0 ? Math.max(...lista.map((i) => i.id)) + 1 : 1;

    const novo = { id: novoId, data, periodo, motivo };
    lista.push(novo);
    salvar('imprevistos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Bloqueio adicionado.',
      imprevisto: novo
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar: ' + erro.message
    });
  }
});

/* DELETE /api/admin/imprevistos/:id */
router.delete('/imprevistos/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let lista = ler('imprevistos.json', []);
    lista = lista.filter((i) => i.id !== id);
    salvar('imprevistos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Bloqueio removido.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao excluir: ' + erro.message
    });
  }
});

module.exports = router;