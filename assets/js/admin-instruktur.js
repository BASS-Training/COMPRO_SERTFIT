(function () {
  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const form = document.getElementById('instructorForm');
  const message = document.getElementById('adminMessage');
  const list = document.getElementById('adminInstructorList');
  const search = document.getElementById('instructorSearch');
  const count = document.getElementById('instructorListCount');
  const previewBtn = document.getElementById('previewInstructorBtn');
  const cancelBtn = document.getElementById('cancelInstructorEditBtn');
  const preview = document.getElementById('instructorPreview');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const previewPhoto = document.getElementById('previewInstructorPhoto');
  const previewName = document.getElementById('previewInstructorName');
  let items = [];

  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const showMessage = (text, type) => { message.textContent = text; message.className = `admin-message ${type || ''}`.trim(); };
  const apiRequest = async (url, options) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.message || 'Request gagal.');
    return data;
  };
  const readImage = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  const values = () => ({ id: document.getElementById('instructorId').value, name: document.getElementById('instructorName').value.trim(), sortOrder: document.getElementById('instructorSort').value || '0', photo: document.getElementById('instructorPhoto').files[0] });

  const resetForm = () => {
    form.reset();
    document.getElementById('instructorId').value = '';
    document.getElementById('instructorSort').value = '0';
    cancelBtn.hidden = true;
    preview.hidden = true;
    previewPlaceholder.hidden = false;
  };

  const renderPreview = async () => {
    const data = values();
    if (!data.name) { showMessage('Nama wajib diisi sebelum preview.', 'error'); return; }
    if (data.photo && data.photo.size > 4 * 1024 * 1024) { showMessage('Ukuran foto maksimal 4 MB.', 'error'); return; }
    const existing = items.find((item) => item.id === data.id);
    if (!data.photo && !existing) { showMessage('Pilih foto JPG atau PNG untuk preview.', 'error'); return; }
    previewPhoto.src = data.photo ? await readImage(data.photo) : existing.photo;
    previewPhoto.alt = data.name;
    previewName.textContent = data.name;
    previewPlaceholder.hidden = true;
    preview.hidden = false;
    showMessage('Preview berhasil diperbarui.', 'success');
  };

  const fetchItems = async () => {
    const data = await apiRequest('/api/instruktur.php?all=1');
    items = data.items || [];
  };

  const renderList = async () => {
    try { await fetchItems(); } catch (error) { list.innerHTML = '<p class="admin-empty">Data belum bisa dibaca. Pastikan database sudah dimigrasikan.</p>'; return; }
    const query = search.value.trim().toLowerCase();
    const filtered = query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items;
    count.textContent = query ? `${filtered.length} dari ${items.length}` : `${items.length} data`;
    if (!filtered.length) { list.innerHTML = `<p class="admin-empty">${items.length ? 'Tidak ada data yang cocok.' : 'Belum ada data instruktur.'}</p>`; return; }
    list.innerHTML = filtered.map((item) => `<article class="admin-activity-item admin-member-item admin-member-card-item"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" /><div><span>${item.isActive ? 'Tampil di website' : 'Disembunyikan'}</span><h3>${escapeHtml(item.name)}</h3></div><details class="admin-card-menu"><summary aria-label="Buka aksi instruktur">...</summary><div class="admin-card-menu-list"><button class="admin-card-menu-action admin-edit-instructor" type="button" data-id="${item.id}">Edit</button><button class="admin-card-menu-action admin-toggle-instructor" type="button" data-id="${item.id}" data-active="${item.isActive ? '0' : '1'}">${item.isActive ? 'Hide' : 'Tampilkan'}</button><button class="admin-card-menu-action admin-delete-instructor" type="button" data-id="${item.id}">Hapus</button></div></details></article>`).join('');
  };

  const setLoggedIn = (loggedIn) => { loginPanel.hidden = loggedIn; adminPanel.hidden = !loggedIn; if (loggedIn) renderList(); };
  const checkSession = async () => { try { const data = await apiRequest('/api/auth.php'); setLoggedIn(Boolean(data.authenticated)); if (!data.authenticated) showMessage('Silakan login terlebih dahulu.', 'error'); } catch (error) { setLoggedIn(false); } };

  loginForm.addEventListener('submit', async (event) => { event.preventDefault(); const body = new FormData(); body.append('action', 'login'); body.append('username', document.getElementById('adminUsername').value.trim()); body.append('password', document.getElementById('adminPassword').value); try { const data = await apiRequest('/api/auth.php', { method: 'POST', body }); setLoggedIn(Boolean(data.authenticated)); showMessage('Login berhasil.', 'success'); } catch (error) { showMessage(error.message, 'error'); } });
  previewBtn.addEventListener('click', renderPreview);
  cancelBtn.addEventListener('click', () => { resetForm(); showMessage('Mode edit dibatalkan.', 'success'); });
  search.addEventListener('input', renderList);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = values();
    if (!data.name) { showMessage('Nama wajib diisi.', 'error'); return; }
    if (!data.id && !data.photo) { showMessage('Foto JPG atau PNG wajib dipilih.', 'error'); return; }
    if (data.photo && data.photo.size > 4 * 1024 * 1024) { showMessage('Ukuran foto maksimal 4 MB.', 'error'); return; }
    const body = new FormData();
    body.append('action', data.id ? 'update' : 'create');
    if (data.id) body.append('id', data.id);
    body.append('name', data.name);
    body.append('sort_order', data.sortOrder);
    if (data.photo) body.append('photo', data.photo);
    try { await apiRequest('/api/instruktur.php', { method: 'POST', body }); resetForm(); await renderList(); showMessage('Data instruktur berhasil disimpan.', 'success'); } catch (error) { showMessage(error.message, 'error'); }
  });

  list.addEventListener('click', async (event) => {
    const action = event.target.closest('.admin-card-menu-action');
    action?.closest('details')?.removeAttribute('open');
    const edit = event.target.closest('.admin-edit-instructor');
    if (edit) { const item = items.find((entry) => entry.id === edit.dataset.id); if (!item) return; document.getElementById('instructorId').value = item.id; document.getElementById('instructorName').value = item.name; document.getElementById('instructorSort').value = item.sortOrder; document.getElementById('instructorPhoto').value = ''; cancelBtn.hidden = false; await renderPreview(); showMessage('Mode edit aktif.', 'success'); return; }
    const toggle = event.target.closest('.admin-toggle-instructor');
    if (toggle) { const body = new FormData(); body.append('action', 'toggle_active'); body.append('id', toggle.dataset.id); body.append('is_active', toggle.dataset.active); try { await apiRequest('/api/instruktur.php', { method: 'POST', body }); await renderList(); showMessage('Status tampil berhasil diperbarui.', 'success'); } catch (error) { showMessage(error.message, 'error'); } return; }
    const remove = event.target.closest('.admin-delete-instructor');
    if (!remove) return;
    try { await apiRequest(`/api/instruktur.php?id=${encodeURIComponent(remove.dataset.id)}`, { method: 'DELETE' }); await renderList(); showMessage('Data instruktur berhasil dihapus.', 'success'); } catch (error) { showMessage(error.message, 'error'); }
  });

  checkSession();
}());
