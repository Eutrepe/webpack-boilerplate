import easingsFunctions from './easing-functions';

interface CounterConfig {
  shouldRepeat?: boolean;
  finishCallback?: () => void;
  preInitStartCallback?: () => void;
  preInitCallback?: () => void;
  preRepeatCallback?: () => void;
  targetValue?: number | string;
  speed?: number | string;
  step?: number | string;
  repeatDelay?: number | string;
  initialDelay?: number | string;
  easing?: string;
}

export class Counter {
  private element: HTMLElement;
  private shouldRepeat: boolean;
  private finishCallback: (() => void) | null;
  private preInitStartCallback: (() => void) | null;
  private preInitCallback: (() => void) | null;
  private preRepeatCallback: (() => void) | null;
  private targetValue: number;
  private speed: number;
  private step: number;
  private repeatDelay: number;
  private initialDelay: number;
  private isIntegerNumber: boolean;
  private easing: string;

  constructor(element: HTMLElement, config: CounterConfig = {}) {
    this.element = element;
    this.shouldRepeat = config.shouldRepeat || false;
    this.finishCallback = config.finishCallback || null;
    this.preInitStartCallback = config.preInitStartCallback || null;
    this.preInitCallback = config.preInitCallback || null;
    this.preRepeatCallback = config.preRepeatCallback || null;
    this.targetValue = parseFloat((config.targetValue as string) || '100');
    this.speed = parseFloat((config.speed as string) || '2000');
    this.step = parseFloat((config.step as string) || '1');
    this.repeatDelay = parseFloat((config.repeatDelay as string) || '3000');
    this.initialDelay = parseFloat((config.initialDelay as string) || '0');
    this.isIntegerNumber =
      this.isInt(this.targetValue) && this.isInt(this.step);
    this.easing = config.easing || 'linear';

    this.initCounter();
  }

  private isInt(n: number): boolean {
    return Math.floor(n) === n;
  }

  private formatNumberThousand(num: number): string {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }

  private getEasingFunction(easing: string): (progress: number) => number {
    return easingsFunctions[easing];
  }

  private updateCounter(startTime: number) {
    const duration = this.speed;
    let currentValue = 0;
    const startValue = 0;
    const targetValue = this.targetValue;
    const easingFunction = this.getEasingFunction(this.easing);

    const animate = (currentTime: number) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = easingFunction(progress);

      currentValue = startValue + easedProgress * (targetValue - startValue);
      if (timeElapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        currentValue = targetValue;
        if (this.finishCallback) {
          this.finishCallback();
        }

        if (this.shouldRepeat) {
          setTimeout(() => {
            if (this.preRepeatCallback) {
              this.preRepeatCallback();
            }
            this.initCounter();
          }, this.repeatDelay);
        }
      }

      if (this.isIntegerNumber) {
        this.element.textContent = this.formatNumberThousand(
          parseFloat(currentValue.toFixed(0)),
        );
      } else {
        this.element.textContent = this.formatNumberThousand(
          parseFloat(currentValue.toFixed(1)),
        );
      }
    };

    requestAnimationFrame(animate);
  }

  private initCounter() {
    if (this.preInitCallback) {
      this.preInitCallback();
    }
    setTimeout(() => {
      if (this.preInitStartCallback) {
        this.preInitStartCallback();
      }
      this.updateCounter(performance.now());
    }, this.initialDelay);
  }
}
