/**
 * Inicjalizacja mobilnego menu nawigacyjnego z pełną
 * obsługą A11Y i sterowania z klawiatury.
 */
export const initMobile = (): void => {
  const body = document.body;
  const menu = body.querySelector<HTMLElement>('[data-navigation-mobile]');
  const openBtn = body.querySelector<HTMLButtonElement>(
    '[data-navigation-open]',
  );
  const closeBtn = body.querySelector<HTMLButtonElement>(
    '[data-navigation-close]',
  );

  if (!menu || !openBtn || !closeBtn) return;

  /* ---------- Stałe i zmienne pomocnicze ---------- */
  const IS_OPEN = 'is-mobile-menu-open';
  const FOCUSABLE =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let previouslyFocused: HTMLElement | null = null;

  /* =====================================================================
     Dropdown-menu — inicjalizacja tylko raz
     ===================================================================== */
  const initDropdownMenus = (() => {
    let initialized = false;

    return (): void => {
      if (initialized) return; // zapobiega wielokrotnej inicjalizacji
      initialized = true;

      /* ---------- Standardowe dropdowny ---------- */
      const dropdownToggles = menu.querySelectorAll<HTMLButtonElement>(
        '.navbar__dropdown-toggle',
      );

      dropdownToggles.forEach((toggle) => {
        const submenuId = toggle.getAttribute('aria-controls');
        const submenu = submenuId
          ? menu.querySelector<HTMLElement>(`#${submenuId}`)
          : null;

        if (!submenu) return;

        /* Kliknięcie w toggle */
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

          closeAllSubmenus(); // zamknij pozostałe

          if (!isExpanded) openSubmenu(toggle, submenu);
        });

        /* ESC w submenu */
        submenu.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeSubmenu(toggle, submenu);
            toggle.focus();
          }
        });
      });

      /* ---------- Przełącznik językowy ---------- */
      const langToggle = menu.querySelector<HTMLButtonElement>('.lang__toggle');
      const langMenu = menu.querySelector<HTMLElement>('#lang-menu');

      if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const isExpanded =
            langToggle.getAttribute('aria-expanded') === 'true';

          closeAllSubmenus();

          if (!isExpanded) openSubmenu(langToggle, langMenu);
        });

        langMenu.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeSubmenu(langToggle, langMenu);
            langToggle.focus();
          }
        });
      }
    };
  })();

  /* ---------- Funkcje pomocnicze dla submenu ---------- */
  const openSubmenu = (
    toggle: HTMLButtonElement,
    submenu: HTMLElement,
  ): void => {
    toggle.setAttribute('aria-expanded', 'true');
    submenu.removeAttribute('hidden');

    const firstItem = submenu.querySelector<HTMLElement>(FOCUSABLE);
    firstItem?.focus();
  };

  const closeSubmenu = (
    toggle: HTMLButtonElement,
    submenu: HTMLElement,
  ): void => {
    toggle.setAttribute('aria-expanded', 'false');
    submenu.setAttribute('hidden', '');
  };

  const closeAllSubmenus = (): void => {
    const allToggles = menu.querySelectorAll<HTMLButtonElement>(
      '[aria-haspopup="true"]',
    );

    allToggles.forEach((toggle) => {
      const submenuId = toggle.getAttribute('aria-controls');
      const submenu = submenuId
        ? menu.querySelector<HTMLElement>(`#${submenuId}`)
        : null;

      if (submenu) closeSubmenu(toggle, submenu);
    });
  };

  /* =====================================================================
     Focus-trap & nawigacja klawiaturą wewnątrz otwartego menu
     ===================================================================== */
  const handleKey = (e: KeyboardEvent): void => {
    if (!body.classList.contains(IS_OPEN)) return;

    const focusables = Array.from(
      menu.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => !el.closest('[hidden]')); // pomija ukryte

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const currentIndex = focusables.indexOf(
      document.activeElement as HTMLElement,
    );

    switch (e.key) {
      case 'Tab':
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        focusables[(currentIndex + 1) % focusables.length].focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        focusables[
          (currentIndex - 1 + focusables.length) % focusables.length
        ].focus();
        break;

      case 'Escape':
        e.preventDefault();

        // jeżeli jesteśmy w otwartym submenu ➜ zamknij je
        const activeSubmenu = (document.activeElement as HTMLElement)?.closest(
          '[role="menu"]',
        ) as HTMLElement | null;

        if (activeSubmenu && !activeSubmenu.hasAttribute('hidden')) {
          const toggle = menu.querySelector<HTMLButtonElement>(
            `[aria-controls="${activeSubmenu.id}"]`,
          );
          if (toggle) {
            closeSubmenu(toggle, activeSubmenu);
            toggle.focus();
            return;
          }
        }

        // w przeciwnym razie ➜ zamknij całe menu
        close();
        break;
    }
  };

  /* =====================================================================
     Otwarcie / zamknięcie menu
     ===================================================================== */
  const open = (): void => {
    body.classList.add(IS_OPEN);
    openBtn.setAttribute('aria-expanded', 'true');
    menu.removeAttribute('aria-hidden');
    menu.removeAttribute('inert');

    previouslyFocused = document.activeElement as HTMLElement;

    initDropdownMenus(); // wywołane tylko raz
    const firstFocusable = menu.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? closeBtn).focus();

    document.addEventListener('keydown', handleKey);
  };

  const close = (): void => {
    body.classList.remove(IS_OPEN);
    openBtn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');

    closeAllSubmenus();

    document.removeEventListener('keydown', handleKey);

    previouslyFocused?.focus();
    previouslyFocused = null;
  };

  /* =====================================================================
     Kliknięcia
     ===================================================================== */
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });

  /* Zamknięcie menu po kliknięciu poza nim */
  body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (
      body.classList.contains(IS_OPEN) &&
      !target.closest('[data-navigation-mobile]') &&
      !target.closest('[data-navigation-open]')
    ) {
      close();
    }
  });

  /* Zamknięcie submenu po kliknięciu poza nim (wewnątrz menu) */
  menu.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (
      !target.closest('.navbar__dropdown') &&
      !target.closest('.navbar__item--lang')
    ) {
      closeAllSubmenus();
    }
  });
};
