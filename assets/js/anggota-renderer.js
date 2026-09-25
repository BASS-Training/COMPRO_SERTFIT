(function () {
  const structure = document.querySelector('[data-member-list]');
  if (!structure) return;

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const matchesRole = (item, labels) => {
    const role = String(item.roleLabel || '').toLowerCase();
    return labels.some((label) => role.includes(label));
  };

  const memberNode = (item, level) => `
    <article class="org-node org-node-${level}">
      <div class="org-node-photo-wrap">
        <img class="org-node-photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" />
      </div>
      <div class="org-node-copy">
        <span class="org-node-kicker">${escapeHtml(item.roleLabel || 'Anggota Perkumpulan')}</span>
        <h3>${escapeHtml(item.name)}</h3>
      </div>
    </article>
  `;

  const renderMembers = (items) => {
    if (!items.length) {
      structure.innerHTML = '<p class="org-empty">Data struktur organisasi belum tersedia.</p>';
      return;
    }

    const boardLabels = ['komisaris', 'dewan', 'pengarah', 'pengawas', 'pembina'];
    const directorLabels = ['direktur', 'ketua', 'kepala'];
    const board = items.filter((item) => matchesRole(item, boardLabels));
    const directors = items.filter((item) => !board.includes(item) && matchesRole(item, directorLabels));
    const divisions = items.filter((item) => !board.includes(item) && !directors.includes(item));
    const leadership = directors.length ? directors : (!board.length ? divisions.splice(0, 1) : []);
    const levels = [];

    if (board.length) {
      levels.push(`<div class="org-level org-level-board">${board.map((item) => memberNode(item, 'board')).join('')}</div>`);
    }
    if (board.length && leadership.length) levels.push('<div class="org-connector" aria-hidden="true"></div>');
    if (leadership.length) {
      levels.push(`<div class="org-level org-level-leadership">${leadership.map((item) => memberNode(item, 'director')).join('')}</div>`);
    }
    if ((board.length || leadership.length) && divisions.length) {
      levels.push('<div class="org-connector" aria-hidden="true"></div>');
    }
    if (divisions.length) {
      const columns = Math.min(divisions.length, 4);
      levels.push(`<div class="org-level org-level-divisions org-columns-${columns}" style="--org-columns:${columns}">${divisions.map((item) => memberNode(item, 'division')).join('')}</div>`);
    }

    structure.innerHTML = levels.join('');
  };

  fetch('/api/anggota.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => {
      if (data && data.configured !== false && Array.isArray(data.items)) {
        renderMembers(data.items);
      }
    })
    .catch(() => {
      structure.innerHTML = '<p class="org-empty">Struktur organisasi belum dapat dimuat.</p>';
    });
}());
