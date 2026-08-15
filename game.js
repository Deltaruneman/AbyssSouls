/* =========================================================
   TRICKO CARDO — Demo chiến thuật (bản đơn giản hóa từ concept)
   Ghi chú: đây là bản dựng để HÌNH DUNG luồng chơi, không phải
   bản cân bằng cuối cùng. Các quy tắc mơ hồ trong concept gốc
   (vai trò 3 hàng, cách random thẻ, điều kiện thắng thua...)
   đã được đơn giản hóa theo hướng hợp lý nhất, có ghi chú bên dưới.
   ========================================================= */

const ROW_NAMES = ['trên', 'giữa', 'dưới'];
const PLAYER_COL = 2; // cột cố định của nhân vật trong sân đỏ (0-2)
const ENEMY_COL = 4;  // cột cố định của nhân vật trong sân navy (4-6)

const CARDS = [
  {
    id: 'punch', name: 'Cú Đấm Đơn Giản', group: 'attack',
    desc: 'Sát thương trung bình (100% ATK). Chọn 1 hàng để tấn công.',
    needRow: true, dmgStat: 'atk', dmgMult: 1.0
  },
  {
    id: 'stone', name: 'Ném Đá', group: 'attack',
    desc: 'Sát thương thấp (60% ATK), đòn tầm xa. Chọn 1 hàng để tấn công.',
    needRow: true, dmgStat: 'atk', dmgMult: 0.6
  },
  {
    id: 'counter', name: 'Hồi Mã Thương', group: 'attack',
    desc: 'Phục kích 1 hàng bạn chọn. Nếu đối phương tấn công đúng hàng đó, bạn phản đòn và miễn nhiễm sát thương.',
    needRow: true, special: 'counter'
  },
  {
    id: 'block', name: 'Đỡ Đòn', group: 'defense',
    desc: 'Giảm mạnh sát thương vật lý nhận vào trong phần này (theo DEF). Luôn nhắm bản thân.',
    needRow: false, special: 'block'
  },
  {
    id: 'dodge', name: 'Né Tránh Ngay Tấp Lự', group: 'defense',
    desc: 'Di chuyển ngay sang hàng bạn chọn, né các đòn đang nhắm vào hàng cũ.',
    needRow: true, special: 'dodge'
  },
  {
    id: 'heal', name: 'Hồi Phục', group: 'defense',
    desc: 'Hồi HP cho bản thân (theo 80% Special Attack).',
    needRow: false, special: 'heal', dmgStat: 'spa', dmgMult: 0.8
  },
  {
    id: 'fireball', name: 'Hỏa Cầu Thuật', group: 'magic',
    desc: 'Sát thương phép (90% Special Attack) + gây Cháy 2 hiệp. Chọn 1 hàng.',
    needRow: true, dmgStat: 'spa', dmgMult: 0.9, effect: 'burn'
  },
  {
    id: 'bind', name: 'Ma Pháp Trói Buộc', group: 'magic',
    desc: 'Chọn 1 hàng. Nếu trúng đối phương, họ bị Trói — không thể né trong hiệp này.',
    needRow: true, special: 'bind'
  },
  {
    id: 'smoke', name: 'Bom Khói', group: 'magic',
    desc: 'Chọn 1 hàng để phủ khói. Đòn tấn công của đối phương nhắm hàng này trong phần này sẽ bị hụt.',
    needRow: true, special: 'smoke'
  }
];
const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
const ALL_IDS = CARDS.map(c => c.id);

/* ---------------- STATE ---------------- */
let state = null;

function makeFighter() {
  return {
    hp: 100, maxHp: 100,
    atk: 20, spa: 18, def: 9, mres: 7, speed: 10,
    row: 1,
    burnRounds: 0, boundRounds: 0,
    shieldActiveThisPhase: false,
    counterRow: null, smokeRow: null,
    hand: [], drawPile: []
  };
}

