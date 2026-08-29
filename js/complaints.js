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
  if (!raw) {
    seedInitialComplaints();
    const seeded = localStorage.getItem(COMPLAINTS_KEY);
    return seeded ? JSON.parse(seeded) : [];
  }
  return JSON.parse(raw);
}

function seedInitialComplaints() {
  const initial = [
    {
      id: 'FIX-1001',
      title: 'Flickering fluorescent light in Room 302',
      category: 'Electrical',
      location: 'Block A, 3rd Floor, Room 302',
      priority: 'Medium',
      description: 'The tube light above row 2 keeps flickering continuously making it hard to study.',
      additionalInfo: 'Please repair during break time',
      submittedBy: 'user@fixit.com',
      submittedByName: 'Standard User',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: 'Pending'
    },
    {
      id: 'FIX-1002',
      title: 'Water tap leaking in 2nd floor restroom',
      category: 'Plumbing',
      location: 'Main Building, 2nd Floor Restroom',
      priority: 'High',
      description: 'Sink tap cannot be closed properly and water is continuously dripping onto the floor.',
      additionalInfo: 'Water puddle forming near entrance',
      submittedBy: 'user@fixit.com',
      submittedByName: 'Standard User',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'In Progress'
    },
    {
      id: 'FIX-1003',
      title: 'Library Wi-Fi router reboot required',
      category: 'Internet / Wi-Fi',
      location: 'Central Library, Reading Zone B',
      priority: 'High',
      description: 'Wi-Fi connection drops every 5 minutes in the silent study zone.',
      additionalInfo: 'Technician already replaced access point',
      submittedBy: 'user@fixit.com',
      submittedByName: 'Standard User',
      date: new Date(Date.now() - 3600000 * 12).toISOString(),
      status: 'Resolved'
    }
  ];
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(initial));
  localStorage.setItem(LAST_ID_KEY, '1003');
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

// Called by the user to confirm that a resolved issue is truly fixed.
// Moves status from "Resolved" to "Closed" and records the confirmation.
function confirmResolution(id) {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) return false;
  if (complaints[index].status !== 'Resolved') return false;

  complaints[index].status = 'Closed';
  complaints[index].closedDate = new Date().toISOString();
  complaints[index].closedByUser = true;
  saveComplaints(complaints);
  return true;
}

// Called by the user when a "Resolved" complaint isn't actually fixed.
// Moves status back to "In Progress" and records the reason.
function reopenComplaint(id, reason) {
  const complaints = getComplaints();
  const index = complaints.findIndex(c => c.id === id);
  if (index === -1) return false;
  if (complaints[index].status !== 'Resolved') return false;

  complaints[index].status = 'In Progress';
  complaints[index].reopenReason = reason || 'Issue not fully resolved.';
  complaints[index].reopenDate = new Date().toISOString();
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
  if (status === 'Closed') return 'badge-closed';
  return '';
}

function priorityBadgeClass(priority) {
  if (priority === 'Low') return 'badge-low';
  if (priority === 'Medium') return 'badge-medium';
  if (priority === 'High') return 'badge-high';
  return '';
}
