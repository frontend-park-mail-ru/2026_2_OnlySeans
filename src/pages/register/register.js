import { createAuthPage } from '../login/auth-form.js';

export class RegisterPage {
  constructor({ navigate }) { this.navigate = navigate; }
  render() { return createAuthPage({ mode: 'register', navigate: this.navigate }); }
}
