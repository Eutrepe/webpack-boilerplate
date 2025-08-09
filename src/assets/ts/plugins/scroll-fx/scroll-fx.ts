import { EasingFn, FxProp, RangePoint, ScrollFxOptions } from './types';

/* —­—­— helpers —­—­— */
const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

function resolvePoint(point: RangePoint, elRect: DOMRect, vh: number): number {
  if (point === 'enter') {
    return 0;
  }
  if (point === 'center') {
    return vh / 2 - elRect.height / 2;
  }
  if (point === 'exit') {
    return vh + elRect.height;
  }

  // Sprawdź czy to string z procentem
  if (typeof point === 'string' && point.endsWith('%')) {
    const percentage = parseFloat(point.replace('%', ''));
    if (!isNaN(percentage)) {
      // Procent odnosi się do pozycji w viewport (0% = góra, 100% = dół)
      return vh * (percentage / 100);
    }
  }

  // W tym momencie point musi być liczbą (piksele)
  return point as number;
}

export class ScrollFx {
  private el: HTMLElement;
  private props: FxProp[];
  private easing: EasingFn;
  private lock: boolean;
  private throttle: number;
  private onUpdate?: (p: number) => void;
  private startPoint: RangePoint;
  private endPoint: RangePoint;

  private locked = false;
  private lastRun = 0;

  constructor(opts: ScrollFxOptions) {
    /* ===== inicjalizacja ===== */
    this.el =
      typeof opts.el === 'string'
        ? (document.querySelector(opts.el) as HTMLElement)
        : opts.el;
    if (!this.el) throw new Error('ScrollFx: element not found');

    if (!opts.props?.length) throw new Error('ScrollFx: props empty');

    this.props = opts.props;
    this.easing = opts.easing ?? ((t) => t);
    this.lock = opts.lock ?? true;
    this.throttle = opts.throttle ?? 0;
    this.onUpdate = opts.onUpdate;

    this.startPoint = opts.range?.start ?? 'enter';
    this.endPoint = opts.range?.end ?? 'center';

    this.applyStyles(0); // stan początkowy
    this.update = this.update.bind(this);
    this.update();
    document.addEventListener(
      'scroll',
      () => requestAnimationFrame(this.update),
      { passive: true },
    );
  }

  /* PUBLIC */
  destroy() {
    document.removeEventListener('scroll', this.update);
  }

  /* PRIVATE */

  private progress(): number {
    const r = this.el.getBoundingClientRect();
    const vh = window.innerHeight;

    // Pozycja górnej krawędzi elementu względem góry viewport
    const elementTop = vh - r.top;

    // Oblicz punkty start i end w pikselach
    const startPx = resolvePoint(this.startPoint, r, vh);
    const endPx = resolvePoint(this.endPoint, r, vh);

    // console.log('Debug:', {
    //   elementTop,
    //   startPx,
    //   endPx,
    //   startPoint: this.startPoint,
    //   endPoint: this.endPoint,
    //   vh,
    // });

    const distance = endPx - startPx;
    if (distance === 0) return 1;

    const raw = (elementTop - startPx) / distance;
    return clamp(this.easing(raw));
  }

  private update = () => {
    if (this.locked) return;

    const now = performance.now();
    if (this.throttle && now - this.lastRun < this.throttle) return;
    this.lastRun = now;

    const p = this.progress();
    this.applyStyles(p);
    this.onUpdate?.(p);
    if (p === 1 && this.lock) this.locked = true;
  };

  private applyStyles(p: number) {
    const transforms: string[] = [];
    const direct: Record<string, string> = {};

    this.props.forEach(({ property, from, to, unit = '', easing }) => {
      const easedP = easing ? easing(p) : p;
      const value = mix(from, to, easedP) + unit;
      if (/^(translate|rotate|scale)/i.test(property))
        transforms.push(`${property}(${value})`);
      else direct[property] = value;
    });

    if (transforms.length) this.el.style.transform = transforms.join(' ');
    Object.entries(direct).forEach(([k, v]) => (this.el.style[k as any] = v));
  }
}
