import '../scss/critical-base.scss';

import { domReady } from './helpers';
import { DropdownController } from './plugins/dropdown/dropdown';
import './navbar';

let BODY: HTMLElement | null = null;

domReady(() => {
  BODY = document.querySelector('body');
  if (!BODY) return;

  document
    .querySelectorAll<HTMLElement>('.navbar')
    .forEach((ul) => new DropdownController(ul));

  import('../scss/base.scss').then(() => {});
});

window.addEventListener('load', () => {
  if (!BODY) return;

  import('./lazy/LazyBase')
    .then((lazy) => {
      // console.info('loaded');
    })
    .catch((err) => {
      console.error(err);
    });

  BODY.style.opacity = '1';
  BODY.classList.remove('no-animation');
});
