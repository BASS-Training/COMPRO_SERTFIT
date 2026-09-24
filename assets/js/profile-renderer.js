(function () {
  const missionItems = (value) => String(value || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const setText = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const setMission = (value) => {
    const list = document.querySelector('[data-profile-field="mission"]');
    if (!list || !value) return;
    list.innerHTML = '';
    missionItems(value).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
  };

  fetch('/api/profile.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => {
      if (!data || data.configured === false || !data.settings) return;
      const settings = data.settings;
      setText('[data-profile-field="about_title"]', settings.about_title);
      setText('[data-profile-field="about_description"]', settings.about_description);
      setText('[data-profile-field="about_profile_kicker"]', settings.about_profile_kicker);
      setText('[data-profile-field="about_profile_title"]', settings.about_profile_title);
      setText('[data-profile-field="about_profile_description"]', settings.about_profile_description);
      setText('[data-profile-field="about_support_kicker"]', settings.about_support_kicker);
      setText('[data-profile-field="about_support_title"]', settings.about_support_title);
      setText('[data-profile-field="about_support_description"]', settings.about_support_description);
      setText('[data-profile-field="about_reach_kicker"]', settings.about_reach_kicker);
      setText('[data-profile-field="about_reach_title"]', settings.about_reach_title);
      setText('[data-profile-field="about_reach_description"]', settings.about_reach_description);
      setText('[data-profile-field="vision"]', settings.vision);
      setMission(settings.mission);
      setText('[data-profile-field="contact_phone"]', settings.contact_phone);
      setText('[data-profile-field="contact_email"]', settings.contact_email);
      setText('[data-profile-field="contact_website"]', settings.contact_website);
      setText('[data-profile-field="contact_address"]', settings.contact_address);
    })
    .catch(() => {
      // Static HTML remains the public fallback.
    });
}());
