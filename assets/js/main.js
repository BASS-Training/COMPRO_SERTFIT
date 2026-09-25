document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="/admin"], a[href="/admin.html"]').forEach((link) => {
    link.closest('li')?.remove();
  });

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

  const contactItems = document.querySelectorAll('.contact-info-list li');
  if (contactItems.length >= 4) {
    fetch('/api/profile.php', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
      .then((data) => {
        const settings = data && data.settings;
        if (!settings) return;
        [settings.contact_phone, settings.contact_email, settings.contact_website, settings.contact_address]
          .forEach((value, index) => {
            if (!value) return;
            const label = contactItems[index].querySelector('strong');
            contactItems[index].textContent = '';
            if (label) contactItems[index].appendChild(label);
            contactItems[index].appendChild(document.createElement('br'));
            contactItems[index].appendChild(document.createTextNode(value));
          });
      })
      .catch(() => {});
  }

  const schemeGrids = document.querySelectorAll('[data-scheme-group]');
  if (schemeGrids.length) {
    const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const schemeGroup = (item) => {
      const category = String(item.category || '').toLowerCase();
      if (category.includes('tenaga kepelatihan')) return 'training-level';
      if (category.includes('jenjang')) return 'instructor-level';
      if (category.includes('instruktur') || category.includes('klaster')) return 'instructor-cluster';
      return '';
    };
    const levelLabel = (item) => {
      const match = String(item.category || '').match(/jenjang(?:\s+kkni)?\s*([3-6])/i);
      if (match) return `Jenjang ${match[1]}`;
      const fallbackLevels = {
        'operasional-pelatihan': 'Jenjang 3',
        'koordinator-dan-pengembang': 'Jenjang 4',
        'manager-pelatihan': 'Jenjang 5',
        'kepala-lembaga-pelatihan': 'Jenjang 6',
      };
      return fallbackLevels[item.slug] || item.category || 'Skema';
    };
    fetch('/api/kegiatan.php?limit=50', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
      .then((data) => {
        if (!Array.isArray(data.items) || !data.items.length) return;
        const groupedItems = data.items.reduce((groups, item) => {
          const group = schemeGroup(item);
          if (group) groups[group].push(item);
          return groups;
        }, { 'instructor-cluster': [], 'instructor-level': [], 'training-level': [] });

        schemeGrids.forEach((grid) => {
          const group = grid.dataset.schemeGroup;
          const items = groupedItems[group] || [];
          if (!items.length) return;
          grid.innerHTML = items.map((item, index) => `
            <article class="card scheme-card${group === 'instructor-cluster' ? '' : ' scheme-card-level'}">
              <span class="${group === 'instructor-cluster' ? 'scheme-card-number' : 'scheme-card-level-label'}">${group === 'instructor-cluster' ? String(index + 1).padStart(2, '0') : escapeHtml(levelLabel(item))}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description || item.summary)}</p>
            </article>
          `).join('');
        });
      })
      .catch(() => {});
  }
});
