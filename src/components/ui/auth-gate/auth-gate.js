import { BaseComponent } from '../base-component.js';
const template = window.Handlebars.compile(`
  <div class="auth-gate">
    <span class="auth-gate__icon" aria-hidden="true">✦</span>
    <h3>Доступно после регистрации</h3>
    <p>Войдите в аккаунт, чтобы открыть подборку «Для вас».</p>
    <div class="auth-gate__actions"><a href="/register" data-link>Зарегистрироваться</a><a href="/login" data-link>Уже есть аккаунт? Войти</a></div>
  </div>
`);
export class AuthGate extends BaseComponent { constructor() { super(template, {}); } }
export const createAuthGate = () => new AuthGate().render();
