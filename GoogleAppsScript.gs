/**
 * Google Apps Script for Toku CheckAttendance & Gacha System
 * 
 * [설치 및 배포 방법]
 * 1. 스프레드시트 (https://docs.google.com/spreadsheets/d/1asIP47jypSXf280OkIf5stQZ2TvUQWKZsjDs2vwt_I4/edit) 열기
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 3. 기존 코드를 모두 지우고 이 파일의 내용을 복사하여 붙여넣기
 * 4. 시트가 비어있다면, 상단 함수 선택에서 'initSpreadsheet' 선택 후 [실행] 클릭 (시트 탭 및 기본 데이터 자동 생성)
 * 5. 우측 상단 [배포] -> [새 배포] 클릭
 * 6. 유형 선택(톱니바퀴) -> [웹 앱] 선택
 * 7. 설정:
 *    - 설명: Toku Gacha API v1
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (※ 중요: 익명 브라우저 호출 허용)
 * 8. [배포] 클릭 후 승인 절차 진행 -> 생성된 [웹 앱 URL] 복사
 * 9. 게임 화면 우측 상단 [설정] 아이콘을 누르고 복사한 웹 앱 URL을 입력하면 실시간 양방향 연동 완료!
 */

const SPREADSHEET_ID = '1asIP47jypSXf280OkIf5stQZ2TvUQWKZsjDs2vwt_I4';

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
}

/**
 * GET 요청 처리
 */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || 'getMetadata';
  
  try {
    let result = {};
    if (action === 'getMetadata') {
      result = getMetadata();
    } else if (action === 'getRankings') {
      result = getRankings();
    } else if (action === 'getOnlineUsers') {
      result = getOnlineUsers();
    } else if (action === 'getUser') {
      const uid = params.uid;
      const email = params.email;
      result = getUser(uid, email);
    } else if (action === 'init') {
      result = initSpreadsheet();
    } else {
      result = { success: false, message: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST 요청 처리 (유저 데이터 저장/동기화)
 */
function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (ex) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }
    
    const action = data.action || 'saveUser';
    let result = {};
    
    if (action === 'saveUser') {
      result = saveUser(data.user || data);
    } else {
      result = { success: false, message: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * cardlist, cardrank, gacha 탭의 데이터 가져오기
 */
function getMetadata() {
  const ss = getSpreadsheet();
  
  // 1. cardrank
  const rankSheet = ss.getSheetByName('cardrank');
  let cardrank = [];
  if (rankSheet) {
    const data = rankSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const rankIdx = headers.indexOf('rank');
      const spIdx = headers.indexOf('sp_point') >= 0 ? headers.indexOf('sp_point') : headers.indexOf('sp');
      const nameIdx = headers.indexOf('name');
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        cardrank.push({
          rank: String(row[rankIdx >= 0 ? rankIdx : 0]).trim(),
          sp_point: Number(row[spIdx >= 0 ? spIdx : 1]) || 0,
          name: nameIdx >= 0 ? String(row[nameIdx]) : String(row[0])
        });
      }
    }
  }
  
  // 유효한 등급 목록 추출
  const validRanks = cardrank.map(r => r.rank);

  // 2. cardlist
  const cardSheet = ss.getSheetByName('cardlist');
  let cardlist = [];
  if (cardSheet) {
    const data = cardSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const idIdx = headers.indexOf('card_id') >= 0 ? headers.indexOf('card_id') : 0;
      const nameIdx = headers.indexOf('name') >= 0 ? headers.indexOf('name') : 1;
      const rankIdx = headers.indexOf('rank') >= 0 ? headers.indexOf('rank') : 2;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const cardId = String(row[idIdx] || '').trim();
        const name = String(row[nameIdx] || '').trim();
        const rank = String(row[rankIdx] || '').trim().toUpperCase();

        // ※ 데이터가 모두 작성되어 있지 않은 카드는 가챠 및 유효 풀에서 제외
        // 1) card_id가 비어있거나 불완전한 경우
        if (!cardId || cardId.length < 3) continue;
        // 2) 이름이 비어있거나 미정, #N/A, NULL 등의 플레이스홀더인 경우
        if (!name || name === '-' || name.toUpperCase() === 'NULL' || name.toUpperCase() === 'UNDEFINED' || name.indexOf('#N/A') >= 0 || name === '미정' || name === '준비중') {
          continue;
        }
        // 3) 등급이 비어있거나 cardrank에 없는 미등록 등급인 경우
        if (!rank || !validRanks.includes(rank)) {
          continue;
        }

        cardlist.push({
          card_id: cardId,
          name: name,
          rank: rank,
          is_complete: true
        });
      }
    }
  }
  
  // 3. gacha
  const gachaSheet = ss.getSheetByName('gacha');
  let gacha = [];
  if (gachaSheet) {
    const data = gachaSheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const rankIdx = headers.indexOf('rank') >= 0 ? headers.indexOf('rank') : 0;
      const probIdx = headers.indexOf('rate') >= 0 ? headers.indexOf('rate') : (headers.indexOf('probability') >= 0 ? headers.indexOf('probability') : 1);
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[rankIdx]) continue;
        gacha.push({
          rank: String(row[rankIdx]).trim().toUpperCase(),
          rate: parseFloat(row[probIdx]) || 0
        });
      }
    }
  }
  
  return {
    success: true,
    cardlist: cardlist,
    cardrank: cardrank,
    gacha: gacha,
    timestamp: new Date().getTime()
  };
}

