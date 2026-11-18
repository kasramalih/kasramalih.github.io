const navigation = document.querySelector('.navigation');
const menuButton = document.querySelector('.menu-toggle');
const themeButton = document.querySelector('.theme-toggle');

function setMenu(open) {
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.masthead')) setMenu(false);
});
window.matchMedia('(max-width: 760px)').addEventListener('change', () => setMenu(false));

function updateNavigation() {
  for (const link of navigation.querySelectorAll('a')) {
    if (link.hash === location.hash) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();

function updateThemeLabel() {
  const label = document.documentElement.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
}
updateThemeLabel();
themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  updateThemeLabel();
  try { localStorage.setItem('theme', next); } catch {}
});

document.querySelector('#about').addEventListener('click', (event) => {
  const button = event.target.closest('.bio-toggle');
  if (!button) return;
  const biography = document.getElementById(button.getAttribute('aria-controls'));
  biography.hidden = !biography.hidden;
  button.setAttribute('aria-expanded', String(!biography.hidden));
  button.lastElementChild.textContent = biography.hidden ? '+' : '−';
});

// The existing content files contain Markdown headings and HTML fragments.
async function loadSection(section) {
  try {
    const response = await fetch(section.dataset.source, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Content unavailable');
    const source = await response.text();
    section.innerHTML = source.replace(/^#{1,2} (.+)$/gm, '<h2>$1</h2>');
  } catch {
    const message = document.createElement('p');
    message.textContent = 'This section could not be loaded. ';
    const retry = document.createElement('button');
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => loadSection(section));
    message.append(retry);
    section.replaceChildren(message);
  }
}

Promise.all(Array.from(document.querySelectorAll('[data-source]'), loadSection)).then(() => {
  // Restore direct section links once all preceding sections have their full height.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
