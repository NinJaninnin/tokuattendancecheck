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
    } catch (e) {}

    // 3. GitHub Pages 및 정적 배포용 data/sheet_cache.json 직접 로드
    try {
      const resp = await fetch('data/sheet_cache.json');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.cardlist && data.cardlist.length > 0) {
          data.success = true;
          data.sheetConnected = true;
          console.log(`[API] Loaded ${data.cardlist.length} cards from data/sheet_cache.json (GitHub Pages mode)`);
          return data;
        }
      }
    } catch (e) {
      console.warn('[API] Failed to fetch static sheet_cache.json:', e);
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

  // 가챠 실행 (서버 우선, GitHub Pages 및 오프라인 자동 폴백)
  async drawGacha(uid, isMulti) {
    try {
      const resp = await fetch('/api/gacha/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isMulti })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success !== undefined) {
          return data;
        }
      }
    } catch (e) {}

    // GitHub Pages / 오프라인 폴백 처리
    const user = window.userModel.getUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    const cost = isMulti ? 1000 : 100;
    if ((user.points || 0) < cost) {
      return {
        success: false,
        reason: 'NOT_ENOUGH_POINTS',
        currentPoints: user.points,
        message: `포인트가 부족합니다. (필요: ${cost}P, 보유: ${user.points}P)`
      };
    }

    const drawRes = isMulti
      ? window.gachaSystem.executeMultiDraw(user)
      : window.gachaSystem.executeSingleDraw(user);

    if (!drawRes || !drawRes.success) {
      return drawRes || { success: false, message: '가챠 추첨 실패' };
    }

    user.points -= cost;
    if (!user.owned_cards) user.owned_cards = {};
    drawRes.cards.forEach(c => {
      user.owned_cards[c.card_id] = (user.owned_cards[c.card_id] || 0) + 1;
    });
    user.total_sp = window.gameData.calculateTotalSP(user.owned_cards);
    user.updated_at = new Date().toISOString();

    await this.saveUser(user);

    return {
      success: true,
      cards: drawRes.cards,
      user: user,
      totalSpGained: drawRes.totalSpGained,
      highestRank: drawRes.highestRank
    };
  }

  // 일일 출석체크 실행 (서버 우선, GitHub Pages 및 오프라인 자동 폴백)
  async checkAttendance(uid) {
    try {
      const resp = await fetch('/api/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success !== undefined) {
          return data;
        }
      }
    } catch (e) {}

    // GitHub Pages / 오프라인 폴백 처리
    const user = window.userModel.getUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    const today = window.userModel.getTodayDateString();
    if (user.last_attendance_date === today) {
      return {
        success: false,
        alreadyChecked: true,
        today: today,
        message: '오늘 이미 출석체크를 완료하셨습니다.'
      };
    }

    user.points = (user.points || 0) + 1000;
    user.last_attendance_date = today;
    user.updated_at = new Date().toISOString();
    await this.saveUser(user);

    return {
      success: true,
      reward: 1000,
      today: today,
      user: user
    };
  }

  // 접속 시간 검증 및 포인트 정산 (서버 우선, GitHub Pages 및 오프라인 자동 폴백)
  async syncTime(uid) {
    try {
      const resp = await fetch('/api/time/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success !== undefined) {
          return data;
        }
      }
    } catch (e) {}

    // GitHub Pages / 오프라인 폴백 처리
    const user = window.userModel.getUser();
    if (!user) return { success: false };

    const now = Date.now();
    const lastSync = user.last_sync_timestamp || now;
    const elapsed = now - lastSync;
    let pointsEarned = 0;

    if (elapsed >= 60000) {
      pointsEarned = Math.floor(elapsed / 60000);
      user.points = (user.points || 0) + pointsEarned;
      user.last_sync_timestamp = lastSync + (pointsEarned * 60000);
      user.updated_at = new Date().toISOString();
      await this.saveUser(user);
    }

    const nextRemaining = 60000 - ((now - (user.last_sync_timestamp || now)) % 60000);
    const remainingSec = Math.max(1, Math.ceil(nextRemaining / 1000));

    return {
      success: true,
      pointsEarned,
      currentPoints: user.points,
      remainingSec,
      user
    };
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
