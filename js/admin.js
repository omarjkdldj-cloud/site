/* ============================================================
   ADMIN PANEL — JavaScript Controller
   Handles auth, CRUD operations, tab switching, export/import,
   toast notifications, and localStorage persistence.
   ============================================================ */

(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────
  const AUTH_PASSWORD = 'omar2025';
  const STORAGE_KEY  = 'portfolio_admin_data';
  const SESSION_KEY  = 'portfolio_admin_auth';

  // ─── State ─────────────────────────────────────────────────
  let data = null;           // Working copy of portfolio data
  let confirmCallback = null; // For modal confirmations

  // ─── DOM References ────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── Initialize ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
  });

  // ═══════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════

  function initAuth() {
    const overlay   = $('#auth-overlay');
    const layout    = $('#admin-layout');
    const passInput = $('#auth-password-input');
    const submitBtn = $('#auth-submit-btn');
    const errorEl   = $('#auth-error');
    const toggleBtn = $('#auth-toggle-password');

    // Already authenticated this session?
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      overlay.classList.add('hidden');
      layout.style.display = 'flex';
      initApp();
      return;
    }

    // Toggle password visibility
    toggleBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });

    // Submit handler
    const attemptLogin = () => {
      const val = passInput.value.trim();
      if (!val) {
        errorEl.textContent = 'Please enter a password.';
        shakeElement(passInput);
        return;
      }
      if (val !== AUTH_PASSWORD) {
        errorEl.textContent = 'Incorrect password. Try again.';
        shakeElement(passInput);
        passInput.value = '';
        passInput.focus();
        return;
      }
      // Success
      sessionStorage.setItem(SESSION_KEY, 'true');
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.classList.add('hidden');
        layout.style.display = 'flex';
        initApp();
      }, 300);
    };

    submitBtn.addEventListener('click', attemptLogin);
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
    passInput.focus();
  }

  function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.4s ease';
  }

  // Add shake keyframe dynamically
  (function addShakeKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  })();

  // ═══════════════════════════════════════════════════════════
  //  APP INIT
  // ═══════════════════════════════════════════════════════════

  function initApp() {
    loadData();
    initSidebar();
    initTabSwitching();
    initProfileTab();
    initServicesTab();
    initPortfolioTab();
    initExportTab();
    initLogout();
    updateDashboard();
    showToast('success', 'Welcome Back', 'Admin panel loaded successfully.');
  }

  // ═══════════════════════════════════════════════════════════
  //  DATA MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  function getDefaultData() {
    // Deep clone from window.PORTFOLIO_DATA if available
    if (window.PORTFOLIO_DATA) {
      return JSON.parse(JSON.stringify(window.PORTFOLIO_DATA));
    }
    // Fallback empty structure
    return {
      profile: {
        name: '',
        title: '',
        bio: '',
        email: '',
        phone: '',
        phone2: '',
        location: '',
        social: {
          github: '',
          linkedin: '',
          twitter: '',
          website: '',
          dribbble: '',
          behance: ''
        }
      },
      experience: [],
      education: [],
      skills: [],
      services: [],
      portfolio: [],
      categories: [
        { slug: 'all', name: 'All' }
      ]
    };
  }

  function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        data = JSON.parse(stored);
        // Ensure all keys exist (merge with defaults)
        const defaults = getDefaultData();
        for (const key of Object.keys(defaults)) {
          if (!(key in data)) data[key] = defaults[key];
        }
        if (!data.profile.social) data.profile.social = {};
      } catch (e) {
        console.error('Failed to parse stored data, loading defaults.', e);
        data = getDefaultData();
      }
    } else {
      data = getDefaultData();
    }
    saveData();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      showToast('error', 'Storage Error', 'Failed to save data to localStorage.');
      console.error(e);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  SIDEBAR & NAVIGATION
  // ═══════════════════════════════════════════════════════════

  function initSidebar() {
    const sidebar    = $('#sidebar');
    const overlay    = $('#sidebar-overlay');
    const toggleBtn  = $('#sidebar-toggle-btn');
    const closeBtn   = $('#sidebar-close-btn');

    const openSidebar = () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    };

    toggleBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close sidebar on nav click (mobile)
    $$('.sidebar-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeSidebar();
      });
    });
  }

  function initTabSwitching() {
    const navLinks = $$('.sidebar-nav a[data-tab]');
    const panels   = $$('.tab-panel');

    const switchTab = (tabId) => {
      navLinks.forEach((l) => l.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      const activeLink  = $(`.sidebar-nav a[data-tab="${tabId}"]`);
      const activePanel = $(`#panel-${tabId}`);

      if (activeLink) activeLink.classList.add('active');
      if (activePanel) activePanel.classList.add('active');
    };

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.dataset.tab);
      });
    });

    // Quick-action buttons on dashboard
    $$('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.goto));
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════════

  function updateDashboard() {
    const profile = data.profile || {};
    const filledFields = ['name', 'title', 'bio', 'email', 'phone'].filter(
      (k) => profile[k] && profile[k].trim()
    ).length;

    $('#stat-profile').textContent   = `${filledFields}/5`;
    $('#stat-services').textContent  = (data.services || []).length;
    $('#stat-portfolio').textContent = (data.portfolio || []).length;
    $('#stat-categories').textContent = (data.categories || []).length;
  }

  // ═══════════════════════════════════════════════════════════
  //  PROFILE TAB
  // ═══════════════════════════════════════════════════════════

  function initProfileTab() {
    populateProfileForm();

    $('#profile-save-btn').addEventListener('click', saveProfile);
    $('#profile-reset-btn').addEventListener('click', () => {
      populateProfileForm();
      showToast('info', 'Reset', 'Profile form restored to last saved state.');
    });
  }

  function populateProfileForm() {
    const p = data.profile || {};
    const s = p.social || {};

    $('#profile-name').value      = p.name || '';
    $('#profile-title').value     = p.title || '';
    $('#profile-bio').value       = p.bio || '';
    $('#profile-email').value     = p.email || '';
    $('#profile-phone').value     = p.phone || '';
    $('#profile-phone2').value    = p.phone2 || '';
    $('#profile-location').value  = p.location || '';
    $('#profile-github').value    = s.github || '';
    $('#profile-linkedin').value  = s.linkedin || '';
    $('#profile-twitter').value   = s.twitter || '';
    $('#profile-website').value   = s.website || '';
    $('#profile-dribbble').value  = s.dribbble || '';
    $('#profile-behance').value   = s.behance || '';
  }

  function saveProfile() {
    const name  = $('#profile-name').value.trim();
    const title = $('#profile-title').value.trim();

    if (!name) {
      showToast('error', 'Validation Error', 'Full Name is required.');
      $('#profile-name').focus();
      return;
    }
    if (!title) {
      showToast('error', 'Validation Error', 'Professional Title is required.');
      $('#profile-title').focus();
      return;
    }

    data.profile = {
      ...data.profile,
      name,
      title,
      bio:      $('#profile-bio').value.trim(),
      email:    $('#profile-email').value.trim(),
      phone:    $('#profile-phone').value.trim(),
      phone2:   $('#profile-phone2').value.trim(),
      location: $('#profile-location').value.trim(),
      social: {
        github:   $('#profile-github').value.trim(),
        linkedin: $('#profile-linkedin').value.trim(),
        twitter:  $('#profile-twitter').value.trim(),
        website:  $('#profile-website').value.trim(),
        dribbble: $('#profile-dribbble').value.trim(),
        behance:  $('#profile-behance').value.trim()
      }
    };

    saveData();
    updateDashboard();
    showToast('success', 'Profile Saved', 'Your profile has been updated successfully.');
  }

  // ═══════════════════════════════════════════════════════════
  //  SERVICES TAB
  // ═══════════════════════════════════════════════════════════

  function initServicesTab() {
    renderServicesList();
    $('#service-save-btn').addEventListener('click', saveService);
    $('#service-cancel-btn').addEventListener('click', cancelServiceEdit);
  }

  function renderServicesList() {
    const container = $('#services-list');
    const services  = data.services || [];

    $('#services-count-badge').textContent = `${services.length} service${services.length !== 1 ? 's' : ''}`;

    if (services.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">⚙️</div>
          <h4>No services yet</h4>
          <p>Add your first service using the form below.</p>
        </div>`;
      return;
    }

    container.innerHTML = services.map((svc, i) => `
      <div class="item-card">
        <div class="item-header">
          <div>
            <div class="item-icon">${escapeHtml(svc.icon || '🔧')}</div>
          </div>
        </div>
        <div class="item-title">${escapeHtml(svc.title)}</div>
        <div class="item-desc">${escapeHtml(svc.description || '')}</div>
        <div class="item-actions">
          <button class="btn btn-ghost btn-sm" onclick="AdminPanel.editService(${i})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="AdminPanel.deleteService(${i})">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  }

  function saveService() {
    const icon  = $('#service-icon').value.trim() || '🔧';
    const title = $('#service-title').value.trim();
    const desc  = $('#service-description').value.trim();
    const idx   = parseInt($('#service-edit-index').value, 10);

    if (!title) {
      showToast('error', 'Validation Error', 'Service title is required.');
      $('#service-title').focus();
      return;
    }
    if (!desc) {
      showToast('error', 'Validation Error', 'Service description is required.');
      $('#service-description').focus();
      return;
    }

    if (!data.services) data.services = [];

    const serviceObj = { icon, title, description: desc };

    if (idx >= 0 && idx < data.services.length) {
      // Editing existing
      data.services[idx] = { ...data.services[idx], ...serviceObj };
      showToast('success', 'Service Updated', `"${title}" has been updated.`);
    } else {
      // Adding new
      data.services.push(serviceObj);
      showToast('success', 'Service Added', `"${title}" has been added.`);
    }

    saveData();
    renderServicesList();
    clearServiceForm();
    updateDashboard();
  }

  function editService(index) {
    const svc = data.services[index];
    if (!svc) return;

    $('#service-icon').value         = svc.icon || '';
    $('#service-title').value        = svc.title || '';
    $('#service-description').value  = svc.description || '';
    $('#service-edit-index').value   = index;

    $('#service-form-title').innerHTML = '<span class="card-icon">✏️</span> Edit Service';
    $('#service-save-btn').textContent = '💾 Update Service';
    $('#service-cancel-btn').style.display = 'inline-flex';

    $('#service-form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function deleteService(index) {
    const svc = data.services[index];
    if (!svc) return;

    showConfirm(
      '🗑️ Delete Service',
      `Are you sure you want to delete "<strong>${escapeHtml(svc.title)}</strong>"? This action cannot be undone.`,
      () => {
        data.services.splice(index, 1);
        saveData();
        renderServicesList();
        updateDashboard();
        showToast('success', 'Service Deleted', `"${svc.title}" has been removed.`);
      }
    );
  }

  function cancelServiceEdit() {
    clearServiceForm();
    showToast('info', 'Cancelled', 'Service edit cancelled.');
  }

  function clearServiceForm() {
    $('#service-icon').value        = '';
    $('#service-title').value       = '';
    $('#service-description').value = '';
    $('#service-edit-index').value  = '-1';
    $('#service-form-title').innerHTML = '<span class="card-icon">➕</span> Add New Service';
    $('#service-save-btn').textContent = '➕ Add Service';
    $('#service-cancel-btn').style.display = 'none';
  }

  // ═══════════════════════════════════════════════════════════
  //  PORTFOLIO TAB
  // ═══════════════════════════════════════════════════════════

  function initPortfolioTab() {
    renderPortfolioList();
    renderCategoriesList();
    populateCategoryDropdown();
    initImageUpload();

    $('#project-save-btn').addEventListener('click', saveProject);
    $('#project-cancel-btn').addEventListener('click', cancelProjectEdit);
    $('#add-category-btn').addEventListener('click', addCategory);
  }

  function renderPortfolioList() {
    const container = $('#portfolio-list');
    const projects  = data.portfolio || [];

    $('#portfolio-count-badge').textContent = `${projects.length} project${projects.length !== 1 ? 's' : ''}`;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">📁</div>
          <h4>No projects yet</h4>
          <p>Showcase your work by adding projects below.</p>
        </div>`;
      return;
    }

    container.innerHTML = projects.map((proj, i) => {
      const catName = getCategoryName(proj.category);
      const thumb   = proj.image
        ? `<img class="portfolio-thumb" src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" loading="lazy">`
        : `<div class="portfolio-thumb-placeholder">📷</div>`;

      return `
        <div class="portfolio-item-card">
          ${thumb}
          <div class="portfolio-info">
            <span class="portfolio-category-badge">${escapeHtml(catName)}</span>
            <h4>${escapeHtml(proj.title)}</h4>
          </div>
          <div class="portfolio-actions">
            <button class="btn btn-ghost btn-sm" onclick="AdminPanel.editProject(${i})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="AdminPanel.deleteProject(${i})">🗑️ Delete</button>
          </div>
        </div>`;
    }).join('');
  }

  function getCategoryName(slug) {
    if (!slug) return 'Uncategorized';
    const cat = (data.categories || []).find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  }

  function populateCategoryDropdown() {
    const select = $('#project-category');
    const cats   = (data.categories || []).filter((c) => c.slug !== 'all');

    // Keep first option
    select.innerHTML = '<option value="">Select category…</option>';
    cats.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.slug;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  function initImageUpload() {
    const zone   = $('#project-image-zone');
    const input  = $('#project-image-input');

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--accent-start)';
      zone.style.background = 'rgba(108,92,231,0.05)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = '';
      zone.style.background = '';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = '';
      zone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        showToast('error', 'Invalid File', 'Please upload an image file.');
      }
    });

    input.addEventListener('change', () => {
      if (input.files[0]) handleImageFile(input.files[0]);
    });
  }

  function handleImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const zone = $('#project-image-zone');
      zone.classList.add('has-preview');
      zone.innerHTML = `
        <img class="preview-img" src="${e.target.result}" alt="Preview">
        <div class="preview-overlay">📸 Click to change</div>
        <input type="file" id="project-image-input" accept="image/*">
      `;
      // Re-bind the file input
      const newInput = $('#project-image-input');
      newInput.addEventListener('change', () => {
        if (newInput.files[0]) handleImageFile(newInput.files[0]);
      });
      zone.dataset.imageData = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetImageUpload() {
    const zone = $('#project-image-zone');
    zone.classList.remove('has-preview');
    zone.innerHTML = `
      <div class="upload-icon">📸</div>
      <p>Click to upload or drag &amp; drop</p>
      <span class="upload-hint">PNG, JPG, WEBP up to 5MB</span>
      <input type="file" id="project-image-input" accept="image/*">
    `;
    delete zone.dataset.imageData;
    initImageUpload();
  }

  function saveProject() {
    const title    = $('#project-title').value.trim();
    const category = $('#project-category').value;
    const desc     = $('#project-description').value.trim();
    const link     = $('#project-link').value.trim();
    const github   = $('#project-github').value.trim();
    const zone     = $('#project-image-zone');
    const image    = zone.dataset.imageData || '';
    const idx      = parseInt($('#project-edit-index').value, 10);

    if (!title) {
      showToast('error', 'Validation Error', 'Project title is required.');
      $('#project-title').focus();
      return;
    }
    if (!category) {
      showToast('error', 'Validation Error', 'Please select a category.');
      $('#project-category').focus();
      return;
    }

    if (!data.portfolio) data.portfolio = [];

    const projectObj = { title, category, description: desc, link, github, image };

    if (idx >= 0 && idx < data.portfolio.length) {
      // If no new image was uploaded, keep the old one
      if (!image && data.portfolio[idx].image) {
        projectObj.image = data.portfolio[idx].image;
      }
      data.portfolio[idx] = { ...data.portfolio[idx], ...projectObj };
      showToast('success', 'Project Updated', `"${title}" has been updated.`);
    } else {
      data.portfolio.push(projectObj);
      showToast('success', 'Project Added', `"${title}" has been added.`);
    }

    saveData();
    renderPortfolioList();
    clearProjectForm();
    updateDashboard();
  }

  function editProject(index) {
    const proj = data.portfolio[index];
    if (!proj) return;

    $('#project-title').value       = proj.title || '';
    $('#project-category').value    = proj.category || '';
    $('#project-description').value = proj.description || '';
    $('#project-link').value        = proj.link || '';
    $('#project-github').value      = proj.github || '';
    $('#project-edit-index').value  = index;

    // Show image preview if exists
    if (proj.image) {
      const zone = $('#project-image-zone');
      zone.classList.add('has-preview');
      zone.innerHTML = `
        <img class="preview-img" src="${proj.image}" alt="Preview">
        <div class="preview-overlay">📸 Click to change</div>
        <input type="file" id="project-image-input" accept="image/*">
      `;
      zone.dataset.imageData = '';
      const newInput = $('#project-image-input');
      newInput.addEventListener('change', () => {
        if (newInput.files[0]) handleImageFile(newInput.files[0]);
      });
    }

    $('#portfolio-form-title').innerHTML = '<span class="card-icon">✏️</span> Edit Project';
    $('#project-save-btn').textContent = '💾 Update Project';
    $('#project-cancel-btn').style.display = 'inline-flex';

    $('#portfolio-form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function deleteProject(index) {
    const proj = data.portfolio[index];
    if (!proj) return;

    showConfirm(
      '🗑️ Delete Project',
      `Are you sure you want to delete "<strong>${escapeHtml(proj.title)}</strong>"? This action cannot be undone.`,
      () => {
        data.portfolio.splice(index, 1);
        saveData();
        renderPortfolioList();
        updateDashboard();
        showToast('success', 'Project Deleted', `"${proj.title}" has been removed.`);
      }
    );
  }

  function cancelProjectEdit() {
    clearProjectForm();
    showToast('info', 'Cancelled', 'Project edit cancelled.');
  }

  function clearProjectForm() {
    $('#project-title').value       = '';
    $('#project-category').value    = '';
    $('#project-description').value = '';
    $('#project-link').value        = '';
    $('#project-github').value      = '';
    $('#project-edit-index').value  = '-1';
    resetImageUpload();
    $('#portfolio-form-title').innerHTML = '<span class="card-icon">➕</span> Add New Project';
    $('#project-save-btn').textContent = '➕ Add Project';
    $('#project-cancel-btn').style.display = 'none';
  }

  // ─── Category Management ──────────────────────────────────

  function addCategory() {
    const slug = $('#new-category-slug').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const name = $('#new-category-name').value.trim();

    if (!slug || !name) {
      showToast('error', 'Validation Error', 'Both slug and display name are required.');
      return;
    }

    if (!data.categories) data.categories = [{ slug: 'all', name: 'All' }];

    if (data.categories.some((c) => c.slug === slug)) {
      showToast('error', 'Duplicate', `Category "${slug}" already exists.`);
      return;
    }

    data.categories.push({ slug, name });
    saveData();
    renderCategoriesList();
    populateCategoryDropdown();
    updateDashboard();

    $('#new-category-slug').value = '';
    $('#new-category-name').value = '';
    showToast('success', 'Category Added', `"${name}" has been added.`);
  }

  function deleteCategory(slug) {
    if (slug === 'all') {
      showToast('error', 'Cannot Delete', 'The "All" category cannot be removed.');
      return;
    }

    const cat = data.categories.find((c) => c.slug === slug);
    showConfirm(
      '🗑️ Delete Category',
      `Delete category "<strong>${escapeHtml(cat ? cat.name : slug)}</strong>"? Projects in this category will become uncategorized.`,
      () => {
        data.categories = data.categories.filter((c) => c.slug !== slug);
        // Update projects using this category
        (data.portfolio || []).forEach((p) => {
          if (p.category === slug) p.category = '';
        });
        saveData();
        renderCategoriesList();
        renderPortfolioList();
        populateCategoryDropdown();
        updateDashboard();
        showToast('success', 'Category Deleted', `"${cat ? cat.name : slug}" has been removed.`);
      }
    );
  }

  function renderCategoriesList() {
    const container = $('#categories-list');
    const cats      = data.categories || [];

    if (cats.length === 0) {
      container.innerHTML = '<div class="empty-state"><h4>No categories</h4></div>';
      return;
    }

    container.innerHTML = cats.map((cat) => `
      <div class="item-card" style="padding:14px 18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <span class="badge badge-purple" style="font-size:0.8rem;">${escapeHtml(cat.slug)}</span>
            <strong style="margin-left:10px;font-size:0.9rem;">${escapeHtml(cat.name)}</strong>
          </div>
          ${cat.slug !== 'all'
            ? `<button class="btn btn-danger btn-icon btn-sm" onclick="AdminPanel.deleteCategory('${escapeHtml(cat.slug)}')" title="Delete">🗑️</button>`
            : '<span class="badge" style="font-size:0.7rem;">Default</span>'
          }
        </div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════════════════════
  //  EXPORT / IMPORT TAB
  // ═══════════════════════════════════════════════════════════

  function initExportTab() {
    $('#export-json-btn').addEventListener('click', exportJSON);
    $('#import-json-btn').addEventListener('click', () => $('#import-json-input').click());
    $('#import-json-input').addEventListener('change', importJSON);
    $('#reset-defaults-btn').addEventListener('click', resetToDefaults);
    $('#refresh-preview-btn').addEventListener('click', refreshPreview);
    refreshPreview();
  }

  function exportJSON() {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `portfolio-data-${getDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'Export Complete', 'JSON file has been downloaded.');
    } catch (e) {
      showToast('error', 'Export Failed', 'Could not generate JSON file.');
      console.error(e);
    }
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);

        // Basic validation
        if (typeof imported !== 'object' || imported === null) {
          throw new Error('Invalid data structure');
        }

        showConfirm(
          '📤 Import Data',
          'This will <strong>replace all current data</strong> with the imported file. Do you want to continue?',
          () => {
            data = imported;
            saveData();
            // Re-render everything
            populateProfileForm();
            renderServicesList();
            renderPortfolioList();
            renderCategoriesList();
            populateCategoryDropdown();
            updateDashboard();
            refreshPreview();
            showToast('success', 'Import Complete', 'Portfolio data has been restored from the file.');
          }
        );
      } catch (err) {
        showToast('error', 'Import Failed', 'The file does not contain valid JSON data.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function resetToDefaults() {
    showConfirm(
      '🔄 Reset to Defaults',
      'This will <strong>erase all changes</strong> and restore the original data from <code>data.js</code>. This cannot be undone.',
      () => {
        localStorage.removeItem(STORAGE_KEY);
        data = getDefaultData();
        saveData();
        // Re-render everything
        populateProfileForm();
        renderServicesList();
        renderPortfolioList();
        renderCategoriesList();
        populateCategoryDropdown();
        updateDashboard();
        refreshPreview();
        showToast('success', 'Reset Complete', 'All data has been restored to defaults.');
      }
    );
  }

  function refreshPreview() {
    const pre = $('#data-preview');
    try {
      pre.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      pre.textContent = 'Error rendering preview.';
    }
  }

  function getDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════════════════════
  //  LOGOUT
  // ═══════════════════════════════════════════════════════════

  function initLogout() {
    $('#logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      showConfirm(
        '🚪 Lock & Exit',
        'Lock the admin panel? You will need to re-enter the password to access it again.',
        () => {
          sessionStorage.removeItem(SESSION_KEY);
          location.reload();
        }
      );
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  CONFIRM MODAL
  // ═══════════════════════════════════════════════════════════

  function showConfirm(title, message, onConfirm) {
    const backdrop  = $('#confirm-modal');
    const titleEl   = $('#confirm-modal-title');
    const bodyEl    = $('#confirm-modal-body');
    const cancelBtn = $('#confirm-modal-cancel');
    const confirmBtn = $('#confirm-modal-confirm');
    const closeBtn  = $('#confirm-modal-close-btn');

    titleEl.textContent = '';
    titleEl.textContent = title;
    bodyEl.innerHTML = message;
    confirmCallback = onConfirm;

    backdrop.classList.add('visible');

    const close = () => {
      backdrop.classList.remove('visible');
      confirmCallback = null;
    };

    // Remove old listeners by cloning
    const newCancel  = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    const newClose   = closeBtn.cloneNode(true);
    cancelBtn.replaceWith(newCancel);
    confirmBtn.replaceWith(newConfirm);
    closeBtn.replaceWith(newClose);

    newCancel.addEventListener('click', close);
    newClose.addEventListener('click', close);
    newConfirm.addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    }, { once: true });
  }

  // ═══════════════════════════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  function showToast(type, title, message, duration = 4000) {
    const container = $('#toast-container');

    const icons = {
      success: '✅',
      error:   '❌',
      warning: '⚠️',
      info:    'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">✕</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    };

    closeBtn.addEventListener('click', removeToast);

    // Auto-dismiss
    const timer = setTimeout(removeToast, duration);
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(removeToast, 1500));
  }

  // ═══════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API (for inline onclick handlers)
  // ═══════════════════════════════════════════════════════════

  window.AdminPanel = {
    editService,
    deleteService,
    editProject,
    deleteProject,
    deleteCategory
  };

})();
