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
      <div class="pole-wrap">
        <div class="pole-cap"></div>
        <div class="pole-body">
          <div class="stripe-track" id="stripe-track"></div>
        </div>
        <div class="pole-cap"></div>
      </div>
      <div class="brand" style="font-size:2rem">Barber<span>.</span>CO</div>
      <div class="progress-wrap">
        <div class="progress-bg"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="progress-label" id="progress-label">Preparando a navalha...</div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("afterbegin", html);

  const track = document.getElementById("stripe-track");
  const fill = document.getElementById("progress-fill");
  const label = document.getElementById("progress-label");
  const overlay = document.getElementById("loader-overlay");
  const msgs = ["Preparando a navalha...", "Afiando as tesouras...", "Ajustando a cadeira...", "Quase pronto...", "Abrindo a barbearia!"];
  const pattern = ["s-red", "s-white", "s-blue", "s-white"];

  for (let i = 0; i < 20; i += 1) {
    const s = document.createElement("div");
    s.className = `stripe ${pattern[i % pattern.length]}`;
    track.appendChild(s);
  }

  let progress = 0;
  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 8;
    if (progress > 100) progress = 100;
    fill.style.width = `${progress}%`;
    label.textContent = msgs[Math.min(Math.floor(progress / 25), msgs.length - 1)];
    if (progress === 100) {
      clearInterval(timer);
      setTimeout(() => overlay.classList.add("hidden"), 380);
      setTimeout(() => overlay.remove(), 1000);
    }
  }, 220);
}

document.addEventListener("DOMContentLoaded", () => {
  renderWhatsAppFloat();
  injectLoader();
});
