(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // A small ambient starfield; automatically scales down on small screens.
  const canvas = $("#starfield");
  const ctx = canvas.getContext("2d");
  let stars = [], width = 0, height = 0, dpr = 1;
  function resizeStars() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(105, Math.floor(width * height / 10500));
    stars = Array.from({length: count}, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.25 + .2, a: Math.random() * .55 + .12,
      v: Math.random() * .16 + .025, phase: Math.random() * 6
    }));
  }
  let frame = 0;
  function drawStars() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(s => {
      s.y -= s.v;
      if (s.y < -3) { s.y = height + 3; s.x = Math.random() * width; }
      const alpha = s.a * (.72 + Math.sin(frame * .015 + s.phase) * .28);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(135, 190, 208, ${alpha})`; ctx.fill();
    });
    frame++;
    requestAnimationFrame(drawStars);
  }
  resizeStars(); drawStars();
  window.addEventListener("resize", resizeStars, {passive:true});

  // Rotating Persian hero line.
  const phrases = ["چیزهایی که هنوز وجود ندارند", "ابزارهایی برای حل مسئله", "مسیر خودم در امنیت سایبری", "ایده‌هایی که تبدیل به کد می‌شوند"];
  const typeNode = $("#typeLine");
  let phraseIndex = 0, charIndex = phrases[0].length, deleting = false;
  function typeLoop() {
    const phrase = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      typeNode.textContent = phrase.slice(0, charIndex);
      if (charIndex >= phrase.length) { deleting = true; setTimeout(typeLoop, 1700); return; }
    } else {
      charIndex--;
      typeNode.textContent = phrase.slice(0, charIndex);
      if (charIndex <= 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; }
    }
    setTimeout(typeLoop, deleting ? 28 : 55);
  }
  setTimeout(typeLoop, 1700);

  // Mobile navigation.
  const menuToggle = $("#menuToggle"), nav = $(".nav-links");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });
  $$(".nav-links a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }));

  // Project filters with live counter.
  const filterButtons = $$(".filter-btn"), projectCards = $$(".project-card");
  function filterProjects(category) {
    let visible = 0;
    projectCards.forEach(card => {
      const show = category === "all" || card.dataset.category === category;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    $("#projectCount").textContent = String(visible).padStart(2, "0");
    filterButtons.forEach(btn => {
      const active = btn.dataset.filter === category;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }
  filterButtons.forEach(btn => btn.addEventListener("click", () => filterProjects(btn.dataset.filter)));

  // Copy terminal text, with a graceful fallback.
  const toast = $("#toast");
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }
  $("#copyTerminal").addEventListener("click", async () => {
    const text = "whoami\\ndeveloper-in-progress\\nBuild. Break. Learn. Repeat.\\nCuriosity > comfort";
    try {
      await navigator.clipboard.writeText(text);
      showToast("خروجی ترمینال کپی شد ✓");
    } catch {
      const area = document.createElement("textarea");
      area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      const ok = document.execCommand("copy"); area.remove();
      showToast(ok ? "خروجی ترمینال کپی شد ✓" : "کپی خودکار ممکن نبود");
    }
  });

  // Cursor glow only on devices that actually have a fine pointer.
  const glow = $("#cursorGlow");
  if (matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", e => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, {passive:true});
  } else glow.hidden = true;

  // Reveal sections when they enter view.
  const revealTargets = $$(".section-kicker, .section-heading, .about-content, .skill-card, .project-card, .road-item, .contact-panel");
  revealTargets.forEach(el => el.classList.add("reveal"));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.12});
    revealTargets.forEach(el => observer.observe(el));
  } else revealTargets.forEach(el => el.classList.add("in-view"));

  // Tiny optional UI tone using Web Audio, only after a deliberate click.
  let audioEnabled = false, audioContext;
  const soundButton = $("#soundToggle");
  soundButton.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    soundButton.classList.toggle("sound-on", audioEnabled);
    soundButton.style.background = audioEnabled ? "#14302e" : "transparent";
    showToast(audioEnabled ? "افکت‌های صوتی مینیمال فعال شدند" : "افکت صوتی خاموش شد");
    if (audioEnabled) {
      try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
  });
  // A quiet confirmation tone only for the sound toggle; no background audio.
  soundButton.addEventListener("pointerdown", () => {
    if (!audioEnabled || !audioContext) return;
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = "sine"; osc.frequency.value = 660;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.025, audioContext.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .12);
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .13);
  });

  // Set current year dynamically in case the site stays online.
  const year = new Date().getFullYear();
  const footerText = $(".footer > span");
  if (footerText) footerText.textContent = `© ${year} M5CodeLab · ساخته‌شده با کنجکاوی و کافئین.`;
})();