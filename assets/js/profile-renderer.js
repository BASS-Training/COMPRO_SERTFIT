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

  const youtubeEmbedUrl = (value) => {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
      let videoId = '';
      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (host === 'youtube.com') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (url.pathname === '/watch') {
          videoId = url.searchParams.get('v') || '';
        } else if (['embed', 'shorts'].includes(pathParts[0])) {
          videoId = pathParts[1] || '';
        }
      }
      return /^[A-Za-z0-9_-]{6,}$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`
        : '';
    } catch (error) {
      return '';
    }
  };

  const isMp4Url = (value) => {
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) && /\.mp4$/i.test(url.pathname);
    } catch (error) {
      return false;
    }
  };

  const setVideo = (settings) => {
    const container = document.querySelector('[data-profile-video]');
    const videoUrl = String(settings.about_video_url || '').trim();
    if (!container || !videoUrl) return;

    const embedUrl = youtubeEmbedUrl(videoUrl);
    let media = null;
    if (embedUrl) {
      media = document.createElement('iframe');
      media.src = embedUrl;
      media.title = settings.about_video_title || 'Video perkenalan LSP FIT';
      media.loading = 'lazy';
      media.referrerPolicy = 'strict-origin-when-cross-origin';
      media.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      media.allowFullscreen = true;
    } else if (isMp4Url(videoUrl)) {
      media = document.createElement('video');
      media.src = videoUrl;
      media.controls = true;
      media.autoplay = true;
      media.muted = true;
      media.defaultMuted = true;
      media.preload = 'metadata';
      media.setAttribute('muted', '');
      media.setAttribute('playsinline', '');
    }

    if (!media) return;
    container.replaceChildren(media);
    container.classList.add('has-video');
    container.removeAttribute('role');
    container.removeAttribute('aria-label');
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
      setText('[data-profile-field="about_leader_kicker"]', settings.about_leader_kicker);
      setText('[data-profile-field="about_leader_title"]', settings.about_leader_title);
      setText('[data-profile-field="about_leader_quote"]', settings.about_leader_quote);
      setText('[data-profile-field="about_leader_name"]', settings.about_leader_name);
      setText('[data-profile-field="about_leader_role"]', settings.about_leader_role);
      setText('[data-profile-field="about_video_kicker"]', settings.about_video_kicker);
      setText('[data-profile-field="about_video_title"]', settings.about_video_title);
      setText('[data-profile-field="about_video_description"]', settings.about_video_description);
      setText('[data-profile-field="about_video_note_label"]', settings.about_video_note_label);
      setText('[data-profile-field="about_video_note_description"]', settings.about_video_note_description);
      setVideo(settings);
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
