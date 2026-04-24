/* ================================================
   Alpha Barber - ui.js
   Funcao: toasts, modal de confirmacao e helpers visuais.
   ================================================ */

'use strict';

function mostrarToast(msg, tipo = 'sucesso') {
  const cores = {
    sucesso: 'var(--dark-goldenrod)',
    erro: '#e05555',
    aviso: '#f59e0b'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = msg;
  toast.style.borderLeftColor = cores[tipo] || cores.sucesso;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 280);
  }, 3400);
}

function mostrarSucesso(msg) { mostrarToast(msg, 'sucesso'); }
function mostrarErro(msg) { mostrarToast(msg, 'erro'); }
function mostrarAviso(msg) { mostrarToast(msg, 'aviso'); }

function abrirModalConfirmar(titulo, mensagem, onConfirmar) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-card">
      <div class="modal-titulo">${titulo}</div>
      <div class="modal-mensagem">${mensagem}</div>
      <div class="modal-acoes">
        <button type="button" class="btn-outline" id="btn-modal-cancelar">Cancelar</button>
        <button type="button" class="btn-primary" id="btn-modal-confirmar">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  function fechar() {
    document.body.style.overflow = '';
    backdrop.remove();
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) fechar();
  });

  backdrop.querySelector('#btn-modal-cancelar').addEventListener('click', fechar);
  backdrop.querySelector('#btn-modal-confirmar').addEventListener('click', () => {
    fechar();
    if (typeof onConfirmar === 'function') onConfirmar();
  });
}

window.mostrarToast = mostrarToast;
window.mostrarSucesso = mostrarSucesso;
window.mostrarErro = mostrarErro;
window.mostrarAviso = mostrarAviso;
window.abrirModalConfirmar = abrirModalConfirmar;
