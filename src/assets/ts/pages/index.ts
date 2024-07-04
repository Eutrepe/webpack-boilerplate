import '../../scss/style.scss';

import '../polyfiles';
import { domReady } from '../helpers';
import { initMobile } from '../mobile-nav';

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



