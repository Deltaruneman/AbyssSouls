(function(){
"use strict";
const $ = id => document.getElementById(id);

/* ============== CONFIG ============== */
const MAP_IMG = {src:"map.png", w:446, h:448};
const ROOM_DEF = {
  A:      {name:"TÒA A", sub:"Hội trường", x:48, y:65, connects:["LIB","E","B"], event:"stage"},
  B:      {name:"TÒA B", sub:"Khu học tập", x:33, y:38, connects:["A","C","E","CANTEEN","PARK"], event:"floors"},
  C:      {name:"TÒA C", sub:"Khu học tập nhưng high tech", x:57, y:38, connects:["B","D","E","CANTEEN","FIELD"], event:"wire"},
  D:      {name:"TÒA D", sub:"", x:65, y:10, connects:["C","FIELD"], event:"quiz"},
  E:      {name:"TÒA E", sub:"Khu học tập nhưng 2 thang máy", x:68, y:59, connects:["A","B","C","FIELD"], event:"wibu"},
  LIB:    {name:"THƯ VIỆN", sub:"Kho sách", x:37, y:76, connects:["A","PARK"], event:"books"},
  CANTEEN:{name:"CĂN TIN", sub:"Khu an toàn", x:43, y:16, connects:["B","C"], safe:true},
  PARK:   {name:"CHỖ GỬI XE", sub:"Bãi giữ xe", x:27, y:93, connects:["LIB","B"], event:"bikes", noEvent:true},
  FIELD:  {name:"SÂN BÓNG", sub:"Sân thể thao ngoài trời", x:67, y:22, connects:["D","E","C"], event:"ball", noEvent:true}
};
const ROOM_KEYS = Object.keys(ROOM_DEF);

const ROOM_IMAGES = {
  A:"assets/images/ToaA.png", 
  B:"assets/images/ToaB.png", 
  C:"assets/images/ToaC.png", 
  D:"assets/images/ToaD.png", 
  E:"assets/images/ToaE.png", 
  LIB:"assets/images/lib.png", 
  CANTEEN:"assets/images/ct.png",
  PARK:"assets/images/park.png", 
  FIELD:"assets/images/field.png"
};

const ROOM_FALLBACK_GRADIENT = {
  A:"linear-gradient(135deg,#241a12,#12100e)",
  B:"linear-gradient(135deg,#141c22,#0e1214)",
  C:"linear-gradient(135deg,#122024,#0e1214)",
  D:"linear-gradient(135deg,#241214,#120e0f)",
  E:"linear-gradient(135deg,#1c1424,#100e14)",
  LIB:"linear-gradient(135deg,#1e1a12,#100f0c)",
  CANTEEN:"linear-gradient(135deg,#0f2418,#0c1712)",
  PARK:"linear-gradient(135deg,#1a1c14,#100f0c)",
  FIELD:"linear-gradient(135deg,#0e2018,#0c1410)"
};

const NPC_META = {
  WIBU:  { avatarBg:'#5a3a8a', avatarText:'和' },
  LINH:  { avatarBg:'#2a5a3a', avatarText:'💤' },
  TRONG: { avatarBg:'#7a1a1a', avatarText:'✦' },
  TOBY:  { avatarBg:'#2a4a7a', avatarText:'🐕' }
};

let _storedVol = 80;
try{
  const _v = localStorage.getItem('uit_master_volume');
  if(_v!==null){ const n = parseInt(_v,10); if(!isNaN(n)) _storedVol = Math.max(0,Math.min(100,n)); }
}catch(e){}
const SETTINGS = { masterVolume:_storedVol, shake:true, flash:true };
const TIU_IMAGE = "assets/images/TIU.png";
const TIU_JUMPSCARE_SFX = "assets/sfx/TIUAttack.mp3";

/* ---- Thời gian: 1 đêm = 00:00 -> 07:30 (450 phút game) = 10 phút thực ---- */
const GAME_MINUTES_TOTAL = 7.5*60;
const NIGHT_REAL_MS = 10*60*1000;
function realMsPerGameMin(){
  return NIGHT_REAL_MS / ((S && S.nightTotalMin) || GAME_MINUTES_TOTAL);
}
const BASE_MOVE_COST_MIN = 10; // mỗi lượt đi giữa 2 tòa liền kề mất 10 phút game

/* ---- Căn tin: khu an toàn (The TIU không vào) và chỉ mở theo khung giờ ---- */
const CANTEEN_WINDOWS = [[60,120],[240,300]]; // 01:00-02:00 & 04:00-05:00
function isCanteenOpen(gmin){
  const t = ((S && S.nightStartClockMin) || 0) + gmin;
  return CANTEEN_WINDOWS.some(([a,b])=>t>=a && t<b);
}
function isRoomSafe(k){
  if(!ROOM_DEF[k].safe) return false;
  return isCanteenOpen(S ? S.gameMinutes : 0);
}

/* ---- Tiến trình: Chapter 1 = 3 đêm loại trừ; Chapter 2 = 2 đêm (chuẩn bị + trận cuối) ---- */
const NIGHT_NAMES = {
  1: [null, 'ĐÊM 1', 'ĐÊM 2', 'ĐÊM 3'],
  2: [null, 'ĐÊM 1 — CHUẨN BỊ', 'ĐÊM 2 — ĐẠI CHIẾN']
};
function nightName(ch, n){ return (NIGHT_NAMES[ch] || NIGHT_NAMES[1])[n] || ('ĐÊM '+n); }
const TIU_MOVE_EVERY = { 1:[22,34], 2:[16,26], 3:[11,19] };
const EVENT_EVERY = { 1:[55,85], 2:[42,68], 3:[30,52] };   // sự cố do The TIU gây ra (chỉ Chapter 1)
const TIU_INVULN_MIN = 40;      // sau khi bị bắt, TIU bị đẩy đi và không bắt lại trong khoảng này
const TIU_CHASE_CHANCE = 0.35;  // xác suất mỗi bước TIU tiến thẳng về phía người chơi
const NPC_MOVE_EVERY = [45,75]; // các NPC đi lang thang theo chu kỳ này (phút game)
const NPC_MOVE_CHANCE = 0.6;
const POINTS_START = 30;        // "Điểm" dùng mua đồ ở Căn tin
const POINTS_PER_WIN = 25;
const QTE_COUNT = { fighter:3, assassin:5, mage:4, healer:3, summoner:4 };

const SAVE_KEY = 'uit_savegame_v2';
const CHECKPOINT_KEY = 'uit_checkpoint_v2';

function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function clamp(v,lo,hi){ return Math.min(hi, Math.max(lo, v)); }

/* Chỗ Gửi Xe & Sân Bóng có tỉ lệ xuất hiện La Peace cao hơn: mỗi phòng trong danh sách
   này được nhân trọng số LA_PEACE_HOTSPOT_WEIGHT lần so với các phòng thường khác. */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function pickDistinctRooms(pool, n){
  const arr = shuffle(pool.slice());
  return arr.slice(0, Math.min(n, arr.length));
}

/* ============== STATE ============== */
let S = null;
let BATTLE = null;   // trận đấu đang diễn ra (xem phần BATTLE UI)

function scavengeName(type){
  if(RPG.COMPONENTS[type]) return RPG.COMPONENTS[type].name;
  if(RPG.ITEMS[type]) return RPG.ITEMS[type].name;
  return type;
}

function freshState(night, chapter, opts){
  opts = opts || {};
  chapter = chapter || 1;
  const startRoom = pick(ROOM_KEYS);
  const nonSafe = ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe);
  const monsterRoom = pick(nonSafe.filter(r=>r!==startRoom));
  // Thu gom tài nguyên: Chapter 2 đêm 1 ("chuẩn bị đại chiến") rải nhiều hơn
  const scavN = chapter===2 ? 8 : 4;
  const scavengeRooms = pickDistinctRooms(nonSafe, Math.min(scavN, nonSafe.length));
  const scavenge = {};
  const compIds = Object.keys(RPG.COMPONENTS);
  const lootIds = ['bimbim','water','antidote'];
  scavengeRooms.forEach(r=>{ scavenge[r] = Math.random()<0.25 ? pick(lootIds) : pick(compIds); });
  const npcRoom = {};
  RPG.NPC_ROSTER.forEach(n=>{ npcRoom[n.id] = n.homeRoom; });
  return {
    chapter, night, standalone:false,
    gameMinutes:0, nightStartClockMin:0, nightTotalMin:GAME_MINUTES_TOTAL,
    running:true, paused:false, lastTick:performance.now(),
    points: opts.points!=null ? opts.points : POINTS_START,
    playerRoom:startRoom,
    tiuOn: chapter===1,
    monsterRoom, lastSeenRoom:null, lastSeenAt:0, invulnUntil:0,
    nextMonsterMoveAt: rand(...(TIU_MOVE_EVERY[night] || TIU_MOVE_EVERY[1])),
    nextNpcMoveAt: rand(...NPC_MOVE_EVERY),
    activeEvents:{}, nextEventAt: rand(...(EVENT_EVERY[night] || EVENT_EVERY[1])),
    scavenge, npcRoom,
    talked:{}, duelDone:{}, scouted:{}, traps:{}, npcDebuff:{},
    log:[], tdSeed:null, tdRoom:null, tdX:null, tdY:null, final:false
  };
}

/* ============== LƯU / TẢI ============== */
function serializeSave(){
  if(!S) return null;
  return { v:2, savedAt:Date.now(), state:S, rpg:RPG.serialize() };
}
function persistSave(){
  if(!S || !S.running) return;
  try{
    const data = serializeSave();
    if(data) localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){}
}
function saveCheckpoint(){
  try{ const data = serializeSave(); if(data) localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(data)); }catch(e){}
}
let _autoSaveTimer = null;
function scheduleAutoSave(){
  if(_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(persistSave, 800);
}
function readSlot(key){
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return null;
    const d = JSON.parse(raw);
    return (d && d.v===2 && d.state && d.rpg) ? d : null;
  }catch(e){ return null; }
}
function readSaveGame(){ return readSlot(SAVE_KEY); }
function hasSaveGame(){ return !!readSaveGame(); }
function deleteSaveGame(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
function restoreFrom(data){
  S = data.state;
  RPG.load(data.rpg);
  S.lastTick = performance.now();
  S.paused = false;
  S.running = true;
  BATTLE = null;
  buildMap();
  hideAllOverlays();
  $('pauseMenu').classList.add('hidden');
  $('battleOverlay').classList.add('hidden');
  $('mgModal').classList.add('hidden');
  refreshAll();
  refreshBagBadge();
  addLog('📂 Đã tải lại tiến trình đã lưu.', '');
  return true;
}
function loadGame(){
  const data = readSaveGame();
  return data ? restoreFrom(data) : false;
}
function loadCheckpoint(){
  const data = readSlot(CHECKPOINT_KEY);
  return data ? restoreFrom(data) : false;
}

/* ============== VISUAL NOVEL ============== */
let VN_ACTIVE = null;
function isChoiceLine(l){ return !!(l && l.choices && l.choices.length); }

function playVN(lines, onDone){
  if(!lines || !lines.length){ if(onDone) onDone(); return; }
  S.paused = true;
  const overlay = document.getElementById('vnOverlay');
  const spkEl = document.getElementById('vnSpeaker');
  const txtEl = document.getElementById('vnText');
  const nextBtn = document.getElementById('vnNextBtn');
  const footer = document.getElementById('vnFooter');
  overlay.classList.remove('hidden');
  let i = 0;
  let finished = false;
  const queue = lines.slice();
  function clearChoiceButtons(){
    footer.querySelectorAll('.vnChoiceBtn').forEach(b=>b.remove());
    nextBtn.classList.remove('hidden');
  }
  function showLine(){
    const l = queue[i];
    spkEl.textContent = l.spk;
    txtEl.textContent = l.text || '';
    clearChoiceButtons();
    if(l.choices && l.choices.length){
      nextBtn.classList.add('hidden');
      l.choices.forEach(choice=>{
        const b = document.createElement('button');
        b.className = 'btn primary vnChoiceBtn';
        b.textContent = choice.label;
        b.onclick = ()=>{
          if(choice.insert && choice.insert.length) queue.splice(i+1, 0, ...choice.insert);
          if(choice.onChoose) choice.onChoose(); // hook cho lựa chọn có ảnh hưởng cơ chế game (không chỉ chèn thoại)
          advance();
        };
        footer.appendChild(b);
      });
    } else {
      nextBtn.textContent = (i>=queue.length-1) ? 'ĐÓNG ▶' : 'TIẾP TỤC ▶';
    }
  }
  function advance(){
    i++;
    if(i>=queue.length){
      finished = true;
      if(VN_ACTIVE === ctl) VN_ACTIVE = null; // gỡ TRƯỚC onDone để onDone có thể mở đoạn thoại mới
      overlay.classList.add('hidden');
      clearChoiceButtons();
      nextBtn.onclick = null;
      S.paused = false;
      S.lastTick = performance.now();
      if(onDone) onDone();
      return;
    }
    showLine();
  }
  nextBtn.onclick = advance;
  const ctl = {
    /* Phím J: sang câu thoại kế tiếp. Không làm gì nếu câu hiện tại đang chờ chọn nhánh. */
    next(){
      if(finished || isChoiceLine(queue[i])) return false;
      advance();
      return true;
    },
    /* Phím Ctrl: tua qua toàn bộ phần hội thoại còn lại. Dừng lại tại dòng có lựa chọn để
       người chơi tự quyết định (vì lựa chọn có thể chèn thoại / tác động cơ chế game). */
    skip(){
      if(finished) return false;
      while(!finished && !isChoiceLine(queue[i])) advance();
      return true;
    }
  };
  VN_ACTIVE = ctl;
  showLine();
}

/* ---- Nội dung hội thoại (VN_INTRO, VN_OUTRO, NPC_DIALOGUES, TRONG_DIALOGUE)
   đã được chuyển sang file dialogue.js — nạp trước script.js trong index.html. ---- */

/* Thay {P} bằng tên người chơi */
function fmtLines(lines){
  const me = (typeof RPG!=='undefined' && RPG.getState && RPG.getState()) ? RPG.player().name : 'Bạn';
  return (lines||[]).map(l=>Object.assign({}, l, { spk:(l.spk||'').replace(/\{P\}/g, me), text:(l.text||'').replace(/\{P\}/g, me) }));
}
function playDLG(lines, onDone){ playVN(fmtLines(lines), onDone); }

/* ============== LOG ============== */
function addLog(msg, cls){
  S.log.unshift({msg, cls, t: formatClock(S.gameMinutes)});
  if(S.log.length>60) S.log.pop();
  renderLog();
}
function renderLog(){
  const el = document.getElementById('logPane');
  el.innerHTML = '<div class="logHead">NHẬT KÝ CA TRỰC</div>' +
    S.log.map(l=>`<div class="entry ${l.cls||''}">[${l.t}] ${l.msg}</div>`).join('');
}

/* ============== CLOCK ============== */
function formatClock(gmin){
  const startOffset = (S && S.nightStartClockMin) || 0; // 0 (Chapter 1) hoặc 21:00=1260 (Chapter 2)
  let total = gmin + startOffset;
  let h = Math.floor(total/60);
  let m = Math.floor(total%60);
  h = h%24;
  return String(h).padStart(2,'0')+":"+String(m).padStart(2,'0');
}

function eventLabel(ev){
  return {stage:'Kiểm tra sân khấu', floors:'Bật/tắt các tầng', wire:'Nối dây điện', quiz:'Trả lời câu hỏi', wibu:'Bắt Wibu Việt Nhật', books:'Sắp xếp lại sách', bikes:'Dắt xe về đúng hàng', ball:'Tìm quả bóng lạc'}[ev]||ev;
}
/* ============== MODAL DÙNG CHUNG (tái dùng #mgModal) ============== */
function showModal(title, html, buttons){
  const modal = $('mgModal');
  modal.classList.remove('hidden');
  $('mgTitle').textContent = title;
  $('mgTimer').textContent = '';
  $('mgBody').innerHTML = html;
  const footer = $('mgFooter');
  footer.innerHTML = '';
  (buttons||[]).forEach(b=>{
    const el = document.createElement('button');
    el.className = 'btn' + (b.primary?' primary':'') + (b.danger?' danger':'');
    el.textContent = b.label;
    if(b.disabled) el.disabled = true;
    el.onclick = b.onClick || (()=>closeModal());
    footer.appendChild(el);
  });
  if(S && S.running && !isBattleActive()) S.paused = true;
}
function closeModal(keepPaused){
  $('mgModal').classList.add('hidden');
  if(S && !keepPaused && !isBattleActive() && !VN_ACTIVE){
    S.paused = false;
    S.lastTick = performance.now();
  }
}
function isBattleActive(){ return !!(BATTLE && !BATTLE.closed); }

/* ============== MAP RENDER ============== */
function buildMapInto(wrapId, prefix){
  const wrap = document.getElementById(wrapId);
  if(!wrap) return;
  wrap.innerHTML = '';
  // Ảnh nền bản đồ (là phần tử con nên vẫn bị ẩn khi mất điện)
  const img = document.createElement('img');
  img.className = 'map-img';
  img.src = MAP_IMG.src;
  img.alt = '';
  img.draggable = false;
  wrap.appendChild(img);
  // Đường nối: vẽ bằng SVG theo toạ độ %, không phụ thuộc kích thước thực của khung
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS,'svg');
  svg.setAttribute('class','map-edges');
  svg.setAttribute('viewBox','0 0 100 100');
  svg.setAttribute('preserveAspectRatio','none');
  const drawn = new Set();
  ROOM_KEYS.forEach(k=>{
    ROOM_DEF[k].connects.forEach(c=>{
      const key = [k,c].sort().join('-');
      if(drawn.has(key)) return;
      drawn.add(key);
      const a = ROOM_DEF[k], b = ROOM_DEF[c];
      const line = document.createElementNS(NS,'line');
      line.setAttribute('x1',a.x); line.setAttribute('y1',a.y);
      line.setAttribute('x2',b.x); line.setAttribute('y2',b.y);
      line.setAttribute('class','edge-line');
      svg.appendChild(line);
    });
  });
  wrap.appendChild(svg);
  ROOM_KEYS.forEach(k=>{
    const def = ROOM_DEF[k];
    const node = document.createElement('div');
    node.className='room-node'+(def.safe?' savezone':'');
    node.id=prefix+'-node-'+k;
    node.style.left = def.x+'%';
    node.style.top = def.y+'%';
    node.innerHTML = `<div class="room-box">${def.name}</div>`;
    node.addEventListener('click', ()=>onRoomClick(k));
    wrap.appendChild(node);
  });
}
function buildMap(){
  buildMapInto('mapSvgWrap','modal');
  buildMapInto('miniMapSvgWrap','mini');
}

function refreshMapInto(prefix){
  const npcRooms = {};
  RPG.NPC_ROSTER.forEach(n=>{
    const f = RPG.get(n.id);
    if(f && f.alive && !f.inParty && S.scouted[n.id]) npcRooms[S.npcRoom[n.id]] = true;
  });
  ROOM_KEYS.forEach(k=>{
    const node = document.getElementById(prefix+'-node-'+k);
    if(!node) return;
    node.classList.remove('current-marker','reachable','tiu-alert');
    node.classList.toggle('savezone', isRoomSafe(k));
    const badge = node.querySelector('.event-badge');
    if(badge) badge.remove();
    if(k===S.playerRoom) node.classList.add('current-marker');
    else if(ROOM_DEF[S.playerRoom].connects.includes(k)) node.classList.add('reachable');
    if(S.activeEvents[k]){
      const b = document.createElement('div');
      b.className = 'event-badge';
      b.textContent = '!';
      node.appendChild(b);
    } else if(npcRooms[k]){
      const b = document.createElement('div');
      b.className = 'event-badge';
      b.textContent = '👤';
      node.appendChild(b);
    }
  });
}
function refreshMap(){
  refreshMapInto('modal');
  refreshMapInto('mini');
}


