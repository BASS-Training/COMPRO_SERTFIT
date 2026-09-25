(function () {
  const logoutBtn = document.getElementById('logoutBtn');
  const sessionText = document.getElementById('adminSessionText');

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
      if (!data.authenticated) {
        window.location.replace('/admin');
        return;
      }
      sessionText.textContent = `Login sebagai ${data.name || data.username || 'Super Admin'} (${data.role || 'super_admin'}).`;
    } catch (error) {
      window.location.replace('/admin');
    }
  };

  logoutBtn?.addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('action', 'logout');
    try {
      await apiRequest('/api/auth.php', { method: 'POST', body: formData });
    } finally {
      window.location.replace('/admin');
    }
  });

  checkSession();
}());
