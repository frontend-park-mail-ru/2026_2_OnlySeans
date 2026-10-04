import { HomePage } from '../home/home.js';
import { createAuthModal } from '../../components/ui/auth-modal/auth-modal.js';

class AuthModalPage {
  constructor({ navigate }, path) {
    this.navigate = navigate;
    this.path = path;
  }

  render() {
    const page = new HomePage({ navigate: this.navigate }).render();
    page.appendChild(createAuthModal({ path: this.path, onClose: () => this.navigate('/') }));

    return page;
  }
}

export class LoginModalPage extends AuthModalPage {
  constructor(props) {
    super(props, '/login');
  }
}

export class RegisterModalPage extends AuthModalPage {
  constructor(props) {
    super(props, '/register');
  }
}
