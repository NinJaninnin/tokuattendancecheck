const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = '1asIP47jypSXf280OkIf5stQZ2TvUQWKZsjDs2vwt_I4';
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SHEET_CACHE_FILE = path.join(DATA_DIR, 'sheet_cache.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write users file:', e);
  }
}

// 데이터 완성도 검증 함수: 모든 필수 데이터(card_id, name, rank, sp_point)가 온전히 작성되어 있는지 검사
function isCardComplete(card, validRanks = ['UR', 'SSR', 'SR', 'R', 'N']) {
  if (!card) return false;
  const id = (card.card_id || '').trim();
  const name = (card.name || '').trim();
  const rank = (card.rank || '').trim().toUpperCase();

  if (!id || id.length < 3) return false;
  // 빈 문자열, null, undefined, #N/A, 미정, 준비중 등 미작성 데이터 제외
  if (!name || name === '-' || name.toUpperCase() === 'NULL' || name.toUpperCase() === 'UNDEFINED' || name.startsWith('#N/A') || name === '미정' || name === '준비중') {
    return false;
  }
  if (!rank || rank === '-' || rank === 'NULL' || rank === 'UNDEFINED' || rank.startsWith('#N/A')) {
    return false;
  }
  if (!validRanks.includes(rank)) {
    return false;
  }
  return true;
}

// img_card 폴더를 동적으로 스캔하여 카드 목록 생성 (추후 지속적 카드 추가 지원)
function generateDynamicCards() {
  const cards = [];
  const imgCardDir = path.join(ROOT_DIR, 'img_card');
  let cardIds = [];

  if (fs.existsSync(imgCardDir)) {
    try {
      const files = fs.readdirSync(imgCardDir);
      const idSet = new Set();
      files.forEach(f => {
        const m = f.match(/card_(\d+)\.webp/i);
        if (m) {
          idSet.add('card_' + m[1].padStart(4, '0'));
        }
      });
      cardIds = Array.from(idSet).sort();
    } catch (err) {
      console.error('Error scanning img_card directory:', err);
    }
  }

  // 만약 폴더 스캔에 실패했거나 비어있을 경우 최소 기본셋 제공
  if (cardIds.length === 0) {
    for (let i = 0; i <= 181; i++) {
      cardIds.push('card_' + String(i).padStart(4, '0'));
    }
  }

  const starterCards = ['card_0000', 'card_0022', 'card_0065', 'card_0078', 'card_0156'];

  cardIds.forEach((id, idx) => {
    let rank = 'N';
    if (idx < 10) rank = 'UR';
    else if (idx < 36) rank = 'SSR';
    else if (idx < 82) rank = 'SR';
    else if (idx < 132) rank = 'R';
    else rank = 'N';

    if (starterCards.includes(id)) {
      if (rank === 'N' || rank === 'R') rank = 'SR';
    }

    const card = {
      card_id: id,
      name: `영웅 ${id.replace('card_', '#')}`,
      rank: rank,
      is_complete: true
    };

    if (isCardComplete(card)) {
      cards.push(card);
    }
  });

  return cards;
}

function readSheetCache() {
  try {
    if (fs.existsSync(SHEET_CACHE_FILE)) {
      const raw = fs.readFileSync(SHEET_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read sheet cache:', e);
  }
  return null;
}

function writeSheetCache(cacheData) {
  try {
    fs.writeFileSync(SHEET_CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('[SheetCache] Successfully saved sheet cache to disk.');
  } catch (e) {
    console.error('Failed to write sheet cache:', e);
  }
}

function fetchUrl(targetUrl, maxRedirects = 4) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = url.resolve(targetUrl, redirectUrl);
        }
        if (redirectUrl.includes('ServiceLogin')) {
          return resolve({ statusCode: 401, body: '', isRestricted: true });
        }
        return resolve(fetchUrl(redirectUrl, maxRedirects - 1));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data, isRestricted: false });
      });
    });
    req.on('error', reject);
  });
}

function parseGvizResponse(rawText) {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start < 0 || end < 0) return null;
  const json = JSON.parse(rawText.substring(start, end + 1));
  const table = json.table;
  if (!table || !table.cols || !table.rows) return null;

  const headers = table.cols.map(c => (c.label || c.id || '').trim().toLowerCase());
  const rows = [];

  table.rows.forEach(r => {
    if (!r.c) return;
    const rowObj = {};
    r.c.forEach((cell, idx) => {
      const colName = headers[idx] || `col_${idx}`;
      rowObj[colName] = cell && cell.v !== null && cell.v !== undefined ? cell.v : '';
    });
    rows.push(rowObj);
  });

  return rows;
}

