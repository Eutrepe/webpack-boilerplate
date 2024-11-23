import '../../scss/critical.scss';

// Dynamicznie importuj niekrytyczne style
import(/* webpackChunkName: "styles" */ '../../scss/style.scss').then(() => {
  // Style zostały załadowane
});

import '../polyfiles';
import { domReady, throttle } from '../helpers';
import { initMobile } from '../mobile-nav';
import { Carousel } from '../plugins/carousel/carousel';
import { Counter } from '../plugins/counter/counter';

import Glide from '@glidejs/glide';

let BODY: HTMLElement | null = null;

domReady(() => {
  BODY = document.querySelector('body');
  if (!BODY) return;

  initSlider();
});

window.addEventListener('load', () => {
  if (!BODY) return;

  initMobile(BODY);

  BODY.style.opacity = '1';
  BODY.classList.remove('no-animation');

  if (BODY) BODY.append(testDynamic());

  initSliders();
  initCounters();
});

const buttons = document.querySelectorAll('button');

buttons.forEach((button: HTMLElement) => {
  button.addEventListener('click', (event: Event) => {
    console.log(event.target);
  });
});

function initSlider(): void {
  const slider: HTMLElement | null = document.querySelector(
    '[data-glide-slider]',
  );
  const conf: any = {
    type: 'carousel',
    perView: 1,
  };

  if (!slider) return;

  const slidesNumber: number = slider.querySelectorAll(
    '.glide__slides > li',
  ).length;
  const bullets = document.querySelectorAll('[data-glide-welcome-bullet]');

  const updateSliderStatus = throttle(() => {
    checkGlideResize(glide, slider, slidesNumber);
  }, 500);

  const glide = new Glide(slider, conf);
  glide.on('resize', () => {
    updateSliderStatus();
  });

  // Automated height on Carousel build
  glide.on('build.after', function () {
    glideHandleHeight(slider);
  });

  // Automated height on Carousel change
  glide.on('run.after', function () {
    glideHandleHeight(slider);
  });

  // glide.on('run.after', () => {
  //   bullets.forEach((bullet) => {
  //     const target = bullet.getAttribute('data-glide-welcome-bullet');

  //     if (target === `=${glide.index}`) {
  //       bullet.classList.add('is-active');
  //     } else {
  //       bullet.classList.remove('is-active');
  //     }
  //   });
  // });

  glide.mount();
  checkGlideResize(glide, slider, slidesNumber);

  bullets.forEach((bullet) => {
    bullet.addEventListener('click', (event: Event) => {
      event.preventDefault();

      const target = bullet.getAttribute('data-glide-welcome-bullet');
      if (!target) return;

      glide.go(target);
    });
  });
}

function resolveAfter2Seconds() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolvedTS');
    }, 2000);
  });
}

async function asyncCall() {
  console.log('callingTS');
  const result = await resolveAfter2Seconds();
  console.log(result);
}

asyncCall();

const testDynamic = (text = 'Hello world'): HTMLElement => {
  const element = document.createElement('div');

  element.className = 'rounded bg-red-100 border max-w-md m-4 p-4';
  element.innerHTML = text;
  element.onclick = () =>
    import('./lazy')
      .then((lazy) => {
        element.textContent = lazy.default;
      })
      .catch((err) => {
        console.error(err);
      });

  return element;
};

const initSliders = () => {
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const animationType = carousel.getAttribute('data-carousel') || 'slide';
    const interval = carousel.getAttribute('data-interval') || '3000';

    const config = {
      direction: 'ltr', // 'ltr' lub 'rtl'
      interval: parseInt(interval), // Czas w milisekundach
      animationType: animationType, // 'slide' lub 'fade'
      transitionDuration: '0.5s', // Czas przejścia animacji
    };

    new Carousel(carousel as HTMLElement, config);
  });
};

const initCounters = () => {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach((item) => {
    new Counter(item as HTMLElement, {
      shouldRepeat: true,
      finishCallback: () => {},
      preRepeatCallback: () => {},

      targetValue: 4.8,
      speed: 3000,
      step: 0.1,
      easing: 'easeOutQuart',
      repeatDelay: 2000,
      initialDelay: 500,
    });
  });
};

function checkGlideResize(
  glide: any,
  glideEl: HTMLElement,
  length: number,
): void {
  if (length <= glide.settings.perView) {
    // glide.update({ startAt: 0 }).disable();
    glide.disable();
    glideEl.classList.add('is-disabled');
  } else {
    glide.enable();
    glideEl.classList.remove('is-disabled');
  }
}

function glideHandleHeight(glideEl: HTMLElement) {
  const activeSlide: HTMLElement | null = glideEl.querySelector(
    '.glide__slide--active',
  );
  const activeSlideHeight = activeSlide ? activeSlide.offsetHeight : 0;

  const glideTrack: HTMLElement | null = glideEl.querySelector('.glide__track');
  const glideTrackHeight = glideTrack ? glideTrack.offsetHeight : 0;

  if (glideTrack && activeSlideHeight !== glideTrackHeight) {
    glideTrack.style.height = `${activeSlideHeight}px`;
  }
}
