/* ============================================
   LSP FIT — main.js
   Interactions: scroll spy, counter, reveal,
   sticky header, mobile menu
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Sticky Header ───
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── Mobile Menu ───
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Reveal on scroll ───
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => revealObserver.observe(el));

  // ─── Counter animation ───
  const counters = document.querySelectorAll('.stat-num[data-target]');
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = +el.dataset.target;
    const duration = 2000;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out quartic
      el.textContent = Math.round(eased * target).toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  // ─── Smooth active nav highlight (scroll-spy) ───
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a');
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const active = document.querySelector(`.main-nav a[href="#${e.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach(s => spyObserver.observe(s));

  // ─── Scheme card hover tilt ───
  document.querySelectorAll('.scheme-card, .testi-card, .news-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});