export type EasingsType = {
    [key: string]: (t: number) => number;
  };
  
  
  export type ScrollToConfig = {
    duration?: number;
    offset?: number;
    easing?: string;
    onEnd?: () => void;
    onStart?: () => void;
    onStartParams?: [];
    onEndParams?: [];
    onBreak?: () => void;
    onBreakParams?: [];
  };
  