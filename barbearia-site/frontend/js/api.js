const API_BASE_URL = "http://localhost:8080/api";

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    throw new Error("Falha de conexao com o backend (API offline ou CORS bloqueado).");
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na API");
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

function adminHeaders(isJson = true) {
  const token = localStorage.getItem("adminToken") || "";
  const headers = { Authorization: `Bearer ${token}` };
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

const API = {
  getServicos: () => apiRequest("/servicos"),
  getCursos: () => apiRequest("/cursos"),
  getMidias: () => apiRequest("/midias"),
  getDisponibilidade: (data) => apiRequest(`/agendamentos/disponibilidade?data=${data}`),
  criarAgendamento: (payload) =>
    apiRequest("/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  adminLogin: (usuario, senha) =>
    apiRequest("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    }),
  adminCheck: () => apiRequest("/admin/check", { headers: adminHeaders(false) }),

  adminServicos: {
    list: () => apiRequest("/admin/servicos", { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("/admin/servicos", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }),
    update: (id, payload) => apiRequest(`/admin/servicos/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(payload) }),
    delete: (id) => apiRequest(`/admin/servicos/${id}`, { method: "DELETE", headers: adminHeaders(false) })
  },

  adminHorarios: {
    get: () => apiRequest("/admin/horarios", { headers: adminHeaders(false) }),
    update: (payload) => apiRequest("/admin/horarios", { method: "PUT", headers: adminHeaders(), body: JSON.stringify(payload) })
  },

  adminImprevistos: {
    list: () => apiRequest("/admin/imprevistos", { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("/admin/imprevistos", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }),
    delete: (id) => apiRequest(`/admin/imprevistos/${id}`, { method: "DELETE", headers: adminHeaders(false) })
  },

  adminMidias: {
    list: () => apiRequest("/admin/midias", { headers: adminHeaders(false) }),
    delete: (id) => apiRequest(`/midias/${id}`, { method: "DELETE", headers: adminHeaders(false) }),
    createVideo: (payload) => apiRequest("/midias/video", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }),
    uploadFoto: async (formData) => {
      const token = localStorage.getItem("adminToken") || "";
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/midias/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } catch (error) {
        throw new Error("Falha de conexao no upload (API offline ou CORS bloqueado).");
      }
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Falha ao enviar imagem");
      }
      return response.json();
    }
  },

  adminCursos: {
    list: () => apiRequest("/admin/cursos", { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("/admin/cursos", { method: "POST", headers: adminHeaders(), body: JSON.stringify(payload) }),
    update: (id, payload) => apiRequest(`/admin/cursos/${id}`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify(payload) }),
    delete: (id) => apiRequest(`/admin/cursos/${id}`, { method: "DELETE", headers: adminHeaders(false) })
  },

  adminAgendamentos: {
    list: (data = "") => apiRequest(`/admin/agendamentos${data ? `?data=${data}` : ""}`, { headers: adminHeaders(false) }),
    cancel: (id) => apiRequest(`/admin/agendamentos/${id}/cancelar`, { method: "PATCH", headers: adminHeaders(false) })
  }
};
