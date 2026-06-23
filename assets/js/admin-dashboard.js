(function () {
  const loginPanel = document.getElementById('loginPanel');
  const dashboardPanel = document.getElementById('dashboardPanel');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const message = document.getElementById('adminMessage');
  const sessionText = document.getElementById('adminSessionText');

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

  const setDashboardState = (data) => {
    const isAuthenticated = Boolean(data?.authenticated);
    loginPanel.hidden = isAuthenticated;
    dashboardPanel.hidden = !isAuthenticated;
    if (isAuthenticated) {
      sessionText.textContent = `Login sebagai ${data.name || data.username || 'Super Admin'} (${data.role || 'super_admin'}).`;
    }
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      setDashboardState(data);
    } catch (error) {
      setDashboardState({ authenticated: false });
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
      setDashboardState(data);
      showMessage('', '');
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
      // Keep UI logout deterministic even when the request fails.
    }
    setDashboardState({ authenticated: false });
    showMessage('Anda sudah logout.', 'success');
  });

  checkSession();
}());
