import { createAuthPage } from './auth-form.js';

export class LoginPage {
  constructor({ navigate }) { this.navigate = navigate; }
  render() { return createAuthPage({ mode: 'login', navigate: this.navigate }); }
}
