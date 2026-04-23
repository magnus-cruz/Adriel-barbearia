function requireAuth() {
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    window.location.href = "login.html";
  }
}

async function validarSessaoAdmin() {
  // Mantem verificacao simples local para o modo 100% sem dependencias externas.
  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    alert("Sua sessao expirou. Faca login novamente.");
    window.location.href = "login.html";
    throw new Error("Sessao expirada");
  }
}

let horariosConfigCache = null;
let selectedUploadFile = null;
let agendamentosCache = [];
window.arquivoSelecionado = null;

const abaFuncoes = {
  "tab-servicos": () => carregarServicos(),
  "tab-horarios": () => carregarHorarios(),
  "tab-imprevistos": () => carregarImprevistos(),
  "tab-galeria": () => carregarMidiasAdmin(),
  "tab-cursos": () => carregarCursos(),
  "tab-agendamentos": () => carregarAgendamentos()
};

function mostrarSucesso(mensagem) {
  mostrarToast(mensagem, "sucesso");
}

function mostrarErro(mensagem) {
  mostrarToast(mensagem, "erro");
}

function mostrarToast(msg, tipo) {
  const cores = {
    sucesso: {
      bg: "rgba(23,23,20,0.97)",
      borda: "var(--dark-goldenrod)",
      texto: "var(--pale-oak)"
    },
    erro: {
      bg: "rgba(23,23,20,0.97)",
      borda: "#e05555",
      texto: "#e05555"
    }
  };
  const c = cores[tipo] || cores.sucesso;

  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    background: ${c.bg};
    border-left: 3px solid ${c.borda};
    color: ${c.texto};
    padding: 0.9rem 1.4rem;
    border-radius: 4px;
    font-family: 'Barlow', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 99998;
    max-width: 320px;
    line-height: 1.5;
    box-shadow: 2px 2px 12px rgba(0,0,0,0.5);
    animation: slideInToast 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function renderEstadoTabela(tbody, colunas, mensagem, cor = "rgba(253,240,213,.3)") {
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colunas}" style="text-align:center;color:${cor};padding:1.5rem">
        ${mensagem}
      </td>
    </tr>`;
}

function atualizarEstadoBotaoUpload(ativo) {
  const botao = document.getElementById("btn-enviar");
  if (!botao) return;

  botao.disabled = !ativo;
  botao.style.opacity = ativo ? "1" : "0.4";
  botao.style.cursor = ativo ? "pointer" : "not-allowed";
}

function atualizarProgresso(pct) {
  const wrap = document.getElementById("progress-wrap");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-pct");

  if (wrap) wrap.style.display = "block";
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
}

function resetarProgresso() {
  atualizarProgresso(0);
  const wrap = document.getElementById("progress-wrap");
  if (wrap) wrap.style.display = "none";
}

function limparPreviewUpload() {
  selectedUploadFile = null;
  window.arquivoSelecionado = null;

  const input = document.getElementById("file-upload");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");
  const dropZone = document.getElementById("drop-zone");
  const textoPrincipal = dropZone?.querySelector(".text span");
  const botao = document.getElementById("btn-enviar");

  if (input) input.value = "";
  if (previewWrap) previewWrap.style.display = "none";
  if (previewImg) previewImg.src = "";
  if (previewNome) previewNome.textContent = "";
  if (textoPrincipal) textoPrincipal.textContent = "Clique ou arraste a imagem aqui";
  if (dropZone) {
    dropZone.classList.remove("drag-over");
    dropZone.style.borderColor = "var(--taupe)";
  }
  if (botao) {
    botao.disabled = true;
    botao.style.opacity = "0.4";
    botao.style.cursor = "not-allowed";
  }
}

function processarArquivo(arquivo) {
  const dropZone = document.getElementById("drop-zone");
  const previewWrap = document.getElementById("preview-wrap");
  const previewImg = document.getElementById("preview-img");
  const previewNome = document.getElementById("preview-nome");
  const textoPrincipal = dropZone?.querySelector(".text span");

  if (!arquivo) {
    limparPreviewUpload();
    return;
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
  if (!tiposPermitidos.includes(arquivo.type)) {
    mostrarErro("Tipo nÃ£o permitido. Use JPG, PNG, WEBP ou MP4.");
    limparPreviewUpload();
    return;
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    mostrarErro("Arquivo muito grande. MÃ¡ximo de 10MB.");
    limparPreviewUpload();
    return;
  }

  selectedUploadFile = arquivo;
  window.arquivoSelecionado = arquivo;

  const leitor = new FileReader();
  leitor.onload = (event) => {
    if (previewImg) previewImg.src = event.target.result;
    if (previewNome) {
      previewNome.textContent = `${arquivo.name} â€” ${(arquivo.size / 1024).toFixed(0)} KB`;
    }
    if (previewWrap) previewWrap.style.display = "block";
    if (textoPrincipal) textoPrincipal.textContent = `âœ“ ${arquivo.name}`;
    if (dropZone) dropZone.style.borderColor = "var(--dark-goldenrod)";
    atualizarEstadoBotaoUpload(true);
  };
  leitor.readAsDataURL(arquivo);
}

function configurarUploadImagem() {
  const dropZone = document.getElementById("drop-zone");
  const input = document.getElementById("file-upload");

  if (!dropZone || !input) return;

  limparPreviewUpload();

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    const arquivo = event.dataTransfer?.files?.[0];
    if (arquivo) {
      processarArquivo(arquivo);
    }
  });

  input.addEventListener("change", () => {
    const arquivo = input.files && input.files[0];
    if (arquivo) {
      processarArquivo(arquivo);
    } else {
      limparPreviewUpload();
    }
  });
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.remove("active"));

      btn.classList.add("active");
      const painel = document.getElementById(btn.dataset.tab);
      if (painel) painel.classList.add("active");

      // Sempre recarrega os dados da aba selecionada.
      const carregarAba = abaFuncoes[btn.dataset.tab];
      if (typeof carregarAba === "function") {
        carregarAba().catch((erro) => {
          console.error("Falha ao carregar aba:", erro?.message || erro);
        });
      }
    });
  });
}

function initTabsScrollHint() {
  const tabs = document.querySelector(".admin-tabs");
  if (!tabs || tabs.dataset.scrollBound === "true") return;

  const atualizarHint = () => {
    const possuiOverflow = tabs.scrollWidth > tabs.clientWidth + 2;
    const chegouFim = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2;
    tabs.classList.toggle("has-scroll-hint", possuiOverflow && !chegouFim && tabs.dataset.scrolled !== "true");
  };

  tabs.dataset.scrollBound = "true";
  tabs.dataset.scrolled = "false";

  tabs.addEventListener("scroll", () => {
    if (tabs.scrollLeft > 8) tabs.dataset.scrolled = "true";
    atualizarHint();
  });

  window.addEventListener("resize", atualizarHint);
  atualizarHint();
}

function abrirModalExcluir(nomeArquivo, cardElement) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" id="modal-card">
      <div class="modal-titulo">Excluir imagem</div>
      <div class="modal-mensagem">
        Tem certeza que deseja excluir esta imagem?<br>
        <strong style="color:var(--pale-oak)">${nomeArquivo}</strong><br>
        Esta acao nao pode ser desfeita.
      </div>
      <div class="modal-acoes">
        <button class="btn-modal-cancelar" id="btn-cancelar-modal" type="button">Cancelar</button>
        <button class="btn-modal-excluir" id="btn-confirmar-excluir" type="button">Excluir</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  function fechar() {
    document.removeEventListener("keydown", escHandler);
    backdrop.remove();
    document.body.style.overflow = "";
  }

  function escHandler(event) {
    if (event.key === "Escape") fechar();
  }

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) fechar();
  });

  backdrop.querySelector("#btn-cancelar-modal")?.addEventListener("click", fechar);
  backdrop.querySelector("#btn-confirmar-excluir")?.addEventListener("click", () => {
    fechar();
    excluirImagem(nomeArquivo, cardElement);
  });

  document.addEventListener("keydown", escHandler);
}

async function carregarServicos() {
  const tabela = document.getElementById("tbody-servicos");
  if (!tabela) return;

  renderEstadoTabela(tabela, 4, "Carregando...");

  try {
    const servicos = await API.adminServicos.list();
    if (!Array.isArray(servicos) || !servicos.length) {
      renderEstadoTabela(tabela, 4, "Nenhum servico cadastrado.");
      return;
    }

    tabela.innerHTML = servicos.map((servico) => `
    <tr>
      <td>${servico.nome}</td>
      <td>R$ ${Number(servico.preco || 0).toFixed(2)}</td>
      <td>${servico.duracaoMinutos} min</td>
      <td>
        <div class="acoes-cell">
          <button class="btn-acao btn-editar" type="button" onclick='editarServico(${JSON.stringify(servico)})'>Editar</button>
          <button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirServico(${servico.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
  } catch (erro) {
    renderEstadoTabela(tabela, 4, `Erro ao carregar. <br><small>${erro?.message || "Falha na API."}</small>`, "#e05555");
  }
}

function editarServico(servico) {
  document.getElementById("servico-id").value = servico.id;
  document.getElementById("nome-servico").value = servico.nome || "";
  document.getElementById("preco-servico").value = servico.preco ?? "";
  document.getElementById("duracao-servico").value = servico.duracaoMinutos ?? "";
  document.getElementById("ativo-servico").checked = !!servico.ativo;
}

async function excluirServico(id) {
  await API.adminServicos.delete(id);
  await carregarServicos();
}

async function salvarServico(e) {
  e.preventDefault();
  const id = document.getElementById("servico-id").value;
  const payload = {
    nome: document.getElementById("nome-servico").value,
    preco: Number(document.getElementById("preco-servico").value),
    duracaoMinutos: Number(document.getElementById("duracao-servico").value),
    ativo: document.getElementById("ativo-servico").checked
  };

  try {
    if (id) await API.adminServicos.update(id, payload);
    else await API.adminServicos.create(payload);

    e.target.reset();
    mostrarSucesso("Servico salvo com sucesso!");
    await carregarServicos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar servico: ${erro?.message || "falha desconhecida"}`);
  }
}

async function carregarHorarios() {
  const tabela = document.getElementById("tbody-horarios");
  if (!tabela) return;

  renderEstadoTabela(tabela, 5, "Carregando...");
  try {
    const data = await API.adminHorarios.get();
    horariosConfigCache = data;
    const dias = horariosConfigCache.configuracao?.diasSemana || {};

    const intervalo = document.getElementById("intervalo-padrao");
    if (intervalo) intervalo.value = horariosConfigCache.configuracao?.intervaloPadrao || 30;

  const rotulos = {
    segunda: "Segunda",
    terca: "Terca",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sabado",
    domingo: "Domingo"
  };

    tabela.innerHTML = Object.keys(rotulos).map((dia) => {
      const d = dias[dia] || { ativo: false, inicio: null, fim: null };
      return `<tr><td>${rotulos[dia]}</td><td>${d.ativo ? "Ativo" : "Inativo"}</td><td>${d.inicio || "-"}</td><td>${d.fim || "-"}</td><td><button class="btn-acao btn-editar" type="button" onclick="editarHorario('${dia}')">Editar</button></td></tr>`;
    }).join("");

    preencherFormularioHorario(document.getElementById("dia-semana").value);
  } catch (erro) {
    renderEstadoTabela(tabela, 5, `Erro ao carregar horarios.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
  }
}

function preencherFormularioHorario(dia) {
  const dias = horariosConfigCache?.configuracao?.diasSemana || {};
  const confDia = dias[dia] || { ativo: false, inicio: null, fim: null };

  document.getElementById("dia-semana").value = dia;
  document.getElementById("dia-ativo").checked = !!confDia.ativo;
  document.getElementById("inicio-horario").value = confDia.inicio || "";
  document.getElementById("fim-horario").value = confDia.fim || "";
}

function editarHorario(dia) {
  preencherFormularioHorario(dia);
}

async function salvarHorario(e) {
  e.preventDefault();

  const dia = document.getElementById("dia-semana").value;
  const ativo = document.getElementById("dia-ativo").checked;
  const inicio = document.getElementById("inicio-horario").value;
  const fim = document.getElementById("fim-horario").value;
  const intervalo = Number(document.getElementById("intervalo-padrao").value);

  if (!horariosConfigCache?.configuracao) {
    horariosConfigCache = { configuracao: { intervaloPadrao: 30, diasSemana: {} } };
  }

  if (!horariosConfigCache.configuracao.diasSemana) {
    horariosConfigCache.configuracao.diasSemana = {};
  }

  horariosConfigCache.configuracao.intervaloPadrao = intervalo;
  horariosConfigCache.configuracao.diasSemana[dia] = {
    inicio: ativo ? inicio || null : null,
    fim: ativo ? fim || null : null,
    ativo
  };

  try {
    await API.adminHorarios.update(horariosConfigCache);
    mostrarSucesso("Horario salvo com sucesso!");
    await carregarHorarios();
  } catch (erro) {
    mostrarErro(`Erro ao salvar horario: ${erro?.message || "falha desconhecida"}`);
  }
}

function limparFormularioHorario() {
  preencherFormularioHorario(document.getElementById("dia-semana").value);
}

async function carregarImprevistos() {
  const tabela = document.getElementById("tbody-imprevistos");
  if (!tabela) return;

  renderEstadoTabela(tabela, 4, "Carregando...");

  try {
    const itens = await API.adminImprevistos.list();
    if (!Array.isArray(itens) || !itens.length) {
      renderEstadoTabela(tabela, 4, "Nenhum imprevisto cadastrado.");
      return;
    }

    tabela.innerHTML = itens.map((item) => `
    <tr>
      <td>${item.data}</td>
      <td>${item.periodo}</td>
      <td>${item.motivo}</td>
      <td><button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirImprevisto(${item.id})">Excluir</button></td>
    </tr>
  `).join("");
  } catch (erro) {
    renderEstadoTabela(tabela, 4, `Erro ao carregar.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
  }
}

async function excluirImprevisto(id) {
  await API.adminImprevistos.delete(id);
  await carregarImprevistos();
}

async function salvarImprevisto(e) {
  e.preventDefault();
  try {
    await API.adminImprevistos.create({
      data: document.getElementById("data-imprevisto").value,
      periodo: document.getElementById("periodo-imprevisto").value,
      motivo: document.getElementById("motivo-imprevisto").value
    });
    e.target.reset();
    mostrarSucesso("Bloqueio adicionado!");
    await carregarImprevistos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar imprevisto: ${erro?.message || "falha desconhecida"}`);
  }
}

async function carregarMidiasAdmin() {
  await API.carregarGaleria();
}

async function excluirMidia(id) {
  await API.adminMidias.delete(id);
  await carregarMidiasAdmin();
}

function uploadMidia(arquivo, titulo, categoria, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    // Garante sessao valida antes de iniciar o envio.
    if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
      reject(new Error("Faca login como administrador primeiro."));
      return;
    }

    const token = typeof getToken === "function" ? getToken() : "";
    if (!token) {
      reject(new Error("Token nao encontrado. Faca login novamente."));
      return;
    }

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("titulo", titulo);
    formData.append("categoria", categoria);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percentual = Math.round((event.loaded / event.total) * 100);
      onProgress(percentual);
    });

    xhr.addEventListener("load", () => {
      let resposta = {};
      try {
        resposta = JSON.parse(xhr.responseText || "{}");
      } catch (error) {
        reject(new Error("Resposta invalida do servidor."));
        return;
      }

      if (xhr.status === 200 && (resposta.status === "success" || resposta.status === "sucesso")) {
        resolve(resposta);
        return;
      }

      if (xhr.status === 401) {
        reject(new Error("Sessao expirada. Faca login novamente."));
        return;
      }

      reject(new Error(resposta.mensagem || "Falha desconhecida."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Servidor offline. Inicie o Spring Boot."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelado."));
    });

    // Sequencia obrigatoria para multipart com token.
    xhr.open("POST", "http://localhost:8080/api/admin/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

function diagnosticarToken() {
  const token = typeof getToken === "function" ? getToken() : "";
  const logado = typeof isAdminLogado === "function" ? isAdminLogado() : false;

  console.log("=== DIAGNOSTICO TOKEN ===");
  console.log("Logado:", logado);
  console.log("Token:", token);
  console.log("Header que sera enviado:", `Bearer ${token}`);

  alert(
    `Logado: ${logado}\nToken: ${token}\nVerifique o console (F12).`
  );
}

async function uploadFoto(e) {
  e.preventDefault();

  const arquivo = window.arquivoSelecionado || selectedUploadFile || document.getElementById("file-upload")?.files?.[0];
  const titulo = (document.getElementById("titulo-midia")?.value || "").trim();
  const categoria = document.getElementById("categoria-midia")?.value || "galeria";

  if (!titulo) {
    mostrarErro("Informe um titulo para a imagem antes de enviar.");
    return;
  }

  if (!arquivo) {
    mostrarErro("Selecione uma imagem para enviar.");
    return;
  }

  if (typeof isAdminLogado !== "function" || !isAdminLogado()) {
    mostrarErro("Faca login como administrador primeiro.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  const progressWrap = document.getElementById("progress-wrap");
  if (progressWrap) progressWrap.style.display = "block";
  atualizarProgresso(0);

  try {
    const online = await API.checkServerOnline();
    if (!online) {
      throw new Error("Spring Boot nao esta rodando. Inicie o servidor.");
    }

    await uploadMidia(arquivo, titulo, categoria, (percentual) => {
      atualizarProgresso(percentual);
    });

    await API.carregarGaleria();
    mostrarSucesso("Imagem adicionada Ã  galeria com sucesso!");
    e.target.reset();
    limparPreviewUpload();
  } catch (error) {
    const message = error?.message || "Falha ao enviar imagem.";
    if (message.toLowerCase().includes("sessao expirada")) {
      mostrarErro(message);
      if (typeof fazerLogout === "function") {
        fazerLogout();
      }
      return;
    }
    mostrarErro(`Erro no upload: ${message}`);
  } finally {
    resetarProgresso();
  }
}

async function salvarVideo(e) {
  e.preventDefault();
  await API.adminMidias.createVideo({
    categoria: document.getElementById("video-categoria").value,
    titulo: document.getElementById("video-titulo").value,
    url: document.getElementById("video-url").value
  });
  e.target.reset();
  await carregarMidiasAdmin();
}

async function carregarCursos() {
  const tabela = document.getElementById("tbody-cursos");
  if (!tabela) return;

  renderEstadoTabela(tabela, 4, "Carregando...");

  try {
    const cursos = await API.adminCursos.list();
    if (!Array.isArray(cursos) || !cursos.length) {
      renderEstadoTabela(tabela, 4, "Nenhum curso cadastrado.");
      return;
    }

    tabela.innerHTML = cursos.map((curso) => `
    <tr>
      <td>${curso.titulo}</td>
      <td>R$ ${Number(curso.preco || 0).toFixed(2)}</td>
      <td>${curso.cargaHoraria}</td>
      <td>
        <div class="acoes-cell">
          <button class="btn-acao btn-editar" type="button" onclick='editarCurso(${JSON.stringify(curso)})'>Editar</button>
          <button class="btn-acao btn-excluir-tabela" type="button" onclick="excluirCurso(${curso.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join("");
  } catch (erro) {
    renderEstadoTabela(tabela, 4, `Erro ao carregar.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
  }
}

function editarCurso(curso) {
  document.getElementById("curso-id").value = curso.id;
  document.getElementById("titulo-curso").value = curso.titulo || "";
  document.getElementById("desc-curso").value = curso.descricao || "";
  document.getElementById("preco-curso").value = curso.preco ?? "";
  document.getElementById("carga-curso").value = curso.cargaHoraria || "";
  document.getElementById("imagem-curso").value = curso.imagemUrl || "";
  document.getElementById("link-curso").value = curso.linkCompra || "";
}

async function excluirCurso(id) {
  await API.adminCursos.delete(id);
  await carregarCursos();
}

async function salvarCurso(e) {
  e.preventDefault();
  const id = document.getElementById("curso-id").value;
  const payload = {
    titulo: document.getElementById("titulo-curso").value,
    descricao: document.getElementById("desc-curso").value,
    preco: Number(document.getElementById("preco-curso").value),
    cargaHoraria: document.getElementById("carga-curso").value,
    imagemUrl: document.getElementById("imagem-curso").value,
    linkCompra: document.getElementById("link-curso").value
  };

  try {
    if (id) await API.adminCursos.update(id, payload);
    else await API.adminCursos.create(payload);

    e.target.reset();
    mostrarSucesso("Curso salvo com sucesso!");
    await carregarCursos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar curso: ${erro?.message || "falha desconhecida"}`);
  }
}

async function carregarAgendamentos() {
  const tabela = document.getElementById("tbody-agendamentos");
  if (tabela) {
    renderEstadoTabela(tabela, 6, "Carregando...");
  }

  const data = document.getElementById("filtro-data")?.value || "";
  try {
    agendamentosCache = await API.adminAgendamentos.list(data);
    filtrarAgendamentos();
  } catch (erro) {
    if (tabela) {
      renderEstadoTabela(tabela, 6, `Erro ao carregar.<br><small>${erro?.message || "falha na API"}</small>`, "#e05555");
    }
  }
}

function formatarData(dataIso) {
  if (!dataIso || !String(dataIso).includes("-")) return dataIso || "-";
  const [ano, mes, dia] = String(dataIso).split("-");
  return `${dia}/${mes}/${ano}`;
}

function badgeStatus(status) {
  const valor = String(status || "pendente").toLowerCase();
  const estilos = {
    confirmado: "color:#4caf50",
    pendente: "color:#f59e0b",
    cancelado: "color:#e05555",
    concluido: "color:rgba(207,189,166,0.4)"
  };
  const estilo = estilos[valor] || estilos.pendente;
  return `<span style="font-size:0.82rem;${estilo}">â— ${valor}</span>`;
}

function renderizarAgendamento(ag) {
  const status = String(ag?.status || "pendente").toLowerCase();
  const jaFinalizado = status === "cancelado" || status === "concluido";

  const acoes = jaFinalizado
    ? `<span style="font-size:0.75rem;color:rgba(253,240,213,0.25);letter-spacing:0.08em;text-transform:uppercase;">-</span>`
    : `<button class="btn secondary btn-cancelar-ag" type="button" onclick="cancelarAgendamento(${ag.id}, this)">Cancelar</button>`;

  return `
    <tr>
      <td>${ag.nome || "-"}</td>
      <td>${ag.servico || "-"}</td>
      <td>${formatarData(ag.data)}</td>
      <td>${ag.horario || "-"}</td>
      <td>${badgeStatus(status)}</td>
      <td>${acoes}</td>
    </tr>
  `;
}

function filtrarAgendamentos() {
  const tabela = document.getElementById("tbody-agendamentos");
  if (!tabela) return;

  const filtro = (document.getElementById("filtro-status")?.value || "todos").toLowerCase();
  const filtrados = agendamentosCache.filter((agendamento) => {
    const status = String(agendamento?.status || "pendente").toLowerCase();
    return filtro === "todos" || status === filtro;
  });

  if (!filtrados.length) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum agendamento encontrado para o filtro selecionado.</td></tr>';
    return;
  }

  tabela.innerHTML = filtrados.map((agendamento) => renderizarAgendamento(agendamento)).join("");
}

async function cancelarAgendamento(id, botao) {
  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Cancelando...";
    }

    await API.adminAgendamentos.cancel(id);
    await carregarAgendamentos();
  } catch (error) {
    alert(error?.message || "Nao foi possivel cancelar o agendamento.");
  }
}

function bindLogout() {
  const botao = document.getElementById("logout");
  if (!botao) return;
  botao.addEventListener("click", () => {
    if (typeof fazerLogout === "function") {
      fazerLogout();
    } else {
      window.location.href = "login.html";
    }
  });
}

window.abrirModalExcluir = abrirModalExcluir;
window.filtrarAgendamentos = filtrarAgendamentos;
window.editarServico = editarServico;
window.excluirServico = excluirServico;
window.editarHorario = editarHorario;
window.excluirImprevisto = excluirImprevisto;
window.excluirCurso = excluirCurso;
window.cancelarAgendamento = cancelarAgendamento;
window.diagnosticarToken = diagnosticarToken;

window.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  await validarSessaoAdmin();

  bindTabs();
  initTabsScrollHint();
  bindLogout();
  configurarUploadImagem();

  document.getElementById("form-servico")?.addEventListener("submit", salvarServico);
  document.getElementById("form-horarios")?.addEventListener("submit", salvarHorario);
  document.getElementById("dia-semana")?.addEventListener("change", (event) => preencherFormularioHorario(event.target.value));
  document.getElementById("horarios-reset")?.addEventListener("click", limparFormularioHorario);
  document.getElementById("form-imprevisto")?.addEventListener("submit", salvarImprevisto);
  document.getElementById("form-foto")?.addEventListener("submit", uploadFoto);
  document.getElementById("form-video")?.addEventListener("submit", salvarVideo);
  document.getElementById("form-curso")?.addEventListener("submit", salvarCurso);
  document.getElementById("btn-filtrar-data")?.addEventListener("click", carregarAgendamentos);

  // Carrega dados da primeira aba no startup.
  await carregarServicos();
});


