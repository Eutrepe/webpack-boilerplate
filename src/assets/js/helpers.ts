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
        item.textContent = formatNumber(currentValue.toFixed(0));
      } else {
        item.textContent = formatNumber(currentValue.toFixed(1));
      }
    }, speed / (targetValue / step));
  });
}


function formatNumber (num: number | string) {
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