function resetState() {
  state = {
    round: 1, phase: 1,
    player: makeFighter(),
    enemy: makeFighter(),
    selectedHandIndex: null,
    selectedRow: null,
    gameOver: false,
    busy: false,
    logs: []
  };
  // small asymmetry so the two fighters feel different, not just re-skinned
  state.enemy.spa = 22; state.enemy.atk = 17; state.enemy.mres = 10; state.enemy.speed = 11;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawHand(fighter) {
  if (fighter.drawPile.length < 3) {
    fighter.drawPile = shuffle(ALL_IDS); // "hết thẻ trên tay sẽ hồi lại"
  }
  fighter.hand = fighter.drawPile.splice(0, 3);
}

/* ---------------- DOM REFS ---------------- */
const el = {
  round: document.getElementById('roundValue'),
  phase: document.getElementById('phaseValue'),
  grid: document.getElementById('battleGrid'),
  playerHpFill: document.getElementById('playerHpFill'),
  playerHpText: document.getElementById('playerHpText'),
  enemyHpFill: document.getElementById('enemyHpFill'),
  enemyHpText: document.getElementById('enemyHpText'),
  playerStats: document.getElementById('playerStats'),
  enemyStats: document.getElementById('enemyStats'),
  playerStatus: document.getElementById('playerStatus'),
  enemyStatus: document.getElementById('enemyStatus'),
  handCards: document.getElementById('handCards'),
  handRemaining: document.getElementById('handRemaining'),
  phaseInstruction: document.getElementById('phaseInstruction'),
  rowPicker: document.getElementById('rowPicker'),
  playCardBtn: document.getElementById('playCardBtn'),
  logFeed: document.getElementById('logFeed'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  overlayRestart: document.getElementById('overlayRestart'),
  restartBtn: document.getElementById('restartBtn')
};

/* ---------------- GRID BUILD ---------------- */
let cellEls = []; // cellEls[row][col]
let tokenPlayer, tokenEnemy;

function buildGrid() {
  el.grid.innerHTML = '';
  cellEls = [[], [], []];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + (c < 3 ? 'zone-player' : c === 3 ? 'zone-mid' : 'zone-enemy');
      cell.dataset.row = r;
      cell.dataset.col = c;
      el.grid.appendChild(cell);
      cellEls[r][c] = cell;
    }
  }
  tokenPlayer = document.createElement('div');
  tokenPlayer.className = 'token token-player';
  tokenPlayer.textContent = 'B';
  tokenEnemy = document.createElement('div');
  tokenEnemy.className = 'token token-enemy';
  tokenEnemy.textContent = 'Đ';
}

function placeTokens() {
  cellEls[state.player.row][PLAYER_COL].appendChild(tokenPlayer);
  cellEls[state.enemy.row][ENEMY_COL].appendChild(tokenEnemy);
}

function highlightRow(row, ms = 850) {
  if (row === null || row === undefined) return;
  cellEls[row].forEach(c => c.classList.add('row-highlight'));
  setTimeout(() => cellEls[row].forEach(c => c.classList.remove('row-highlight')), ms);
}

function flashImpact(side) {
  const fighter = state[side];
  const col = side === 'player' ? PLAYER_COL : ENEMY_COL;
  const cell = cellEls[fighter.row][col];
  cell.classList.add('impact-flash');
  setTimeout(() => cell.classList.remove('impact-flash'), 500);
  const token = side === 'player' ? tokenPlayer : tokenEnemy;
  token.classList.add('token-hit');
  setTimeout(() => token.classList.remove('token-hit'), 400);
}

function popMove(side) {
  const token = side === 'player' ? tokenPlayer : tokenEnemy;
  token.classList.add('token-move');
  setTimeout(() => token.classList.remove('token-move'), 400);
}

/* ---------------- LOGGING ---------------- */
function log(text, cls = '') {
  state.logs.push({ text, cls });
  const line = document.createElement('div');
  line.className = 'log-line ' + cls;
  line.textContent = text;
  el.logFeed.appendChild(line);
}

