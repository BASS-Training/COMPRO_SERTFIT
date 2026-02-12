// About Us — animations, counters, scroll progress
(() => {
  const yearNow = document.getElementById("yearNow");
  if (yearNow) yearNow.textContent = new Date().getFullYear();

  // Scroll progress
  const bar = document.getElementById("scrollProgress");
  const updateProgress = () => {
    if (!bar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Reveal on scroll (IntersectionObserver)
  const reveals = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => io.observe(el));

  // Counter animation (only when in view)
  const counters = document.querySelectorAll("[data-counter]");
  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-counter")) || 0;
    const duration = 900; // ms
    const start = performance.now();
    const from = 0;

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (target - from) * eased);
      el.textContent = val.toLocaleString("id-ID");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  counters.forEach(el => counterIO.observe(el));

  // Subtle tilt for hero visual on mouse move (desktop only)
  const visual = document.querySelector(".visual-card");
  if (visual && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const onMove = (ev) => {
      const r = visual.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width;   // 0..1
      const py = (ev.clientY - r.top) / r.height;  // 0..1
      const rotY = clamp((px - 0.5) * 10, -6, 6);
      const rotX = clamp((0.5 - py) * 10, -6, 6);
      visual.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-1px)`;
    };
    const reset = () => {
      visual.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    visual.addEventListener("mousemove", onMove);
    visual.addEventListener("mouseleave", reset);
  }
})();