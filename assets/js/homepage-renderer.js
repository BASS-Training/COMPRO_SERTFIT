(function () {
  const setText = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const setAttr = (selector, attr, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.setAttribute(attr, value);
    });
  };

  const setVisible = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.hidden = value === '0';
    });
  };

  const applySectionOrder = (value) => {
    const order = String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!order.length) return;

    const sections = new Map();
    document.querySelectorAll('[data-homepage-order-item]').forEach((section) => {
      sections.set(section.dataset.homepageSection, section);
    });

    const firstSection = document.querySelector('[data-homepage-order-item]');
    const parent = firstSection?.parentElement;
    if (!parent) return;

    order.forEach((key) => {
      const section = sections.get(key);
      if (section) parent.appendChild(section);
    });
  };

  fetch('/api/homepage.php', { credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Request gagal')))
    .then((data) => {
      if (!data || data.configured === false || !data.settings) return;
      const settings = data.settings;

      setText('[data-homepage-field="hero_title"]', settings.home_hero_title);
      setText('[data-homepage-field="hero_description"]', settings.home_hero_description);
      setText('[data-homepage-field="hero_button_text"]', settings.home_hero_button_text);
      setAttr('[data-homepage-field="hero_button_url"]', 'href', settings.home_hero_button_url);
      setAttr('[data-homepage-field="hero_image"]', 'src', settings.home_hero_image);

      setText('[data-homepage-field="activities_kicker"]', settings.home_activities_kicker);
      setText('[data-homepage-field="activities_title"]', settings.home_activities_title);
      setText('[data-homepage-field="activities_description"]', settings.home_activities_description);
      setText('[data-homepage-field="profile_kicker"]', settings.home_profile_kicker);
      setText('[data-homepage-field="profile_title"]', settings.home_profile_title);
      setText('[data-homepage-field="profile_card_title"]', settings.home_profile_card_title);
      setText('[data-homepage-field="profile_card_description"]', settings.home_profile_card_description);
      setText('[data-homepage-field="members_kicker"]', settings.home_members_kicker);
      setText('[data-homepage-field="members_title"]', settings.home_members_title);
      setText('[data-homepage-field="partners_kicker"]', settings.home_partners_kicker);
      setText('[data-homepage-field="partners_title"]', settings.home_partners_title);
      setText('[data-homepage-field="cta_title"]', settings.home_cta_title);
      setText('[data-homepage-field="cta_description"]', settings.home_cta_description);
      setText('[data-homepage-field="cta_button_text"]', settings.home_cta_button_text);
      setAttr('[data-homepage-field="cta_button_url"]', 'href', settings.home_cta_button_url);

      setVisible('[data-homepage-section="activities"]', settings.home_show_activities);
      setVisible('[data-homepage-section="profile"]', settings.home_show_profile);
      setVisible('[data-homepage-section="members"]', settings.home_show_members);
      setVisible('[data-homepage-section="partners"]', settings.home_show_partners);
      setVisible('[data-homepage-section="cta"]', settings.home_show_cta);
      applySectionOrder(settings.home_section_order);
    })
    .catch(() => {
      // Static HTML remains the public fallback.
    });
}());
