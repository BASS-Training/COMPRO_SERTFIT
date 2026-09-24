(function () {
  const path = window.location.pathname;
  const links = [
    { href: '/admin-dashboard.html', label: 'Dashboard', icon: '01' },
    { href: '/admin-homepage.html', label: 'Homepage', icon: '02' },
    { href: '/admin-kegiatan.html', label: 'Skema Sertifikasi', icon: '03' },
    { href: '/admin-anggota.html', label: 'Struktur Tim', icon: '04' },
    { href: '/admin-profil.html', label: 'Profil Website', icon: '05' },
    { href: '/admin-mitra.html', label: 'Mitra', icon: '06' },
  ];

  document.body.classList.add('admin-shell');

  const aside = document.createElement('aside');
  aside.className = 'admin-sidebar';
  aside.id = 'adminSidebar';
  aside.innerHTML = `
    <div class="admin-sidebar-brand">
      <a href="/admin-dashboard.html" aria-label="Dashboard LSP FIT">
        <img src="/assets/lspfit/logofit-nobg.png" alt="LSP FIT" />
      </a>
      <button class="admin-sidebar-close" type="button" aria-label="Tutup menu">&times;</button>
    </div>
    <div class="admin-sidebar-label">Workspace</div>
    <nav class="admin-sidebar-nav" aria-label="Navigasi admin">
      ${links.map((link) => `<a href="${link.href}" data-admin-link="${link.href}"><span>${link.icon}</span>${link.label}</a>`).join('')}
    </nav>
    <div class="admin-sidebar-footer">
      <a href="/index.html">Lihat Website</a>
      <button type="button" data-admin-shell-logout>Logout</button>
    </div>
  `;

  const overlay = document.createElement('button');
  overlay.className = 'admin-sidebar-overlay';
  overlay.type = 'button';
  overlay.setAttribute('aria-label', 'Tutup menu admin');

  document.body.prepend(overlay);
  document.body.prepend(aside);

  const openMenu = () => {
    document.body.classList.add('admin-sidebar-open');
  };

  const closeMenu = () => {
    document.body.classList.remove('admin-sidebar-open');
  };

  const currentLink = links.find((link) => path.endsWith(link.href));
  if (currentLink) {
    aside.querySelector(`[data-admin-link="${currentLink.href}"]`)?.classList.add('active');
  }

  aside.querySelector('.admin-sidebar-close').addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  aside.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  aside.querySelector('[data-admin-shell-logout]').addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('action', 'logout');
    try {
      await fetch('/api/auth.php', { method: 'POST', credentials: 'same-origin', body: formData });
    } finally {
      window.location.replace('/admin.html');
    }
  });

  const menuButton = document.createElement('button');
  menuButton.className = 'admin-sidebar-toggle';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', 'Buka menu admin');
  menuButton.innerHTML = '<span></span><span></span><span></span>';
  document.body.append(menuButton);
  menuButton.addEventListener('click', openMenu);
}());
