/**
 * FixIt - Digital Complaint and Issue Reporting System
 * Register Page Controller (js/register.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Prevent logged-in users from seeing registration page
  redirectIfLoggedIn();

  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passInput = document.getElementById('reg-password');
  const confirmPassInput = document.getElementById('reg-confirm-password');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const passError = document.getElementById('password-error');
  const confirmPassError = document.getElementById('confirm-password-error');

  function clearErrors() {
    [nameError, emailError, passError, confirmPassError].forEach(el => {
      if (el) el.classList.remove('active');
    });
    [nameInput, emailInput, passInput, confirmPassInput].forEach(el => {
      if (el) el.classList.remove('error');
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passInput.value;
      const confirmPassword = confirmPassInput.value;

      let hasError = false;

      if (!name) {
        nameError.textContent = 'Please enter your full name.';
        nameError.classList.add('active');
        nameInput.classList.add('error');
        hasError = true;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('active');
        emailInput.classList.add('error');
        hasError = true;
      }

      if (!password || password.length < 6) {
        passError.textContent = 'Password must be at least 6 characters long.';
        passError.classList.add('active');
        passInput.classList.add('error');
        hasError = true;
      }

      if (password !== confirmPassword) {
        confirmPassError.textContent = 'Passwords do not match.';
        confirmPassError.classList.add('active');
        confirmPassInput.classList.add('error');
        hasError = true;
      }

      if (hasError) return;

      // Register user into LocalStorage
      const result = registerUser(name, email, password);

      if (!result.success) {
        Toast.show(result.message, 'error');
        emailError.textContent = result.message;
        emailError.classList.add('active');
        emailInput.classList.add('error');
        return;
      }

      Toast.show(result.message, 'success');
      form.reset();

      // Redirect to login page
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    });
  }
});
