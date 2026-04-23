const express = require('express');

const router = express.Router();
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const CONFIG_PADRAO = {
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
};

/* GET /api/horarios */
router.get('/horarios', (req, res) => {
  const config = ler('horarios.json', CONFIG_PADRAO);
  res.json(config);
});

/* POST /api/admin/horarios */
router.post('/admin/horarios', autenticarAdmin, (req, res) => {
  try {
    const { dia, inicio, fim, ativo, intervaloPadrao } = req.body;

    const config = ler('horarios.json', CONFIG_PADRAO);

    if (dia) {
      config.configuracao.diasSemana[dia] = { inicio, fim, ativo };
    }

    if (intervaloPadrao) {
      config.configuracao.intervaloPadrao = parseInt(intervaloPadrao, 10);
    }

    salvar('horarios.json', config);

    return res.json({
      status: 'success',
      mensagem: 'Horários salvos com sucesso.'
    });
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao salvar horários: ' + erro.message
    });
  }
});

/* GET /api/horarios/disponiveis?data=2026-04-20&servico=Corte */
router.get('/horarios/disponiveis', (req, res) => {
  try {
    const { data, servico } = req.query;

    if (!data) {
      return res.status(400).json({
        status: 'error',
        mensagem: 'Parâmetro data é obrigatório.'
      });
    }

    const config = ler('horarios.json', CONFIG_PADRAO);
    const agendamentos = ler('agendamentos.json', []);
    const imprevistos = ler('imprevistos.json', []);
    const servicos = ler('servicos.json', []);

    const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dataObj = new Date(data + 'T12:00:00');
    const diaNome = diasMap[dataObj.getDay()];
    const diaConfig = config.configuracao.diasSemana[diaNome];

    if (!diaConfig || !diaConfig.ativo) {
      return res.json([]);
    }

    let duracaoMin = 30;
    if (servico) {
      const svc = servicos.find((s) => s.nome.toLowerCase() === String(servico).toLowerCase());
      if (svc) {
        duracaoMin = svc.duracaoMinutos;
      }
    }

    function gerarSlots(inicio, fim, intervalo) {
      const slots = [];
      let [hI, mI] = inicio.split(':').map(Number);
      const [hF, mF] = fim.split(':').map(Number);
      const totalFim = hF * 60 + mF;

      while (hI * 60 + mI < totalFim) {
        slots.push(String(hI).padStart(2, '0') + ':' + String(mI).padStart(2, '0'));
        mI += intervalo;
        if (mI >= 60) {
          hI += Math.floor(mI / 60);
          mI %= 60;
        }
      }

      return slots;
    }

    const todos = gerarSlots(
      diaConfig.inicio,
      diaConfig.fim,
      config.configuracao.intervaloPadrao
    );

    const ocupados = agendamentos
      .filter((a) => a.data === data && a.status !== 'cancelado')
      .map((a) => a.horario);

    const bloqueadoDiaTodo = imprevistos.some((i) => i.data === data && i.periodo === 'dia_todo');
    if (bloqueadoDiaTodo) {
      return res.json([]);
    }

    const manhaOcupada = imprevistos.some((i) => i.data === data && i.periodo === 'manha');
    const tardeOcupada = imprevistos.some((i) => i.data === data && i.periodo === 'tarde');

    const [hFim, mFim] = diaConfig.fim.split(':').map(Number);
    const minFim = hFim * 60 + mFim;

    const disponiveis = todos.filter((slot) => {
      if (ocupados.includes(slot)) {
        return false;
      }

      const [h, m] = slot.split(':').map(Number);
      const minSlot = h * 60 + m;

      if (manhaOcupada && minSlot < 12 * 60) {
        return false;
      }
      if (tardeOcupada && minSlot >= 12 * 60) {
        return false;
      }
      if (minSlot + duracaoMin > minFim) {
        return false;
      }

      return true;
    });

    return res.json(disponiveis);
  } catch (erro) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao calcular horários: ' + erro.message
    });
  }
});

module.exports = router;