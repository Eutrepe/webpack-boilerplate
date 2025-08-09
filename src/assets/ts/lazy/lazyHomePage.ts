import { FrameAnimation } from '../plugins/frameAnimation/frameAnimations';

setTimeout(() => {
  setTimeout(() => {
    initSliders();
  }, 1000);

  FrameAnimation.boot();
}, 1);

function initSliders() {
  const sliders = document.querySelectorAll<HTMLElement>(
    '[data-marquee-slider]',
  );

  sliders.forEach((slider) => {
    const track = slider.querySelector<HTMLElement>(
      '[data-marquee-slider-track]',
    );
    if (!track) return;

    const trackWidth = track.scrollWidth + 'px';
    track.style.setProperty('--width', trackWidth);

    const originals = Array.from(track.children) as HTMLElement[];

    // duplikuj dokładnie raz (tak jak masz)
    originals.forEach((li) => {
      const clone = li.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    originals.forEach((li) => {
      const clone = li.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });
}
