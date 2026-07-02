/**
 * Lightbox — Full-screen image viewer
 * Click any image with [data-lightbox] to open it full-size.
 * Supports prev/next navigation and keyboard controls.
 */
(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!lightbox || !lightboxImg) return;

  let currentImages = [];
  let currentIndex = 0;

  /** Collect all sibling images from the same section/grid */
  function collectImages(clickedImg) {
    const parent = clickedImg.closest('.section-items-grid, .layout-grid, .social-slider, .case-study-gallery, .portfolio-section, .clients-marquee-container');
    if (!parent) return [clickedImg];

    const imgs = parent.querySelectorAll('[data-lightbox] img, .layout-cell img, .slider-img-wrap img, .gallery-cell img');
    return Array.from(imgs).filter(img => img.src && img.src !== '');
  }

  /** Open lightbox */
  function open(imgs, index) {
    currentImages = imgs;
    currentIndex = index;
    show(currentIndex);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /** Close lightbox */
  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Reset image after transition
    setTimeout(() => {
      lightboxImg.src = '';
    }, 350);
  }

  /** Show image at index */
  function show(index) {
    if (index < 0 || index >= currentImages.length) return;
    currentIndex = index;
    const img = currentImages[currentIndex];

    // Smooth transition: fade out then in
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = 'scale(0.9)';

    setTimeout(() => {
      lightboxImg.src = img.src || img.dataset.src || '';
      lightboxImg.alt = img.alt || '';
      lightboxTitle.textContent = img.alt || '';
      lightboxCounter.textContent = currentImages.length > 1
        ? `${currentIndex + 1} / ${currentImages.length}`
        : '';

      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';
    }, 150);

    // Show/hide arrows
    prevBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
  }

  /** Go to previous */
  function prev() {
    if (currentImages.length <= 1) return;
    const newIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    show(newIndex);
  }

  /** Go to next */
  function next() {
    if (currentImages.length <= 1) return;
    const newIndex = (currentIndex + 1) % currentImages.length;
    show(newIndex);
  }

  // ── Event Listeners ──

  // Click on any element with [data-lightbox]
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;

    const img = trigger.querySelector('img') || (trigger.tagName === 'IMG' ? trigger : null);
    if (!img || !img.src) return;

    e.preventDefault();
    e.stopPropagation();

    const images = collectImages(img);
    const index = images.indexOf(img);
    open(images, index >= 0 ? index : 0);
  });

  // Also handle direct image clicks in layout cells and gallery cells
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      const cell = e.target.closest('.layout-cell, .gallery-cell, .slider-img-wrap');
      if (cell && !e.target.closest('[data-lightbox]')) {
        e.preventDefault();
        e.stopPropagation();
        const images = collectImages(e.target);
        const index = images.indexOf(e.target);
        open(images, index >= 0 ? index : 0);
      }
    }
  });

  // Close button
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  // Click on backdrop (not on image or buttons)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      close();
    }
  });

  // Prev/Next buttons
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Touch swipe on lightbox
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) next();
      else prev();
    }
  }, { passive: true });

})();
