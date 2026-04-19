const API_BASE = "http://localhost:8080";
let currentUploadXhr = null;

function endpointComNoCache(endpoint) {
  const separador = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separador}_=${Date.now()}`;
}

function resolveApiAssetUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function adminHeaders(isJson = true) {
  const token = typeof window.getToken === "function"
    ? window.getToken()
    : (localStorage.getItem("barber_admin_token") || "");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isJson) headers["Content-Type"] = "application/json";
  return headers;
}

async function apiRequest(method, endpoint, body = null, extraOptions = {}) {
  const metodo = String(method || "GET").toUpperCase();
  const endpointFinal = metodo === "GET" ? endpointComNoCache(endpoint) : endpoint;
  const options = {
    method: metodo,
    headers: extraOptions.headers || {},
    ...extraOptions
  };

  if (metodo === "GET") {
    options.headers = {
      "Cache-Control": "no-cache",
      ...options.headers
    };
  }

  if (body !== null && body !== undefined) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.headers = { "Content-Type": "application/json", ...options.headers };
      options.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpointFinal}`, options);
  } catch (error) {
    throw new Error("Spring Boot nao esta rodando. Inicie o servidor.");
  }

  const contentType = response.headers.get("content-type") || "";
  const responseBody = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error("Erro interno do servidor.");
    }

    if (response.status >= 400) {
      if (typeof responseBody === "object" && responseBody?.mensagem) {
        throw new Error(responseBody.mensagem);
      }
      throw new Error(typeof responseBody === "string" && responseBody ? responseBody : "Erro na requisicao.");
    }
  }

  return responseBody;
}

async function checkServerOnline() {
  try {
    const response = await fetch(`${API_BASE}${endpointComNoCache("/api/health")}`, {
      method: "GET",
      headers: { "Cache-Control": "no-cache" }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function cancelUpload() {
  if (currentUploadXhr) {
    currentUploadXhr.abort();
    currentUploadXhr = null;
  }
}

async function carregarGaleria() {
  const lista = await apiRequest("GET", "/api/galeria");
  const itens = Array.isArray(lista) ? lista : [];

  if (typeof window.renderGaleria === "function") {
    window.renderGaleria(itens);
  }

  return itens;
}

function normalizarMidias(lista) {
  return (Array.isArray(lista) ? lista : []).map((item) => ({
    tipo: (item.tipo || "").startsWith("video/") ? "video" : "foto",
    categoria: item.categoria || item.category || "Galeria",
    titulo: item.titulo || item.nome || "Arquivo",
    url: item.url,
    nome: item.nome,
    nomeArquivo: item.nomeArquivo || item.nome || (item.url ? String(item.url).split("/").pop() : ""),
    dataUpload: item.dataUpload,
    mime: item.tipo
  }));
}

function uploadMidia(file, metadata = {}, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error("Arquivo invalido para upload."));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (metadata?.titulo) formData.append("titulo", metadata.titulo);
    if (metadata?.categoria) formData.append("categoria", metadata.categoria);

    const xhr = new XMLHttpRequest();
    currentUploadXhr = xhr;

    xhr.open("POST", `${API_BASE}/api/admin/upload`, true);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percentual = Math.round((event.loaded / event.total) * 100);
      onProgress(percentual);
    });

    xhr.addEventListener("load", () => {
      currentUploadXhr = null;
      let body = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch (error) {
        body = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }

      if (xhr.status >= 500) {
        reject(new Error("Erro interno do servidor."));
        return;
      }

      if (xhr.status >= 400) {
        reject(new Error(body?.mensagem || "Arquivo invalido."));
        return;
      }

      reject(new Error("Falha inesperada no upload."));
    });

    xhr.addEventListener("error", async () => {
      currentUploadXhr = null;
      const online = await checkServerOnline();
      if (!online) {
        reject(new Error("Spring Boot nao esta rodando. Inicie o servidor."));
        return;
      }
      reject(new Error("Erro de CORS. Verifique o CorsConfig.java."));
    });

    xhr.addEventListener("abort", () => {
      currentUploadXhr = null;
      reject(new Error("Upload cancelado pelo usuario."));
    });

    xhr.send(formData);
  });
}

const API = {
  API_BASE,
  apiRequest,
  checkServerOnline,
  uploadMidia,
  cancelUpload,
  resolveApiAssetUrl,
  carregarGaleria,

  getServicos: () => apiRequest("GET", "/api/servicos"),
  getCursos: () => apiRequest("GET", "/api/cursos"),
  getMidias: async () => normalizarMidias(await apiRequest("GET", "/api/galeria")),
  getDisponibilidade: (data, servico) => apiRequest("GET", `/api/horarios/disponiveis?data=${encodeURIComponent(data)}&servico=${encodeURIComponent(servico || "")}`),
  criarAgendamento: (payload) => apiRequest("POST", "/api/agendamentos", payload),

  adminLogin: (usuario, senha) => apiRequest("POST", "/api/admin/login", { usuario, senha }),
  adminCheck: () => apiRequest("GET", "/api/admin/check", null, { headers: adminHeaders(false) }),

  adminServicos: {
    list: () => apiRequest("GET", "/api/admin/servicos", null, { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("POST", "/api/admin/servicos", payload, { headers: adminHeaders() }),
    update: (id, payload) => apiRequest("PUT", `/api/admin/servicos/${id}`, payload, { headers: adminHeaders() }),
    delete: (id) => apiRequest("DELETE", `/api/admin/servicos/${id}`, null, { headers: adminHeaders(false) })
  },

  adminHorarios: {
    get: () => apiRequest("GET", "/api/horarios"),
    update: (payload) => apiRequest("POST", "/api/admin/horarios", payload, { headers: adminHeaders() })
  },

  adminImprevistos: {
    list: () => apiRequest("GET", "/api/admin/imprevistos", null, { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("POST", "/api/admin/imprevistos", payload, { headers: adminHeaders() }),
    delete: (id) => apiRequest("DELETE", `/api/admin/imprevistos/${id}`, null, { headers: adminHeaders(false) })
  },

  adminMidias: {
    list: () => apiRequest("GET", "/api/galeria"),
    delete: (nomeArquivo) => apiRequest("DELETE", `/api/admin/galeria/${encodeURIComponent(nomeArquivo)}`, null, { headers: adminHeaders(false) }),
    createVideo: (payload) => apiRequest("POST", "/api/midias/video", payload, { headers: adminHeaders() }),
    uploadFoto: (file, metadata, onProgress) => uploadMidia(file, metadata, onProgress)
  },

  adminCursos: {
    list: () => apiRequest("GET", "/api/admin/cursos", null, { headers: adminHeaders(false) }),
    create: (payload) => apiRequest("POST", "/api/admin/cursos", payload, { headers: adminHeaders() }),
    update: (id, payload) => apiRequest("PUT", `/api/admin/cursos/${id}`, payload, { headers: adminHeaders() }),
    delete: (id) => apiRequest("DELETE", `/api/admin/cursos/${id}`, null, { headers: adminHeaders(false) })
  },

  adminAgendamentos: {
    list: (data = "") => apiRequest("GET", `/api/admin/agendamentos${data ? `?data=${data}` : ""}`, null, { headers: adminHeaders(false) }),
    cancel: (id) => apiRequest("PUT", `/api/admin/agendamentos/${id}/cancelar`, null, { headers: adminHeaders(false) })
  }
};

window.API = API;
window.resolveApiAssetUrl = resolveApiAssetUrl;
window.carregarGaleria = carregarGaleria;
