const WHATSAPP_NUMERO = "553897448898";

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
  botao.innerHTML = `
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <path d="M20.52 3.48A11.78 11.78 0 0 0 12.01 0C5.46 0 .12 5.34.12 11.89c0 2.1.55 4.15 1.59 5.95L0 24l6.31-1.66a11.86 11.86 0 0 0 5.67 1.44h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.38-8.4Zm-8.51 18.26h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98.99-3.65-.23-.37a9.82 9.82 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89a9.85 9.85 0 0 1 6.99 2.89 9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.88 9.89Z" fill="white"/>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" fill="#25D366"/>
    </svg>`;
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
