(function () {
  const grid = document.querySelector('.assessor-grid');
  if (!grid) return;

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const renderMembers = (items) => {
    if (!items.length) return;
    grid.innerHTML = items.map((item) => `
      <article class="card assessor-card">
        <img class="assessor-photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" />
        <div class="assessor-body">
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.roleLabel || 'Anggota Perkumpulan')}</p>
        </div>
      </article>
    `).join('');
  };

  fetch('/api/anggota.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => {
      if (data && data.configured !== false && Array.isArray(data.items)) {
        renderMembers(data.items);
      }
    })
    .catch(() => {
      // Keep static HTML as fallback when backend is unavailable.
    });
}());
