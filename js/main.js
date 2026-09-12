/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Main Shared Utilities (js/main.js)
 * 
 * Contains global helper functions used across all pages:
 * - Toast notification system
 * - Mobile navigation menu toggle
 * - Dynamic user greeting badge in navigation
 * - Date and time formatting helpers
 * - Active page link highlighter
 */

// --- 1. Global Toast Notification System ---
const Toast = {
  /**
   * Display a floating feedback message
   * @param {string} message - Message text
   * @param {'success'|'error'|'info'|'warning'} type - Visual category
   * @param {number} duration - Milliseconds before auto-dismiss
   */
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on notification type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after timeout
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
};

// --- 2. Navigation & User Header Setup ---
function setupNavigation() {
  // Mobile menu toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const isLandingPage = currentPath === 'index.html' || currentPath === '';
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  function setActiveLink(activeEl) {
    navLinks.forEach(link => link.classList.remove('active'));
    if (activeEl) {
      activeEl.classList.add('active');
    }
  }

  if (isLandingPage) {
    const homeLink = navLinks.find(l => {
      const h = l.getAttribute('href');
      return h === 'index.html' || h === '/' || h === '#top' || h === '#';
    }) || navLinks[0];

    // Handle clicks on nav links for smooth scroll and immediate active bar indicator update
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const rawHref = link.getAttribute('href') || '';
        const hashIdx = rawHref.indexOf('#');
        const hash = hashIdx !== -1 ? rawHref.substring(hashIdx) : '';

        if (hash) {
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            e.preventDefault();
            setActiveLink(link);
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({
              top: targetPos,
              behavior: 'smooth'
            });
            if (history.pushState) {
              history.pushState(null, null, hash);
            } else {
              window.location.hash = hash;
            }
            if (navMenu) navMenu.classList.remove('active');
          }
        } else if (rawHref === 'index.html' || rawHref === '/' || rawHref === '') {
          e.preventDefault();
          setActiveLink(link);
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
          if (history.pushState) {
            history.pushState(null, null, window.location.pathname);
          }
          if (navMenu) navMenu.classList.remove('active');
        }
      });
    });

    // Scrollspy to dynamically update active navbar indicator bar as user scrolls
    const sections = [
      { id: 'categories', el: document.getElementById('categories') },
      { id: 'features', el: document.getElementById('features') },
      { id: 'how-it-works', el: document.getElementById('how-it-works') }
    ];

    let isScrollingFromClick = false;
    let scrollTimeout;

    function updateScrollspy() {
      const scrollPos = window.scrollY;
      const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
      const offsetThreshold = navHeight + 120;

      if (scrollPos < 180) {
        setActiveLink(homeLink);
        return;
      }

      // Check sections from bottom to top
      for (const sec of sections) {
        if (sec.el) {
          const rect = sec.el.getBoundingClientRect();
          const top = rect.top + window.pageYOffset;
          if (scrollPos >= top - offsetThreshold) {
            const matchingLink = navLinks.find(l => {
              const h = l.getAttribute('href') || '';
              return h === `#${sec.id}` || h === `index.html#${sec.id}`;
            });
            if (matchingLink) {
              setActiveLink(matchingLink);
              return;
            }
          }
        }
      }

      setActiveLink(homeLink);
    }

    window.addEventListener('scroll', () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(updateScrollspy);
    }, { passive: true });

    // Handle hash on initial page load
    if (window.location.hash) {
      const targetHash = window.location.hash;
      const matched = navLinks.find(l => {
        const h = l.getAttribute('href') || '';
        return h === targetHash || h === `index.html${targetHash}`;
      });
      if (matched) {
        setActiveLink(matched);
        setTimeout(() => {
          const targetEl = document.querySelector(targetHash);
          if (targetEl) {
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 72;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
          }
        }, 150);
      } else {
        updateScrollspy();
      }
    } else {
      updateScrollspy();
    }
  } else {
    // Other pages: match exact current filename
    let matchedLink = null;
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkFile = href.split('/').pop().split('#')[0];
      if (linkFile && linkFile === currentPath) {
        matchedLink = link;
      }
    });

    if (matchedLink) {
      setActiveLink(matchedLink);
    }
  }

  // Render dynamic auth button or user profile in navbar
  renderNavAuthSection();
}

/**
 * Updates navbar right actions depending on user authentication status
 */
function renderNavAuthSection() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    // User is logged in
    const roleBadge = currentUser.role === 'admin' 
      ? `<span class="role-pill admin-pill">Admin</span>` 
      : `<span class="role-pill">User</span>`;

    const dashboardLink = currentUser.role === 'admin' ? 'admin.html' : 'dashboard.html';

    navActions.innerHTML = `
      <a href="${dashboardLink}" class="nav-user-badge" title="Go to Dashboard">
        <span>👤 ${escapeHTML(currentUser.name)}</span>
        ${roleBadge}
      </a>
      <button id="nav-logout-btn" class="btn btn-secondary btn-sm" title="Log out">Log Out</button>
    `;

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    }
  } else {
    // User is a guest / logged out
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// --- 3. Formatting and Helper Functions ---

/**
 * Format ISO or standard date string into a friendly readable timestamp
 * Example: "Aug 29, 2026, 10:30 AM"
 */
function formatDateTime(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput; // Return as-is if string

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Sanitize strings to avoid HTML injection
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper to get status badge HTML
 */
function getStatusBadge(status) {
  const s = (status || 'Pending').toLowerCase();
  let badgeClass = 'badge-pending';
  let label = 'Pending';

  if (s === 'in progress' || s === 'in-progress') {
    badgeClass = 'badge-progress';
    label = 'In Progress';
  } else if (s === 'resolved') {
    badgeClass = 'badge-resolved';
    label = 'Resolved';
  }

  return `<span class="badge ${badgeClass}"><span class="badge-dot"></span>${label}</span>`;
}

/**
 * Helper to get priority badge HTML
 */
function getPriorityBadge(priority) {
  const p = (priority || 'Medium').toLowerCase();
  let badgeClass = 'badge-priority-medium';

  if (p === 'high') {
    badgeClass = 'badge-priority-high';
  } else if (p === 'low') {
    badgeClass = 'badge-priority-low';
  }

  return `<span class="badge ${badgeClass}">${priority || 'Medium'}</span>`;
}

// Initialize navigation on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
});
