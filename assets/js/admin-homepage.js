(function () {
  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const homepageForm = document.getElementById('homepageForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const message = document.getElementById('adminMessage');
  const sortList = document.getElementById('homeSectionSortList');
  const sectionOrderInput = document.getElementById('homeSectionOrder');

  const fieldIds = {
    home_hero_title: 'homeHeroTitle',
    home_hero_description: 'homeHeroDescription',
    home_hero_button_text: 'homeHeroButtonText',
    home_hero_button_url: 'homeHeroButtonUrl',
    home_hero_image: 'homeHeroImage',
    home_activities_kicker: 'homeActivitiesKicker',
    home_activities_title: 'homeActivitiesTitle',
    home_activities_description: 'homeActivitiesDescription',
    home_profile_kicker: 'homeProfileKicker',
    home_profile_title: 'homeProfileTitle',
    home_profile_card_title: 'homeProfileCardTitle',
    home_profile_card_description: 'homeProfileCardDescription',
    home_members_kicker: 'homeMembersKicker',
    home_members_title: 'homeMembersTitle',
    home_partners_kicker: 'homePartnersKicker',
    home_partners_title: 'homePartnersTitle',
    home_cta_title: 'homeCtaTitle',
    home_cta_description: 'homeCtaDescription',
    home_cta_button_text: 'homeCtaButtonText',
    home_cta_button_url: 'homeCtaButtonUrl',
    home_show_activities: 'homeShowActivities',
    home_show_profile: 'homeShowProfile',
    home_show_members: 'homeShowMembers',
    home_show_partners: 'homeShowPartners',
    home_show_cta: 'homeShowCta',
    home_section_order: 'homeSectionOrder',
  };

  const defaultSectionOrder = ['activities', 'profile', 'members', 'partners', 'cta'];

  const showMessage = (text, type) => {
    message.textContent = text;
    message.className = `admin-message ${type || ''}`.trim();
  };

  const apiRequest = async (url, options) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || 'Request gagal.');
      error.status = response.status;
      throw error;
    }
    return data;
  };

  const setLoggedIn = (isLoggedIn) => {
    loginPanel.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
  };

  const updateSectionOrderInput = () => {
    sectionOrderInput.value = Array.from(sortList.querySelectorAll('[data-section-key]'))
      .map((item) => item.dataset.sectionKey)
      .join(',');
  };

  const applySectionOrder = (value) => {
    const order = String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => defaultSectionOrder.includes(item));
    const completeOrder = [...order, ...defaultSectionOrder.filter((item) => !order.includes(item))];
    const items = new Map(
      Array.from(sortList.querySelectorAll('[data-section-key]')).map((item) => [item.dataset.sectionKey, item])
    );
    completeOrder.forEach((key) => {
      const item = items.get(key);
      if (item) sortList.appendChild(item);
    });
    updateSectionOrderInput();
  };

  const fillForm = (settings) => {
    Object.entries(fieldIds).forEach(([key, id]) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (key === 'home_section_order') {
        field.value = settings[key] || defaultSectionOrder.join(',');
        applySectionOrder(field.value);
        return;
      }
      if (field.type === 'checkbox') {
        field.checked = (settings[key] || '0') === '1';
        return;
      }
      field.value = settings[key] || '';
    });
  };

  const getSettings = () => {
    const settings = {};
    Object.entries(fieldIds).forEach(([key, id]) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (key === 'home_section_order') updateSectionOrderInput();
      settings[key] = field.type === 'checkbox'
        ? (field.checked ? '1' : '0')
        : field.value.trim();
    });
    return settings;
  };

  const loadHomepage = async () => {
    const data = await apiRequest('/api/homepage.php');
    fillForm(data.settings || {});
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      setLoggedIn(Boolean(data.authenticated));
      if (data.authenticated) {
        await loadHomepage();
      } else {
        showMessage('Silakan login terlebih dahulu.', 'error');
      }
    } catch (error) {
      setLoggedIn(false);
      showMessage('Backend belum aktif atau sesi tidak tersedia.', 'error');
    }
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('username', document.getElementById('adminUsername').value.trim());
    formData.append('password', document.getElementById('adminPassword').value);

    try {
      const data = await apiRequest('/api/auth.php', {
        method: 'POST',
        body: formData,
      });
      setLoggedIn(Boolean(data.authenticated));
      await loadHomepage();
      showMessage('Login berhasil.', 'success');
    } catch (error) {
      showMessage(error.message || 'Login gagal.', 'error');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('action', 'logout');
    try {
      await apiRequest('/api/auth.php', {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      // UI logout stays deterministic.
    }
    setLoggedIn(false);
    showMessage('Anda sudah logout.', 'success');
  });

  homepageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const settings = getSettings();
    if (!settings.home_hero_title || !settings.home_hero_description) {
      showMessage('Judul dan deskripsi hero wajib diisi.', 'error');
      return;
    }

    const formData = new FormData();
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const data = await apiRequest('/api/homepage.php', {
        method: 'POST',
        body: formData,
      });
      fillForm(data.settings || settings);
      showMessage('Homepage berhasil disimpan.', 'success');
    } catch (error) {
      showMessage(error.message || 'Homepage gagal disimpan.', 'error');
    }
  });

  sortList.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.admin-section-sort-item');
    if (!item) return;
    item.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.dataset.sectionKey);
  });

  sortList.addEventListener('dragend', (event) => {
    event.target.closest('.admin-section-sort-item')?.classList.remove('is-dragging');
    updateSectionOrderInput();
  });

  sortList.addEventListener('dragover', (event) => {
    event.preventDefault();
    const dragging = sortList.querySelector('.is-dragging');
    const target = event.target.closest('.admin-section-sort-item:not(.is-dragging)');
    if (!dragging || !target) return;
    const rect = target.getBoundingClientRect();
    const shouldInsertAfter = event.clientY > rect.top + rect.height / 2;
    sortList.insertBefore(dragging, shouldInsertAfter ? target.nextSibling : target);
  });

  checkSession();
}());
