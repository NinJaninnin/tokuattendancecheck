/**
 * Card Database, Ranks, SP Points and Gacha Probabilities
 */
class GameDataManager {
  constructor() {
    this.ranks = [
      { rank: 'UR', sp_point: 1000, name: '울트라 레어', color: '#ff007f', bgGlow: 'linear-gradient(135deg, #ff007f, #00f0ff)' },
      { rank: 'SSR', sp_point: 500, name: '슈퍼 스페셜 레어', color: '#ffd700', bgGlow: 'linear-gradient(135deg, #ffd700, #ff8400)' },
      { rank: 'SR', sp_point: 200, name: '슈퍼 레어', color: '#b300ff', bgGlow: 'linear-gradient(135deg, #b300ff, #8000ff)' },
      { rank: 'R', sp_point: 80, name: '레어', color: '#00a2ff', bgGlow: 'linear-gradient(135deg, #00a2ff, #00d0ff)' },
      { rank: 'N', sp_point: 30, name: '노멀', color: '#a0b0c0', bgGlow: 'linear-gradient(135deg, #7a8a9a, #a0b0c0)' }
    ];

    this.gachaRates = [
      { rank: 'UR', rate: 0.02 },
      { rank: 'SSR', rate: 0.06 },
      { rank: 'SR', rate: 0.18 },
      { rank: 'R', rate: 0.34 },
      { rank: 'N', rate: 0.40 }
    ];

    // 스타터 5종 카드
    this.starterCards = ['card_0000', 'card_0022', 'card_0065', 'card_0078', 'card_0156'];

    // 182종 카드 기본 리스트
    this.cards = {};
    this.initDefaultCards();
  }

  initDefaultCards() {
    for (let i = 0; i <= 181; i++) {
      const id = 'card_' + String(i).padStart(4, '0');
      let rank = 'N';
      if (i < 10) rank = 'UR';
      else if (i < 36) rank = 'SSR';
      else if (i < 82) rank = 'SR';
      else if (i < 132) rank = 'R';
      else rank = 'N';

      if (this.starterCards.includes(id)) {
        if (rank === 'N' || rank === 'R') rank = 'SR';
      }

      this.cards[id] = {
        card_id: id,
        name: `영웅 ${id.replace('card_', '#')}`,
        rank: rank,
        sp_point: this.getRankSP(rank),
        is_complete: true
      };
    }
  }

  getRankSP(rank) {
    const found = this.ranks.find(r => r.rank === (rank || 'N').toUpperCase());
    return found ? found.sp_point : 30;
  }

  getRankInfo(rank) {
    const found = this.ranks.find(r => r.rank === (rank || 'N').toUpperCase());
    return found || this.ranks[4];
  }

  getCard(cardId) {
    if (this.cards[cardId]) {
      return this.cards[cardId];
    }
    // 폴백
    return {
      card_id: cardId || 'card_0000',
      name: `영웅 ${(cardId || '').replace('card_', '#')}`,
      rank: 'N',
      sp_point: 30
    };
  }

  getCardImagePath(cardId) {
    if (!cardId) cardId = 'card_0000';
    return `img_card/BandiView_${cardId}.webp`;
  }

  // 카드 필수 데이터 완성도 검증
  isCardComplete(card) {
    if (!card) return false;
    const id = (card.card_id || '').trim();
    const name = (card.name || '').trim();
    const rank = (card.rank || '').trim().toUpperCase();

    if (!id || id.length < 3) return false;
    if (!name || name === '-' || name.toUpperCase() === 'NULL' || name.toUpperCase() === 'UNDEFINED' || name.indexOf('#N/A') >= 0 || name === '미정' || name === '준비중') {
      return false;
    }
    if (!rank || rank === '-' || rank === 'NULL' || rank === 'UNDEFINED' || rank.indexOf('#N/A') >= 0) {
      return false;
    }
    const rankExists = this.ranks.some(r => r.rank === rank);
    if (!rankExists) return false;

    return true;
  }

  // 가챠에서 출현 가능한 완전한 데이터의 카드 풀만 반환
  // ※ 데이터가 모두 작성되어 있지 않은 카드는 가챠에서 나오지 않음
  getGachaPool(rank = null) {
    const all = Object.values(this.cards);
    return all.filter(c => {
      if (!c.is_complete) return false;
      if (rank && c.rank !== rank) return false;
      return true;
    });
  }

  // 데이터가 완전한 모든 카드 목록 반환
  getAllCompleteCards() {
    return Object.values(this.cards).filter(c => c.is_complete);
  }

  // 구글 시트 등 외부 메타데이터로 갱신 (추후 지속적 카드 추가 완벽 지원)
  loadMetadata(metadata) {
    if (!metadata) return;

    if (Array.isArray(metadata.cardrank) && metadata.cardrank.length > 0) {
      metadata.cardrank.forEach(r => {
        const existing = this.ranks.find(item => item.rank === r.rank);
        if (existing) {
          existing.sp_point = Number(r.sp_point) || existing.sp_point;
          if (r.name) existing.name = r.name;
        } else {
          this.ranks.push({
            rank: r.rank,
            sp_point: Number(r.sp_point) || 30,
            name: r.name || r.rank,
            color: '#a0b0c0'
          });
        }
      });
    }

    if (Array.isArray(metadata.gacha) && metadata.gacha.length > 0) {
      this.gachaRates = metadata.gacha.map(g => ({
        rank: g.rank,
        rate: parseFloat(g.rate) || 0
      }));
    }

    if (Array.isArray(metadata.cardlist) && metadata.cardlist.length > 0) {
      metadata.cardlist.forEach(c => {
        const rawRank = c.rank ? String(c.rank).trim().toUpperCase() : '';
        const rawName = c.name ? String(c.name).trim() : '';
        const cardObj = {
          card_id: String(c.card_id || '').trim(),
          name: rawName,
          rank: rawRank,
          sp_point: this.getRankSP(rawRank)
        };

        // 데이터 작성 완결 여부 체크
        cardObj.is_complete = this.isCardComplete(cardObj);
        this.cards[cardObj.card_id] = cardObj;
      });
    }

    const completeCount = this.getAllCompleteCards().length;
    console.log(`[GameData] Loaded ${Object.keys(this.cards).length} total cards (${completeCount} complete & available for gacha)`);
  }

  // 보유 카드 기반 총 SP 계산
  calculateTotalSP(ownedCards) {
    if (!ownedCards) return 0;
    let total = 0;
    for (const [cardId, count] of Object.entries(ownedCards)) {
      const card = this.getCard(cardId);
      total += (card.sp_point || 0) * (count || 0);
    }
    return total;
  }
}

window.gameData = new GameDataManager();
