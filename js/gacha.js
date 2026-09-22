/**
 * Gacha System Controller (1 Draw / 10+1 Draw, Probabilities, SP Calculations)
 */
class GachaSystem {
  constructor() {
    this.SINGLE_COST = 100;
    this.MULTI_COST = 1000;
    this.MULTI_COUNT = 11; // 10회 가격으로 11개 획득
  }

  // 1개 카드 가챠 추첨
  drawOne() {
    const rates = window.gameData.gachaRates;
    const rand = Math.random();
    let accumulated = 0;
    let selectedRank = 'N';

    for (const item of rates) {
      accumulated += item.rate;
      if (rand <= accumulated) {
        selectedRank = item.rank;
        break;
      }
    }

    // ※ 데이터가 모두 작성되어 있지 않은 카드는 가챠에서 나오지 않음
    // 해당 등급 중 데이터가 온전히 작성된(is_complete == true) 카드 풀만 추출
    let pool = window.gameData.getGachaPool(selectedRank);

    // 만약 해당 등급에 아직 완성된 카드가 없다면 다른 완성된 카드들 중에서 안전하게 추첨
    if (pool.length === 0) {
      console.warn(`[Gacha] ${selectedRank} 등급에 데이터가 완성된 카드가 없어 전체 완성 카드 풀에서 추첨합니다.`);
      pool = window.gameData.getAllCompleteCards();
    }

    if (pool.length === 0) {
      console.error('[Gacha] 가챠에 출현 가능한 완성된 카드가 존재하지 않습니다.');
      return null;
    }

    const chosenCard = pool[Math.floor(Math.random() * pool.length)];
    return { ...chosenCard };
  }

  // 1회 뽑기 실행
  executeSingleDraw(user) {
    if (!user || user.points < this.SINGLE_COST) {
      return { success: false, reason: 'NOT_ENOUGH_POINTS' };
    }

    const card = this.drawOne();
    const owned = user.owned_cards || {};
    const prevCount = owned[card.card_id] || 0;
    const isNew = prevCount === 0;

    const resultCard = {
      ...card,
      isNew: isNew,
      previousCount: prevCount,
      newCount: prevCount + 1
    };

    return {
      success: true,
      cost: this.SINGLE_COST,
      cards: [resultCard],
      totalSpGained: card.sp_point,
      highestRank: card.rank
    };
  }

  // 10회(11연) 뽑기 실행
  executeMultiDraw(user) {
    if (!user || user.points < this.MULTI_COST) {
      return { success: false, reason: 'NOT_ENOUGH_POINTS' };
    }

    const cards = [];
    let totalSp = 0;
    const rankOrder = { UR: 5, SSR: 4, SR: 3, R: 2, N: 1 };
    let highestRank = 'N';

    // 시뮬레이션용 임시 복사본
    const tempOwned = { ...(user.owned_cards || {}) };

    for (let i = 0; i < this.MULTI_COUNT; i++) {
      const card = this.drawOne();
      const prevCount = tempOwned[card.card_id] || 0;
      const isNew = prevCount === 0;

      tempOwned[card.card_id] = prevCount + 1;
      totalSp += card.sp_point;

      if ((rankOrder[card.rank] || 0) > (rankOrder[highestRank] || 0)) {
        highestRank = card.rank;
      }

      cards.push({
        ...card,
        isNew: isNew,
        previousCount: prevCount,
        newCount: prevCount + 1
      });
    }

    return {
      success: true,
      cost: this.MULTI_COST,
      cards: cards,
      totalSpGained: totalSp,
      highestRank: highestRank
    };
  }
}

window.gachaSystem = new GachaSystem();
