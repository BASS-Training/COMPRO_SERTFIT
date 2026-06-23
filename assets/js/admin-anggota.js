(function () {
  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const memberForm = document.getElementById('memberForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const previewBtn = document.getElementById('previewMemberBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const message = document.getElementById('adminMessage');
  const list = document.getElementById('adminMemberList');
  const memberSearch = document.getElementById('memberSearch');
  const memberListCount = document.getElementById('memberListCount');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const memberPreview = document.getElementById('memberPreview');
  const previewPhoto = document.getElementById('previewPhoto');
  const previewName = document.getElementById('previewName');
  const previewRole = document.getElementById('previewRole');

  let members = [];

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

  const readImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const avatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Anggota AFIN')}&size=600&background=E6F4FB&color=0D1B2A`;

  const setLoggedIn = (isLoggedIn) => {
    loginPanel.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
    if (isLoggedIn) renderList();
  };

  const getValues = () => ({
    id: document.getElementById('memberId').value,
    name: document.getElementById('memberName').value.trim(),
    roleLabel: document.getElementById('memberRole').value.trim() || 'Anggota Perkumpulan',
    sortOrder: document.getElementById('memberSort').value || '0',
    photoFile: document.getElementById('memberPhoto').files[0],
  });

  const renderPreview = async () => {
    const values = getValues();
    if (!values.name) {
      showMessage('Nama anggota wajib diisi sebelum preview.', 'error');
      return false;
    }

    if (values.photoFile && values.photoFile.size > 4 * 1024 * 1024) {
      showMessage('Ukuran foto maksimal 4 MB.', 'error');
      return false;
    }

    let photo = avatarUrl(values.name);
    const existing = members.find((item) => item.id === values.id);
    if (existing) photo = existing.photo;
    if (values.photoFile) photo = await readImage(values.photoFile);

    previewPhoto.src = photo;
    previewPhoto.alt = values.name;
    previewName.textContent = values.name;
    previewRole.textContent = values.roleLabel;
    previewPlaceholder.hidden = true;
    memberPreview.hidden = false;
    showMessage('Preview anggota sudah diperbarui.', 'success');
    return true;
  };

  const resetForm = () => {
    memberForm.reset();
    document.getElementById('memberId').value = '';
    document.getElementById('memberRole').value = 'Anggota Perkumpulan';
    document.getElementById('memberSort').value = '0';
    cancelEditBtn.hidden = true;
    previewPlaceholder.hidden = false;
    memberPreview.hidden = true;
  };

  const fetchMembers = async () => {
    const data = await apiRequest('/api/anggota.php?all=1');
    members = data.items || [];
    return members;
  };

  const renderList = async () => {
    try {
      await fetchMembers();
    } catch (error) {
      list.innerHTML = '<p class="admin-empty">Data anggota belum bisa dibaca. Pastikan backend dan database aktif.</p>';
      return;
    }

    const query = (memberSearch?.value || '').trim().toLowerCase();
    const filteredMembers = query
      ? members.filter((item) => [
        item.name,
        item.roleLabel,
        item.isActive ? 'tampil' : 'hide',
      ].some((value) => String(value || '').toLowerCase().includes(query)))
      : members;

    if (memberListCount) {
      memberListCount.textContent = query
        ? `${filteredMembers.length} dari ${members.length}`
        : `${members.length} data`;
    }

    list.innerHTML = '';
    if (!members.length) {
      list.innerHTML = '<p class="admin-empty">Belum ada data anggota.</p>';
      return;
    }

    if (!filteredMembers.length) {
      list.innerHTML = '<p class="admin-empty">Tidak ada anggota yang cocok dengan pencarian.</p>';
      return;
    }

    filteredMembers.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'admin-activity-item admin-member-item admin-member-card-item';
      card.innerHTML = `
        <img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" />
        <div>
          <span>${item.isActive ? 'Tampil di website' : 'Disembunyikan'}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.roleLabel)}</p>
        </div>
        <details class="admin-card-menu">
          <summary aria-label="Buka aksi anggota">...</summary>
          <div class="admin-card-menu-list">
            <button class="admin-card-menu-action admin-edit-member" type="button" data-id="${item.id}">Edit</button>
            <button class="admin-card-menu-action admin-toggle-member" type="button" data-id="${item.id}" data-active="${item.isActive ? '0' : '1'}">${item.isActive ? 'Hide' : 'Tampilkan'}</button>
            <button class="admin-card-menu-action admin-delete-member" type="button" data-id="${item.id}">Hapus</button>
          </div>
        </details>
      `;
      list.appendChild(card);
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
      const data = await apiRequest('/api/auth.php', {
        method: 'POST',
        body: formData,
      });
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

  previewBtn.addEventListener('click', async () => {
    await renderPreview();
  });

  cancelEditBtn.addEventListener('click', () => {
    resetForm();
    showMessage('Mode edit dibatalkan.', 'success');
  });

  memberSearch?.addEventListener('input', () => {
    renderList();
  });

  memberForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = getValues();
    if (!values.name) {
      showMessage('Nama anggota wajib diisi.', 'error');
      return;
    }
    if (values.photoFile && values.photoFile.size > 4 * 1024 * 1024) {
      showMessage('Ukuran foto maksimal 4 MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('action', values.id ? 'update' : 'create');
    if (values.id) formData.append('id', values.id);
    formData.append('name', values.name);
    formData.append('role_label', values.roleLabel);
    formData.append('sort_order', values.sortOrder);
    if (values.photoFile) formData.append('photo', values.photoFile);

    try {
      await apiRequest('/api/anggota.php', {
        method: 'POST',
        body: formData,
      });
      resetForm();
      await renderList();
      showMessage('Data anggota berhasil disimpan.', 'success');
    } catch (error) {
      showMessage(error.message || 'Data anggota gagal disimpan.', 'error');
    }
  });

  list.addEventListener('click', async (event) => {
    const menuAction = event.target.closest('.admin-card-menu-action');
    if (menuAction) {
      menuAction.closest('details')?.removeAttribute('open');
    }

    const editButton = event.target.closest('.admin-edit-member');
    if (editButton) {
      const item = members.find((member) => member.id === editButton.dataset.id);
      if (!item) return;
      document.getElementById('memberId').value = item.id;
      document.getElementById('memberName').value = item.name;
      document.getElementById('memberRole').value = item.roleLabel;
      document.getElementById('memberSort').value = item.sortOrder || 0;
      document.getElementById('memberPhoto').value = '';
      cancelEditBtn.hidden = false;
      await renderPreview();
      showMessage('Mode edit aktif. Ubah data lalu klik Simpan Anggota.', 'success');
      return;
    }

    const toggleButton = event.target.closest('.admin-toggle-member');
    if (toggleButton) {
      const formData = new FormData();
      formData.append('action', 'toggle_active');
      formData.append('id', toggleButton.dataset.id);
      formData.append('is_active', toggleButton.dataset.active);
      try {
        await apiRequest('/api/anggota.php', {
          method: 'POST',
          body: formData,
        });
        await renderList();
        showMessage('Status tampil anggota berhasil diperbarui.', 'success');
      } catch (error) {
        showMessage(error.message || 'Status anggota gagal diperbarui.', 'error');
      }
      return;
    }

    const deleteButton = event.target.closest('.admin-delete-member');
    if (!deleteButton) return;
    try {
      await apiRequest(`/api/anggota.php?id=${encodeURIComponent(deleteButton.dataset.id)}`, {
        method: 'DELETE',
      });
      await renderList();
      showMessage('Anggota berhasil dihapus.', 'success');
    } catch (error) {
      showMessage(error.message || 'Anggota gagal dihapus.', 'error');
    }
  });

  checkSession();
}());
