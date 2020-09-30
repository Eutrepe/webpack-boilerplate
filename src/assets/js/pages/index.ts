import '../../scss/style.scss';

import * as $ from 'jquery';

$(() => {
  console.log('ready');
});

const el = {
  aaa: 11,
};

const b = {
  ...el,
  www: 888,
};

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
  // expected output: "resolved"
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

document.querySelector('body')!.append(testDynamic());
