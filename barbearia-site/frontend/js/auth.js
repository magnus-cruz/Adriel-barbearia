// Chaves de autenticacao local do painel administrativo.
const AUTH_KEY = "barber_admin_token";
const LOGIN_KEY = "barber_admin_logged";
const TOKEN = "barberco-admin-2026";

// Verifica se a sessao administrativa local esta ativa.
function isAdminLogado() {
  return localStorage.getItem(AUTH_KEY) === TOKEN
    && localStorage.getItem(LOGIN_KEY) === "true";
}

// Realiza login local do admin com credenciais fixas definidas no projeto.
function fazerLogin(usuario, senha) {
  if (usuario === "admin" && senha === "barbearia123") {
    localStorage.setItem(AUTH_KEY, TOKEN);
    localStorage.setItem(LOGIN_KEY, "true");
    return true;
  }
  return false;
}

// Encerra a sessao e retorna para a tela de login.
function fazerLogout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LOGIN_KEY);
  window.location.href = "/admin/login.html";
}

// Bloqueia telas administrativas para usuarios nao autenticados.
function exigirAdmin() {
  if (!isAdminLogado()) {
    window.location.href = "/admin/login.html";
  }
}

// Retorna o token atual da sessao para envio no header Authorization.
function getToken() {
  return localStorage.getItem(AUTH_KEY) || "";
}

window.isAdminLogado = isAdminLogado;
window.fazerLogin = fazerLogin;
window.fazerLogout = fazerLogout;
window.exigirAdmin = exigirAdmin;
window.getToken = getToken;
