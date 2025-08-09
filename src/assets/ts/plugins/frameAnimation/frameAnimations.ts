import { Corner, FrameOptions } from './types';

export class FrameAnimation {
  /* ---------------- pola prywatne ---------------- */
  private box: HTMLElement;
  private isAnimating = false;
  private animationId: number | null = null;

  private currentCorner = 0;
  private speed: number;
  private offsetX: number;
  private offsetY: number;

  private corners: Corner[] = [];

  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;

  /* ---------------- konstruktor ---------------- */
  constructor(element: HTMLElement, opts: FrameOptions = {}) {
    this.box = element;
    this.speed = opts.speed ?? (Number(element.dataset.speed) || 1.5);
    this.offsetX = opts.offsetX ?? (Number(element.dataset.offsetX) || 60);
    this.offsetY = opts.offsetY ?? (Number(element.dataset.offsetY) || 60);

    this.init();
  }

  /* ---------------- inicjalizacja ---------------- */
  private init(): void {
    this.updateCorners();
    this.setInitialPosition();
    this.startAnimation();

    window.addEventListener('resize', () => {
      this.updateCorners();
      this.setInitialPosition();
    });
  }

  /* ---------------- rogi prostokąta ---------------- */
  private updateCorners(): void {
    const { width, height } = this.box.getBoundingClientRect();
    this.corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
  }

  private setInitialPosition(): void {
    this.currentCorner = 0;
    this.currentX = this.corners[0].x;
    this.currentY = this.corners[0].y;
    this.setNextTarget();
    this.updatePosition();
  }

  private setNextTarget(): void {
    this.currentCorner = (this.currentCorner + 1) % this.corners.length;
    this.targetX = this.corners[this.currentCorner].x;
    this.targetY = this.corners[this.currentCorner].y;
  }

  private updatePosition(): void {
    this.box.style.setProperty('--dot-x', `${this.currentX - this.offsetX}px`);
    this.box.style.setProperty('--dot-y', `${this.currentY - this.offsetY}px`);
  }

  /* ---------------- animacja ---------------- */
  private animate = (): void => {
    if (!this.isAnimating) return;

    const dx = this.targetX - this.currentX;
    const dy = this.targetY - this.currentY;
    const dist = Math.hypot(dx, dy);

    if (dist <= this.speed) {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.setNextTarget();
    } else {
      this.currentX += (dx / dist) * this.speed;
      this.currentY += (dy / dist) * this.speed;
    }

    this.updatePosition();
    this.animationId = requestAnimationFrame(this.animate);
  };

  public startAnimation(): void {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  public stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /* ---------------- helper statyczny ---------------- */
  /** Inicjalizuje wszystkie elementy pasujące do selektora (domyślnie `.js-frame`) */
  static boot(selector = '[data-frame]'): void {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      new FrameAnimation(el);
    });
  }
}
