(function(){
"use strict";

/* ============== CONFIG ============== */
const ROOM_DEF = {
  A:      {name:"TÒA A", sub:"Hội trường", x:30, y:76, connects:["LIB","E","B"], event:"stage"},
  B:      {name:"TÒA B", sub:"7 tầng", x:26, y:44, connects:["A","C","E","CANTEEN"], event:"floors"},
  C:      {name:"TÒA C", sub:"Tủ điện", x:58, y:44, connects:["B","D","E","CANTEEN"], event:"wire"},
  D:      {name:"TÒA D", sub:"Ban chỉ huy", x:80, y:14, connects:["C"], event:"quiz"},
  E:      {name:"TÒA E", sub:"11 tầng", x:56, y:70, connects:["A","C"], event:"wibu"},
  LIB:    {name:"THƯ VIỆN", sub:"Kho sách", x:9, y:88, connects:["A"], event:"books"},
  CANTEEN:{name:"CĂN TIN", sub:"Khu an toàn", x:44, y:20, connects:["B","C"], safe:true}
};
const ROOM_KEYS = Object.keys(ROOM_DEF);

/* Sprite riêng cho từng NPC — điền URL ảnh vào đây để thay avatar chữ cái mặc định,
   ví dụ: E:"images/wibu.png" */
const NPC_IMAGES = { E:"", B:"", TRONG:"" };

// Ảnh riêng cho từng phòng — thay các URL này bằng ảnh của bạn (đặt file vào cùng thư mục
// với file HTML này và sửa đường dẫn bên dưới, ví dụ: A:"images/nha-a.jpg").
const ROOM_IMAGES = {
  A:"assets/images/ToaA.png", B:"assets/images/ToaB.png", C:"assets/images/ToaC.png", D:"assets/images/ToaD.png", E:"assets/images/ToaE.png", LIB:"assets/images/lib.png", CANTEEN:"assets/images/ct.png"
};
// Ảnh quái vật The TIU dùng cho pha jumpscare toàn màn hình — điền đường dẫn PNG vào đây,
// ví dụ: 'assets/images/tiu-monster.png'. Để trống thì sẽ hiện icon dự phòng.
const TIU_IMAGE = "assets/images/TIU.png";

// Nhạc cảnh báo khi The TIU ở gần — điền đường dẫn file âm thanh vào đây,
// ví dụ: 'assets/audio/tiu-near.mp3'. Để trống thì tính năng này sẽ tự tắt.
const TIU_PROXIMITY_MUSIC = "assets/sfx/OST/TIU.mp3";
// Từ khoảng cách (số tòa) này trở đi thì coi như The TIU đã đi xa hẳn -> nhạc tắt hẳn.
const PROXIMITY_FAR_DISTANCE = 3;

// Màu nền dự phòng khi chưa có ảnh, để mỗi phòng vẫn có nhận diện riêng.
const ROOM_FALLBACK_GRADIENT = {
  A:"linear-gradient(135deg,#241a12,#12100e)",
  B:"linear-gradient(135deg,#141c22,#0e1214)",
  C:"linear-gradient(135deg,#122024,#0e1214)",
  D:"linear-gradient(135deg,#241214,#120e0f)",
  E:"linear-gradient(135deg,#1c1424,#100e14)",
  LIB:"linear-gradient(135deg,#1e1a12,#100f0c)",
  CANTEEN:"linear-gradient(135deg,#0f2418,#0c1712)"
};

let _storedVol = 80;
try{
  const _v = localStorage.getItem('uit_master_volume');
  if(_v!==null){ const n = parseInt(_v,10); if(!isNaN(n)) _storedVol = Math.max(0,Math.min(100,n)); }
}catch(e){}
const SETTINGS = { shake:true, flash:true, crt:true, masterVolume:_storedVol };

const NIGHT_CFG = [
  null,
  {name:"ĐÊM 1", eventEvery:[55,85], monsterMoveEvery:[22,34], meterMoveSpeedFactor:1, meterGainFail:14, meterGainIgnore:9, meterDecay:0.06, startMeter:8},
  {name:"ĐÊM 2", eventEvery:[42,68], monsterMoveEvery:[16,26], meterMoveSpeedFactor:1.25, meterGainFail:17, meterGainIgnore:11, meterDecay:0.05, startMeter:14},
  {name:"ĐÊM 3", eventEvery:[30,52], monsterMoveEvery:[11,19], meterMoveSpeedFactor:1.55, meterGainFail:20, meterGainIgnore:13, meterDecay:0.04, startMeter:20},
];

const GAME_MINUTES_TOTAL = 7.5*60; // 00:00 -> 07:30
const REAL_MS_PER_GAME_MIN = (15*60*1000) / GAME_MINUTES_TOTAL; // 1 màn ~ 15 phút thực tế
const BASE_MOVE_COST_MIN = 10; // mỗi lượt di chuyển giữa 2 tòa liền kề LUÔN mất đúng 10 phút (game-time)
const BUFF_MOVE_COST_MIN = 5;  // đang có buff Nước tăng lực -> mỗi lượt di chuyển chỉ mất 5 phút

/* ---- Camping fix: Căn tin chỉ mở trong khung giờ cố định ---- */
const CANTEEN_WINDOWS = [[60,120],[240,300]]; // 01:00-02:00 & 04:00-05:00 (tính bằng phút kể từ 00:00)
function isCanteenOpen(gmin){
  const t = gmin % (24*60);
  return CANTEEN_WINDOWS.some(([a,b])=>t>=a && t<b);
}
/* Phòng có thực sự an toàn ngay lúc này không (tính cả trạng thái Huyết Nguyệt) */
function isRoomSafe(k){
  if(S && S.enraged) return false; // Huyết Nguyệt: The TIU phá vỡ mọi quy tắc safezone
  if(!ROOM_DEF[k].safe) return false;
  return isCanteenOpen(S ? S.gameMinutes : 0);
}

/* ---- Thể lực (camping) ---- */
const STAMINA_DRAIN_SAFE = 0.22;   // mỗi phút game đứng yên trong khu an toàn
const STAMINA_REGEN_ROAM = 0.07;   // mỗi phút game hoạt động bên ngoài
const STARVE_TICK_MIN = 55;        // cạn thể lực -> mất máu mỗi X phút game

/* ---- Huyết Nguyệt ---- */
const ENRAGE_DURATION_MIN = 100;   // Huyết Nguyệt kéo dài bao lâu (phút game) trước khi hạ nhiệt

/* ---- Tiếng ồn khi có buff tốc độ ---- */
const NOISE_ATTRACT_CHANCE = 0.35;

/* ============== STATE ============== */
let S = null;

function freshState(night){
  const startRoom = ROOM_KEYS[Math.floor(Math.random()*ROOM_KEYS.length)];
  let monsterRoom = ROOM_KEYS.filter(r=>r!==startRoom && !ROOM_DEF[r].safe)[Math.floor(Math.random()*4)];
  return {
    night,
    gameMinutes: 0,
    running: true,
    hp: 3,
    points: 0,
    meter: NIGHT_CFG[night].startMeter,
    playerRoom: startRoom,
    monsterRoom: monsterRoom,
    speedBuffUntil: 0, // game-minute timestamp
    invulnUntil: 0,
    activeEvents: {}, // roomKey -> {deadline(gameMin)}
    lastSeenRoom: null,
    lastSeenAt: 0,
    inventory: {bimbim:1, water:0, camera:0, breaker:0},
    lastTick: performance.now(),
    nextEventAt: rand(...NIGHT_CFG[night].eventEvery),
    nextMonsterMoveAt: rand(...NIGHT_CFG[night].monsterMoveEvery),
    log: [],
    // --- camping fix ---
    stamina: 100,
    nextStarveTickAt: 0,
    // --- Huyết Nguyệt ---
    enraged: false,
    enrageUntil: 0,
    // --- item hiệu ứng ---
    cameraMovesLeft: 0,
    breakerUntil: 0,
    // --- visual novel / NPC ---
    paused: false,
    npcSeen: {},     // {roomKey: nightNumber đã xem}
    trongSeen: false,
    introShown: false
  };
}

function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

/* ============== VISUAL NOVEL ============== */
function playVN(lines, onDone){
  if(!lines || !lines.length){ if(onDone) onDone(); return; }
  S.paused = true;
  const overlay = document.getElementById('vnOverlay');
  const spkEl = document.getElementById('vnSpeaker');
  const txtEl = document.getElementById('vnText');
  const nextBtn = document.getElementById('vnNextBtn');
  overlay.classList.remove('hidden');
  let i = 0;
  function showLine(){
    const l = lines[i];
    spkEl.textContent = l.spk;
    txtEl.textContent = l.text;
    nextBtn.textContent = (i>=lines.length-1) ? 'ĐÓNG ▶' : 'TIẾP TỤC ▶';
  }
  function advance(){
    i++;
    if(i>=lines.length){
      overlay.classList.add('hidden');
      nextBtn.onclick = null;
      S.paused = false;
      S.lastTick = performance.now();
      if(onDone) onDone();
      return;
    }
    showLine();
  }
  nextBtn.onclick = advance;
  showLine();
}

/* ---- Nội dung hội thoại (VN_INTRO, VN_OUTRO, NPC_DIALOGUES, TRONG_DIALOGUE)
   đã được chuyển sang file dialogue.js — nạp trước script.js trong index.html. ---- */

function applyVNReward(reward){
  if(!reward) return;
  if(reward.type==='item'){
    S.inventory[reward.item] = (S.inventory[reward.item]||0) + reward.qty;
  } else if(reward.type==='points'){
    S.points += reward.amount;
  } else if(reward.type==='reveal'){
    S.cameraMovesLeft = Math.max(S.cameraMovesLeft, reward.moves);
  } else if(reward.type==='special_trong'){
    S.hp = Math.min(3, S.hp+1);
    S.inventory.water = (S.inventory.water||0)+1;
  }
  if(reward.msg) addLog(reward.msg,'');
  refreshAll();
}

/* Trả về thông tin NPC hiện diện tại 1 phòng vào đêm hiện tại (nếu có) */
function getRoomNPCMeta(roomKey){
  if(roomKey==='C' && S.night===3 && S.hp===1 && !S.trongSeen){
    return {key:'TRONG', name:'TRỌNG', avatarBg:'#7a1a1a', avatarText:'✦', talkable:true};
  }
  const npc = NPC_DIALOGUES[roomKey];
  if(!npc) return null;
  const entry = npc[S.night];
  if(!entry) return null;
  const meta = roomKey==='E'
    ? {key:'E', name:'WIBU VIỆT NHẬT', avatarBg:'#5a3a8a', avatarText:'和'}
    : {key:'B', name:'CHÀNG LÍNH NGU LẮM', avatarBg:'#2a5a3a', avatarText:'💤'};
  meta.talkable = S.npcSeen[roomKey] !== S.night;
  return meta;
}

function talkToNPC(meta){
  if(meta.key==='TRONG'){
    S.trongSeen = true;
    playVN(TRONG_DIALOGUE.lines, ()=>{ applyVNReward(TRONG_DIALOGUE.reward); refreshActionPane(); });
  } else {
    const entry = NPC_DIALOGUES[meta.key][S.night];
    S.npcSeen[meta.key] = S.night;
    playVN(entry.lines, ()=>{ applyVNReward(entry.reward); refreshActionPane(); });
  }
}

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
  let total = gmin; // 0 = 00:00
  let h = Math.floor(total/60);
  let m = Math.floor(total%60);
  h = h%24;
  return String(h).padStart(2,'0')+":"+String(m).padStart(2,'0');
}

/* ============== MAP RENDER ============== */
/* Dùng chung cho cả bản đồ thu nhỏ (mini) và bản đồ phóng to (modal) */
function buildMapInto(wrapId, prefix){
  const wrap = document.getElementById(wrapId);
  if(!wrap) return;
  wrap.innerHTML = '';
  const rect = wrap.getBoundingClientRect();
  const w = rect.width || 600, h = rect.height || 420;
  // edges first
  const drawn = new Set();
  ROOM_KEYS.forEach(k=>{
    ROOM_DEF[k].connects.forEach(c=>{
      const key = [k,c].sort().join('-');
      if(drawn.has(key)) return;
      drawn.add(key);
      const a = ROOM_DEF[k], b = ROOM_DEF[c];
      const ax=a.x/100*w, ay=a.y/100*h, bx=b.x/100*w, by=b.y/100*h;
      const dx = bx-ax, dy = by-ay;
      const lenPx = Math.sqrt(dx*dx+dy*dy);
      const edge = document.createElement('div');
      edge.className='edge';
      edge.style.left = ax+'px';
      edge.style.top = ay+'px';
      edge.style.width = lenPx+'px';
      const angle = Math.atan2(dy,dx)*180/Math.PI;
      edge.style.transform = `rotate(${angle}deg)`;
      wrap.appendChild(edge);
    });
  });
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
  ROOM_KEYS.forEach(k=>{
    const node = document.getElementById(prefix+'-node-'+k);
    if(!node) return;
    node.classList.remove('current-marker','reachable','tiu-alert');
    node.classList.toggle('savezone', isRoomSafe(k));
    const badge = node.querySelector('.event-badge');
    if(badge) badge.remove();
    if(k===S.playerRoom) node.classList.add('current-marker');
    else if(ROOM_DEF[S.playerRoom].connects.includes(k)) node.classList.add('reachable');
    // Chỉ hiển thị màu đỏ khi có Camera Sinh viên (trực tiếp) — vị trí "vừa rời đi" chỉ nằm trong log
    if(S.cameraMovesLeft>0 && S.monsterRoom===k) node.classList.add('tiu-alert');
    if(S.activeEvents[k]){
      const b=document.createElement('div');
      b.className='event-badge';
      b.textContent='!';
      node.appendChild(b);
    }
  });
}
function refreshMap(){
  refreshMapInto('modal');
  refreshMapInto('mini');
}

/* ============== room title glitch (Huyết Nguyệt) ============== */
function setRoomTitleGlitch(on){
  const el = document.getElementById('roomTitle');
  if(!el) return;
  const wasOn = el.classList.contains('glitch-active');
  el.classList.toggle('glitch-active', on);
  if(on && !wasOn){
    // randomize the animation start point each time it kicks in so the glitch bursts feel unpredictable
    el.style.animationDelay = (-(Math.random()*2.6)).toFixed(2)+'s';
  }
}

/* ============== HUD ============== */
function refreshHud(){
  document.getElementById('clockVal').textContent = formatClock(S.gameMinutes);
  document.getElementById('pointsHud').textContent = S.points;
  document.getElementById('nightBadge').textContent = NIGHT_CFG[S.night].name;
  const hpWrap = document.getElementById('hpWrap');
  hpWrap.innerHTML='';
  for(let i=0;i<3;i++){
    const d=document.createElement('div');
    d.className='hpdot'+(i<S.hp?'':' lost');
    hpWrap.appendChild(d);
  }
  document.getElementById('meterFill').style.width = Math.min(100,S.meter)+'%';
  document.getElementById('vignette').classList.toggle('critical', S.hp===1);

  const stFill = document.getElementById('staminaFill');
  stFill.style.width = Math.max(0,S.stamina)+'%';
  stFill.classList.toggle('low', S.stamina<30);

  const tiuEl = document.getElementById('tiuLastSeen');
  if(S.cameraMovesLeft>0){
    tiuEl.textContent = ROOM_DEF[S.monsterRoom].name+' (TRỰC TIẾP 📷 x'+S.cameraMovesLeft+')';
    tiuEl.style.color = 'var(--scan)';
  } else {
    tiuEl.textContent = S.lastSeenRoom ? ROOM_DEF[S.lastSeenRoom].name : '—';
    tiuEl.style.color = 'var(--blood-bright)';
  }
}

/* ============== ACTION PANE ============== */
let actionPaneDirty = true;
function markActionDirty(){ actionPaneDirty = true; }

function updateRoomDescOnly(){
  if(!S) return;
  const def = ROOM_DEF[S.playerRoom];
  let desc = def.sub;
  if(S.activeEvents[S.playerRoom]){
    const left = Math.max(0, Math.ceil(S.activeEvents[S.playerRoom].deadline - S.gameMinutes));
    desc += ` — SỰ CỐ ĐANG DIỄN RA (còn ~${left} phút để xử lý)`;
  }
  if(def.safe && !isRoomSafe(S.playerRoom)){
    desc += ` — Căn tin chỉ mở cửa lúc 01:00-02:00 và 04:00-05:00.`;
  }
  const el = document.getElementById('roomDesc');
  if(el) el.textContent = desc;
}

function refreshActionPane(){
  const def = ROOM_DEF[S.playerRoom];
  const safeNow = isRoomSafe(S.playerRoom);
  document.getElementById('roomTitle').textContent = def.name;
  let safeTag = '';
  if(def.safe){
    safeTag = safeNow ? '✓ KHU AN TOÀN — ĐANG MỞ CỬA' : '✕ CĂN TIN ĐÃ ĐÓNG CỬA — KHÔNG AN TOÀN';
  }
  if(S.enraged) safeTag = '🩸 HUYẾT NGUYỆT — KHÔNG NƠI NÀO AN TOÀN';
  document.getElementById('roomSafeTag').textContent = safeTag;
  document.getElementById('roomSafeTag').style.color = safeNow ? 'var(--scan)' : 'var(--blood-bright)';

  const banner = document.getElementById('roomBanner');
  banner.classList.toggle('safebanner', safeNow);
  const imgUrl = ROOM_IMAGES[S.playerRoom];
  banner.style.backgroundImage = imgUrl
    ? `url('${imgUrl}')`
    : ROOM_FALLBACK_GRADIENT[S.playerRoom];

  const resolveBtn = document.getElementById('resolveBtn');
  const hasEvent = !!S.activeEvents[S.playerRoom];
  resolveBtn.classList.toggle('show', hasEvent);
  if(hasEvent){
    resolveBtn.textContent = '⚠ XỬ LÝ: '+eventLabel(def.event);
    resolveBtn.onclick = ()=>startMinigame(S.playerRoom);
  }

  const npcMeta = getRoomNPCMeta(S.playerRoom);
  const npcSprite = document.getElementById('npcSprite');
  npcSprite.classList.toggle('hidden', !npcMeta);
  if(npcMeta){
    const av = document.getElementById('npcAvatar');
    const imgUrl = NPC_IMAGES[npcMeta.key];
    if(imgUrl){
      av.style.backgroundImage = `url('${imgUrl}')`;
      av.style.background = `url('${imgUrl}') center/cover`;
      av.textContent = '';
    } else {
      av.style.backgroundImage = '';
      av.style.background = npcMeta.avatarBg;
      av.textContent = npcMeta.avatarText;
    }
    document.getElementById('npcName').textContent = npcMeta.name;
  }

  let desc = def.sub;
  if(hasEvent){
    const left = Math.max(0, Math.ceil(S.activeEvents[S.playerRoom].deadline - S.gameMinutes));
    desc += ` — SỰ CỐ ĐANG DIỄN RA (còn ~${left} phút để xử lý)`;
  }
  if(def.safe && !safeNow){
    desc += ` — Căn tin chỉ mở cửa lúc 01:00-02:00 và 04:00-05:00.`;
  }
  document.getElementById('roomDesc').textContent = desc;

  const btnWrap = document.getElementById('actionButtons');
  btnWrap.innerHTML='';

  function makeGroup(title){
    const g = document.createElement('div');
    g.className='actionGroup';
    const h = document.createElement('div');
    h.className='actionGroupTitle';
    h.textContent = title;
    g.appendChild(h);
    const row = document.createElement('div');
    row.className='actionGroupRow';
    g.appendChild(row);
    return {g, row};
  }

  /* ---- Nhóm 1: DI CHUYỂN ---- */
  const moveGroup = makeGroup('DI CHUYỂN');
  def.connects.forEach(c=>{
    const b=document.createElement('button');
    b.className='btn';
    b.textContent='➜ '+ROOM_DEF[c].name;
    b.onclick=()=>movePlayer(c);
    moveGroup.row.appendChild(b);
  });
  btnWrap.appendChild(moveGroup.g);

  /* ---- Nhóm 2: VẬT PHẨM ---- */
  const itemGroup = makeGroup('VẬT PHẨM');

  if(def.safe){
    const b=document.createElement('button');
    b.className='btn primary';
    b.textContent = safeNow ? 'Mở quầy Căn tin' : 'Căn tin đang đóng cửa';
    b.disabled = !safeNow;
    b.onclick=openShop;
    itemGroup.row.appendChild(b);
  }

  const useBim=document.createElement('button');
  useBim.className='btn danger';
  useBim.textContent='Dùng Bim Bim (+1 HP)';
  useBim.disabled = S.inventory.bimbim<=0 || S.hp>=3;
  useBim.onclick=()=>{
    if(S.inventory.bimbim>0 && S.hp<3){
      S.inventory.bimbim--; S.hp++; addLog('Bạn ăn Bim Bim, hồi 1 HP.','');
      markActionDirty();
      refreshHud(); refreshActionPane();
    }
  };
  itemGroup.row.appendChild(useBim);

  const useWater=document.createElement('button');
  useWater.className='btn';
  useWater.textContent='Uống Nước tăng lực (buff tốc độ, gây tiếng ồn)';
  useWater.disabled = S.inventory.water<=0;
  useWater.onclick=()=>{
    if(S.inventory.water>0){
      S.inventory.water--; S.speedBuffUntil = S.gameMinutes + 90;
      addLog('Bạn uống Nước tăng lực — di chuyển nhanh hơn trong 90 phút, nhưng bước chân sẽ ồn hơn.','');
      markActionDirty();
      refreshHud(); refreshActionPane();
    }
  };
  itemGroup.row.appendChild(useWater);

  const useCam=document.createElement('button');
  useCam.className='btn';
  useCam.textContent='Dùng Camera Sinh viên (định vị TIU 3 lượt)';
  useCam.disabled = S.inventory.camera<=0 || S.cameraMovesLeft>0;
  useCam.onclick=()=>{
    if(S.inventory.camera>0 && S.cameraMovesLeft<=0){
      S.inventory.camera--; S.cameraMovesLeft = 3;
      addLog('Bạn bật Camera Sinh viên — theo dõi trực tiếp The TIU trong 3 lượt di chuyển tới.','');
      markActionDirty();
      refreshHud(); refreshMap(); refreshActionPane();
    }
  };
  itemGroup.row.appendChild(useCam);

  const useBreaker=document.createElement('button');
  useBreaker.className='btn danger';
  useBreaker.textContent='Sập Cầu Dao (vô hiệu hóa TIU 60p, tối màn hình)';
  useBreaker.disabled = S.inventory.breaker<=0 || S.gameMinutes<S.breakerUntil;
  useBreaker.onclick=()=>{
    if(S.inventory.breaker>0 && S.gameMinutes>=S.breakerUntil){
      S.inventory.breaker--; S.breakerUntil = S.gameMinutes + 60;
      addLog('RẦM! Bạn sập cầu dao — toàn khuôn viên mất điện. The TIU bị vô hiệu hóa 60 phút, nhưng bạn phải di chuyển mù.','warn');
      markActionDirty();
      refreshHud(); refreshActionPane();
    }
  };
  itemGroup.row.appendChild(useBreaker);
  btnWrap.appendChild(itemGroup.g);

  /* ---- Nhóm 3: TƯƠNG TÁC ---- */
  if(npcMeta && npcMeta.talkable){
    const interactGroup = makeGroup('TƯƠNG TÁC');
    const talkBtn=document.createElement('button');
    talkBtn.className='btn npc';
    talkBtn.textContent='💬 Nói chuyện với '+npcMeta.name;
    talkBtn.onclick=()=>talkToNPC(npcMeta);
    interactGroup.row.appendChild(talkBtn);
    btnWrap.appendChild(interactGroup.g);
  }

  const inv = document.getElementById('invRow');
  inv.innerHTML = `<div class="itemChip">Bim Bim: <b>${S.inventory.bimbim}</b></div>
                    <div class="itemChip">Nước tăng lực: <b>${S.inventory.water}</b></div>
                    <div class="itemChip">Camera SV: <b>${S.inventory.camera}</b></div>
                    <div class="itemChip">Cầu dao: <b>${S.inventory.breaker}</b></div>
                    <div class="itemChip">Buff tốc độ: <b>${S.gameMinutes<S.speedBuffUntil?'ĐANG BẬT':'—'}</b></div>
                    <div class="itemChip">Thể lực: <b>${Math.round(Math.max(0,S.stamina))}%</b></div>`;
}

function eventLabel(ev){
  return {stage:'Kiểm tra sân khấu', floors:'Bật/tắt các tầng', wire:'Nối dây điện', quiz:'Trả lời câu hỏi', wibu:'Bắt Wibu Việt Nhật', books:'Sắp xếp lại sách'}[ev]||ev;
}

function onRoomClick(k){
  if(k===S.playerRoom) return;
  if(!ROOM_DEF[S.playerRoom].connects.includes(k)) return;
  movePlayer(k);
  document.getElementById('mapModal').classList.add('hidden');
}

/* ============== MOVEMENT ============== */
function movePlayer(dest){
  if(!S.running || S.paused) return;
  const noisy = S.gameMinutes < S.speedBuffUntil;
  const cost = noisy ? BUFF_MOVE_COST_MIN : BASE_MOVE_COST_MIN; // 10 phút bình thường, 5 phút khi có buff Nước tăng lực
  S.gameMinutes += cost;
  S.playerRoom = dest;
  addLog('Bạn di chuyển đến '+ROOM_DEF[dest].name+'.','');
  if(S.cameraMovesLeft>0) S.cameraMovesLeft--;
  markActionDirty();
  advanceWorld(cost);

  // Hệ thống tiếng ồn: buff tốc độ khiến bước chân ồn hơn, có xác suất TIU bị thu hút
  if(S.running && noisy && Math.random()<NOISE_ATTRACT_CHANCE){
    const path = bfsPath(S.monsterRoom, dest, !S.enraged);
    if(path && path.length>1 && S.gameMinutes>=S.breakerUntil){
      S.monsterRoom = path[1];
      addLog('Tiếng bước chân ồn ào của bạn vọng khắp hành lang... The TIU đã nghe thấy!','tiu');
    }
  }

  if(S.running) checkEncounter();
  refreshAll();
}

/* ============== WORLD / EVENTS / MONSTER ============== */
function advanceWorld(minutesPassed){
  // decay meter slowly (chậm hơn khi đang Huyết Nguyệt)
  if(!S.enraged){
    S.meter = Math.max(0, S.meter - NIGHT_CFG[S.night].meterDecay*minutesPassed);
  }

  // --- Huyết Nguyệt: kích hoạt khi meter chạm 100% ---
  if(!S.enraged && S.meter>=100){
    S.enraged = true;
    S.enrageUntil = S.gameMinutes + ENRAGE_DURATION_MIN;
    addLog('🩸 HUYẾT NGUYỆT! The TIU đã mất kiểm soát — mọi khu an toàn không còn tác dụng!','danger');
    markActionDirty();
  }
  if(S.enraged && S.gameMinutes >= S.enrageUntil){
    S.enraged = false;
    S.meter = 50;
    addLog('Huyết Nguyệt đã hạ nhiệt... The TIU tạm thời bình thường trở lại.','tiu');
    markActionDirty();
  }

  // --- Thể lực: cạn dần nếu đứng yên trong khu an toàn, hồi lại khi hoạt động ---
  if(isRoomSafe(S.playerRoom)){
    S.stamina = Math.max(0, S.stamina - STAMINA_DRAIN_SAFE*minutesPassed);
  } else {
    S.stamina = Math.min(100, S.stamina + STAMINA_REGEN_ROAM*minutesPassed);
  }
  if(S.stamina<=0){
    if(S.gameMinutes >= S.nextStarveTickAt){
      S.hp--;
      S.stamina = 20;
      S.nextStarveTickAt = S.gameMinutes + STARVE_TICK_MIN;
      addLog('Bạn đói lả vì trốn mãi trong khu an toàn — mất 1 HP! Hãy ra ngoài xử lý sự cố để kiếm đồ ăn.','danger');
      markActionDirty();
      if(S.hp<=0){ refreshHud(); gameOver(); return; }
    }
  }

  // expire unresolved events -> ignored penalty
  for(const room in S.activeEvents){
    if(S.gameMinutes >= S.activeEvents[room].deadline){
      delete S.activeEvents[room];
      S.meter = Math.min(100, S.meter + NIGHT_CFG[S.night].meterGainIgnore);
      addLog('Sự cố tại '+ROOM_DEF[room].name+' đã bị bỏ lỡ! The TIU trở nên bất ổn hơn.','warn');
      markActionDirty();
    }
  }

  // spawn new events
  S.nextEventAt -= minutesPassed;
  if(S.nextEventAt<=0){
    spawnEvent();
    S.nextEventAt = rand(...NIGHT_CFG[S.night].eventEvery);
    markActionDirty();
  }

  // monster movement (can trigger multiple steps if big time jump)
  S.nextMonsterMoveAt -= minutesPassed;
  let guard=0;
  while(S.nextMonsterMoveAt<=0 && guard<6){
    moveMonster();
    const factor = NIGHT_CFG[S.night].meterMoveSpeedFactor;
    const meterSpeed = 1/(1 + S.meter/140);
    S.nextMonsterMoveAt += rand(...NIGHT_CFG[S.night].monsterMoveEvery) * meterSpeed / factor;
    guard++;
  }
  if(S.gameMinutes >= GAME_MINUTES_TOTAL) endNightSuccess();
}

function spawnEvent(){
  // Sự cố luôn do chính The TIU gây ra: nó phải phát sinh ngay tại phòng TIU đang đứng
  // (hoặc phòng liền kề nếu phòng đó đã có sự cố/đang an toàn) — không còn chuyện
  // "sự cố bung ra một nơi, còn TIU lại ở tận một nẻo khác" nữa.
  let room = (!ROOM_DEF[S.monsterRoom].safe && !S.activeEvents[S.monsterRoom]) ? S.monsterRoom : null;
  if(!room){
    const near = ROOM_DEF[S.monsterRoom].connects.filter(k=>!ROOM_DEF[k].safe && !S.activeEvents[k]);
    room = near.length ? pick(near) : null;
  }
  if(!room) return;
  S.activeEvents[room] = {deadline: S.gameMinutes + rand(70,110)};
  addLog('⚠ The TIU gây ra sự cố tại '+ROOM_DEF[room].name+': '+eventLabel(ROOM_DEF[room].event)+'!','warn');
}

/* Đường đi ngắn nhất trên đồ thị phòng (BFS). avoidSafe=true nghĩa là TIU sẽ không
   đi xuyên qua các phòng đang an toàn (trừ khi đó chính là đích). */
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

/* ============== NHẠC CẢNH BÁO KHI THE TIU Ở GẦN (âm thanh 3D theo hướng) ============== */
let proximityAudioEl = null;
let proximityCurVol = 0;
let proximityCurPan = 0;
let audioCtx = null;
let proximityPanner = null;
function initProximityAudio(){
  proximityAudioEl = document.getElementById('tiuProximityAudio');
  if(proximityAudioEl && TIU_PROXIMITY_MUSIC){
    proximityAudioEl.src = TIU_PROXIMITY_MUSIC;
    proximityAudioEl.loop = true;
    proximityAudioEl.volume = 0;
  }
  ensureAudioGraph();
  document.addEventListener('pointerdown', resumeAudioCtx);
  document.addEventListener('keydown', resumeAudioCtx);
}
/* Dựng đồ thị Web Audio: <audio> -> StereoPanner (định vị trái/phải theo hướng The TIU) -> loa.
   Chỉ tạo một lần vì trình duyệt không cho gắn lại MediaElementSource cho cùng 1 thẻ audio. */
function ensureAudioGraph(){
  if(audioCtx || !proximityAudioEl) return;
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    audioCtx = new AC();
    const source = audioCtx.createMediaElementSource(proximityAudioEl);
    if(audioCtx.createStereoPanner){
      proximityPanner = audioCtx.createStereoPanner();
      source.connect(proximityPanner);
      proximityPanner.connect(audioCtx.destination);
    } else {
      source.connect(audioCtx.destination);
    }
  }catch(e){ audioCtx = null; proximityPanner = null; }
}
function resumeAudioCtx(){
  if(audioCtx && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
}
/* Hướng của The TIU so với người chơi trên sơ đồ (trái/phải), dùng tọa độ x của từng phòng
   để tính pan sang trái (-1) hay phải (+1) -> giúp người chơi định vị The TIU đang ở hướng nào. */
function computeProximityPan(){
  if(!S) return 0;
  const p = ROOM_DEF[S.playerRoom], m = ROOM_DEF[S.monsterRoom];
  if(!p || !m || p===m) return 0;
  const dx = m.x - p.x;
  const pan = dx / 45; // ~nửa chiều rộng sơ đồ -> pan gần full trái/phải khi ở 2 đầu bản đồ
  return Math.max(-1, Math.min(1, pan));
}
/* Gọi mỗi khung hình khi ván đang chạy: The TIU cách người chơi 0-1 tòa -> nhạc to nhất,
   càng xa (tới PROXIMITY_FAR_DISTANCE tòa) thì nhạc càng nhỏ dần rồi tắt hẳn.
   Đồng thời pan nhạc sang trái/phải theo hướng The TIU đang ở so với người chơi. */
function updateProximityAudio(){
  if(!proximityAudioEl || !TIU_PROXIMITY_MUSIC) return;
  let target = 0;
  let targetPan = 0;
  if(S && S.running && !S.paused && S.gameMinutes>=S.breakerUntil){
    const d = roomDistance(S.playerRoom, S.monsterRoom);
    if(d<=1) target = 1;
    else if(d>=PROXIMITY_FAR_DISTANCE) target = 0;
    else target = 1 - (d-1)/(PROXIMITY_FAR_DISTANCE-1);
    targetPan = computeProximityPan();
  }
  const masterVol = SETTINGS.masterVolume/100;
  if(window.UIT_SOUND_MUTED) target = 0;
  target *= masterVol;
  proximityCurVol += (target - proximityCurVol) * 0.06; // nhỏ dần / to dần mượt thay vì bật/tắt đột ngột
  if(Math.abs(target-proximityCurVol)<0.004) proximityCurVol = target;
  proximityAudioEl.volume = Math.max(0, Math.min(1, proximityCurVol));
  proximityCurPan += (targetPan - proximityCurPan) * 0.08;
  if(proximityPanner) proximityPanner.pan.value = Math.max(-1, Math.min(1, proximityCurPan));
  if(proximityCurVol > 0.01){
    if(proximityAudioEl.paused) proximityAudioEl.play().catch(()=>{});
  } else if(!proximityAudioEl.paused){
    proximityAudioEl.pause();
  }
}

function moveMonster(){
  if(S.gameMinutes < S.breakerUntil) return; // cầu dao đã ngắt: TIU bị vô hiệu hóa
  const from = S.monsterRoom;
  let opts = ROOM_DEF[from].connects.filter(r=>!isRoomSafe(r));
  if(opts.length===0) opts = ROOM_DEF[from].connects.slice();
  let next;

  if(S.enraged || S.meter>70){
    // >70% (hoặc Huyết Nguyệt): rình rập — bám theo đường đi ngắn nhất tới người chơi
    const path = bfsPath(from, S.playerRoom, !S.enraged);
    if(path && path.length>1) next = path[1];
    else next = pick(opts);
  } else if(S.meter>=30){
    // 30-70%: ưu tiên các phòng đang có sự cố (nơi người chơi khả năng đến)
    const withEvents = opts.filter(r=>S.activeEvents[r]);
    next = withEvents.length ? pick(withEvents) : pick(opts);
  } else {
    // <30%: di chuyển ngẫu nhiên hoàn toàn
    next = pick(opts);
  }

  S.monsterRoom = next;
  S.lastSeenRoom = from;
  S.lastSeenAt = S.gameMinutes;
  addLog('The TIU vừa rời khỏi '+ROOM_DEF[from].name+'...','tiu');
}

function checkEncounter(){
  if(S.gameMinutes < S.invulnUntil) return;
  if(isRoomSafe(S.playerRoom)) return;
  if(S.playerRoom === S.monsterRoom){
    jumpscare();
  }
}

function jumpscare(){
  S.hp--;
  markActionDirty();
  S.paused = true; // đóng băng thế giới trong lúc màn jumpscare đang hiện — người chơi phải bấm "đứng dậy" mới chơi tiếp
  // Giảm I-Frames: chỉ đủ cho đúng 1 lượt di chuyển để trốn thoát
  S.invulnUntil = S.gameMinutes + rand(15,20);
  const caughtRoom = S.playerRoom;
  const hpLeft = S.hp;
  const dead = hpLeft<=0;
  // relocate monster away
  const others = ROOM_KEYS.filter(r=>r!==S.playerRoom && !isRoomSafe(r));
  S.monsterRoom = pick(others.length?others:ROOM_KEYS.filter(r=>r!==S.playerRoom));

  if(SETTINGS.flash){
    document.getElementById('flash').classList.remove('flash-on'); void document.getElementById('flash').offsetWidth;
    document.getElementById('flash').classList.add('flash-on');
  }
  if(SETTINGS.shake){
    document.getElementById('app').classList.remove('shake'); void document.getElementById('app').offsetWidth;
    document.getElementById('app').classList.add('shake');
  }
  addLog('JUMPSCARE! The TIU đã tóm được bạn tại '+ROOM_DEF[caughtRoom].name+'!','danger');

  // fullscreen jumpscare display: TIU lao thẳng vào màn hình, rung lắc, hiện bảng thông báo,
  // rồi TỰ ĐỘNG chuyển tiếp — toàn bộ pha này chỉ kéo dài đúng 1 giây, không cần bấm nút.
  const js = document.getElementById('jumpscareOverlay');
  const jsMonster = document.getElementById('jsMonster');
  const jsPanel = document.getElementById('jsPanel');
  const jsPanelText = document.getElementById('jsPanelText');

  jsMonster.style.backgroundImage = TIU_IMAGE ? `url('${TIU_IMAGE}')` : '';
  jsMonster.classList.toggle('no-img', !TIU_IMAGE);
  jsPanel.classList.remove('show');

  jsPanelText.innerHTML = dead
    ? 'THE TIU ĐÃ TÓM ĐƯỢC BẠN LẦN CUỐI...<span class="jsPanelSub">Bạn gục ngã tại '+ROOM_DEF[caughtRoom].name+'.</span>'
    : 'THE TIU ĐÃ TÓM ĐƯỢC BẠN!<span class="jsPanelSub">Còn lại '+hpLeft+' HP — vừa xảy ra tại '+ROOM_DEF[caughtRoom].name+'</span>';

  js.classList.remove('hidden');
  js.classList.remove('active','lunge'); void js.offsetWidth;
  js.classList.add('active','lunge'); // TIU lao thẳng vào màn hình (0.6s) + màn hình rung lắc (0.4s), chạy song song

  // Bảng thông báo trồi lên ngay sau pha lao vào màn hình
  setTimeout(()=>{ jsPanel.classList.add('show'); }, 650);

  // Đúng 1 giây kể từ lúc bắt đầu jumpscare: tự động đóng lại và chuyển tiếp
  setTimeout(()=>{
    js.classList.add('hidden');
    js.classList.remove('active','lunge');
    jsPanel.classList.remove('show');
    if(dead){
      gameOver();
    } else {
      S.paused = false;
      S.lastTick = performance.now();
      refreshAll();
    }
  }, 1000);
}

/* ============== TICK LOOP (real time) ============== */
let rafId=null;
let lastActionRebuild = 0;
function tick(now){
  if(S && S.running && !S.paused){
    const dtReal = now - S.lastTick;
    S.lastTick = now;
    const dGameMin = dtReal / REAL_MS_PER_GAME_MIN;
    if(dGameMin>0){
      S.gameMinutes += dGameMin;
      advanceWorld(dGameMin);
      if(!S.running){ refreshHud(); refreshMap(); rafId = requestAnimationFrame(tick); return; }
      checkEncounter();
      document.getElementById('blackout').classList.toggle('on', S.gameMinutes < S.breakerUntil);
      document.getElementById('meterOuter').classList.toggle('enraged', S.enraged);
      setRoomTitleGlitch(S.enraged);
      refreshHud();
      refreshMap();
      // full action-pane rebuild only when something actually changed,
      // or at most once a second (for the countdown text) — rebuilding on
      // every animation frame was eating clicks on the item buttons.
      if(actionPaneDirty){
        refreshActionPane();
        actionPaneDirty = false;
        lastActionRebuild = now;
      } else if(now - lastActionRebuild > 1000){
        updateRoomDescOnly();
        lastActionRebuild = now;
      }
    }
  } else if(S){
    S.lastTick = now;
  }
  updateProximityAudio();
  rafId = requestAnimationFrame(tick);
}

/* ============== MINIGAMES ============== */
function startMinigame(room){
  const ev = ROOM_DEF[room].event;
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = eventLabel(ev)+' — '+ROOM_DEF[room].name;
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  body.innerHTML=''; footer.innerHTML='';
  let timerEl = document.getElementById('mgTimer');
  let timeLeft, timerHandle;

  function finish(success){
    clearInterval(timerHandle);
    modal.classList.add('hidden');
    delete S.activeEvents[room];
    if(success){
      S.points += 10 + S.night*5;
      S.meter = Math.max(0, S.meter - 6);
      addLog('Bạn đã xử lý xong sự cố tại '+ROOM_DEF[room].name+'. (+điểm, giảm mức hoạt động)','');
    } else {
      S.meter = Math.min(100, S.meter + NIGHT_CFG[S.night].meterGainFail);
      addLog('Bạn thất bại ở sự cố tại '+ROOM_DEF[room].name+'! The TIU trở nên bất ổn hơn.','warn');
      // Giải sai sự cố: TIU bị thu hút và có tỷ lệ nhảy cóc đến vị trí kề cận phòng đó ngay lập tức
      if(S.gameMinutes>=S.breakerUntil && Math.random()<0.6){
        const adj = ROOM_DEF[room].connects.filter(r=>!isRoomSafe(r));
        const target = adj.length ? pick(adj) : room;
        S.monsterRoom = target;
        S.lastSeenRoom = room;
        S.lastSeenAt = S.gameMinutes;
        addLog('The TIU bị thu hút bởi sự hỗn loạn và nhảy cóc đến gần '+ROOM_DEF[room].name+'!','tiu');
      }
    }
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
}

/* ============== SHOP (Canteen) ============== */
function openShop(){
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent='QUẦY CĂN TIN';
  document.getElementById('mgTimer').textContent='';
  const body=document.getElementById('mgBody');
  const footer=document.getElementById('mgFooter');
  footer.innerHTML='';
  function render(){
    body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Điểm hiện có: <span id="pointsVal">${S.points}</span></p>
    <div id="shopBody">
      <div class="shopItem"><span>Bim Bim (hồi 1 HP) — 20đ</span><button class="btn primary" id="buyBim">Mua</button></div>
      <div class="shopItem"><span>Nước tăng lực (buff tốc độ) — 15đ</span><button class="btn primary" id="buyWater">Mua</button></div>
      <div class="shopItem"><span>Suất ăn khuya (+50 Thể lực) — 10đ</span><button class="btn primary" id="buyFood">Mua</button></div>
      <div class="shopItem"><span>Camera Sinh viên (định vị TIU 3 lượt) — 100đ</span><button class="btn primary" id="buyCam">Mua</button></div>
      <div class="shopItem"><span>Sập Cầu Dao (vô hiệu hóa TIU 60p) — 150đ</span><button class="btn primary" id="buyBreaker">Mua</button></div>
    </div>`;
    document.getElementById('buyBim').onclick=()=>{
      if(S.points>=20){ S.points-=20; S.inventory.bimbim++; addLog('Bạn mua Bim Bim tại Căn tin.',''); refreshAll(); render(); }
    };
    document.getElementById('buyWater').onclick=()=>{
      if(S.points>=15){ S.points-=15; S.inventory.water++; addLog('Bạn mua Nước tăng lực tại Căn tin.',''); refreshAll(); render(); }
    };
    document.getElementById('buyFood').onclick=()=>{
      if(S.points>=10){ S.points-=10; S.stamina=Math.min(100,S.stamina+50); addLog('Bạn ăn một suất ăn khuya, hồi thể lực.',''); refreshAll(); render(); }
    };
    document.getElementById('buyCam').onclick=()=>{
      if(S.points>=100){ S.points-=100; S.inventory.camera++; addLog('Bạn mua Camera Sinh viên tại Căn tin.',''); refreshAll(); render(); }
    };
    document.getElementById('buyBreaker').onclick=()=>{
      if(S.points>=150){ S.points-=150; S.inventory.breaker++; addLog('Bạn mua một bộ Sập Cầu Dao tại Căn tin.',''); refreshAll(); render(); }
    };
  }
  render();
  const closeBtn=document.createElement('button');
  closeBtn.className='btn'; closeBtn.textContent='Đóng';
  closeBtn.onclick=()=>modal.classList.add('hidden');
  footer.appendChild(closeBtn);
}

/* ============== END STATES ============== */
function gameOver(){
  S.running=false;
  document.getElementById('goSub').textContent = 'Bạn đã sống sót đến '+formatClock(S.gameMinutes)+' trong '+NIGHT_CFG[S.night].name+'.';
  document.getElementById('gameOverScreen').classList.remove('hidden');
}
function endNightSuccess(){
  if(!S.running) return;
  S.running=false;
  playVN(VN_OUTRO[S.night], showEndScreen);
}
function showEndScreen(){
  if(S.standalone){
    document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
    document.getElementById('winSub').textContent=NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại.';
    document.getElementById('nextNightBtn').textContent='CHƠI LẠI ĐÊM NÀY';
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); beginNight(S.night,true); };
  } else if(S.night>=3){
    document.getElementById('winTitle').textContent='BẠN ĐÃ SỐNG SÓT QUA 3 ĐÊM';
    document.getElementById('winSub').textContent='Phòng trọ giờ đã sẵn sàng để dọn vào. The TIU tạm thời im lặng... cho đến đêm sau.';
    document.getElementById('nextNightBtn').textContent='CHƠI LẠI TỪ ĐẦU';
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); showTitle(); };
  } else {
    document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
    document.getElementById('winSub').textContent=NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại. Chuẩn bị cho đêm lẩn trốn tiếp theo — The TIU sẽ hung hãn hơn.';
    document.getElementById('nextNightBtn').textContent='BẮT ĐẦU ĐÊM '+(S.night+1);
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); beginNight(S.night+1); };
  }
  document.getElementById('winScreen').classList.remove('hidden');
}

/* ============== FLOW ============== */
function refreshAll(){
  refreshHud(); refreshMap(); refreshActionPane();
}
function beginNight(n, standalone){
  S = freshState(n);
  S.standalone = !!standalone;
  addLog('Ca trực '+NIGHT_CFG[n].name+' bắt đầu lúc 00:00. Bạn xuất phát tại '+ROOM_DEF[S.playerRoom].name+'.','');
  buildMap();
  refreshAll();
  hideAllOverlays();
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('blackout').classList.remove('on');
  document.getElementById('meterOuter').classList.remove('enraged');
  setRoomTitleGlitch(false);
  playVN(VN_INTRO[n], ()=>{});
}
function hideAllOverlays(){
  ['titleScreen','nightSelectScreen','settingsScreen','gameOverScreen','winScreen'].forEach(id=>{
    document.getElementById(id).classList.add('hidden');
  });
}
function showTitle(){
  hideAllOverlays();
  document.getElementById('titleScreen').classList.remove('hidden');
}

const NIGHT_DESCR = {
  1:"Khởi động nhẹ — sự cố thưa, The TIU còn chậm chạp.",
  2:"Nhịp độ tăng — sự cố dày hơn, The TIU di chuyển nhanh hơn.",
  3:"Đêm cuối — sự cố dồn dập, The TIU gần như không nghỉ."
};
function buildNightSelect(){
  const wrap = document.getElementById('nightCardWrap');
  wrap.innerHTML='';
  [1,2,3].forEach(n=>{
    const card=document.createElement('div');
    card.className='nightCard';
    card.innerHTML = `<b>${NIGHT_CFG[n].name}</b><span>${NIGHT_DESCR[n]}</span>`;
    card.onclick=()=>{ hideAllOverlays(); beginNight(n, true); };
    wrap.appendChild(card);
  });
}

function buildSettings(){
  const wrap = document.getElementById('settingsWrap');
  const rows = [
    {key:'shake', label:'Rung màn hình', desc:'Rung khi bị The TIU jumpscare.'},
    {key:'flash', label:'Hiệu ứng chớp đỏ', desc:'Chớp đỏ toàn màn hình khi bị bắt.'},
    {key:'crt', label:'Hiệu ứng CRT / nhiễu', desc:'Lớp phủ quét dòng kiểu camera an ninh.'},
  ];
  wrap.innerHTML='';

  const volRow=document.createElement('div');
  volRow.className='settingRow';
  volRow.innerHTML = `<div><div class="slabel">Âm lượng tổng</div><div class="sdesc">Chỉnh âm lượng chung của trò chơi (nhạc cảnh báo The TIU, v.v.).</div></div>
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
    resumeAudioCtx();
  };

  rows.forEach(r=>{
    const row=document.createElement('div');
    row.className='settingRow';
    row.innerHTML = `<div><div class="slabel">${r.label}</div><div class="sdesc">${r.desc}</div></div>
      <div class="toggle ${SETTINGS[r.key]?'on':''}" id="tg-${r.key}"><div class="knob"></div></div>`;
    wrap.appendChild(row);
    row.querySelector('.toggle').onclick=()=>{
      SETTINGS[r.key] = !SETTINGS[r.key];
      row.querySelector('.toggle').classList.toggle('on', SETTINGS[r.key]);
      document.getElementById('crt').style.display = SETTINGS.crt ? '' : 'none';
    };
  });
}

let settingsOrigin = 'title'; // 'title' | 'pause' — controls where the "back" button on the Settings screen returns to

document.getElementById('startBtn').onclick=()=>{ hideAllOverlays(); beginNight(1,false); };
document.getElementById('selectNightBtn').onclick=()=>{
  hideAllOverlays(); buildNightSelect();
  document.getElementById('nightSelectScreen').classList.remove('hidden');
};
document.getElementById('settingsBtn').onclick=()=>{
  settingsOrigin = 'title';
  hideAllOverlays(); buildSettings();
  document.getElementById('settingsScreen').classList.remove('hidden');
};
document.getElementById('backFromSelect').onclick = showTitle;
document.getElementById('backFromSettings').onclick = ()=>{
  document.getElementById('settingsScreen').classList.add('hidden');
  if(settingsOrigin==='pause'){
    document.getElementById('pauseMenu').classList.remove('hidden');
  } else {
    showTitle();
  }
};
document.getElementById('retryBtn').onclick=()=>{
  document.getElementById('gameOverScreen').classList.add('hidden');
  beginNight(S.night, S.standalone);
};
document.getElementById('menuFromGameOver').onclick = showTitle;
document.getElementById('menuFromWin').onclick = showTitle;

/* ============== PAUSE MENU (ESC) ============== */
function isBlockingOverlayOpen(){
  return ['mgModal','mapModal','vnOverlay','jumpscareOverlay','gameOverScreen','winScreen','settingsScreen']
    .some(id=>!document.getElementById(id).classList.contains('hidden'));
}
function openPauseMenu(){
  if(!S || !S.running) return;
  if(isBlockingOverlayOpen()) return;
  S.paused = true;
  document.getElementById('pauseMenu').classList.remove('hidden');
}
function closePauseMenu(){
  document.getElementById('pauseMenu').classList.add('hidden');
  if(!S) return;
  S.paused = false;
  S.lastTick = performance.now();
}
document.getElementById('pauseResumeBtn').onclick = closePauseMenu;
document.getElementById('pauseSettingsBtn').onclick = ()=>{
  document.getElementById('pauseMenu').classList.add('hidden');
  settingsOrigin = 'pause';
  buildSettings();
  document.getElementById('settingsScreen').classList.remove('hidden');
};
document.getElementById('pauseMainMenuBtn').onclick = ()=>{
  document.getElementById('pauseMenu').classList.add('hidden');
  if(S) S.running = false;
  showTitle();
};
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  if(!S || !S.running) return;
  const pauseMenuOpen = !document.getElementById('pauseMenu').classList.contains('hidden');
  if(pauseMenuOpen){
    e.preventDefault();
    closePauseMenu();
  } else if(!isBlockingOverlayOpen()){
    e.preventDefault();
    openPauseMenu();
  }
});

document.getElementById('miniMapExpand').onclick=()=>{
  document.getElementById('mapModal').classList.remove('hidden');
  buildMap();
  refreshMap();
};
document.getElementById('closeMapBtn').onclick=()=>{
  document.getElementById('mapModal').classList.add('hidden');
};

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

buildMap();
initProximityAudio();
rafId = requestAnimationFrame(tick);

})();