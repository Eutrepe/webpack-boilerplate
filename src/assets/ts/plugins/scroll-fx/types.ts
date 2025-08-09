export type RangePoint = 'enter' | 'center' | 'exit' | number | string;

export interface FxProp {
  property: string;
  from: number;
  to: number;
  unit?: string;
  easing?: EasingFn;
}

export type ScrollFxOptions = {
  el: HTMLElement | string;
  props: FxProp[];
  range?: {
    start?: RangePoint;
    end?: RangePoint;
  };
  easing?: EasingFn;
  lock?: boolean;
  throttle?: number;
  onUpdate?: (progress: number) => void;
};

export type EasingFn = (t: number) => number;
