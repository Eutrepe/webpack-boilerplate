import '../../scss/style.scss';

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

const body = document.querySelector('body');

if (body) body.append(testDynamic());
