/* =========================================================
   FixIt — auth.js
   Handles registration, login/logout, the "current user"
   session, and simple role-based route protection.

   LocalStorage keys used:
     fixit_users       -> array of user objects
     fixit_currentUser -> the currently logged in user object
     fixit_complaints  -> array of complaint objects (see complaints.js)
   ========================================================= */

const USERS_KEY = 'fixit_users';
const CURRENT_USER_KEY = 'fixit_currentUser';

// ---------------------------------------------------------
// Academic note: this project has no real backend, so the
// "admin" account is seeded directly into LocalStorage the
// first time the site is opened, instead of being created
// through the public registration form. This is explained
// in the project documentation as a simplification — a real
// production system would manage admin accounts on a secure
// server, not in the browser's LocalStorage.
// ---------------------------------------------------------
const ADMIN_EMAIL = 'admin@fixit.com';
const ADMIN_PASSWORD = 'Admin@123';

function seedAdminAccount() {
  const users = getUsers();
  const adminExists = users.some(u => u.email.toLowerCase() === ADMIN_EMAIL);
  if (!adminExists) {
    users.push({
      name: 'FixIt Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Basic email format check — good enough for a student project.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Register a new normal user. Always role: "user" — admins
// cannot be created through this form.
function registerUser(name, email, password) {
  const users = getUsers();

  if (!isValidEmail(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (password.length < 4) {
    return { success: false, message: 'Password should be at least 4 characters.' };
  }
  const duplicate = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return { success: false, message: 'This email is already registered.' };
  }

  const newUser = { name, email, password, role: 'user' };
  users.push(newUser);
  saveUsers(users);

  return { success: true, message: 'Account created successfully! You can now log in.' };
}

// Log a user in (used by both the user login page and the
// admin login page). Returns the matching user on success.
function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return { success: false, message: 'Incorrect email or password.' };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
}

// Same as loginUser, but only succeeds if the account's role is "admin".
// Used on the admin login page so a normal user account can't get in.
function loginAdmin(email, password) {
  const result = loginUser(email, password);
  if (!result.success) return result;

  if (result.user.role !== 'admin') {
    localStorage.removeItem(CURRENT_USER_KEY);
    return { success: false, message: 'This account does not have admin access.' };
  }
  return result;
}

function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Redirects away if nobody is logged in, or if the logged-in
// user doesn't have the required role. Call at the top of
// protected pages.
function requireRole(role) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = role === 'admin' ? 'admin-login.html' : 'login.html';
    return null;
  }
  if (user.role !== role) {
    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    return null;
  }
  return user;
}

// Wire up every ".btn-logout" button on the page.
document.addEventListener('DOMContentLoaded', () => {
  seedAdminAccount();
  document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
      window.location.href = 'index.html';
    });
  });
});
