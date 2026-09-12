/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Administrator Dashboard & Management Console (js/admin.js)
 * 
 * Handles:
 * - Admin authentication validation (requireAdmin)
 * - Real-time statistics aggregation (Total, Pending, Progress, Resolved, High Priority)
 * - Category and Priority breakdown calculation
 * - Global complaint search and multi-criteria filtering
 * - Direct inline status update for any complaint
 * - Development / Presentation Demo Data Reset
 */

function initAdminPage() {
  const admin = requireAdmin();
  if (!admin) return;

  // Set admin name in greeting
  const adminNameEl = document.getElementById('admin-welcome-name');
  if (adminNameEl) {
    adminNameEl.textContent = admin.name;
  }

  // Bind Reset Demo Data button
  const resetDemoBtn = document.getElementById('btn-reset-demo-data');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', handleResetDemoData);
  }

  // Setup live search and filter controls
  setupAdminFilters();

  // Render metrics and table
  refreshAdminDashboard();
}

/**
 * Recalculate statistics and re-render dashboard summary cards
 */
function refreshAdminDashboard() {
  const complaints = getComplaints();

  // 1. Calculate overall counts
  const total = complaints.length;
  const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
  const inProgress = complaints.filter(c => (c.status || '').toLowerCase() === 'in progress').length;
  const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
  const highPriority = complaints.filter(c => (c.priority || '').toLowerCase() === 'high').length;

  // 2. Update stat tiles
  const totalEl = document.getElementById('admin-stat-total');
  const pendingEl = document.getElementById('admin-stat-pending');
  const progressEl = document.getElementById('admin-stat-progress');
  const resolvedEl = document.getElementById('admin-stat-resolved');
  const highEl = document.getElementById('admin-stat-high');

  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (progressEl) progressEl.textContent = inProgress;
  if (resolvedEl) resolvedEl.textContent = resolved;
  if (highEl) highEl.textContent = highPriority;

  // 3. Render Category Breakdown Visual Progress Bars
  renderCategoryBreakdown(complaints);
}

/**
 * Render visual CSS progress bars for complaints by category
 */
function renderCategoryBreakdown(complaints) {
  const container = document.getElementById('category-breakdown-container');
  if (!container) return;

  const total = complaints.length;
  if (total === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No complaints recorded yet.</p>`;
    return;
  }

  // Group by category
  const categoryCounts = {};
  complaints.forEach(c => {
    const cat = c.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts);

  let html = '<div class="progress-stat-list">';
  categories.forEach(cat => {
    const count = categoryCounts[cat];
    const percentage = Math.round((count / total) * 100);

    html += `
      <div class="progress-stat-item">
        <div class="stat-labels">
          <span>${escapeHTML(cat)}</span>
          <span style="color: var(--text-muted);">${count} issues (${percentage}%)</span>
        </div>
        <div class="bar-wrapper">
          <div class="bar-fill bar-primary" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Setup Admin search and multi-filter listeners
 */
function setupAdminFilters() {
  const searchInput = document.getElementById('admin-search');
  const categorySelect = document.getElementById('admin-filter-category');
  const prioritySelect = document.getElementById('admin-filter-priority');
  const statusSelect = document.getElementById('admin-filter-status');
  const resetBtn = document.getElementById('btn-admin-reset-filters');
  const countDisplay = document.getElementById('admin-count-display');
  const container = document.getElementById('admin-complaints-container');

  function applyAdminFilters() {
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const category = categorySelect ? categorySelect.value : 'all';
    const priority = prioritySelect ? prioritySelect.value : 'all';
    const status = statusSelect ? statusSelect.value : 'all';

    const allComplaints = getComplaints();

    const filtered = allComplaints.filter(c => {
      // 1. Text search against ID, Title, Location, Submitter Name, or Submitter Email
      const matchSearch = !query ||
        (c.id && c.id.toLowerCase().includes(query)) ||
        (c.title && c.title.toLowerCase().includes(query)) ||
        (c.location && c.location.toLowerCase().includes(query)) ||
        (c.userName && c.userName.toLowerCase().includes(query)) ||
        (c.userId && c.userId.toLowerCase().includes(query));

      // 2. Category filter
      const matchCategory = (category === 'all') || (c.category === category);

      // 3. Priority filter
      const matchPriority = (priority === 'all') || (c.priority === priority);

      // 4. Status filter
      const matchStatus = (status === 'all') || (c.status === status);

      return matchSearch && matchCategory && matchPriority && matchStatus;
    });

    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} of ${allComplaints.length} complaints`;
    }

    renderAdminComplaintsTable(filtered, container);
  }

  if (searchInput) searchInput.addEventListener('input', applyAdminFilters);
  if (categorySelect) categorySelect.addEventListener('change', applyAdminFilters);
  if (prioritySelect) prioritySelect.addEventListener('change', applyAdminFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyAdminFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = 'all';
      if (prioritySelect) prioritySelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      applyAdminFilters();
      Toast.show('Admin filters reset', 'info');
    });
  }

  // Initial table render
  applyAdminFilters();
}

/**
 * Render the full table of complaints with inline status changers
 */
function renderAdminComplaintsTable(complaints, container) {
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No matching complaints found</h3>
        <p>No complaints match your query or filter parameters. Try clearing your filters.</p>
      </div>
    `;
    return;
  }

  let rowsHtml = complaints.map(c => `
    <tr>
      <td>
        <a href="complaint-details.html?id=${escapeHTML(c.id)}" class="complaint-id-link" title="Open full details">
          ${escapeHTML(c.id)}
        </a>
      </td>
      <td class="complaint-title-cell">
        <strong>${escapeHTML(c.title)}</strong>
        <small>📍 ${escapeHTML(c.location)}</small>
      </td>
      <td><span class="category-pill">${escapeHTML(c.category)}</span></td>
      <td>${getPriorityBadge(c.priority)}</td>
      <td>
        <div style="font-weight: 600; font-size: 0.85rem;">${escapeHTML(c.userName || 'Anonymous')}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(c.userId || '')}</div>
      </td>
      <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">
        ${escapeHTML(c.createdAt)}
      </td>
      <td>
        <select class="status-select" data-id="${escapeHTML(c.id)}" title="Change status">
          <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>
      <td>
        <a href="complaint-details.html?id=${escapeHTML(c.id)}" class="btn btn-secondary btn-sm">
          Details
        </a>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="custom-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title & Location</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Submitted By</th>
            <th>Date</th>
            <th>Status (Update)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // Attach change listener to all status selects for instant inline updates
  const selects = container.querySelectorAll('.status-select');
  selects.forEach(select => {
    select.addEventListener('change', (e) => {
      const complaintId = e.target.getAttribute('data-id');
      const newStatus = e.target.value;

      const updated = updateComplaintStatus(complaintId, newStatus);
      if (updated) {
        Toast.show(`Complaint ${complaintId} status updated to "${newStatus}"`, 'success');
        refreshAdminDashboard();
      } else {
        Toast.show('Failed to update status', 'error');
      }
    });
  });
}

/**
 * Handler to reset LocalStorage demo data for clean demonstrations and testing
 */
function handleResetDemoData() {
  if (confirm('Are you sure you want to clear all complaints?')) {
    localStorage.removeItem(STORAGE_COMPLAINTS_KEY);

    // Re-seed defaults (empty)
    getComplaints();

    Toast.show('All complaints cleared successfully!', 'success');

    // Re-initialize view
    setTimeout(() => {
      refreshAdminDashboard();
      setupAdminFilters();
    }, 400);
  }
}

// Auto-initialize Admin Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAdminPage();
});

