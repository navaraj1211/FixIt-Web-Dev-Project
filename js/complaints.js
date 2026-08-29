/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Complaint Data Management & User Operations (js/complaints.js)
 * 
 * Handles:
 * - CRUD operations for complaints in LocalStorage ('fixit_complaints')
 * - Automatic Complaint ID generation (FIX-1001, FIX-1002, etc.)
 * - Seed demo complaints dataset
 * - User dashboard statistics & recent complaints
 * - "My Complaints" live multi-filter & search engine
 * - "Complaint Details" view & 3-step progress tracker rendering
 */

const STORAGE_COMPLAINTS_KEY = 'fixit_complaints';

// Initial Demo Complaints
const DEFAULT_COMPLAINTS = [
  {
    id: 'FIX-1001',
    title: 'Wi-Fi not working on 3rd Floor',
    category: 'Internet/Wi-Fi',
    location: 'Central Library Study Hall C',
    priority: 'High',
    description: 'The router in Hall C frequently disconnects every 2-3 minutes. Multiple students are unable to access research materials.',
    status: 'In Progress',
    userId: 'sarah@example.com',
    userName: 'Sarah Connor',
    createdAt: '2026-08-27 10:15 AM',
    updatedAt: '2026-08-28 02:30 PM'
  },
  {
    id: 'FIX-1002',
    title: 'Water tap leaking continuously',
    category: 'Plumbing',
    location: 'Hostel Block B, 2nd Floor Washroom',
    priority: 'Medium',
    description: 'The second faucet from the left is leaking clean water constantly. Needs a washer replacement.',
    status: 'Resolved',
    userId: 'sarah@example.com',
    userName: 'Sarah Connor',
    createdAt: '2026-08-25 08:45 AM',
    updatedAt: '2026-08-26 11:00 AM'
  },
  {
    id: 'FIX-1003',
    title: 'Broken corridor lighting',
    category: 'Electrical',
    location: 'Academic Building A, North Corridor',
    priority: 'High',
    description: 'Two fluorescent tubes are flickering and one is completely burnt out, making the staircase very dark after 6 PM.',
    status: 'Pending',
    userId: 'david@example.com',
    userName: 'David Miller',
    createdAt: '2026-08-28 04:20 PM',
    updatedAt: '2026-08-28 04:20 PM'
  },
  {
    id: 'FIX-1004',
    title: 'Classroom Projector HDMI issue',
    category: 'Maintenance',
    location: 'Room 304, Science Block',
    priority: 'Medium',
    description: 'The ceiling projector HDMI port produces green static on display. Faculty laptop cables were tested and work elsewhere.',
    status: 'In Progress',
    userId: 'sarah@example.com',
    userName: 'Sarah Connor',
    createdAt: '2026-08-28 01:10 PM',
    updatedAt: '2026-08-29 09:00 AM'
  },
  {
    id: 'FIX-1005',
    title: 'AC unit blowing warm air',
    category: 'Maintenance',
    location: 'Computer Lab 2, Engineering Wing',
    priority: 'Low',
    description: 'Air conditioner unit #2 is making a rattling noise and blowing room-temperature air.',
    status: 'Pending',
    userId: 'david@example.com',
    userName: 'David Miller',
    createdAt: '2026-08-29 11:00 AM',
    updatedAt: '2026-08-29 11:00 AM'
  }
];

// --- 1. LocalStorage Accessors ---

/**
 * Retrieve all complaints from LocalStorage
 * @returns {Array} Array of complaint objects
 */
function getComplaints() {
  const stored = localStorage.getItem(STORAGE_COMPLAINTS_KEY);
  if (!stored) {
    saveComplaints(DEFAULT_COMPLAINTS);
    return DEFAULT_COMPLAINTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing complaints:', e);
    return DEFAULT_COMPLAINTS;
  }
}

/**
 * Persist complaints array to LocalStorage
 * @param {Array} complaints 
 */
function saveComplaints(complaints) {
  localStorage.setItem(STORAGE_COMPLAINTS_KEY, JSON.stringify(complaints));
}

