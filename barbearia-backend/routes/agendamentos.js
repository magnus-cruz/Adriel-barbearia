const express = require('express');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

/* GET /api/agendamentos */
router.get('/agendamentos', (req, res) => {
  const { dataMin, status } = req.query;
  let lista = ler('agendamentos.json', []);

  if (dataMin) {
    lista = lista.filter((a) => a.data >= dataMin);
  }
  if (status && status !== 'todos') {
    lista = lista.filter((a) => a.status === status);
  }

  lista.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  res.json(lista);
});

/* POST /api/agendamentos */
router.post('/agendamentos', (req, res) => {
  try {
    const { nome, telefone, servico, barbeiro, data, horario } = req.body;

    if (!nome || !telefone || !servico || !data || !horario) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Todos os campos são obrigatórios.'
      });
    }

    const lista = ler('agendamentos.json', []);

    const conflito = lista.find(
      (a) => a.data === data && a.horario === horario && a.status !== 'cancelado'
    );

    if (conflito) {
      return res.status(409).json({
        status: 'error',
        mensagem: 'Este horário já está reservado.'
      });
    }

    const novoId = lista.length > 0 ? Math.max(...lista.map((a) => a.id)) + 1 : 1;

    const novo = {
      id: novoId,
      nome,
      telefone,
      servico,
      barbeiro: barbeiro || 'Qualquer barbeiro',
      data,
      horario,
      status: 'confirmado',
      criadoEm: new Date().toISOString().split('T')[0]
    };

    lista.push(novo);
    salvar('agendamentos.json', lista);

    console.log('Agendamento criado:', novo.nome, data, horario);
    return res.json({
      status: 'success',
      id: novoId,
      mensagem: 'Agendamento confirmado!'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao agendar: ' + erro.message
    });
  }
});

/* PUT /api/admin/agendamentos/:id/cancelar */
router.put('/admin/agendamentos/:id/cancelar', autenticarAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lista = ler('agendamentos.json', []);
    const idx = lista.findIndex((a) => a.id === id);

    if (idx === -1) {
      return res.status(404).json({
        status: 'error',
        mensagem: 'Agendamento não encontrado.'
      });
    }

    if (lista[idx].status === 'cancelado') {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Agendamento já está cancelado.'
      });
    }

    lista[idx].status = 'cancelado';
    salvar('agendamentos.json', lista);

    return res.json({
      status: 'success',
      mensagem: 'Agendamento cancelado.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao cancelar: ' + erro.message
    });
  }
});

module.exports = router;