/* ============== HUD ============== */
function refreshHud(){
  if(!S) return;
  const me = RPG.player();
  $('clockVal').textContent = formatClock(S.gameMinutes);
  $('pointsHud').textContent = S.points;
  $('nightBadge').textContent = (S.chapter===2 ? 'CH.2 · ' : 'CH.1 · ') + nightName(S.chapter, S.night);

  // Khối "HP" cũ -> ĐRL của người chơi
  const hpWrap = $('hpWrap');
  hpWrap.innerHTML = `<span class="hud-value" style="color:var(--amber);">${me.drl}</span>`;
  const hpLabel = hpWrap.parentElement && hpWrap.parentElement.querySelector('.hud-label');
  if(hpLabel) hpLabel.textContent = 'ĐRL';

  // Thanh "Mức độ hoạt động" cũ -> EXP / Level
  const need = RPG.CFG.EXP_TABLE[Math.min(RPG.CFG.MAX_LEVEL, me.level+1)];
  const base = RPG.CFG.EXP_TABLE[me.level];
  const pct = me.level>=RPG.CFG.MAX_LEVEL ? 100 : Math.round((me.exp-base)/(need-base)*100);
  $('meterLabel').textContent = me.level>=RPG.CFG.MAX_LEVEL
    ? `${RPG.CLASSES[me.classId].name.toUpperCase()} · Lv ${me.level} (TỐI ĐA)`
    : `${RPG.CLASSES[me.classId].name.toUpperCase()} · Lv ${me.level} · EXP ${me.exp}/${need}`;
  $('meterFill').style.width = pct+'%';

  // Khối "THỂ LỰC" cũ -> thanh HP của người chơi (HP được giữ lại giữa các trận)
  const st = $('staminaOuter');
  if(st){
    st.style.display = '';
    const lab = st.querySelector('.hud-label');
    if(lab) lab.textContent = 'HP '+me.hp+'/'+me.maxHp;
    const fill = $('staminaFill');
    const hpPct = Math.round(me.hp/Math.max(1,me.maxHp)*100);
    fill.style.width = hpPct+'%';
    fill.style.background = hpPct>50 ? 'linear-gradient(90deg,#2e9e4f,#6fe89a)' : (hpPct>20 ? 'linear-gradient(90deg,#b58a1e,#f0c040)' : 'linear-gradient(90deg,#a02020,#e04040)');
  }

  const tiuEl = $('tiuLastSeen');
  const tiuLabelEl = $('tiuLastSeenLabel');
  if(tiuLabelEl) tiuLabelEl.textContent = 'THE TIU LẦN CUỐI THẤY TẠI';
  if(!S.tiuOn){
    tiuEl.textContent = 'Đang nghỉ';
    tiuEl.style.color = 'var(--text-dim)';
  } else {
    tiuEl.textContent = S.lastSeenRoom ? ROOM_DEF[S.lastSeenRoom].name : '—';
    tiuEl.style.color = 'var(--blood-bright)';
  }
}

/* ============== ACTION PANE ============== */
let actionPaneDirty = true;
let lastNpcSig = '';
function markActionDirty(){ actionPaneDirty = true; scheduleAutoSave(); refreshBagBadge(); }

function roomDescText(def){
  let desc = def.sub || '';
  if(def.safe && !isRoomSafe(S.playerRoom)){
    desc += (desc?' — ':'') + 'Căn tin chỉ mở cửa lúc 01:00-02:00 và 04:00-05:00.';
  }
  if(S.scavenge[S.playerRoom]){
    desc += (desc?' — ':'') + '🔧 Có vật gì đó nằm trong góc phòng...';
  }
  const npcs = getRoomNPCs(S.playerRoom);
  if(npcs.length) desc += (desc?' — ':'') + '👤 ' + npcs.map(n=>n.name).join(', ') + ' đang ở đây.';
  return desc;
}
function updateRoomDescOnly(){
  if(!S) return;
  const el = $('roomDesc');
  if(el) el.textContent = roomDescText(ROOM_DEF[S.playerRoom]);
}

function refreshActionPane(){
  if(!S) return;
  const def = ROOM_DEF[S.playerRoom];
  const safeNow = isRoomSafe(S.playerRoom);
  $('roomTitle').textContent = def.name;
  let safeTag = '';
  if(def.safe) safeTag = safeNow ? '✓ KHU AN TOÀN — ĐANG MỞ CỬA' : '✕ CĂN TIN ĐÃ ĐÓNG CỬA';
  $('roomSafeTag').textContent = safeTag;
  $('roomSafeTag').style.color = safeNow ? 'var(--scan)' : 'var(--blood-bright)';

  const banner = $('roomBanner');
  banner.classList.toggle('safebanner', safeNow);
  const td = tdActive();
  banner.classList.toggle('td-on', td);
  const imgUrl = ROOM_IMAGES[S.playerRoom];
  banner.style.backgroundImage = td ? 'none' : (imgUrl ? `url('${imgUrl}')` : ROOM_FALLBACK_GRADIENT[S.playerRoom]);
  const resolveBtn = $('resolveBtn');
  const curEvent = S.activeEvents[S.playerRoom];
  resolveBtn.classList.toggle('show', !!curEvent && !td);
  if(curEvent){
    resolveBtn.textContent = '⚠ XỬ LÝ: '+eventLabel(def.event);
    resolveBtn.onclick = ()=>startMinigame(S.playerRoom);
  }

  const npcs = getRoomNPCs(S.playerRoom);
  const npcSprite = $('npcSprite');
  npcSprite.classList.toggle('hidden', !npcs.length || td);
  if(npcs.length){
    const m = npcs[0];
    const av = $('npcAvatar');
    av.style.background = m.avatarBg;
    av.textContent = m.avatarText;
    $('npcName').textContent = m.name;
  }

  $('roomDesc').textContent = roomDescText(def);

  const btnWrap = $('actionButtons');
  btnWrap.innerHTML = '';
  function makeGroup(title){
    const g = document.createElement('div'); g.className = 'actionGroup';
    const h = document.createElement('div'); h.className = 'actionGroupTitle'; h.textContent = title; g.appendChild(h);
    const row = document.createElement('div'); row.className = 'actionGroupRow'; g.appendChild(row);
    return {g, row};
  }
  function addBtn(group, label, cls, fn, disabled){
    const b = document.createElement('button');
    b.className = 'btn' + (cls ? ' '+cls : ''); b.textContent = label; b.onclick = fn;
    if(disabled) b.disabled = true;
    group.row.appendChild(b);
  }

  const moveGroup = makeGroup('DI CHUYỂN');
  def.connects.forEach(c=> addBtn(moveGroup, '➜ '+ROOM_DEF[c].name, '', ()=>movePlayer(c)));
  btnWrap.appendChild(moveGroup.g);

  const itemGroup = makeGroup('VẬT PHẨM');
  if(def.safe && !td){
    addBtn(itemGroup, safeNow ? 'Mở quầy Căn tin' : 'Căn tin đang đóng cửa', 'primary', openShop, !safeNow);
    addBtn(itemGroup, '🛠 Bàn chế tạo', '', openCraftBench);
  }
  if(S.scavenge[S.playerRoom] && !td){
    addBtn(itemGroup, '🔧 Nhặt '+scavengeName(S.scavenge[S.playerRoom]), 'peace', pickupScavenge);
  }
  if(itemGroup.row.children.length) btnWrap.appendChild(itemGroup.g);

  if(npcs.length && !td){
    const g = makeGroup('TƯƠNG TÁC');
    npcs.forEach(m=> addBtn(g, '💬 Gặp '+m.name, 'npc', ()=>openNPCMenu(m)));
    btnWrap.appendChild(g.g);
  }

  const me = RPG.player();
  const comp = Object.keys(RPG.COMPONENTS).map(k=>RPG.COMPONENTS[k].name+' '+(me.components[k]||0)).join(' / ');
  const party = RPG.partyAllies().map(f=>f.name).join(', ') || '—';
  $('invRow').innerHTML = `<div class="itemChip">Class: <b>${RPG.CLASSES[me.classId].icon} ${RPG.CLASSES[me.classId].name} Lv${me.level}</b></div>
    <div class="itemChip">Đội hình: <b>${party}</b></div>
    <div class="itemChip">Linh kiện: <b>${comp}</b></div>
    <div class="itemChip">Còn sống: <b>${RPG.aliveFighters().length}/5</b></div>`;
  refreshHiddenStats();
}

/* ---- Chỉ số ẩn (nút ⋮): Tin tưởng + thông tin đã dò được của NPC ---- */
function refreshHiddenStats(){
  const pop = $('hiddenStatsPopover');
  if(!pop || !S) return;
  const rows = RPG.NPC_ROSTER.map(n=>{
    const f = RPG.get(n.id);
    if(!f) return '';
    if(!f.alive) return `<div class="itemChip" style="opacity:.5;text-decoration:line-through;">${f.name}: ĐÃ BỊ LOẠI</div>`;
    const known = f.trust>=1 || S.scouted[n.id];
    const info = known ? ` · ${RPG.CLASSES[f.classId].name} Lv${f.level}` : '';
    const where = S.scouted[n.id] ? ` · 📍${ROOM_DEF[S.npcRoom[n.id]].name}` : '';
    return `<div class="itemChip">${f.name}${f.inParty?' (đồng đội)':''}: Tin tưởng <b>${f.trust}/${RPG.CFG.TRUST_MAX}</b>${info}${where}</div>`;
  }).join('');
  pop.innerHTML = `<div class="hiddenStatsTitle">NPC</div>${rows}`;
}

/* ============== THU GOM / CHẾ TẠO ============== */
function pickupScavenge(){
  if(!S || !S.scavenge[S.playerRoom]) return;
  const type = S.scavenge[S.playerRoom];
  const me = RPG.player();
  if(RPG.COMPONENTS[type]) RPG.addComponent(me, type, 1);
  else RPG.addItem(me, type, 1);
  delete S.scavenge[S.playerRoom];
  addLog('🔧 Bạn nhặt được '+scavengeName(type)+' tại '+ROOM_DEF[S.playerRoom].name+'.', '');
  markActionDirty();
  refreshAll();
}

function openCraftBench(){
  const me = RPG.player();
  function render(){
    const compLine = Object.keys(RPG.COMPONENTS).map(k=>RPG.COMPONENTS[k].icon+' '+RPG.COMPONENTS[k].name+': <b>'+(me.components[k]||0)+'</b>').join(' &nbsp;|&nbsp; ');
    const rows = Object.keys(RPG.RECIPES).map(id=>{
      const it = RPG.ITEMS[id], r = RPG.RECIPES[id];
      const need = Object.keys(r).map(c=>RPG.COMPONENTS[c].name+' x'+r[c]).join(', ');
      return `<div class="shopItem"><span>${it.icon} ${it.name} <span style="font-size:11px;color:var(--text-dim);">(cần ${need})</span><br><span style="font-size:11px;color:var(--text-dim);">${it.desc}</span></span><button class="btn primary" data-craft="${id}" ${RPG.canCraft(me,id)?'':'disabled'}>${RPG.canCraft(me,id)?'Chế tạo':'Thiếu'}</button></div>`;
    }).join('');
    showModal('🛠 BÀN CHẾ TẠO', `<p style="font-size:12px;color:var(--text-dim);">${compLine}</p>${rows}`, [{label:'Đóng', onClick:()=>closeModal()}]);
    document.querySelectorAll('#mgBody [data-craft]').forEach(b=>{
      b.onclick = ()=>{
        const id = b.getAttribute('data-craft');
        if(RPG.craft(me, id)){
          addLog('Bạn đã chế tạo: '+RPG.ITEMS[id].name+'.', '');
          markActionDirty(); refreshAll(); render();
        }
      };
    });
  }
  render();
}

/* ============== NGHỈ NGƠI Ở CĂN TIN: tốn 1 giờ, hồi HP ============== */
function restAtCanteen(){
  if(!S || !S.running || !isRoomSafe(S.playerRoom)) return;
  const me = RPG.player();
  const healed = RPG.healPct(me, RPG.CFG.REST_HEAL_PCT);
  RPG.partyAllies().forEach(a=>RPG.healPct(a, RPG.CFG.REST_HEAL_PCT));
  closeModal(true);
  S.paused = false; S.lastTick = performance.now();
  addLog('😴 Bạn nghỉ ngơi ở Căn tin, hồi '+healed+' HP.', 'good');
  spendTime(60, 'Nghỉ ngơi 1 giờ');
  if(S.running) refreshAll();
}

/* ============== SHOP (Căn tin) ============== */
const SHOP_ITEMS = ['bimbim','water','antidote'];
function openShop(){
  const me = RPG.player();
  function render(){
    const rows = SHOP_ITEMS.map(id=>{
      const it = RPG.ITEMS[id];
      return `<div class="shopItem"><span>${it.icon} ${it.name} — ${it.price}đ<br><span style="font-size:11px;color:var(--text-dim);">${it.desc} (đang có ${RPG.countItem(me,id)})</span></span><button class="btn primary" data-buy="${id}" ${S.points>=it.price?'':'disabled'}>Mua</button></div>`;
    }).join('');
    showModal('QUẦY CĂN TIN', `<p style="font-size:12px;color:var(--text-dim);">Điểm hiện có: <b>${S.points}</b> (thắng trận để kiếm thêm)</p>${rows}
      <div class="shopItem"><span>😴 Nghỉ ngơi 1 giờ<br><span style="font-size:11px;color:var(--text-dim);">Hồi ${Math.round(RPG.CFG.REST_HEAL_PCT*100)}% HP (cả đồng đội), tốn 60 phút game. HP hiện tại: ${me.hp}/${me.maxHp}</span></span><button class="btn" id="restBtn" ${me.hp>=me.maxHp?'disabled':''}>Nghỉ</button></div>`, [{label:'Đóng', onClick:()=>closeModal()}]);
    const rb = $('restBtn'); if(rb) rb.onclick = restAtCanteen;
    document.querySelectorAll('#mgBody [data-buy]').forEach(b=>{
      b.onclick = ()=>{
        const id = b.getAttribute('data-buy'), it = RPG.ITEMS[id];
        if(S.points < it.price) return;
        S.points -= it.price;
        RPG.addItem(me, id, 1);
        addLog('Bạn mua '+it.name+' tại Căn tin.', '');
        markActionDirty(); refreshAll(); render();
      };
    });
  }
  render();
}

/* ============== TÚI ĐỒ ============== */
function bagTotalCount(){
  const me = RPG.player();
  return Object.keys(me.items).reduce((a,k)=>a+me.items[k],0);
}
function refreshBagBadge(){
  const el = $('bagCountBadge');
  if(el && S) el.textContent = bagTotalCount();
}
function isBagOpen(){ return $('mgModal') && !$('mgModal').classList.contains('hidden') && $('mgTitle').textContent.indexOf('TÚI ĐỒ')>=0; }
function closeBagModal(){ closeModal(); }

/* Dùng ngoài trận */
const BAG_MAP_USE = {
  camera: ()=>{
    RPG.NPC_ROSTER.forEach(n=>{ S.scouted[n.id] = true; });
    addLog('📷 Máy quay soi dò được vị trí, Class và Lv của mọi đối thủ còn sống.', '');
    return true;
  },
  trap: ()=>{
    S.traps[S.playerRoom] = true;
    addLog('🪤 Bạn đặt Bẫy gài tại '+ROOM_DEF[S.playerRoom].name+'.', '');
    return true;
  },
  bimbim: ()=>{
    const me = RPG.player();
    if(me.hp>=me.maxHp){ addLog('HP đã đầy, chưa cần ăn Bim Bim.', ''); return false; }
    const h = RPG.healPct(me, RPG.ITEMS.bimbim.effects[0].pct);
    addLog('🍟 Bạn ăn Bim Bim, hồi '+h+' HP.', 'good');
    return true;
  },
  antidote: ()=>{ addLog('Không có hiệu ứng xấu nào để giải ngoài trận.', ''); return false; }
};
function openBagModal(){
  const me = RPG.player();
  const ids = Object.keys(me.items).filter(k=>me.items[k]>0 && RPG.ITEMS[k]);
  const rows = ids.length ? ids.map(id=>{
    const it = RPG.ITEMS[id];
    const mapUse = it.usable.indexOf('map')>=0 && BAG_MAP_USE[id] && id!=='antidote';
    return `<div class="shopItem"><span>${it.icon} ${it.name} <b>x${me.items[id]}</b><br><span style="font-size:11px;color:var(--text-dim);">${it.desc}${it.usable.indexOf('map')<0?' (dùng trong trận)':''}</span></span>${mapUse?`<button class="btn primary" data-use="${id}">Dùng</button>`:''}</div>`;
  }).join('') : '<p style="color:var(--text-dim);">Túi đồ trống.</p>';
  const comp = Object.keys(RPG.COMPONENTS).map(k=>RPG.COMPONENTS[k].icon+' '+RPG.COMPONENTS[k].name+' '+(me.components[k]||0)).join(' &nbsp;|&nbsp; ');
  showModal('🎒 TÚI ĐỒ', `${rows}<p style="font-size:12px;color:var(--text-dim);margin-top:10px;">Linh kiện: ${comp}</p>`, [{label:'Đóng', onClick:()=>closeModal()}]);
  document.querySelectorAll('#mgBody [data-use]').forEach(b=>{
    b.onclick = ()=>{
      const id = b.getAttribute('data-use');
      if(BAG_MAP_USE[id]()) RPG.removeItem(me, id, 1);
      markActionDirty(); refreshAll(); closeModal();
    };
  });
}

/* ============== MOVEMENT ============== */
function onRoomClick(k){
  if(!S || k===S.playerRoom) return;
  if(!ROOM_DEF[S.playerRoom].connects.includes(k)) return;
  if(movePlayer(k)) $('mapModal').classList.add('hidden');
}
/* Điểm vào duy nhất để đổi phòng: hiện màn hình loading rồi mới thực sự chuyển (xem LOADING KHI ĐỔI PHÒNG) */
function movePlayer(dest){
  if(!S || !S.running || S.paused) return false;
  if(TRAVEL.busy) return false;
  startTravel(dest);
  return true;
}
function movePlayerNow(dest){
  if(!S.running || S.paused) return false;
  const from = S.playerRoom;
  S.gameMinutes += BASE_MOVE_COST_MIN;
  S.playerRoom = dest;
  tdEnterRoom(dest, from);
  addLog('Bạn di chuyển đến '+ROOM_DEF[dest].name+'.', '');
  markActionDirty();
  advanceWorld(BASE_MOVE_COST_MIN, {isMove:true});
  if(S.running) checkEncounter();
  refreshAll();
  return true;
}