// 구글 시트에서 직접 cardlist, cardrank, gacha 탭 읽기 시도
async function tryFetchGoogleSheet() {
  const gvizBase = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

  // 1. cardlist 테스트
  const resCardlist = await fetchUrl(`${gvizBase}&sheet=cardlist`);
  if (resCardlist.isRestricted || resCardlist.statusCode === 401) {
    return {
      success: false,
      reason: 'RESTRICTED_ACCESS',
      message: '구글 시트가 [제한됨(비공개)] 상태입니다. 시트 우측 상단 [공유] 메뉴에서 [링크가 있는 모든 사용자]로 변경하시면 즉시 실제 카드 이름이 연동됩니다.'
    };
  }

  const rawRows = parseGvizResponse(resCardlist.body);
  if (!rawRows || rawRows.length === 0) {
    return {
      success: false,
      reason: 'EMPTY_OR_INVALID',
      message: '구글 시트의 cardlist 탭 데이터를 읽을 수 없습니다.'
    };
  }

  // rank & gacha 시도
  let cardrank = DEFAULT_METADATA.cardrank;
  try {
    const resRank = await fetchUrl(`${gvizBase}&sheet=cardrank`);
    const rankRows = parseGvizResponse(resRank.body);
    if (rankRows && rankRows.length > 0) {
      cardrank = rankRows.map(r => ({
        rank: String(r.rank || '').trim().toUpperCase(),
        sp_point: Number(r.sp_point || r.sp) || 30,
        name: String(r.name || r.rank || '')
      })).filter(r => r.rank);
    }
  } catch (e) {}

  let gachaRates = DEFAULT_METADATA.gacha;
  try {
    const resGacha = await fetchUrl(`${gvizBase}&sheet=gacha`);
    const gachaRows = parseGvizResponse(resGacha.body);
    if (gachaRows && gachaRows.length > 0) {
      gachaRates = gachaRows.map(r => ({
        rank: String(r.rank || '').trim().toUpperCase(),
        rate: parseFloat(r.rate || r.probability) || 0
      })).filter(r => r.rank);
    }
  } catch (e) {}

  const validRanks = cardrank.map(r => r.rank);
  const cardlist = [];

  rawRows.forEach(row => {
    // 키 정규화
    const cardId = String(row.card_id || row.id || row.col_0 || '').trim();
    const name = String(row.name || row.card_name || row.col_1 || '').trim();
    const rank = String(row.rank || row.grade || row.col_2 || 'N').trim().toUpperCase();

    const cardObj = {
      card_id: cardId,
      name: name,
      rank: rank,
      is_complete: isCardComplete({ card_id: cardId, name, rank }, validRanks)
    };

    if (cardId) {
      cardlist.push(cardObj);
    }
  });

  const cache = {
    connected: true,
    synced_at: new Date().toISOString(),
    cardrank: cardrank,
    gacha: gachaRates,
    cardlist: cardlist
  };

  writeSheetCache(cache);

  return {
    success: true,
    count: cardlist.length,
    completeCount: cardlist.filter(c => c.is_complete).length,
    message: `구글 시트 연동 성공! 총 ${cardlist.length}개의 카드가 성공적으로 로드되었습니다.`
  };
}

function parsePastedCardlist(text) {
  const lines = text.trim().split(/\r?\n/);
  const cards = [];
  if (lines.length === 0) return cards;

  let headers = [];
  let startIdx = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('card_id') || firstLine.includes('name') || firstLine.includes('rank')) {
    headers = lines[0].split(/[\t,]/).map(h => h.trim().toLowerCase());
    startIdx = 1;
  } else {
    headers = ['card_id', 'name', 'rank'];
  }

  const idIdx = headers.findIndex(h => h.includes('id') || h.includes('card'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('이름'));
  const rankIdx = headers.findIndex(h => h.includes('rank') || h.includes('등급'));

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[\t,]/).map(p => p.trim());
    const cardId = parts[idIdx >= 0 ? idIdx : 0] || '';
    const name = parts[nameIdx >= 0 ? nameIdx : 1] || '';
    const rank = (parts[rankIdx >= 0 ? rankIdx : 2] || 'N').toUpperCase();

    if (cardId) {
      cards.push({
        card_id: cardId,
        name: name,
        rank: rank,
        is_complete: isCardComplete({ card_id: cardId, name, rank })
      });
    }
  }
  return cards;
}

