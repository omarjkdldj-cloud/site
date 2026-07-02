/**
 * Omar Hamed Yousef — Portfolio Main Script
 * ──────────────────────────────────────────
 * Loads data from JSON files, renders UI, handles animations & interactions.
 */

(function () {
  'use strict';

  /* ─── DOM References ───────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const loadingScreen   = $('#loading-screen');
  const mainNav         = $('#main-nav');
  const navToggle       = $('#nav-toggle');
  const mobileMenu      = $('#mobile-menu');
  const sectionsContainer = $('#portfolio-sections');
  const contactForm     = $('#contact-form');
  const formSuccess     = $('#form-success');
  const backToTop       = $('#back-to-top');

  /* ─── State ────────────────────────────────────────────────── */
  let profileData    = null;
  let servicesData   = null;
  let portfolioData  = null;
  let countersAnimated = false;

  /* ─── Section definitions (ordered) ────────────────────────── */
  const DEFAULT_SECTIONS = [
    { id: 'visual-concepts', label: 'VISUAL CONCEPTS', order: 1 },
    { id: 'social-media',    label: 'SOCIAL MEDIA',    order: 2 },
    { id: 'layouts',         label: 'LAYOUTS',         order: 3 },
    { id: 'packaging',       label: 'PACKAGING',       order: 4 },
    { id: 'branding',        label: 'BRANDING',        order: 5 },
    { id: 'client-logos',    label: 'CLIENTS',          order: 6 },
    { id: 'ai-videos',       label: 'AI VIDEOS & ANIMATION', order: 7 }
  ];

  /* ═══════════════════════════════════════════════════════════════
     DATA LOADING — Fetch from JSON files
     ═══════════════════════════════════════════════════════════════ */

  async function loadData() {
    /* ── Always check localStorage FIRST — admin panel saves here ── */
    const savedPortfolio = localStorage.getItem('admin_portfolio');
    const savedProfile   = localStorage.getItem('admin_profile');
    const savedServices  = localStorage.getItem('admin_services');

    /* ── Load defaults from JSON or data.js ── */
    let defaults = null;
    try {
      const [profileRes, servicesRes, portfolioRes] = await Promise.all([
        fetch('data/profile.json'),
        fetch('data/services.json'),
        fetch('data/portfolio.json')
      ]);
      if (profileRes.ok && servicesRes.ok && portfolioRes.ok) {
        defaults = {
          profile: await profileRes.json(),
          services: await servicesRes.json(),
          portfolio: await portfolioRes.json()
        };
      }
    } catch (e) { /* ignore fetch errors */ }

    /* Fallback to window.PORTFOLIO_DATA if JSON fetch failed */
    if (!defaults && window.PORTFOLIO_DATA) {
      const d = window.PORTFOLIO_DATA;
      defaults = {
        profile: {
          name: d.profile.name, title: d.profile.title, bio: d.profile.bio,
          email: d.profile.email, phones: d.profile.phones, address: d.profile.address,
          stats: d.profile.stats, social: d.profile.social,
          experience: d.experience, education: d.education, skills: d.skills
        },
        services: d.services,
        portfolio: { sections: DEFAULT_SECTIONS, items: d.portfolio || [] }
      };
    }

    if (!defaults) {
      defaults = {
        profile: window.PORTFOLIO_DATA ? window.PORTFOLIO_DATA.profile : {},
        services: window.PORTFOLIO_DATA ? window.PORTFOLIO_DATA.services : [],
        portfolio: {
          sections: DEFAULT_SECTIONS,
          items: []
        }
      };
    }

    /* ── Apply localStorage overrides ── */
    profileData  = savedProfile  ? JSON.parse(savedProfile)  : defaults.profile;
    servicesData = savedServices ? JSON.parse(savedServices) : defaults.services;

    /* Portfolio: load from admin-data.json (deployed via Netlify) */
    let siteItems = null;
    try {
      const res = await fetch('data/admin-data.json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) siteItems = data;
      }
    } catch(e) {}

    if (siteItems) {
      portfolioData = {
        sections: defaults.portfolio.sections || DEFAULT_SECTIONS,
        items: siteItems
      };
    } else {
      portfolioData = defaults.portfolio;
    }

    /* Ensure sections exist */
    if (!portfolioData.sections) {
      portfolioData.sections = DEFAULT_SECTIONS;
    }

    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER FUNCTIONS
     ═══════════════════════════════════════════════════════════════ */

  /** About bio */
  function renderBio() {
    const bioEl = $('#about-bio');
    if (!bioEl || !profileData) return;
    const paragraphs = profileData.bio.split('\n\n');
    bioEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  /** Stats grid */
  function renderStats() {
    const grid = $('#stats-grid');
    if (!grid || !profileData) return;
    grid.innerHTML = profileData.stats.map(s => `
      <div class="stat-card">
        <div class="stat-number" data-target="${s.number}" data-suffix="${s.suffix}">0${s.suffix}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  }

  /** Skills chips */
  function renderSkills() {
    if (!profileData) return;
    const sw = $('#software-skills');
    const core = $('#core-skills');
    if (sw) {
      sw.innerHTML = profileData.skills.software.map(s =>
        `<span class="skill-chip software">${s}</span>`
      ).join('');
    }
    if (core) {
      core.innerHTML = profileData.skills.core.map(s =>
        `<span class="skill-chip">${s}</span>`
      ).join('');
    }
  }

  /** Experience timeline */
  function renderExperience() {
    const timeline = $('#experience-timeline');
    if (!timeline || !profileData) return;
    timeline.innerHTML = profileData.experience.map(exp => `
      <div class="timeline-item ${exp.current ? 'current' : ''} reveal">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <span class="timeline-period">${exp.period}</span>
          <h3 class="timeline-role">${exp.role}</h3>
          <p class="timeline-company">${exp.company}</p>
        </div>
      </div>
    `).join('');
  }

  /** Education */
  function renderEducation() {
    const info = $('#education-info');
    if (!info || !profileData) return;
    const ed = profileData.education;
    info.innerHTML = `
      <h4>${ed.institution}</h4>
      <p>${ed.degree} &middot; ${ed.period}</p>
    `;
  }

  /** Services grid */
  function renderServices() {
    const grid = $('#services-grid');
    if (!grid || !servicesData) return;
    grid.innerHTML = servicesData.map((svc, i) => `
      <div class="service-card reveal" style="transition-delay:${i * 0.08}s">
        <div class="service-icon-wrap">
          ${svc.icon.startsWith('fa') ? `<i class="${svc.icon}"></i>` : `<span class="service-emoji">${svc.icon}</span>`}
        </div>
        <h3 class="service-title">${svc.title}</h3>
        <p class="service-desc">${svc.description}</p>
      </div>
    `).join('');
  }

  /** Section label lookup */
  function getSectionLabel(sectionId) {
    if (!portfolioData) return sectionId;
    const sec = portfolioData.sections.find(s => s.id === sectionId);
    return sec ? sec.label : sectionId;
  }

  /* ═══════════════════════════════════════════════════════════════
     PORTFOLIO SECTIONS RENDERING
     ═══════════════════════════════════════════════════════════════ */

  /** Render all portfolio sections in order */
  function renderPortfolioSections() {
    if (!sectionsContainer || !portfolioData) return;

    const sections = (portfolioData.sections || DEFAULT_SECTIONS)
      .sort((a, b) => a.order - b.order);
    
    const items = portfolioData.items || [];

    // ── Render CLIENTS marquee separately (before portfolio heading) ──
    const clientsContainer = document.getElementById('clients-marquee-container');
    if (clientsContainer) {
      const clientItems = items.filter(item => (item.sectionId || item.category) === 'client-logos');
      if (clientItems.length > 0) {
        clientsContainer.innerHTML = `
          <div class="portfolio-section" id="section-client-logos">
            <div class="portfolio-section-inner">
              <h2 class="portfolio-section-title reveal">CLIENTS</h2>
              ${renderClientLogosMarquee(clientItems)}
            </div>
          </div>
        `;
      } else {
        clientsContainer.innerHTML = '';
      }
    }

    let html = '';

    sections.forEach(section => {
      // Skip client-logos — rendered separately above
      if (section.id === 'client-logos') return;

      const sectionItems = items.filter(item => {
        const itemSection = item.sectionId || item.category;
        return itemSection === section.id;
      });

      // Only render section if it has items
      if (sectionItems.length === 0) return;

      const isVideoSection = section.id === 'ai-videos';
      const isSocialMedia = section.id === 'social-media';
      const isLayouts = section.id === 'layouts';

      let contentHtml = '';
      if (isVideoSection) {
        contentHtml = renderVideoItems(sectionItems);
      } else if (isSocialMedia) {
        contentHtml = renderSocialMediaSlider(sectionItems);
      } else if (isLayouts) {
        contentHtml = renderLayoutSection(sectionItems);
      } else {
        contentHtml = renderSectionItems(sectionItems, section.id);
      }

      html += `
        <div class="portfolio-section" id="section-${section.id}">
          <div class="portfolio-section-inner">
            <h2 class="portfolio-section-title reveal">${section.label}</h2>
            ${contentHtml}
          </div>
        </div>
      `;
    });

    sectionsContainer.innerHTML = html;

    // Initialize sliders after rendering
    initSocialSliders();

    // Lazy-load newly rendered images
    observeLazyImages();
  }

  /** Render regular section items (grid + case studies) */
  function renderSectionItems(items, sectionId) {
    // Separate case studies (with artDirection) from regular items
    const caseStudies = items.filter(i => i.artDirection && hasArtDirectionContent(i.artDirection));
    const regularItems = items.filter(i => !i.artDirection || !hasArtDirectionContent(i.artDirection));

    let html = '';

    // Regular items in grid
    if (regularItems.length > 0) {
      html += `<div class="section-items-grid">`;
      html += regularItems.map(item => renderRegularItem(item)).join('');
      html += `</div>`;
    }

    // Case studies (full width)
    if (caseStudies.length > 0) {
      html += caseStudies.map(item => renderCaseStudy(item)).join('');
    }

    return html;
  }

  /** Check if art direction has actual content */
  function hasArtDirectionContent(ad) {
    if (!ad) return false;
    if (ad.sections && ad.sections.some(s => s.text && s.text.trim())) return true;
    return false;
  }

  /** Render a regular portfolio item */
  function renderRegularItem(item) {
    return `
      <div class="portfolio-item showing" data-lightbox
           data-id="${item.id}"
           data-section="${item.sectionId || item.category}">
        <div class="portfolio-img-wrap">
          <div class="img-placeholder"><i class="fas fa-image"></i></div>
          <img ${item.image && item.image.startsWith('data:') ? 'src' : 'data-src'}="${item.image}"
               alt="${item.title}"
               loading="lazy">
        </div>
        <div class="portfolio-overlay">
          <div class="portfolio-overlay-content">
            <h3>${item.title}</h3>
            <span>${getSectionLabel(item.sectionId || item.category)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /** Render a case study (art direction layout) */
  function renderCaseStudy(item) {
    const ad = item.artDirection;
    const sections = (ad.sections || [])
      .filter(s => s.text && s.text.trim()) // Only show sections with content
      .map(s => `
        <div class="case-study-section">
          <h4>${s.heading}</h4>
          <p>${s.text}</p>
        </div>
      `).join('');

    // Render logos — bigger, no frame, PNG
    const logos = item.logos || [];
    const logosHtml = logos.length > 0
      ? `<div class="case-study-logos">${logos.map(l => `<img src="${l.src}" alt="${l.alt || 'Logo'}">`).join('')}</div>`
      : '';

    // Art Direction header: title + logos
    const headerHtml = logos.length > 0
      ? `<div class="case-study-header">
           <h3 class="case-study-art-title">${ad.title || 'Art Direction'}</h3>
           ${logosHtml}
         </div>`
      : `<h3 class="case-study-art-title">${ad.title || 'Art Direction'}</h3>`;

    // Build image gallery based on layout type
    const imgs = item.images || [];
    const topImgs = imgs.filter(i => i.position === 'top');
    const heroImgs = imgs.filter(i => i.position === 'hero');

    const renderCell = (img) => `
      <div class="gallery-cell">
        <img src="${img.src}" alt="${item.title}" loading="lazy">
      </div>
    `;

    // Top row: thumbnails
    const topRow = topImgs.length > 0
      ? `<div class="gallery-row top">${topImgs.map(renderCell).join('')}</div>`
      : '';

    // Hero rows: each hero image gets its own row
    const heroRows = heroImgs.map(img =>
      `<div class="gallery-row hero">${renderCell(img)}</div>`
    ).join('');

    return `
      <div class="case-study showing" style="margin-top: 24px;"
           data-id="${item.id}"
           data-section="${item.sectionId || item.category}">
        <div class="case-study-text">
          ${headerHtml}
          ${sections}
        </div>
        <div class="case-study-gallery">
          ${topRow}
          ${heroRows}
        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     LAYOUTS SECTION — Multi-image project sections (2-9 images)
     ═══════════════════════════════════════════════════════════════ */

  /** Render layout items — each item is a section with 2-9 images */
  function renderLayoutSection(items) {
    return items.map(item => {
      // Collect all images: layoutImages array or fallback to single image
      const images = item.layoutImages || [];
      if (images.length === 0 && item.image) {
        images.push(item.image);
      }
      if (images.length === 0) return '';

      const count = images.length;
      const gridClass = 'layout-grid layout-grid-' + Math.min(count, 9);

      const imagesHtml = images.map((src, i) => `
        <div class="layout-cell" data-lightbox>
          <img src="${src}" alt="${item.title || 'Layout'} ${i + 1}" loading="lazy">
        </div>
      `).join('');

      return `
        <div class="layout-project" data-id="${item.id}">
          ${item.title ? `<h3 class="layout-project-title">${item.title}</h3>` : ''}
          <div class="${gridClass}">
            ${imagesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ═══════════════════════════════════════════════════════════════
     SOCIAL MEDIA SLIDER
     ═══════════════════════════════════════════════════════════════ */

  /** Render social media items as a slider/carousel */
  function renderSocialMediaSlider(items) {
    const slides = items.map((item, i) => {
      const imgSrc = item.image || '';
      return `
        <div class="slider-slide" data-index="${i}">
          <div class="slider-img-wrap">
            <img src="${imgSrc}" alt="${item.title}" loading="lazy">
          </div>
          ${item.title ? `<div class="slider-caption"><h4>${item.title}</h4></div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="social-slider" data-slider>
        <button class="slider-arrow slider-prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
        <div class="slider-viewport">
          <div class="slider-track">
            ${slides}
          </div>
        </div>
        <button class="slider-arrow slider-next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
        <div class="slider-dots"></div>
      </div>
    `;
  }

  /** Initialize all social media sliders */
  function initSocialSliders() {
    $$('[data-slider]').forEach(slider => {
      const track = slider.querySelector('.slider-track');
      const slides = $$('.slider-slide', slider);
      const prevBtn = slider.querySelector('.slider-prev');
      const nextBtn = slider.querySelector('.slider-next');
      const dotsContainer = slider.querySelector('.slider-dots');
      if (!slides.length) return;

      let currentIndex = 0;
      let slidesPerView = getSlidesPerView();
      const totalSlides = slides.length;

      function getSlidesPerView() {
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1024) return 3;
        return 4;
      }

      // Build dots
      function buildDots() {
        const maxIndex = Math.max(0, totalSlides - slidesPerView);
        let dotsHtml = '';
        for (let i = 0; i <= maxIndex; i++) {
          dotsHtml += `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></button>`;
        }
        dotsContainer.innerHTML = dotsHtml;
      }

      function goTo(index) {
        const maxIndex = Math.max(0, totalSlides - slidesPerView);
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        const slideWidth = 100 / slidesPerView;
        track.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
        // Update dots
        $$('.slider-dot', dotsContainer).forEach((d, i) => {
          d.classList.toggle('active', i === currentIndex);
        });
        // Update arrow visibility
        prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
        nextBtn.style.opacity = currentIndex >= maxIndex ? '0.3' : '1';
      }

      // Set slide widths
      function updateLayout() {
        slidesPerView = getSlidesPerView();
        const slideWidth = 100 / slidesPerView;
        slides.forEach(s => s.style.flex = `0 0 ${slideWidth}%`);
        buildDots();
        goTo(Math.min(currentIndex, Math.max(0, totalSlides - slidesPerView)));
      }

      updateLayout();

      prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
      nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('[data-dot]');
        if (dot) goTo(parseInt(dot.dataset.dot, 10));
      });

      // Touch/swipe support
      let startX = 0, startY = 0, isDragging = false;
      track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
      }, { passive: true });
      track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = startX - e.changedTouches[0].clientX;
        const diffY = startY - e.changedTouches[0].clientY;
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          if (diffX > 0) goTo(currentIndex + 1);
          else goTo(currentIndex - 1);
        }
      }, { passive: true });

      // Resize handler
      window.addEventListener('resize', () => {
        updateLayout();
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CLIENT LOGOS MARQUEE
     ═══════════════════════════════════════════════════════════════ */

  /** Render client logos as auto-scrolling marquee */
  function renderClientLogosMarquee(items) {
    // Duplicate items for seamless infinite loop
    const logosHtml = items.map(item => `
      <div class="marquee-logo">
        <img src="${item.image || ''}" alt="${item.title || 'Client'}" loading="lazy">
      </div>
    `).join('');

    return `
      <div class="logos-marquee">
        <div class="marquee-track">
          ${logosHtml}
          ${logosHtml}
        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════════════════════════════
     VIDEO CARDS
     ═══════════════════════════════════════════════════════════════ */

  /** Render video items for AI Videos & Animation section */
  function renderVideoItems(items) {
    let html = `<div class="video-items-grid">`;
    
    html += items.map(item => {
      const thumbnail = item.videoThumbnail || item.image || '';
      const videoUrl = item.videoUrl || '#';
      // Filter out empty frame entries
      const frames = (item.videoFrames || []).filter(f => f && f.trim && f.trim() !== '');

      let framesHtml = '';
      if (frames.length > 0) {
        framesHtml = `
          <div class="video-frames-strip">
            ${frames.map(f => `
              <div class="video-frame">
                <img src="${f}" alt="Frame" loading="lazy">
              </div>
            `).join('')}
          </div>
        `;
      }

      return `
        <div class="video-card" data-id="${item.id}">
          <a href="${videoUrl}" target="_blank" rel="noopener" class="video-thumbnail-wrap">
            ${thumbnail ? `<img src="${thumbnail}" alt="${item.title}" loading="lazy">` : '<div class="video-no-thumb"><i class="fas fa-video"></i></div>'}
            <div class="video-play-btn">
              <i class="fas fa-play"></i>
            </div>
          </a>
          <div class="video-card-info">
            <h4>${item.title}</h4>
            ${item.description ? `<p>${item.description}</p>` : ''}
          </div>
          ${framesHtml}
        </div>
      `;
    }).join('');

    html += `</div>`;
    return html;
  }

  /* ═══════════════════════════════════════════════════════════════
     HERO TYPING EFFECT
     ═══════════════════════════════════════════════════════════════ */

  function initTypingEffect() {
    const taglineEl = $('#hero-tagline');
    if (!taglineEl) return;

    const phrases = [
      'Crafting Visual Excellence',
      'Building Brand Identities',
      'Creating AI-Powered Content',
      'Designing Event Experiences',
      'Managing Social Media Brands'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function type() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        taglineEl.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 40;
      } else {
        taglineEl.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 80;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        typingSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 400; // Pause before next phrase
      }

      setTimeout(type, typingSpeed);
    }

    setTimeout(type, 1200); // Start after hero animations
  }

  /* ═══════════════════════════════════════════════════════════════
     HERO PARTICLES
     ═══════════════════════════════════════════════════════════════ */

  function initParticles() {
    const canvas = $('#hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 15000), 80);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 92, 231, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(108, 92, 231, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(drawParticles);
    }

    // Pause when not visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!animationId) drawParticles();
        } else {
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
        }
      });
    });

    resize();
    createParticles();
    drawParticles();
    observer.observe(canvas);

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     INTERSECTION OBSERVER — Scroll Animations
     ═══════════════════════════════════════════════════════════════ */

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════
     LAZY IMAGE LOADING
     ═══════════════════════════════════════════════════════════════ */

  function observeLazyImages() {
    // Handle lazy images (with data-src)
    const imgObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) return;

        img.src = src;
        img.onload = () => {
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          // Hide placeholder
          const placeholder = img.previousElementSibling;
          if (placeholder && placeholder.classList.contains('img-placeholder')) {
            placeholder.style.opacity = '0';
          }
        };
        img.onerror = () => {
          img.alt = 'Image unavailable';
        };
        obs.unobserve(img);
      });
    }, { rootMargin: '300px' });

    $$('img[data-src]').forEach(img => imgObserver.observe(img));

    // Handle images already loaded (data: URLs from localStorage)
    $$('.portfolio-img-wrap img[src]:not([data-src])').forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
        const placeholder = img.previousElementSibling;
        if (placeholder && placeholder.classList.contains('img-placeholder')) {
          placeholder.style.opacity = '0';
        }
      } else {
        img.onload = () => {
          img.classList.add('loaded');
          const placeholder = img.previousElementSibling;
          if (placeholder && placeholder.classList.contains('img-placeholder')) {
            placeholder.style.opacity = '0';
          }
        };
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     COUNTER ANIMATION
     ═══════════════════════════════════════════════════════════════ */

  function animateCounters() {
    if (countersAnimated) return;
    const counters = $$('.stat-number[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countersAnimated = true;
        observer.unobserve(entry.target);

        counters.forEach(counter => {
          const target = parseInt(counter.dataset.target, 10);
          const suffix = counter.dataset.suffix || '';
          const duration = 2000;
          const start = performance.now();

          function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            counter.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      });
    }, { threshold: 0.3 });

    // Observe the stats grid container
    const grid = $('#stats-grid');
    if (grid) observer.observe(grid);
  }

  /* ═══════════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════════ */

  /** Solid background on scroll */
  function initNavScroll() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mainNav.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /** Smooth scroll for nav links */
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const target = $(link.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'), 10) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile menu if open
      closeMobileMenu();
    });
  }

  /** Active nav link on scroll */
  function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('[data-nav]');

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollPos = window.scrollY + 120;
        let currentSection = '';

        sections.forEach(section => {
          if (section.offsetTop <= scrollPos) {
            currentSection = section.id;
          }
        });

        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
        });
        ticking = false;
      });
    });
  }

  /** Mobile menu */
  function initMobileMenu() {
    if (!navToggle || !mobileMenu) return;
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
  }

  function closeMobileMenu() {
    if (navToggle) navToggle.classList.remove('active');
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════════════
     BACK TO TOP
     ═══════════════════════════════════════════════════════════════ */

  function initBackToTop() {
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     CONTACT FORM
     ═══════════════════════════════════════════════════════════════ */

  function initContactForm() {
    if (!contactForm) return;
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const name = $('#form-name').value.trim();
      const email = $('#form-email').value.trim();
      const subject = $('#form-subject') ? $('#form-subject').value.trim() : '';
      const message = $('#form-message').value.trim();

      if (!name || !email || !message) {
        return;
      }

      // Build WhatsApp message
      const waText = [
        `*New Portfolio Inquiry*`,
        ``,
        `*Name:* ${name}`,
        `*Email:* ${email}`,
        subject ? `*Subject:* ${subject}` : '',
        ``,
        `*Message:*`,
        message
      ].filter(Boolean).join('\n');

      // Open WhatsApp with pre-filled message
      const waURL = `https://wa.me/201114767362?text=${encodeURIComponent(waText)}`;
      window.open(waURL, '_blank');

      // Show success message
      if (formSuccess) {
        formSuccess.classList.add('show');
        setTimeout(() => formSuccess.classList.remove('show'), 5000);
      }
      contactForm.reset();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     LOADING SCREEN
     ═══════════════════════════════════════════════════════════════ */

  function hideLoading() {
    // Hide loading screen once data is loaded and DOM is ready
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 600);
  }

  /* ═══════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════ */

  async function init() {
    // Load data from JSON files
    const dataLoaded = await loadData();

    if (!dataLoaded) {
      console.error('Could not load portfolio data. Check that data/*.json files exist.');
      hideLoading();
      return;
    }

    // Render content from data
    renderBio();
    renderStats();
    renderSkills();
    renderExperience();
    renderEducation();
    renderServices();
    renderPortfolioSections();

    // Interactive features
    initScrollAnimations();
    animateCounters();
    initNavScroll();
    initSmoothScroll();
    initActiveNav();
    initMobileMenu();
    initContactForm();
    initBackToTop();
    initTypingEffect();
    initParticles();

    // Hide loading
    hideLoading();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