/**
 * 랭킹 1위~10위 조회 (user 시트 기반 SP 총합 정렬)
 */
function getRankings() {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('user');
  if (!userSheet) {
    return { success: true, rankings: [], updated_at: new Date().toISOString() };
  }
  
  const data = userSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, rankings: [], updated_at: new Date().toISOString() };
  }
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uidIdx = headers.indexOf('uid');
  const nickIdx = headers.indexOf('nickname');
  const charIdx = headers.indexOf('main_character');
  const spIdx = headers.indexOf('total_sp');
  
  let users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const uid = String(row[uidIdx] || '').trim();
    if (!uid || uid === 'google_auth_uid_12345' || uid.indexOf('test_') === 0 || uid.indexOf('dummy_') === 0 || uid.indexOf('ai_') === 0 || uid.indexOf('user_godzilla') === 0 || uid.indexOf('user_rider') === 0) continue;
    
    users.push({
      uid: uid,
      nickname: String(row[nickIdx] || '모험가'),
      main_character: String(row[charIdx] || 'card_0000'),
      total_sp: Number(row[spIdx]) || 0
    });
  }
  
  // total_sp 기준 내림차순 정렬
  users.sort((a, b) => b.total_sp - a.total_sp);
  
  // 상위 10명 반환 (순위 번호 부여)
  const top10 = users.slice(0, 10).map((u, idx) => ({
    rank: idx + 1,
    uid: u.uid,
    nickname: u.nickname,
    main_character: u.main_character,
    total_sp: u.total_sp
  }));
  
  return {
    success: true,
    rankings: top10,
    total_users: users.length,
    updated_at: new Date().toISOString()
  };
}

/**
 * 실시간 접속자 조회 (최근 5분 이내 활동 기록 유저)
 */
function getOnlineUsers() {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('user');
  if (!userSheet) {
    return { success: true, count: 0, online_users: [], updated_at: new Date().toISOString() };
  }

  const data = userSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, count: 0, online_users: [], updated_at: new Date().toISOString() };
  }

  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uidIdx = headers.indexOf('uid');
  const nickIdx = headers.indexOf('nickname');
  const charIdx = headers.indexOf('main_character');
  const spIdx = headers.indexOf('total_sp');
  const syncIdx = headers.indexOf('last_sync_timestamp');
  const updatedIdx = headers.indexOf('updated_at');

  const now = new Date().getTime();
  const threshold = 5 * 60 * 1000;
  let onlineUsers = [];
  let totalUsers = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const uid = String(row[uidIdx] || '').trim();
    if (!uid || uid === 'google_auth_uid_12345' || uid.indexOf('test_') === 0 || uid.indexOf('dummy_') === 0 || uid.indexOf('ai_') === 0) continue;
    totalUsers++;

    let lastActive = Number(row[syncIdx]) || 0;
    if (!lastActive && updatedIdx >= 0 && row[updatedIdx]) {
      lastActive = new Date(row[updatedIdx]).getTime();
    }

    if (now - lastActive <= threshold) {
      onlineUsers.push({
        uid: uid,
        nickname: String(row[nickIdx] || '모험가'),
        main_character: String(row[charIdx] || 'card_0000'),
        total_sp: Number(row[spIdx]) || 0,
        last_active_timestamp: lastActive
      });
    }
  }

  onlineUsers.sort((a, b) => b.total_sp - a.total_sp);

  return {
    success: true,
    count: onlineUsers.length,
    total_users: totalUsers,
    online_users: onlineUsers,
    updated_at: new Date().toISOString()
  };
}

