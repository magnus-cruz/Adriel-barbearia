/* ================================================
   Alpha Barber - api.js
   Funcao: centralizar chamadas HTTP para a API Node.
   ================================================ */

'use strict';

const API_BASE = 'http://localhost:8080';

function semCache(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_=${Date.now()}`;
}

function getTokenLocal() {
  return localStorage.getItem('barber_admin_token') || '';
}

async function parseResposta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.mensagem || `HTTP ${res.status}`);
  }
  return data;
}

async function apiGet(endpoint, admin = false) {
  const headers = {
    'Cache-Control': 'no-cache, no-store',
    Pragma: 'no-cache'
  };

  if (admin) headers.Authorization = `Bearer ${getTokenLocal()}`;

  const res = await fetch(semCache(`${API_BASE}${endpoint}`), {
    method: 'GET',
    headers
  });

  if (res.status === 401 && admin) {
    window.location.href = '/admin/login.html';
    throw new Error('Sessao expirada.');
  }

  return parseResposta(res);
}

function apiGetAdmin(endpoint) {
  return apiGet(endpoint, true);
}

async function apiRequest(method, endpoint, body, admin = false) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache'
  };

  if (admin) headers.Authorization = `Bearer ${getTokenLocal()}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && admin) {
    window.location.href = '/admin/login.html';
    throw new Error('Sessao expirada.');
  }

  return parseResposta(res);
}

function apiUpload(endpoint, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = getTokenLocal();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(pct);
        }
      });
    }

    xhr.addEventListener('load', () => {
      const data = JSON.parse(xhr.responseText || '{}');
      if (xhr.status === 401) {
        window.location.href = '/admin/login.html';
        reject(new Error('Sessao expirada.'));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data.mensagem || `HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Servidor offline.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')));

    xhr.open('POST', `${API_BASE}${endpoint}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

async function verificarServidor() {
  try {
    const res = await fetch(semCache(`${API_BASE}/api/health`));
    return res.ok;
  } catch (_) {
    return false;
  }
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

const API = {
  base: API_BASE,
  semCache,
  apiGet,
  apiGetAdmin,
  apiRequest,
  apiUpload,
  verificarServidor,
  formatarData,
  formatarMoeda,

  health: () => apiGet('/api/health'),
  servicos: () => apiGet('/api/servicos'),
  barbeiros: () => apiGet('/api/barbeiros'),
  horarios: () => apiGet('/api/horarios'),
  disponibilidade: (data, servico) => apiGet(`/api/horarios/disponiveis?data=${encodeURIComponent(data)}&servico=${encodeURIComponent(servico || '')}`),
  agendar: (payload) => apiRequest('POST', '/api/agendamentos', payload),
  galeria: () => apiGet('/api/galeria'),

  adminCheck: () => apiGet('/api/admin/check', true),
  adminLogin: (usuario, senha) => apiRequest('POST', '/api/admin/login', { usuario, senha }),
  adminConfig: {
    listar: () => apiGet('/api/admin/config', true),
    salvar: (payload) => apiRequest('PUT', '/api/admin/config', payload, true)
  },

  adminServicos: {
    listar: () => apiGet('/api/admin/servicos', true),
    criar: (payload) => apiRequest('POST', '/api/admin/servicos', payload, true),
    atualizar: (id, payload) => apiRequest('PUT', `/api/admin/servicos/${id}`, payload, true),
    excluir: (id) => apiRequest('DELETE', `/api/admin/servicos/${id}`, null, true)
  },

  adminBarbeiros: {
    listar: () => apiGet('/api/admin/barbeiros', true),
    excluir: (id) => apiRequest('DELETE', `/api/admin/barbeiros/${id}`, null, true),
    salvarComFoto: (formData) => apiUpload('/api/admin/barbeiros', formData),
    pausar: (id, pausado, motivoPausa) => apiRequest('PATCH', `/api/admin/barbeiros/${id}/pausar`, { pausado, motivoPausa }, true)
  },

  adminHorarios: {
    salvar: (payload) => apiRequest('POST', '/api/admin/horarios', payload, true)
  },

  adminImprevistos: {
    listar: () => apiGet('/api/admin/imprevistos', true),
    criar: (payload) => apiRequest('POST', '/api/admin/imprevistos', payload, true),
    excluir: (id) => apiRequest('DELETE', `/api/admin/imprevistos/${id}`, null, true)
  },

  adminAgendamentos: {
    listar: (dataInicio, dataFim) => {
      const params = new URLSearchParams();
      if (dataInicio) params.set('dataInicio', dataInicio);
      if (dataFim) params.set('dataFim', dataFim);
      const query = params.toString();
      return apiGet(`/api/admin/agendamentos${query ? `?${query}` : ''}`, true);
    },
    cancelar: (id) => apiRequest('PUT', `/api/admin/agendamentos/${id}/cancelar`, null, true),
    excluir: (id) => apiRequest('DELETE', `/api/admin/agendamentos/${id}`, null, true)
  },

  adminMidia: {
    upload: (formData, onProgress) => apiUpload('/api/admin/upload', formData, onProgress),
    excluir: (nomeArquivo) => apiRequest('DELETE', `/api/admin/galeria/${encodeURIComponent(nomeArquivo)}`, null, true),
    criarVideo: (payload) => apiRequest('POST', '/api/midias/video', payload, true)
  }
};

window.API = API;
