/**
 * Main Game Application Controller
 * Handles UI events, gacha visual effects, ranking updates, and timers.
 */
class AppController {
  constructor() {
    this.currentBgIndex = 0;
    this.bgImages = [
      'img_bg/BandiView_bg_0000.webp',
      'img_bg/BandiView_bg_0001.webp',
      'img_bg/BandiView_bg_0002.webp'
    ];

    this.speechQuotes = [
      '오늘도 출석 완료! 가챠를 돌려볼까요?',
      '접속 시간 1분마다 포인트가 1P씩 차곡차곡 쌓여요!',
      '가챠 10회를 돌리면 보너스로 11장이 나와요!',
      '중복 카드를 뽑으면 기본 SP가 추가로 누적돼요!',
      'SP 랭킹 1위를 향해 도전해 보세요!',
      '모든 영웅 카드를 수집해 보세요!',
      '랭킹은 1시간마다 실시간으로 갱신됩니다.'
    ];

    this.rankingNextUpdateTime = Date.now() + 3600000;
    this.cachedRankings = null;
    this.currentBinderFilter = 'ALL';
    this.pendingGachaResult = null;
  }

  async init() {
    this.initAntiCheat();
    this.initAudioAndParticles();
    this.initBackground();
    this.bindEvents();
    this.setupUserModelCallbacks();

    // 1. 메타데이터 로드
    const metadata = await window.api.fetchMetadata();
    if (metadata) {
      window.gameData.loadMetadata(metadata);
    }
    this.checkAndUpdateSheetStatusUI(metadata && metadata.sheetConnected, metadata ? metadata.cardlist.length : 0);

    // 2. 인증 컨트롤러 콜백 설정
    window.authController.onLoginSuccess = async (authData) => {
      await this.handleLoginSuccess(authData);
    };

    // 3. 기존 세션 확인 (없으면 로그인 모달 오픈)
    const hasSession = window.authController.checkSavedSession();
    if (!hasSession) {
      this.openModal('modal-login');
      // Google Identity Client 렌더링
      window.authController.init();
    }

    // 4. 주기적 UI 타이머 (1초 주기)
    setInterval(() => this.updateUiTimers(), 1000);
  }

  initAudioAndParticles() {
    window.particles.init();
    const isMuted = window.soundCtrl.isMuted();
    const muteBtn = document.getElementById('btn-sound-toggle');
    if (muteBtn) muteBtn.textContent = isMuted ? '🔇' : '🔊';
  }

  initBackground() {
    const saved = localStorage.getItem('toku_selected_bg');
    if (saved !== null) {
      this.currentBgIndex = parseInt(saved, 10) || 0;
    }
    this.applyBackground(this.currentBgIndex);
  }

  applyBackground(idx) {
    this.currentBgIndex = idx % this.bgImages.length;
    localStorage.setItem('toku_selected_bg', this.currentBgIndex);
    const bgLayer = document.getElementById('game-bg-layer');
    if (bgLayer) {
      bgLayer.style.backgroundImage = `url('${this.bgImages[this.currentBgIndex]}')`;
    }

    document.querySelectorAll('.bg-switch-btn').forEach(btn => {
      const bIdx = parseInt(btn.dataset.bg, 10);
      btn.classList.toggle('active', bIdx === this.currentBgIndex);
    });
  }

  setupUserModelCallbacks() {
    window.userModel.onUserUpdate = (user) => {
      this.renderUserProfile(user);
      this.updateRankingsDisplay();
    };

    // 1분당 1P 지급 시 연출
    window.userModel.onMinuteReward = (minutes, currentPoints) => {
      window.soundCtrl.playCoin();
      this.showCoinToast(`+${minutes} P (접속 시간 보상)`);
      window.particles.spawnCoinShower(8);
    };
  }

  async handleLoginSuccess(authData) {
    this.closeModal('modal-login');
    const result = await window.userModel.login(authData);

    this.renderUserProfile(result.user);
    await this.refreshRankings();

    if (result.isNewUser) {
      // 신규 가입 선물 연출
      const card = window.gameData.getCard(result.initialGiftCard);
      window.soundCtrl.playAttendanceFanfare();
      window.particles.spawnConfetti(60);
      alert(`🎉 환영합니다!\n신규 가입 선물로 [${card.name} (${card.rank})] 카드 1장과 1,000P가 지급되었습니다!`);
    } else {
      // 자동 일일 출석체크 확인
      const attResult = await window.userModel.checkDailyAttendance();
      if (attResult.success) {
        this.showAttendanceCelebration(attResult.reward);
      }
    }
  }

