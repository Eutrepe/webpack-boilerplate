import { IntersectionObserveConfig } from './types';

export const initObserver = (
  element: HTMLElement,
  activeClass: string,
  invokeOnce: boolean,
  removeClassAfterLeaving: boolean,
  settings: IntersectionObserveConfig,
  onActive: any,
  onUnactive: any,
): void => {
  let wasActivated = false;

  const observer = new IntersectionObserver(
    (entries: Array<IntersectionObserverEntry>) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          if (onActive && typeof onActive === 'function') {
            onActive();
          }

          entry.target.classList.add(activeClass);

          wasActivated = true;

          if (
            invokeOnce &&
            entry.target.classList.contains(activeClass) &&
            observer
          ) {
            observer.unobserve(element);
          }
        } else {
          if (removeClassAfterLeaving) {
            entry.target.classList.remove(activeClass);
          }

          if (wasActivated && onUnactive && typeof onUnactive === 'function') {
            onUnactive();
          }
        }
      });
    },
    settings,
  );

  observer.observe(element);
};
