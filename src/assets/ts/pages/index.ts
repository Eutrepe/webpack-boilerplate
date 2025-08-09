import '../../scss/critical-homepage.scss';

import { domReady } from '../helpers';
import '../base';

domReady(() => {
  import('../../scss/homepage.scss').then(() => {});
});

window.addEventListener('load', () => {
  import('../lazy/lazyHomePage')
    .then((lazy) => {
      // console.info('loaded');
    })
    .catch((err) => {
      console.error(err);
    });
});
