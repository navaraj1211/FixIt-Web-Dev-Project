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

  // Highlight active link matching current filename
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

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
