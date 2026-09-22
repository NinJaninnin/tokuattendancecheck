/**
 * Google Identity Services & Offline Authentication Controller
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
        btnContainer.style.display = 'flex';
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
        picture: payload.picture,
        isGoogle: true
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

  // 1. 오프라인 플레이 (게스트 즉시 시작)
  loginOffline() {
    let savedId = localStorage.getItem('toku_offline_uid');
    if (!savedId) {
      savedId = 'offline_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('toku_offline_uid', savedId);
    }

    const authData = {
      uid: savedId,
      name: '모험가',
      isOffline: true
    };

    this.completeLogin(authData);
  }

  // 2. 구글 이메일 직접 연동 로그인
  loginWithGoogleEmail(email) {
    if (!email || !email.includes('@')) {
      alert('유효한 구글 이메일 주소를 입력해 주세요.');
      return false;
    }

    const cleanEmail = email.trim().toLowerCase();
    // 이메일 기반 고유 UID 생성
    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = ((hash << 5) - hash) + cleanEmail.charCodeAt(i);
      hash |= 0;
    }
    const safeHash = Math.abs(hash).toString(16);
    const uid = `google_${safeHash}_${cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

    const authData = {
      uid: uid,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      isGoogle: true
    };

    this.completeLogin(authData);
    return true;
  }

  // 구글 로그인 트리거 (GIS 지원 여부에 따른 지능형 안내)
  triggerGoogleLogin() {
    const clientId = window.api.getGoogleClientId();
    if (clientId && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (e) {}
    }
    // GIS 미설정 시 구글 계정 입력 모달 오픈
    if (window.app) {
      window.app.openModal('modal-google-auth');
    }
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

