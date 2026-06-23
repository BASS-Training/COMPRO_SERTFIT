(function () {
  const STORAGE_KEY = 'afin_kegiatan_items';

  const getLocalItems = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  };

  const getItems = async () => {
    try {
      const response = await fetch('/api/kegiatan.php', { credentials: 'same-origin' });
      const data = await response.json();
      if (response.ok && data.ok && data.configured !== false) {
        return {
          items: data.items || [],
          backendConfigured: true,
        };
      }
    } catch (error) {
      // Keep static pages usable before the live backend is configured.
    }

    return {
      items: getLocalItems().slice().reverse(),
      backendConfigured: false,
    };
  };

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const detailHref = (item) => `/kegiatan-detail.html?id=${encodeURIComponent(item.slug || item.id)}`;

  const hideStaticFallback = () => {
    document
      .querySelectorAll('.activity-card:not(.activity-card--admin), .gallery-featured-card:not(.gallery-featured-card--admin), .gallery-card:not(.gallery-card--admin)')
      .forEach((element) => {
        element.hidden = true;
      });
  };

  const createHomepageCard = (item) => {
    const link = document.createElement('a');
    link.className = 'card activity-card activity-card--compact activity-card--admin';
    link.href = detailHref(item);
    link.innerHTML = `
      <img class="activity-card-image" src="${item.image}" alt="${escapeHtml(item.title)}" />
      <div class="activity-card-body">
        <span class="gallery-chip">${escapeHtml(item.category || 'Kegiatan')}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </div>
    `;
    return link;
  };

  const createGalleryCard = (item) => {
    const link = document.createElement('a');
    link.className = 'card gallery-card gallery-card--admin';
    link.href = detailHref(item);
    link.innerHTML = `
      <img class="gallery-card-image" src="${item.image}" alt="${escapeHtml(item.title)}" />
      <div class="gallery-card-body">
        <span class="gallery-chip">${escapeHtml(item.category || 'Kegiatan')}</span>
        <h3>${escapeHtml(item.title)}</h3>
      </div>
    `;
    return link;
  };

  const createHighlightCard = (item) => {
    const article = document.createElement('article');
    article.className = 'card gallery-featured-card gallery-featured-card--admin';
    article.innerHTML = `
      <div class="gallery-featured-media">
        <img src="${item.image}" alt="${escapeHtml(item.title)}" />
      </div>
      <div class="gallery-featured-body">
        <span class="gallery-chip">Highlight</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <a class="gallery-featured-link" href="${detailHref(item)}">Lihat Detail</a>
      </div>
    `;
    return article;
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const { items, backendConfigured } = await getItems();
    if (!items.length) return;

    if (backendConfigured) {
      hideStaticFallback();
    }

    const homepageList = document.querySelector('.activity-list');
    if (homepageList) {
      items.slice(0, 3).reverse().forEach((item) => {
        homepageList.prepend(createHomepageCard(item));
      });
    }

    const highlightList = document.querySelector('.gallery-highlight-list');
    const firstFeatured = document.querySelector('.gallery-featured-card');
    const highlightTarget = highlightList || firstFeatured?.parentElement;
    if (highlightTarget) {
      items
        .filter((item) => item.isHighlight)
        .slice()
        .reverse()
        .forEach((item) => {
          if (highlightList) {
            highlightList.prepend(createHighlightCard(item));
          } else {
            firstFeatured.parentElement.insertBefore(createHighlightCard(item), firstFeatured);
          }
        });
    }

    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
      items
        .filter((item) => !item.isHighlight)
        .slice()
        .reverse()
        .forEach((item) => {
          galleryGrid.prepend(createGalleryCard(item));
        });
    }

    if (window.AOS) window.AOS.refreshHard();
  });
}());