/* ============== THẾ GIỚI: THỜI GIAN, NPC, THE TIU ============== */
function advanceWorld(minutesPassed){
  // Hồi dần HP ngoài trận (mọi người còn sống)
  RPG.aliveFighters().forEach(f=>RPG.regen(f, f.maxHp * RPG.CFG.REGEN_PER_HOUR * minutesPassed / 60));
  if(S.tiuOn){
    expireEvents();
    S.nextEventAt -= minutesPassed;
    if(S.nextEventAt<=0){
      spawnEvent();
      S.nextEventAt = rand(...(EVENT_EVERY[S.night] || EVENT_EVERY[1]));
      markActionDirty();
    }
    S.nextMonsterMoveAt -= minutesPassed;
    let guard = 0;
    while(S.nextMonsterMoveAt<=0 && guard<6){
      moveMonster();
      S.nextMonsterMoveAt += rand(...(TIU_MOVE_EVERY[S.night] || TIU_MOVE_EVERY[1]));
      guard++;
    }
  }
  S.nextNpcMoveAt -= minutesPassed;
  if(S.nextNpcMoveAt<=0){
    moveNPCs();
    S.nextNpcMoveAt = rand(...NPC_MOVE_EVERY);
  }
  if(S.gameMinutes >= S.nightTotalMin) endNight();
}

function wanderingNPCs(){
  return RPG.NPC_ROSTER.map(n=>RPG.get(n.id)).filter(f=>f && f.alive && !f.inParty);
}
function moveNPCs(){
  wanderingNPCs().forEach(f=>{
    if(Math.random() > NPC_MOVE_CHANCE) return;
    const from = S.npcRoom[f.id];
    const to = pick(ROOM_DEF[from].connects);
    S.npcRoom[f.id] = to;
    if(S.traps[to]){                       // Bẫy gài: NPC bước vào -> -20% HP + mất lượt đầu ở trận kế tiếp
      delete S.traps[to];
      S.npcDebuff[f.id] = { hpPct:RPG.ITEMS.trap.effects[0].hpPct, skipFirst:true };
      addLog('🪤 '+f.name+' dính Bẫy gài của bạn tại '+ROOM_DEF[to].name+'!', 'warn');
    }
    if(to===S.playerRoom) addLog('👤 '+f.name+' bước vào '+ROOM_DEF[to].name+'.', '');
    else if(from===S.playerRoom) addLog('👤 '+f.name+' rời khỏi '+ROOM_DEF[from].name+'.', '');
  });
  markActionDirty();
}

/* ---- The TIU (chỉ Chapter 1): tuần tra, bắt gặp -> trừ ĐRL ---- */
function bfsPath(start, goal, avoidSafe){
  if(start===goal) return [start];
  const visited = new Set([start]);
  const queue = [[start]];
  while(queue.length){
    const path = queue.shift();
    const node = path[path.length-1];
    for(const nb of ROOM_DEF[node].connects){
      if(visited.has(nb)) continue;
      if(avoidSafe && isRoomSafe(nb) && nb!==goal) continue;
      visited.add(nb);
      const newPath = path.concat([nb]);
      if(nb===goal) return newPath;
      queue.push(newPath);
    }
  }
  return null;
}

/* Khoảng cách ngắn nhất (số cạnh trên sơ đồ) giữa 2 phòng bất kỳ, không né khu an toàn
   — dùng để đo The TIU đang cách người chơi bao xa cho hiệu ứng nhạc cảnh báo. */
function roomDistance(a,b){
  if(a===b) return 0;
  const visited = new Set([a]);
  let frontier = [a], dist = 0;
  while(frontier.length){
    dist++;
    const next = [];
    for(const node of frontier){
      for(const nb of ROOM_DEF[node].connects){
        if(nb===b) return dist;
        if(visited.has(nb)) continue;
        visited.add(nb);
        next.push(nb);
      }
    }
    frontier = next;
  }
  return Infinity;
}

function moveMonster(){
  const from = S.monsterRoom;
  let opts = ROOM_DEF[from].connects.filter(r=>!isRoomSafe(r));
  if(opts.length===0) opts = ROOM_DEF[from].connects.slice();
  let next;
  if(Math.random() < TIU_CHASE_CHANCE){
    const path = bfsPath(from, S.playerRoom, true);
    next = (path && path.length>1) ? path[1] : pick(opts);
  } else next = pick(opts);
  S.monsterRoom = next;
  S.lastSeenRoom = from;
  S.lastSeenAt = S.gameMinutes;
  addLog('The TIU vừa rời khỏi '+ROOM_DEF[from].name+'...', 'tiu');
}
function checkEncounter(){
  if(!S.tiuOn || S.gameMinutes < S.invulnUntil) return;
  if(isRoomSafe(S.playerRoom)) return;
  if(S.playerRoom === S.monsterRoom) caughtByTIU();
}
function caughtByTIU(){ jumpscare(); }

/* ---- SỰ CỐ do The TIU gây ra: giải minigame kịp giờ để kiếm điểm ---- */
function lureTIUNear(room){
  const adj = ROOM_DEF[room].connects.filter(r=>!isRoomSafe(r));
  S.monsterRoom = adj.length ? pick(adj) : room;
  S.lastSeenRoom = room;
  S.lastSeenAt = S.gameMinutes;
  addLog('The TIU bị thu hút bởi sự hỗn loạn và nhảy cóc đến gần '+ROOM_DEF[room].name+'!','tiu');
}
function spawnEvent(){
  // Sự cố luôn phát sinh ngay tại phòng The TIU đang đứng (hoặc phòng liền kề). PARK/FIELD (noEvent) không có sự cố.
  let room = (!ROOM_DEF[S.monsterRoom].safe && !ROOM_DEF[S.monsterRoom].noEvent && !S.activeEvents[S.monsterRoom]) ? S.monsterRoom : null;
  if(!room){
    const near = ROOM_DEF[S.monsterRoom].connects.filter(k=>!ROOM_DEF[k].safe && !ROOM_DEF[k].noEvent && !S.activeEvents[k]);
    room = near.length ? pick(near) : null;
  }
  if(!room) return;
  S.activeEvents[room] = {deadline: S.gameMinutes + rand(70,110), start: S.gameMinutes};
  addLog('⚠ The TIU gây ra sự cố tại '+ROOM_DEF[room].name+': '+eventLabel(ROOM_DEF[room].event)+'!','warn');
}
function expireEvents(){
  for(const room in S.activeEvents){
    const ev = S.activeEvents[room];
    if(S.gameMinutes >= ev.deadline){
      delete S.activeEvents[room];
      addLog('Sự cố tại '+ROOM_DEF[room].name+' đã bị bỏ lỡ!','warn');
      if(Math.random()<0.5) lureTIUNear(room);
      markActionDirty();
    }
  }
  // Sự cố dây chuyền: để quá nửa thời hạn có thể lan sang phòng liền kề
  for(const room in S.activeEvents){
    const ev = S.activeEvents[room];
    if(ev.chainChecked) continue;
    const total = ev.deadline - ev.start, elapsed = S.gameMinutes - ev.start;
    if(total>0 && elapsed/total >= 0.5){
      ev.chainChecked = true;
      if(Math.random() < 0.45){
        const cand = ROOM_DEF[room].connects.filter(r=>!ROOM_DEF[r].safe && !ROOM_DEF[r].noEvent && !S.activeEvents[r]);
        if(cand.length){
          const spread = pick(cand);
          S.activeEvents[spread] = {deadline: S.gameMinutes + rand(45,70), start: S.gameMinutes, chainedFrom: room};
          addLog('🔥 Sự cố dây chuyền! '+ROOM_DEF[room].name+' quá tải và lan sự cố sang '+ROOM_DEF[spread].name+'!', 'danger');
          markActionDirty();
        }
      }
    }
  }
}

/* ============== NPC: GẶP GỠ & TƯƠNG TÁC ============== */
function getRoomNPCs(room){
  if(!S || !S.running) return [];
  return wanderingNPCs().filter(f=>S.npcRoom[f.id]===room).map(f=>
    Object.assign({ key:f.id, id:f.id, name:f.name.toUpperCase() }, NPC_META[f.id]));
}

function openNPCMenu(meta){
  const f = RPG.get(meta.id), me = RPG.player();
  const known = f.trust>=1 || S.scouted[f.id];
  const info = known
    ? `${RPG.CLASSES[f.classId].icon} ${RPG.CLASSES[f.classId].name} · Lv${f.level}`
    : '❓ Class và Lv chưa rõ (nói chuyện hoặc dùng Máy quay soi để biết)';
  const hearts = '♥'.repeat(f.trust)+'♡'.repeat(Math.max(0,RPG.CFG.TRUST_MAX-f.trust));
  const body = `<p style="font-size:13px;"><b>${f.name}</b><br><span style="color:var(--text-dim);font-size:12px;">${f.title}</span></p>
    <p style="font-size:12px;">${info}<br>Tin tưởng: <span style="color:var(--amber);">${hearts}</span></p>`;
  const rc = RPG.canRecruit(f);
  const recruitLabel = rc.ok ? '🤝 Mời vào đội'
    : rc.reason==='trust' ? '🤝 Mời vào đội (cần Tin tưởng '+RPG.CFG.RECRUIT_TRUST+')'
    : rc.reason==='full' ? '🤝 Đội đã đầy' : '🤝 Đã trong đội';
  showModal('💬 '+f.name, body, [
    { label: S.talked[f.id] ? '💬 Nói chuyện (hôm nay đã nói)' : '💬 Nói chuyện', primary:true, disabled:!!S.talked[f.id],
      onClick:()=> npcTalk(f) },
    { label: S.duelDone[f.id] ? '⚔ Khiêu chiến (hôm nay đã đấu)' : '⚔ Khiêu chiến', danger:true, disabled:!!S.duelDone[f.id],
      onClick:()=> npcChallenge(f) },
    { label: recruitLabel, disabled:!rc.ok, onClick:()=> npcRecruit(f) },
    { label:'Rời đi', onClick:()=>closeModal() }
  ]);
}
function npcTalk(f){
  closeModal(true);
  const trust = RPG.talk(f);
  S.talked[f.id] = true;
  const lines = DLG.TALK[f.id][Math.min(3, trust)];
  addLog('💬 Bạn nói chuyện với '+f.name+' (Tin tưởng '+trust+'/'+RPG.CFG.TRUST_MAX+').', '');
  playDLG(lines, ()=>{ markActionDirty(); refreshAll(); });
}
function npcRecruit(f){
  closeModal(true);
  const r = RPG.recruit(f);
  if(r.ok){
    addLog('🤝 '+f.name+' gia nhập đội hình của bạn!', 'good');
    playDLG(DLG.RECRUIT[f.id], ()=>{ markActionDirty(); refreshAll(); });
  } else {
    playDLG(DLG.RECRUIT_REFUSE[f.id], ()=>refreshAll());
  }
}
function npcChallenge(f){
  closeModal(true);
  playDLG(DLG.CHALLENGE[f.id], ()=>{
    startBattle({ enemyIds:[f.id], final:false });
  });
}


/* ============== TICK LOOP (thời gian thực) ============== */
let rafId = null;
let lastActionRebuild = 0;
function tick(now){
  if(S && S.running && !S.paused){
    const dtReal = Math.min(1000, now - S.lastTick);
    S.lastTick = now;
    const dGameMin = dtReal / realMsPerGameMin();
    if(dGameMin>0){
      S.gameMinutes += dGameMin;
      advanceWorld(dGameMin);
      if(S && S.running){
        checkEncounter();
        refreshHud();
        refreshMap();
        const sig = getRoomNPCs(S.playerRoom).map(n=>n.id).join(',');
        if(sig !== lastNpcSig){ lastNpcSig = sig; actionPaneDirty = true; }
        if(actionPaneDirty){
          refreshActionPane();
          actionPaneDirty = false;
          lastActionRebuild = now;
        } else if(now - lastActionRebuild > 1000){
          updateRoomDescOnly();
          lastActionRebuild = now;
        }
      }
    }
  } else if(S){
    S.lastTick = now;
  }
  rafId = requestAnimationFrame(tick);
}

/* ============== JUMPSCARE: THE TIU TÓM ĐƯỢC BẠN (-ĐRL) ============== */
function jumpscare(){
  const me = RPG.player();
  const lost = RPG.tiuPenalty(me);
  markActionDirty();
  S.paused = true; // đóng băng thế giới trong lúc màn jumpscare đang hiện
  S.invulnUntil = S.gameMinutes + rand(15,20);
  const caughtRoom = S.playerRoom;
  const others = ROOM_KEYS.filter(r=>r!==S.playerRoom && !isRoomSafe(r));
  S.monsterRoom = pick(others.length ? others : ROOM_KEYS.filter(r=>r!==S.playerRoom));

  if(SETTINGS.flash){
    const fl = $('flash'); fl.classList.remove('flash-on'); void fl.offsetWidth; fl.classList.add('flash-on');
  }
  if(SETTINGS.shake){
    const ap = $('app'); ap.classList.remove('shake'); void ap.offsetWidth; ap.classList.add('shake');
  }
  addLog('JUMPSCARE! The TIU đã tóm được bạn tại '+ROOM_DEF[caughtRoom].name+'! −'+lost+' ĐRL.','danger');

  const js = $('jumpscareOverlay'), jsMonster = $('jsMonster'), jsPanel = $('jsPanel');
  const jsContinueBtn = $('jsContinueBtn'), jsGiveUpBtn = $('jsGiveUpBtn'), sfx = $('jumpscareSfxAudio');
  jsMonster.style.backgroundImage = TIU_IMAGE ? `url('${TIU_IMAGE}')` : '';
  jsMonster.classList.toggle('no-img', !TIU_IMAGE);
  jsPanel.classList.remove('show');
  $('jsPanelText').innerHTML = 'THE TIU ĐÃ TÓM ĐƯỢC BẠN!<span class="jsPanelSub">−'+lost+' ĐRL (còn '+me.drl+') — vừa xảy ra tại '+ROOM_DEF[caughtRoom].name+'</span>';
  jsContinueBtn.textContent = 'TIẾP TỤC';
  jsGiveUpBtn.classList.remove('hidden');

  js.classList.remove('hidden');
  js.classList.remove('active','lunge'); void js.offsetWidth;
  js.classList.add('active','lunge'); // TIU phóng to rồi lao ra khỏi màn hình

  if(TIU_JUMPSCARE_SFX){
    try{
      sfx.src = TIU_JUMPSCARE_SFX;
      sfx.volume = (window.UIT_SOUND_MUTED?0:1) * (SETTINGS.masterVolume/100);
      sfx.currentTime = 0;
      sfx.play().catch(()=>{});
    }catch(e){}
  }
  setTimeout(()=>{ jsPanel.classList.add('show'); }, 900);

  function closeJumpscare(){
    js.classList.add('hidden');
    js.classList.remove('active','lunge');
    jsPanel.classList.remove('show');
    jsContinueBtn.onclick = null;
    jsGiveUpBtn.onclick = null;
  }
  jsContinueBtn.onclick = ()=>{
    closeJumpscare();
    S.paused = false;
    S.lastTick = performance.now();
    refreshAll();
  };
  jsGiveUpBtn.onclick = ()=>{
    closeJumpscare();
    persistSave();
    S.running = false;
    showTitle();
  };
}

/* ============== BATTLE UI — kiểu Pokemon (dùng RPGCombat) ==============
   Bố cục: sân đấu phía trên (đối thủ trên-phải, phe mình dưới-trái, hộp thông tin HP kiểu Pokemon),
   phía dưới là hộp thoại gõ chữ dần (trái) + menu 2x2 (phải): CHIẾN ĐẤU / TÚI ĐỒ / PHÒNG THỦ / ULTIMATE.
   Mỗi trận tốn RPG.CFG.BATTLE_MINUTES (60 phút) đồng hồ game và HP được giữ lại sau trận. */
const STATUS_ICON = { burn:'🔥', poison:'☠️', freeze:'❄️', paralyze:'⚡', stun:'💫', stealth:'👁️', immune:'🛡️', reflect:'🔁' };
const SUMMON_GLYPH = { sword:'🗡️', guard:'🛡️', swordsman:'⚔️' };
const TARGET_LABEL = { self:'Bản thân', single:'1 mục tiêu', aoe:'Toàn bộ địch', summon:'Triệu hồi', none:'' };

function unitLook(u){
  if(u.isSummon) return { glyph:SUMMON_GLYPH[u.kind] || '✦', bg:'#4a3a8a' };
  if(u.f.isPlayer) return { glyph:RPG.CLASSES[u.f.classId].icon, bg:'#2a5a8a' };
  const m = NPC_META[u.f.id];
  return { glyph: m ? m.avatarText : RPG.CLASSES[u.f.classId].icon, bg: m ? m.avatarBg : '#555' };
}
function hpClass(p){ return p>50 ? '' : (p>20 ? 'mid' : 'low'); }

function startBattle(opts){
  const me = RPG.player();
  const allies = [me].concat(opts.final ? [] : RPG.partyAllies());
  const enemies = opts.enemyIds.map(id=>RPG.get(id));
  const B = RPGCombat.create({ allies, enemies, dodge:!!opts.final, controlAllies:false });
  // Bẫy gài đã trúng: -HP và mất lượt đầu
  enemies.forEach(f=>{
    const d = S.npcDebuff && S.npcDebuff[f.id];
    if(!d) return;
    const u = B.units.find(x=>x.f===f);
    u.hp = Math.max(1, u.hp - Math.round(u.maxHp*d.hpPct));
    if(d.skipFirst) u.st.stun = { turns:1, fresh:false };
    delete S.npcDebuff[f.id];
  });
  BATTLE = { B, opts, gen:null, pending:[], closed:false, disp:{}, sprites:{}, boxes:{}, fast:false, say:null, sayTimer:null };
  B.units.forEach(u=>{ BATTLE.disp[u.uid] = u.hp; });
  S.paused = true;
  $('mgModal').classList.add('hidden');
  $('battleOverlay').classList.remove('hidden');
  $('pkEnemySprites').innerHTML = ''; $('pkAllySprites').innerHTML = '';
  $('pkEnemyInfo').innerHTML = ''; $('pkAllyInfo').innerHTML = '';
  $('pkMenu').innerHTML = ''; $('pkText').textContent = '';
  $('pkFast').classList.remove('on');
  const img = ROOM_IMAGES[S.playerRoom];
  $('battleBg').style.backgroundImage = img ? `url('${img}')` : '';
  renderBattle();
  const foe = enemies[0];
  pkSay(opts.final ? '★ TRẬN QUYẾT ĐỊNH! '+foe.name+' chặn đường bạn!' : foe.name+' muốn đấu với bạn!', battleNextRound);
}

/* ---- Hộp thoại gõ chữ dần. Bấm vào hộp để gõ nhanh / sang câu tiếp ---- */
function pkSay(text, done){
  const el = $('pkText'), bt = BATTLE;
  if(!bt) return;
  clearTimeout(bt.sayTimer);
  $('pkMenu').dataset.mode = 'say';
  $('pkMenu').innerHTML = '';
  el.textContent = '';
  const cur = { text, done, typing:true };
  bt.say = cur;
  let i = 0;
  const advance = ()=>{
    if(bt.say !== cur) return;
    bt.say = null; clearTimeout(bt.sayTimer);
    $('pkArrow').classList.remove('on');
    if(cur.done) cur.done();
  };
  const finishTyping = ()=>{
    cur.typing = false;
    el.textContent = text;
    $('pkArrow').classList.add('on');
    clearTimeout(bt.sayTimer);
    bt.sayTimer = setTimeout(advance, bt.fast ? 90 : 650);
  };
  cur.advance = advance; cur.finishTyping = finishTyping;
  const typeNext = ()=>{
    if(bt.closed || bt.say !== cur) return;
    i++;
    el.textContent = text.slice(0, i);
    if(i < text.length) bt.sayTimer = setTimeout(typeNext, bt.fast ? 2 : 15);
    else finishTyping();
  };
  typeNext();
}
function pkPrompt(text){            // dòng nhắc (không gõ chữ, không tự chuyển)
  if(BATTLE){ clearTimeout(BATTLE.sayTimer); BATTLE.say = null; }
  $('pkArrow').classList.remove('on');
  $('pkText').textContent = text;
}
$('pkTextBox').onclick = ()=>{
  const s = BATTLE && BATTLE.say;
  if(!s) return;
  if(s.typing){ s.finishTyping(); }
  else { s.advance(); }
};
$('pkFast').onclick = ()=>{
  if(!BATTLE) return;
  BATTLE.fast = !BATTLE.fast;
  $('pkFast').classList.toggle('on', BATTLE.fast);
  const s = BATTLE.say;
  if(s && s.typing) s.finishTyping();
};

/* ---- Sân đấu: sprite + hộp thông tin HP ---- */
function ensureUnitView(u){
  const bt = BATTLE;
  if(bt.sprites[u.uid]) return;
  const enemy = u.side==='E';
  const look = unitLook(u);
  const spr = document.createElement('div');
  spr.className = 'pkSpr '+(enemy?'enemy':'ally')+(u.isSummon?' summon':'')+' enter';
  spr.style.setProperty('--c', look.bg);
  spr.innerHTML = `<span class="glyph">${look.glyph}</span>`;
  $(enemy ? 'pkEnemySprites' : 'pkAllySprites').appendChild(spr);
  bt.sprites[u.uid] = spr;
  const box = document.createElement('div');
  box.className = 'pkBox'+(u.isSummon?' small':'')+(enemy?' enemy':' ally');
  const cdef = u.isSummon ? null : RPG.CLASSES[u.f.classId];
  const showExp = !u.isSummon && u.f.isPlayer;
  box.innerHTML = `<div class="pkRow1"><span class="pkName">${u.isSummon ? u.name : cdef.icon+' '+u.name}</span><span class="pkLv"></span></div>
    <div class="pkHpRow"><span class="pkHpLbl">HP</span><div class="pkTrack"><div class="pkHpFill"></div></div></div>
    <div class="pkNum"></div>
    ${u.isSummon && !u.hasRage ? '' : '<div class="pkRageRow"><span class="pkMini">NỘ</span><div class="pkTrack thin"><div class="pkRageFill"></div></div></div>'}
    ${showExp ? '<div class="pkRageRow"><span class="pkMini">EXP</span><div class="pkTrack thin"><div class="pkExpFill"></div></div></div>' : ''}
    <div class="pkSt"></div>`;
  $(enemy ? 'pkEnemyInfo' : 'pkAllyInfo').appendChild(box);
  bt.boxes[u.uid] = box;
  setTimeout(()=>spr.classList.remove('enter'), 450);
}
function updateUnitView(u){
  const bt = BATTLE, box = bt.boxes[u.uid], spr = bt.sprites[u.uid];
  if(!box) return;
  const hp = Math.max(0, bt.disp[u.uid] != null ? bt.disp[u.uid] : u.hp);
  const p = Math.round(hp/Math.max(1,u.maxHp)*100);
  const fill = box.querySelector('.pkHpFill');
  fill.style.width = p+'%';
  fill.className = 'pkHpFill '+hpClass(p);
  const lv = box.querySelector('.pkLv');
  if(lv) lv.textContent = u.isSummon ? '' : 'Lv'+u.f.level;
  box.querySelector('.pkNum').textContent = (u.side==='A' || u.isSummon) ? hp+'/'+u.maxHp : '';
  const rf = box.querySelector('.pkRageFill');
  if(rf) rf.style.width = Math.round(u.rage/RPG.CFG.RAGE_MAX*100)+'%';
  const ef = box.querySelector('.pkExpFill');
  if(ef){
    const f = u.f, lo = RPG.CFG.EXP_TABLE[f.level];
    const hi = f.level>=RPG.CFG.MAX_LEVEL ? lo : RPG.CFG.EXP_TABLE[f.level+1];
    ef.style.width = (hi>lo ? Math.round((f.exp-lo)/(hi-lo)*100) : 100)+'%';
  }
  const sts = Object.keys(u.st).map(k=>(STATUS_ICON[k]||'')+(k==='poison'?'x'+u.st.poison.stacks:'')).join(' ') + (u.spirit?' 🌪️':'') + (u.taunt?' 🎯':'');
  box.querySelector('.pkSt').textContent = sts;
  const gone = !u.alive;
  if(u.isSummon && gone){
    spr.classList.add('faint');
    setTimeout(()=>{ spr.remove(); box.remove(); }, 500);
    delete bt.sprites[u.uid]; delete bt.boxes[u.uid];
    return;
  }
  spr.classList.toggle('faint', gone && hp<=0);
  box.classList.toggle('dead', gone && hp<=0);
}
function renderBattle(){
  const bt = BATTLE;
  if(!bt) return;
  bt.B.units.forEach(u=>{ if(u.alive || !u.isSummon) ensureUnitView(u); });
  bt.B.units.forEach(u=>updateUnitView(u));
}
function snapDisp(){ BATTLE.B.units.forEach(u=>{ BATTLE.disp[u.uid] = u.hp; }); }
function sprFx(uid, cls, ms){
  const s = BATTLE && BATTLE.sprites[uid];
  if(!s) return;
  s.classList.remove(cls); void s.offsetWidth; s.classList.add(cls);
  setTimeout(()=>{ s && s.classList.remove(cls); }, ms || 520);
}
function applyEventFx(ev){
  const bt = BATTLE, D = bt.disp;
  if(ev.type==='attack' || ev.type==='cast'){
    const u = RPGCombat.unit(bt.B, ev.src);
    if(u) sprFx(ev.src, u.side==='A' ? 'lungeA' : 'lungeE', 420);
  } else if(ev.type==='damage'){
    if(D[ev.dst] != null) D[ev.dst] = Math.max(0, D[ev.dst] - ev.amount);
    sprFx(ev.dst, 'hit', 520);
  } else if(ev.type==='heal'){
    const u = RPGCombat.unit(bt.B, ev.dst);
    if(u && D[ev.dst] != null) D[ev.dst] = Math.min(u.maxHp, D[ev.dst] + ev.amount);
    sprFx(ev.dst, 'healfx', 600);
  } else if(ev.type==='death'){
    D[ev.dst] = 0;
  }
  renderBattle();
}

/* ---- Menu phía dưới (2 cột) ---- */
function pkMenuSet(mode, items){
  const m = $('pkMenu');
  m.innerHTML = '';
  m.dataset.mode = mode;
  items.forEach(it=>{
    const b = document.createElement('button');
    b.className = 'pkBtn'+(it.cls?' '+it.cls:'')+(it.span?' span2':'');
    b.innerHTML = `<span class="pkBtnLbl">${it.label}</span>`+(it.sub ? `<span class="pkBtnSub">${it.sub}</span>` : '');
    if(it.disabled) b.disabled = true;
    b.onclick = it.onClick;
    if(it.hint) b.onmouseenter = ()=>{ if(BATTLE && !BATTLE.say) $('pkText').textContent = it.hint; };
    if(it.hoverUid){
      b.onmouseenter = ()=>{ const s = BATTLE.sprites[it.hoverUid]; if(s) s.classList.add('targeted'); };
      b.onmouseleave = ()=>{ const s = BATTLE.sprites[it.hoverUid]; if(s) s.classList.remove('targeted'); };
    }
    m.appendChild(b);
  });
}
function clearTargeted(){ Object.keys(BATTLE.sprites).forEach(k=>BATTLE.sprites[k].classList.remove('targeted')); }

function battleNextRound(){
  const B = BATTLE.B;
  if(B.over){ battleFinish(); return; }
  const info = RPGCombat.beginRound(B);
  $('battleTurnNum').textContent = B.round;
  BATTLE.pending = info.pending.slice();
  snapDisp(); renderBattle();
  battlePromptNext();
}
function battlePromptNext(){
  if(!BATTLE.pending.length){ battleResolve(); return; }
  showBattleMenu(BATTLE.pending[0]);
}

function showBattleMenu(uid){
  const B = BATTLE.B, u = RPGCombat.unit(B, uid), op = RPGCombat.options(B, u);
  const ult = op.ultimate;
  pkPrompt(u.name+' sẽ làm gì?');
  pkMenuSet('main', [
    { label:'CHIẾN ĐẤU', hint:'Tấn công thường hoặc dùng kỹ năng.', onClick:()=>showFightMenu(uid) },
    { label:'TÚI ĐỒ', hint:'Dùng vật phẩm trong túi.', disabled:!op.items.length, onClick:()=>showBagMenu(uid) },
    { label:'PHÒNG THỦ', hint:'Giảm 50% sát thương nhận trong lượt này.', onClick:()=>commit(uid,{type:'defend'}) },
    { label:'ULTIMATE', cls:'ult', sub:ult.rage+'/'+ult.rageMax+' Nộ', hint:ult.name+': '+ult.desc, disabled:!ult.ready,
      onClick:()=>castWithQte(uid,'ultimate',ult) }
  ]);
}
function showFightMenu(uid){
  const B = BATTLE.B, u = RPGCombat.unit(B, uid), op = RPGCombat.options(B, u);
  pkPrompt('Chọn đòn đánh.');
  const items = [{ label:'Tấn công', sub:'Thường · +'+RPG.CFG.RAGE_ON_ATTACK+' Nộ', hint:'Đòn đánh thường lên 1 mục tiêu.',
                   onClick:()=>pickTarget(u,'single',t=>commit(uid,{type:'attack',target:t}),()=>showFightMenu(uid)) }];
  op.skills.forEach(s=>{
    items.push({ label:s.name,
      sub: s.unlocked ? ((TARGET_LABEL[s.target]||'')+(s.cd>0?' · hồi '+s.cd:'')) : 'Mở ở Lv'+s.lvl,
      hint:s.desc, disabled:!s.ready,
      onClick:()=>castWithQte(uid,'skill',s) });
  });
  items.push({ label:'◀ Quay lại', span:true, onClick:()=>showBattleMenu(uid) });
  pkMenuSet('fight', items);
}
function showBagMenu(uid){
  const B = BATTLE.B, u = RPGCombat.unit(B, uid), op = RPGCombat.options(B, u);
  pkPrompt('Dùng vật phẩm nào?');
  const items = op.items.map(it=>({ label:it.icon+' '+it.name, sub:'x'+it.count, hint:it.desc,
    onClick:()=>pickTarget(u, it.target==='enemy'?'single':'none', t=>commit(uid,{type:'item',id:it.id,target:t}), ()=>showBagMenu(uid)) }));
  items.push({ label:'◀ Quay lại', span:true, onClick:()=>showBattleMenu(uid) });
  pkMenuSet('bag', items);
}
function pickTarget(u, kind, cb, back){
  if(kind!=='single'){ cb(null); return; }
  const legal = RPGCombat.legalTargets(BATTLE.B, u, false);
  if(legal.length<=1){ cb(legal[0] ? legal[0].uid : null); return; }
  pkPrompt('Chọn mục tiêu.');
  const items = legal.map(t=>({ label:t.name, sub:'HP '+t.hp+'/'+t.maxHp, hoverUid:t.uid,
    onClick:()=>{ clearTargeted(); cb(t.uid); } }));
  items.push({ label:'◀ Quay lại', span:true, onClick:()=>{ clearTargeted(); back ? back() : showBattleMenu(u.uid); } });
  pkMenuSet('target', items);
}

/* Skill/Ultimate: chạy QTE mũi tên rồi mới nộp lệnh (quality = độ chính xác 0..1) */
function castWithQte(uid, type, def){
  const u = RPGCombat.unit(BATTLE.B, uid);
  pickTarget(u, def.target==='single' ? 'single' : 'none', tgt=>{
    $('pkMenu').innerHTML = '';
    pkPrompt(u.name+' tập trung niệm chiêu...');
    const count = (QTE_COUNT[u.f.classId] || 3) + (type==='ultimate' ? 2 : 0);
    runArrowQte({
      mode:'attack',
      title:'✦ '+def.name.toUpperCase()+' — '+count+' MŨI TÊN',
      subtitle:u.name+' niệm chiêu: bấm đúng chuỗi mũi tên! Dưới 40% chính xác, kỹ năng thất bại.',
      count, windowMs: 1500-(count-3)*60, feintChance:0, parryWidth:0.5, shake:0, drift:0,
      onDone:(r)=>commit(uid, {type, id:def.id, target:tgt, quality:r.accuracy})
    });
  }, ()=>showFightMenu(uid));
}
function commit(uid, action){
  const r = RPGCombat.submit(BATTLE.B, uid, action);
  if(!r.ok){
    pkSay('Không thể thực hiện ('+r.reason+').', ()=>showBattleMenu(uid));
    return;
  }
  BATTLE.pending.shift();
  battlePromptNext();
}

/* Phòng thủ bằng QTE (chỉ trận cuối, khi engine yêu cầu 'dodgeRequest') */
function runDefendQte(req, cb){
  const B = BATTLE.B, src = RPGCombat.unit(B, req.src);
  const complexity = clamp(1 + Math.floor(Math.random()*3) + Math.floor(B.round/4), 1, 5);
  const difficulty = clamp((B.round-1)*0.04 + (complexity-1)*0.08, 0, 1);
  $('pkMenu').innerHTML = '';
  runArrowQte({
    mode:'defend',
    title:'⚠ '+src.name+' RA ĐÒN — '+complexity+' MŨI TÊN',
    subtitle:'Bấm đúng hướng để ĐỠ 50%; bấm trong vùng sáng để PARRY (đỡ 100%)!',
    count:complexity, windowMs:clamp(1500-Math.round(difficulty*420),700,1700), feintChance:0.1,
    parryWidth:0.34-difficulty*0.2, shake:Math.round(difficulty*8),
    drift: difficulty>0.35 ? (difficulty-0.35)*0.5 : 0,
    onDone:(r)=>{
      const mult = clamp(1 - (r.perfect + 0.5*r.blocked)/r.total, 0, 1);
      pkSay('Phòng thủ: '+r.perfect+' parry, '+r.blocked+' đỡ, '+r.hits+' trúng → nhận '+Math.round(mult*100)+'% sát thương.', ()=>cb(mult));
    }
  });
}

function battleResolve(){
  $('pkMenu').innerHTML = '';
  BATTLE.gen = RPGCombat.roundGen(BATTLE.B);
  battleStep();
}
function battleStep(val){
  const r = BATTLE.gen.next(val);
  if(r.done){
    snapDisp(); renderBattle();
    setTimeout(battleNextRound, BATTLE.fast ? 60 : 250);
    return;
  }
  const ev = r.value;
  if(ev.type==='dodgeRequest'){ runDefendQte(ev, mult=>battleStep(mult)); return; }
  if(ev.type==='round'){ $('battleTurnNum').textContent = ev.round; battleStep(); return; }
  applyEventFx(ev);
  pkSay(ev.msg, ()=>battleStep());
}

/* ---- Hết trận: tổng kết, HP được lưu, tốn 1 giờ đồng hồ game ---- */
function spendTime(minutes, label){
  const from = S.gameMinutes;
  S.gameMinutes += minutes;
  addLog('⏳ '+label+' ('+formatClock(from)+' → '+formatClock(S.gameMinutes)+').', '');
  advanceWorld(minutes);
  if(S.running) S.invulnUntil = Math.max(S.invulnUntil, S.gameMinutes + 10); // không bị TIU bắt ngay sau khi xong
  markActionDirty();
}

function battleFinish(){
  const B = BATTLE.B, opts = BATTLE.opts;
  const sum = RPGCombat.settle(B);
  opts.enemyIds.forEach(id=>{ S.duelDone[id] = true; });
  const won = sum.winner==='A';
  const pointsGain = won ? POINTS_PER_WIN*opts.enemyIds.length : 0;
  S.points += pointsGain;
  BATTLE.closed = true;
  clearTimeout(BATTLE.sayTimer);
  $('battleOverlay').classList.add('hidden');

  const me = RPG.player();
  let html = '';
  sum.duels.forEach(d=>{
    const foe = RPG.get(won ? d.loserId : d.winnerId);
    html += `<p><b>${won ? '+' : '−'}${d.drl} ĐRL</b> ${won ? 'cướp từ' : 'bị cướp bởi'} ${foe.name}.</p>`;
    if(won){
      html += `<p>+${d.exp.gained} EXP`+(d.loot?` · cướp được ${RPG.ITEMS[d.loot].icon} ${RPG.ITEMS[d.loot].name}`:'')+`</p>`;
      d.exp.unlocked.forEach(u=>{ html += `<p style="color:var(--amber);">✦ LÊN CẤP Lv${u.lvl}: mở ${u.isUltimate?'ULTIMATE':'kỹ năng'} "${u.name}"!</p>`; });
      if(d.exp.levelsGained.length && !d.exp.unlocked.length) html += `<p style="color:var(--amber);">✦ LÊN CẤP Lv${me.level}: chỉ số tăng 10%!</p>`;
    }
  });
  sum.allyExp.forEach(a=>{ if(a.exp.gained) html += `<p style="font-size:12px;color:var(--text-dim);">${RPG.get(a.id).name}: +${a.exp.gained} EXP</p>`; });
  if(pointsGain) html += `<p>+${pointsGain} điểm mua đồ.</p>`;
  html += `<p style="color:var(--text-dim);font-size:12px;">ĐRL: <b>${me.drl}</b> · HP còn lại: <b>${me.hp}/${me.maxHp}</b> (được giữ cho trận sau)</p>`;
  if(!opts.final) html += `<p style="color:var(--text-dim);font-size:12px;">⏳ Trận đấu kéo dài ${RPG.CFG.BATTLE_MINUTES} phút (${formatClock(S.gameMinutes)} → ${formatClock(S.gameMinutes+RPG.CFG.BATTLE_MINUTES)}).</p>`;

  const afterLines = opts.final ? null : (won ? DLG.AFTER_WIN : DLG.AFTER_LOSE)[opts.enemyIds[0]];
  showModal(won ? '★ CHIẾN THẮNG!' : '✖ THẤT BẠI', html, [{ label:'Tiếp tục', primary:true, onClick:()=>{
    closeModal(true);
    const proceed = ()=>{
      if(opts.final){ endFinal(won); return; }
      BATTLE = null;
      S.paused = false; S.lastTick = performance.now();
      spendTime(RPG.CFG.BATTLE_MINUTES, 'Trận đấu kéo dài '+RPG.CFG.BATTLE_MINUTES+' phút');
      if(S.running) refreshAll();
    };
    if(afterLines) playDLG(afterLines, proceed); else proceed();
  }}]);
}


/* ============== KẾT THÚC ĐÊM / CHƯƠNG / GAME ============== */
function showGameOver(title, sub, retryLabel){
  S.running = false;
  document.querySelector('#gameOverScreen h1').textContent = title;
  $('goSub').textContent = sub;
  $('retryBtn').textContent = retryLabel || 'THỬ LẠI ĐÊM NÀY';
  $('gameOverScreen').classList.remove('hidden');
}
function showWinScreen(title, sub, btnLabel, onBtn){
  S.running = false;
  $('winTitle').textContent = title;
  $('winSub').textContent = sub;
  const b = $('nextNightBtn');
  b.textContent = btnLabel;
  b.classList.toggle('hidden', !onBtn);
  b.onclick = ()=>{ $('winScreen').classList.add('hidden'); onBtn && onBtn(); };
  $('winScreen').classList.remove('hidden');
}

