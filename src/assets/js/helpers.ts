import { ScrollTo } from './plugins/scroll-to/scroll-to';

export const domReady = (fn: () => void): void => {
  {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
};

export const removeElementContent = (el: HTMLElement): void => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};

export const scrollToTargetAdjusted = (event: Event | null, target: string, offset = 0): boolean => {
  const element = document.getElementById(target);

  if (!element) {
    return true;
  }

  if (event) {
    event.preventDefault();
  }

  const s = ScrollTo.getInstance();

  s.scrollTo(element, {
    duration: 500,
    offset: offset,
    easing: 'easeOutQuad',
  });

  return false;
};


export const clearClassFromElementList = (elementsList: NodeListOf<Element>, className: string): void => {
  elementsList.forEach((element: Element) => {
    element.classList.remove(className);
  });
}


const isInt = (n: number) => Math.floor(n) === n;

export const initCounters = (wrapper: Element): void => {

  const counters: NodeListOf < Element > = wrapper.querySelectorAll('[data-counter]');
  counters.forEach((item: Element) => {
    const targetAttr = item.getAttribute('data-counter') || '100';
    const speedAttr = item.getAttribute('data-counter-speed') || '2000';
    const stepAttr = item.getAttribute('data-counter-step') || '1';

    const targetValue = parseFloat(targetAttr);
    const speed = parseFloat(speedAttr);
    const step = parseFloat(stepAttr);

    let isIntegerNumber = isInt(targetValue) && isInt(step);

    let currentValue = 0;

    const interval = setInterval(() => {

      if (currentValue + step >= targetValue) {
        currentValue = targetValue;
        clearInterval(interval);
      } else {
        currentValue += step;
      }

      if (isIntegerNumber) {
        item.textContent = formatNumberThousand(currentValue.toFixed(0));
      } else {
        item.textContent = formatNumberThousand(currentValue.toFixed(1));
      }
    }, speed / (targetValue / step));
  });
}


function formatNumberThousand (num: number | string) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}


export const hideLoader = () => {
  const loader = document.querySelector('[data-loader]');

  if (loader) {
    loader.classList.add('is-hidden');
  }
}

export const loadHtmlTemplate = (templateId: string, callback: ((cloneEl: HTMLTemplateElement) => void)) => {

  if ('content' in document.createElement('template')) {
    const template: HTMLTemplateElement | null = document.querySelector(templateId);

    if (template) {
      const clone = template.content.cloneNode(true);

      if (typeof callback === 'function') {
        callback(clone as HTMLTemplateElement);
      }
    }

  } else {
    console.info('Your browser dont support HTML Template');
  }
}

export const cutTextTo = (text: string, length: number): string =>  {
  var cleanText = text.replace(/\s\s+/g, ' ');
  cleanText = cleanText.replace(/\s+([,|.])/g, '$1');
  cleanText = cleanText.replace(/([,|.])(\w+)/g, '$1 $2');

  if (0 === length || !length || cleanText.length <= length) {
    return cleanText;
  }

  var result = cleanText.substring(0, length);
  var lastSpaceIndex = result.lastIndexOf(' ');

  if (lastSpaceIndex > -1) {
    result = result.substring(0, lastSpaceIndex);
  }

  result += '...';

  return result;
}


export const fetchGlobalData = async (url: string): Promise<Response> => {
  let data = null;

  try {
    const response = await fetch(url); 
    data = await response.json();
  } catch (err) {
    console.error(err)
    throw new Error('Bad URL');
  }

  hideLoader();
  return data;
}

export const getCoords = (elem: HTMLElement) => { // crossbrowser version
  const box = elem.getBoundingClientRect();

  const body = document.body;
  const docEl = document.documentElement;

  const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const clientLeft = docEl.clientLeft || body.clientLeft || 0;

  const top  = box.top +  scrollTop - clientTop;
  const left = box.left + scrollLeft - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
}


export const setCookie = (cname: string, cvalue: string, exdays: number): void => {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const eraseCookie = (name: string): void => {   
  document.cookie = name+'=; Max-Age=-99999999;';  
}

export const getCookie = (cname: string): string => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export const setQueryParams = (name: string, value: string): void => {
  if ('URLSearchParams' in window) {
    var searchParams = new URLSearchParams(window.location.search)
    searchParams.set(name, value);
    var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;
    history.pushState(null, '', newRelativePathQuery);
  }
}


export const deleteQueryParams = (name: string): void => {
  if ('URLSearchParams' in window) {
    var searchParams = new URLSearchParams(window.location.search)
    searchParams.delete(name);
    var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;
    history.pushState(null, '', newRelativePathQuery);
  }
}




export const getQueryParams = (name: string): string => {
  if ('URLSearchParams' in window) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(name);
    if (param) {
      return param;
    }
    return ''; 
  }

  return '';
}


export const debounce = (cb: Function, delay: number = 1000): Function => {
  let timeout: NodeJS.Timeout;

  return (...args: string[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  }
}

export const throttle = (cb: Function, delay: number = 1000): Function => {
  let shouldWait = false;
  let waitingArgs: string[] | null = null;

  const timeoutFunc = () => {
    if (waitingArgs == null) {
      shouldWait = false;
    } else {
      cb(...waitingArgs);
      waitingArgs = null;
      setTimeout(timeoutFunc, delay);
    }
  }

  return (...args: string[]) => {
    if (shouldWait) {
      waitingArgs = args;
      return;
    }

    cb(...args);
    shouldWait = true;

    setTimeout(timeoutFunc, delay);
  }
}


export function randomNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


export function sleep<T>(duration: number): Promise<T> {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  })
}


export function memoize(cb: Function) {
  const cache = new Map();

  return (...args: any) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    const result = cb(...args);
    cache.set(key, result);
    return result;
  }
}


export function sample<T>(array: Array<T>): T {
  return array[randomNumberBetween(0, array.length - 1)];
}


export type ANY_OBJECT = {
  [key: string| number]: any;
}
export function pluck<T extends ANY_OBJECT, K>(array: Array<T>, key: string): Array<K> {
  return array.map(element => element[key]);
}


export function groupBy<T extends ANY_OBJECT>(array: Array<T>, key: string) {
  return array.reduce((group: ANY_OBJECT, element) => {
    const keyValue = element[key];
    return { ...group, [keyValue]: [...(group[keyValue] ?? []), element] };
  }, {});
}


const CURRENCY_FORMATTER = new Intl.NumberFormat(undefined, {
  currency: 'PLN',
  style: 'currency',
})
export function formatCurrency(number: number): string {
  return CURRENCY_FORMATTER.format(number);
}


const NUMBER_FORMATTER = new Intl.NumberFormat(undefined)
export function formatNumber(number: number): string {
  return NUMBER_FORMATTER.format(number);
}

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  notation: 'compact',
})
export function formatCompactNumber(number: number): string {
  return COMPACT_NUMBER_FORMATTER.format(number)
}


const DIVISIONS: Array<{amount: number; name: Intl.RelativeTimeFormatUnit}> = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' },
]
const RELATIVE_DATE_FORMATTER = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})
export function formatRelativeDate(toDate: number, fromDate = new Date()): string | undefined {
  let duration = (toDate - fromDate.getTime()) / 1000;

  for (let i = 0; i <= DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_DATE_FORMATTER.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}

