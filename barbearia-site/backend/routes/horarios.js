/* ================================================
   Alpha Barber - horarios.js
   Funcao: configuracao de horario e disponibilidade.
   ================================================ */

'use strict';

const express = require('express');
const { ler, salvar } = require('../utils/jsonStorage');
const { autenticarAdmin } = require('../middleware/auth');

const router = express.Router();
const ARQUIVO = 'horarios.json';

function toMinutos(hora) {
  const [h, m] = String(hora || '00:00').split(':').map(Number);
  return (h * 60) + m;
}

function paraHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function diaSemanaPt(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`);
  const mapa = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return mapa[data.getDay()];
}

function periodoBloqueado(periodo, hora) {
  const h = toMinutos(hora);
  if (periodo === 'dia_todo') return true;
  if (periodo === 'manha') return h < 12 * 60;
  if (periodo === 'tarde') return h >= 12 * 60;
  return false;
}

router.get('/horarios', (req, res) => {
  const dados = ler(ARQUIVO, { configuracao: { intervaloPadrao: 30, diasSemana: {} } });
  res.json(dados);
});

router.post('/admin/horarios', autenticarAdmin, (req, res) => {
  const payload = req.body || {};
  salvar(ARQUIVO, payload);
  res.json({ status: 'success', mensagem: 'Horarios atualizados.' });
});

router.get('/horarios/disponiveis', (req, res) => {
  const data = String(req.query.data || '').trim();
  if (!data) {
    return res.status(400).json({ status: 'error', mensagem: 'Parametro data e obrigatorio.' });
  }

  const horarios = ler(ARQUIVO, { configuracao: { intervaloPadrao: 30, diasSemana: {} } });
  const agendamentos = ler('agendamentos.json', []);
  const imprevistos = ler('imprevistos.json', []);

  const dia = diaSemanaPt(data);
  const cfgDia = horarios.configuracao?.diasSemana?.[dia];
  const intervalo = Number(horarios.configuracao?.intervaloPadrao || 30);

  if (!cfgDia || !cfgDia.ativo || !cfgDia.inicio || !cfgDia.fim) {
    return res.json([]);
  }

  const inicio = toMinutos(cfgDia.inicio);
  const fim = toMinutos(cfgDia.fim);
  const indisponiveis = new Set(
    agendamentos
      .filter((a) => a.data === data && (a.status || 'confirmado') !== 'cancelado')
      .map((a) => a.horario)
  );

  const bloqueios = imprevistos.filter((item) => item.data === data);
  const disponiveis = [];

  for (let atual = inicio; atual + intervalo <= fim; atual += intervalo) {
    const hora = paraHora(atual);
    const bloqueado = bloqueios.some((b) => periodoBloqueado(b.periodo, hora));
    if (!indisponiveis.has(hora) && !bloqueado) {
      disponiveis.push(hora);
    }
  }

  res.json(disponiveis);
});

module.exports = router;