function endNight(){
  if(!S.running) return;
  S.running = false;
  if(S.chapter===1){
    const sims = RPG.simulateNpcNight();
    const out = RPG.eliminateLowest();
    let sub = 'Kết thúc '+nightName(1,S.night)+'. ';
    if(sims.length){
      sub += sims.map(d=>RPG.get(d.winnerId).name+' đánh bại '+RPG.get(d.loserId).name).join('; ')+'. ';
    }
    if(out){
      sub += out.eliminated.name+' có ĐRL thấp nhất ('+out.eliminated.drl+') và bị loại. ';
      if(out.playerEliminated){
        showGameOver('BẠN ĐÃ BỊ LOẠI', sub+'Bạn có ĐRL thấp nhất đêm nay.', 'THỬ LẠI ĐÊM NÀY');
        return;
      }
    }
    sub += 'Còn lại '+RPG.aliveFighters().length+' người.';
    if(S.night<3){
      showWinScreen('QUA ĐÊM '+S.night, sub, 'ĐÊM TIẾP THEO', ()=>beginNight(1, S.night+1, {points:S.points}));
    } else {
      showWinScreen('HẾT CHAPTER 1', sub, 'SANG CHAPTER 2', ()=>beginChapter2());
    }
  } else {
    showWinScreen('QUA ĐÊM CHUẨN BỊ', 'Đại chiến bắt đầu. Chúc may mắn!', 'VÀO TRẬN CUỐI', ()=>beginNight(2, 2, {points:S.points}));
  }
}

function beginChapter2(){
  // Đồng đội còn sống phản bội: chỉ còn 1 suất tốt nghiệp
  const allies = RPG.partyAllies();
  allies.forEach(a=>RPG.dismiss(a));
  const finish = ()=>beginNight(2, 1, {points:S.points});
  if(allies.length) playDLG(DLG.BETRAY, ()=>playDLG(DLG.INTRO_CH2, finish));
  else playDLG(DLG.INTRO_CH2, finish);
}

function startFinalBattle(){
  const foe = RPG.aliveFighters().find(f=>!f.isPlayer);
  if(!foe){ endFinal(true); return; }
  playDLG(DLG.INTRO_CH2_FINAL, ()=>startBattle({ enemyIds:[foe.id], final:true }));
}
function endFinal(won){
  BATTLE = null;
  if(won){
    const me = RPG.player();
    playDLG(DLG.WIN_FINAL, ()=>{
      showWinScreen('TỐT NGHIỆP LOẠI GIỎI', me.name+' đã trụ lại cuối cùng với '+me.drl+' ĐRL (Lv'+me.level+'). Chúc mừng!', null, null);
    });
  } else {
    showGameOver('BẠN ĐÃ THUA CHUNG CUỘC', 'Suất tốt nghiệp loại Giỏi thuộc về người khác.', 'THỬ LẠI TRẬN CUỐI');
  }
}

/* ============== FLOW ============== */
function refreshAll(){
  if(!S) return;
  refreshHud(); refreshMap(); refreshActionPane();
}
function beginNight(chapter, night, opts){
  opts = opts || {};
  S = freshState(night, chapter, { points: opts.points });
  if(RPG.getState()) RPG.healAll();   // nghỉ ngơi qua ngày: HP hồi đầy khi bắt đầu đêm mới
  addLog('Ca đêm '+nightName(chapter,night)+' bắt đầu lúc '+formatClock(0)+'. Bạn xuất phát tại '+ROOM_DEF[S.playerRoom].name+'.', '');
  buildMap();
  refreshAll();
  hideAllOverlays();
  $('pauseMenu').classList.add('hidden');
  $('battleOverlay').classList.add('hidden');
  $('mgModal').classList.add('hidden');
  BATTLE = null;
  refreshBagBadge();
  saveCheckpoint();
  persistSave();
  if(chapter===1){
    const lines = night===1 ? DLG.INTRO_CH1 : DLG.INTRO_CH1_NIGHT[night];
    if(lines) playDLG(lines, ()=>{ S.lastTick = performance.now(); });
  } else if(chapter===2 && night===2){
    S.tiuOn = false; S.final = true;
    startFinalBattle();
  }
}
function hideAllOverlays(){
  ['titleScreen','settingsScreen','gameOverScreen','winScreen'].forEach(id=>{
    const el = $(id); if(el) el.classList.add('hidden');
  });
}
function showTitle(){
  hideAllOverlays();
  $('mgModal').classList.add('hidden');
  $('titleScreen').classList.remove('hidden');
  refreshContinueBtn();
}
function refreshContinueBtn(){
  const btn = $('continueBtn');
  if(btn) btn.classList.toggle('hidden', !hasSaveGame());
}

/* ============== GAME MỚI: TÊN + TRẮC NGHIỆM CHỌN CLASS ============== */
function startNewGame(){
  hideAllOverlays();
  S = null;
  showModal('NHẬP TÊN', `<p style="font-size:12px;color:var(--text-dim);">Để trống sẽ dùng tên mặc định.</p>
    <input id="playerNameInput" type="text" maxlength="24" placeholder="${RPG.DEFAULT_PLAYER_NAME}" style="width:100%;padding:8px;font-size:15px;background:#111;color:#eee;border:1px solid #555;border-radius:4px;">`,
    [{ label:'Tiếp tục', primary:true, onClick:()=>{
        const name = ($('playerNameInput').value||'').trim();
        runClassQuiz(name);
      }},
     { label:'Quay lại', onClick:()=>{ closeModal(); showTitle(); } }]);
  setTimeout(()=>{ const i = $('playerNameInput'); if(i) i.focus(); }, 50);
}
function runClassQuiz(name){
  const answers = [];
  function ask(i){
    if(i>=RPG.CLASS_QUIZ.length){ showClassResult(name, RPG.scoreQuiz(answers)); return; }
    const q = RPG.CLASS_QUIZ[i];
    showModal('TRẮC NGHIỆM '+(i+1)+'/'+RPG.CLASS_QUIZ.length, `<p style="font-size:14px;">${q.q}</p>`,
      shuffle(q.a.slice()).map(opt=>({ label:opt.t, onClick:()=>{ answers.push(opt.c); ask(i+1); } })));
  }
  ask(0);
}
function showClassResult(name, classId){
  const c = RPG.CLASSES[classId];
  const skills = c.skills.map(s=>`<li>Lv${s.lvl} — <b>${s.name}</b>: ${s.desc}</li>`).join('');
  showModal('CLASS CỦA BẠN: '+c.icon+' '+c.name.toUpperCase(),
    `<p style="font-size:12px;">HP ${c.base.hp} · ATK ${c.base.atk} · DEF ${c.base.def} · SPD ${c.base.spd}</p>
     <ul style="font-size:12px;line-height:1.5;padding-left:18px;">${skills}<li>Ultimate (dùng được từ Lv1, cần đầy Nộ) — <b>${c.ultimate.name}</b>: ${c.ultimate.desc}</li></ul>`,
    [{ label:'BẮT ĐẦU', primary:true, onClick:()=>{
        closeModal(true);
        RPG.init({ playerName:name, playerClass:classId });
        beginNight(1, 1, {});
      }}]);
}

/* ============== CÀI ĐẶT ============== */
function buildSettings(){
  const wrap = $('settingsWrap');
  wrap.innerHTML = '';
  const volRow = document.createElement('div');
  volRow.className = 'settingRow';
  volRow.innerHTML = `<div><div class="slabel">Âm lượng tổng</div><div class="sdesc">Chỉnh âm lượng chung của trò chơi.</div></div>
    <div class="volRow">
      <input type="range" class="volSlider" id="masterVolumeSlider" min="0" max="100" value="${SETTINGS.masterVolume}">
      <span class="volVal" id="masterVolumeVal">${SETTINGS.masterVolume}%</span>
    </div>`;
  wrap.appendChild(volRow);
  const volSlider = volRow.querySelector('#masterVolumeSlider');
  const volVal = volRow.querySelector('#masterVolumeVal');
  volSlider.oninput = ()=>{
    const v = parseInt(volSlider.value,10);
    SETTINGS.masterVolume = v;
    volVal.textContent = v+'%';
    try{ localStorage.setItem('uit_master_volume', String(v)); }catch(e){}
  };
  [
    {key:'shake', label:'Rung màn hình', desc:'Rung khi bị The TIU jumpscare.'},
    {key:'flash', label:'Hiệu ứng chớp đỏ', desc:'Chớp đỏ toàn màn hình khi bị bắt.'}
  ].forEach(r=>{
    const row = document.createElement('div');
    row.className = 'settingRow';
    row.innerHTML = `<div><div class="slabel">${r.label}</div><div class="sdesc">${r.desc}</div></div>
      <div class="toggle ${SETTINGS[r.key]?'on':''}"><div class="knob"></div></div>`;
    wrap.appendChild(row);
    row.querySelector('.toggle').onclick = ()=>{
      SETTINGS[r.key] = !SETTINGS[r.key];
      row.querySelector('.toggle').classList.toggle('on', SETTINGS[r.key]);
    };
  });
  buildSaveGameSection(wrap);
}

function buildSaveGameSection(wrap){
  const block = document.createElement('div');
  block.className = 'settingRow';
  block.style.flexDirection = 'column';
  block.style.alignItems = 'flex-start';
  block.style.gap = '10px';
  block.innerHTML = `
    <div><div class="slabel">💾 Lưu / Tải game</div>
      <div class="sdesc" id="saveStatusText">—</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn primary" id="saveGameBtn">Lưu game hiện tại</button>
      <button class="btn" id="loadGameBtn">Tải game đã lưu</button>
      <button class="btn danger" id="deleteSaveBtn">Xóa dữ liệu đã lưu</button>
    </div>`;
  wrap.appendChild(block);
  const statusEl = block.querySelector('#saveStatusText');
  const saveBtn = block.querySelector('#saveGameBtn');
  const loadBtn = block.querySelector('#loadGameBtn');
  const delBtn = block.querySelector('#deleteSaveBtn');
  function refresh(){
    saveBtn.disabled = !S || !S.running || isBattleActive();
    const data = readSaveGame();
    if(data){
      const d = new Date(data.savedAt);
      statusEl.textContent = 'Đã lưu lúc '+d.toLocaleString('vi-VN')+' — Chapter '+data.state.chapter+', '+nightName(data.state.chapter,data.state.night)+'.';
      loadBtn.disabled = false; delBtn.disabled = false;
    } else {
      statusEl.textContent = 'Chưa có dữ liệu đã lưu.';
      loadBtn.disabled = true; delBtn.disabled = true;
    }
  }
  refresh();
  saveBtn.onclick = ()=>{
    if(!S || !S.running) return;
    persistSave();
    addLog('💾 Đã lưu tiến trình game.', '');
    refresh();
  };
  loadBtn.onclick = ()=>{ if(loadGame()) return; refresh(); };
  delBtn.onclick = ()=>{ deleteSaveGame(); refresh(); refreshContinueBtn(); };
}

let settingsOrigin = 'title';
$('startBtn').onclick = startNewGame;
$('settingsBtn').onclick = ()=>{
  settingsOrigin = 'title';
  hideAllOverlays(); buildSettings();
  $('settingsScreen').classList.remove('hidden');
};
$('backFromSettings').onclick = ()=>{
  $('settingsScreen').classList.add('hidden');
  if(settingsOrigin==='pause') $('pauseMenu').classList.remove('hidden');
  else showTitle();
};
$('retryBtn').onclick = ()=>{
  $('gameOverScreen').classList.add('hidden');
  if(!loadCheckpoint()) showTitle();
};
$('menuFromGameOver').onclick = showTitle;
$('menuFromWin').onclick = showTitle;

/* ============== PAUSE MENU (ESC) ============== */
function isBlockingOverlayOpen(){
  return ['mgModal','mapModal','vnOverlay','jumpscareOverlay','gameOverScreen','winScreen','settingsScreen','battleOverlay','titleScreen']
    .some(id=>{ const el=$(id); return el && !el.classList.contains('hidden'); });
}
function openPauseMenu(){
  if(!S || !S.running) return;
  if(isBlockingOverlayOpen()) return;
  S.paused = true;
  $('pauseMenu').classList.remove('hidden');
}
function closePauseMenu(){
  $('pauseMenu').classList.add('hidden');
  if(!S) return;
  S.paused = false;
  S.lastTick = performance.now();
}
$('pauseResumeBtn').onclick = closePauseMenu;
$('pauseSettingsBtn').onclick = ()=>{
  $('pauseMenu').classList.add('hidden');
  settingsOrigin = 'pause';
  buildSettings();
  $('settingsScreen').classList.remove('hidden');
};
$('pauseMainMenuBtn').onclick = ()=>{
  $('pauseMenu').classList.add('hidden');
  persistSave();
  if(S) S.running = false;
  showTitle();
};
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  if(!S || !S.running) return;
  if(!$('pauseMenu').classList.contains('hidden')){
    e.preventDefault(); closePauseMenu();
  } else if(!isBlockingOverlayOpen()){
    e.preventDefault(); openPauseMenu();
  }
});

/* ============== PHÍM TẮT ==============
   J: tiếp tục hội thoại · Ctrl: bỏ qua hội thoại · B: túi đồ · M: bản đồ · E: tương tác */
function isVNOpen(){ return !document.getElementById('vnOverlay').classList.contains('hidden'); }
function isPauseMenuOpen(){ return !document.getElementById('pauseMenu').classList.contains('hidden'); }
function isTypingTarget(t){
  return !!t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.tagName==='SELECT' || t.isContentEditable);
}
function hudButtonUsable(id){
  const btn = document.getElementById(id);
  return !!btn && !btn.disabled && btn.getClientRects().length > 0; // getClientRects: đúng cả với phần tử position:fixed
}
document.addEventListener('keydown', (e)=>{
  if(isTypingTarget(e.target)) return;

  // Ctrl bấm riêng (không phải một phần của tổ hợp phím) -> skip hội thoại
  if(e.key === 'Control'){
    if(e.repeat) return;
    if(VN_ACTIVE && isVNOpen()) VN_ACTIVE.skip();
    return;
  }

  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.repeat) return;
  const k = (e.key || '').toLowerCase();

  if(k === 'j'){
    if(VN_ACTIVE && isVNOpen()){ e.preventDefault(); VN_ACTIVE.next(); }
    return;
  }

  if(k === 'b'){
    if(!S || !S.running || isPauseMenuOpen()) return;
    if(isBagOpen()){ e.preventDefault(); closeBagModal(); return; } // bấm B lần nữa để đóng
    if(isBlockingOverlayOpen() || !hudButtonUsable('bagBtn')) return;
    e.preventDefault();
    openBagModal();
    return;
  }

  if(k === 'm'){
    if(!S || !S.running || isPauseMenuOpen()) return;
    if(isMapOpen()){ e.preventDefault(); closeMapModal(); return; } // bấm M lần nữa để đóng
    if(isBlockingOverlayOpen() || !hudButtonUsable('miniMapExpand')) return;
    e.preventDefault();
    openMapModal();
    return;
  }
});

function isMapOpen(){
  return !document.getElementById('mapModal').classList.contains('hidden');
}
function openMapModal(){
  document.getElementById('mapModal').classList.remove('hidden');
  buildMap();
  refreshMap();
}
function closeMapModal(){
  document.getElementById('mapModal').classList.add('hidden');
}
document.getElementById('miniMapExpand').onclick = openMapModal;
document.getElementById('closeMapBtn').onclick = closeMapModal;

/* ============== sound toggle (HUD) ============== */
(function initSoundToggle(){
  const btn = document.getElementById('soundToggleBtn');
  const icon = document.getElementById('soundIcon');
  if(!btn || !icon) return;
  let muted = false;
  try{ muted = localStorage.getItem('uit_sound_muted') === '1'; }catch(e){}
  function apply(){
    btn.classList.toggle('muted', muted);
    btn.setAttribute('aria-pressed', String(muted));
    icon.textContent = muted ? '🔇' : '🔊';
    window.UIT_SOUND_MUTED = muted; // hook point for future SFX/music
  }
  apply();
  btn.onclick = ()=>{
    muted = !muted;
    try{ localStorage.setItem('uit_sound_muted', muted ? '1' : '0'); }catch(e){}
    apply();
  };
})();

/* Đã bỏ tính năng Rón Rén: xóa nút cũ (nếu HTML còn) để không còn nút vô dụng. */
(function removeSneakToggle(){
  const btn = document.getElementById('sneakToggleBtn');
  if(btn) btn.remove();
})();

/* ============== title screen rotating building carousel ============== */
(function initTitleCarousel(){
  const track = document.getElementById('carouselTrack');
  const label = document.getElementById('carouselLabel');
  if(!track || !label) return;
  const keys = Object.keys(ROOM_DEF);
  const slides = keys.map(k=>{
    const div = document.createElement('div');
    div.className = 'carouselSlide';
    const img = ROOM_IMAGES[k];
    div.style.backgroundImage = img ? `url('${img}')` : (ROOM_FALLBACK_GRADIENT[k] || '');
    track.appendChild(div);
    return {key:k, el:div};
  });
  if(!slides.length) return;
  let idx = 0;
  function show(i){
    slides.forEach((s,n)=>s.el.classList.toggle('active', n===i));
    label.textContent = ROOM_DEF[slides[i].key].name;
  }
  show(0);
  setInterval(()=>{ idx = (idx+1) % slides.length; show(idx); }, 3600);
})();

/* ============== NÚT TIẾP TỤC (title screen) ============== */
(function initContinueBtn(){
  const btn = $('continueBtn');
  if(!btn) return;
  btn.onclick = ()=>{ loadGame(); };
  refreshContinueBtn();
})();
/* ============== TÚI ĐỒ ============== */
(function initBagBtn(){
  const btn = document.getElementById('bagBtn');
  if(!btn) return;
  btn.onclick = openBagModal;
})();

/* ============== GỢI Ý PHÍM TẮT (tooltip) — không ghi đè title đã có sẵn trong HTML ============== */
(function initShortcutHints(){
  const hints = {
    bagBtn: 'Túi đồ [B]',
    miniMapExpand: 'Phóng to bản đồ [M]',
    closeMapBtn: 'Đóng bản đồ [M]',
    vnNextBtn: 'Tiếp tục [J] · Bỏ qua hội thoại [Ctrl]'
  };
  Object.keys(hints).forEach(id=>{
    const el = document.getElementById(id);
    if(el && !el.title) el.title = hints[id];
  });
})();

(function initHiddenStatsBtn(){
  const btn = document.getElementById('hiddenStatsBtn');
  const pop = document.getElementById('hiddenStatsPopover');
  if(!btn || !pop) return;
  btn.onclick = (e)=>{
    e.stopPropagation();
    if(pop.classList.contains('hidden')){
      refreshHiddenStats();
      pop.classList.remove('hidden');
    } else {
      pop.classList.add('hidden');
    }
  };
  document.addEventListener('click', (e)=>{
    if(!pop.classList.contains('hidden') && !pop.contains(e.target) && e.target!==btn){
      pop.classList.add('hidden');
    }
  });
})();

/* ============== MINIGAME SỰ CỐ ============== */
/* ============== MINIGAMES ============== */

/* ---- Áp lực thời gian thực trong lúc giải đố: hiệu ứng nhiễu sóng (glitch) hình ảnh +
   SFX dọa nạt xuất hiện bất chợt và ngẫu nhiên trong khi bộ đếm giờ đang chạy, dồn dập
   hơn ở các đêm sau. Chỉ là hiệu ứng — không trực tiếp trừ điểm/thời gian — nhưng khiến
   người chơi giật mình và dễ bấm nhầm hơn dưới áp lực. ---- */
let mgPressureHandle = null;
function startMinigamePressureFx(box){
  stopMinigamePressureFx();
  const nightFactor = Math.max(0, (S ? S.night-1 : 0)); // 0,1,2
  const minGap = Math.max(2000, 5200 - nightFactor*900);
  const maxGap = Math.max(minGap+700, 8000 - nightFactor*1100);
  const fire = ()=>{
    if(box.closest('#mgModal') && !document.getElementById('mgModal').classList.contains('hidden')){
      box.classList.remove('pressureGlitch'); void box.offsetWidth; box.classList.add('pressureGlitch');
      let staticEl = document.getElementById('mgStaticOverlay');
      if(!staticEl){
        staticEl = document.createElement('div');
        staticEl.id = 'mgStaticOverlay';
        box.appendChild(staticEl);
      }
      staticEl.classList.remove('show'); void staticEl.offsetWidth; staticEl.classList.add('show');
      if(TIU_JUMPSCARE_SFX){
        try{
          const sfx = document.getElementById('jumpscareSfxAudio');
          sfx.src = TIU_JUMPSCARE_SFX;
          sfx.currentTime = 0;
          sfx.volume = (window.UIT_SOUND_MUTED?0:1) * (SETTINGS.masterVolume/100) * 0.32;
          sfx.play().catch(()=>{});
        }catch(e){}
      }
    }
    mgPressureHandle = setTimeout(fire, rand(minGap, maxGap));
  };
  mgPressureHandle = setTimeout(fire, rand(minGap, maxGap));
}
function stopMinigamePressureFx(){
  if(mgPressureHandle){ clearTimeout(mgPressureHandle); mgPressureHandle=null; }
  const box = document.getElementById('mgBox');
  if(box) box.classList.remove('pressureGlitch');
  const staticEl = document.getElementById('mgStaticOverlay');
  if(staticEl) staticEl.classList.remove('show');
}

function startMinigame(room){
  const ev = ROOM_DEF[room].event;
  const isGridEvent = false;
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = isGridEvent
    ? '⚡ KHỞI ĐỘNG LẠI CẦU DAO TỔNG — '+ROOM_DEF[room].name
    : eventLabel(ev)+' — '+ROOM_DEF[room].name;
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  body.innerHTML=''; footer.innerHTML='';
  let timerEl = document.getElementById('mgTimer');
  let timeLeft, timerHandle;
  startMinigamePressureFx(document.getElementById('mgBox'));

  function finish(success){
    clearInterval(timerHandle);
    stopMinigamePressureFx();
    modal.classList.add('hidden');
    delete S.activeEvents[room];
    if(success){
      const gain = 10 + S.night*5;
      S.points += gain;
      addLog('Bạn đã xử lý xong sự cố tại '+ROOM_DEF[room].name+'. +'+gain+' điểm.','good');
    } else {
      addLog('Bạn thất bại ở sự cố tại '+ROOM_DEF[room].name+'!','warn');
      if(S.tiuOn && Math.random()<0.6) lureTIUNear(room);
    }
    markActionDirty();
    refreshAll();
  }

  function startTimer(seconds, onTimeout){
    timeLeft = seconds;
    timerEl.textContent = 'Thời gian còn lại: '+timeLeft+'s';
    timerHandle = setInterval(()=>{
      timeLeft--;
      timerEl.textContent = 'Thời gian còn lại: '+timeLeft+'s';
      if(timeLeft<=0){ clearInterval(timerHandle); onTimeout(); }
    },1000);
  }

  if(ev==='stage'){
    // spot the odd cell among grid within time
    let round=0, totalRounds=3, solved=0;
    function newRound(){
      body.innerHTML='<p style="font-size:12px;color:var(--text-dim);">Tìm vật thể bất thường trên sân khấu trước khi hết giờ!</p><div class="stageGrid"></div>';
      const grid = body.querySelector('.stageGrid');
      const oddIdx = Math.floor(Math.random()*20);
      for(let i=0;i<20;i++){
        const c=document.createElement('div');
        c.className='stageCell'+(i===oddIdx?' odd':'');
        c.textContent = i===oddIdx?'◆':'♦';
        c.onclick=()=>{
          if(i===oddIdx){ solved++; round++; if(round<totalRounds) newRound(); else finish(true); }
          else { finish(false); }
        };
        grid.appendChild(c);
      }
    }
    newRound();
    startTimer(18, ()=>finish(false));
  }

  else if(ev==='floors'){
    const target = Array.from({length:7},()=>Math.random()<0.5);
    const current = Array.from({length:7},()=>Math.random()<0.5);
    body.innerHTML = '<p style="font-size:12px;color:var(--text-dim);">Chỉnh đèn từng tầng khớp với sơ đồ yêu cầu rồi bấm Xác nhận.</p>';
    const listWrap=document.createElement('div');
    for(let i=0;i<7;i++){
      const row=document.createElement('div'); row.className='floorRow';
      row.innerHTML = `<span style="width:70px;">Tầng ${i+1}</span>
        <span style="width:70px;color:var(--text-dim);">Yêu cầu:</span><span class="floorLamp ${target[i]?'on':''}"></span>
        <span style="width:70px;color:var(--text-dim);margin-left:14px;">Hiện tại:</span><span class="floorLamp fl-${i} ${current[i]?'on':''}"></span>
        <button class="btn fbtn" data-i="${i}">Đảo</button>`;
      listWrap.appendChild(row);
    }
    body.appendChild(listWrap);
    listWrap.querySelectorAll('.fbtn').forEach(btn=>{
      btn.onclick=()=>{
        const i=+btn.dataset.i; current[i]=!current[i];
        listWrap.querySelector('.fl-'+i).classList.toggle('on',current[i]);
      };
    });
    const confirmBtn=document.createElement('button');
    confirmBtn.className='btn primary'; confirmBtn.textContent='Xác nhận';
    confirmBtn.onclick=()=>{
      const ok = target.every((v,i)=>v===current[i]);
      finish(ok);
    };
    footer.appendChild(confirmBtn);
    startTimer(28, ()=>finish(false));
  }

  else if(ev==='wire'){
    // Tủ điện bị đấu lộn dây: nối đúng cặp dây cùng màu giữa cột trái và cột phải
    // trước khi hết giờ. Bấm 1 đầu dây bên trái rồi bấm đầu dây cùng màu bên phải.
    const ALL_COLORS = [
      {id:'red',    hex:'#e6293f', name:'ĐỎ'},
      {id:'green',  hex:'#3ddc84', name:'XANH LÁ'},
      {id:'amber',  hex:'#c9962f', name:'VÀNG'},
      {id:'blue',   hex:'#3aa0c9', name:'XANH DƯƠNG'},
      {id:'purple', hex:'#a662d9', name:'TÍM'},
      {id:'white',  hex:'#e8e2d4', name:'TRẮNG'}
    ];
    const wireCount = Math.min(ALL_COLORS.length, 4 + (S.night-1));
    const colors = shuffle(ALL_COLORS.slice()).slice(0, wireCount);
    const leftOrder = shuffle(colors.slice());
    let rightOrder;
    do{ rightOrder = shuffle(colors.slice()); }
    while(wireCount>1 && rightOrder.every((c,i)=>c.id===leftOrder[i].id));

    const rowH = 44, rowGap = 12, boardH = wireCount*(rowH+rowGap)-rowGap;
    body.innerHTML = `
      <p style="font-size:12px;color:var(--text-dim);">Tủ điện bị đấu lộn dây! Bấm 1 đầu dây bên trái rồi bấm đầu dây <b>cùng màu</b> bên phải để nối lại — nối sai sẽ làm chập mạch ngay lập tức.</p>
      <div id="wireBoardWrap" style="position:relative;height:${boardH}px;margin:6px auto 4px;max-width:340px;">
        <svg id="wireSvg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;"></svg>
        <div id="wireLeftCol" style="position:absolute;left:0;top:0;display:flex;flex-direction:column;gap:${rowGap}px;"></div>
        <div id="wireRightCol" style="position:absolute;right:0;top:0;display:flex;flex-direction:column;gap:${rowGap}px;"></div>
      </div>`;
    const wrapEl = body.querySelector('#wireBoardWrap');
    const leftCol = body.querySelector('#wireLeftCol');
    const rightCol = body.querySelector('#wireRightCol');
    const svg = body.querySelector('#wireSvg');

    let selectedLeft = null;
    let selectedLeftEl = null;
    let connected = 0;
    const leftEls = {}, rightEls = {};

    function mkEndpoint(c){
      const d = document.createElement('div');
      d.className = 'wireEndpoint';
      d.title = c.name;
      d.style.cssText = `width:${rowH}px;height:${rowH}px;border-radius:50%;background:${c.hex};
        border:3px solid #12100e;cursor:pointer;box-shadow:2px 3px 0 rgba(0,0,0,0.6);outline:3px solid transparent;`;
      return d;
    }

    leftOrder.forEach(c=>{
      const d = mkEndpoint(c);
      d.onclick = ()=>{
        if(d.classList.contains('done')) return;
        if(selectedLeftEl) selectedLeftEl.style.outlineColor = 'transparent';
        selectedLeft = c.id;
        selectedLeftEl = d;
        d.style.outlineColor = '#fff';
      };
      leftCol.appendChild(d);
      leftEls[c.id] = d;
    });
    rightOrder.forEach(c=>{
      const d = mkEndpoint(c);
      d.onclick = ()=>{
        if(!selectedLeft || d.classList.contains('done')) return;
        if(selectedLeft === c.id){
          drawWireLine(leftEls[selectedLeft], d, true);
          leftEls[selectedLeft].classList.add('done');
          leftEls[selectedLeft].style.outlineColor = 'transparent';
          leftEls[selectedLeft].style.opacity = '0.35';
          d.classList.add('done');
          d.style.opacity = '0.35';
          connected++;
          selectedLeft = null; selectedLeftEl = null;
          if(connected >= wireCount) finish(true);
        } else {
          drawWireLine(leftEls[selectedLeft], d, false);
          finish(false);
        }
      };
      rightCol.appendChild(d);
      rightEls[c.id] = d;
    });

    function drawWireLine(elA, elB, ok){
      const wrapRect = wrapEl.getBoundingClientRect();
      const ra = elA.getBoundingClientRect(), rb = elB.getBoundingClientRect();
      const x1 = ra.left + ra.width/2 - wrapRect.left, y1 = ra.top + ra.height/2 - wrapRect.top;
      const x2 = rb.left + rb.width/2 - wrapRect.left, y2 = rb.top + rb.height/2 - wrapRect.top;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',x1); line.setAttribute('y1',y1);
      line.setAttribute('x2',x2); line.setAttribute('y2',y2);
      line.setAttribute('stroke', ok ? 'var(--scan)' : 'var(--blood-bright)');
      line.setAttribute('stroke-width','3');
      svg.appendChild(line);
    }

    startTimer(14 + wireCount*3, ()=>finish(false));
  }

  else if(ev==='quiz'){
    const QUESTIONS = [
      {q:'UIT là tên viết tắt của trường đại học nào?', opts:['Trường Đại học Công nghệ Thông tin','Trường Đại học Bách Khoa','Trường Đại học Khoa học Tự nhiên'], a:0},
      {q:'UIT là thành viên của hệ thống đại học nào?', opts:['Đại học Quốc gia Hà Nội','Đại học Quốc gia TP.HCM','Đại học Quốc gia Đà Nẵng'], a:1},
      {q:'UIT được thành lập vào năm nào?', opts:['2001','2010','2006'], a:2},
      {q:'UIT tọa lạc chủ yếu ở khu vực nào của TP.HCM?', opts:['Thủ Đức','Quận 1','Bình Thạnh'], a:0},
      {q:'Ca trực bắt đầu lúc mấy giờ?', opts:['22:00','00:00','01:00'], a:1},
      {q:'Khu vực an toàn để mua vật phẩm là?', opts:['Nhà E','Căn tin','Nhà C'], a:1},
      {q:'Vật phẩm nào giúp hồi 1 HP?', opts:['Nước tăng lực','Bim Bim','Thẻ ra vào'], a:1},
      {q:'The TIU di chuyển nhanh hơn khi nào?', opts:['Thanh meter cao','Trời sáng','Bạn đứng yên'], a:0},
      {q:'Nhà nào có tủ điện cần nối lại dây?', opts:['Nhà B','Nhà C','Nhà D'], a:1},
    ];
    const q = pick(QUESTIONS);
    body.innerHTML = `<p style="font-size:14px;margin-bottom:10px;">${q.q}</p>`;
    q.opts.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.className='btn qOpt'; b.textContent=opt;
      b.onclick=()=>finish(i===q.a);
      body.appendChild(b);
    });
    startTimer(15, ()=>finish(false));
  }

  else if(ev==='wibu'){
    // Đuổi theo Wibu Việt Nhật qua các tầng: gõ đúng chuỗi phím mũi tên trước khi hết giờ.
    const ARROWS = [
      {key:'ArrowUp', sym:'↑'}, {key:'ArrowDown', sym:'↓'},
      {key:'ArrowLeft', sym:'←'}, {key:'ArrowRight', sym:'→'}
    ];
    const patternLen = 5 + S.night; // dài hơn ở các đêm sau
    const pattern = Array.from({length:patternLen}, ()=>pick(ARROWS));
    let idx = 0;

    body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Wibu Việt Nhật đang chạy trốn qua các tầng — gõ đúng các phím mũi tên theo thứ tự để đuổi kịp!</p>
      <div id="arrowSeq" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:18px 0;"></div>
      <div style="text-align:center;font-size:12px;color:var(--text-dim);">Dùng phím mũi tên trên bàn phím ⌨</div>`;
    const seqEl = body.querySelector('#arrowSeq');
    const boxes = pattern.map(a=>{
      const d=document.createElement('div');
      d.style.cssText='width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:22px;border:2px solid var(--line);border-radius:4px;background:#1a1d23;color:var(--text-dim);transition:all .15s;';
      d.textContent=a.sym;
      seqEl.appendChild(d);
      return d;
    });
    function markCurrent(){
      boxes.forEach((b,i)=>{
        b.style.borderColor = i===idx? 'var(--amber)' : (i<idx? 'var(--scan)' : 'var(--line)');
        b.style.color = i===idx? 'var(--amber)' : (i<idx? 'var(--scan)' : 'var(--text-dim)');
        b.style.boxShadow = i===idx? '0 0 14px rgba(226,162,59,0.6)' : 'none';
        b.style.background = i<idx? '#132018' : '#1a1d23';
      });
    }
    markCurrent();
    function onKey(e){
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      if(e.key === pattern[idx].key){
        idx++;
        if(idx>=pattern.length){
          document.removeEventListener('keydown', onKey);
          markCurrent();
          finish(true);
        } else {
          markCurrent();
        }
      } else {
        document.removeEventListener('keydown', onKey);
        boxes[idx].style.borderColor='var(--blood-bright)';
        boxes[idx].style.background='#2a1013';
        finish(false);
      }
    }
    document.addEventListener('keydown', onKey);
    startTimer(patternLen*2.6, ()=>{ document.removeEventListener('keydown', onKey); finish(false); });
  }

  else if(ev==='books'){
    const nums = [1,2,3,4,5,6];
    const shuffled = [...nums].sort(()=>Math.random()-0.5);
    let expected = 1;
    body.innerHTML = '<p style="font-size:12px;color:var(--text-dim);">Xếp lại sách theo đúng thứ tự số từ nhỏ đến lớn.</p><div class="bookRow"></div>';
    const row = body.querySelector('.bookRow');
    shuffled.forEach(n=>{
      const t=document.createElement('div'); t.className='bookTile'; t.textContent=n;
      t.onclick=()=>{
        if(t.classList.contains('picked')) return;
        if(n===expected){
          t.classList.add('picked'); expected++;
          if(expected>6) finish(true);
        } else {
          finish(false);
        }
      };
      row.appendChild(t);
    });
    startTimer(20, ()=>finish(false));
  }

  else if(ev==='bikes'){
    // Chỗ gửi xe bị đảo lộn: dắt xe về đúng số thứ tự từ nhỏ đến lớn trước khi hết giờ.
    const nums = [1,2,3,4,5,6];
    const shuffled = [...nums].sort(()=>Math.random()-0.5);
    let expected = 1;
    body.innerHTML = '<p style="font-size:12px;color:var(--text-dim);">Xe bị dựng lộn xộn! Bấm vào từng xe theo đúng thứ tự số từ nhỏ đến lớn để dắt về hàng.</p><div class="bookRow"></div>';
    const row = body.querySelector('.bookRow');
    shuffled.forEach(n=>{
      const t=document.createElement('div'); t.className='bookTile'; t.textContent='🏍'+n;
      t.onclick=()=>{
        if(t.classList.contains('picked')) return;
        if(n===expected){
          t.classList.add('picked'); expected++;
          if(expected>6) finish(true);
        } else {
          finish(false);
        }
      };
      row.appendChild(t);
    });
    startTimer(20, ()=>finish(false));
  }

  else if(ev==='ball'){
    // Sân bóng tối om: tìm đúng quả bóng lạc giữa một rừng bóng giả trước khi hết giờ.
    let round=0, totalRounds=3;
    function newRound(){
      body.innerHTML='<p style="font-size:12px;color:var(--text-dim);">Một quả bóng thật lẫn trong đám bóng giả — tìm và bấm vào nó trước khi hết giờ!</p><div class="stageGrid"></div>';
      const grid = body.querySelector('.stageGrid');
      const oddIdx = Math.floor(Math.random()*20);
      for(let i=0;i<20;i++){
        const c=document.createElement('div');
        c.className='stageCell'+(i===oddIdx?' odd':'');
        c.textContent = i===oddIdx?'⚽':'●';
        c.onclick=()=>{
          if(i===oddIdx){ round++; if(round<totalRounds) newRound(); else finish(true); }
          else { finish(false); }
        };
        grid.appendChild(c);
      }
    }
    newRound();
    startTimer(18, ()=>finish(false));
  }
}

/* ============== QTE MŨI TÊN (dùng cho kỹ năng & phòng thủ) ============== */
const ARROW_KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
const ARROW_GLYPHS = { ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→' };

const QTE_KEYMAP = {
  ArrowUp:'ArrowUp', ArrowDown:'ArrowDown', ArrowLeft:'ArrowLeft', ArrowRight:'ArrowRight',
  w:'ArrowUp', s:'ArrowDown', a:'ArrowLeft', d:'ArrowRight',
  W:'ArrowUp', S:'ArrowDown', A:'ArrowLeft', D:'ArrowRight'
};
// Số mũi tên QTE của kỹ năng theo độ phức tạp từng nhân vật
let QTE = null;
function qteEnsureHost(){
  const arena = document.getElementById('dodgeArena');
  const box = document.getElementById('dodgeBox');
  const soul = document.getElementById('soulCircle');
  if(soul) soul.style.display = 'none';
  box.querySelectorAll('.dbullet').forEach(b=>b.remove());
  if(getComputedStyle(box).position === 'static') box.style.position = 'relative';
  let host = document.getElementById('qteHost');
  if(!host){
    host = document.createElement('div');
    host.id = 'qteHost';
    host.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;font-family:inherit;color:#fff;user-select:none;';
    box.appendChild(host);
  }
  arena.classList.remove('hidden');
  return host;
}
function qteReleaseHost(){
  const arena = document.getElementById('dodgeArena');
  const host = document.getElementById('qteHost');
  if(host) host.remove();
  const soul = document.getElementById('soulCircle');
  if(soul) soul.style.display = '';
  arena.classList.add('hidden');
}

/* opts: { title, subtitle, count, windowMs, feintChance, mode:'attack'|'defend',
           parryWidth (0-1, mặc định .5), shake (px, 0 = không rung), drift (0-1, độ trôi cửa sổ parry),
           onStrike(res) optional, onDone({hits, perfect, blocked, total, accuracy, bestStreak}) } */
function runArrowQte(opts){
  const host = qteEnsureHost();
  const total = Math.max(1, opts.count|0);
  const parryWidth = clamp(opts.parryWidth!=null ? opts.parryWidth : 0.5, 0.08, 0.9);
  const shake = opts.shake||0, drift = opts.drift||0;
  const q = QTE = {
    idx:0, total, windowMs: opts.windowMs, feintChance: opts.feintChance||0,
    hits:0, perfect:0, blocked:0, streak:0, bestStreak:0,
    target:null, shownAt:0, feinted:false, locked:false, timer:null, raf:null, done:false, opts,
    zoneStart:0, zoneDrift:0
  };

  host.innerHTML = `
    <div style="font-size:13px;letter-spacing:2px;color:#ffd27a;font-weight:700;">${opts.title||''}</div>
    <div style="font-size:12px;color:#c9c9d6;max-width:86%;">${opts.subtitle||''}</div>
    <div id="qteProgress" style="display:flex;gap:6px;"></div>
    <div id="qteArrow" style="font-size:84px;line-height:1;font-weight:800;min-height:96px;transition:transform .08s;">·</div>
    <div id="qteTrack" style="position:relative;width:min(70%,360px);height:14px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);border-radius:7px;overflow:hidden;">
      <div id="qteZone" style="position:absolute;top:0;bottom:0;background:rgba(125,255,154,.55);border-left:2px solid #7dff9a;border-right:2px solid #7dff9a;"></div>
      <div id="qteCursor" style="position:absolute;top:0;bottom:0;width:4px;background:#fff;box-shadow:0 0 6px #fff;left:0;"></div>
    </div>
    <div id="qteFeedback" style="font-size:18px;font-weight:800;min-height:24px;letter-spacing:2px;"></div>
    <div style="font-size:11px;color:#aaa;">Phím mũi tên (hoặc W A S D) — bấm khi con trỏ nằm trong vùng sáng để ${opts.mode==='attack'?'tăng hiệu quả':'PARRY (đỡ 100%) — ngoài vùng sáng chỉ đỡ 50%'}</div>`;

  const elProg = host.querySelector('#qteProgress');
  const elArrow = host.querySelector('#qteArrow');
  const elZone = host.querySelector('#qteZone');
  const elCursor = host.querySelector('#qteCursor');
  const elFb = host.querySelector('#qteFeedback');
  const dodgeHitNum = document.getElementById('dodgeHitNum');
  if(dodgeHitNum) dodgeHitNum.textContent = '0';

  const results = [];
  function drawProgress(){
    elProg.innerHTML = '';
    for(let i=0;i<total;i++){
      const dot = document.createElement('span');
      const r = results[i];
      const col = r==='perfect' ? '#7dff9a' : r==='block' ? '#8ecbff' : r==='hit' ? '#ff5a5a' : (i===q.idx ? '#ffd27a' : 'rgba(255,255,255,.25)');
      dot.style.cssText = 'width:14px;height:14px;border-radius:50%;background:'+col+';border:1px solid rgba(255,255,255,.5);';
      elProg.appendChild(dot);
    }
  }
  drawProgress();

  // Vị trí cửa sổ parry tại thời điểm t (0-1): xuất phát ngẫu nhiên, trôi dọc thanh nếu drift>0
  function zoneAt(t){
    const start = clamp(q.zoneStart + q.zoneDrift*t, 0.05, 1-parryWidth-0.02);
    return [start, start+parryWidth];
  }
  function feedback(text, color){ elFb.textContent = text; elFb.style.color = color; }
  function cleanup(){
    q.done = true;
    document.removeEventListener('keydown', onKey, true);
    clearTimeout(q.timer);
    cancelAnimationFrame(q.raf);
  }
  function endAll(){
    cleanup();
    const out = {hits:q.hits, perfect:q.perfect, blocked:q.blocked, total, accuracy:(q.perfect+q.blocked)/total, bestStreak:q.bestStreak};
    setTimeout(()=>{ qteReleaseHost(); QTE = null; opts.onDone(out); }, 420);
  }
  function nextStrike(){
    if(q.idx >= total){ endAll(); return; }
    q.locked = false; q.feinted = false;
    q.target = pick(ARROW_KEYS);
    // cửa sổ parry DỊCH CHUYỂN: vị trí xuất phát ngẫu nhiên mỗi cú; ở độ khó cao còn trôi trái/phải
    q.zoneStart = 0.08 + Math.random()*(0.9 - parryWidth - 0.08);
    q.zoneDrift = drift ? (Math.random()<0.5?-1:1) * drift * (0.4+Math.random()*0.6) : 0;
    elArrow.textContent = ARROW_GLYPHS[q.target];
    elArrow.style.color = opts.mode==='attack' ? '#ffd27a' : '#ff8f8f';
    elArrow.style.transform = 'scale(1.15)';
    setTimeout(()=>{ if(!q.done) elArrow.style.transform = 'scale(1)'; }, 90);
    feedback('', '#fff');
    drawProgress();
    { const [iz0,iz1] = zoneAt(0); elZone.style.left=(iz0*100)+'%'; elZone.style.width=((iz1-iz0)*100)+'%'; elCursor.style.left='0%'; }
    q.shownAt = performance.now();
    const feintAt = (Math.random() < q.feintChance) ? q.shownAt + q.windowMs*(0.38 + Math.random()*0.12) : null;
    function frame(now){
      if(q.done || q.locked) return;
      const t = (now - q.shownAt) / q.windowMs;
      const [z0,z1] = zoneAt(clamp(t,0,1));
      elZone.style.left = (z0*100)+'%'; elZone.style.width = ((z1-z0)*100)+'%';
      elCursor.style.left = (clamp(t,0,1)*98)+'%';
      // RUNG LẮC mũi tên (chỉ khi shake>0)
      if(shake>0){
        const dx=(Math.random()-0.5)*2*shake, dy=(Math.random()-0.5)*2*shake, rot=(Math.random()-0.5)*shake*1.2;
        elArrow.style.transform = 'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) rotate('+rot.toFixed(1)+'deg)';
      }
      if(feintAt && !q.feinted && now >= feintAt){
        q.feinted = true;
        let nt; do{ nt = pick(ARROW_KEYS); }while(nt===q.target);
        q.target = nt;
        elArrow.textContent = ARROW_GLYPHS[nt];
        elArrow.style.color = '#ff4fd8';
        feedback('ĐỔI HƯỚNG!', '#ff4fd8');
      }
      if(t >= 1){ resolveStrike('timeout'); return; }
      q.raf = requestAnimationFrame(frame);
    }
    q.raf = requestAnimationFrame(frame);
  }
  function resolveStrike(kind){
    if(q.locked || q.done) return;
    q.locked = true;
    cancelAnimationFrame(q.raf);
    elArrow.style.transform = 'scale(1)';
    let res;
    if(kind==='ok'){
      const t = (performance.now() - q.shownAt) / q.windowMs;
      const [z0,z1] = zoneAt(clamp(t,0,1));
      res = (t>=z0 && t<=z1) ? 'perfect' : 'block';
    } else res = 'hit';
    results[q.idx] = res;
    if(res==='perfect'){ q.perfect++; q.streak++; }
    else if(res==='block'){ q.blocked++; q.streak++; }
    else { q.hits++; q.streak = 0; }
    q.bestStreak = Math.max(q.bestStreak, q.streak);
    if(dodgeHitNum) dodgeHitNum.textContent = q.hits;
    if(opts.mode==='attack'){
      if(res==='perfect') feedback('CHÍNH XÁC!', '#7dff9a');
      else if(res==='block') feedback('ỔN', '#8ecbff');
      else feedback(kind==='timeout' ? 'TRỄ!' : 'TRẬT!', '#ff5a5a');
    } else {
      if(res==='perfect') feedback('PARRY! (ĐỠ 100%)', '#7dff9a');
      else if(res==='block') feedback('ĐỠ 50%', '#8ecbff');
      else feedback(kind==='timeout' ? 'KHÔNG KỊP — TRÚNG ĐÒN!' : 'SAI HƯỚNG — TRÚNG ĐÒN!', '#ff5a5a');
      if(res==='hit'){
        const box = document.getElementById('dodgeBox');
        if(box.animate) box.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}], {duration:160});
      }
    }
    if(opts.onStrike) opts.onStrike(res);
    drawProgress();
    q.idx++;
    q.timer = setTimeout(nextStrike, 380);
  }
  function onKey(e){
    const k = QTE_KEYMAP[e.key];
    if(!k) return;
    e.preventDefault(); e.stopPropagation();
    if(q.done || q.locked || !q.target) return;
    resolveStrike(k === q.target ? 'ok' : 'wrong');
  }
  document.addEventListener('keydown', onKey, true);
  q.timer = setTimeout(nextStrike, 650); // nhịp chuẩn bị ngắn trước cú đầu tiên
}

/* ---- PHÒNG THỦ: độ phức tạp chiêu của boss NGẪU NHIÊN 1-7 mũi tên. Giữ hợp đồng cb(hits). ---- */
/* ============== TOP-DOWN: MỖI TÒA LÀ MỘT KHU VỰC ĐI LẠI ĐƯỢC ==============
   Dữ liệu map nằm ở maps.js (window.TD_MAPS, mảng 2 chiều + bảng mã ô TD_TILE).
   Engine này chỉ ĐỌC trạng thái game hiện có (S.activeEvents, S.scavenge, S.loreClues, S.laPeaceRoom,
   getRoomNPCMeta, canDepositLaPeace...) và gắn mọi tương tác vào phím E — không tự giữ trạng thái riêng
   ngoài vị trí người chơi (S.tdX/tdY/tdRoom) và hạt giống chia điểm giấu đồ (S.tdSeed), cả hai đều được lưu theo save game.
   Va chạm với The TIU vẫn tính theo PHÒNG như cũ (cùng tòa = jumpscare) — chưa tính theo vị trí trong tòa.
   Thiếu maps.js hoặc thiếu map của một phòng -> phòng đó tự dùng lại giao diện nút bấm cũ. */
const TD_SPEED = 4.4;   // ô / giây
const TD_RADIUS = 0.3;  // bán kính va chạm của người chơi (đơn vị ô)
const TD_BG_ALPHA = 0.38; // độ rõ của ảnh nền dưới lưới tile (0 = ẩn, 1 = rõ hết)
const TD_REACH = 1.7;   // khoảng cách tối đa (đơn vị ô) để bấm E tương tác
const TD = { S:null, room:null, x:1.5, y:1.5, face:{x:0,y:1}, moving:false, keys:{}, lastTs:0,
             canvas:null, ctx:null, W:0, H:0, dpr:1, imgs:{}, debug:false, npcMeta:null, npcMetas:[], near:null };

function tdMap(room){
  const m = window.TD_MAPS && window.TD_MAPS[room];
  if(!m || !m.tiles || !m.tiles.length) return null;
  if(!m._ix) tdIndex(m);
  return m;
}
function tdIndex(m){
  m.rows = m.tiles.length;
  m.cols = Math.max.apply(null, m.tiles.map(r=>r.length));
  const ix = { npc:null, event:null, shop:null, bench:null, amp:null, spawn:null, items:[], free:[], exitList:[] };
  const exitTo = {};
  (m.exits||[]).forEach(e=>{ exitTo[e.x+','+e.y] = e.to; });
  for(let y=0;y<m.rows;y++){
    for(let x=0;x<m.cols;x++){
      const c = m.tiles[y][x];
      if(c===2 && !ix.npc) ix.npc=[x,y];
      else if(c===3 && !ix.event) ix.event=[x,y];
      else if(c===5 && !ix.shop) ix.shop=[x,y];
      else if(c===6 && !ix.bench) ix.bench=[x,y];
      else if(c===7 && !ix.amp) ix.amp=[x,y];
      else if(c===9 && !ix.spawn) ix.spawn=[x,y];
      else if(c===4) ix.items.push([x,y]);
      else if(c===10 && exitTo[x+','+y]) ix.exitList.push({pos:[x,y], to:exitTo[x+','+y]});
      if(c===0) ix.free.push([x,y]);
    }
  }
  const cx=m.cols/2, cy=m.rows/2;
  ix.free.sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cy)-Math.hypot(b[0]-cx,b[1]-cy));
  if(!ix.spawn) ix.spawn = ix.free[0] || [1,1];
  m._ix = ix;
}
function tdTile(m,x,y){
  if(y<0 || x<0 || y>=m.rows) return 1;
  const v = m.tiles[y][x];
  return v===undefined ? 1 : v;
}
/* Nếu map thiếu ô đặc biệt cần thiết thì dùng 1 ô sàn trống làm chỗ thay thế để game không bị kẹt. */
function tdSpot(m, kind, fi){
  const ix = m._ix;
  return ix[kind] || ix.free[(fi*5+2) % Math.max(1, ix.free.length)] || [1,1];
}
const TD_ENABLED = true; /* Đi lại bằng WASD; chạm cửa (ô 10) + E để sang phòng khác; sơ đồ vẫn dùng được */
function tdActive(){
  if(!TD_ENABLED) return false;
  return !!(S && S.running && tdMap(S.playerRoom));
}
function tdSolidAt(m,x,y){
  const c = tdTile(m,x,y);
  if(c===0 || c===4 || c===9) return false;
  if(c===2){ const n = m._ix.npc; return !!(TD.npcMeta && n && n[0]===x && n[1]===y); }
  return true;
}
function tdCollides(m,px,py){
  const r = TD_RADIUS;
  return tdSolidAt(m,Math.floor(px-r),Math.floor(py-r)) || tdSolidAt(m,Math.floor(px+r),Math.floor(py-r))
      || tdSolidAt(m,Math.floor(px-r),Math.floor(py+r)) || tdSolidAt(m,Math.floor(px+r),Math.floor(py+r));
}
function tdHash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function tdRng(seed){
  let a = seed>>>0;
  return ()=>{ a=(a+0x6D2B79F5)|0; let t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
}
/* Chia 3 "ô giấu đồ" ổn định cho từng phòng (linh kiện / manh mối / La Peace). Thứ tự cố định nên khi nhặt
   xong 1 món, các món còn lại KHÔNG bị nhảy sang chỗ khác. */
function tdItemSpots(m, room){
  if(S.tdSeed==null) S.tdSeed = Math.floor(Math.random()*1e9);
  let pool = m._ix.items.slice();
  for(let i=0; pool.length<3 && i<m._ix.free.length; i++) pool.push(m._ix.free[(i*7+3) % m._ix.free.length]);
  const rnd = tdRng(S.tdSeed ^ tdHash(room));
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  return pool;
}
/* Danh sách mọi thứ có thể tương tác ở phòng hiện tại, dựng lại từ trạng thái game mỗi lần gọi. */
function tdNpcSpot(m,i){
  if(i===0) return tdSpot(m,'npc',0);
  const f = m._ix.free;
  return f[(i*7+11) % Math.max(1,f.length)] || [1,1];
}
/* Danh sách mọi thứ có thể tương tác ở phòng hiện tại, dựng lại từ trạng thái game mỗi lần gọi. */
function tdInteractables(m){
  const room = S.playerRoom, def = ROOM_DEF[room], ix = m._ix, list = [];
  (TD.npcMetas||[]).forEach((meta,i)=>{
    list.push({kind:'npc', pos:tdNpcSpot(m,i), meta, label:'💬 Gặp '+meta.name, act:()=>openNPCMenu(meta)});
  });
  const ev = S.activeEvents[room];
  if(ev){
    list.push({kind:'event', pos:tdSpot(m,'event',1),
      label:'⚠ Xử lý sự cố: '+eventLabel(def.event), act:()=>startMinigame(room)});
  }
  if(def.safe){
    const open = isRoomSafe(room);
    list.push({kind:'shop', pos:tdSpot(m,'shop',2), icon:'🛒', label: open ? '🛒 Mở quầy Căn tin' : '🛒 Quầy Căn tin (đang đóng cửa)',
      act: ()=>{ if(isRoomSafe(room)) openShop(); else addLog('Quầy Căn tin đang đóng cửa. Căn tin chỉ mở theo khung giờ cố định.','warn'); }});
    list.push({kind:'bench', pos:tdSpot(m,'bench',3), icon:'🛠', label:'🛠 Bàn chế tạo', act:openCraftBench});
  }
  if(S.scavenge[room]){
    const sp = tdItemSpots(m, room);
    list.push({kind:'pickup', pos:sp[0], label:'🔧 Nhặt '+scavengeName(S.scavenge[room]), act:pickupScavenge});
  }
  /* Cửa ra (ô 10): đứng gần bấm E để sang phòng kế bên (có màn hình loading). */
  ix.exitList.forEach(ex=>{
    if(!def.connects.includes(ex.to)) return;
    list.push({kind:'exit', pos:ex.pos, locked:false, to:ex.to,
      label:'➜ Đi tới ' + ROOM_DEF[ex.to].name,
      act: ()=> movePlayer(ex.to)});
  });
  return list;
}
function tdNearest(m){
  let best=null, bd=1e9;
  tdInteractables(m).forEach(it=>{
    if(!it.act) return;
    const d = Math.hypot(TD.x-(it.pos[0]+0.5), TD.y-(it.pos[1]+0.5));
    if(d<=TD_REACH && d<bd){ bd=d; best=it; }
  });
  return best;
}
function tdEnterRoom(room, from, restore){
  TD.S = S; TD.room = room;
  const m = tdMap(room);
  if(!m) return;
  TD.npcMetas = getRoomNPCs(room); TD.npcMeta = TD.npcMetas[0] || null;
  let sp = null;
  if(restore && S.tdRoom===room && typeof S.tdX==='number' && !tdCollides(m,S.tdX,S.tdY)) sp = [S.tdX, S.tdY];
  if(!sp && from){
    const e = m._ix.exitList.find(x=>x.to===from);
    if(e){
      const around = [[0,1],[0,-1],[1,0],[-1,0]];
      for(const d of around){
        const nx=e.pos[0]+d[0], ny=e.pos[1]+d[1];
        if(!tdSolidAt(m,nx,ny)){ sp=[nx+0.5, ny+0.5]; break; }
      }
    }
  }
  if(!sp) sp = [m._ix.spawn[0]+0.5, m._ix.spawn[1]+0.5];
  TD.x = sp[0]; TD.y = sp[1]; TD.keys = {}; TD.near = null;
  S.tdRoom = room; S.tdX = TD.x; S.tdY = TD.y;
}
function tdSync(){
  if(TD.S!==S || TD.room!==S.playerRoom) tdEnterRoom(S.playerRoom, null, true);
}
function tdCanControl(){
  return !!(S && S.running && !S.paused && tdActive()
    && !isBlockingOverlayOpen() && !isBattleActive() && isPauseMenuClosed() && !TRAVEL.busy);
}
function isPauseMenuClosed(){ return document.getElementById('pauseMenu').classList.contains('hidden'); }
function tdUpdate(m, dt){
  const k = TD.keys;
  let dx = 0, dy = 0;
  if(k.a || k.arrowleft)  dx -= 1;
  if(k.d || k.arrowright) dx += 1;
  if(k.w || k.arrowup)    dy -= 1;
  if(k.s || k.arrowdown)  dy += 1;
  TD.moving = !!(dx || dy);
  if(!TD.moving) return;
  const len = Math.hypot(dx,dy); dx/=len; dy/=len;
  TD.face = {x:dx, y:dy};
  const step = TD_SPEED*dt;
  const nx = TD.x + dx*step; if(!tdCollides(m,nx,TD.y)) TD.x = nx;
  const ny = TD.y + dy*step; if(!tdCollides(m,TD.x,ny)) TD.y = ny;
}
function tdInteract(){
  if(!tdCanControl()) return;
  const m = tdMap(S.playerRoom); if(!m) return;
  const it = tdNearest(m);
  if(it && it.act){ TD.keys = {}; it.act(); }
}
function tdImage(m, room){
  if(!m.image) return null;
  let im = TD.imgs[room];
  if(!im){ im = new Image(); im.src = m.image; TD.imgs[room] = im; return null; }
  return (im.complete && im.naturalWidth>0) ? im : null;
}
function tdResize(){
  const b = document.getElementById('roomBanner'), c = TD.canvas;
  if(!b || !c) return;
  const dpr = window.devicePixelRatio || 1, w = b.clientWidth, h = b.clientHeight;
  if(c.width!==Math.round(w*dpr) || c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  TD.W = w; TD.H = h; TD.dpr = dpr;
}
const TD_COLORS = { 1:['#2d2720','#4a3f33'], 8:['#2a2420','#3d332a'], 3:['#14201f','#2a4a48'], 5:['#5a4313','#8a6a22'],
                    6:['#3a2f1a','#6a5530'], 7:['#1a2a3a','#2f5a7a'], 10:['#2d2720','#4a3f33'], 2:['#17140f','#17140f'] };
/* ===== CHẾ ĐỘ MÀU TEST (bấm F4 để bật/tắt) — mỗi mã ô một màu riêng để kiểm tra cơ chế ===== */
const TD_TEST_COLORS = {
  0:['#7a7a80','#6a6a70','' ], 1:['#0b0b0d','#222226',''],  2:['#a050c8','#d08cf0','NPC'], 3:['#dc3232','#ff8080','!'],
  4:['#f0d23c','#fff0a0','?'], 5:['#f08c28','#ffc080','$'], 6:['#8c5f37','#c89a6a','CT'], 7:['#3cc8dc','#a0f0ff','AMP'],
  8:['#463228','#6a4e3c',''],  9:['#3cc85a','#a0f0b0','S'], 10:['#326ef0','#90b4ff','E']
};
const TD_TEST_NAMES = {0:'0 sàn',1:'1 tường',2:'2 NPC',3:'3 sự cố',4:'4 vật phẩm',5:'5 căn tin',6:'6 bàn chế',7:'7 AMP',8:'8 vật cản',9:'9 spawn',10:'10 cửa'};
TD.testColors = false; // mặc định TẮT: vào game thấy giao diện thường, bấm F4 mới hiện màu kiểm tra cho dev
function tdDrawTestTiles(ctx,m,tp,ox,oy,overImage){
  const exitTo = {};
  ((m._ix && m._ix.exitList) || []).forEach(e=>{ exitTo[e.pos[0]+','+e.pos[1]] = e.to; });
  ctx.save();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font = 'bold '+Math.max(9,Math.round(tp*0.32))+'px monospace';
  for(let y=0;y<m.rows;y++){
    for(let x=0;x<m.cols;x++){
      const c = tdTile(m,x,y), px = ox+x*tp, py = oy+y*tp, col = TD_TEST_COLORS[c] || TD_TEST_COLORS[0];
      ctx.globalAlpha = overImage ? 0.55 : 1;
      ctx.fillStyle = col[0]; ctx.fillRect(px,py,tp,tp);
      ctx.strokeStyle = col[1]; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.strokeRect(px+0.5,py+0.5,tp-1,tp-1); ctx.globalAlpha = 1;
      let t = col[2];
      if(c===10) t = exitTo[x+','+y] || 'E?';
      if(t){ ctx.fillStyle = (c===4||c===7||c===9) ? '#000' : '#fff'; ctx.fillText(t, px+tp/2, py+tp/2); }
    }
  }
  // chú thích
  const keys = Object.keys(TD_TEST_NAMES), lh = 16, bw = 108, bh = keys.length*lh+22, bx = TD.W-bw-8, by = 8;
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(bx,by,bw,bh);
  ctx.font = '11px monospace'; ctx.textAlign='left';
  keys.forEach((k,i)=>{
    const yy = by+8+i*lh;
    ctx.fillStyle = TD_TEST_COLORS[k][0]; ctx.fillRect(bx+6,yy,12,12);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(bx+6.5,yy+0.5,11,11);
    ctx.fillStyle = '#fff'; ctx.textBaseline='top'; ctx.fillText(TD_TEST_NAMES[k], bx+24, yy);
  });
  ctx.fillStyle = '#f2e2a0'; ctx.textBaseline='top'; ctx.fillText('[F4] màu test', bx+6, by+bh-14);
  ctx.restore();
}
function tdDrawTiles(ctx,m,tp,ox,oy,overImage){
  if(TD.testColors){ tdDrawTestTiles(ctx,m,tp,ox,oy,overImage); return; }
  ctx.save();
  for(let y=0;y<m.rows;y++){
    for(let x=0;x<m.cols;x++){
      const c = tdTile(m,x,y), px = ox+x*tp, py = oy+y*tp;
      const col = TD_COLORS[c];
      if(overImage){
        /* Có ảnh nền: sàn để trống cho ảnh lộ ra, chỉ phủ mờ tường / vật cản / cửa để người chơi nhìn thấy ranh giới. */
        if(col && c!==2){
          ctx.globalAlpha = 0.42; ctx.fillStyle = col[0]; ctx.fillRect(px,py,tp,tp);
          ctx.globalAlpha = 0.7;  ctx.strokeStyle = col[1]; ctx.lineWidth = 1.5; ctx.strokeRect(px+1.5,py+1.5,tp-3,tp-3);
        }
      } else if(col){
        ctx.fillStyle = col[0]; ctx.fillRect(px,py,tp,tp);
        if(c!==2){ ctx.strokeStyle = col[1]; ctx.lineWidth = 2; ctx.strokeRect(px+2,py+2,tp-4,tp-4); }
      } else {
        ctx.fillStyle = ((x+y)&1) ? '#1b1812' : '#17140f'; ctx.fillRect(px,py,tp,tp);
      }
      if(TD.debug){
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '10px monospace'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText(String(c), px+3, py+2);
      }
    }
  }
  ctx.restore();
}
function tdIcon(ctx,ch,cx,cy,size){
  ctx.font = Math.round(size)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(ch,cx,cy);
}
function tdDraw(m, ts){
  const ctx = TD.ctx, W = TD.W, H = TD.H, t = ts/1000;
  ctx.setTransform(TD.dpr,0,0,TD.dpr,0,0);
  ctx.fillStyle = '#070707'; ctx.fillRect(0,0,W,H);
  const tp = Math.max(8, Math.floor(Math.min(W/m.cols, H/m.rows)));
  const ox = Math.floor((W-tp*m.cols)/2), oy = Math.floor((H-tp*m.rows)/2);
  const img = tdImage(m, S.playerRoom);
  if(img){ ctx.save(); ctx.globalAlpha = TD_BG_ALPHA; ctx.drawImage(img, ox, oy, tp*m.cols, tp*m.rows); ctx.restore(); } // ảnh tòa làm nền mờ
  tdDrawTiles(ctx,m,tp,ox,oy,!!img); // tile luôn nằm TRÊN ảnh nền
  const C = (p)=>[ox+(p[0]+0.5)*tp, oy+(p[1]+0.5)*tp];
  const list = tdInteractables(m);
  const near = tdNearest(m); TD.near = near;

  list.forEach(it=>{
    const [cx,cy] = C(it.pos);
    if(it.kind==='exit'){
      ctx.strokeStyle = it.locked ? '#e6293f' : '#3ddc84'; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.55+0.35*Math.sin(t*3);
      ctx.strokeRect(cx-tp/2+2, cy-tp/2+2, tp-4, tp-4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = it.locked ? '#e6293f' : '#3ddc84'; tdIcon(ctx, it.locked?'🔒':'➜', cx, cy, tp*0.45);
    } else if(it.kind==='event'){
      const pulse = 0.5+0.5*Math.sin(t*5);
      const g = ctx.createRadialGradient(cx,cy,2,cx,cy,tp*(1.1+0.4*pulse));
      g.addColorStop(0,'rgba(230,41,63,0.85)'); g.addColorStop(1,'rgba(230,41,63,0)');
      ctx.fillStyle = g; ctx.fillRect(cx-tp*2,cy-tp*2,tp*4,tp*4);
      ctx.fillStyle = '#fff'; tdIcon(ctx, it.mandatory?'⚡':'⚠', cx, cy, tp*0.55);
    } else if(it.kind==='pickup'){
      ctx.fillStyle = 'rgba(242,226,160,'+(0.35+0.35*Math.sin(t*3+it.pos[0]))+')';
      tdIcon(ctx,'✦',cx,cy,tp*0.5);
    } else if(it.kind==='shop' || it.kind==='bench' || it.kind==='amp'){
      ctx.fillStyle = '#fff'; tdIcon(ctx,it.icon,cx,cy-tp*0.05,tp*0.55);
    } else if(it.kind==='npc'){
      const mt = it.meta;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(cx,cy+tp*0.28,tp*0.3,tp*0.12,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = mt.avatarBg || '#5a3a8a'; ctx.strokeStyle = '#c9962f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,tp*0.36,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; tdIcon(ctx, mt.avatarText||'?', cx, cy, tp*0.4);
      ctx.fillStyle = '#c9962f'; ctx.font = 'bold 11px Roboto, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(mt.name, cx, cy-tp*0.5);
    }
  });

  // người chơi
  const px = ox+TD.x*tp, py = oy+TD.y*tp, bob = TD.moving ? Math.sin(t*14)*tp*0.03 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(px,py+tp*0.3,tp*0.28,tp*0.1,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3ddc84'; ctx.strokeStyle = '#0b3d22'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px,py+bob,tp*0.3,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#06210f'; ctx.beginPath(); ctx.arc(px+TD.face.x*tp*0.15, py+bob+TD.face.y*tp*0.15, tp*0.07, 0, Math.PI*2); ctx.fill();

  // gợi ý [E]
  if(near){
    const [cx,cy] = C(near.pos);
    ctx.strokeStyle = '#c9962f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx,cy,tp*0.62,0,Math.PI*2); ctx.stroke();
    const txt = '[E] '+near.label;
    ctx.font = 'bold 13px Roboto, sans-serif';
    const w = ctx.measureText(txt).width+20, h = 26;
    let bx = Math.max(4, Math.min(W-w-4, cx-w/2)), by = cy-tp*0.95-h;
    if(by<4) by = cy+tp*0.8;
    ctx.fillStyle = 'rgba(19,16,14,0.96)'; ctx.strokeStyle = '#c9962f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,by,w,h,5); else ctx.rect(bx,by,w,h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2e2a0'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, bx+w/2, by+h/2+1);
  }
  ctx.fillStyle = 'rgba(217,210,196,0.5)'; ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.fillText('WASD / ← ↑ ↓ → : di chuyển   ·   E : tương tác'+(TD.debug?'   ·   [F3] lưới: BẬT':''), W/2, H-8);
}
function tdLoop(ts){
  requestAnimationFrame(tdLoop);
  const dt = Math.min(0.05, Math.max(0, (ts-(TD.lastTs||ts))/1000)); TD.lastTs = ts;
  if(!TD.ctx){
    TD.canvas = document.getElementById('tdCanvas');
    TD.ctx = TD.canvas && TD.canvas.getContext && TD.canvas.getContext('2d');
    if(!TD.ctx) return;
  }
  const active = tdActive();
  document.getElementById('roomBanner').classList.toggle('td-on', active);
  document.body.classList.toggle('td-mode', active);
  if(!active) return;
  tdSync();
  const m = tdMap(S.playerRoom);
  TD.npcMetas = getRoomNPCs(S.playerRoom); TD.npcMeta = TD.npcMetas[0] || null;
  if(tdCanControl()) tdUpdate(m, dt); else { TD.keys = {}; TD.moving = false; }
  S.tdX = Math.round(TD.x*100)/100; S.tdY = Math.round(TD.y*100)/100; S.tdRoom = S.playerRoom;
  tdResize();
  tdDraw(m, ts);
}
document.addEventListener('keydown', (e)=>{
  if(isTypingTarget(e.target)) return;
  if(e.key==='F3'){ e.preventDefault(); TD.debug = !TD.debug; return; }
  if(e.key==='F4'){ e.preventDefault(); TD.testColors = !TD.testColors; return; }
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const k = (e.key||'').toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
    if(tdCanControl()){ e.preventDefault(); TD.keys[k] = true; }
  } else if(k==='e' && !e.repeat){
    if(tdCanControl()){ e.preventDefault(); tdInteract(); }
  }
});
document.addEventListener('keyup', (e)=>{ delete TD.keys[(e.key||'').toLowerCase()]; });
window.addEventListener('blur', ()=>{ TD.keys = {}; });
requestAnimationFrame(tdLoop);

/* ============== LOADING KHI ĐỔI PHÒNG ==============
   Phủ ảnh của phòng SẮP ĐẾN lên toàn màn hình, tới lúc đã kín mới chuyển phòng, rồi mờ dần.
   SFX tiếng bước chân: điền đường dẫn vào TD_TRAVEL_SFX (vd 'assets/audio/footsteps.mp3'), để '' = chưa có. */
const TD_TRAVEL_SFX = '';
const TD_TRAVEL_SWAP_MS = 650;  // thời điểm thực sự đổi phòng (màn đã kín)
const TD_TRAVEL_TOTAL_MS = 1350; // tổng thời gian loading
const TRAVEL = { busy:false, el:null, sfx:null };

function ensureTravelDom(){
  if(TRAVEL.el) return TRAVEL.el;
  const st = document.createElement('style');
  st.textContent = `
  #travelLoading{position:fixed;inset:0;z-index:70;background:#030304;opacity:0;pointer-events:none;transition:opacity .28s ease;display:flex;align-items:center;justify-content:center;overflow:hidden}
  #travelLoading.on{opacity:1;pointer-events:auto}
  #travelLoading .tlBg{position:absolute;inset:-4%;background-size:cover;background-position:center;filter:brightness(.5) saturate(.8) blur(1.5px);transform:scale(1.04)}
  #travelLoading.on .tlBg{animation:tlDrift ${TD_TRAVEL_TOTAL_MS}ms linear forwards}
  #travelLoading::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 30%,rgba(0,0,0,.88) 100%)}
  #travelLoading .tlBox{position:relative;z-index:1;text-align:center;font-family:var(--font-disp,'Roboto Condensed',sans-serif)}
  #travelLoading .tlSmall{font-size:12px;letter-spacing:6px;color:var(--text-dim,#a89f8c);margin-bottom:6px}
  #travelLoading .tlName{font-size:40px;letter-spacing:5px;color:var(--amber,#e0a63a);text-shadow:0 2px 14px #000}
  #travelLoading .tlBar{width:220px;height:2px;margin:16px auto 0;background:rgba(255,255,255,.12);overflow:hidden}
  #travelLoading .tlBar i{display:block;height:100%;width:0;background:var(--amber,#e0a63a)}
  #travelLoading.on .tlBar i{animation:tlFill ${TD_TRAVEL_TOTAL_MS}ms linear forwards}
  @keyframes tlFill{to{width:100%}}
  @keyframes tlDrift{from{transform:scale(1.04) translateX(0)}to{transform:scale(1.1) translateX(-1.5%)}}`;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'travelLoading';
  el.innerHTML = '<div class="tlBg"></div><div class="tlBox"><div class="tlSmall">ĐANG ĐI TỚI</div><div class="tlName"></div><div class="tlBar"><i></i></div></div>';
  document.body.appendChild(el);
  TRAVEL.el = el;
  return el;
}
function travelImageFor(dest){
  const m = window.TD_MAPS && window.TD_MAPS[dest];
  return (m && m.image) || ROOM_IMAGES[dest] || '';
}
function playTravelSfx(){
  if(!TD_TRAVEL_SFX) return;
  try{
    const a = new Audio(TD_TRAVEL_SFX);
    a.loop = true;
    a.volume = (window.UIT_SOUND_MUTED ? 0 : 1) * ((typeof SETTINGS!=='undefined' && SETTINGS.masterVolume!=null ? SETTINGS.masterVolume : 100) / 100);
    a.play().catch(()=>{});
    TRAVEL.sfx = a;
  }catch(e){}
}
function stopTravelSfx(){
  if(TRAVEL.sfx){ try{ TRAVEL.sfx.pause(); }catch(e){} TRAVEL.sfx = null; }
}
function endTravel(){
  TRAVEL.busy = false;
  stopTravelSfx();
  if(TRAVEL.el) TRAVEL.el.classList.remove('on');
}
function startTravel(dest){
  const el = ensureTravelDom();
  const s0 = S;
  TRAVEL.busy = true;
  if(TD && TD.keys) TD.keys = {};
  const img = travelImageFor(dest);
  const bg = el.querySelector('.tlBg');
  bg.style.backgroundImage = img ? `url('${img}')` : '';
  bg.style.background = img ? '' : (ROOM_FALLBACK_GRADIENT[dest] || '#111');
  if(img) bg.style.backgroundImage = `url('${img}')`;
  el.querySelector('.tlName').textContent = ROOM_DEF[dest].name;
  // khởi động lại animation thanh tiến trình mỗi lần
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  playTravelSfx();

  const doSwap = ()=>{
    if(S!==s0 || !S.running){ endTravel(); return; }
    if(S.paused){ setTimeout(doSwap, 200); return; }       // đang tạm dừng: chờ rồi mới chuyển
    if(isBlockingOverlayOpen()){ endTravel(); return; }    // bị jumpscare / game over chen vào: hủy
    movePlayerNow(dest);
    const rest = Math.max(0, TD_TRAVEL_TOTAL_MS - TD_TRAVEL_SWAP_MS);
    const t0 = performance.now();
    (function wait(){
      if(S!==s0 || !S.running || isBlockingOverlayOpen()){ endTravel(); return; } // jumpscare sau khi tới nơi: bỏ loading ngay
      if(performance.now()-t0 >= rest) endTravel(); else setTimeout(wait, 80);
    })();
  };
  setTimeout(doSwap, TD_TRAVEL_SWAP_MS);
}

/* ============== LƯU GAME KHI RỜI TRANG ============== */
window.addEventListener('beforeunload', ()=>{ persistSave(); });

buildMap();
rafId = requestAnimationFrame(tick);
showTitle();
})();