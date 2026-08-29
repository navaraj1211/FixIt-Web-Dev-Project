/* =========================================================
   FixIt — complaints.js
   The shared "data layer" for complaints: create, read,
   update status, and helper functions for filtering/search.
   Used by both the user pages and the admin pages.

   Complaint object shape:
   {
     id: "FIX-1001",
     title: "Broken classroom light",
     category: "Electrical",
     location: "Room 203",
     priority: "High",
     description: "The main light is not working.",
     additionalInfo: "",
     submittedBy: "user@example.com",
     submittedByName: "Jane Doe",
     date: "2026-08-29T10:15:00.000Z",
     status: "Pending"
   }
   ========================================================= */

const COMPLAINTS_KEY = 'fixit_complaints';
const LAST_ID_KEY = 'fixit_lastComplaintId';

function getComplaints() {
  const raw = localStorage.getItem(COMPLAINTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveComplaints(complaints) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
}

// Generates the next sequential ticket ID, e.g. FIX-1001, FIX-1002...
function generateComplaintId() {
  let lastId = parseInt(localStorage.getItem(LAST_ID_KEY), 10);
  if (isNaN(lastId)) lastId = 1000;
  const nextId = lastId + 1;
  localStorage.setItem(LAST_ID_KEY, String(nextId));
  return 'FIX-' + nextId;
}

// Creates and stores a new complaint. Returns the created object.
function addComplaint(data) {
  const complaints = getComplaints();

  const complaint = {
    id: generateComplaintId(),
    title: data.title,
    category: data.category,
    location: data.location,
    priority: data.priority,
    description: data.description,
    additionalInfo: data.additionalInfo || '',
    submittedBy: data.submittedBy,
    submittedByName: data.submittedByName,
    date: new Date().toISOString(),
    status: 'Pending'
  };

  complaints.push(complaint);
  saveComplaints(complaints);
  return complaint;
}

// Returns only the complaints submitted by a given user email.
function getComplaintsByUser(email) {
  return getComplaints().filter(c => c.submittedBy.toLowerCase() === email.toLowerCase());
}

// Finds a single complaint by its ID.
function getComplaintById(id) {
  return getComplaints().find(c => c.id === id) || null;
}

// Updates the status of a complaint (used by the admin). Returns true/false.
function updateComplaintStatus(id, newStatus) {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) return false;

  complaints[index].status = newStatus;
  saveComplaints(complaints);
  return true;
}

// Filters a list of complaints by a free-text search term across
// ID, title, and location (and, for admins, the submitter's name).
function searchComplaints(list, term) {
  if (!term) return list;
  const lower = term.toLowerCase();
  return list.filter(c =>
    c.id.toLowerCase().includes(lower) ||
    c.title.toLowerCase().includes(lower) ||
    c.location.toLowerCase().includes(lower) ||
    (c.submittedByName && c.submittedByName.toLowerCase().includes(lower))
  );
}

// Applies category / priority / status filters together.
// Pass "" for any filter that should be ignored.
function filterComplaints(list, { category, priority, status }) {
  return list.filter(c =>
    (!category || c.category === category) &&
    (!priority || c.priority === priority) &&
    (!status || c.status === status)
  );
}

// Small helper: turn a status string into its CSS badge class suffix.
function statusBadgeClass(status) {
  if (status === 'Pending') return 'badge-pending';
  if (status === 'In Progress') return 'badge-in-progress';
  if (status === 'Resolved') return 'badge-resolved';
  return '';
}

function priorityBadgeClass(priority) {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  if (priority === 'High') return 'badge-high';
  return '';
}
