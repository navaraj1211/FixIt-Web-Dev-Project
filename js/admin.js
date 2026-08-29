/* =========================================================
   FixIt — admin.js
   Page-specific logic for the admin console:
   admin dashboard and the all-complaints management page.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const admin = requireRole ? requireRole('admin') : getCurrentUser();
  if (!admin) return; // requireRole already redirected

  document.querySelectorAll('.current-admin-name').forEach(el => {
    el.textContent = admin.name;
  });

  renderAdminDashboard();
  renderAdminComplaintsTable();
});

// ---------------------------------------------------------
// Admin dashboard (admin-dashboard.html)
// ---------------------------------------------------------
function renderAdminDashboard() {
  const tableBody = document.getElementById('admin-recent-table-body');
  if (!tableBody) return; // not on the admin dashboard page

  const all = getComplaints().sort((a, b) => new Date(b.date) - new Date(a.date));

  setText('admin-stat-total', all.length);
  setText('admin-stat-pending', all.filter(c => c.status === 'Pending').length);
  setText('admin-stat-progress', all.filter(c => c.status === 'In Progress').length);
  setText('admin-stat-resolved', all.filter(c => c.status === 'Resolved').length);
  setText('admin-stat-high', all.filter(c => c.priority === 'High').length);

  const emptyState = document.getElementById('admin-recent-empty');
  const tableWrap = document.getElementById('admin-recent-table-wrap');

  if (all.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  const recent = all.slice(0, 8);
  tableBody.innerHTML = recent.map(c => adminRowHTML(c, false)).join('');

  attachStatusHandlers(tableBody, renderAdminDashboard);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---------------------------------------------------------
// All Complaints management page (admin-complaints.html)
// ---------------------------------------------------------
function renderAdminComplaintsTable() {
  const tableBody = document.getElementById('admin-complaints-table-body');
  if (!tableBody) return; // not on the admin complaints page

  const searchInput = document.getElementById('admin-search-input');
  const categoryFilter = document.getElementById('admin-filter-category');
  const priorityFilter = document.getElementById('admin-filter-priority');
  const statusFilter = document.getElementById('admin-filter-status');
  const noResultsState = document.getElementById('admin-no-results');
  const tableWrap = document.getElementById('admin-complaints-table-wrap');

  // If the page was opened with a ?status=Pending style link (e.g. from
  // dashboard quick links), pre-select that filter.
  const params = new URLSearchParams(window.location.search);
  const presetStatus = params.get('status');
  if (presetStatus && statusFilter) statusFilter.value = presetStatus;

  function draw() {
    const all = getComplaints().sort((a, b) => new Date(b.date) - new Date(a.date));

    let result = searchComplaints(all, searchInput ? searchInput.value.trim() : '');
    result = filterComplaints(result, {
      category: categoryFilter ? categoryFilter.value : '',
      priority: priorityFilter ? priorityFilter.value : '',
      status: statusFilter ? statusFilter.value : ''
    });

    if (result.length === 0) {
      tableBody.innerHTML = '';
      if (noResultsState) noResultsState.style.display = 'block';
      if (tableWrap) tableWrap.style.display = 'none';
      return;
    }
    if (noResultsState) noResultsState.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';

    tableBody.innerHTML = result.map(c => adminRowHTML(c, true)).join('');
    attachStatusHandlers(tableBody, draw);
  }

  [searchInput, categoryFilter, priorityFilter, statusFilter].forEach(el => {
    if (el) el.addEventListener('input', draw);
  });

  draw();
}

// Builds one <tr> for a complaint. showStatusControl toggles whether a
// live status dropdown is shown (management page) or a static badge
// (dashboard "recent" preview).
function adminRowHTML(c, showStatusControl) {
  const statusCell = showStatusControl
    ? `<select class="status-select" data-complaint-id="${c.id}">
        <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
      </select>`
    : `<span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>`;

  return `
    <tr>
      <td><strong>${c.id}</strong></td>
      <td>${escapeHTML(c.title)}</td>
      <td>${escapeHTML(c.category)}</td>
      <td><span class="badge ${priorityBadgeClass(c.priority)}">${c.priority}</span></td>
      <td>${escapeHTML(c.submittedByName)}</td>
      <td>${escapeHTML(c.location)}</td>
      <td>${formatDate(c.date)}</td>
      <td>${statusCell}</td>
      <td><a href="complaint-details.html?id=${encodeURIComponent(c.id)}&admin=1" class="btn btn-secondary btn-sm">View</a></td>
    </tr>`;
}

// Wires up every status <select> in a table body: on change, updates
// LocalStorage and re-renders so counts and filters stay in sync.
function attachStatusHandlers(tableBody, onUpdated) {
  tableBody.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', () => {
      const id = select.getAttribute('data-complaint-id');
      const newStatus = select.value;
      const ok = updateComplaintStatus(id, newStatus);
      if (ok) {
        showToast(`${id} updated to "${newStatus}".`, 'success');
        onUpdated();
      } else {
        showToast('Could not update that report. Please try again.', 'error');
      }
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