  // 메인 화면 UI 갱신
  renderUserProfile(user) {
    if (!user) return;

    // 헤더 정보
    document.getElementById('header-nickname').textContent = user.nickname || '모험가';
    document.getElementById('header-uid').textContent = `UID: ${user.uid.slice(0, 15)}...`;
    document.getElementById('val-points').textContent = Number(user.points || 0).toLocaleString();
    document.getElementById('val-sp').textContent = Number(user.total_sp || 0).toLocaleString();

    // 메인 캐릭터 일러스트
    const mainCardId = user.main_character || 'card_0000';
    const card = window.gameData.getCard(mainCardId);
    const count = (user.owned_cards && user.owned_cards[mainCardId]) || 1;

    const mainCardImg = document.getElementById('main-card-img');
    const headerAvatarImg = document.getElementById('header-avatar-img');
    const imgPath = window.gameData.getCardImagePath(mainCardId);

    mainCardImg.src = imgPath;
    headerAvatarImg.src = imgPath;

    document.getElementById('main-card-name').textContent = card.name;
    document.getElementById('main-card-rarity').textContent = card.rank;
    document.getElementById('main-card-sp').textContent = `SP +${card.sp_point}`;
    document.getElementById('main-card-count').textContent = `보유: ${count}장`;

    // 프레임 등급 클래스 적용
    const frame = document.getElementById('main-card-frame');
    frame.className = `card-stage-container rank-${card.rank}`;

    // 말풍선 랜덤 변경
    this.showRandomSpeechQuote();
  }

  showRandomSpeechQuote() {
    const bubble = document.getElementById('char-speech-bubble');
    if (!bubble) return;
    const quote = this.speechQuotes[Math.floor(Math.random() * this.speechQuotes.length)];
    bubble.textContent = quote;
  }

