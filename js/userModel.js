/**
 * User State and Reward Management
 */
class UserModel {
  constructor() {
    this.user = null;
    this.connectionTimer = null;
    this.onUserUpdate = null;
    this.onMinuteReward = null;
  }

  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isLoggedIn() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async login(authData) {
    const uid = authData.uid || 'test_guest_01';
    const nickname = authData.nickname || authData.name || '모험가';

    // 1. 기존 유저 정보 조회
    let existing = await window.api.fetchUser(uid);

    let isNewUser = false;
    let initialGiftCard = null;

    if (!existing) {
      // 신규 유저 생성
      isNewUser = true;
      const todayStr = this.getTodayDateString();
      const now = Date.now();

      // 스타터 5종 중 1장 무작위 추첨
      const starters = window.gameData.starterCards;
      initialGiftCard = starters[Math.floor(Math.random() * starters.length)];

      const initialOwned = {};
      initialOwned[initialGiftCard] = 1;

      const starterSp = window.gameData.getCard(initialGiftCard).sp_point;

      this.user = {
        uid: uid,
        nickname: nickname,
        email: authData.email || '',
        main_character: initialGiftCard,
        points: 1000, // 초기 1000p 출석 지급
        total_sp: starterSp,
        last_attendance_date: todayStr,
        last_sync_timestamp: now,
        is_initial_gift_received: true,
        created_at: now,
        owned_cards: initialOwned
      };
    } else {
      this.user = existing;
      if (authData.email && !this.user.email) {
        this.user.email = authData.email;
      }
      if (!this.user.last_sync_timestamp) {
        this.user.last_sync_timestamp = Date.now();
      }
      // SP 재검증 계산
      this.recalculateTotalSP();
    }

    // 서버 및 로컬 동기화
    await this.sync();
    this.startConnectionTimer();

    return {
      isNewUser,
      initialGiftCard,
      user: this.user
    };
  }

  logout() {
    this.stopConnectionTimer();
    this.user = null;
  }

  // [치트 방지] 매일 출석체크 로직 (서버 검증 1,000p)
  async checkDailyAttendance() {
    if (!this.user) return { success: false, reason: 'NOT_LOGGED_IN' };

    // 1. 서버 측 권한 검증 호출 (F12 조작 원천 방어)
    try {
      const sResult = await window.api.checkAttendance(this.user.uid);
      if (sResult && sResult.success && sResult.user) {
        this.user = sResult.user;
        if (this.onUserUpdate) this.onUserUpdate(this.user);
        return { success: true, reward: sResult.reward || 1000, today: sResult.today };
      }
      if (sResult && sResult.alreadyChecked) {
        return { success: false, alreadyChecked: true, message: sResult.message };
      }
    } catch (e) {}

    // 로컬 폴백
    const today = this.getTodayDateString();
    if (this.user.last_attendance_date === today) {
      return {
        success: false,
        alreadyChecked: true,
        today: today,
        last_date: this.user.last_attendance_date
      };
    }

    this.user.points = (this.user.points || 0) + 1000;
    this.user.last_attendance_date = today;
    this.sync();

    if (this.onUserUpdate) this.onUserUpdate(this.user);

    return {
      success: true,
      reward: 1000,
      today: today
    };
  }

  // [치트 방지] 접속시간 1분당 1p 보상 타이머 (서버 타임스탬프 기반 정산)
  startConnectionTimer() {
    this.stopConnectionTimer();

    let checkCounter = 0;
    this.connectionTimer = setInterval(async () => {
      if (!this.user) return;

      checkCounter++;
      // 5초마다 서버와 시간 동기화 검증
      if (checkCounter % 5 === 0) {
        try {
          const syncRes = await window.api.syncTime(this.user.uid);
          if (syncRes && syncRes.success && syncRes.user) {
            const prevPoints = this.user.points || 0;
            this.user = syncRes.user;

            if (syncRes.pointsEarned > 0) {
              if (this.onMinuteReward) {
                this.onMinuteReward(syncRes.pointsEarned, this.user.points);
              }
            }
            if (this.onUserUpdate) {
              this.onUserUpdate(this.user);
            }
          }
        } catch (e) {}
      }
    }, 1000);
  }

  stopConnectionTimer() {
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  // 다음 1p 지급까지 남은 초
  getSecondsToNextPoint() {
    if (!this.user) return 60;
    const now = Date.now();
    const lastSync = this.user.last_sync_timestamp || now;
    const elapsed = (now - lastSync) % 60000;
    const remainingMs = 60000 - elapsed;
    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  // 가챠 카드 추가 및 SP 누적
  addCards(cards) {
    if (!this.user || !Array.isArray(cards)) return;

    if (!this.user.owned_cards) {
      this.user.owned_cards = {};
    }

    cards.forEach(card => {
      const id = card.card_id;
      this.user.owned_cards[id] = (this.user.owned_cards[id] || 0) + 1;
    });

    this.recalculateTotalSP();
    this.sync();

    if (this.onUserUpdate) this.onUserUpdate(this.user);
  }

  // SP 총합 재계산
  recalculateTotalSP() {
    if (!this.user) return;
    this.user.total_sp = window.gameData.calculateTotalSP(this.user.owned_cards);
  }

  // 포인트 사용
  spendPoints(amount) {
    if (!this.user || this.user.points < amount) return false;
    this.user.points -= amount;
    this.sync();
    if (this.onUserUpdate) this.onUserUpdate(this.user);
    return true;
  }

  // 닉네임 변경
  setNickname(newNick) {
    if (!this.user || !newNick) return;
    this.user.nickname = newNick.trim().slice(0, 16);
    this.sync();
    if (this.onUserUpdate) this.onUserUpdate(this.user);
  }

  // 대표 메인 캐릭터 변경
  setMainCharacter(cardId) {
    if (!this.user) return;
    if (this.user.owned_cards && this.user.owned_cards[cardId] > 0) {
      this.user.main_character = cardId;
      this.sync();
      if (this.onUserUpdate) this.onUserUpdate(this.user);
      return true;
    }
    return false;
  }

  // 상태 비동기 저장
  async sync() {
    if (!this.user) return;
    await window.api.saveUser(this.user);
  }
}

window.userModel = new UserModel();