/**
 * Generate a sequential, unique complaint ID (e.g. FIX-1001, FIX-1006)
 * @returns {string}
 */
function generateComplaintId() {
  const complaints = getComplaints();
  if (!complaints || complaints.length === 0) {
    return 'FIX-1001';
  }

  // Find the highest numeric ID suffix
  let maxIdNum = 1000;
  complaints.forEach(item => {
    if (item.id && item.id.startsWith('FIX-')) {
      const num = parseInt(item.id.replace('FIX-', ''), 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });

  return `FIX-${maxIdNum + 1}`;
}

/**
 * Retrieve single complaint by ID
 * @param {string} id 
 * @returns {Object|undefined}
 */
function getComplaintById(id) {
  const complaints = getComplaints();
  return complaints.find(c => c.id.toUpperCase() === (id || '').toUpperCase());
}

/**
 * Retrieve complaints submitted by a specific user email
 * @param {string} userEmail 
 * @returns {Array}
 */
function getUserComplaints(userEmail) {
  const complaints = getComplaints();
  if (!userEmail) return [];
  return complaints.filter(
    c => c.userId && c.userId.toLowerCase() === userEmail.toLowerCase()
  );
}

// --- 2. Complaint CRUD Operations ---

/**
 * Create and persist a new complaint
 * @param {Object} data - { title, category, location, priority, description }
 * @returns {{success: boolean, complaint?: Object, message?: string}}
 */
function submitComplaint(data) {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: 'You must be logged in to submit a complaint.' };
  }

  // Validate fields
  const title = (data.title || '').trim();
  const category = (data.category || '').trim();
  const location = (data.location || '').trim();
  const priority = (data.priority || '').trim();
  const description = (data.description || '').trim();

  if (!title || !category || !location || !priority || !description) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  const newId = generateComplaintId();
  const nowFormatted = formatDateTime(new Date());

  const newComplaint = {
    id: newId,
    title: title,
    category: category,
    location: location,
    priority: priority,
    description: description,
    status: 'Pending',
    userId: user.email,
    userName: user.name,
    createdAt: nowFormatted,
    updatedAt: nowFormatted
  };

  const complaints = getComplaints();
  complaints.unshift(newComplaint); // Add newest first
  saveComplaints(complaints);

  return { success: true, complaint: newComplaint };
}

/**
 * Update the status of a complaint
 * @param {string} id 
 * @param {'Pending'|'In Progress'|'Resolved'} newStatus 
 * @returns {boolean}
 */
function updateComplaintStatus(id, newStatus) {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id.toUpperCase() === (id || '').toUpperCase());

  if (index === -1) return false;

  complaints[index].status = newStatus;
  complaints[index].updatedAt = formatDateTime(new Date());
  saveComplaints(complaints);

  return true;
}

// --- 3. User Dashboard View Logic (dashboard.html) ---

