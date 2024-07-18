import '../../scss/style.scss';

import '../polyfiles';
import { domReady } from '../helpers';
import { initMobile } from '../mobile-nav';
import { Carousel } from '../plugins/carousel/carousel';
import { Counter } from '../plugins/counter/counter';

let BODY: HTMLElement | null = null;

domReady(() => {
  BODY = document.querySelector('body');
  if (!BODY) return;
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

function resolveAfter2Seconds() {
  return new Promise(resolve => {
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
      .then(lazy => {
        element.textContent = lazy.default;
      })
      .catch(err => {
        console.error(err);
      });

  return element;
};


const initSliders = () => {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
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
  counters.forEach(item => {

    new Counter(item as HTMLElement, {
      shouldRepeat: true,
      finishCallback: () => {
      },
      preRepeatCallback: () => {
      },

      targetValue: 4.8,
      speed: 3000,
      step: 0.1,
      easing: 'easeOutQuart',
      repeatDelay: 2000,
      initialDelay: 500,
    });
  });
};