/**
 * 유저 정보 조회
 */
function getUser(uid, email) {
  if (!uid && !email) return { success: false, message: 'UID or Email is required' };
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName('user');
  if (!userSheet) return { success: false, message: 'User sheet not found' };
  
  const data = userSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: 'User not found' };
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uidIdx = headers.indexOf('uid');
  const emailIdx = headers.indexOf('email');
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUid = uidIdx >= 0 ? String(row[uidIdx]) : '';
    const rowEmail = emailIdx >= 0 ? String(row[emailIdx]).trim().toLowerCase() : '';

    const matchUid = uid && rowUid === String(uid);
    const matchEmail = cleanEmail && rowEmail === cleanEmail;

    if (matchUid || matchEmail) {
      const ownedCardsStr = row[headers.indexOf('owned_cards')];
      let ownedCards = {};
      try {
        ownedCards = typeof ownedCardsStr === 'string' ? JSON.parse(ownedCardsStr) : ownedCardsStr;
      } catch(e) {}
      
      return {
        success: true,
        user: {
          uid: rowUid,
          email: rowEmail,
          nickname: String(row[headers.indexOf('nickname')]),
          main_character: String(row[headers.indexOf('main_character')]),
          points: Number(row[headers.indexOf('points')]),
          total_sp: Number(row[headers.indexOf('total_sp')]),
          last_attendance_date: String(row[headers.indexOf('last_attendance_date')]),
          last_sync_timestamp: Number(row[headers.indexOf('last_sync_timestamp')]),
          is_initial_gift_received: Boolean(row[headers.indexOf('is_initial_gift_received')]),
          created_at: Number(row[headers.indexOf('created_at')]),
          owned_cards: ownedCards
        }
      };
    }
  }
  
  return { success: false, message: 'User not found' };
}

/**
 * 유저 정보 저장 및 업데이트 (Upsert)
 */
function saveUser(user) {
  if (!user || (!user.uid && !user.email)) return { success: false, message: 'Valid user object with uid or email required' };
  
  const ss = getSpreadsheet();
  let userSheet = ss.getSheetByName('user');
  if (!userSheet) {
    userSheet = ss.insertSheet('user');
    userSheet.appendRow([
      'uid', 'email', 'nickname', 'main_character', 'points', 'total_sp',
      'last_attendance_date', 'last_sync_timestamp', 'is_initial_gift_received',
      'created_at', 'owned_cards', 'updated_at'
    ]);
  }
  
  let data = userSheet.getDataRange().getValues();
  let headers = data[0].map(h => String(h).trim().toLowerCase());
  let uidIdx = headers.indexOf('uid');
  let emailIdx = headers.indexOf('email');

  // 이메일 컬럼이 기존 시트에 없을 경우 자동 확장
  if (emailIdx < 0) {
    userSheet.getRange(1, headers.length + 1).setValue('email');
    data = userSheet.getDataRange().getValues();
    headers = data[0].map(h => String(h).trim().toLowerCase());
    emailIdx = headers.indexOf('email');
  }

  const cleanEmail = user.email ? String(user.email).trim().toLowerCase() : '';

  let targetRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUid = uidIdx >= 0 ? String(row[uidIdx]) : '';
    const rowEmail = emailIdx >= 0 ? String(row[emailIdx]).trim().toLowerCase() : '';

    if ((user.uid && rowUid === String(user.uid)) || (cleanEmail && rowEmail === cleanEmail)) {
      targetRowIndex = i + 1; // 1-based index in Sheet
      break;
    }
  }

  const rowValues = [];
  headers.forEach(h => {
    switch (h) {
      case 'uid': rowValues.push(user.uid || ''); break;
      case 'email': rowValues.push(cleanEmail); break;
      case 'nickname': rowValues.push(user.nickname || ''); break;
      case 'main_character': rowValues.push(user.main_character || 'card_0000'); break;
      case 'points': rowValues.push(Number(user.points) || 0); break;
      case 'total_sp': rowValues.push(Number(user.total_sp) || 0); break;
      case 'last_attendance_date': rowValues.push(user.last_attendance_date || ''); break;
      case 'last_sync_timestamp': rowValues.push(Number(user.last_sync_timestamp) || new Date().getTime()); break;
      case 'is_initial_gift_received': rowValues.push(Boolean(user.is_initial_gift_received)); break;
      case 'created_at': rowValues.push(Number(user.created_at) || new Date().getTime()); break;
      case 'owned_cards': rowValues.push(JSON.stringify(user.owned_cards || {})); break;
      case 'updated_at': rowValues.push(new Date().toISOString()); break;
      default: rowValues.push(''); break;
    }
  });

  if (targetRowIndex > 0) {
    // 기존 유저 행 업데이트
    userSheet.getRange(targetRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // 신규 유저 행 추가
    userSheet.appendRow(rowValues);
  }

  return {
    success: true,
    message: 'User saved successfully',
    uid: user.uid,
    email: cleanEmail,
    updated_at: new Date().toISOString()
  };
}

