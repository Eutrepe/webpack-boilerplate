const navbar = document.querySelector<HTMLElement>('.navbar');
const SCROLL_TRIGGER = 30;

function handleScroll() {
  if (!navbar) return;
  if (window.scrollY >= SCROLL_TRIGGER) {
    navbar.classList.add('is-scrolled');
  } else {
    navbar.classList.remove('is-scrolled');
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });
