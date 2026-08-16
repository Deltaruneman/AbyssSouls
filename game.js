/* =========================================================
   TRICKO CARDO — Demo chiến thuật (v2)
   Vòng lặp kiểu Slay the Spire: Năng lượng/lượt, rút bài từ deck,
   đối thủ báo trước ý định (intent) rồi mới hành động, nhắm mục
   tiêu bằng cách rê chuột xem trước phạm vi rồi bấm thẳng vào ô
   trên bàn cờ. Một số thẻ nhắm theo HÀNG, một số nhắm theo CỘT.
   Đây vẫn là bản demo để hình dung — số liệu chưa cân bằng cuối.
   ========================================================= */

const ROW_NAMES = ['trên', 'giữa', 'dưới'];
const COL_NAMES = ['gần', 'giữa', 'xa']; // relCol 0=sát vạch giữa, 1=trung tâm sân, 2=rìa ngoài

const CARDS = [
  {
    id: 'punch', name: 'Cú Đấm Đơn Giản', group: 'attack', icon: '⚔️', cost: 1,
    desc: 'Sát thương trung bình (100% ATK). Nhắm 1 HÀNG bên sân đối phương.',
    axis: 'row', zone: 'opponent', dmgStat: 'atk', dmgMult: 1.0
  },
  {
    id: 'stone', name: 'Ném Đá', group: 'attack', icon: '🪨', cost: 1,
    desc: 'Sát thương thấp (60% ATK), đòn tầm xa. Nhắm 1 HÀNG bên sân đối phương.',
    axis: 'row', zone: 'opponent', dmgStat: 'atk', dmgMult: 0.6
  },
  {
    id: 'counter', name: 'Hồi Mã Thương', group: 'attack', icon: '🗡️', cost: 1,
    desc: 'Phục kích 1 HÀNG bên sân nhà. Nếu đối phương tấn công đúng hàng bạn đang đứng, bạn phản đòn và miễn nhiễm sát thương.',
    axis: 'row', zone: 'own', special: 'counter'
  },
  {
    id: 'block', name: 'Đỡ Đòn', group: 'defense', icon: '🛡️', cost: 1,
    desc: 'Giảm mạnh sát thương vật lý nhận vào lượt này (theo DEF). Không cần nhắm mục tiêu.',
    axis: 'self', special: 'block'
  },
  {
    id: 'dodge', name: 'Né Tránh Ngay Tấp Lự', group: 'defense', icon: '💨', cost: 1,
    desc: 'Di chuyển ngay đến 1 Ô bất kỳ trong sân nhà, né các đòn đang nhắm vào vị trí cũ.',
    axis: 'ownCell', zone: 'own', special: 'dodge'
  },
  {
    id: 'heal', name: 'Hồi Phục', group: 'defense', icon: '✚', cost: 1,
    desc: 'Hồi HP cho bản thân (theo 80% Special Attack). Không cần nhắm mục tiêu.',
    axis: 'self', special: 'heal', dmgStat: 'spa', dmgMult: 0.8
  },
  {
    id: 'fireball', name: 'Hỏa Cầu Thuật', group: 'magic', icon: '🔥', cost: 2,
    desc: 'Sát thương phép (90% Special Attack) + gây Cháy 2 lượt. Nhắm 1 CỘT bên sân đối phương.',
    axis: 'col', zone: 'opponent', dmgStat: 'spa', dmgMult: 0.9, effect: 'burn'
  },
  {
    id: 'bind', name: 'Ma Pháp Trói Buộc', group: 'magic', icon: '⛓️', cost: 1,
    desc: 'Nhắm 1 CỘT bên sân đối phương. Nếu trúng, đối phương bị Trói — không thể Né Tránh ở lượt kế.',
    axis: 'col', zone: 'opponent', special: 'bind'
  },
  {
    id: 'smoke', name: 'Bom Khói', group: 'magic', icon: '🌫️', cost: 1,
    desc: 'Phủ khói lên 1 CỘT bên sân nhà. Đòn trúng vào cột này ở lượt kế sẽ bị vô hiệu (dùng 1 lần).',
    axis: 'col', zone: 'own', special: 'smoke'
  }
];
const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
const ALL_IDS = CARDS.map(c => c.id);

/* ---------------- STATE ---------------- */
let state = null;

