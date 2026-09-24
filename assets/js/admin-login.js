(function () {
  const loginForm = document.getElementById('loginForm');
  const message = document.getElementById('adminMessage');

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
      throw new Error(data.message || 'Request gagal.');
    }
    return data;
  };

  const checkSession = async () => {
    try {
      const data = await apiRequest('/api/auth.php');
      if (data.authenticated) window.location.replace('/admin-dashboard.html');
    } catch (error) {
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
      await apiRequest('/api/auth.php', { method: 'POST', body: formData });
      window.location.replace('/admin-dashboard.html');
    } catch (error) {
      showMessage(error.message || 'Login gagal.', 'error');
    }
  });

  checkSession();
}());
