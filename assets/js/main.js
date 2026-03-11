document.addEventListener('DOMContentLoaded', () => {
  const aosTargets = document.querySelectorAll(
    '.section-head, .card, .timeline-step, .assessor-card, .table-row, .hero h1, .hero p, .hero-actions, .hero-media'
  );
  aosTargets.forEach((el, idx) => {
    if (!el.hasAttribute('data-aos')) {
      el.setAttribute('data-aos', 'fade-up');
      el.setAttribute('data-aos-delay', String((idx % 6) * 60));
    }
  });
  if (window.AOS) window.AOS.refreshHard();

  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('mainNav');
  const burger = document.getElementById('hamburger');

  const setHeaderState = () => {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
      header.classList.remove('transparent');
    } else {
      header.classList.add('transparent');
      header.classList.remove('scrolled');
    }
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('active');
      burger.setAttribute('aria-expanded', nav.classList.contains('active') ? 'true' : 'false');
      document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  const waFormBtn = document.getElementById('btnWaSubmit');
  if (waFormBtn) {
    waFormBtn.addEventListener('click', () => {
      const nama = document.getElementById('nama')?.value.trim() || '-';
      const instansi = document.getElementById('instansi')?.value.trim() || '-';
      const topik = document.getElementById('topik')?.value.trim() || '-';
      const pesan = document.getElementById('pesan')?.value.trim() || '-';
      const text = [
        'Halo LSP FIT, saya ingin mendaftar uji kompetensi',
        '',
        `Nama: ${nama}`,
        `Instansi: ${instansi}`,
        `Topik: ${topik}`,
        `Pesan: ${pesan}`,
      ].join('\n');
      window.open(`https://wa.me/6281112101007?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  }

  const skemaTabs = document.querySelectorAll('.skema-tab');
  const skemaRows = document.querySelectorAll('.table-row.skema-row[data-category]');

  if (skemaTabs.length && skemaRows.length) {
    const activateTab = (tabName) => {
      skemaTabs.forEach((tab) => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      skemaRows.forEach((row) => {
        const show = row.dataset.category === tabName;
        row.classList.toggle('hidden', !show);
      });
    };

    skemaTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        if (!tabName) return;
        activateTab(tabName);
      });
    });

    const hashTabMap = {
      '#klaster': 'klaster',
      '#instruktur': 'instruktur',
      '#kepelatihan': 'kepelatihan',
    };

    const initialTab = hashTabMap[window.location.hash] || 'klaster';
    activateTab(initialTab);
  }
});