function makeFighter(isPlayer) {
  return {
    hp: 100, maxHp: 100,
    atk: 20, spa: 18, def: 9, mres: 7, speed: 10,
    row: 1, relCol: 1,
    burnTurns: 0, bound: false,
    shieldActive: false, counterRow: null, smokeRelCol: null,
    energy: 3, maxEnergy: 3,
    hand: [], drawPile: [], discard: [],
    nextIntent: null
  };
}

function resetState() {
  state = {
    round: 1,
    player: makeFighter(true),
    enemy: makeFighter(false),
    lockedCard: null,     // { handIndex, card }
    hoverCells: [],        // cells currently strong-highlighted
    previewCells: [],      // cells currently light-highlighted (valid zone)
    gameOver: false,
    busy: false,
    logs: []
  };
  state.enemy.spa = 22; state.enemy.atk = 17; state.enemy.mres = 10; state.enemy.speed = 11;
  state.player.drawPile = shuffle([...ALL_IDS, ...ALL_IDS]); // 18-card demo deck
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedPick(ids, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    if (r < weights[i]) return ids[i];
    r -= weights[i];
  }
  return ids[ids.length - 1];
}

function drawCards(fighter, n) {
  for (let i = 0; i < n; i++) {
    if (fighter.drawPile.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.drawPile = shuffle(fighter.discard);
      fighter.discard = [];
      log('Bạn đã xào lại chồng bài úp từ chồng bài bỏ.', 'log-system');
    }
    fighter.hand.push(fighter.drawPile.pop());
  }
}