function initUserDashboard() {
  const user = requireAuth();
  if (!user) return;

  // Set personalized greeting
  const greetingEl = document.getElementById('user-welcome-name');
  if (greetingEl) {
    greetingEl.textContent = user.name;
  }

  const userComplaints = getUserComplaints(user.email);

  // Calculate statistics
  const total = userComplaints.length;
  const pending = userComplaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
  const inProgress = userComplaints.filter(c => (c.status || '').toLowerCase() === 'in progress').length;
  const resolved = userComplaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;

  // Update counters
  const totalEl = document.getElementById('stat-total');
  const pendingEl = document.getElementById('stat-pending');
  const progressEl = document.getElementById('stat-progress');
  const resolvedEl = document.getElementById('stat-resolved');

  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (progressEl) progressEl.textContent = inProgress;
  if (resolvedEl) resolvedEl.textContent = resolved;

  // Render recent 5 complaints
  const recentComplaints = userComplaints.slice(0, 5);
  const container = document.getElementById('recent-complaints-container');

  if (container) {
    if (recentComplaints.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No complaints reported yet</h3>
          <p>You have not submitted any complaints yet. Need something fixed? Let our team know.</p>
          <a href="report.html" class="btn btn-primary">+ Report Your First Issue</a>
        </div>
      `;
    } else {
      let rowsHtml = recentComplaints.map(c => `
        <tr>
          <td><a href="complaint-details.html?id=${escapeHTML(c.id)}" class="complaint-id-link">${escapeHTML(c.id)}</a></td>
          <td class="complaint-title-cell">
            <strong>${escapeHTML(c.title)}</strong>
            <small>📍 ${escapeHTML(c.location)}</small>
          </td>
          <td><span class="category-pill">${escapeHTML(c.category)}</span></td>
          <td>${getPriorityBadge(c.priority)}</td>
          <td>${escapeHTML(c.createdAt)}</td>
          <td>${getStatusBadge(c.status)}</td>
          <td>
            <a href="complaint-details.html?id=${escapeHTML(c.id)}" class="btn btn-secondary btn-sm">View Details</a>
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
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

// --- 4. Submit Complaint Form Page Logic (report.html) ---

function initReportPage() {
  const user = requireAuth();
  if (!user) return;

  const form = document.getElementById('report-complaint-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('complaint-title');
    const categorySelect = document.getElementById('complaint-category');
    const locationInput = document.getElementById('complaint-location');
    const prioritySelect = document.getElementById('complaint-priority');
    const descriptionInput = document.getElementById('complaint-description');

    const result = submitComplaint({
      title: titleInput.value,
      category: categorySelect.value,
      location: locationInput.value,
      priority: prioritySelect.value,
      description: descriptionInput.value
    });

    if (!result.success) {
      Toast.show(result.message, 'error');
      return;
    }

    Toast.show(`Issue ${result.complaint.id} submitted successfully!`, 'success');
    form.reset();

    // Redirect to user's complaints list after short delay
    setTimeout(() => {
      window.location.href = 'complaints.html';
    }, 1000);
  });
}

// --- 5. My Complaints Page (Search, Filter, List) (complaints.html) ---

function initMyComplaintsPage() {
  const user = requireAuth();
  if (!user) return;

  const searchInput = document.getElementById('filter-search');
  const categorySelect = document.getElementById('filter-category');
  const prioritySelect = document.getElementById('filter-priority');
  const statusSelect = document.getElementById('filter-status');
  const resetBtn = document.getElementById('btn-reset-filters');
  const countDisplay = document.getElementById('complaints-count-display');
  const container = document.getElementById('my-complaints-container');

  function applyFilters() {
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const category = categorySelect ? categorySelect.value : 'all';
    const priority = prioritySelect ? prioritySelect.value : 'all';
    const status = statusSelect ? statusSelect.value : 'all';

    let userComplaints = getUserComplaints(user.email);

    // Apply Filter conditions
    let filtered = userComplaints.filter(c => {
      // 1. Text search: matches ID, Title, or Location
      const matchSearch = !query || 
        (c.id && c.id.toLowerCase().includes(query)) ||
        (c.title && c.title.toLowerCase().includes(query)) ||
        (c.location && c.location.toLowerCase().includes(query));

      // 2. Category filter
      const matchCategory = (category === 'all') || (c.category === category);

      // 3. Priority filter
      const matchPriority = (priority === 'all') || (c.priority === priority);

      // 4. Status filter
      const matchStatus = (status === 'all') || (c.status === status);

      return matchSearch && matchCategory && matchPriority && matchStatus;
    });

    // Update count indicator
    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} of ${userComplaints.length} complaints`;
    }

    renderUserComplaintsList(filtered, container);
  }

  // Attach dynamic event listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categorySelect) categorySelect.addEventListener('change', applyFilters);
  if (prioritySelect) prioritySelect.addEventListener('change', applyFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = 'all';
      if (prioritySelect) prioritySelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      applyFilters();
      Toast.show('Filters cleared', 'info');
    });
  }

  // Initial render
  applyFilters();
}

/**
 * Render complaints cards / grid for user
 */
function renderUserComplaintsList(complaints, container) {
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No complaints found</h3>
        <p>No complaints match your search or selected filter criteria. Try adjusting your search terms.</p>
        <a href="report.html" class="btn btn-primary">+ Report New Issue</a>
      </div>
    `;
    return;
  }

  const cardsHtml = complaints.map(c => `
    <div class="complaint-item-card">
      <div>
        <div class="card-top">
          <span class="complaint-id">${escapeHTML(c.id)}</span>
          ${getStatusBadge(c.status)}
        </div>
        <h3 class="complaint-card-title">${escapeHTML(c.title)}</h3>
        <p class="complaint-card-desc">${escapeHTML(c.description)}</p>
      </div>

      <div>
        <div class="card-meta-list">
          <div class="card-meta-row">
            <span>📍 Location:</span>
            <strong>${escapeHTML(c.location)}</strong>
          </div>
          <div class="card-meta-row">
            <span>🏷️ Category:</span>
            <span class="category-pill">${escapeHTML(c.category)}</span>
          </div>
          <div class="card-meta-row">
            <span>⚡ Priority:</span>
            ${getPriorityBadge(c.priority)}
          </div>
          <div class="card-meta-row">
            <span>📅 Submitted:</span>
            <span>${escapeHTML(c.createdAt)}</span>
          </div>
        </div>

        <a href="complaint-details.html?id=${escapeHTML(c.id)}" class="btn btn-outline btn-sm btn-block">
          View Full Details & Track Status →
        </a>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div class="complaints-grid">${cardsHtml}</div>`;
}

// --- 6. Complaint Details & Visual Status Tracker View (complaint-details.html) ---

function initComplaintDetailsPage() {
  const user = requireAuth();
  if (!user) return;

  // Extract ID from URL (?id=FIX-1001)
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('id');

  const container = document.getElementById('complaint-details-container');
  if (!container) return;

  if (!complaintId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>No Complaint Selected</h3>
        <p>Please specify a valid complaint ID to view details.</p>
        <a href="${user.role === 'admin' ? 'admin.html' : 'complaints.html'}" class="btn btn-primary">Back to Complaints</a>
      </div>
    `;
    return;
  }

  const complaint = getComplaintById(complaintId);

  if (!complaint) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3>Complaint Not Found</h3>
        <p>The requested complaint with ID <strong>${escapeHTML(complaintId)}</strong> does not exist in the records.</p>
        <a href="${user.role === 'admin' ? 'admin.html' : 'complaints.html'}" class="btn btn-primary">Return to List</a>
      </div>
    `;
    return;
  }

  // If normal user, verify they own this complaint
  if (user.role !== 'admin' && complaint.userId && complaint.userId.toLowerCase() !== user.email.toLowerCase()) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h3>Unauthorized Access</h3>
        <p>You are not permitted to view complaints submitted by other users.</p>
        <a href="complaints.html" class="btn btn-primary">Back to My Complaints</a>
      </div>
    `;
    return;
  }

  // Render complete details view
  renderDetailsCard(complaint, user, container);
}

/**
 * Render the full details and step progress tracker
 */
function renderDetailsCard(complaint, user, container) {
  const currentStatus = (complaint.status || 'Pending').toLowerCase();

  // Determine tracker state classes
  let step1Class = 'tracker-step';
  let step2Class = 'tracker-step';
  let step3Class = 'tracker-step';
  let fillWidth = '0%';

  if (currentStatus === 'pending') {
    step1Class += ' active';
    fillWidth = '0%';
  } else if (currentStatus === 'in progress' || currentStatus === 'in-progress') {
    step1Class += ' completed';
    step2Class += ' active';
    fillWidth = '50%';
  } else if (currentStatus === 'resolved') {
    step1Class += ' completed';
    step2Class += ' completed';
    step3Class += ' active completed';
    fillWidth = '100%';
  }

  // Admin Quick Status Controller
  let adminControlsHtml = '';
  if (user.role === 'admin') {
    adminControlsHtml = `
      <div class="card" style="border: 2px solid var(--primary-light);">
        <div class="card-header" style="background: var(--primary-light);">
          <span class="card-title" style="color: var(--primary-dark);">🛠️ Admin Status Management</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
            As an Administrator, you can update the resolution status of this complaint directly.
          </p>
          <div class="form-group">
            <label for="admin-status-updater">Change Current Status:</label>
            <select id="admin-status-updater" class="form-control">
              <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending (Awaiting Review)</option>
              <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>In Progress (Assigned to Team)</option>
              <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved (Issue Fixed)</option>
            </select>
          </div>
          <button id="btn-save-admin-status" class="btn btn-primary btn-block">Update Status</button>
        </div>
      </div>
    `;
  }

  const backLink = user.role === 'admin' ? 'admin.html' : 'complaints.html';
  const backLabel = user.role === 'admin' ? '← Back to Admin Console' : '← Back to My Complaints';

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <a href="${backLink}" class="btn btn-secondary btn-sm">${backLabel}</a>
      <div>
        <button onclick="window.print()" class="btn btn-secondary btn-sm">🖨️ Print Report</button>
      </div>
    </div>

    <!-- Status Tracker Progress Card -->
    <div class="status-tracker-card">
      <div class="status-tracker-header">
        <div>
          <span style="font-family: monospace; font-weight: 700; color: var(--primary); font-size: 1.1rem;">
            ${escapeHTML(complaint.id)}
          </span>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem;">
            ${escapeHTML(complaint.title)}
          </h2>
        </div>
        <div>
          ${getStatusBadge(complaint.status)}
        </div>
      </div>

      <!-- 3-Step Visual Progress Tracker -->
      <div class="tracker-steps">
        <div class="tracker-line-bg"></div>
        <div class="tracker-line-fill" style="width: ${fillWidth};"></div>

        <div class="${step1Class}">
          <div class="step-circle">1</div>
          <div class="step-title">Pending</div>
          <div class="step-desc">Received & Queued</div>
        </div>

        <div class="${step2Class}">
          <div class="step-circle">2</div>
          <div class="step-title">In Progress</div>
          <div class="step-desc">Technician Assigned</div>
        </div>

        <div class="${step3Class}">
          <div class="step-circle">3</div>
          <div class="step-title">Resolved</div>
          <div class="step-desc">Fix Completed</div>
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="details-layout">
      <!-- Main Content Details -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Complaint Information</span>
          ${getPriorityBadge(complaint.priority)}
        </div>
        <div class="card-body">
          <div class="details-meta-grid">
            <div class="meta-item">
              <div class="meta-label">Category</div>
              <div class="meta-value">${escapeHTML(complaint.category)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Location</div>
              <div class="meta-value">📍 ${escapeHTML(complaint.location)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date Reported</div>
              <div class="meta-value">📅 ${escapeHTML(complaint.createdAt)}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Last Updated</div>
              <div class="meta-value">⏱️ ${escapeHTML(complaint.updatedAt || complaint.createdAt)}</div>
            </div>
          </div>

          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.6rem;">Issue Description</h4>
          <div class="description-box">
            <p style="white-space: pre-line;">${escapeHTML(complaint.description)}</p>
          </div>
        </div>
      </div>

      <!-- Sidebar: Submitter details and Admin action -->
      <div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Reporter Info</span>
          </div>
          <div class="card-body">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Submitted by:</p>
            <p style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-bottom: 0.2rem;">
              👤 ${escapeHTML(complaint.userName || 'Anonymous')}
            </p>
            <p style="font-size: 0.9rem; color: var(--text-muted);">
              ✉️ ${escapeHTML(complaint.userId || 'N/A')}
            </p>
          </div>
        </div>

        ${adminControlsHtml}
      </div>
    </div>
  `;

  // Attach Admin update listener if present
  if (user.role === 'admin') {
    const updateBtn = document.getElementById('btn-save-admin-status');
    const select = document.getElementById('admin-status-updater');

    if (updateBtn && select) {
      updateBtn.addEventListener('click', () => {
        const newStatus = select.value;
        const updated = updateComplaintStatus(complaint.id, newStatus);
        if (updated) {
          Toast.show(`Status updated to "${newStatus}"`, 'success');
          // Re-render
          setTimeout(() => {
            initComplaintDetailsPage();
          }, 300);
        } else {
          Toast.show('Failed to update status', 'error');
        }
      });
    }
  }
}