const DEFAULT_METADATA = {
  cardrank: [
    { rank: 'UR', sp_point: 1000, name: '울트라 레어' },
    { rank: 'SSR', sp_point: 500, name: '슈퍼 스페셜 레어' },
    { rank: 'SR', sp_point: 200, name: '슈퍼 레어' },
    { rank: 'R', sp_point: 80, name: '레어' },
    { rank: 'N', sp_point: 30, name: '노멀' }
  ],
  gacha: [
    { rank: 'UR', rate: 0.02 },
    { rank: 'SSR', rate: 0.06 },
    { rank: 'SR', rate: 0.18 },
    { rank: 'R', rate: 0.34 },
    { rank: 'N', rate: 0.40 }
  ],
  cardlist: generateDynamicCards()
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- API Endpoints ---
  if (pathname === '/api/metadata') {
    const cache = readSheetCache();
    if (cache && cache.cardlist && cache.cardlist.length > 0) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        sheetConnected: true,
        cardrank: cache.cardrank || DEFAULT_METADATA.cardrank,
        gacha: cache.gacha || DEFAULT_METADATA.gacha,
        cardlist: cache.cardlist,
        synced_at: cache.synced_at
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      sheetConnected: false,
      sheetError: 'RESTRICTED_ACCESS',
      ...DEFAULT_METADATA
    }));
    return;
  }

  if (pathname === '/api/sheet-status' && req.method === 'GET') {
    const cache = readSheetCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      cached: !!cache,
      cardCount: cache ? cache.cardlist.length : 0,
      synced_at: cache ? cache.synced_at : null
    }));
    return;
  }

  if (pathname === '/api/sync-sheet' && req.method === 'POST') {
    tryFetchGoogleSheet().then(result => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  if (pathname === '/api/paste-sheet-data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const text = payload.text || '';
        const parsedCards = parsePastedCardlist(text);

        if (parsedCards.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: '유효한 카드 데이터를 찾을 수 없습니다.' }));
          return;
        }

        const currentCache = readSheetCache() || {
          cardrank: DEFAULT_METADATA.cardrank,
          gacha: DEFAULT_METADATA.gacha
        };

        currentCache.connected = true;
        currentCache.synced_at = new Date().toISOString();
        currentCache.cardlist = parsedCards;
        writeSheetCache(currentCache);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          count: parsedCards.length,
          completeCount: parsedCards.filter(c => c.is_complete).length,
          message: `성공! ${parsedCards.length}개의 카드 정보가 정상 등록되었습니다.`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/rankings') {
    const users = readUsers().filter(u => u && u.uid && !u.uid.startsWith('ai_'));
    users.sort((a, b) => (b.total_sp || 0) - (a.total_sp || 0));
    const top10 = users.slice(0, 10).map((u, idx) => ({
      rank: idx + 1,
      uid: u.uid,
      nickname: u.nickname || '모험가',
      main_character: u.main_character || 'card_0000',
      total_sp: u.total_sp || 0
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      rankings: top10,
      total_users: users.length,
      updated_at: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/api/user' && req.method === 'GET') {
    const uid = parsedUrl.query.uid;
    if (!uid) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'uid is required' }));
      return;
    }
    const users = readUsers();
    const user = users.find(u => u.uid === uid);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: !!user, user: user || null }));
    return;
  }

  function getActiveMetadata() {
    const cache = readSheetCache();
    if (cache && cache.cardlist && cache.cardlist.length > 0) {
      return cache;
    }
    return DEFAULT_METADATA;
  }

  function getTodayKST() {
    const d = new Date();
    // KST is UTC + 9
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function recalculateUserSP(user, metadata) {
    const rankSpMap = {};
    (metadata.cardrank || []).forEach(r => {
      rankSpMap[String(r.rank).toUpperCase()] = Number(r.sp_point) || 0;
    });

    const cardMap = {};
    (metadata.cardlist || []).forEach(c => {
      cardMap[c.card_id] = c;
    });

    let total = 0;
    const owned = user.owned_cards || {};
    for (const [cardId, count] of Object.entries(owned)) {
      const card = cardMap[cardId];
      if (card) {
        const sp = rankSpMap[card.rank] !== undefined ? rankSpMap[card.rank] : (card.sp_point || 0);
        total += sp * (Number(count) || 0);
      }
    }
    return total;
  }

  // --- 치트 방지: 서버 측 가챠 검증 및 추첨 엔드포인트 ---
  if (pathname === '/api/gacha/draw' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const uid = payload.uid;
        const isMulti = !!payload.isMulti;
        const cost = isMulti ? 1000 : 100;
        const drawCount = isMulti ? 11 : 1;

        const users = readUsers();
        let user = users.find(u => u.uid === uid);
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: '사용자를 찾을 수 없습니다.' }));
          return;
        }

        // [F12 치트 원천 차단] 서버 측 보유 포인트 검증
        if ((user.points || 0) < cost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            reason: 'NOT_ENOUGH_POINTS',
            currentPoints: user.points,
            message: `포인트가 부족합니다. (필요: ${cost}P, 보유: ${user.points}P)`
          }));
          return;
        }

        // 서버에서 포인트 차감
        user.points -= cost;

        const metadata = getActiveMetadata();
        const rates = metadata.gacha || DEFAULT_METADATA.gacha;
        // ※ 데이터가 모두 작성되어 있지 않은 카드는 가챠에서 나오지 않음 (완성된 카드만 필터링)
        const completeCards = (metadata.cardlist || []).filter(c => c.is_complete);

        if (completeCards.length === 0) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: '출현 가능한 유효 카드가 없습니다.' }));
          return;
        }

        const drawnCards = [];
        let totalSpGained = 0;
        let highestRank = 'N';
        const rankOrder = { SUHR: 6, HR: 5, UR: 4, SR: 3, R: 2, N: 1 };

        if (!user.owned_cards) user.owned_cards = {};

        for (let i = 0; i < drawCount; i++) {
          const rand = Math.random();
          let acc = 0;
          let selectedRank = 'N';
          for (const r of rates) {
            acc += r.rate;
            if (rand <= acc) {
              selectedRank = r.rank;
              break;
            }
          }

          let pool = completeCards.filter(c => c.rank === selectedRank);
          if (pool.length === 0) pool = completeCards;

          const chosen = pool[Math.floor(Math.random() * pool.length)];
          const prevCount = user.owned_cards[chosen.card_id] || 0;
          user.owned_cards[chosen.card_id] = prevCount + 1;

          totalSpGained += (chosen.sp_point || 0);

          if ((rankOrder[chosen.rank] || 0) > (rankOrder[highestRank] || 0)) {
            highestRank = chosen.rank;
          }

          drawnCards.push({
            card_id: chosen.card_id,
            name: chosen.name,
            rank: chosen.rank,
            sp_point: chosen.sp_point,
            name_jp: chosen.name_jp || '',
            name_en: chosen.name_en || '',
            isNew: prevCount === 0,
            previousCount: prevCount,
            newCount: prevCount + 1
          });
        }

        // [F12 치트 원천 차단] 서버에서 정확한 SP 재계산
        user.total_sp = recalculateUserSP(user, metadata);
        user.updated_at = new Date().toISOString();
        writeUsers(users);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          cards: drawnCards,
          user: user,
          totalSpGained: totalSpGained,
          highestRank: highestRank
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- 치트 방지: 서버 측 일일 출석체크 검증 엔드포인트 ---
  if (pathname === '/api/attendance/check' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const uid = payload.uid;
        const users = readUsers();
        let user = users.find(u => u.uid === uid);
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: '사용자를 찾을 수 없습니다.' }));
          return;
        }

        const today = getTodayKST();
        if (user.last_attendance_date === today) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            alreadyChecked: true,
            today: today,
            message: '오늘 이미 출석체크를 완료하셨습니다.'
          }));
          return;
        }

        // 서버에서 출석 보상 1,000P 지급
        user.points = (user.points || 0) + 1000;
        user.last_attendance_date = today;
        user.updated_at = new Date().toISOString();
        writeUsers(users);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          reward: 1000,
          today: today,
          user: user
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- 치트 방지: 서버 측 접속 시간 검증 및 정산 엔드포인트 ---
  if (pathname === '/api/time/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const uid = payload.uid;
        const users = readUsers();
        let user = users.find(u => u.uid === uid);
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: '사용자를 찾을 수 없습니다.' }));
          return;
        }

        const now = Date.now();
        const lastSync = user.last_sync_timestamp || now;
        const elapsed = now - lastSync;

        let pointsEarned = 0;
        if (elapsed >= 60000) {
          pointsEarned = Math.floor(elapsed / 60000);
          user.points = (user.points || 0) + pointsEarned;
          user.last_sync_timestamp = lastSync + (pointsEarned * 60000);
          user.updated_at = new Date().toISOString();
          writeUsers(users);
        }

        const nextRemaining = 60000 - ((now - (user.last_sync_timestamp || now)) % 60000);
        const remainingSec = Math.max(1, Math.ceil(nextRemaining / 1000));

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          pointsEarned: pointsEarned,
          currentPoints: user.points,
          remainingSec: remainingSec,
          user: user
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/user' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const userData = payload.user || payload;
        if (!userData || !userData.uid) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Invalid user data' }));
          return;
        }

        const users = readUsers();
        const existingIdx = users.findIndex(u => u.uid === userData.uid);
        const metadata = getActiveMetadata();

        if (existingIdx >= 0) {
          const u = users[existingIdx];
          // 닉네임 변경 및 대표 캐릭터 변경 허용
          if (userData.nickname) u.nickname = String(userData.nickname).trim().slice(0, 16);
          if (userData.main_character && u.owned_cards && u.owned_cards[userData.main_character]) {
            u.main_character = userData.main_character;
          }
          // [F12 치트 원천 차단] 클라이언트가 임의로 보낸 points와 total_sp는 무시하고 서버 데이터 유지 및 재계산
          u.total_sp = recalculateUserSP(u, metadata);
          u.updated_at = new Date().toISOString();
          users[existingIdx] = u;
        } else {
          // 신규 유저 등록
          const starterCards = ['card_0000', 'card_0022', 'card_0065', 'card_0078', 'card_0156'];
          const gift = starterCards[Math.floor(Math.random() * starterCards.length)];
          const initialOwned = {};
          initialOwned[gift] = 1;

          const newUser = {
            uid: userData.uid,
            nickname: (userData.nickname || '모험가').slice(0, 16),
            main_character: gift,
            points: 1000,
            last_attendance_date: getTodayKST(),
            last_sync_timestamp: Date.now(),
            is_initial_gift_received: true,
            created_at: Date.now(),
            owned_cards: initialOwned,
            updated_at: new Date().toISOString()
          };
          newUser.total_sp = recalculateUserSP(newUser, metadata);
          users.push(newUser);
        }
        writeUsers(users);

        const targetUser = users.find(u => u.uid === userData.uid);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'User saved', user: targetUser }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- Static File Serving ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(ROOT_DIR, safePath);

  // 지능형 이미지 별칭 지원 (BandiView_, 반디뷰_ 접두사 존재 여부와 무관하게 양방향 자동 탐색)
  if (safePath.includes('img_card') || safePath.includes('img_bg')) {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      const filename = path.basename(filePath);
      const cleanName = filename.replace(/^(BandiView_|반디뷰_|bandiview_)/i, '');
      const candidates = [
        cleanName,
        `BandiView_${cleanName}`,
        `반디뷰_${cleanName}`
      ];
      for (const cand of candidates) {
        const alt = path.join(dir, cand);
        if (fs.existsSync(alt)) {
          filePath = alt;
          break;
        }
      }
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.webp' || ext === '.js' ? 'public, max-age=86400' : 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const { exec } = require('child_process');

function runPythonXlsxParser() {
  console.log('[XLSX Sync] Triggering parse_xlsx.py...');
  exec('python parse_xlsx.py', { cwd: ROOT_DIR }, (err, stdout, stderr) => {
    if (err) {
      console.error('[XLSX Sync Error]:', err.message);
    } else {
      console.log('[XLSX Sync Output]:', stdout.trim());
    }
  });
}

// Watch toku_attendancecheck.xlsx for automated live updates
const localXlsxPath = path.join(ROOT_DIR, 'toku_attendancecheck.xlsx');
if (fs.existsSync(localXlsxPath)) {
  runPythonXlsxParser();
  fs.watchFile(localXlsxPath, { interval: 2000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('[File Watcher] toku_attendancecheck.xlsx updated! Re-parsing...');
      runPythonXlsxParser();
    }
  });
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎮 Toku CheckAttendance & Gacha Game Server Running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