/**
 * 시트 초기화 및 182종 카드 데이터 자동 생성 (최초 1회 실행용)
 */
function initSpreadsheet() {
  const ss = getSpreadsheet();
  
  // 1. user sheet
  let userSheet = ss.getSheetByName('user');
  if (!userSheet) {
    userSheet = ss.insertSheet('user');
  }
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow([
      'uid', 'email', 'nickname', 'main_character', 'points', 'total_sp',
      'last_attendance_date', 'last_sync_timestamp', 'is_initial_gift_received',
      'created_at', 'owned_cards', 'updated_at'
    ]);
  }
  
  // 2. cardrank sheet
  let rankSheet = ss.getSheetByName('cardrank');
  if (!rankSheet) {
    rankSheet = ss.insertSheet('cardrank');
  }
  if (rankSheet.getLastRow() === 0) {
    rankSheet.appendRow(['rank', 'sp_point', 'name']);
    rankSheet.appendRow(['UR', 1000, '울트라 레어']);
    rankSheet.appendRow(['SSR', 500, '슈퍼 스페셜 레어']);
    rankSheet.appendRow(['SR', 200, '슈퍼 레어']);
    rankSheet.appendRow(['R', 80, '레어']);
    rankSheet.appendRow(['N', 30, '노멀']);
  }
  
  // 3. gacha sheet
  let gachaSheet = ss.getSheetByName('gacha');
  if (!gachaSheet) {
    gachaSheet = ss.insertSheet('gacha');
  }
  if (gachaSheet.getLastRow() === 0) {
    gachaSheet.appendRow(['rank', 'rate']);
    gachaSheet.appendRow(['UR', 0.02]);
    gachaSheet.appendRow(['SSR', 0.06]);
    gachaSheet.appendRow(['SR', 0.18]);
    gachaSheet.appendRow(['R', 0.34]);
    gachaSheet.appendRow(['N', 0.40]);
  }
  
  // 4. cardlist sheet (182종 카드 자동 등록)
  let cardSheet = ss.getSheetByName('cardlist');
  if (!cardSheet) {
    cardSheet = ss.insertSheet('cardlist');
  }
  if (cardSheet.getLastRow() === 0) {
    cardSheet.appendRow(['card_id', 'name', 'rank']);
    const rows = [];
    for (let i = 0; i <= 181; i++) {
      const id = 'card_' + String(i).padStart(4, '0');
      let rank = 'N';
      if (i < 10) rank = 'UR';
      else if (i < 36) rank = 'SSR';
      else if (i < 82) rank = 'SR';
      else if (i < 132) rank = 'R';
      else rank = 'N';
      
      // 특별 스타터 카드 보정 (SR 이상 배정)
      if (['card_0000', 'card_0022', 'card_0065', 'card_0078', 'card_0156'].indexOf(id) >= 0) {
        if (rank === 'N' || rank === 'R') rank = 'SR';
      }
      
      rows.push([id, '히어로 ' + id.replace('card_', '#'), rank]);
    }
    cardSheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  
  return { success: true, message: 'Spreadsheet successfully initialized!' };
}
