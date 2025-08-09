// bubbles-plugin.ts — lekki efekt tła z animowanymi bąbelkami
// =========================================================
//  v1.5.2 – pozycjonowanie canvas w kontenerze + świeży rect w ruchu myszy
// ---------------------------------------------------------
//  Zmiany vs 1.5.1:
//    - Jeśli target ≠ body i ma `position: static`, nadajemy `position: relative` (inaczej absolute canvas
//      może "odpłynąć" do viewportu). Canvas trzyma się kontenera.
//    - `canvas.style.width/height = 100%` + `inset: 0` — stabilny box w CSS.
//    - `handleMove()` wywołuje `updateRect()` na początku — rect jest aktualny nawet przy przesunięciach layoutu
//      bez resize/scroll (np. lazy-load obrazków, font-swap).
//    - Reszta bez zmian: cache sprite'ów, recykling, DPR, fade.
//
//  Przykład (ES Module / bundler):
//      import { attachBubbles } from './bubbles-plugin';
//      attachBubbles('#hero', {
//        spawnInterval: 80,
//        maxBubbles:    0,
//        speed:         1.3,
//        minRadius:     4,
//        maxRadius:    10,
//        cursorRadius: 70,
//        cursorForce:  3,
//        fadeOut:      true,
//        fadeDistance: 60,
//        useSpriteCache: true,
//        recycleOffscreen: true,
//      });
// ---------------------------------------------------------
//  API
//  ---
//  attachBubbles(target?: string | HTMLElement, options?: BubblesOptions): BubblesInstance
//
//  BubblesInstance {
//    destroy(): void;         // zatrzymuje animację i usuwa canvas
//    canvas: HTMLCanvasElement
//  }

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export interface BubblesOptions {
  /** Odstęp między pojawianiem się kolejnych bąbelków (ms). */
  spawnInterval?: number;
  /** Limit aktywnych bąbelków (0 = bez limitu *zewnętrznego*; z recyklingiem stosowany jest auto-limit). */
  maxBubbles?: number;
  /** Mnożnik prędkości unoszenia (1 = domyślne). */
  speed?: number;
  /** Minimalny promień bąbelka (px). */
  minRadius?: number;
  /** Maksymalny promień bąbelka (px). */
  maxRadius?: number;
  /** Zasięg wpływu kursora (px). */
  cursorRadius?: number;
  /** Siła odpychania kursora (mnożnik). */
  cursorForce?: number;
  /** Czy włączać wygaszanie przy górnej krawędzi? */
  fadeOut?: boolean;
  /** Dystans wygaszania (px) od górnej krawędzi. */
  fadeDistance?: number;
  /** Użyj cache sprite'ów (offscreen canvas) dla rysowania bąbelków. */
  useSpriteCache?: boolean;
  /** Krok (px) do zaokrąglania promienia przy kluczu cache. */
  spriteCacheStep?: number;
  /** Recykling elementów poza ekranem (zamiast usuwać – reset na dół). */
  recycleOffscreen?: boolean;
  /** Czynnik auto-limit dla recyklingu przy maxBubbles=0: max≈(w*h)/autoMaxFactor, 50..400. */
  autoMaxFactor?: number;
}

export interface BubblesInstance {
  destroy(): void;
  canvas: HTMLCanvasElement;
}

type Target = string | HTMLElement;

/**
 * Główna funkcja pluginu — tworzy canvas, startuje animację i zwraca uchwyt.
 * @param target   Selektor CSS lub element, do którego zostanie wstawiony <canvas>.
 * @param options  Parametry konfiguracyjne – liczebność, prędkość, rozmiar, zasięg itp.
 */
