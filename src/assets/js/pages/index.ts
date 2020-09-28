import '../../scss/style.scss';

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
