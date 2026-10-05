export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
};

export const validateUsername = (username) => {
  const normalizedUsername = username.trim();
  const length = Array.from(normalizedUsername).length;
  if (length < 2) return 'Минимум 2 символа';
  if (length > 32) return 'Максимум 32 символа';
  if (!/^[A-Za-zА-Яа-яЁё0-9 _-]+$/u.test(normalizedUsername)) {
    return 'Только буквы, цифры, пробел, дефис и подчёркивание';
  }
  return null;
};

const allowedPasswordCharacters = /^[A-Za-z0-9!@#$%^&*()_+=\[\]{};:,.?/-]+$/;

export const validatePasswordLength = (password) => {
  const length = Array.from(password).length;
  if (length < 8) return 'Пароль должен быть не короче 8 символов';
  if (length > 32) return 'Пароль должен быть не длиннее 32 символов';
  return null;
};

export const validatePasswordMaxLength = (password) => {
  if (Array.from(password).length > 32) return 'Пароль должен быть не длиннее 32 символов';
  return null;
};

export const validatePasswordCharacters = (password) => {
  if (!allowedPasswordCharacters.test(password)) {
    return 'Только латинские буквы, цифры и символы !@#$%^&*()-_=+[]{};:,.?/';
  }
  return null;
};

export const validatePassword = (password) => {
  const lengthError = validatePasswordLength(password);
  if (lengthError) return lengthError;

  const characterError = validatePasswordCharacters(password);
  if (characterError) return characterError;

  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  
  return null;
};

export const showError = (boxEl, message) => {
  boxEl.textContent = message;
  boxEl.style.display = message ? 'block' : 'none';
};
