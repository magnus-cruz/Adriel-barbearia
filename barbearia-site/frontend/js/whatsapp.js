const WHATSAPP_NUMERO = "5561999999999";

function buildWhatsAppURL(nome = "", servico = "", data = "", horario = "") {
  const mensagem = `Ola! Gostaria de agendar na barbearia.%0A` +
    `Nome: ${encodeURIComponent(nome)}%0A` +
    `Servico: ${encodeURIComponent(servico)}%0A` +
    `Data: ${encodeURIComponent(data)}%0A` +
    `Horario: ${encodeURIComponent(horario)}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagem}`;
}

function renderWhatsAppFloat() {
  const botao = document.createElement("a");
  botao.className = "whatsapp-float";
  botao.href = buildWhatsAppURL();
  botao.target = "_blank";
  botao.rel = "noreferrer";
  botao.ariaLabel = "Abrir WhatsApp";
  botao.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
  document.body.appendChild(botao);
}

function injectLoader() {
  const html = `
    <div id="loader-overlay">
      <div id="bg-lines"></div>

      <svg class="razor-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="8" y="28" width="48" height="8" rx="2" fill="#fdf0d5"></rect>
        <path d="M8 28 L20 18 L20 46 L8 36 Z" fill="#c1121f"></path>
        <rect x="50" y="30" width="6" height="4" rx="1" fill="#fdf0d5"></rect>
      </svg>

      <svg class="scissors-icon" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="20" cy="58" r="10" stroke="#fdf0d5" stroke-width="2.5"></circle>
        <circle cx="20" cy="22" r="10" stroke="#fdf0d5" stroke-width="2.5"></circle>
        <line x1="28" y1="52" x2="68" y2="16" stroke="#fdf0d5" stroke-width="2.5" stroke-linecap="round"></line>
        <line x1="28" y1="28" x2="68" y2="64" stroke="#fdf0d5" stroke-width="2.5" stroke-linecap="round"></line>
        <circle cx="20" cy="58" r="4" fill="#c1121f"></circle>
        <circle cx="20" cy="22" r="4" fill="#c1121f"></circle>
      </svg>

      <div class="pole-wrap">
        <div class="pole-cap top"></div>
        <div class="pole-body">
          <div class="stripe-track" id="stripe-track"></div>
          <div class="pole-shine"></div>
        </div>
        <div class="pole-cap bottom"></div>
      </div>

      <div class="logo-wrap">
        <div class="logo-main">Barber<span class="logo-dot">.</span>CO</div>
        <div class="logo-sub">Barbearia Profissional</div>
      </div>

      <div class="progress-wrap">
        <div class="progress-bg"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="progress-label" id="progress-label">Preparando a navalha...</div>
      </div>

      <div class="done-overlay" id="done-overlay">
        <div class="check-ring">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M6 14L11 19L22 9" stroke="#c1121f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
        <div class="done-title">Pronto para atender</div>
        <div class="done-sub">Bem-vindo a barbearia</div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("afterbegin", html);

  const bgLinesEl = document.getElementById("bg-lines");
  const track = document.getElementById("stripe-track");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-label");
  const done = document.getElementById("done-overlay");
  const overlay = document.getElementById("loader-overlay");
  const msgs = ["Preparando a navalha...", "Afiando as tesouras...", "Ajustando a cadeira...", "Quase pronto...", "Abrindo a barbearia!"];
  const pattern = ["s-red", "s-white", "s-blue", "s-white"];
  const linePositions = [80, 160, 240, 320, 400, 480, 560];

  linePositions.forEach((x, i) => {
    const line = document.createElement("div");
    line.className = "bg-line";
    line.style.left = `${x}px`;
    line.style.animationDelay = `${i * 0.3}s`;
    bgLinesEl.appendChild(line);
  });

  for (let i = 0; i < 24; i += 1) {
    const s = document.createElement("div");
    s.className = `stripe ${pattern[i % pattern.length]}`;
    track.appendChild(s);
  }

  let progress = 0;
  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 5;
    if (progress > 100) progress = 100;
    fill.style.width = `${progress}%`;
    label.textContent = msgs[Math.min(Math.floor(progress / 25), msgs.length - 1)];
    if (progress === 100) {
      clearInterval(timer);
      setTimeout(() => done.classList.add("show"), 300);
      setTimeout(() => overlay.classList.add("hidden"), 1200);
      setTimeout(() => overlay.remove(), 1800);
    }
  }, 340);
}

document.addEventListener("DOMContentLoaded", () => {
  renderWhatsAppFloat();
  injectLoader();
});
