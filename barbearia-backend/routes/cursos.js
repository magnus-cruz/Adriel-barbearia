const express = require('express');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

/* GET /api/cursos */
router.get('/cursos', (req, res) => {
  res.json(ler('cursos.json', []));
});

/* POST /api/admin/cursos */
router.post('/admin/cursos', autenticarAdmin, (req, res) => {
  try {
    const { titulo, preco, cargaHoraria, descricao, imagemUrl, linkCompra } = req.body;

    if (!titulo || !preco) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Título e preço são obrigatórios.'
      });
    }

    const lista = ler('cursos.json', []);
    const novoId = lista.length > 0 ? Math.max(...lista.map((c) => c.id)) + 1 : 1;

    const novo = {
      id: novoId,
      titulo,
      preco: parseFloat(preco),
      cargaHoraria,
      descricao,
      imagemUrl,
      linkCompra
    };

    lista.push(novo);
    salvar('cursos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Curso salvo.',
      curso: novo
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar curso: ' + erro.message
    });
  }
});

/* PUT /api/admin/cursos/:id */
router.put('/admin/cursos/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lista = ler('cursos.json', []);
    const idx = lista.findIndex((c) => c.id === id);

    if (idx === -1) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Curso não encontrado.'
      });
    }

    lista[idx] = { ...lista[idx], ...req.body, id };
    salvar('cursos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Curso atualizado.',
      curso: lista[idx]
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao atualizar: ' + erro.message
    });
  }
});

/* DELETE /api/admin/cursos/:id */
router.delete('/admin/cursos/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let lista = ler('cursos.json', []);
    lista = lista.filter((c) => c.id !== id);
    salvar('cursos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Curso excluído.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao excluir: ' + erro.message
    });
  }
});

module.exports = router;