/* ---------------- RENDER ---------------- */
function hpClass(fighter) {
  const pct = fighter.hp / fighter.maxHp;
  if (pct <= 0.3) return 'hp-low';
  if (pct <= 0.6) return 'hp-mid';
  return '';
}

function renderStats(fighter, ul) {
  ul.innerHTML = `
    <li><span>ATK</span><span>${fighter.atk}</span></li>
    <li><span>Special Attack</span><span>${fighter.spa}</span></li>
    <li><span>Defend</span><span>${fighter.def}</span></li>
    <li><span>Magic Resistance</span><span>${fighter.mres}</span></li>
    <li><span>Speed</span><span>${fighter.speed}</span></li>
  `;
}

function renderStatus(fighter, box) {
  box.innerHTML = '';
  if (fighter.burnRounds > 0) {
    box.innerHTML += `<span class="status-chip burn">🔥 Cháy · còn ${fighter.burnRounds} hiệp</span>`;
  }
  if (fighter.boundRounds > 0) {
    box.innerHTML += `<span class="status-chip bound">🔒 Bị trói</span>`;
  }
}

function renderTopStats() {
  el.playerHpFill.style.width = Math.max(0, state.player.hp) + '%';
  el.playerHpFill.className = 'hp-fill ' + hpClass(state.player);
  el.playerHpText.textContent = `${Math.max(0, state.player.hp)} / ${state.player.maxHp}`;

  el.enemyHpFill.style.width = Math.max(0, state.enemy.hp) + '%';
  el.enemyHpFill.className = 'hp-fill ' + hpClass(state.enemy);
  el.enemyHpText.textContent = `${Math.max(0, state.enemy.hp)} / ${state.enemy.maxHp}`;

  renderStats(state.player, el.playerStats);
  renderStats(state.enemy, el.enemyStats);
  renderStatus(state.player, el.playerStatus);
  renderStatus(state.enemy, el.enemyStatus);

  el.round.textContent = state.round;
  el.phase.textContent = `${state.phase} / 3`;
}

function renderHand() {
  el.handCards.innerHTML = '';
  el.handRemaining.textContent = `(${state.player.hand.length} lá còn lại trong hiệp)`;

  state.player.hand.forEach((id, idx) => {
    const card = CARD_MAP[id];
    const div = document.createElement('div');
    div.className = 'card' + (state.selectedHandIndex === idx ? ' selected' : '');
    if (state.busy || state.gameOver) div.classList.add('disabled');
    div.innerHTML = `
      <span class="card-group ${card.group}">${groupLabel(card.group)}</span>
      <h4>${card.name}</h4>
      <p>${card.desc}</p>
    `;
    div.addEventListener('click', () => selectCard(idx));
    el.handCards.appendChild(div);
  });

  const card = state.selectedHandIndex !== null ? CARD_MAP[state.player.hand[state.selectedHandIndex]] : null;
  el.rowPicker.hidden = !(card && card.needRow);
  [...el.rowPicker.querySelectorAll('.row-btn')].forEach(btn => {
    btn.classList.toggle('selected', Number(btn.dataset.row) === state.selectedRow);
  });

  const ready = card && (!card.needRow || state.selectedRow !== null);
  el.playCardBtn.disabled = !ready || state.busy || state.gameOver;

  if (!card) {
    el.phaseInstruction.textContent = 'Chọn 1 lá để thi triển cho phần này của hiệp.';
  } else if (card.needRow && state.selectedRow === null) {
    el.phaseInstruction.textContent = `Chọn hàng để thi triển "${card.name}".`;
  } else {
    el.phaseInstruction.textContent = `Sẵn sàng thi triển "${card.name}".`;
  }
}

function render() {
  placeTokens();
  renderTopStats();
  renderHand();
}

function groupLabel(g) {
  return g === 'attack' ? 'Tấn công' : g === 'defense' ? 'Phòng thủ' : 'Ma thuật';
}

/* ---------------- SELECTION ---------------- */
function selectCard(idx) {
  if (state.busy || state.gameOver) return;
  state.selectedHandIndex = idx;
  state.selectedRow = null;
  renderHand();
}

