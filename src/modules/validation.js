export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return re.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 8) return 'Пароль должен быть не короче 8 символов';
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  
  return null;
};

export const showError = (boxEl, message) => {
  boxEl.textContent = message;
  boxEl.style.display = message ? 'block' : 'none';
};
