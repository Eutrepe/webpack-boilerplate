import { EasingsType, ScrollToConfig } from './types';

const Easings: EasingsType = {
  linear(t: number): number {
    return t;
  },
  easeInQuad(t: number): number {
    return t * t;
  },
  easeOutQuad(t: number): number {
    return t * (2 - t);
  },
  easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  easeInCubic(t: number): number {
    return t * t * t;
  },
  easeOutCubic(t: number): number {
    return --t * t * t + 1;
  },
  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  easeInQuart(t: number): number {
    return t * t * t * t;
  },
  easeOutQuart(t: number): number {
    return 1 - --t * t * t * t;
  },
  easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  easeInQuint(t: number): number {
    return t * t * t * t * t;
  },
  easeOutQuint(t: number): number {
    return 1 + --t * t * t * t * t;
  },
  easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  },
};

export class ScrollTo {
  private defaultSettings: ScrollToConfig = {
    duration: 350,
    offset: 0,
    easing: 'easeInOutQuad',
  };

  private raf: any;
  private isMoved = false;
  private start: any;
  private startTime = 0;
  private easings: EasingsType = Easings;
  private settings: any;
  private isFinished: boolean = false;

  static instance: ScrollTo;

  static getInstance(): ScrollTo {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ScrollTo();
    return this.instance;
  }

  private clearRaf = () => {
    if (
      !this.isFinished &&
      this.settings.onBreak &&
      typeof this.settings.onBreak === 'function'
    ) {
      const arg = this.settings.onBreakParams
        ? this.settings.onBreakParams
        : [];
      this.settings.onBreak(...arg);
    }

    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.clearRaf, false);
    window.removeEventListener('mousewheel', this.clearRaf, false);
    window.removeEventListener('DOMMouseScroll', this.clearRaf, false);
    this.isMoved = false;
  };

  private scroll(
    duration: number,
    easing: string,
    destinationOffsetToScroll: number,
    onEnd: () => void,
  ) {
    const now = window.performance.now();
    const time = Math.min(1, (now - this.startTime) / this.settings.duration);
    const timeFunction = this.easings[this.settings.easing](time);
    this.isMoved = true;

    window.scroll(
      0,
      Math.ceil(
        timeFunction * (destinationOffsetToScroll - this.start) + this.start,
      ),
    );
    if (
      window.pageYOffset === destinationOffsetToScroll ||
      Math.abs(window.pageYOffset - destinationOffsetToScroll) <= 1 ||
      (window.pageYOffset <= 0 && destinationOffsetToScroll < 0)
    ) {
      this.isFinished = true;
      if (
        this.isMoved &&
        this.settings.onEnd &&
        typeof this.settings.onEnd === 'function'
      ) {
        const arg = this.settings.onEndParams ? this.settings.onEndParams : [];
        this.settings.onEnd(...arg);
      }
      this.isMoved = false;
      return;
    }

    this.raf = window.requestAnimationFrame(() => {
      this.scroll(duration, easing, destinationOffsetToScroll, onEnd);
    });
  }

  scrollTo(target: HTMLElement, config: ScrollToConfig): void {
    this.isFinished = false;

    this.settings = {
      ...this.defaultSettings,
      ...config,
    };

    if (this.settings.onStart && typeof this.settings.onStart === 'function') {
      const arg = this.settings.onStartParams
        ? this.settings.onStartParams
        : [];
      this.settings.onStart(...arg);
    }

    if (this.isMoved) {
      this.clearRaf();
    }

    window.addEventListener('resize', this.clearRaf, false);
    window.addEventListener('mousewheel', this.clearRaf, false);
    window.addEventListener('DOMMouseScroll', this.clearRaf, false);

    this.start = window.pageYOffset;
    this.startTime = window.performance.now();

    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    );

    const windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    const destinationOffset =
      (typeof target === 'number'
        ? target
        : target.getBoundingClientRect().top + window.scrollY) +
      this.settings.offset;
    const destinationOffsetToScroll = Math.round(
      documentHeight - destinationOffset < windowHeight
        ? documentHeight - windowHeight
        : destinationOffset,
    );

    this.scroll(
      this.settings.duration,
      this.settings.easing,
      destinationOffsetToScroll,
      this.settings.onEnd,
    );
  }
}