  // 코인 획득 플로팅 토스트
  showCoinToast(text) {
    const toast = document.createElement('div');
    toast.className = 'coin-toast';
    toast.textContent = `🪙 ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2100);
  }

  // 1초 타이머 (접속 시간 카운트다운 & 1시간 랭킹 갱신)
  updateUiTimers() {
    if (!window.userModel.isLoggedIn()) return;

    // 1. 다음 1P 지급 카운트다운
    const sec = window.userModel.getSecondsToNextPoint();
    const timerLabel = document.getElementById('timer-countdown');
    if (timerLabel) {
      timerLabel.textContent = `+1P 대기: ${sec}초`;
    }

    // 2. 1시간 랭킹 갱신 카운트다운
    const now = Date.now();
    const remainingToRank = Math.max(0, this.rankingNextUpdateTime - now);
    const mins = Math.floor(remainingToRank / 60000);
    const secs = Math.floor((remainingToRank % 60000) / 1000);

    const rankBadge = document.getElementById('ranking-timer-badge');
    if (rankBadge) {
      rankBadge.textContent = `갱신: ${mins}분 ${secs}초`;
    }

    if (remainingToRank <= 0) {
      this.rankingNextUpdateTime = now + 3600000;
      this.refreshRankings();
    }
  }

  // 랭킹 데이터 가져오기 및 렌더링 (1시간 캐싱)
  async refreshRankings() {
    const data = await window.api.fetchRankings();
    if (data && data.rankings) {
      this.cachedRankings = data.rankings;
    }
    this.updateRankingsDisplay();
  }

  updateRankingsDisplay() {
    const container = document.getElementById('ranking-list-container');
    if (!container) return;

    let rankings = this.cachedRankings ? [...this.cachedRankings] : [];

    // 현재 로그인 유저 반영
    const curUser = window.userModel.getUser();
    if (curUser) {
      const idx = rankings.findIndex(r => r.uid === curUser.uid);
      if (idx >= 0) {
        rankings[idx].total_sp = curUser.total_sp;
        rankings[idx].main_character = curUser.main_character;
        rankings[idx].nickname = curUser.nickname;
      } else {
        rankings.push({
          uid: curUser.uid,
          nickname: curUser.nickname,
          main_character: curUser.main_character,
          total_sp: curUser.total_sp
        });
      }
    }

    rankings.sort((a, b) => (b.total_sp || 0) - (a.total_sp || 0));

    // 1위~10위 렌더링
    container.innerHTML = '';
    const top10 = rankings.slice(0, 10);

    top10.forEach((item, index) => {
      const rankNum = index + 1;
      const cardImg = window.gameData.getCardImagePath(item.main_character);

      let posClass = '';
      let crown = `${rankNum}`;
      if (rankNum === 1) { posClass = 'gold'; crown = '🥇'; }
      else if (rankNum === 2) { posClass = 'silver'; crown = '🥈'; }
      else if (rankNum === 3) { posClass = 'bronze'; crown = '🥉'; }

      const row = document.createElement('div');
      row.className = `ranking-item ${curUser && curUser.uid === item.uid ? 'my-rank-item' : ''}`;
      row.innerHTML = `
        <div class="rank-pos ${posClass}">${crown}</div>
        <div class="rank-avatar">
          <img src="${cardImg}" alt="Card">
        </div>
        <div class="rank-user-info">
          <span class="rank-username">${escapeHtml(item.nickname || '모험가')}</span>
          <span class="rank-sp-val">${(item.total_sp || 0).toLocaleString()} SP</span>
        </div>
      `;
      container.appendChild(row);
    });

    // 내 순위 바 갱신
    if (curUser) {
      const myRankIdx = rankings.findIndex(r => r.uid === curUser.uid);
      const myRank = myRankIdx >= 0 ? myRankIdx + 1 : '-';

      document.getElementById('my-rank-pos').textContent = myRank <= 3 ? ['🥇','🥈','🥉'][myRank-1] : `${myRank}위`;
      document.getElementById('my-rank-name').textContent = curUser.nickname || '나';
      document.getElementById('my-rank-sp').textContent = `${(curUser.total_sp || 0).toLocaleString()} SP`;
      document.getElementById('my-rank-avatar').src = window.gameData.getCardImagePath(curUser.main_character);
      document.getElementById('header-rank-badge').textContent = `RANK ${myRank}`;
    }
  }

  // =========================================================================
  // GACHA PULL & PRESENTATION
  // =========================================================================
  async startGachaDraw(isMulti = false) {
    if (!window.userModel.isLoggedIn()) {
      this.openModal('modal-login');
      return;
    }

    const user = window.userModel.getUser();
    const cost = isMulti ? 1000 : 100;

    // 1. [치트 방지] 서버 측 가챠 검증 및 추첨 요청 (F12 조작 원천 차단)
    const serverResult = await window.api.drawGacha(user.uid, isMulti);
    if (!serverResult || !serverResult.success) {
      if (serverResult && serverResult.reason === 'NOT_ENOUGH_POINTS') {
        window.soundCtrl.playClick();
        alert(`포인트가 부족합니다!\n필요 포인트: ${isMulti ? '1,000P' : '100P'}\n현재 보유 포인트: ${(user.points || 0).toLocaleString()}P`);
      } else {
        alert(`가챠 실행 중 오류: ${serverResult ? serverResult.message : '서버 통신 실패'}`);
      }
      return;
    }

    this.pendingGachaResult = serverResult;

    // 소환 모달 오픈 & 연출 시작
    this.playGachaAnimation(serverResult);
  }

  playGachaAnimation(result) {
    const modal = document.getElementById('gacha-summon-modal');
    const intro = document.getElementById('summon-intro-phase');
    const resultsPhase = document.getElementById('summon-results-phase');
    const crystal = document.getElementById('summon-crystal-btn');

    modal.style.display = 'flex';
    intro.style.display = 'flex';
    resultsPhase.style.display = 'none';

    // 사운드 차징
    window.soundCtrl.playGachaCharge();

    // 최고 등급에 따른 크리스탈 색상 효과
    const highestRank = result.highestRank || 'N';
    const rankColors = {
      SUHR: 'radial-gradient(circle, #fff, #ff0055)',
      HR: 'radial-gradient(circle, #fff, #ff7700)',
      UR: 'radial-gradient(circle, #fff, #a855f7)',
      SR: 'radial-gradient(circle, #fff, #3b82f6)',
      R: 'radial-gradient(circle, #fff, #10b981)',
      N: 'radial-gradient(circle, #fff, #64748b)'
    };
    crystal.style.background = rankColors[highestRank] || rankColors.N;

    // 크리스탈 클릭 시 결과 공개
    const revealTrigger = () => {
      crystal.onclick = null;
      window.soundCtrl.playCardReveal(highestRank);
      window.particles.spawnBurst(window.innerWidth / 2, window.innerHeight / 2, highestRank, 50);

      setTimeout(() => {
        this.renderGachaResults(result);
      }, 500);
    };

    crystal.onclick = revealTrigger;
  }

  renderGachaResults(result) {
    const intro = document.getElementById('summon-intro-phase');
    const resultsPhase = document.getElementById('summon-results-phase');
    const grid = document.getElementById('gacha-results-grid');

    intro.style.display = 'none';
    resultsPhase.style.display = 'flex';
    grid.innerHTML = '';

    document.getElementById('results-sp-text').textContent = `+${result.totalSpGained.toLocaleString()} SP 획득!`;

    // [치트 방지] 서버에서 검증 계산된 유저 데이터(보유 카드, SP, 차감된 포인트)로 동기화
    if (result.user) {
      window.userModel.user = result.user;
      if (window.userModel.onUserUpdate) {
        window.userModel.onUserUpdate(window.userModel.user);
      }
    }

    // 카드 그리드 동적 생성
    result.cards.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = `gacha-result-card rank-${card.rank}`;
      cardEl.style.animationDelay = `${idx * 0.08}s`;

      const badgeNew = card.isNew 
        ? `<div class="gacha-card-badge-new">NEW!</div>`
        : `<div class="gacha-card-badge-dup">DUPLICATE</div>`;

      cardEl.innerHTML = `
        <img src="${window.gameData.getCardImagePath(card.card_id)}" alt="${card.name}">
        ${badgeNew}
        <div class="gacha-card-badge-rank">${card.rank}</div>
        <div class="gacha-card-badge-sp">+${card.sp_point} SP</div>
      `;
      grid.appendChild(cardEl);
    });

    if (result.highestRank === 'SUHR' || result.highestRank === 'HR' || result.highestRank === 'UR' || result.highestRank === 'SSR') {
      window.particles.spawnConfetti(60);
    }
  }

  closeGachaModal() {
    const modal = document.getElementById('gacha-summon-modal');
    modal.style.display = 'none';
    this.pendingGachaResult = null;
    window.soundCtrl.playClick();
  }

  // =========================================================================
  // ATTENDANCE CHECK MODAL & CELEBRATION
  // =========================================================================
  showAttendanceCelebration(reward = 1000) {
    this.openModal('modal-attendance');
    const stamp = document.getElementById('attendance-stamp');
    stamp.classList.remove('stamped');

    setTimeout(() => {
      stamp.classList.add('stamped');
      window.soundCtrl.playStamp();
      window.soundCtrl.playAttendanceFanfare();
      window.particles.spawnCoinShower(50);
    }, 200);

    document.getElementById('attendance-reward-text').textContent = `+${reward.toLocaleString()} POINTS`;
  }

  // =========================================================================
  // CARD BINDER & MAIN CHARACTER MODALS
  // =========================================================================
  renderBinderModal(filter = 'ALL') {
    this.currentBinderFilter = filter;
    const grid = document.getElementById('binder-cards-grid');
    grid.innerHTML = '';

    const user = window.userModel.getUser();
    const owned = (user && user.owned_cards) || {};
    // 데이터가 모두 작성된 완성 카드만 도감 집계 및 표시
    const allCards = window.gameData.getAllCompleteCards();

    let ownedCount = 0;
    allCards.forEach(c => {
      if (owned[c.card_id] > 0) ownedCount++;
    });

    const totalCount = allCards.length;
    const titleEl = document.getElementById('binder-modal-title');
    if (titleEl) {
      titleEl.textContent = `📖 카드 도감 (${totalCount}종)`;
    }

    const rateEl = document.getElementById('binder-collection-rate');
    if (rateEl) {
      const pct = totalCount > 0 ? ((ownedCount / totalCount) * 100).toFixed(1) : 0;
      rateEl.textContent = `수집률: ${ownedCount} / ${totalCount} (${pct}%)`;
    }

    // 탭 활성화 상태
    document.querySelectorAll('#binder-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    const filtered = allCards.filter(card => {
      const isOwned = (owned[card.card_id] || 0) > 0;
      if (filter === 'OWNED') return isOwned;
      if (filter !== 'ALL' && card.rank !== filter) return false;
      return true;
    });

    filtered.forEach(card => {
      const count = owned[card.card_id] || 0;
      const isOwned = count > 0;
      const slot = document.createElement('div');
      slot.className = `binder-card-slot rank-${card.rank} ${isOwned ? '' : 'unowned'}`;
      slot.innerHTML = `
        <img src="${window.gameData.getCardImagePath(card.card_id)}" alt="${card.name}">
        ${isOwned ? `<div class="binder-count-badge">x${count}</div>` : ''}
      `;

      if (isOwned) {
        slot.title = `${card.name} (${card.rank}) - 클릭 시 메인 캐릭터로 지정`;
        slot.onclick = () => {
          if (confirm(`[${card.name}] 캐릭터를 메인 캐릭터로 설정하시겠습니까?`)) {
            window.userModel.setMainCharacter(card.card_id);
            window.soundCtrl.playClick();
            this.closeModal('modal-binder');
          }
        };
      }

      grid.appendChild(slot);
    });
  }

  renderMainCharModal() {
    const grid = document.getElementById('main-char-select-grid');
    grid.innerHTML = '';

    const user = window.userModel.getUser();
    const owned = (user && user.owned_cards) || {};

    Object.keys(owned).forEach(cardId => {
      const count = owned[cardId];
      if (count <= 0) return;

      const card = window.gameData.getCard(cardId);
      const slot = document.createElement('div');
      slot.className = `binder-card-slot rank-${card.rank}`;
      slot.innerHTML = `
        <img src="${window.gameData.getCardImagePath(cardId)}" alt="${card.name}">
        <div class="binder-count-badge">x${count}</div>
      `;

      slot.onclick = () => {
        window.userModel.setMainCharacter(cardId);
        window.soundCtrl.playClick();
        this.closeModal('modal-main-char');
      };

      grid.appendChild(slot);
    });
  }

  async checkAndUpdateSheetStatusUI(forcedConnected = false, count = 0) {
    const box = document.getElementById('sheet-sync-status-box');
    const title = document.getElementById('sheet-sync-status-title');
    const desc = document.getElementById('sheet-sync-status-desc');
    if (!box || !title || !desc) return;

    if (forcedConnected) {
      box.style.background = 'rgba(16, 185, 129, 0.15)';
      box.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      title.style.color = '#34d399';
      title.textContent = `🟢 엑셀/구글 시트 연동 완료 (${count}개 카드)`;
      desc.innerHTML = `폴더 내 <code>toku_attendancecheck.xlsx</code> 엑셀 및 시트의 실제 카드 정보가 게임에 100% 실시간 연동되어 있습니다.`;
      return;
    }

    try {
      const resp = await fetch('/api/sheet-status');
      if (resp.ok) {
        const data = await resp.json();
        if (data.cached && data.cardCount > 0) {
          box.style.background = 'rgba(16, 185, 129, 0.15)';
          box.style.borderColor = 'rgba(16, 185, 129, 0.5)';
          title.style.color = '#34d399';
          title.textContent = `🟢 엑셀(toku_attendancecheck.xlsx) 연동 완료 (${data.cardCount}개 카드)`;
          desc.innerHTML = `폴더 내 엑셀 파일과 실시간 연동되어 실제 특촬 히어로 카드 및 등급(HR, SUHR, UR 등)이 완벽히 반영되었습니다.`;
          return;
        }
      }
    } catch (e) {}

    box.style.background = 'rgba(239, 68, 68, 0.15)';
    box.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    title.style.color = '#f87171';
    title.textContent = `⚠️ 데이터 미연결`;
    desc.innerHTML = `폴더에 <code>toku_attendancecheck.xlsx</code> 파일을 두시거나 구글 시트를 연동해 주세요.`;
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  bindEvents() {
    // 사운드 토글
    document.getElementById('btn-sound-toggle').onclick = () => {
      const isMuted = window.soundCtrl.toggleMute();
      document.getElementById('btn-sound-toggle').textContent = isMuted ? '🔇' : '🔊';
    };

    // 배경 변경 버튼들
    document.querySelectorAll('.bg-switch-btn').forEach(btn => {
      btn.onclick = (e) => {
        window.soundCtrl.playClick();
        this.applyBackground(parseInt(e.target.dataset.bg, 10));
      };
    });

    // 메인 캐릭터 터치 인터랙션
    const mainTouch = document.getElementById('main-character-touch-zone');
    if (mainTouch) {
      mainTouch.onclick = () => {
        window.soundCtrl.playClick();
        this.showRandomSpeechQuote();
        const frame = document.getElementById('main-card-frame');
        const user = window.userModel.getUser();
        const mainCard = window.gameData.getCard(user ? user.main_character : 'card_0000');
        window.particles.spawnBurst(window.innerWidth / 2, window.innerHeight / 2 - 50, mainCard.rank, 15);
      };
    }

    // 가챠 버튼들
    document.getElementById('btn-gacha-single').onclick = () => this.startGachaDraw(false);
    document.getElementById('btn-gacha-multi').onclick = () => this.startGachaDraw(true);
    document.getElementById('btn-close-gacha').onclick = () => this.closeGachaModal();

    // 출석체크 버튼
    document.getElementById('btn-check-attendance').onclick = async () => {
      window.soundCtrl.playClick();
      const result = await window.userModel.checkDailyAttendance();
      if (result.success) {
        this.showAttendanceCelebration(result.reward);
      } else if (result.alreadyChecked) {
        alert('오늘 이미 출석체크를 완료하셨습니다!\n내일 다시 출석하고 1,000P를 받으세요.');
      } else {
        this.openModal('modal-login');
      }
    };

    // 모달 오픈 버튼들
    document.getElementById('btn-open-nickname').onclick = () => {
      window.soundCtrl.playClick();
      const user = window.userModel.getUser();
      document.getElementById('input-new-nickname').value = user ? user.nickname : '';
      this.openModal('modal-nickname');
    };

    document.getElementById('btn-open-main-char').onclick = () => {
      window.soundCtrl.playClick();
      this.renderMainCharModal();
      this.openModal('modal-main-char');
    };

    document.getElementById('btn-open-binder').onclick = () => {
      window.soundCtrl.playClick();
      this.renderBinderModal('ALL');
      this.openModal('modal-binder');
    };

    // 바인더 탭 필터 클릭
    document.getElementById('binder-tabs').onclick = (e) => {
      if (e.target.classList.contains('tab-btn')) {
        window.soundCtrl.playClick();
        this.renderBinderModal(e.target.dataset.filter);
      }
    };

    // 설정 모달
    document.getElementById('btn-settings').onclick = () => {
      window.soundCtrl.playClick();
      document.getElementById('input-gas-url').value = window.api.getGasUrl();
      document.getElementById('input-google-client-id').value = window.api.getGoogleClientId();
      this.openModal('modal-settings');
      this.checkAndUpdateSheetStatusUI();
    };

    // 구글 시트 즉시 동기화 버튼
    const syncBtn = document.getElementById('btn-trigger-sheet-sync');
    if (syncBtn) {
      syncBtn.onclick = async () => {
        window.soundCtrl.playClick();
        syncBtn.textContent = '동기화 중...';
        syncBtn.disabled = true;

        const result = await window.api.syncGoogleSheet();
        syncBtn.textContent = '🔄 지금 연동 재시도';
        syncBtn.disabled = false;

        if (result.success) {
          const metadata = await window.api.fetchMetadata();
          if (metadata) {
            window.gameData.loadMetadata(metadata);
          }
          this.checkAndUpdateSheetStatusUI(true, result.count);
          const curUser = window.userModel.getUser();
          if (curUser) this.renderUserProfile(curUser);
          window.soundCtrl.playAttendanceFanfare();
          alert(`🎉 연동 성공!\n구글 시트에서 총 ${result.count}개의 카드를 가져왔습니다.`);
        } else {
          alert(`⚠️ 연동 실패:\n${result.message || '시트 권한을 확인해주세요.'}`);
        }
      };
    }

    // 붙여넣은 데이터 직접 적용 버튼
    const pasteBtn = document.getElementById('btn-apply-pasted-data');
    if (pasteBtn) {
      pasteBtn.onclick = async () => {
        const text = document.getElementById('textarea-paste-cardlist').value;
        if (!text.trim()) {
          alert('구글 시트의 cardlist 데이터를 복사해서 붙여넣어 주세요.');
          return;
        }

        window.soundCtrl.playClick();
        const result = await window.api.pasteSheetData(text);
        if (result.success) {
          const metadata = await window.api.fetchMetadata();
          if (metadata) {
            window.gameData.loadMetadata(metadata);
          }
          this.checkAndUpdateSheetStatusUI(true, result.count);
          const curUser = window.userModel.getUser();
          if (curUser) this.renderUserProfile(curUser);
          window.soundCtrl.playAttendanceFanfare();
          alert(`🎉 카드 데이터 적용 완료!\n${result.count}개의 실제 카드 정보가 등록되었습니다.`);
        } else {
          alert(`오류: ${result.message}`);
        }
      };
    }

    // 닉네임 저장
    document.getElementById('btn-save-nickname').onclick = () => {
      const val = document.getElementById('input-new-nickname').value;
      if (val.trim()) {
        window.userModel.setNickname(val.trim());
        window.soundCtrl.playClick();
        this.closeModal('modal-nickname');
      }
    };

    // 모달 닫기 버튼들 일괄 바인딩
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.onclick = () => {
        window.soundCtrl.playClick();
        this.closeModal(btn.dataset.close);
      };
    });

    // 개발용 간편 로그인
    document.getElementById('btn-dev-login').onclick = () => {
      const nick = document.getElementById('input-dev-nickname').value;
      window.soundCtrl.playClick();
      window.authController.loginWithMock(nick);
    };

    // 로그아웃
    document.getElementById('btn-logout').onclick = () => {
      if (confirm('로그아웃 하시겠습니까?')) {
        window.soundCtrl.playClick();
        window.authController.logout();
      }
    };
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  // =========================================================================
  // ANTI-CHEAT & DEVTOOLS PROTECTION (F12 및 콘솔 조작 방지)
  // =========================================================================
  initAntiCheat() {
    // 1. F12 및 개발자 도구 단축키 차단 (F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S)
    window.addEventListener('keydown', (e) => {
      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isCtrlShiftI = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73);
      const isCtrlShiftJ = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74);
      const isCtrlShiftC = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67);
      const isCtrlShiftK = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.keyCode === 75);
      const isCtrlU = (e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85);
      const isCtrlS = (e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83);

      if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC || isCtrlShiftK || isCtrlU || isCtrlS) {
        e.preventDefault();
        e.stopPropagation();
        this.showAntiCheatWarning('치트 방지를 위해 개발자 도구(F12) 및 단축키 접근이 차단되어 있습니다.');
        return false;
      }
    }, true);

    // 2. 우클릭(컨텍스트 메뉴) 검사 차단
    window.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      this.showAntiCheatWarning('치트 방지를 위해 마우스 우클릭 검사가 비활성화되어 있습니다.');
      return false;
    }, true);

    // 3. 콘솔 보안 경고 출력
    try {
      console.clear();
      console.log('%c[안내] 치트 방지 및 보안 시스템 작동 중', 'color: #ef4444; font-size: 18px; font-weight: bold;');
      console.log('%c포인트 증감, 가챠 추첨, SP 계산, 출석체크는 모두 서버에서 엄격히 검증 처리됩니다. 클라이언트 수치 조작은 서버와 동기화되지 않고 무효 처리됩니다.', 'color: #f59e0b; font-size: 13px;');
    } catch (err) {}
  }

  showAntiCheatWarning(msg) {
    let existing = document.getElementById('anti-cheat-toast');
    if (existing) {
      existing.remove();
    }
    const toast = document.createElement('div');
    toast.id = 'anti-cheat-toast';
    toast.className = 'anti-cheat-toast';
    toast.innerHTML = `🛡️ <strong>보안 알림:</strong> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2400);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
