/* =========================================================
   FixIt — user.js
   Page-specific logic for the normal-user pages:
   dashboard, report form, my reports (list + filters),
   complaint details, and profile.

   Each block only runs if its target element exists on the
   current page, so this one file can be safely included
   everywhere.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Complaint details is shared between users and admins, so it
  // manages its own auth check separately from the rest of this file.
  if (document.getElementById('complaint-detail-wrap')) {
    renderComplaintDetails();
    return;
  }

  // Every other page in this file is user-only.
  const currentUser = requireRole ? requireRole('user') : getCurrentUser();
  if (!currentUser) return; // requireRole already redirected

  renderDashboard(currentUser);
  setupReportForm(currentUser);
  renderMyReports(currentUser);
  renderProfile(currentUser);
});

// ---------------------------------------------------------
// Dashboard (dashboard.html)
// ---------------------------------------------------------
function renderDashboard(currentUser) {
  const container = document.getElementById('recent-complaints-container');
  if (!container) return; // not on the dashboard page

  const myComplaints = getComplaintsByUser(currentUser.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = myComplaints.length;
  const pending = myComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = myComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = myComplaints.filter(c => c.status === 'Resolved').length;

  setText('stat-total', total);
  setText('stat-pending', pending);
  setText('stat-progress', inProgress);
  setText('stat-resolved', resolved);

  const emptyState = document.getElementById('dashboard-empty-state');

  if (total === 0) {
    if (emptyState) emptyState.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const recent = myComplaints.slice(0, 6);
  container.innerHTML = recent.map(complaintCardHTML).join('');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function complaintCardHTML(c) {
  return `
    <div class="complaint-card">
      <div class="complaint-card-top">
        <div>
          <div class="complaint-id">${c.id}</div>
          <div class="complaint-title">${escapeHTML(c.title)}</div>
        </div>
        <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
      </div>
      <div class="complaint-meta">
        <span>${escapeHTML(c.category)}</span>
        <span class="badge ${priorityBadgeClass(c.priority)}" style="padding:0.2rem 0.55rem;">${c.priority}</span>
        <span>📍 ${escapeHTML(c.location)}</span>
      </div>
      <div class="complaint-card-footer">
        <span class="complaint-date">${formatDate(c.date)}</span>
        <a href="complaint-details.html?id=${encodeURIComponent(c.id)}" class="btn btn-secondary btn-sm">View Details</a>
      </div>
    </div>
  `;
}

// Prevents raw HTML from user input breaking the layout.
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------
// Report a Problem form (report.html)
// ---------------------------------------------------------
function setupReportForm(currentUser) {
  const form = document.getElementById('report-problem-form');
  if (!form) return; // not on the report page

  const categorySelect = document.getElementById('complaint-category');
  const customGroup = document.getElementById('custom-category-group');
  const customInput = document.getElementById('custom-category');

  categorySelect.addEventListener('change', () => {
    const isOther = categorySelect.value === 'Other';
    customGroup.style.display = isOther ? 'block' : 'none';
    customInput.required = isOther;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('complaint-title').value.trim();
    const location = document.getElementById('complaint-location').value.trim();
    const priority = document.getElementById('complaint-priority').value;
    const description = document.getElementById('complaint-description').value.trim();
    const additionalInfo = document.getElementById('complaint-additional').value.trim();

    let category = categorySelect.value;
    if (category === 'Other') {
      category = customInput.value.trim();
      if (!category) {
        showToast('Please enter your custom issue category.', 'error');
        customInput.focus();
        return;
      }
    }

    if (!title || !category || !location || !priority || !description) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const complaint = addComplaint({
      title,
      category,
      location,
      priority,
      description,
      additionalInfo,
      submittedBy: currentUser.email,
      submittedByName: currentUser.name
    });

    showToast(`Report submitted successfully! Your complaint ID is ${complaint.id}.`, 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200);
  });
}

// ---------------------------------------------------------
// My Reports list with search + filters (complaints.html)
// ---------------------------------------------------------
function renderMyReports(currentUser) {
  const container = document.getElementById('my-reports-container');
  if (!container) return; // not on the my-reports page

  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('filter-category');
  const priorityFilter = document.getElementById('filter-priority');
  const statusFilter = document.getElementById('filter-status');
  const emptyState = document.getElementById('reports-empty-state');
  const noResultsState = document.getElementById('reports-no-results');

  const allMine = getComplaintsByUser(currentUser.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  function draw() {
    if (allMine.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (noResultsState) noResultsState.style.display = 'none';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    let result = searchComplaints(allMine, searchInput ? searchInput.value.trim() : '');
    result = filterComplaints(result, {
      category: categoryFilter ? categoryFilter.value : '',
      priority: priorityFilter ? priorityFilter.value : '',
      status: statusFilter ? statusFilter.value : ''
    });

    if (result.length === 0) {
      container.innerHTML = '';
      if (noResultsState) noResultsState.style.display = 'block';
      return;
    }
    if (noResultsState) noResultsState.style.display = 'none';
    container.innerHTML = result.map(complaintCardHTML).join('');
  }

  [searchInput, categoryFilter, priorityFilter, statusFilter].forEach(el => {
    if (el) el.addEventListener('input', draw);
  });

  draw();
}

// ---------------------------------------------------------
// Complaint details page (complaint-details.html)
// ---------------------------------------------------------
function renderComplaintDetails() {
  const wrap = document.getElementById('complaint-detail-wrap');
  if (!wrap) return; // not on the details page

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const complaint = id ? getComplaintById(id) : null;
  const isAdmin = currentUser.role === 'admin';
  const backLink = isAdmin ? 'admin-complaints.html' : 'complaints.html';
  const backLabel = isAdmin ? 'Back to All Complaints' : 'Back to My Reports';

  // Regular users may only view their own complaints; admins may view any.
  const notFound = !complaint || (!isAdmin && complaint.submittedBy.toLowerCase() !== currentUser.email.toLowerCase());

  if (notFound) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Report not found</h3>
        <p>We couldn't find that report, or it doesn't belong to your account.</p>
        <a href="${backLink}" class="btn btn-primary">${backLabel}</a>
      </div>`;
    return;
  }

  const backBtn = document.getElementById('detail-back-link');
  if (backBtn) {
    backBtn.href = backLink;
    backBtn.textContent = backLabel;
  }

  const adminStatusRow = document.getElementById('detail-admin-status-row');
  if (adminStatusRow) {
    if (isAdmin) {
      adminStatusRow.style.display = 'grid';
      const select = document.getElementById('detail-status-select');
      select.value = complaint.status;
      select.addEventListener('change', () => {
        const ok = updateComplaintStatus(complaint.id, select.value);
        if (ok) {
          showToast(`${complaint.id} updated to "${select.value}".`, 'success');
          renderStatusTracker(document.getElementById('detail-tracker'), select.value);
        }
      });
    } else {
      adminStatusRow.style.display = 'none';
    }
  }

  document.getElementById('detail-id').textContent = complaint.id;
  document.getElementById('detail-title').textContent = complaint.title;
  document.getElementById('detail-category').textContent = complaint.category;
  document.getElementById('detail-location').textContent = complaint.location;
  document.getElementById('detail-priority').innerHTML =
    `<span class="badge ${priorityBadgeClass(complaint.priority)}">${complaint.priority}</span>`;
  document.getElementById('detail-description').textContent = complaint.description;
  document.getElementById('detail-additional').textContent = complaint.additionalInfo || '—';
  document.getElementById('detail-submitted-by').textContent = complaint.submittedByName;
  document.getElementById('detail-date').textContent = formatDate(complaint.date);

  renderStatusTracker(document.getElementById('detail-tracker'), complaint.status);
}

// Renders the Pending -> In Progress -> Resolved visual tracker.
function renderStatusTracker(container, status) {
  if (!container) return;
  const steps = ['Pending', 'In Progress', 'Resolved'];
  const currentIndex = steps.indexOf(status);

  container.innerHTML = steps.map((step, i) => {
    let stateClass = '';
    if (i < currentIndex) stateClass = 'done';
    else if (i === currentIndex) stateClass = 'active';
    const icon = i < currentIndex ? '✓' : (i + 1);
    return `
      <div class="tracker-step ${stateClass}">
        <div class="tracker-line"></div>
        <div class="tracker-dot">${icon}</div>
        <div class="tracker-label">${step}</div>
      </div>`;
  }).join('');
}

// ---------------------------------------------------------
// Profile page (profile.html)
// ---------------------------------------------------------
function renderProfile(currentUser) {
  const nameEl = document.getElementById('profile-name');
  if (!nameEl) return; // not on the profile page

  nameEl.textContent = currentUser.name;
  document.getElementById('profile-email').textContent = currentUser.email;
  document.getElementById('profile-role').textContent =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

  const initial = document.getElementById('profile-initial');
  if (initial) initial.textContent = currentUser.name.charAt(0).toUpperCase();

  const myComplaints = getComplaintsByUser(currentUser.email);
  const countEl = document.getElementById('profile-report-count');
  if (countEl) countEl.textContent = myComplaints.length;
}
