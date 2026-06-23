(function () {
  const STORAGE_KEY = 'afin_kegiatan_items';
  const SESSION_KEY = 'afin_admin_logged_in';
  const DEMO_USERNAME = 'admin';
  const DEMO_PASSWORD = 'admin123';

  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const activityForm = document.getElementById('activityForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const previewBtn = document.getElementById('previewActivityBtn');
  const saveActivityBtn = document.getElementById('saveActivityBtn');
  const cancelActivityEditBtn = document.getElementById('cancelActivityEditBtn');
  const activityImageInput = document.getElementById('activityImage');
  const activityImageNote = document.getElementById('activityImageNote');
  const previewList = document.getElementById('adminActivityList');
  const activitySearch = document.getElementById('activitySearch');
  const activityListCount = document.getElementById('activityListCount');
  const message = document.getElementById('adminMessage');

  let backendMode = true;
  let activityItems = [];

  const getLocalItems = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  };

  const setLocalItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const slugify = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const readImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const apiRequest = async (url, options) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || 'Request gagal.');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };

  const setLoggedIn = (isLoggedIn) => {
    sessionStorage.setItem(SESSION_KEY, isLoggedIn ? '1' : '');
    loginPanel.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
    renderList();
  };

  const getFormValues = () => {
    const imageInput = document.getElementById('activityImage');
    return {
      title: document.getElementById('activityTitle').value.trim(),
      category: document.getElementById('activityCategory').value.trim() || 'Kegiatan',
      summary: document.getElementById('activitySummary').value.trim(),
      description: document.getElementById('activityDescription').value.trim(),
      isHighlight: document.getElementById('activityHighlight').checked,
      imageFile: imageInput.files[0],
      id: document.getElementById('activityId').value,
    };
  };

  const validateFormValues = ({ title, summary, description, imageFile, id }) => {
    if (!title || !summary || !description || (!id && !imageFile)) {
      showMessage(id
        ? 'Judul, ringkasan, dan deskripsi wajib diisi.'
        : 'Judul, ringkasan, deskripsi, dan foto wajib diisi sebelum preview atau simpan.', 'error');
      return false;
    }

    const maxSize = backendMode ? 4 * 1024 * 1024 : 900 * 1024;
    if (imageFile && imageFile.size > maxSize) {
      showMessage(`Ukuran foto terlalu besar. Maksimal ${backendMode ? '4 MB' : '900 KB'} untuk mode saat ini.`, 'error');
      return false;
    }

    return true;
  };

  const resetActivityForm = () => {
    activityForm.reset();
    document.getElementById('activityId').value = '';
    activityImageInput.required = true;
    activityImageNote.textContent = 'Gunakan foto landscape agar halaman terlihat rapi.';
    saveActivityBtn.textContent = 'Simpan Kegiatan';
    cancelActivityEditBtn.hidden = true;
  };

  const showMessage = (text, type) => {
    message.textContent = text;
    message.className = `admin-message ${type || ''}`.trim();
  };

  const getItems = async () => {
    if (!backendMode) return getLocalItems().slice().reverse();

    try {
      const data = await apiRequest('/api/kegiatan.php');
      if (data.configured === false) {
        backendMode = false;
        return getLocalItems().slice().reverse();
      }
      return data.items || [];
    } catch (error) {
      backendMode = false;
      return getLocalItems().slice().reverse();
    }
  };

  const renderList = async () => {
    const items = await getItems();
    activityItems = items;
    const query = (activitySearch?.value || '').trim().toLowerCase();
    const filteredItems = query
      ? items.filter((item) => [
        item.title,
        item.category,
        item.summary,
        item.description,
      ].some((value) => String(value || '').toLowerCase().includes(query)))
      : items;

    if (activityListCount) {
      activityListCount.textContent = query
        ? `${filteredItems.length} dari ${items.length}`
        : `${items.length} data`;
    }

    previewList.innerHTML = '';

    if (!items.length) {
      previewList.innerHTML = '<p class="admin-empty">Belum ada kegiatan tambahan dari admin.</p>';
      return;
    }

    if (!filteredItems.length) {
      previewList.innerHTML = '<p class="admin-empty">Tidak ada kegiatan yang cocok dengan pencarian.</p>';
      return;
    }

    filteredItems.forEach((item) => {
      const isHighlight = Boolean(item.isHighlight);
      const card = document.createElement('article');
      card.className = 'admin-activity-item admin-activity-card-item';
      card.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.title)}" />
        <div>
          <span>${escapeHtml(item.category || 'Kegiatan')}${isHighlight ? ' / Highlight' : ''}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <details class="admin-card-menu">
          <summary aria-label="Buka aksi kegiatan">...</summary>
          <div class="admin-card-menu-list">
            <button class="admin-card-menu-action admin-edit-activity" type="button" data-id="${item.id}">Edit</button>
            <button class="admin-card-menu-action admin-highlight-toggle" type="button" data-id="${item.id}" data-highlight="${isHighlight ? '0' : '1'}">${isHighlight ? 'Hapus Highlight' : 'Jadikan Highlight'}</button>
            <a class="admin-card-menu-action" href="/kegiatan-detail.html?id=${encodeURIComponent(item.slug || item.id)}" target="_blank" rel="noopener">Detail</a>
            <button class="admin-card-menu-action admin-delete" type="button" data-id="${item.id}">Hapus</button>
          </div>
        </details>
      `;
      previewList.appendChild(card);
    });
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      backendMode = true;
      setLoggedIn(Boolean(data.authenticated));
      if (data.authenticated && data.role === 'super_admin') {
        showMessage(`Login sebagai ${data.name || 'Super Admin'} dengan akses penuh.`, 'success');
      }
    } catch (error) {
      backendMode = false;
      setLoggedIn(sessionStorage.getItem(SESSION_KEY) === '1');
      showMessage('Backend belum aktif. Admin berjalan dalam mode demo browser.', 'error');
    }
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (backendMode) {
      const formData = new FormData();
      formData.append('action', 'login');
      formData.append('username', username);
      formData.append('password', password);

      try {
        await apiRequest('/api/auth.php', {
          method: 'POST',
          body: formData,
        });
        setLoggedIn(true);
        showMessage('Login Super Admin berhasil. Anda memiliki akses penuh dashboard.', 'success');
        return;
      } catch (error) {
        if (error.status !== 503) {
          showMessage(error.message || 'Username atau password salah.', 'error');
          return;
        }
        backendMode = false;
      }
    }

    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setLoggedIn(true);
      showMessage('Login Super Admin berhasil dalam mode demo browser.', 'success');
      return;
    }

    showMessage('Username atau password salah.', 'error');
  });

  logoutBtn.addEventListener('click', async () => {
    if (backendMode) {
      const formData = new FormData();
      formData.append('action', 'logout');
      try {
        await apiRequest('/api/auth.php', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        backendMode = false;
      }
    }

    setLoggedIn(false);
    showMessage('Anda sudah logout.', 'success');
  });

  activitySearch?.addEventListener('input', () => {
    renderList();
  });

  previewBtn.addEventListener('click', async () => {
    const values = getFormValues();
    if (!validateFormValues(values)) return;

    const existing = activityItems.find((item) => item.id === values.id);
    let image = existing?.image || '';
    if (values.imageFile) {
      try {
        image = await readImage(values.imageFile);
      } catch (error) {
        showMessage('Preview gambar gagal dibuat. Coba pakai file gambar lain.', 'error');
        return;
      }
    }

    sessionStorage.setItem('afin_kegiatan_preview', JSON.stringify({
      id: values.id || `preview-${Date.now()}`,
      slug: values.id || 'preview-kegiatan',
      title: values.title,
      category: values.category,
      summary: values.summary,
      description: values.description,
      image,
      isHighlight: values.isHighlight,
      createdAt: new Date().toISOString(),
    }));
    window.open('/kegiatan-detail.html?preview=admin', '_blank', 'noopener');
    showMessage('Preview dibuka di tab baru menggunakan data form saat ini.', 'success');
  });

  cancelActivityEditBtn.addEventListener('click', () => {
    resetActivityForm();
    showMessage('Mode edit kegiatan dibatalkan.', 'success');
  });

  activityForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { id, title, category, summary, description, imageFile, isHighlight } = getFormValues();

    if (!validateFormValues({ id, title, summary, description, imageFile })) return;

    if (backendMode) {
      const formData = new FormData();
      formData.append('action', id ? 'update' : 'create');
      if (id) formData.append('id', id);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('summary', summary);
      formData.append('description', description);
      formData.append('is_highlight', isHighlight ? '1' : '0');
      if (imageFile) formData.append('image', imageFile);

      try {
        await apiRequest('/api/kegiatan.php', {
          method: 'POST',
          body: formData,
        });
        resetActivityForm();
        await renderList();
        showMessage(id ? 'Kegiatan berhasil diperbarui di database.' : 'Kegiatan berhasil disimpan ke database.', 'success');
        return;
      } catch (error) {
        showMessage(error.message || 'Kegiatan gagal disimpan.', 'error');
        return;
      }
    }

    if (imageFile.size > 900 * 1024) {
      showMessage('Ukuran foto terlalu besar untuk mode demo. Pakai gambar di bawah 900 KB.', 'error');
      return;
    }

    try {
      const image = await readImage(imageFile);
      const items = getLocalItems();
      const id = `${slugify(title)}-${Date.now()}`;
      items.push({
        id,
        slug: id,
        title,
        category: category || 'Kegiatan',
        summary,
        description,
        isHighlight,
        image,
        createdAt: new Date().toISOString(),
      });
      setLocalItems(items);
      resetActivityForm();
      await renderList();
      showMessage('Kegiatan berhasil ditambahkan di browser ini.', 'success');
    } catch (error) {
      showMessage('Foto gagal diproses. Coba pakai file gambar lain.', 'error');
    }
  });

  previewList.addEventListener('click', async (event) => {
    const menuAction = event.target.closest('.admin-card-menu-action');
    if (menuAction) {
      menuAction.closest('details')?.removeAttribute('open');
    }

    const editButton = event.target.closest('.admin-edit-activity');
    if (editButton) {
      const item = activityItems.find((activity) => activity.id === editButton.dataset.id);
      if (!item) return;
      document.getElementById('activityId').value = item.id;
      document.getElementById('activityTitle').value = item.title || '';
      document.getElementById('activityCategory').value = item.category || 'Kegiatan';
      document.getElementById('activitySummary').value = item.summary || '';
      document.getElementById('activityDescription').value = item.description || '';
      document.getElementById('activityHighlight').checked = Boolean(item.isHighlight);
      activityImageInput.value = '';
      activityImageInput.required = false;
      activityImageNote.textContent = 'Kosongkan jika ingin tetap memakai foto yang sekarang.';
      saveActivityBtn.textContent = 'Update Kegiatan';
      cancelActivityEditBtn.hidden = false;
      activityForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showMessage('Mode edit aktif. Data kegiatan sudah dimuat ke form.', 'success');
      return;
    }

    const highlightButton = event.target.closest('.admin-highlight-toggle');
    if (highlightButton) {
      if (backendMode) {
        const formData = new FormData();
        formData.append('action', 'toggle_highlight');
        formData.append('id', highlightButton.dataset.id);
        formData.append('is_highlight', highlightButton.dataset.highlight);

        try {
          await apiRequest('/api/kegiatan.php', {
            method: 'POST',
            body: formData,
          });
          await renderList();
          showMessage('Status highlight berhasil diperbarui.', 'success');
          return;
        } catch (error) {
          showMessage(error.message || 'Status highlight gagal diperbarui.', 'error');
          return;
        }
      }

      const items = getLocalItems().map((item) => (
        item.id === highlightButton.dataset.id
          ? { ...item, isHighlight: highlightButton.dataset.highlight === '1' }
          : item
      ));
      setLocalItems(items);
      await renderList();
      showMessage('Status highlight berhasil diperbarui di mode demo.', 'success');
      return;
    }

    const button = event.target.closest('.admin-delete');
    if (!button) return;

    if (backendMode) {
      try {
        await apiRequest(`/api/kegiatan.php?id=${encodeURIComponent(button.dataset.id)}`, {
          method: 'DELETE',
        });
        await renderList();
        showMessage('Kegiatan berhasil dihapus dari database.', 'success');
        return;
      } catch (error) {
        showMessage(error.message || 'Kegiatan gagal dihapus.', 'error');
        return;
      }
    }

    const items = getLocalItems().filter((item) => item.id !== button.dataset.id);
    setLocalItems(items);
    await renderList();
    showMessage('Kegiatan berhasil dihapus dari browser ini.', 'success');
  });

  checkSession();
}());
