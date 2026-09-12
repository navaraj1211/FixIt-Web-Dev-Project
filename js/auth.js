/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Authentication & Access Control (js/auth.js)
 * 
 * Handles:
 * - User and Admin accounts in LocalStorage ('fixit_users')
 * - Current session state ('fixit_currentUser')
 * - Registration, Login, and Logout logic
 * - Client-side Route Guards (requireAuth, requireAdmin, redirectIfLoggedIn)
 */

// Storage keys
const STORAGE_USERS_KEY = 'fixit_users';
const STORAGE_CURRENT_USER_KEY = 'fixit_currentUser';

// Predefined Demo Accounts
const DEFAULT_USERS = [
  {
    id: 'USR-ADMIN',
    name: 'Admin Manager',
    email: 'admin@fixit.com',
    password: 'admin123',
    role: 'admin',
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'USR-1001',
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'user',
    createdAt: '2026-08-15T10:30:00.000Z'
  },
  {
    id: 'USR-1002',
    name: 'David Miller',
    email: 'david@example.com',
    password: 'password123',
    role: 'user',
    createdAt: '2026-08-20T14:15:00.000Z'
  }
];

// --- 1. LocalStorage Helpers for Users ---

/**
 * Retrieve all registered users from LocalStorage
 * Initializes default accounts if empty
 * @returns {Array} Array of user objects
 */
function getUsers() {
  const stored = localStorage.getItem(STORAGE_USERS_KEY);
  if (!stored) {
    saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  try {
    let users = JSON.parse(stored);
    if (!Array.isArray(users)) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }

    let updated = false;
    DEFAULT_USERS.forEach(defaultUser => {
      const idx = users.findIndex(u => u && u.email && u.email.toLowerCase() === defaultUser.email.toLowerCase());
      if (idx === -1) {
        users.push(defaultUser);
        updated = true;
      } else {
        // Ensure default demo credentials and roles are always restored if corrupted
        if (users[idx].password !== defaultUser.password || users[idx].role !== defaultUser.role) {
          users[idx].password = defaultUser.password;
          users[idx].role = defaultUser.role;
          updated = true;
        }
      }
    });

    if (updated) {
      saveUsers(users);
    }
    return users;
  } catch (e) {
    console.error('Error parsing users from LocalStorage:', e);
    saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
}

/**
 * Save users list to LocalStorage
 * @param {Array} users 
 */
function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

/**
 * Retrieve currently logged-in user from LocalStorage
 * @returns {Object|null}
 */
function getCurrentUser() {
  const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    if (!user || typeof user !== 'object' || !user.email) {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      return null;
    }
    return user;
  } catch (e) {
    console.error('Error parsing current user:', e);
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    return null;
  }
}

/**
 * Save current authenticated user session
 * @param {Object} user 
 */
function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  } else {
    // Strip sensitive password field from session representation
    const sessionUser = {
      id: user.id || ('USR-' + Date.now()),
      name: user.name || 'User',
      email: user.email,
      role: user.role || 'user'
    };
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(sessionUser));
  }
}

// --- 2. User Registration & Login Operations ---

/**
 * Register a new user account
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {{success: boolean, message: string}}
 */
function registerUser(name, email, password) {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  // Basic validation
  if (!trimmedName || !trimmedEmail || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const users = getUsers();

  // Check for duplicate email
  const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return { success: false, message: 'An account with this email address already exists.' };
  }

  // Create new user object
  const newUser = {
    id: 'USR-' + (1000 + users.length + 1),
    name: trimmedName,
    email: trimmedEmail,
    password: password,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: 'Registration successful! You can now log in.' };
}

/**
 * Authenticate a user by email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {{success: boolean, user?: Object, message?: string}}
 */
function loginUser(email, password) {
  const trimmedEmail = email.trim().toLowerCase();
  const users = getUsers();

  const user = users.find(
    u => u.email.toLowerCase() === trimmedEmail && u.password === password
  );

  if (!user) {
    return { success: false, message: 'Invalid email or password. Please try again.' };
  }

  // Store in active session
  setCurrentUser(user);

  return { success: true, user: user };
}

/**
 * Terminate user session and redirect to login page
 */
function logoutUser() {
  setCurrentUser(null);
  Toast.show('You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
}

// --- 3. Client-Side Route Guards ---

/**
 * Restricts access to authenticated users only
 * Call at top of protected pages (dashboard, report, complaints, details)
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    Toast.show('Please log in to access this page.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
    return null;
  }
  return user;
}

/**
 * Restricts access strictly to Admin role
 * Call at top of admin pages (admin.html)
 */
function requireAdmin() {
  const user = getCurrentUser();
  if (!user) {
    Toast.show('Please log in with admin credentials.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
    return null;
  }

  if (user.role !== 'admin') {
    Toast.show('Access Denied: Administrator role required.', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
    return null;
  }
  return user;
}

/**
 * Redirects already logged-in users away from Login and Register pages
 */
function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (user) {
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }
}
