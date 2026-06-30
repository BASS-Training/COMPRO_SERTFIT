(function () {
  const wraps = document.querySelectorAll('[data-partner-list]');
  if (!wraps.length) return;

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const partnerMarkup = (item) => {
    const content = `<div class="partner-logo"><img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.name)}" /></div>`;
    return item.websiteUrl
      ? `<a href="${escapeHtml(item.websiteUrl)}" target="_blank" rel="noopener" aria-label="${escapeHtml(item.name)}">${content}</a>`
      : content;
  };

  fetch('/api/partners.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => {
      if (!data || data.configured === false || !Array.isArray(data.items) || !data.items.length) return;
      const html = data.items.map(partnerMarkup).join('');
      wraps.forEach((wrap) => {
        wrap.innerHTML = html + html;
      });
    })
    .catch(() => {
      // Keep static logo list as fallback when backend is unavailable.
    });
}());
