(function () {
  const target = document.querySelector('[data-instructor-directory]');
  if (!target) return;

  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

  const render = (items) => {
    if (!items.length) {
      target.innerHTML = '<p class="card instructor-directory-empty">Data instruktur dan asesor belum tersedia.</p>';
      return;
    }

    target.innerHTML = items.map((item) => `
      <article class="card instructor-card">
        <img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <h3>${escapeHtml(item.name)}</h3>
      </article>
    `).join('');
  };

  fetch('/api/instruktur.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => render(Array.isArray(data.items) ? data.items : []))
    .catch(() => {
      target.innerHTML = '<p class="card instructor-directory-empty">Daftar instruktur dan asesor belum dapat dimuat.</p>';
    });
}());
