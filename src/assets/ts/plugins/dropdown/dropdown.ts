type MenuPair = {
  wrapper: HTMLElement;
  toggle: HTMLElement;
  menu: HTMLElement;
};

interface DropdownOptions {
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
}

export class DropdownController {
  private menuPairs: MenuPair[] = [];
  private activeMenu: MenuPair | null = null;
  private opts: Required<DropdownOptions>;
  private timers = new Map<HTMLElement, { open?: number; close?: number }>();
  private boundDocClick!: (e: Event) => void;
  private boundDocKey!: (e: KeyboardEvent) => void;

  constructor(
    private root: HTMLElement,
    options: DropdownOptions = {},
  ) {
    this.opts = {
      hoverOpenDelay: options.hoverOpenDelay ?? 100,
      hoverCloseDelay: options.hoverCloseDelay ?? 150,
    };
    this.init();
  }

  destroy() {
    document.removeEventListener('click', this.boundDocClick);
    document.removeEventListener('keydown', this.boundDocKey, true);
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  private init() {
    const toggles = Array.from(
      this.root.querySelectorAll<HTMLElement>('[aria-controls]'),
    );

    toggles.forEach((toggle) => {
      const menuId = toggle.getAttribute('aria-controls');
      if (!menuId) return;

      // scoped lookup inside root; CSS.escape fallback
      const safeId =
        window.CSS && typeof window.CSS.escape === 'function'
          ? window.CSS.escape(menuId)
          : menuId.replace(/[!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]/g, '\\$&');

      const menu = this.root.querySelector<HTMLElement>(`#${safeId}`);
      if (!menu) return;

      const wrapper = (toggle.closest('.navbar__item') ||
        toggle.parentElement) as HTMLElement;

      const pair: MenuPair = { wrapper, toggle, menu };
      this.menuPairs.push(pair);
      this.timers.set(toggle, {});

      // initial state
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('hidden', '');
      this.updateMenuTabbability(menu, false);

      // CLICK (z propag‑blokadą)
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // 🚫 blokuje globalny document.click
        this.clearTimers(toggle);
        this.toggleMenu(toggle);
      });

      // HOVER na wrapperze
      wrapper.addEventListener('mouseenter', () => {
        const t = this.timers.get(toggle)!;
        if (t.close) window.clearTimeout(t.close);
        t.open = window.setTimeout(
          () => this.openMenu(toggle),
          this.opts.hoverOpenDelay,
        );
      });
      wrapper.addEventListener('mouseleave', () => {
        const t = this.timers.get(toggle)!;
        if (t.open) window.clearTimeout(t.open);
        t.close = window.setTimeout(
          () => this.closeMenu(toggle),
          this.opts.hoverCloseDelay,
        );
      });

      // Keyboard
      toggle.addEventListener('keydown', (e) =>
        this.handleToggleKeydown(e, pair),
      );
      menu.addEventListener('keydown', (e) => this.handleMenuKeydown(e, pair));

      // transition end
      menu.addEventListener('transitionend', (ev) => {
        if (
          ev.propertyName === 'opacity' &&
          menu.classList.contains('is-closing')
        ) {
          menu.setAttribute('hidden', '');
          this.updateMenuTabbability(menu, false);
          menu.classList.remove('is-closing');
        }
      });
    });

    // Global listeners
    this.boundDocClick = (e) => this.onDocumentClick(e);
    this.boundDocKey = (e) => this.onDocumentKey(e);
    document.addEventListener('click', this.boundDocClick);
    document.addEventListener('keydown', this.boundDocKey, true);
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  private clearTimers(toggle: HTMLElement) {
    const t = this.timers.get(toggle);
    if (!t) return;
    if (t.open) window.clearTimeout(t.open);
    if (t.close) window.clearTimeout(t.close);
  }

  private getPair(toggle: HTMLElement) {
    return this.menuPairs.find((p) => p.toggle === toggle);
  }

  private getMenuItems(menu: HTMLElement) {
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }

  private updateMenuTabbability(menu: HTMLElement, tabbable: boolean) {
    this.getMenuItems(menu).forEach((item) => {
      item.setAttribute('tabindex', tabbable ? '0' : '-1');
    });
  }

  // ------------------------------------------------------------------
  // State control
  // ------------------------------------------------------------------
  private toggleMenu(toggle: HTMLElement) {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? this.closeMenu(toggle) : this.openMenu(toggle);
  }

  private openMenu(toggle: HTMLElement) {
    const pair = this.getPair(toggle);
    if (!pair) return;

    if (this.activeMenu && this.activeMenu.toggle !== toggle) {
      this.closeMenu(this.activeMenu.toggle, true);
    }

    toggle.setAttribute('aria-expanded', 'true');
    pair.menu.classList.remove('is-closing');
    pair.menu.classList.add('is-open');
    pair.menu.removeAttribute('hidden');
    this.updateMenuTabbability(pair.menu, true);

    this.activeMenu = pair;
  }

  private closeMenu(toggle: HTMLElement, instant = false) {
    const pair = this.getPair(toggle);
    if (!pair) return;

    if (instant) {
      pair.menu.classList.remove('is-open', 'is-closing');
      pair.menu.setAttribute('hidden', '');
      this.updateMenuTabbability(pair.menu, false);
    } else {
      pair.menu.classList.remove('is-open');
      pair.menu.classList.add('is-closing');
      this.updateMenuTabbability(pair.menu, false);
    }

    toggle.setAttribute('aria-expanded', 'false');
    if (this.activeMenu?.toggle === toggle) this.activeMenu = null;
  }

  // ------------------------------------------------------------------
  // Document handlers
  // ------------------------------------------------------------------
  private onDocumentClick(e: Event) {
    if (!this.activeMenu) return;
    const { menu, toggle } = this.activeMenu;
    if (
      !menu.contains(e.target as Node) &&
      !toggle.contains(e.target as Node)
    ) {
      this.closeMenu(toggle);
    }
  }

  private onDocumentKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.activeMenu) {
      const { toggle } = this.activeMenu;
      this.closeMenu(toggle);
      toggle.focus();
    }
  }

  // ------------------------------------------------------------------
  // Keyboard – toggle
  // ------------------------------------------------------------------
  private handleToggleKeydown(e: KeyboardEvent, pair: MenuPair) {
    const { toggle, menu } = pair;

    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.openMenu(toggle);
        this.getMenuItems(menu)[0]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.openMenu(toggle);
        this.getMenuItems(menu).slice(-1)[0]?.focus();
        break;
      case 'Escape':
        if (toggle.getAttribute('aria-expanded') === 'true') {
          e.preventDefault();
          this.closeMenu(toggle);
          toggle.focus();
        }
        break;
    }
  }

  // ------------------------------------------------------------------
  // Keyboard – menu (trap & roving)
  // ------------------------------------------------------------------
  private handleMenuKeydown(e: KeyboardEvent, pair: MenuPair) {
    const { toggle, menu } = pair;
    const items = this.getMenuItems(menu);
    const current = document.activeElement as HTMLElement;
    const index = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(index + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      case 'Tab':
        e.preventDefault();
        const next = e.shiftKey
          ? (index - 1 + items.length) % items.length
          : (index + 1) % items.length;
        items[next].focus();
        break;
      case 'Escape':
        e.preventDefault();
        this.closeMenu(toggle);
        toggle.focus();
        break;
    }
  }
}
