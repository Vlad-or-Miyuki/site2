const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement && window.matchMedia('(max-width: 860px)').matches) {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
      menuButton.focus();
    }
  });
}

document.querySelectorAll('[data-copy-address]').forEach((button) => {
  button.addEventListener('click', async () => {
    const address = button.getAttribute('data-copy-address');
    const label = button.querySelector('[data-copy-label]');
    const status = button.parentElement.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(address);
      if (label) label.textContent = 'Адрес скопирован';
      if (status) status.textContent = 'Адрес скопирован в буфер обмена';
      window.setTimeout(() => { if (label) label.textContent = 'Скопировать адрес'; }, 2200);
    } catch {
      if (status) status.textContent = 'Не удалось скопировать адрес';
    }
  });
});

const brandViewport = document.querySelector('[data-brand-viewport]');
if (brandViewport) {
  const brandSection = brandViewport.closest('.brand-section');
  const brandButtons = [...brandSection.querySelectorAll('[data-brand-direction]')];
  const updateBrandControls = () => {
    const maxScroll = Math.max(0, brandViewport.scrollWidth - brandViewport.clientWidth);
    brandButtons.forEach((button) => {
      const direction = Number(button.dataset.brandDirection);
      button.disabled = maxScroll < 2 || (direction < 0 ? brandViewport.scrollLeft <= 2 : brandViewport.scrollLeft >= maxScroll - 2);
    });
  };
  brandButtons.forEach((button) => button.addEventListener('click', () => {
    const card = brandViewport.querySelector('.brand-card');
    const step = card ? card.getBoundingClientRect().width + 18 : brandViewport.clientWidth * 0.8;
    brandViewport.scrollBy({ left: Number(button.dataset.brandDirection) * step, behavior: 'smooth' });
  }));
  brandViewport.addEventListener('scroll', updateBrandControls, { passive: true });
  window.addEventListener('resize', updateBrandControls);
  updateBrandControls();
}