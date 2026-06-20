const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navAnchors = [...document.querySelectorAll(".nav-links a")];

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const sections = [...document.querySelectorAll("main section[id]")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((anchor) => {
        anchor.classList.toggle("active", anchor.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
);

sections.forEach((section) => sectionObserver.observe(section));

const tabButtons = [...document.querySelectorAll(".tab-button")];
const productPanels = [...document.querySelectorAll(".product-panel")];

function activateProductTab(button) {
  tabButtons.forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  productPanels.forEach((panel) => {
    const active = panel.id === button.getAttribute("aria-controls");
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
}

tabButtons.forEach((button, index) => {
  button.tabIndex = button.classList.contains("active") ? 0 : -1;
  button.addEventListener("click", () => activateProductTab(button));
  button.addEventListener("keydown", (event) => {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const next = tabButtons[(index + direction + tabButtons.length) % tabButtons.length];
    activateProductTab(next);
    next.focus();
  });
});

const metricObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.45 }
);

document.querySelectorAll("[data-count]").forEach((counter) => metricObserver.observe(counter));

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const prefix = counter.dataset.prefix || "";
  const suffix = counter.dataset.suffix || "";
  const duration = prefersReducedMotion ? 1 : 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    counter.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if (!prefersReducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const canvas = document.getElementById("signal-canvas");
const ctx = canvas?.getContext("2d");
let particles = [];
let width = 0;
let height = 0;
let animationFrame = null;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  seedParticles();
}

function seedParticles() {
  const count = Math.min(90, Math.max(36, Math.floor((width * height) / 21000)));
  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    radius: index % 5 === 0 ? 1.8 : 1.1,
    hue: index % 3 === 0 ? "81, 214, 208" : index % 3 === 1 ? "184, 234, 99" : "117, 185, 255"
  }));
}

function drawSignals() {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  particles.forEach((point, index) => {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x < -20) point.x = width + 20;
    if (point.x > width + 20) point.x = -20;
    if (point.y < -20) point.y = height + 20;
    if (point.y > height + 20) point.y = -20;

    ctx.beginPath();
    ctx.fillStyle = `rgba(${point.hue}, 0.58)`;
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
      const next = particles[nextIndex];
      const dx = point.x - next.x;
      const dy = point.y - next.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 118) continue;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(196, 232, 255, ${0.14 * (1 - distance / 118)})`;
      ctx.lineWidth = 1;
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
  });

  animationFrame = requestAnimationFrame(drawSignals);
}

if (canvas && ctx) {
  resizeCanvas();
  if (!prefersReducedMotion) {
    drawSignals();
  } else {
    drawSignals();
    cancelAnimationFrame(animationFrame);
  }
  window.addEventListener("resize", resizeCanvas, { passive: true });
}
