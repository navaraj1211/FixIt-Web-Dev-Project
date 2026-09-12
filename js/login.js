/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Login Page Controller (js/login.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already authenticated
  redirectIfLoggedIn();

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  // Demo Auto-fill buttons
  const btnFillAdmin = document.getElementById('btn-fill-admin');
  if (btnFillAdmin) {
    btnFillAdmin.addEventListener('click', () => {
      emailInput.value = 'admin@fixit.com';
      passwordInput.value = 'admin123';
      clearErrors();
    });
  }

  const btnFillUser = document.getElementById('btn-fill-user');
  if (btnFillUser) {
    btnFillUser.addEventListener('click', () => {
      emailInput.value = 'sarah@example.com';
      passwordInput.value = 'password123';
      clearErrors();
    });
  }

  function clearErrors() {
    if (emailError) emailError.classList.remove('active');
    if (passwordError) passwordError.classList.remove('active');
    if (emailInput) emailInput.classList.remove('error');
    if (passwordInput) passwordInput.classList.remove('error');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      let hasError = false;

      if (!email) {
        emailError.textContent = 'Please enter your email address.';
        emailError.classList.add('active');
        emailInput.classList.add('error');
        hasError = true;
      }

      if (!password) {
        passwordError.textContent = 'Please enter your password.';
        passwordError.classList.add('active');
        passwordInput.classList.add('error');
        hasError = true;
      }

      if (hasError) return;

      // Perform authentication check via LocalStorage
      const result = loginUser(email, password);

      if (!result.success) {
        Toast.show(result.message, 'error');
        passwordError.textContent = result.message;
        passwordError.classList.add('active');
        return;
      }

      Toast.show(`Welcome back, ${result.user.name}!`, 'success');

      // Role-based redirection
      setTimeout(() => {
        if (result.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 600);
    });
  }
});