el.rowPicker.querySelectorAll('.row-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.busy || state.gameOver) return;
    state.selectedRow = Number(btn.dataset.row);
    renderHand();
  });
});

/* ---------------- AI ---------------- */
function chooseAICard() {
  const hand = state.enemy.hand;
  let idx = null;

  if (state.enemy.hp < state.enemy.maxHp * 0.4) {
    idx = hand.findIndex(id => id === 'heal');
    if (idx === -1 && state.enemy.hp < state.enemy.maxHp * 0.25) {
      idx = hand.findIndex(id => id === 'block');
    }
  }
  if (idx === null || idx === -1) {
    const weights = hand.map(id => {
      const g = CARD_MAP[id].group;
      return g === 'attack' ? 3 : g === 'magic' ? 2 : 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    idx = 0;
    for (let i = 0; i < weights.length; i++) {
      if (r < weights[i]) { idx = i; break; }
      r -= weights[i];
    }
  }

  const card = CARD_MAP[hand[idx]];
  let row = null;
  if (card.needRow) {
    if (card.special === 'dodge') {
      const others = [0, 1, 2].filter(r => r !== state.enemy.row);
      row = others[Math.floor(Math.random() * others.length)];
    } else if (card.special === 'counter' || card.special === 'smoke') {
      row = Math.random() < 0.5 ? state.enemy.row : Math.floor(Math.random() * 3);
    } else {
      row = Math.random() < 0.45 ? state.player.row : Math.floor(Math.random() * 3);
    }
  }
  return { idx, row };
}

/* ---------------- COMBAT RESOLUTION ---------------- */
function rowName(r) { return ROW_NAMES[r]; }

function isSmoked(target, row) { return target.smokeRow === row; }

function applyCard(userSide, targetSide, card, row) {
  const user = state[userSide];
  const target = state[targetSide];
  const uLabel = userSide === 'player' ? 'Bạn' : 'Đối thủ';
  const tLabel = targetSide === 'player' ? 'Bạn' : 'Đối thủ';
  const uCls = 'log-' + userSide;

  if (card.special === 'block') {
    user.shieldActiveThisPhase = true;
    log(`${uLabel} thi triển Đỡ Đòn, chuẩn bị phòng thủ.`, uCls);
    return;
  }

  if (card.special === 'heal') {
    const amt = Math.round(user.spa * card.dmgMult);
    const before = user.hp;
    user.hp = Math.min(user.maxHp, user.hp + amt);
    log(`${uLabel} thi triển Hồi Phục, +${user.hp - before} HP.`, uCls + ' log-heal');
    popMove(userSide);
    return;
  }

  if (card.special === 'dodge') {
    if (user.boundRounds > 0) {
      log(`${uLabel} bị Trói, không thể Né Tránh!`, uCls);
      return;
    }
    user.row = row;
    log(`${uLabel} Né Tránh Ngay Tấp Lự sang hàng ${rowName(row)}.`, uCls);
    popMove(userSide);
    return;
  }

  if (card.special === 'counter') {
    user.counterRow = row;
    log(`${uLabel} giăng bẫy Hồi Mã Thương tại hàng ${rowName(row)}.`, uCls);
    return;
  }

  if (card.special === 'smoke') {
    user.smokeRow = row;
    log(`${uLabel} thả Bom Khói phủ hàng ${rowName(row)}.`, uCls);
    return;
  }

  if (card.special === 'bind') {
    if (isSmoked(target, row)) {
      target.smokeRow = null;
      log(`${uLabel} thi triển Ma Pháp Trói Buộc nhưng bị khói che khuất — hụt!`, uCls);
      return;
    }
    if (row === target.row) {
      target.boundRounds = 1;
      log(`${uLabel} trói được ${tLabel} tại hàng ${rowName(row)}! ${tLabel} không thể né trong hiệp này.`, uCls);
      flashImpact(targetSide);
    } else {
      log(`${uLabel} thi triển Ma Pháp Trói Buộc nhưng hụt — ${tLabel} không đứng ở hàng đó.`, uCls);
    }
    return;
  }

  // Plain damage cards: punch, stone, fireball
  const dmgStatVal = card.dmgStat === 'atk' ? user.atk : user.spa;
  const baseDmg = Math.round(dmgStatVal * card.dmgMult);

  if (isSmoked(target, row)) {
    target.smokeRow = null;
    log(`${uLabel} thi triển ${card.name} nhưng bị Bom Khói che khuất — đòn đánh hụt!`, uCls);
    return;
  }

  if (target.counterRow === row && target.row === row) {
    const reflect = Math.round(target.atk * 1.0);
    user.hp = Math.max(0, user.hp - reflect);
    target.counterRow = null;
    log(`${tLabel} phản đòn bằng Hồi Mã Thương! ${uLabel} nhận ${reflect} sát thương và không gây được gì.`, 'log-' + targetSide + ' log-dmg');
    flashImpact(userSide);
    return;
  }

  if (row !== target.row) {
    log(`${uLabel} thi triển ${card.name} nhắm hàng ${rowName(row)} nhưng ${tLabel} không đứng đó — hụt!`, uCls);
    return;
  }

  const mitigationStat = card.dmgStat === 'atk' ? target.def : target.mres;
  let dmg = Math.max(1, baseDmg - Math.round(mitigationStat * 0.5));
  if (target.shieldActiveThisPhase && card.dmgStat === 'atk') {
    dmg = Math.max(1, dmg - target.def);
  }
  target.hp = Math.max(0, target.hp - dmg);
  log(`${uLabel} thi triển ${card.name}, gây ${dmg} sát thương lên ${tLabel}.`, uCls + ' log-dmg');
  flashImpact(targetSide);

  if (card.effect === 'burn') {
    target.burnRounds = 2;
    log(`${tLabel} dính hiệu ứng Cháy.`, uCls);
  }
}

function resolvePhase(pCardId, pRow, eCardId, eRow) {
  const pCard = CARD_MAP[pCardId];
  const eCard = CARD_MAP[eCardId];

  log(`— Hiệp ${state.round} · Phần ${state.phase} —`, 'log-system');
  log(`Bạn thi triển: ${pCard.name}${pRow !== null ? ' (hàng ' + rowName(pRow) + ')' : ''}`, 'log-player');
  log(`Đối thủ thi triển: ${eCard.name}${eRow !== null ? ' (hàng ' + rowName(eRow) + ')' : ''}`, 'log-enemy');

  if (pRow !== null) highlightRow(pRow);
  if (eRow !== null) highlightRow(eRow);

  // pre-scan traps so they act regardless of speed order
  if (pCard.special === 'smoke') state.player.smokeRow = pRow;
  if (eCard.special === 'smoke') state.enemy.smokeRow = eRow;
  if (pCard.special === 'counter') state.player.counterRow = pRow;
  if (eCard.special === 'counter') state.enemy.counterRow = eRow;

  const pSpeed = state.player.speed + Math.random() * 2;
  const eSpeed = state.enemy.speed + Math.random() * 2;
  const order = pSpeed >= eSpeed
    ? [['player', 'enemy', pCard, pRow], ['enemy', 'player', eCard, eRow]]
    : [['enemy', 'player', eCard, eRow], ['player', 'enemy', pCard, pRow]];

  log(`${order[0][0] === 'player' ? 'Bạn' : 'Đối thủ'} có tốc độ cao hơn, thi triển trước.`, 'log-system');

  for (const [userSide, targetSide, card, row] of order) {
    applyCard(userSide, targetSide, card, row);
    if (state.player.hp <= 0 || state.enemy.hp <= 0) break;
  }

  state.player.shieldActiveThisPhase = false;
  state.enemy.shieldActiveThisPhase = false;
  state.player.smokeRow = null;
  state.enemy.smokeRow = null;
  state.player.counterRow = null;
  state.enemy.counterRow = null;
}

/* ---------------- ROUND / PHASE FLOW ---------------- */
function tickStatuses(fighter, label) {
  if (fighter.burnRounds > 0) {
    const dmg = Math.max(1, Math.round(fighter.maxHp * 0.05));
    fighter.hp = Math.max(0, fighter.hp - dmg);
    fighter.burnRounds--;
    log(`${label} chịu ${dmg} sát thương do Cháy.`, 'log-dmg');
  }
  if (fighter.boundRounds > 0) fighter.boundRounds--;
}

function beginRound() {
  if (state.round > 15) {
    endGame(state.player.hp === state.enemy.hp ? null :
      (state.player.hp > state.enemy.hp ? 'player' : 'enemy'), true);
    return;
  }
  tickStatuses(state.player, 'Bạn');
  tickStatuses(state.enemy, 'Đối thủ');
  if (checkDeath()) return;

  state.phase = 1;
  drawHand(state.player);
  drawHand(state.enemy);
  state.selectedHandIndex = null;
  state.selectedRow = null;
  log(`— Hiệp ${state.round} bắt đầu, mỗi bên nhận 3 lá bài —`, 'log-system');
  render();
}

function checkDeath() {
  if (state.player.hp <= 0 && state.enemy.hp <= 0) { endGame(null); return true; }
  if (state.player.hp <= 0) { endGame('enemy'); return true; }
  if (state.enemy.hp <= 0) { endGame('player'); return true; }
  return false;
}

function playSelectedCard() {
  if (state.busy || state.gameOver) return;
  const idx = state.selectedHandIndex;
  const card = CARD_MAP[state.player.hand[idx]];
  if (card.needRow && state.selectedRow === null) return;

  state.busy = true;

  const pCardId = state.player.hand.splice(idx, 1)[0];
  const pRow = card.needRow ? state.selectedRow : null;

  const ai = chooseAICard();
  const eCardId = state.enemy.hand.splice(ai.idx, 1)[0];
  const eRow = ai.row;

  resolvePhase(pCardId, pRow, eCardId, eRow);

  state.selectedHandIndex = null;
  state.selectedRow = null;
  render();

  if (checkDeath()) { state.busy = false; return; }

  state.phase++;
  if (state.phase > 3) {
    state.round++;
    setTimeout(() => { state.busy = false; beginRound(); }, 400);
  } else {
    setTimeout(() => { state.busy = false; render(); }, 250);
  }
}

el.playCardBtn.addEventListener('click', playSelectedCard);

/* ---------------- GAME OVER ---------------- */
function endGame(winnerSide, byLimit) {
  state.gameOver = true;
  el.overlay.hidden = false;
  if (winnerSide === null) {
    el.overlayTitle.textContent = 'Hòa!';
    el.overlayText.textContent = byLimit
      ? 'Hết 15 hiệp và hai bên bằng máu — trận đấu kết thúc hòa.'
      : 'Cả hai cùng gục ngã trong cùng một phần thi triển.';
  } else if (winnerSide === 'player') {
    el.overlayTitle.textContent = byLimit ? 'Bạn thắng theo % HP còn lại!' : 'Bạn thắng!';
    el.overlayText.textContent = 'Kiếm Sĩ Đỏ đã hạ gục Pháp Sư Navy.';
  } else {
    el.overlayTitle.textContent = byLimit ? 'Đối thủ thắng theo % HP còn lại!' : 'Bạn thua!';
    el.overlayText.textContent = 'Pháp Sư Navy đã hạ gục Kiếm Sĩ Đỏ.';
  }
  render();
}

el.overlayRestart.addEventListener('click', startGame);
el.restartBtn.addEventListener('click', startGame);

/* ---------------- BOOT ---------------- */
function startGame() {
  el.overlay.hidden = true;
  el.logFeed.innerHTML = '';
  resetState();
  buildGrid();
  log('Trận đấu bắt đầu! Đây là bản demo rút gọn: mỗi hiệp gồm 3 phần, mỗi phần cả hai bên cùng thi triển 1 lá bài.', 'log-system');
  beginRound();
}

startGame();