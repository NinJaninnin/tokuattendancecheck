/**
 * Google Identity Services & Mock Authentication Controller
 */
class AuthController {
  constructor() {
    this.currentUser = null;
    this.onLoginSuccess = null;
    this.sessionKey = 'toku_auth_session';
  }

  init() {
    this.initGoogleIdentity();
    this.checkSavedSession();
  }

  // Google Identity Services (GIS) 초기화
  initGoogleIdentity() {
    const clientId = window.api.getGoogleClientId();
    if (!clientId || !window.google || !window.google.accounts) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => this.handleGoogleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-btn-container');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'ko'
        });
      }
    } catch (err) {
      console.warn('Google Identity init error:', err);
    }
  }

  // 구글 JWT 토큰 파싱
  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;

    try {
      const payload = this.decodeJwtResponse(response.credential);
      const authData = {
        uid: `google_${payload.sub}`,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        picture: payload.picture
      };

      this.completeLogin(authData);
    } catch (e) {
      console.error('Failed to parse Google credential:', e);
      alert('구글 로그인 처리 중 오류가 발생했습니다.');
    }
  }

  decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  // 개발 및 빠른 테스트용 간편 로그인
  loginWithMock(nickname = '') {
    let savedId = localStorage.getItem('toku_mock_uid');
    if (!savedId) {
      savedId = 'dev_user_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('toku_mock_uid', savedId);
    }

    const authData = {
      uid: savedId,
      name: nickname.trim() || `용사_${savedId.slice(-4)}`
    };

    this.completeLogin(authData);
  }

  async completeLogin(authData) {
    localStorage.setItem(this.sessionKey, JSON.stringify(authData));
    if (this.onLoginSuccess) {
      await this.onLoginSuccess(authData);
    }
  }

  checkSavedSession() {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        const authData = JSON.parse(saved);
        if (authData && authData.uid) {
          if (this.onLoginSuccess) {
            this.onLoginSuccess(authData);
          }
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
    window.userModel.logout();
    window.location.reload();
  }
}

window.authController = new AuthController();
