const length = (value: string) => Array.from(value).length;
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME = /^[\p{L}0-9\s_-]+$/u;
const PASSWORD_CHARS = /^[A-Za-z0-9!@#$%^&*()_+=[\]{};:,.?/-]+$/;

export const LIMITS = { email: 254, username: 32, password: 32 };

export function checkEmail(value: string) {
  if (!value.trim()) return 'Введите email';
  if (length(value.trim()) > LIMITS.email) return `Максимум ${LIMITS.email} символа`;
  return EMAIL.test(value.trim()) ? '' : 'Введите корректный email';
}

export function checkUsername(value: string) {
  const name = value.trim();
  if (length(name) < 2) return 'Минимум 2 символа';
  if (length(name) > LIMITS.username) return `Максимум ${LIMITS.username} символа`;
  if (!USERNAME.test(name)) return 'Только буквы, цифры, пробел, дефис и подчёркивание';
  return '';
}

export function checkNewPassword(value: string) {
  if (length(value) < 8) return 'Пароль должен быть не короче 8 символов';
  if (length(value) > LIMITS.password) return 'Пароль должен быть не длиннее 32 символов';
  if (!PASSWORD_CHARS.test(value))
    return 'Только латинские буквы, цифры и символы !@#$%^&*()-_=+[]{};:,.?/';
  if (!/[A-Z]/.test(value)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[0-9]/.test(value)) return 'Пароль должен содержать хотя бы одну цифру';
  return '';
}

export const checkPassword = (value: string) => (value ? '' : 'Введите пароль');
