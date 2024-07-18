export class Carousel {
  private container: HTMLElement;
  private carouselContent: HTMLElement;
  private items: HTMLElement[];
  private currentIndex: number;
  private direction: string;
  private interval: number;
  private animationType: string;
  private transitionDuration: string;
  private itemClass: string;
  private contentClass: string;
  private slideInterval: NodeJS.Timeout | null;

  constructor(container: HTMLElement, config: any = {}) {
      this.container = container;
      this.carouselContent = this.container.querySelector(
          `.${config.contentClass || 'carousel__content'}`
      ) as HTMLElement;
      this.items = Array.from(
          this.carouselContent.querySelectorAll(
              `.${config.itemClass || 'carousel__item'}`
          )
      ) as HTMLElement[];
      this.currentIndex = 0;
      this.direction = config.direction || 'ltr';
      this.interval = config.interval || 3000;
      this.animationType = config.animationType || 'slide';
      this.transitionDuration = config.transitionDuration || '0.5s';
      this.itemClass = config.itemClass || 'item';
      this.contentClass = config.contentClass || 'carousel-content';
      this.slideInterval = null;

      if (this.animationType === 'slide') {
          const firstItemClone = this.items[0].cloneNode(true) as HTMLElement;
          const lastItemClone = this.items[this.items.length - 1].cloneNode(true) as HTMLElement;
          this.carouselContent.appendChild(firstItemClone);
          this.carouselContent.insertBefore(
              lastItemClone,
              this.carouselContent.firstChild
          );
          this.items.push(firstItemClone);
          this.items.unshift(lastItemClone);
          this.currentIndex = 1;
      }

      this.initCarousel();
      this.setupVisibilityChange();
  }

  private initCarousel() {
      if (this.animationType === 'fade') {
          this.carouselContent.style.height = `${this.items[0].offsetHeight}px`;
          this.container.style.height = `${this.items[0].offsetHeight}px`;

          setTimeout(() => {
              this.items[this.currentIndex].style.opacity = '1';
              this.carouselContent.style.height = `${this.items[0].offsetHeight}px`;
              this.container.style.height = `${this.items[0].offsetHeight}px`;
          }, 100);

      } else if (this.animationType === 'slide') {
          this.carouselContent.style.display = 'flex';
          this.carouselContent.style.transition = `transform 0s`;
          this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;

          this.items.forEach(item => {
              item.style.flex = '0 0 100%';
          });
      }

      this.container.classList.add('is-init');
      this.container.classList.add(this.animationType);
      this.startCarousel();
  }

  private showNextItem() {
      if (this.animationType === 'slide') {
          this.currentIndex++;
          this.carouselContent.style.transition = `transform ${this.transitionDuration}`;
          this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;

          if (this.currentIndex >= this.items.length - 1) {
              setTimeout(() => {
                  this.currentIndex = 1;
                  this.carouselContent.style.transition = 'none';
                  this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                  setTimeout(() => {
                      this.carouselContent.style.transition = `transform ${this.transitionDuration}`;
                      this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                  }, 50);
              }, parseFloat(this.transitionDuration) * 1000);
          }
      } else if (this.animationType === 'fade') {
          const prevIndex = this.currentIndex;
          this.currentIndex = (this.currentIndex + 1) % this.items.length;
          this.fadeTransition(prevIndex, this.currentIndex);
      }
  }

  private showPreviousItem() {
      if (this.animationType === 'slide') {
          this.currentIndex--;
          this.carouselContent.style.transition = `transform ${this.transitionDuration}`;
          this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;

          if (this.currentIndex <= 0) {
              setTimeout(() => {
                  this.currentIndex = this.items.length - 2;
                  this.carouselContent.style.transition = 'none';
                  this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                  setTimeout(() => {
                      this.carouselContent.style.transition = `transform ${this.transitionDuration}`;
                      this.carouselContent.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                  }, 50);
              }, parseFloat(this.transitionDuration) * 1000);
          }
      } else if (this.animationType === 'fade') {
          const prevIndex = this.currentIndex;
          this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
          this.fadeTransition(prevIndex, this.currentIndex);
      }
  }

  private fadeTransition(prevIndex: number, nextIndex: number) {
      this.items[prevIndex].style.opacity = '0';
      this.items[nextIndex].style.opacity = '1';

      this.carouselContent.style.height = `${this.items[nextIndex].offsetHeight}px`;
      this.container.style.height = `${this.items[nextIndex].offsetHeight}px`;
  }

  private startCarousel() {
      this.slideInterval = setInterval(() => {
          if (this.direction === 'rtl') {
              this.showNextItem();
          } else {
              this.showPreviousItem();
          }
      }, this.interval);
  }

  private setupVisibilityChange() {
      document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
              if (this.slideInterval) {
                  clearInterval(this.slideInterval);
              }
          } else if (document.visibilityState === 'visible') {
              this.startCarousel();
          }
      });
  }
}
