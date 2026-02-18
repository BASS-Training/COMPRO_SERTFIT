const AOS_CSS_URL = 'https://unpkg.com/aos@2.3.4/dist/aos.css';
const AOS_JS_URL = 'https://unpkg.com/aos@2.3.4/dist/aos.js';

const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const throttleRAF = (fn) => {
  let scheduled = false;
  return (...args) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      fn(...args);
      scheduled = false;
    });
  };
};

const loadAsset = (tag, attributes) => {
  return new Promise((resolve, reject) => {
    const selector = attributes.href
      ? `${tag}[href="${attributes.href}"]`
      : `${tag}[src="${attributes.src}"]`;
    if (document.querySelector(selector)) {
      resolve();
      return;
    }
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    element.addEventListener('load', () => resolve(element));
    element.addEventListener('error', reject);
    document.head.appendChild(element);
  });
};

const applyAosAttributes = () => {
  const mappings = [
    { selector: '.page-hero-title', animation: 'fade-down' },
    { selector: '.page-hero-desc', animation: 'fade-up' },
    { selector: '.hero-cta', animation: 'zoom-in' },
    { selector: '.vm-card', animation: 'fade-right' },
    { selector: '.timeline-card', animation: 'fade-up' },
    { selector: '.team-card', animation: 'zoom-in' },
    { selector: '.cta-content', animation: 'fade-up' },
    { selector: '.section-eyebrow', animation: 'fade-right' },
  ];

  mappings.forEach(({ selector, animation }) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.dataset.aos = animation;
      el.dataset.aosDuration = '700';
      el.dataset.aosOffset = '70';
      el.dataset.aosOnce = 'true';
      if (!el.dataset.aosDelay) {
        el.dataset.aosDelay = `${(index % 3) * 80}`;
      }
    });
  });
};

const initAos = () => {
  if (!window.AOS) return;
  window.AOS.init({
    duration: 720,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    mirror: false,
  });
};

const loadAosAssets = async () => {
  try {
    await loadAsset('link', { rel: 'stylesheet', href: AOS_CSS_URL });
    await loadAsset('script', { src: AOS_JS_URL, defer: true });
    initAos();
    window.addEventListener('resize', debounce(() => window.AOS && window.AOS.refresh(), 250));
  } catch (error) {
    console.warn('AOS failed to load', error);
  }
};

const setupSmoothScroll = () => {
  const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  links.forEach((link) => {
    const target = document.querySelector(link.hash);
    if (!target) return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', link.hash);
    });
  });
};

const updateHeroGridMode = () => {
  const grid = document.querySelector('.page-hero .hero-grid');
  if (!grid) return;
  grid.classList.toggle('is-mobile', window.innerWidth <= 720);
};

const syncLogoContrast = () => {
  const logoImg = document.getElementById('logoImg');
  if (!logoImg) return;
  logoImg.classList.toggle('logo-invert', window.scrollY <= 60);
};

const initAboutScripts = () => {
  applyAosAttributes();
  setupSmoothScroll();
  updateHeroGridMode();
  loadAosAssets();

  const resizeGrid = debounce(updateHeroGridMode, 180);
  window.addEventListener('resize', resizeGrid, { passive: true });
  window.addEventListener('orientationchange', updateHeroGridMode);

  const handleLogoScroll = throttleRAF(syncLogoContrast);
  window.addEventListener('scroll', handleLogoScroll, { passive: true });
  handleLogoScroll();
};

document.addEventListener('DOMContentLoaded', initAboutScripts);
