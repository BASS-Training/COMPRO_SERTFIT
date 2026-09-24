(function () {
  const loginPanel = document.getElementById('loginPanel');
  const adminPanel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const profileForm = document.getElementById('profileForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const previewBtn = document.getElementById('previewProfileBtn');
  const message = document.getElementById('adminMessage');

  const fields = {
    about_title: document.getElementById('aboutTitle'),
    about_description: document.getElementById('aboutDescription'),
    about_profile_kicker: document.getElementById('aboutProfileKicker'),
    about_profile_title: document.getElementById('aboutProfileTitle'),
    about_profile_description: document.getElementById('aboutProfileDescription'),
    about_support_kicker: document.getElementById('aboutSupportKicker'),
    about_support_title: document.getElementById('aboutSupportTitle'),
    about_support_description: document.getElementById('aboutSupportDescription'),
    about_reach_kicker: document.getElementById('aboutReachKicker'),
    about_reach_title: document.getElementById('aboutReachTitle'),
    about_reach_description: document.getElementById('aboutReachDescription'),
    vision: document.getElementById('vision'),
    mission: document.getElementById('mission'),
    contact_email: document.getElementById('contactEmail'),
    contact_website: document.getElementById('contactWebsite'),
    contact_phone: document.getElementById('contactPhone'),
    contact_address: document.getElementById('contactAddress'),
  };

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

  const getSettings = () => Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value.trim()])
  );

  const fillForm = (settings) => {
    Object.entries(fields).forEach(([key, field]) => {
      field.value = settings[key] || '';
    });
    renderPreview();
  };

  const missionItems = (value) => String(value || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const renderPreview = () => {
    const settings = getSettings();
    document.getElementById('previewAboutTitle').textContent = settings.about_title;
    document.getElementById('previewAboutDescription').textContent = settings.about_description;
    document.getElementById('previewAboutProfileTitle').textContent = settings.about_profile_title;
    document.getElementById('previewAboutProfileDescription').textContent = settings.about_profile_description;
    document.getElementById('previewAboutSupportTitle').textContent = settings.about_support_title;
    document.getElementById('previewAboutSupportDescription').textContent = settings.about_support_description;
    document.getElementById('previewAboutReachTitle').textContent = settings.about_reach_title;
    document.getElementById('previewAboutReachDescription').textContent = settings.about_reach_description;
    document.getElementById('previewVision').textContent = settings.vision;

    const mission = document.getElementById('previewMission');
    mission.innerHTML = '';
    missionItems(settings.mission).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      mission.appendChild(li);
    });

    document.getElementById('previewContact').textContent = [
      settings.contact_phone,
      settings.contact_email,
      settings.contact_website,
      settings.contact_address,
    ].filter(Boolean).join(' / ');
  };

  const setLoggedIn = (isLoggedIn) => {
    loginPanel.hidden = isLoggedIn;
    adminPanel.hidden = !isLoggedIn;
  };

  const loadProfile = async () => {
    const data = await apiRequest('/api/profile.php');
    fillForm(data.settings || {});
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      setLoggedIn(Boolean(data.authenticated));
      if (data.authenticated) {
        await loadProfile();
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
      await loadProfile();
      showMessage('Login berhasil.', 'success');
    } catch (error) {
      showMessage(error.message || 'Login gagal.', 'error');
    }
  });

  logoutBtn?.addEventListener('click', async () => {
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

  previewBtn.addEventListener('click', () => {
    renderPreview();
    showMessage('Preview profil sudah diperbarui.', 'success');
  });

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const settings = getSettings();
    const requiredFields = [
      'about_title', 'about_description',
      'about_profile_kicker', 'about_profile_title', 'about_profile_description',
      'about_support_kicker', 'about_support_title', 'about_support_description',
      'about_reach_kicker', 'about_reach_title', 'about_reach_description',
      'vision', 'mission',
    ];
    if (requiredFields.some((key) => !settings[key])) {
      showMessage('Field konten profil wajib diisi.', 'error');
      return;
    }

    const formData = new FormData();
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const data = await apiRequest('/api/profile.php', {
        method: 'POST',
        body: formData,
      });
      fillForm(data.settings || settings);
      showMessage('Profil website berhasil disimpan.', 'success');
    } catch (error) {
      showMessage(error.message || 'Profil website gagal disimpan.', 'error');
    }
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', renderPreview);
  });

  checkSession();
}());
