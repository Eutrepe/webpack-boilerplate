import { BrowserInfo } from './types';

export const browserInfo = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  let matcher =
    userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  let tmpResult;

  if (/trident/i.test(matcher[1])) {
    tmpResult = /\brv[ :]+(\d+)/g.exec(userAgent) || [];

    return {
      name: 'ie',
      version: tmpResult[1] || '',
    };
  }

  if (matcher[1] === 'Chrome') {
    tmpResult = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
    if (tmpResult != null) {
      if (tmpResult[1] === 'OPR') {
        return {
          name: 'opera',
          version: tmpResult[2],
        };
      }
      if (tmpResult[1] === 'Edge') {
        return {
          name: 'edge',
          version: tmpResult[2],
        };
      }
    }
  }

  matcher = matcher[2] ? [matcher[1], matcher[2]] : [navigator.appName, navigator.appVersion, '-?'];
  tmpResult = userAgent.match(/version\/(\d+)/i);

  if (tmpResult != null) {
    matcher.splice(1, 1, tmpResult[1]);
  }
  return {
    name: matcher[0].toLowerCase(),
    version: matcher[1],
  };
};
