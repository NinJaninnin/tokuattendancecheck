/**
 * API Service for Google Apps Script & Local Server Sync
 */
class ApiService {
  constructor() {
    this.gasUrlKey = 'toku_gas_webapp_url';
    this.googleClientIdKey = 'toku_google_client_id';
    this.gasUrl = localStorage.getItem(this.gasUrlKey) || '';
    this.googleClientId = localStorage.getItem(this.googleClientIdKey) || '';
  }

  setGasUrl(url) {
    this.gasUrl = (url || '').trim();
    localStorage.setItem(this.gasUrlKey, this.gasUrl);
  }

  getGasUrl() {
    return this.gasUrl;
  }

  setGoogleClientId(clientId) {
    this.googleClientId = (clientId || '').trim();
    localStorage.setItem(this.googleClientIdKey, this.googleClientId);
  }

  getGoogleClientId() {
    return this.googleClientId;
  }

  // 카드/등급/확률 메타데이터 가져오기
  async fetchMetadata() {
    // 1. Google Apps Script 우선 시도
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getMetadata`, { method: 'GET' });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            console.log('[API] Fetched metadata from Google Sheet Apps Script');
            return data;
          }
        }
      } catch (err) {
        console.warn('[API] Failed to fetch from GAS, falling back to local:', err);
      }
    }

    // 2. 로컬 서버 시도
    try {
      const resp = await fetch('/api/metadata');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {
      console.log('[API] Running fully offline/client-side');
    }

    return null;
  }

  // 랭킹 1위~10위 조회
  async fetchRankings() {
    // 1. Google Apps Script 시도
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getRankings`, { method: 'GET' });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            return data;
          }
        }
      } catch (err) {
        console.warn('[API] Failed to fetch rankings from GAS:', err);
      }
    }

    // 2. 로컬 서버 시도
    try {
      const resp = await fetch('/api/rankings');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {}

    // 3. 로컬 목업 랭킹 반환
    return this.getMockRankings();
  }

  // 유저 데이터 저장 (GAS & 로컬 & 로컬스토리지 동시 동기화)
  async saveUser(user) {
    if (!user || !user.uid) return false;

    // 로컬스토리지 캐시
    try {
      localStorage.setItem(`toku_user_${user.uid}`, JSON.stringify(user));
    } catch (e) {}

    let gasSuccess = false;
    // 1. Google Apps Script 전송 (CORS 안전을 위해 text/plain 또는 URL인코딩 전송 지원)
    if (this.gasUrl) {
      try {
        const payload = JSON.stringify({ action: 'saveUser', user: user });
        const resp = await fetch(this.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload
        });
        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson.success) {
            gasSuccess = true;
            console.log('[API] User synced with Google Sheet successfully!');
          }
        }
      } catch (err) {
        console.warn('[API] GAS sync failed:', err);
      }
    }

    // 2. 로컬 서버 동기화
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveUser', user: user })
      });
    } catch (e) {}

    return true;
  }

  // 유저 데이터 불러오기
  async fetchUser(uid) {
    if (!uid) return null;

    // 1. GAS 조회
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getUser&uid=${encodeURIComponent(uid)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.user) {
            return data.user;
          }
        }
      } catch (e) {}
    }

    // 2. 로컬 서버 조회
    try {
      const resp = await fetch(`/api/user?uid=${encodeURIComponent(uid)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
    } catch (e) {}

    // 3. 로컬스토리지 조회
    try {
      const cached = localStorage.getItem(`toku_user_${uid}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    return null;
  }

  // 구글 시트 직접 동기화 요청
  async syncGoogleSheet() {
    try {
      const resp = await fetch('/api/sync-sheet', { method: 'POST' });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
    return { success: false, message: '서버 응답 오류' };
  }

  // [치트 방지] 서버 측 가챠 실행
  async drawGacha(uid, isMulti) {
    try {
      const resp = await fetch('/api/gacha/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isMulti })
      });
      return await resp.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // [치트 방지] 서버 측 일일 출석체크 실행
  async checkAttendance(uid) {
    try {
      const resp = await fetch('/api/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      return await resp.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // [치트 방지] 서버 측 접속 시간 검증 및 포인트 정산
  async syncTime(uid) {
    try {
      const resp = await fetch('/api/time/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      return await resp.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // 시트 데이터(텍스트/TSV/CSV) 직접 붙여넣기 저장
  async pasteSheetData(text) {
    try {
      const resp = await fetch('/api/paste-sheet-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
    return { success: false, message: '서버 응답 오류' };
  }

  getMockRankings() {
    const mockUsers = [
      { rank: 1, uid: 'ai_01', nickname: '전설의마스터', main_character: 'card_0007', total_sp: 18450 },
      { rank: 2, uid: 'ai_02', nickname: '빛의수호자', main_character: 'card_0000', total_sp: 14200 },
      { rank: 3, uid: 'ai_03', nickname: '가챠장인', main_character: 'card_0022', total_sp: 11800 },
      { rank: 4, uid: 'ai_04', nickname: '카이저', main_character: 'card_0065', total_sp: 9400 },
      { rank: 5, uid: 'ai_05', nickname: '출석왕', main_character: 'card_0078', total_sp: 8150 },
      { rank: 6, uid: 'ai_06', nickname: '성검의기사', main_character: 'card_0156', total_sp: 7300 },
      { rank: 7, uid: 'ai_07', nickname: '루비나이트', main_character: 'card_0009', total_sp: 6200 },
      { rank: 8, uid: 'ai_08', nickname: '사파이어', main_character: 'card_0012', total_sp: 5100 },
      { rank: 9, uid: 'ai_09', nickname: '질풍노도', main_character: 'card_0018', total_sp: 4350 },
      { rank: 10, uid: 'ai_10', nickname: '초보모험가', main_character: 'card_0033', total_sp: 3800 }
    ];

    return {
      success: true,
      rankings: mockUsers,
      total_users: 10,
      updated_at: new Date().toISOString()
    };
  }
}

window.api = new ApiService();
