class ImageSlider {
  constructor(selector, options = {}) {
    this.root = document.querySelector(selector);
    if (!this.root) return;

    this.track = this.root.querySelector('.slider-track');
    this.dotsBox = this.root.querySelector('.slider-dots');
    this.prevBtn = this.root.querySelector('.slider-btn.prev');
    this.nextBtn = this.root.querySelector('.slider-btn.next');

    this.slides = Array.from(this.track.children); // real slides only
    this.total = this.slides.length;
    this.delay = options.delay ?? 5000;            // autoplay interval (ms)

    this.index = 1;             // position in the track (1 = first real slide)
    this.isAnimating = false;   // blocks clicks while a slide is moving
    this.timerId = null;        // autoplay timer
    this.safetyId = null;       // backup in case transitionend never fires
    this.dots = [];

    this.init();
  }

  get realIndex() {
    return (((this.index - 1) % this.total) + this.total) % this.total;
  }

  init() {
    this.cloneEdges();
    this.buildDots();
    this.bindEvents();
    this.jump();              // place first slide without animation
    this.updateDots();
    this.startAutoplay();
  }

  // Copy the last slide to the front and the first slide to the end
  cloneEdges() {
    const first = this.slides[0].cloneNode(true);
    const last = this.slides[this.total - 1].cloneNode(true);
    this.track.insertBefore(last, this.track.firstChild);
    this.track.appendChild(first);
  }

  buildDots() {
    for (let i = 0; i < this.total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      dot.addEventListener('click', () => {
        this.goTo(i + 1);
        this.restartAutoplay();
      });
      this.dotsBox.appendChild(dot);
      this.dots.push(dot);
    }
  }

  bindEvents() {
    this.prevBtn.addEventListener('click', () => {
      this.goTo(this.index - 1);
      this.restartAutoplay();
    });
    this.nextBtn.addEventListener('click', () => {
      this.goTo(this.index + 1);
      this.restartAutoplay();
    });
    this.track.addEventListener('transitionend', (e) => {
      if (e.target === this.track) this.onTransitionEnd();
    });
    this.root.addEventListener('mouseenter', () => this.stopAutoplay());
    this.root.addEventListener('mouseleave', () => this.startAutoplay());
  }

  move() {
    this.track.style.transform = 'translateX(-' + (this.index * 100) + '%)';
  }

  // Move to a position without animation
  jump() {
    this.track.classList.add('no-transition');
    this.move();
    void this.track.offsetHeight;   // force reflow
    this.track.classList.remove('no-transition');
  }

  goTo(i) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.index = i;
    this.move();
    this.updateDots();
    // backup: unlock even if transitionend does not fire
    this.safetyId = setTimeout(() => this.onTransitionEnd(), 800);
  }

  onTransitionEnd() {
    if (!this.isAnimating) return;
    clearTimeout(this.safetyId);
    if (this.index === 0) {
      this.index = this.total;       // from clone of last -> real last
      this.jump();
    } else if (this.index === this.total + 1) {
      this.index = 1;                // from clone of first -> real first
      this.jump();
    }
    this.isAnimating = false;
  }

  updateDots() {
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.realIndex);
    });
  }

  startAutoplay() {
    this.stopAutoplay();
    this.timerId = setInterval(() => this.goTo(this.index + 1), this.delay);
  }

  stopAutoplay() {
    clearInterval(this.timerId);
  }

  restartAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ImageSlider('#gallery .slider', { delay: 4000 });
});