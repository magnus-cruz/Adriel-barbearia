/* ================================================
   Alpha Barber - auth.js
   Funcao: autenticar, validar e encerrar sessao admin.
   ================================================ */

'use strict';

const AUTH_KEY = 'barber_admin_token';
const LOGIN_KEY = 'barber_admin_logged';
const TOKEN = 'barberco-admin-2026';

const CREDENCIAIS = {
  usuario: 'admin',
  senha: 'barbearia123'
};

function fazerLogin(usuario, senha) {
  if (usuario === CREDENCIAIS.usuario && senha === CREDENCIAIS.senha) {
    localStorage.setItem(AUTH_KEY, TOKEN);
    localStorage.setItem(LOGIN_KEY, 'true');
    return true;
  }
  return false;
}

function fazerLogout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LOGIN_KEY);
  window.location.href = '/admin/login.html';
}

function isAdminLogado() {
  return localStorage.getItem(AUTH_KEY) === TOKEN && localStorage.getItem(LOGIN_KEY) === 'true';
}

function exigirAdmin() {
  if (!isAdminLogado()) {
    window.location.href = '/admin/login.html';
  }
}

function redirecionarSeLogado() {
  if (isAdminLogado()) {
    window.location.href = '/admin/painel.html';
  }
}

function getToken() {
  return localStorage.getItem(AUTH_KEY) || '';
}

window.fazerLogin = fazerLogin;
window.fazerLogout = fazerLogout;
window.isAdminLogado = isAdminLogado;
window.exigirAdmin = exigirAdmin;
window.redirecionarSeLogado = redirecionarSeLogado;
window.getToken = getToken;
