(function () {
  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const partnerForm = document.getElementById('partnerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const cancelPartnerEditBtn = document.getElementById('cancelPartnerEditBtn');
  const savePartnerBtn = document.getElementById('savePartnerBtn');
  const partnerLogo = document.getElementById('partnerLogo');
  const partnerLogoNote = document.getElementById('partnerLogoNote');
  const partnerSearch = document.getElementById('partnerSearch');
  const partnerList = document.getElementById('adminPartnerList');
  const partnerListCount = document.getElementById('partnerListCount');
  const message = document.getElementById('adminMessage');

  let partners = [];

  const escapeHtml = (value) =>
    String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

  const showMessage = (text, type) => {
    message.textContent = text;
    message.className = `admin-message ${type || ''}`.trim();
  };

  const apiRequest = async (url, options) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
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
    if (isLoggedIn) renderList();
  };

  const resetForm = () => {
    partnerForm.reset();
    document.getElementById('partnerId').value = '';
    document.getElementById('partnerSort').value = '0';
    partnerLogo.required = true;
    partnerLogoNote.textContent = 'JPG, PNG, atau WEBP maksimal 4 MB.';
    savePartnerBtn.textContent = 'Simpan Mitra';
    cancelPartnerEditBtn.hidden = true;
  };

  const fetchPartners = async () => {
    const data = await apiRequest('/api/partners.php?all=1');
    partners = data.items || [];
    return partners;
  };

  const renderList = async () => {
    try {
      await fetchPartners();
    } catch (error) {
      partnerList.innerHTML = '<p class="admin-empty">Data mitra belum bisa dibaca. Pastikan backend dan database aktif.</p>';
      return;
    }

    const query = (partnerSearch?.value || '').trim().toLowerCase();
    const filtered = query
      ? partners.filter((item) => [item.name, item.websiteUrl, item.isActive ? 'tampil' : 'hide'].some((value) => String(value || '').toLowerCase().includes(query)))
      : partners;

    partnerListCount.textContent = query ? `${filtered.length} dari ${partners.length}` : `${partners.length} data`;
    partnerList.innerHTML = '';

    if (!partners.length) {
      partnerList.innerHTML = '<p class="admin-empty">Belum ada data mitra.</p>';
      return;
    }
    if (!filtered.length) {
      partnerList.innerHTML = '<p class="admin-empty">Tidak ada mitra yang cocok dengan pencarian.</p>';
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'admin-activity-item admin-activity-card-item admin-partner-card-item';
      card.innerHTML = `
        <img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.name)}" />
        <div>
          <span>${item.isActive ? 'Tampil di homepage' : 'Disembunyikan'}</span>
          <h3>${escapeHtml(item.name)}</h3>
        </div>
        <details class="admin-card-menu">
          <summary aria-label="Buka aksi mitra">...</summary>
          <div class="admin-card-menu-list">
            <button class="admin-card-menu-action admin-edit-partner" type="button" data-id="${item.id}">Edit</button>
            <button class="admin-card-menu-action admin-toggle-partner" type="button" data-id="${item.id}" data-active="${item.isActive ? '0' : '1'}">${item.isActive ? 'Hide' : 'Tampilkan'}</button>
            <button class="admin-card-menu-action admin-delete-partner" type="button" data-id="${item.id}">Hapus</button>
          </div>
        </details>
      `;
      partnerList.appendChild(card);
    });
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      setLoggedIn(Boolean(data.authenticated));
      if (!data.authenticated) showMessage('Silakan login terlebih dahulu.', 'error');
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
      const data = await apiRequest('/api/auth.php', { method: 'POST', body: formData });
      setLoggedIn(Boolean(data.authenticated));
      showMessage('Login berhasil.', 'success');
    } catch (error) {
      showMessage(error.message || 'Login gagal.', 'error');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('action', 'logout');
    try {
      await apiRequest('/api/auth.php', { method: 'POST', body: formData });
    } catch (error) {
      // UI logout stays deterministic.
    }
    setLoggedIn(false);
    showMessage('Anda sudah logout.', 'success');
  });

  cancelPartnerEditBtn.addEventListener('click', () => {
    resetForm();
    showMessage('Mode edit dibatalkan.', 'success');
  });

  partnerSearch?.addEventListener('input', renderList);

  partnerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('partnerId').value;
    const name = document.getElementById('partnerName').value.trim();
    const logoFile = partnerLogo.files[0];
    if (!name) {
      showMessage('Nama mitra wajib diisi.', 'error');
      return;
    }
    if (!id && !logoFile) {
      showMessage('Logo mitra wajib diupload.', 'error');
      return;
    }
    if (logoFile && logoFile.size > 4 * 1024 * 1024) {
      showMessage('Ukuran logo maksimal 4 MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('action', id ? 'update' : 'create');
    if (id) formData.append('id', id);
    formData.append('name', name);
    formData.append('website_url', document.getElementById('partnerUrl').value.trim());
    formData.append('sort_order', document.getElementById('partnerSort').value || '0');
    if (logoFile) formData.append('logo', logoFile);

    try {
      await apiRequest('/api/partners.php', { method: 'POST', body: formData });
      resetForm();
      await renderList();
      showMessage('Data mitra berhasil disimpan.', 'success');
    } catch (error) {
      showMessage(error.message || 'Data mitra gagal disimpan.', 'error');
    }
  });

  partnerList.addEventListener('click', async (event) => {
    const action = event.target.closest('.admin-card-menu-action');
    if (action) action.closest('details')?.removeAttribute('open');

    const editButton = event.target.closest('.admin-edit-partner');
    if (editButton) {
      const item = partners.find((partner) => partner.id === editButton.dataset.id);
      if (!item) return;
      document.getElementById('partnerId').value = item.id;
      document.getElementById('partnerName').value = item.name;
      document.getElementById('partnerUrl').value = item.websiteUrl || '';
      document.getElementById('partnerSort').value = item.sortOrder || 0;
      partnerLogo.value = '';
      partnerLogo.required = false;
      partnerLogoNote.textContent = 'Kosongkan jika ingin tetap memakai logo sekarang.';
      savePartnerBtn.textContent = 'Update Mitra';
      cancelPartnerEditBtn.hidden = false;
      partnerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showMessage('Mode edit aktif. Data mitra sudah dimuat ke form.', 'success');
      return;
    }

    const toggleButton = event.target.closest('.admin-toggle-partner');
    if (toggleButton) {
      const formData = new FormData();
      formData.append('action', 'toggle_active');
      formData.append('id', toggleButton.dataset.id);
      formData.append('is_active', toggleButton.dataset.active);
      try {
        await apiRequest('/api/partners.php', { method: 'POST', body: formData });
        await renderList();
        showMessage('Status tampil mitra berhasil diperbarui.', 'success');
      } catch (error) {
        showMessage(error.message || 'Status mitra gagal diperbarui.', 'error');
      }
      return;
    }

    const deleteButton = event.target.closest('.admin-delete-partner');
    if (!deleteButton) return;
    try {
      await apiRequest(`/api/partners.php?id=${encodeURIComponent(deleteButton.dataset.id)}`, { method: 'DELETE' });
      await renderList();
      showMessage('Mitra berhasil dihapus.', 'success');
    } catch (error) {
      showMessage(error.message || 'Mitra gagal dihapus.', 'error');
    }
  });

  resetForm();
  checkSession();
}());
