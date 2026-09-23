
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

  isLocalServer() {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (proto !== 'http:' && proto !== 'https:') return false;
    if (host.endsWith('github.io')) return false;
    return host === 'localhost' ||
           host === '127.0.0.1' ||
           host === '[::1]' ||
           host.startsWith('192.168.') ||
           host.startsWith('10.') ||
           host.startsWith('172.') ||
           window.location.port !== '';
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

    // 2. 로컬 서버 시도 (localhost 환경에서만 시도)
    if (this.isLocalServer()) {
      try {
        const resp = await fetch('/api/metadata');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success) {
            return data;
          }
        }
      } catch (e) {}
    }

    // 3. GitHub Pages 및 정적 배포용 data/sheet_cache.json 직접 로드 (경로 안전 보장 & 캐시 방지)
    try {
      const baseHref = window.location.href.replace(/[^/]*$/, '');
      const cacheUrl = new URL(`data/sheet_cache.json?v=${Date.now()}`, baseHref).href;
      const resp = await fetch(cacheUrl);
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

  // 랭킹 1위~10위 조회 (GAS, 로컬 서버, GitHub Pages users.json, xlsx 캐시 등 다중 연동)
  async fetchRankings() {
    // 1. Google Apps Script 시도 (웹 앱 URL이 연동된 경우)
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getRankings`, { method: 'GET' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success && Array.isArray(data.rankings) && data.rankings.length > 0) {
            return this.formatAndMergeRankings(data.rankings);
          }
        }
      } catch (err) {
        console.warn('[API] Failed to fetch rankings from GAS:', err);
      }
    }

    // 2. 로컬 Node.js 백엔드 서버 시도 (localhost 환경에서만)
    if (this.isLocalServer()) {
      try {
        const resp = await fetch('/api/rankings');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success && Array.isArray(data.rankings) && data.rankings.length > 0) {
            return this.formatAndMergeRankings(data.rankings);
          }
        }
      } catch (e) {}
    }

    // 3. GitHub Pages 및 정적 배포용 data/users.json 로드 시도 (절대 경로 보정 & 캐시 무효화)
    try {
      const baseHref = window.location.href.replace(/[^/]*$/, '');
      const usersUrl = new URL(`data/users.json?v=${Date.now()}`, baseHref).href;
      const resp = await fetch(usersUrl);
      if (resp.ok) {
        const users = await resp.json();
        if (Array.isArray(users) && users.length > 0) {
          return this.formatAndMergeRankings(users);
        }
      }
    } catch (e) {}

    // 4. data/sheet_cache.json 내 엑셀 동기화 유저 데이터 확인
    try {
      const baseHref = window.location.href.replace(/[^/]*$/, '');
      const cacheUrl = new URL(`data/sheet_cache.json?v=${Date.now()}`, baseHref).href;
      const resp = await fetch(cacheUrl);
      if (resp.ok) {
        const cache = await resp.json();
        if (cache && Array.isArray(cache.users) && cache.users.length > 0) {
          return this.formatAndMergeRankings(cache.users);
        }
      }
    } catch (e) {}

    // 5. 기본 랭커 데이터 및 로컬 유저 폴백
    return this.getMockRankings();
  }

  // 실시간 접속 유저 조회 (최근 3~5분 이내 활동 유저)
  async fetchOnlineUsers() {
    const isDummyUid = (uid) => {
      if (!uid) return true;
      const id = String(uid).trim();
      return id === 'google_auth_uid_12345' ||
             id.startsWith('ai_') ||
             id.startsWith('dummy_') ||
             id.startsWith('test_') ||
             id.startsWith('mock_') ||
             id.startsWith('user_godzilla') ||
             id.startsWith('user_rider') ||
             id.startsWith('user_ultra') ||
             id.startsWith('user_space') ||
             id.startsWith('user_red') ||
             id.startsWith('user_v3') ||
             id.startsWith('user_seven') ||
             id.startsWith('user_sharivan') ||
             id.startsWith('user_gamera') ||
             id.startsWith('user_super');
    };

    const userMap = new Map();
    const now = Date.now();
    const thresholdMs = 3 * 60 * 1000;

    let totalUsersFromRemote = 0;

    // 1. Google Apps Script 우선 시도
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getOnlineUsers`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success) {
            if (typeof data.total_users === 'number') {
              totalUsersFromRemote = Math.max(totalUsersFromRemote, data.total_users);
            }
            if (Array.isArray(data.online_users)) {
              data.online_users.forEach(u => {
                if (u && u.uid && !isDummyUid(u.uid)) {
                  userMap.set(u.uid, {
                    uid: u.uid,
                    nickname: u.nickname || '특촬용사',
                    main_character: u.main_character || 'card_0000',
                    total_sp: Number(u.total_sp) || 0,
                    last_active_timestamp: Number(u.last_active_timestamp) || now
                  });
                }
              });
            }
          }
        }
      } catch (e) {}
    }

    // 2. 로컬 서버 조회 (localhost 환경)
    if (this.isLocalServer()) {
      try {
        const resp = await fetch('/api/online-users');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.success) {
            if (typeof data.total_users === 'number') {
              totalUsersFromRemote = Math.max(totalUsersFromRemote, data.total_users);
            }
            if (Array.isArray(data.online_users)) {
              data.online_users.forEach(u => {
                if (u && u.uid && !isDummyUid(u.uid)) {
                  userMap.set(u.uid, {
                    uid: u.uid,
                    nickname: u.nickname || '모험가',
                    main_character: u.main_character || 'card_0000',
                    total_sp: Number(u.total_sp) || 0,
                    last_active_timestamp: Number(u.last_active_timestamp) || now
                  });
                }
              });
            }
          }
        }
      } catch (e) {}
    }

    // 3. 로컬스토리지 내 최근 활동 유저 확인
    let localStoredUsersCount = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('toku_user_')) {
          try {
            const u = JSON.parse(localStorage.getItem(key));
            if (u && u.uid && !isDummyUid(u.uid)) {
              localStoredUsersCount++;
              const lastActive = u.last_active_timestamp || u.last_sync_timestamp || (u.updated_at ? new Date(u.updated_at).getTime() : 0);
              if (now - lastActive <= thresholdMs) {
                userMap.set(u.uid, {
                  uid: u.uid,
                  nickname: u.nickname || '모험가',
                  main_character: u.main_character || 'card_0000',
                  total_sp: Number(u.total_sp) || 0,
                  last_active_timestamp: lastActive
                });
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 4. 현재 접속 중인 본인 유저 정보는 항상 온라인으로 1순위 보장
    let curUser = window.userModel ? window.userModel.getUser() : null;
    if (!curUser) {
      try {
        const savedSession = localStorage.getItem('toku_auth_session');
        if (savedSession) {
          const authData = JSON.parse(savedSession);
          if (authData && authData.uid) {
            const cachedUser = localStorage.getItem(`toku_user_${authData.uid}`);
            if (cachedUser) {
              curUser = JSON.parse(cachedUser);
            } else {
              curUser = { uid: authData.uid, nickname: authData.name || '모험가', main_character: 'card_0000', total_sp: 0 };
            }
          }
        }
      } catch (e) {}
    }

    if (curUser && curUser.uid && !isDummyUid(curUser.uid)) {
      userMap.set(curUser.uid, {
        uid: curUser.uid,
        nickname: curUser.nickname || '모험가',
        main_character: curUser.main_character || 'card_0000',
        total_sp: Number(curUser.total_sp) || 0,
        last_active_timestamp: now,
        is_me: true
      });
    }

    const onlineList = Array.from(userMap.values());
    onlineList.sort((a, b) => {
      if (a.is_me && !b.is_me) return -1;
      if (!a.is_me && b.is_me) return 1;
      return (b.total_sp || 0) - (a.total_sp || 0);
    });

    const totalUsersCount = Math.max(totalUsersFromRemote, localStoredUsersCount, userMap.size, 1);

    return {
      success: true,
      count: onlineList.length,
      total_users: totalUsersCount,
      online_users: onlineList,
      updated_at: new Date().toISOString()
    };
  }

  // 유저 데이터 저장 (GAS & 로컬 & 로컬스토리지 동시 동기화)
  async saveUser(user) {
    if (!user || (!user.uid && !user.email)) return false;

    // 로컬스토리지 캐시 (UID 및 이메일 동시 캐싱)
    try {
      if (user.uid) localStorage.setItem(`toku_user_${user.uid}`, JSON.stringify(user));
      if (user.email) localStorage.setItem(`toku_user_email_${user.email.trim().toLowerCase()}`, JSON.stringify(user));
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

    // 2. 로컬 서버 동기화 (localhost 환경에서만)
    if (this.isLocalServer()) {
      try {
        const resp = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveUser', user: user })
        });
        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson && resJson.success && resJson.user) {
            return resJson.user;
          }
        }
      } catch (e) {}
    }

    return true;
  }

  // 유저 데이터 불러오기 (UID 및 이메일 동시 조회 지원)
  async fetchUser(uid, email) {
    if (!uid && !email) return null;

    const queryParts = [];
    if (uid) queryParts.push(`uid=${encodeURIComponent(uid)}`);
    if (email) queryParts.push(`email=${encodeURIComponent(email.trim().toLowerCase())}`);
    const qs = queryParts.join('&');

    // 1. GAS 조회
    if (this.gasUrl) {
      try {
        const resp = await fetch(`${this.gasUrl}?action=getUser&${qs}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.user) {
            return data.user;
          }
        }
      } catch (e) {}
    }

    // 2. 로컬 서버 조회 (localhost 환경에서만)
    if (this.isLocalServer()) {
      try {
        const resp = await fetch(`/api/user?${qs}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.user) {
            return data.user;
          }
        }
      } catch (e) {}
    }

    // 3. 로컬스토리지 조회
    try {
      if (uid) {
        const cached = localStorage.getItem(`toku_user_${uid}`);
        if (cached) return JSON.parse(cached);
      }
      if (email) {
        const cachedEmail = localStorage.getItem(`toku_user_email_${email.trim().toLowerCase()}`);
        if (cachedEmail) return JSON.parse(cachedEmail);
      }
    } catch (e) {}

    return null;
  }

  // 구글 시트 직접 동기화 요청
  async syncGoogleSheet() {
    if (this.isLocalServer()) {
      try {
        const resp = await fetch('/api/sync-sheet', { method: 'POST' });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (e) {
        return { success: false, message: e.message };
      }
    }
    return { success: false, message: 'GitHub Pages 정적 배포 모드에서는 자동 오프라인 동기화가 활성화되어 있습니다.' };
  }

  // 가챠 실행 (서버 우선, GitHub Pages 및 오프라인 자동 폴백)
  async drawGacha(uid, isMulti) {
    if (this.isLocalServer()) {
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
    }

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
    if (this.isLocalServer()) {
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
    }

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
    if (this.isLocalServer()) {
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
    }

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

  // 유저 목록 병합 및 순위 계산 (다중 소스, localStorage, 현재 유저 동기화 - 더미데이터 완전 배제)
  formatAndMergeRankings(sourceUsers = []) {
    const userMap = new Map();

    const isDummyUid = (uid) => {
      if (!uid) return true;
      const id = String(uid).trim();
      return id === 'google_auth_uid_12345' ||
             id.startsWith('ai_') ||
             id.startsWith('dummy_') ||
             id.startsWith('test_') ||
             id.startsWith('mock_') ||
             id.startsWith('user_godzilla') ||
             id.startsWith('user_rider') ||
             id.startsWith('user_ultra') ||
             id.startsWith('user_space') ||
             id.startsWith('user_red') ||
             id.startsWith('user_v3') ||
             id.startsWith('user_seven') ||
             id.startsWith('user_sharivan') ||
             id.startsWith('user_gamera') ||
             id.startsWith('user_super');
    };

    // 1. 소스 랭커 데이터 추가/갱신 (users.json, sheet_cache, GAS 등 - 더미 UID 원천 필터링)
    if (Array.isArray(sourceUsers) && sourceUsers.length > 0) {
      sourceUsers.forEach(u => {
        if (u && u.uid && !isDummyUid(u.uid)) {
          userMap.set(u.uid, {
            uid: u.uid,
            nickname: u.nickname || '특촬용사',
            main_character: u.main_character || 'card_0000',
            total_sp: Number(u.total_sp) || 0
          });
        }
      });
    }

    // 2. localStorage에 저장된 실제 유저들 추가
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('toku_user_')) {
          try {
            const u = JSON.parse(localStorage.getItem(key));
            if (u && u.uid && !isDummyUid(u.uid)) {
              userMap.set(u.uid, {
                uid: u.uid,
                nickname: u.nickname || '모험가',
                main_character: u.main_character || 'card_0000',
                total_sp: Number(u.total_sp) || 0
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 3. 현재 접속 중인 실제 유저 정보 반영
    const curUser = window.userModel ? window.userModel.getUser() : null;
    if (curUser && curUser.uid && !isDummyUid(curUser.uid)) {
      userMap.set(curUser.uid, {
        uid: curUser.uid,
        nickname: curUser.nickname || '모험가',
        main_character: curUser.main_character || 'card_0000',
        total_sp: Number(curUser.total_sp) || 0
      });
    }

    const allUsers = Array.from(userMap.values());
    allUsers.sort((a, b) => (b.total_sp || 0) - (a.total_sp || 0));

    const rankedList = allUsers.map((u, idx) => ({
      rank: idx + 1,
      uid: u.uid,
      nickname: u.nickname,
      main_character: u.main_character,
      total_sp: u.total_sp
    }));

    return {
      success: true,
      rankings: rankedList,
      total_users: rankedList.length,
      updated_at: new Date().toISOString()
    };
  }

  getMockRankings() {
    return this.formatAndMergeRankings([]);
  }
}

window.api = new ApiService();

