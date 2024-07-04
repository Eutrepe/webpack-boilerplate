

export const initMobile = (body: HTMLElement): void => {
    const openMobileButton = document.querySelector('[data-navigation-open]');
    const closeMobileButton = document.querySelector('[data-navigation-close]');
  
    body.addEventListener('click', (event: Event) => {
      const targetElement = event.target as HTMLElement;
  
      if (!targetElement || !body.classList.contains('is-mobile-menu-open')) return;
  
      const closestMenu = targetElement.closest('[data-navigation-mobile]');
      const closestMenuOpenButton = targetElement.closest('[data-navigation-open]');
  
      if (!closestMenu && !closestMenuOpenButton) closeMobileMenu(body);
    });
  
    if (openMobileButton) {
      openMobileButton.addEventListener('click', (event: Event) => {
        event.preventDefault();
        openMobileMenu(body);
      });
    }
  
    if (closeMobileButton) {
      closeMobileButton.addEventListener('click', (event: Event) => {
        event.preventDefault();
        closeMobileMenu(body);
      });
    }
  }
  
  function openMobileMenu(body: HTMLElement): void {
    body.classList.add('is-mobile-menu-open');
  }
  
  function closeMobileMenu(body: HTMLElement): void {
    body.classList.remove('is-mobile-menu-open');
  }