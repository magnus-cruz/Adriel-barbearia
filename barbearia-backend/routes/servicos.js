const express = require('express');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

/* GET /api/servicos */
router.get('/servicos', (req, res) => {
  const servicos = ler('servicos.json', []);
  res.json(servicos);
});

/* POST /api/admin/servicos */
router.post('/admin/servicos', autenticarAdmin, (req, res) => {
  try {
    const { nome, preco, duracaoMinutos, ativo = true } = req.body;

    if (!nome || !preco || !duracaoMinutos) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Campos obrigatórios: nome, preco, duracaoMinutos'
      });
    }

    const servicos = ler('servicos.json', []);
    const novoId = servicos.length > 0 ? Math.max(...servicos.map((s) => s.id)) + 1 : 1;

    const novo = {
      id: novoId,
      nome,
      preco: parseFloat(preco),
      duracaoMinutos: parseInt(duracaoMinutos, 10),
      ativo
    };

    servicos.push(novo);
    salvar('servicos.json', servicos);

    console.log('Serviço salvo:', novo.nome);
    return res.json({
      status: 'success',
      mensagem: 'Serviço salvo com sucesso.',
      servico: novo
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar serviço: ' + erro.message
    });
  }
});

/* PUT /api/admin/servicos/:id */
router.put('/admin/servicos/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const servicos = ler('servicos.json', []);
    const idx = servicos.findIndex((s) => s.id === id);

    if (idx === -1) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Serviço não encontrado.'
      });
    }

    servicos[idx] = { ...servicos[idx], ...req.body, id };
    salvar('servicos.json', servicos);

    return res.json({
      status: 'success',
      mensagem: 'Serviço atualizado.',
      servico: servicos[idx]
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao atualizar: ' + erro.message
    });
  }
});

/* DELETE /api/admin/servicos/:id */
router.delete('/admin/servicos/:id', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let servicos = ler('servicos.json', []);
    const tamanhoAntes = servicos.length;
    servicos = servicos.filter((s) => s.id !== id);

    if (servicos.length === tamanhoAntes) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Serviço não encontrado.'
      });
    }

    salvar('servicos.json', servicos);
    return res.json({
      status: 'success',
      mensagem: 'Serviço excluído.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao excluir: ' + erro.message
    });
  }
});

module.exports = router;