import { SITE_CONFIG } from '../config.js';

document.querySelectorAll('[data-github-link]').forEach(link => { link.href = SITE_CONFIG.githubUrl; });
document.querySelector('[data-year]').textContent = new Date().getFullYear();

const menuButton = document.querySelector('[data-menu-button]');
const navigation = document.querySelector('[data-navigation]');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navigation.dataset.open = String(!open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.dataset.open = 'false';
  }
});

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const target = document.querySelector(button.dataset.copy);
    await navigator.clipboard.writeText(target.textContent.trim());
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1200);
  });
});
