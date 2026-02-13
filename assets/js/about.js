// About Us — navbar scroll, progress bar, reveal, counter, mobile nav
(() => {
  // ===== Year =====
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Scroll Progress Bar (gunakan #scrollBar) =====
  const scrollBar = document.getElementById("scrollBar");
  const updateProgress = () => {
    if (!scrollBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    scrollBar.style.width = `${pct}%`;
  };

  // ===== Navbar dark -> white on scroll =====
  const siteHeader = document.getElementById("siteHeader");
  const updateHeader = () => {
    if (!siteHeader) return;
    if (window.scrollY > 12) siteHeader.classList.add("scrolled");
    else siteHeader.classList.remove("scrolled");
  };

  // Gabung listener scroll biar rapi
  const onScroll = () => {
    updateProgress();
    updateHeader();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", () => {
    updateProgress();
    updateHeader();
  });

  // ===== Hamburger toggle (mobile) =====
  const hamburger = document.getElementById("hamburger");
  const mainNav = document.getElementById("mainNav");

  if (hamburger && mainNav) {
    hamburger.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

    // Tutup menu saat klik link (mobile), kecuali dropdown trigger
    mainNav.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      const dropdownLink = link.parentElement && link.parentElement.classList.contains("has-dropdown");
      if (dropdownLink && window.innerWidth <= 768) {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
        return;
      }

      if (window.innerWidth <= 768) {
        mainNav.classList.remove("open");
      }
    });
  }

  // ===== Mobile dropdown toggle handled in nav click above =====

  // ===== Reveal on scroll (optional) =====
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add("is-in");
            io.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    reveals.forEach((el) => io.observe(el));
  }

  // ===== Counter animation (optional) =====
  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = Number(el.getAttribute("data-counter")) || 0;
      const duration = 900;
      const start = performance.now();
      const from = 0;

      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const val = Math.round(from + (target - from) * eased);
        el.textContent = val.toLocaleString("id-ID");
        if (t < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            animateCounter(ent.target);
            counterIO.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach((el) => counterIO.observe(el));
  }
})();