export function attachBubbles(
  target: Target = document.body,
  options: BubblesOptions = {},
): BubblesInstance {
  // ---------------------------------------------------------
  //  Mapowanie argumentów + wartości domyślne
  // ---------------------------------------------------------
  const {
    spawnInterval = 150,
    maxBubbles = 0,
    speed = 1,
    minRadius = 2,
    maxRadius = 8,
    cursorRadius = 50,
    cursorForce = 2,
    fadeOut = false,
    fadeDistance = 80,
    useSpriteCache = true,
    spriteCacheStep = 1,
    recycleOffscreen = true,
    autoMaxFactor = 12000,
  } = options;

  const container: HTMLElement | null =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;

  if (!container) {
    throw new Error(`attachBubbles: target "${String(target)}" not found`);
  }

  // Jeśli kontener nie ma kontekstu pozycjonowania, nadaj go — inaczej "absolute" płynie do viewportu
  if (container !== document.body) {
    const cs = window.getComputedStyle(container);
    if (cs.position === 'static') {
      container.style.position = 'relative';
    }
  }

  // ---------------------------------------------------------
  //  Tworzenie canvasu
  // ---------------------------------------------------------
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.className = 'bubbles-canvas';
  canvas.style.position = container === document.body ? 'fixed' : 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error(
      'attachBubbles: 2D context is not supported in this browser',
    );
  }

  // DPR i wymiary w jednostkach CSS px
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let vw = 0; // width w px CSS
  let vh = 0; // height w px CSS

  // Cache rect płótna do przeliczania pozycji myszy
  let canvasRect = new DOMRect();
  const updateRect = (): void => {
    canvasRect = canvas.getBoundingClientRect();
  };

  // Auto-limit (ustawiony później w resize)
  let autoMax = 200;

  // Hoistowana funkcja (nie arrow), by uniknąć TDZ
  function recomputeAutoMax(): void {
    // Bezpieczny auto-limit przy recyklingu i maxBubbles=0, żeby tablica nie rosła w nieskończoność.
    // W praktyce ~50..400, zależnie od powierzchni płótna.
    const area = Math.max(1, vw * vh);
    autoMax = Math.max(50, Math.min(400, Math.round(area / autoMaxFactor)));
  }

  // ---------------------------------------------------------
  //  Cache sprite'ów (offscreen canvas per promień)
  //  (zdefiniowane PRZED resize, aby uniknąć TDZ przy pierwszym resize())
  // ---------------------------------------------------------
  class SpriteCache {
    private map = new Map<number, HTMLCanvasElement>();

    get(radius: number): HTMLCanvasElement {
      const key = Math.max(
        1,
        Math.round(radius / spriteCacheStep) * spriteCacheStep,
      );
      const cached = this.map.get(key);
      if (cached) return cached;
      const sprite = this.renderSprite(key);
      this.map.set(key, sprite);
      return sprite;
    }

    clear(): void {
      this.map.clear();
    }

    private renderSprite(r: number): HTMLCanvasElement {
      const sizeCss = Math.ceil(r * 2);
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(sizeCss * dpr));
      off.height = Math.max(1, Math.floor(sizeCss * dpr));
      const octx = off.getContext('2d')!;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rysujemy gradient w układzie px CSS
      octx.beginPath();
      octx.arc(r, r, r, 0, Math.PI * 2);
      const grad = octx.createRadialGradient(r, r, r * 0.1, r, r, r);
      grad.addColorStop(0, 'rgba(114,164,255,0.9)');
      grad.addColorStop(1, 'rgba(114,164,255,0)');
      octx.fillStyle = grad;
      octx.fill();

      return off;
    }
  }

  const spriteCache = new SpriteCache();

  // ---------------------------------------------------------
  //  Responsywność (z obsługą DPR)
  // ---------------------------------------------------------
  const resize = (): void => {
    if (container === document.body) {
      vw = window.innerWidth;
      vh = window.innerHeight;
    } else {
      vw = container.clientWidth;
      vh = container.clientHeight;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(vw * dpr));
    canvas.height = Math.max(1, Math.floor(vh * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // rysujemy w px CSS
    updateRect();
    recomputeAutoMax();
    spriteCache.clear(); // DPR się zmienił → trzeba prze-renderować sprite'y
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateRect, { passive: true });
  let ro: ResizeObserver | undefined;
  if (container !== document.body && 'ResizeObserver' in window) {
    ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(container);
  }
  resize();

  // ---------------------------------------------------------
  //  Obsługa myszy – globalny nasłuch (z rect-cache)
  // ---------------------------------------------------------
  const mouse = { x: 0, y: 0, active: false };

  const handleMove = (e: MouseEvent): void => {
    // Odśwież rect przy każdym ruchu — kontener mógł się przesunąć bez resize/scroll
    updateRect();
    const rect = canvasRect;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
  };

  window.addEventListener('mousemove', handleMove, { passive: true });

  // ---------------------------------------------------------
  //  Klasa Bubble
  // ---------------------------------------------------------
  class Bubble {
    radius: number = 0;
    x: number = 0;
    y: number = 0;
    speedVal: number = 0;
    drift: number = 0;
    baseAlpha: number = 1;

    constructor() {
      this.reset();
    }

    reset(): void {
      this.radius = Math.random() * (maxRadius - minRadius) + minRadius;
      this.x = Math.random() * vw;
      this.y = vh + this.radius; // startujemy tuż pod dołem
      this.speedVal = (Math.random() * 0.6 + 0.2) * speed; // ~0.2..0.8 px/frame * speed
      this.drift = (Math.random() - 0.5) * 0.2;
      this.baseAlpha = Math.random() * 0.4 + 0.4;
    }

    update(): void {
      this.y -= this.speedVal;
      this.x += this.drift;

      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const minDist = this.radius + cursorRadius;

        if (dist < minDist && dist > 0) {
          const force = ((minDist - dist) / minDist) * cursorForce;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }
      }
    }

    draw(): void {
      if (!ctx) return;

      // Wyliczenie alpha z uwzględnieniem wygaszania
      let alpha = this.baseAlpha;
      if (fadeOut && this.y < fadeDistance) {
        alpha *= Math.max(0, this.y) / fadeDistance;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      if (useSpriteCache) {
        const sprite = spriteCache.get(this.radius);
        ctx.drawImage(
          sprite,
          this.x - this.radius,
          this.y - this.radius,
          this.radius * 2,
          this.radius * 2,
        );
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          this.x,
          this.y,
          this.radius * 0.1,
          this.x,
          this.y,
          this.radius,
        );
        grad.addColorStop(0, 'rgba(114,164,255,0.9)');
        grad.addColorStop(1, 'rgba(114,164,255,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ---------------------------------------------------------
  //  Pętla animacji + logika spawnu/recyklingu
  // ---------------------------------------------------------
  const bubbles: Bubble[] = [];
  let lastSpawn = 0;
  let raf = 0;

  const animate = (ts: number): void => {
    ctx.clearRect(0, 0, vw, vh);

    // Wyznacz efektywny limit liczby bąbelków
    const cap = recycleOffscreen && maxBubbles === 0 ? autoMax : maxBubbles;

    if (ts - lastSpawn > spawnInterval && (cap === 0 || bubbles.length < cap)) {
      bubbles.push(new Bubble());
      lastSpawn = ts;
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.update();
      b.draw();

      const offTop = b.y + b.radius < 0;
      const offLeft = b.x + b.radius < 0;
      const offRight = b.x - b.radius > vw;

      if (offTop || offLeft || offRight) {
        if (recycleOffscreen) {
          b.reset(); // przenieś na "początek" — start na dole
        } else {
          bubbles.splice(i, 1); // stara logika – usuń
        }
      }
    }

    raf = requestAnimationFrame(animate);
  };

  raf = requestAnimationFrame(animate);

  // ---------------------------------------------------------
  //  API destroy()
  // ---------------------------------------------------------
  const destroy = (): void => {
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', updateRect);
    if (ro) ro.disconnect();
    container.removeChild(canvas);
    spriteCache.clear();
  };

  return { destroy, canvas };
}