/* ---------------- DOM REFS ---------------- */
const el = {
  round: document.getElementById('roundValue'),
  grid: document.getElementById('battleGrid'),
  playerHpFill: document.getElementById('playerHpFill'),
  playerHpText: document.getElementById('playerHpText'),
  enemyHpFill: document.getElementById('enemyHpFill'),
  enemyHpText: document.getElementById('enemyHpText'),
  playerStats: document.getElementById('playerStats'),
  enemyStats: document.getElementById('enemyStats'),
  playerStatus: document.getElementById('playerStatus'),
  enemyStatus: document.getElementById('enemyStatus'),
  energyOrbs: document.getElementById('energyOrbs'),
  drawCount: document.getElementById('drawCount'),
  discardCount: document.getElementById('discardCount'),
  intentBody: document.getElementById('intentBody'),
  handCards: document.getElementById('handCards'),
  phaseInstruction: document.getElementById('phaseInstruction'),
  gridCaption: document.getElementById('gridCaption'),
  endTurnBtn: document.getElementById('endTurnBtn'),
  logFeed: document.getElementById('logFeed'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  overlayRestart: document.getElementById('overlayRestart'),
  restartBtn: document.getElementById('restartBtn')
};

/* ---------------- GRID BUILD ---------------- */
let cellEls = [];
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
      cell.addEventListener('mouseenter', () => onCellHover(r, c));
      cell.addEventListener('mouseleave', onCellUnhover);
      cell.addEventListener('click', () => onCellClick(r, c));
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

function absCol(side, relCol) { return side === 'player' ? (2 - relCol) : (4 + relCol); }
function relColFromAbs(side, col) { return side === 'player' ? (2 - col) : (col - 4); }

function placeTokens() {
  cellEls[state.player.row][absCol('player', state.player.relCol)].appendChild(tokenPlayer);
  cellEls[state.enemy.row][absCol('enemy', state.enemy.relCol)].appendChild(tokenEnemy);
}

function flashImpact(side) {
  const f = state[side];
  const cell = cellEls[f.row][absCol(side, f.relCol)];
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

/* ---------------- TARGETING HELPERS ---------------- */
function zoneSideFor(casterSide, card) {
  if (!card.zone) return casterSide;
  const opp = casterSide === 'player' ? 'enemy' : 'player';
  return card.zone === 'opponent' ? opp : casterSide;
}
function validAbsCols(zoneSide) { return zoneSide === 'player' ? [0, 1, 2] : [4, 5, 6]; }

function isValidCell(card, row, col) {
  if (!card.axis || card.axis === 'self') return false;
  const zoneSide = zoneSideFor('player', card); // UI clicks are always the human player
  return validAbsCols(zoneSide).includes(col);
}

function clearPreview() {
  state.previewCells.forEach(c => c.classList.remove('preview-zone'));
  state.previewCells = [];
}
function clearHover() {
  state.hoverCells.forEach(c => c.classList.remove('row-highlight', 'col-highlight', 'cell-hovered'));
  state.hoverCells = [];
}

function showPreviewZone(card) {
  clearPreview();
  if (!card.axis || card.axis === 'self') return;
  const zoneSide = zoneSideFor('player', card);
  const cols = validAbsCols(zoneSide);
  for (let r = 0; r < 3; r++) {
    cols.forEach(c => {
      cellEls[r][c].classList.add('preview-zone', 'targetable');
      state.previewCells.push(cellEls[r][c]);
    });
  }
}

function onCellHover(row, col) {
  if (!state.lockedCard || state.busy) return;
  const card = state.lockedCard.card;
  if (!isValidCell(card, row, col)) return;
  clearHover();
  if (card.axis === 'row') {
    const zoneSide = zoneSideFor('player', card);
    validAbsCols(zoneSide).forEach(c => {
      cellEls[row][c].classList.add('row-highlight');
      state.hoverCells.push(cellEls[row][c]);
    });
  } else if (card.axis === 'col') {
    for (let r = 0; r < 3; r++) {
      cellEls[r][col].classList.add('col-highlight');
      state.hoverCells.push(cellEls[r][col]);
    }
  } else if (card.axis === 'ownCell') {
    cellEls[row][col].classList.add('cell-hovered');
    state.hoverCells.push(cellEls[row][col]);
  }
}
function onCellUnhover() { clearHover(); }

function onCellClick(row, col) {
  if (!state.lockedCard || state.busy || state.gameOver) return;
  const { handIndex, card } = state.lockedCard;
  if (!isValidCell(card, row, col)) return;

  let targetSpec = {};
  const zoneSide = zoneSideFor('player', card);
  if (card.axis === 'row') targetSpec = { row };
  else if (card.axis === 'col') targetSpec = { relCol: relColFromAbs(zoneSide, col) };
  else if (card.axis === 'ownCell') targetSpec = { row, relCol: relColFromAbs('player', col) };

  executeCardPlay(handIndex, targetSpec);
}

/* ---------------- CARD EFFECTS ---------------- */
function sideLabel(side) { return side === 'player' ? 'Bạn' : 'Đối thủ'; }

function applyCardEffect(casterSide, card, targetSpec) {
  const caster = state[casterSide];
  const enemySide = casterSide === 'player' ? 'enemy' : 'player';
  const cLabel = sideLabel(casterSide);
  const cCls = 'log-' + casterSide;

  if (card.special === 'block') {
    caster.shieldActive = true;
    log(`${cLabel} thi triển ${card.name}, chuẩn bị phòng thủ.`, cCls);
    popMove(casterSide);
    return;
  }
  if (card.special === 'heal') {
    const amt = Math.round(caster.spa * card.dmgMult);
    const before = caster.hp;
    caster.hp = Math.min(caster.maxHp, caster.hp + amt);
    log(`${cLabel} thi triển ${card.name}, +${caster.hp - before} HP.`, cCls + ' log-heal');
    popMove(casterSide);
    return;
  }
  if (card.special === 'dodge') {
    if (caster.bound) { log(`${cLabel} bị Trói, không thể Né Tránh!`, cCls); return; }
    caster.row = targetSpec.row; caster.relCol = targetSpec.relCol;
    log(`${cLabel} né sang hàng ${ROW_NAMES[caster.row]} / cột ${COL_NAMES[caster.relCol]}.`, cCls);
    popMove(casterSide);
    return;
  }
  if (card.special === 'counter') {
    caster.counterRow = targetSpec.row;
    log(`${cLabel} giăng bẫy ${card.name} tại hàng ${ROW_NAMES[targetSpec.row]} (sân nhà).`, cCls);
    return;
  }
  if (card.special === 'smoke') {
    caster.smokeRelCol = targetSpec.relCol;
    log(`${cLabel} thả ${card.name} phủ cột ${COL_NAMES[targetSpec.relCol]} (sân nhà).`, cCls);
    return;
  }

  // punch / stone / fireball / bind — all target the opponent and can miss
  const target = state[enemySide];
  const tLabel = sideLabel(enemySide);
  const hit = card.axis === 'row' ? (targetSpec.row === target.row) : (targetSpec.relCol === target.relCol);

  if (!hit) {
    log(`${cLabel} thi triển ${card.name} nhưng hụt — ${tLabel} không ở vị trí đó.`, cCls);
    return;
  }
  if (target.smokeRelCol !== null && target.smokeRelCol === target.relCol) {
    target.smokeRelCol = null;
    log(`${cLabel} thi triển ${card.name} nhưng bị Bom Khói của ${tLabel} che khuất — hụt!`, cCls);
    return;
  }
  if (card.axis === 'row' && target.counterRow !== null && target.counterRow === target.row) {
    const reflect = Math.round(target.atk * 1.0);
    caster.hp = Math.max(0, caster.hp - reflect);
    target.counterRow = null;
    log(`${tLabel} phản đòn bằng Hồi Mã Thương! ${cLabel} nhận ${reflect} sát thương.`, 'log-' + enemySide + ' log-dmg');
    flashImpact(casterSide);
    return;
  }

  if (card.special === 'bind') {
    target.bound = true;
    log(`${cLabel} trói được ${tLabel} bằng ${card.name}!`, cCls);
    flashImpact(enemySide);
    return;
  }

  const dmgStatVal = card.dmgStat === 'atk' ? caster.atk : caster.spa;
  const mitigationStat = card.dmgStat === 'atk' ? target.def : target.mres;
  let dmg = Math.max(1, Math.round(dmgStatVal * card.dmgMult) - Math.round(mitigationStat * 0.5));
  if (target.shieldActive && card.dmgStat === 'atk') dmg = Math.max(1, dmg - target.def);
  target.hp = Math.max(0, target.hp - dmg);
  log(`${cLabel} thi triển ${card.name}, gây ${dmg} sát thương lên ${tLabel}.`, cCls + ' log-dmg');
  flashImpact(enemySide);
  if (card.effect === 'burn') {
    target.burnTurns = 2;
    log(`${tLabel} dính hiệu ứng Cháy.`, cCls);
  }
}

/* ---------------- PLAYER TURN ---------------- */
function executeCardPlay(handIndex, targetSpec) {
  const card = CARD_MAP[state.player.hand[handIndex]];
  if (state.player.energy < card.cost) return;
  state.player.energy -= card.cost;
  const [id] = state.player.hand.splice(handIndex, 1);
  state.player.discard.push(id);

  state.lockedCard = null;
  clearPreview(); clearHover();

  applyCardEffect('player', card, targetSpec);
  render();
  checkDeath();
}

function selectHandCard(idx) {
  if (state.busy || state.gameOver) return;
  const id = state.player.hand[idx];
  const card = CARD_MAP[id];
  if (state.player.energy < card.cost) return;

  if (card.axis === 'self') {
    executeCardPlay(idx, {});
    return;
  }
  state.lockedCard = { handIndex: idx, card };
  showPreviewZone(card);
  render();
}

function cardHoverPreview(card) {
  if (state.lockedCard || !card.axis || card.axis === 'self') return;
  showPreviewZone(card);
}
function cardHoverEnd() {
  if (state.lockedCard) return; // keep locked card's preview
  clearPreview();
}

/* ---------------- ENEMY AI ---------------- */
function decideEnemyIntent() {
  const e = state.enemy;
  let cardId;
  if (e.hp < e.maxHp * 0.4 && Math.random() < 0.55) {
    cardId = 'heal';
  } else {
    const pool = ALL_IDS.filter(id => id !== 'heal');
    const weights = pool.map(id => {
      const g = CARD_MAP[id].group;
      return g === 'attack' ? 3 : g === 'magic' ? 2.4 : 1.4;
    });
    cardId = weightedPick(pool, weights);
  }
  const card = CARD_MAP[cardId];
  let target = {};
  if (card.axis === 'row') {
    const zoneSide = zoneSideFor('enemy', card);
    const guess = state[zoneSide].row;
    target.row = Math.random() < 0.5 ? guess : Math.floor(Math.random() * 3);
  } else if (card.axis === 'col') {
    const zoneSide = zoneSideFor('enemy', card);
    const guess = state[zoneSide].relCol;
    target.relCol = Math.random() < 0.5 ? guess : Math.floor(Math.random() * 3);
  } else if (card.axis === 'ownCell') {
    target.row = Math.floor(Math.random() * 3);
    target.relCol = Math.floor(Math.random() * 3);
  }
  e.nextIntent = { cardId, target };
}

function intentDescription(cardId, target) {
  const card = CARD_MAP[cardId];
  let where = '';
  if (card.axis === 'row' && target.row !== undefined) where = ` → hàng ${ROW_NAMES[target.row]}`;
  else if (card.axis === 'col' && target.relCol !== undefined) where = ` → cột ${COL_NAMES[target.relCol]}`;
  else if (card.axis === 'ownCell') where = ` → di chuyển`;
  return { icon: card.icon, text: `${card.name}${where}` };
}

/* ---------------- ROUND FLOW ---------------- */
function startPlayerTurn() {
  state.player.energy = state.player.maxEnergy;
  state.lockedCard = null;
  clearPreview(); clearHover();
  drawCards(state.player, 5);
  log(`— Lượt ${state.round}: bạn có ${state.player.energy} năng lượng —`, 'log-system');
  render();
}

function endTurn() {
  if (state.busy || state.gameOver) return;
  state.busy = true;
  state.lockedCard = null;
  clearPreview(); clearHover();

  state.player.discard.push(...state.player.hand);
  state.player.hand = [];
  state.player.bound = false; // this window is over
  log('— Bạn kết thúc lượt —', 'log-system');
  render();

  setTimeout(() => {
    resolveEnemyIntent();
    render();
    if (checkDeath()) { state.busy = false; return; }

    setTimeout(() => {
      processRoundEnd();
      if (checkDeath()) { state.busy = false; return; }
      state.round++;
      decideEnemyIntent();
      state.busy = false;
      startPlayerTurn();
    }, 500);
  }, 450);
}

function resolveEnemyIntent() {
  state.enemy.shieldActive = false; state.enemy.counterRow = null; state.enemy.smokeRelCol = null;
  const { cardId, target } = state.enemy.nextIntent;
  const card = CARD_MAP[cardId];
  const desc = intentDescription(cardId, target);
  log(`Đối thủ thi triển: ${desc.text}`, 'log-enemy');
  applyCardEffect('enemy', card, target);
  state.player.shieldActive = false; state.player.counterRow = null; state.player.smokeRelCol = null;
  state.enemy.bound = false;
}

function processRoundEnd() {
  tickBurn('player'); tickBurn('enemy');
}
function tickBurn(side) {
  const f = state[side];
  if (f.burnTurns > 0) {
    const dmg = Math.max(1, Math.round(f.maxHp * 0.05));
    f.hp = Math.max(0, f.hp - dmg);
    f.burnTurns--;
    log(`${sideLabel(side)} chịu ${dmg} sát thương do Cháy (còn ${f.burnTurns} lượt).`, 'log-dmg');
  }
}

function checkDeath() {
  if (state.player.hp <= 0 && state.enemy.hp <= 0) { endGame(null); return true; }
  if (state.player.hp <= 0) { endGame('enemy'); return true; }
  if (state.enemy.hp <= 0) { endGame('player'); return true; }
  if (state.round > 20) { endGame(state.player.hp === state.enemy.hp ? null : (state.player.hp > state.enemy.hp ? 'player' : 'enemy'), true); return true; }
  return false;
}

/* ---------------- RENDER ---------------- */
function hpClass(f) {
  const pct = f.hp / f.maxHp;
  if (pct <= 0.3) return 'hp-low';
  if (pct <= 0.6) return 'hp-mid';
  return '';
}
function renderStats(f, ul) {
  ul.innerHTML = `
    <li><span>ATK</span><span>${f.atk}</span></li>
    <li><span>Special Attack</span><span>${f.spa}</span></li>
    <li><span>Defend</span><span>${f.def}</span></li>
    <li><span>Magic Resistance</span><span>${f.mres}</span></li>
    <li><span>Speed</span><span>${f.speed}</span></li>
  `;
}
function renderStatus(f, box) {
  box.innerHTML = '';
  if (f.burnTurns > 0) box.innerHTML += `<span class="status-chip burn">🔥 Cháy · còn ${f.burnTurns} lượt</span>`;
  if (f.bound) box.innerHTML += `<span class="status-chip bound">🔒 Bị trói</span>`;
  if (f.shieldActive) box.innerHTML += `<span class="status-chip shield">🛡 Đang phòng thủ</span>`;
}

function renderTop() {
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

  el.energyOrbs.innerHTML = '';
  for (let i = 0; i < state.player.maxEnergy; i++) {
    const orb = document.createElement('span');
    orb.className = 'energy-orb' + (i >= state.player.energy ? ' spent' : '');
    el.energyOrbs.appendChild(orb);
  }
  el.drawCount.textContent = `Bốc: ${state.player.drawPile.length}`;
  el.discardCount.textContent = `Bỏ: ${state.player.discard.length}`;

  if (state.enemy.nextIntent) {
    const d = intentDescription(state.enemy.nextIntent.cardId, state.enemy.nextIntent.target);
    el.intentBody.innerHTML = `<span class="intent-icon">${d.icon}</span><span>${d.text}</span>`;
  }

  el.round.textContent = state.round;
}

function groupLabel(g) { return g === 'attack' ? 'Tấn công' : g === 'defense' ? 'Phòng thủ' : 'Ma thuật'; }
function axisLabel(card) {
  if (card.axis === 'row') return 'Nhắm: chọn hàng';
  if (card.axis === 'col') return 'Nhắm: chọn cột';
  if (card.axis === 'ownCell') return 'Nhắm: chọn ô di chuyển';
  return 'Tự thân, không cần nhắm';
}

function renderHand() {
  el.handCards.innerHTML = '';
  state.player.hand.forEach((id, idx) => {
    const card = CARD_MAP[id];
    const affordable = state.player.energy >= card.cost;
    const div = document.createElement('div');
    div.className = 'card' + (state.lockedCard && state.lockedCard.handIndex === idx ? ' selected' : '');
    if (!affordable || state.busy || state.gameOver) div.classList.add('disabled');
    div.innerHTML = `
      <div class="card-top">
        <span class="card-group ${card.group}">${groupLabel(card.group)}</span>
        <span class="card-cost">${card.cost}</span>
      </div>
      <h4>${card.icon} ${card.name}</h4>
      <p>${card.desc}</p>
      <span class="card-axis">${axisLabel(card)}</span>
    `;
    div.addEventListener('mouseenter', () => cardHoverPreview(card));
    div.addEventListener('mouseleave', cardHoverEnd);
    div.addEventListener('click', () => selectHandCard(idx));
    el.handCards.appendChild(div);
  });

  if (state.lockedCard) {
    el.phaseInstruction.textContent = `Đang nhắm cho "${state.lockedCard.card.name}" — rê chuột trên bàn cờ để xem trước, bấm vào ô để thi triển.`;
    el.gridCaption.textContent = `${axisLabel(state.lockedCard.card)}. Bấm lá bài khác để đổi mục tiêu.`;
  } else {
    el.phaseInstruction.textContent = 'Chọn 1 lá bài để bắt đầu nhắm mục tiêu.';
    el.gridCaption.textContent = 'Chọn 1 lá bài, rồi rê chuột lên bàn cờ để xem trước phạm vi — bấm vào ô để thi triển.';
  }

  el.endTurnBtn.disabled = state.busy || state.gameOver;
}

function render() {
  placeTokens();
  renderTop();
  renderHand();
}

/* ---------------- GAME OVER ---------------- */
function endGame(winnerSide, byLimit) {
  state.gameOver = true;
  el.overlay.hidden = false;
  if (winnerSide === null) {
    el.overlayTitle.textContent = 'Hòa!';
    el.overlayText.textContent = byLimit
      ? 'Hết 20 lượt và hai bên bằng máu — trận đấu kết thúc hòa.'
      : 'Cả hai cùng gục ngã cùng lúc.';
  } else if (winnerSide === 'player') {
    el.overlayTitle.textContent = byLimit ? 'Bạn thắng theo % HP còn lại!' : 'Bạn thắng!';
    el.overlayText.textContent = 'Kiếm Sĩ Đỏ đã hạ gục Pháp Sư Navy.';
  } else {
    el.overlayTitle.textContent = byLimit ? 'Đối thủ thắng theo % HP còn lại!' : 'Bạn thua!';
    el.overlayText.textContent = 'Pháp Sư Navy đã hạ gục Kiếm Sĩ Đỏ.';
  }
  render();
}

el.endTurnBtn.addEventListener('click', endTurn);
el.overlayRestart.addEventListener('click', startGame);
el.restartBtn.addEventListener('click', startGame);

/* ---------------- BOOT ---------------- */
function startGame() {
  el.overlay.hidden = true;
  el.logFeed.innerHTML = '';
  resetState();
  buildGrid();
  log('Trận đấu bắt đầu! Mỗi lượt bạn có 3 năng lượng để chơi nhiều lá bài. Xem "Ý định tiếp theo" của đối thủ để phản ứng kịp.', 'log-system');
  decideEnemyIntent();
  startPlayerTurn();
}

startGame();