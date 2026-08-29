/* =========================================================
   FixIt — main.js
   Shared helper functions used across every page:
   toast notifications, mobile nav toggle, small utilities.
   ========================================================= */

// Create the toast container once, as soon as this script runs.
(function setupToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
})();

// Show a small notification in the top-right corner.
// type can be "success", "error", or "info".
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Format an ISO date string into something readable, e.g. "Aug 29, 2026".
function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return isoString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Simple mobile nav toggle for the top navbar, if a toggle button exists.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Admin sidebar toggle for small screens.
  const adminToggle = document.querySelector('.admin-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (adminToggle && sidebar) {
    adminToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // Fill in the current user's name wherever ".current-user-name" appears.
  const currentUser = getCurrentUser ? getCurrentUser() : null;
  if (currentUser) {
    document.querySelectorAll('.current-user-name').forEach(el => {
      el.textContent = currentUser.name;
    });
  }
});
