(function(){
"use strict";

/* ============== CONFIG ============== */
const ROOM_DEF = {
  A:      {name:"TÒA A", sub:"Hội trường", x:30, y:76, connects:["LIB","E","B"], event:"stage"},
  B:      {name:"TÒA B", sub:"7 tầng", x:26, y:44, connects:["A","C","E","CANTEEN","PARK"], event:"floors"},
  C:      {name:"TÒA C", sub:"Tủ điện", x:58, y:44, connects:["B","D","E","CANTEEN"], event:"wire"},
  D:      {name:"TÒA D", sub:"Ban chỉ huy", x:80, y:14, connects:["C","FIELD"], event:"quiz"},
  E:      {name:"TÒA E", sub:"11 tầng", x:56, y:70, connects:["A","B","C","FIELD"], event:"wibu"},
  LIB:    {name:"THƯ VIỆN", sub:"Kho sách", x:9, y:88, connects:["A","PARK"], event:"books"},
  CANTEEN:{name:"CĂN TIN", sub:"Khu an toàn", x:44, y:20, connects:["B","C"], safe:true},
  PARK:   {name:"CHỖ GỬI XE", sub:"Bãi giữ xe", x:7, y:55, connects:["LIB","B"], event:"bikes", noEvent:true},
  FIELD:  {name:"SÂN BÓNG", sub:"Sân thể thao ngoài trời", x:86, y:60, connects:["D","E"], event:"ball", noEvent:true}
};
const ROOM_KEYS = Object.keys(ROOM_DEF);

/* Sprite riêng cho từng NPC — điền URL ảnh vào đây để thay avatar chữ cái mặc định,
   ví dụ: E:"images/wibu.png" */
const NPC_IMAGES = { E:"", B:"", TRONG:"" };

// Ảnh riêng cho từng phòng — thay các URL này bằng ảnh của bạn (đặt file vào cùng thư mục
// với file HTML này và sửa đường dẫn bên dưới, ví dụ: A:"images/nha-a.jpg").
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
// Ảnh riêng cho từng phòng LÚC BUỔI SÁNG — dùng cho đoạn epilogue sau khi kết thúc thành
// công (đêm 3 sinh tồn bình thường HOẶC secret ending). Điền URL ảnh chụp ban ngày của
// từng tòa vào đây, ví dụ: A:"assets/images/ToaA-day.png". Để trống thì sẽ tự dùng lại
// ảnh ban đêm (ROOM_IMAGES) làm ảnh dự phòng.
const ROOM_IMAGES_DAY = {
  A:"assets/images/ToaAs.png",
  B:"assets/images/ToaBs.png", 
  C:"assets/images/ToaCs.png", 
  D:"assets/images/ToaDs.png", 
  E:"assets/images/ToaEs.png", 
  LIB:"assets/images/libs.png", 
  CANTEEN:"assets/images/cts.png", 
  PARK:"", 
  FIELD:""
};

// Khung giờ của đoạn epilogue (buổi sáng cuối cùng, sau khi kết thúc thành công): đồng hồ
// bắt đầu từ 15:00 và không vượt quá 18:00. Thời gian chỉ trôi khi người chơi di chuyển
// (xem epilogueMove) — không đếm theo thời gian thực như lúc đang trốn ban đêm.
const EPILOGUE_START_MIN = 15*60;
const EPILOGUE_END_MIN = 18*60;

// Ảnh quái vật The TIU dùng cho pha jumpscare toàn màn hình — điền đường dẫn PNG vào đây,
// ví dụ: 'assets/images/tiu-monster.png'. Để trống thì sẽ hiện icon dự phòng.
const TIU_IMAGE = "assets/images/TIU.png";

// SFX phát đúng lúc The TIU lao ra khỏi màn hình (jumpscare) — điền đường dẫn file âm thanh
// vào đây, ví dụ: 'assets/sfx/jumpscare.mp3'. Để trống thì sẽ không phát SFX (chỉ có hiệu ứng hình).
const TIU_JUMPSCARE_SFX = "assets/sfx/TIUAttack.mp3";

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
  CANTEEN:"linear-gradient(135deg,#0f2418,#0c1712)",
  PARK:"linear-gradient(135deg,#1a1c14,#100f0c)",
  FIELD:"linear-gradient(135deg,#0e2018,#0c1410)"
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

/* ---- Thể lực ---- */
const MOVE_STAMINA_COST = 25;        // % thể lực tiêu hao mỗi lần di chuyển (bình thường)
const MOVE_STAMINA_COST_BUFFED = 15; // % thể lực tiêu hao mỗi lần di chuyển khi có buff Nước tăng lực
const STAMINA_REGEN_IDLE = 1;        // mỗi phút game đứng yên (không di chuyển) hồi 1% thể lực
const STARVE_TICK_MIN = 55;          // cạn thể lực -> mất máu mỗi X phút game

/* ---- Huyết Nguyệt ---- */
const ENRAGE_DURATION_MIN = 100;   // Huyết Nguyệt kéo dài bao lâu (phút game) trước khi hạ nhiệt

/* ---- Tiếng ồn khi có buff tốc độ ---- */
const NOISE_ATTRACT_CHANCE = 0.35;

/* ---- Giới hạn tài nguyên an toàn: số Bim Bim tối đa có thể mua tại Căn tin MỖI ĐÊM.
   Giảm dần qua từng đêm để buộc người chơi không thể chỉ camping mua Bim Bim hồi máu
   mà phải ra ngoài đối mặt với The TIU để lấy điểm/vật phẩm khác. ---- */
const BIMBIM_NIGHT_LIMIT = [null, 3, 2, 1];

/* ============== GIAI ĐOẠN ĐÊM (PHASED NIGHT) ==============
   Đêm được chia làm 3 mốc theo tỉ lệ thời lượng đêm (00:00 -> 07:30 trong game):
   Giai đoạn 1 "KHỞI ĐỘNG" (0% -> 37.5%, tương ứng ~00:00-02:49): tuần tra, thu gom, xử lý
   sự cố nhỏ như bình thường.
   Giai đoạn 2 "BIẾN CỐ TRUNG TÂM" (37.5% -> 75%, ~02:49-05:37): kích hoạt sự cố mất điện
   toàn trường, buộc phải đến Phòng Kỹ Thuật (Tòa C) để khởi động lại cầu dao tổng.
   Giai đoạn 3 "SĂN ĐUỔI DỒN DẬP" (75% -> 100%, ~05:37-07:30): The TIU di chuyển nhanh hơn
   hẳn, một số cửa nối giữa các tòa bị khóa ngẫu nhiên. ---- */
const PHASE_NAMES = {1:'KHỞI ĐỘNG', 2:'BIẾN CỐ TRUNG TÂM', 3:'SĂN ĐUỔI DỒN DẬP'};
function getPhase(gmin){
  const total = GAME_MINUTES_TOTAL;
  if(gmin < total*0.375) return 1;
  if(gmin < total*0.75) return 2;
  return 3;
}

/* ---- Thu gom & Chế tạo (Scavenging & Crafting) ---- */
const COMPONENT_TYPES = ['pin','wire','tape','pipe'];
const COMPONENT_NAMES = {pin:'Pin cũ', wire:'Dây điện', tape:'Băng keo', pipe:'Ống thép'};
const CRAFTING_RECIPES = {
  camera:    {label:'Camera Sinh viên (định vị TIU 3 lượt)', need:{wire:2, tape:1}, give:()=>{ S.inventory.camera++; }},
  breaker:   {label:'Bộ Sập Cầu Dao (vô hiệu hóa TIU 60p)',  need:{pin:2, pipe:1},  give:()=>{ S.inventory.breaker++; }},
  uvlight:   {label:'Đèn chiếu UV (làm choáng The TIU)',     need:{pin:1, pipe:1},  give:()=>{ S.inventory.uvlight++; }},
  noisetrap: {label:'Bẫy gây nhiễu (thu hút TIU đi nơi khác)', need:{wire:1, tape:1}, give:()=>{ S.inventory.noisetrap++; }}
};

/* ---- Nhiệm vụ điều tra phụ (Lore Sub-quests) ---- */
const LORE_CLUES = [
  {id:'diary1', title:'Nhật ký cũ — Trang xé vội', text:'"...tôi thấy nó lần đầu tiên ở hành lang Tòa E, ánh mắt nó không giống người..."'},
  {id:'audio1', title:'Đĩa ghi âm bảo vệ ca đêm', text:'Giọng nói rè rè phát ra từ chiếc đĩa cũ: "...báo cáo 2 giờ 15, phát hiện tiếng động lạ tại Tòa C, sau đó... [tạp âm]..."'},
  {id:'safe1', title:'Mật mã két sắt phòng quản lý', text:'Một mảnh giấy nhàu nát ghi vội: "Mã két: 0 - 4 - 1 - 9. Đừng để ai khác thấy cái này."'},
  {id:'diary2', title:'Nhật ký cũ — Trang thứ hai', text:'"...The TIU không phải lúc nào cũng như vậy. Có ai đó đã làm gì với nó, từ rất lâu rồi..."'},
  {id:'audio2', title:'Đoạn ghi âm cuối cùng', text:'"...nếu ai nghe được đoạn này, đừng xuống Tòa C một mình sau 1 giờ sáng. Đừng đi một mình..."'},
  {id:'note1', title:'Mẩu giấy nhét trong sách thư viện', text:'"Ba mảnh La Peace có thể xoa dịu nó. Nhưng phải có đủ cả ba, không thể thiếu một."'}
];

/* Những manh mối đã tìm thấy xuyên suốt lượt chơi thường (đêm 1 -> 3), reset khi bắt đầu
   lại từ Đêm 1 (giống campaignLaPeace / campaignNpcTalks). */
let campaignLoreFound = new Set();

function pickDistinctRooms(pool, n){
  const arr = shuffle(pool.slice());
  return arr.slice(0, Math.min(n, arr.length));
}

/* ============== STATE ============== */
let S = null;

function freshState(night){
  const startRoom = ROOM_KEYS[Math.floor(Math.random()*ROOM_KEYS.length)];
  let monsterRoom = ROOM_KEYS.filter(r=>r!==startRoom && !ROOM_DEF[r].safe)[Math.floor(Math.random()*4)];
  // --- La Peace: mảnh năng lượng ôn hòa, 1 mảnh ẩn xuất hiện ngẫu nhiên mỗi đêm.
  // Chỗ Gửi Xe và Sân Bóng có tỉ lệ xuất hiện La Peace cao hơn hẳn các khu vực khác. ---
  const peaceSpots = ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe && r!==startRoom);
  const laPeaceRoom = weightedPeaceRoom(peaceSpots.length ? peaceSpots : ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe));

  // --- Thu gom: rải linh kiện ngẫu nhiên vào các góc tối (tối đa 5 phòng không an toàn) ---
  const nonSafeRooms = ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe);
  const scavengeRooms = pickDistinctRooms(nonSafeRooms, Math.min(5, nonSafeRooms.length));
  const scavenge = {};
  scavengeRooms.forEach(r=>{ scavenge[r] = pick(COMPONENT_TYPES); });

  // --- Lore: rải 2 manh mối (nhật ký/đĩa ghi âm/mật mã) chưa từng nhặt vào các phòng còn lại ---
  const loreRoomsPool = nonSafeRooms.filter(r=>!scavengeRooms.includes(r));
  const availableClueIds = LORE_CLUES.map(c=>c.id).filter(id=>!campaignLoreFound.has(id));
  const loreCount = Math.min(2, availableClueIds.length, loreRoomsPool.length);
  const chosenClueIds = shuffle(availableClueIds.slice()).slice(0, loreCount);
  const chosenLoreRooms = pickDistinctRooms(loreRoomsPool, loreCount);
  const loreClues = {};
  chosenClueIds.forEach((id,i)=>{ loreClues[chosenLoreRooms[i]] = id; });

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
    activeEvents: {}, // roomKey -> {deadline(gameMin), start(gameMin)}
    lastSeenRoom: null,
    lastSeenAt: 0,
    inventory: {bimbim:1, water:0, camera:0, breaker:0, uvlight:0, noisetrap:0},
    bimbimBoughtTonight: 0, // reset mỗi đêm — xem BIMBIM_NIGHT_LIMIT
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
    introShown: false,
    // --- La Peace (mảnh năng lượng ôn hòa) ---
    laPeaceRoom: laPeaceRoom,
    laPeaceFound: false,
    // --- Giai đoạn đêm (phased night) ---
    phase: 1,
    gridDown: false,
    gridIncidentActive: false,
    gridIncidentDone: false,
    frenzyStarted: false,
    lockedDoors: {}, // edgeKey -> true
    // --- Thu gom & chế tạo ---
    components: {pin:0, wire:0, tape:0, pipe:0},
    scavenge: scavenge,       // roomKey -> component type còn nằm đó
    noiseTrap: null,          // {room, until}
    // --- Lore sub-quests ---
    loreClues: loreClues      // roomKey -> clue id còn nằm đó
  };
}

/* Tổng số La Peace đã nhặt được xuyên suốt lượt chơi thường (đêm 1 -> 3).
   Được đặt về 0 mỗi khi bắt đầu lại từ Đêm 1, giữ nguyên khi tiếp tục sang đêm sau. */
let campaignLaPeace = 0;

/* Những đêm mà người chơi đã nói chuyện với Wibu Việt Nhật (E) / Chàng Lính Ngu Lắm (B),
   xuyên suốt lượt chơi thường (đêm 1 -> 3). Cả hai đều cần đủ 3/3 đêm (cùng với đủ 3 La
   Peace) thì mới đủ điều kiện mở khóa secret ending khi gặp Trọng — xem talkToNPC().
   Được đặt lại mỗi khi bắt đầu lại từ Đêm 1, giữ nguyên khi tiếp tục sang đêm sau. */
let campaignNpcTalks = { E: new Set(), B: new Set() };

function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

/* Chỗ Gửi Xe & Sân Bóng có tỉ lệ xuất hiện La Peace cao hơn: mỗi phòng trong danh sách
   này được nhân trọng số LA_PEACE_HOTSPOT_WEIGHT lần so với các phòng thường khác. */
const LA_PEACE_HOTSPOTS = ['PARK','FIELD'];
const LA_PEACE_HOTSPOT_WEIGHT = 3;
function weightedPeaceRoom(candidates){
  const weighted = [];
  candidates.forEach(r=>{
    const w = LA_PEACE_HOTSPOTS.includes(r) ? LA_PEACE_HOTSPOT_WEIGHT : 1;
    for(let i=0;i<w;i++) weighted.push(r);
  });
  return pick(weighted);
}
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
  if(S.epilogue) return null;
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
    const unlockSecret = !S.standalone && campaignLaPeace>=3
      && campaignNpcTalks.E.size>=3 && campaignNpcTalks.B.size>=3;
    playVN(TRONG_DIALOGUE.lines, ()=>{
      applyVNReward(TRONG_DIALOGUE.reward);
      if(unlockSecret){
        playVN(TRONG_SECRET_DIALOGUE.lines, ()=>{ startSecretBattle(); });
      } else {
        refreshActionPane();
      }
    });
  } else {
    const entry = NPC_DIALOGUES[meta.key][S.night];
    S.npcSeen[meta.key] = S.night;
    if(meta.key==='E' || meta.key==='B') campaignNpcTalks[meta.key].add(S.night);
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
  document.getElementById('nightBadge').textContent = S.epilogue ? 'BUỔI SÁNG' : NIGHT_CFG[S.night].name;
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
  if(S.epilogue){
    tiuEl.textContent = '—';
    tiuEl.style.color = 'var(--text-dim)';
  } else if(S.cameraMovesLeft>0){
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

function roomDescExtras(def){
  let desc = def.sub;
  const ev = S.activeEvents[S.playerRoom];
  if(ev){
    if(ev.mandatory){
      desc += ` — ⚡ CẦU DAO TỔNG ĐANG NGẮT: phải khởi động lại ngay`;
    } else {
      const left = Math.max(0, Math.ceil(ev.deadline - S.gameMinutes));
      desc += ` — SỰ CỐ ĐANG DIỄN RA (còn ~${left} phút để xử lý)`+(ev.chainedFrom?' [sự cố dây chuyền]':'');
    }
  }
  if(def.safe && !isRoomSafe(S.playerRoom)){
    desc += ` — Căn tin chỉ mở cửa lúc 01:00-02:00 và 04:00-05:00.`;
  }
  if(S.laPeaceRoom===S.playerRoom && !S.laPeaceFound){
    desc += ` — ✦ Một luồng năng lượng kỳ lạ, ấm áp phảng phất đâu đây...`;
  }
  if(S.scavenge[S.playerRoom]){
    desc += ` — 🔧 Có vẻ như có vật gì đó nằm trong góc tối...`;
  }
  if(S.loreClues[S.playerRoom]){
    desc += ` — 📖 Một vật gì đó khác thường nằm sót lại trong phòng...`;
  }
  return desc;
}

function updateRoomDescOnly(){
  if(!S || S.epilogue) return;
  const def = ROOM_DEF[S.playerRoom];
  const el = document.getElementById('roomDesc');
  if(el) el.textContent = roomDescExtras(def);
}

function refreshActionPane(){
  if(S.epilogue){ renderEpilogueActionPane(); return; }
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
  const curEvent = S.activeEvents[S.playerRoom];
  const hasEvent = !!curEvent;
  resolveBtn.classList.toggle('show', hasEvent);
  if(hasEvent){
    resolveBtn.textContent = curEvent.mandatory ? '⚡ KHỞI ĐỘNG LẠI CẦU DAO TỔNG' : '⚠ XỬ LÝ: '+eventLabel(def.event);
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

  document.getElementById('roomDesc').textContent = roomDescExtras(def);

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
    const locked = isEdgeLocked(S.playerRoom, c);
    const b=document.createElement('button');
    b.className='btn'+(locked?' danger':'');
    b.textContent=(locked?'🔒 ':'➜ ')+ROOM_DEF[c].name;
    b.onclick=()=> locked ? attemptUnlockDoor(c) : movePlayer(c);
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

    const bench=document.createElement('button');
    bench.className='btn';
    bench.textContent='🛠 Bàn chế tạo';
    bench.onclick=openCraftBench;
    itemGroup.row.appendChild(bench);
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
  useWater.textContent='Uống Nước tăng lực (buff tốc độ, đỡ hao thể lực, gây tiếng ồn)';
  useWater.disabled = S.inventory.water<=0;
  useWater.onclick=()=>{
    if(S.inventory.water>0){
      S.inventory.water--; S.speedBuffUntil = S.gameMinutes + 90;
      addLog('Bạn uống Nước tăng lực — di chuyển nhanh hơn và chỉ tốn '+MOVE_STAMINA_COST_BUFFED+'% thể lực mỗi lần di chuyển trong 90 phút, nhưng bước chân sẽ ồn hơn.','');
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

  const useUV=document.createElement('button');
  useUV.className='btn';
  useUV.textContent='💡 Dùng Đèn UV (làm choáng TIU nếu ở gần)';
  useUV.disabled = S.inventory.uvlight<=0;
  useUV.onclick=useUVLight;
  itemGroup.row.appendChild(useUV);

  const useNoise=document.createElement('button');
  useNoise.className='btn';
  useNoise.textContent='📢 Đặt Bẫy gây nhiễu tại đây';
  useNoise.disabled = S.inventory.noisetrap<=0;
  useNoise.onclick=useNoiseTrap;
  itemGroup.row.appendChild(useNoise);

  if(S.laPeaceRoom===S.playerRoom && !S.laPeaceFound){
    const usePeace=document.createElement('button');
    usePeace.className='btn peace';
    usePeace.textContent='✦ Nhặt La Peace (mảnh năng lượng ôn hòa)';
    usePeace.onclick=pickupLaPeace;
    itemGroup.row.appendChild(usePeace);
  }

  if(S.scavenge[S.playerRoom]){
    const type = S.scavenge[S.playerRoom];
    const usePickup=document.createElement('button');
    usePickup.className='btn peace';
    usePickup.textContent='🔧 Nhặt '+COMPONENT_NAMES[type]+' trong góc tối';
    usePickup.onclick=pickupScavenge;
    itemGroup.row.appendChild(usePickup);
  }

  if(S.loreClues[S.playerRoom]){
    const useLore=document.createElement('button');
    useLore.className='btn peace';
    useLore.textContent='📖 Thu thập manh mối';
    useLore.onclick=pickupLore;
    itemGroup.row.appendChild(useLore);
  }
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
                    <div class="itemChip">Đèn UV: <b>${S.inventory.uvlight}</b></div>
                    <div class="itemChip">Bẫy gây nhiễu: <b>${S.inventory.noisetrap}</b></div>
                    <div class="itemChip">Linh kiện: <b>${COMPONENT_TYPES.map(k=>COMPONENT_NAMES[k]+' '+S.components[k]).join(' / ')}</b></div>
                    <div class="itemChip">Manh mối: <b>${campaignLoreFound.size}/${LORE_CLUES.length}</b></div>
                    <div class="itemChip">Giai đoạn: <b>${PHASE_NAMES[S.phase]}</b></div>
                    <div class="itemChip">Buff tốc độ: <b>${S.gameMinutes<S.speedBuffUntil?'ĐANG BẬT':'—'}</b></div>
                    <div class="itemChip">Thể lực: <b>${Math.round(Math.max(0,S.stamina))}%</b></div>
                    <div class="itemChip">La Peace: <b>${campaignLaPeace}/3</b></div>
                    <div class="itemChip">Tin tưởng Wibu Việt Nhật: <b>${campaignNpcTalks.E.size}/3</b></div>
                    <div class="itemChip">Tin tưởng Chàng Lính: <b>${campaignNpcTalks.B.size}/3</b></div>`;
}

/* ============== LA PEACE (vật phẩm ẩn) ============== */
function pickupLaPeace(){
  if(!S || S.laPeaceFound || S.playerRoom!==S.laPeaceRoom) return;
  S.laPeaceFound = true;
  campaignLaPeace++;
  addLog('✦ Bạn tìm thấy một mảnh La Peace (năng lượng ôn hòa) ẩn tại '+ROOM_DEF[S.playerRoom].name+'! ('+campaignLaPeace+'/3)', '');
  markActionDirty();
  refreshHud(); refreshActionPane();
}

/* ============== THU GOM & CHẾ TẠO (Scavenging & Crafting) ============== */
function pickupScavenge(){
  if(!S || !S.scavenge[S.playerRoom]) return;
  const type = S.scavenge[S.playerRoom];
  S.components[type] = (S.components[type]||0)+1;
  delete S.scavenge[S.playerRoom];
  addLog('🔧 Bạn nhặt được '+COMPONENT_NAMES[type]+' trong một góc tối tại '+ROOM_DEF[S.playerRoom].name+'.', '');
  markActionDirty();
  refreshHud(); refreshActionPane();
}

function openCraftBench(){
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = '🛠 BÀN CHẾ TẠO';
  document.getElementById('mgTimer').textContent = '';
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  footer.innerHTML = '';
  function render(){
    const compLine = COMPONENT_TYPES.map(k=>COMPONENT_NAMES[k]+': <b>'+S.components[k]+'</b>').join(' &nbsp;|&nbsp; ');
    body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Linh kiện hiện có: ${compLine}</p><div id="craftList"></div>`;
    const list = body.querySelector('#craftList');
    Object.keys(CRAFTING_RECIPES).forEach(key=>{
      const r = CRAFTING_RECIPES[key];
      const needText = Object.keys(r.need).map(c=>COMPONENT_NAMES[c]+' x'+r.need[c]).join(', ');
      const can = Object.keys(r.need).every(c=>S.components[c]>=r.need[c]);
      const row = document.createElement('div');
      row.className='shopItem';
      row.innerHTML = `<span>${r.label} <span style="font-size:11px;color:var(--text-dim);">(cần ${needText})</span></span>`;
      const btn = document.createElement('button');
      btn.className='btn primary'; btn.textContent = can ? 'Chế tạo' : 'Thiếu linh kiện';
      btn.disabled = !can;
      btn.onclick=()=>{
        Object.keys(r.need).forEach(c=>{ S.components[c]-=r.need[c]; });
        r.give();
        addLog('Bạn đã chế tạo thành công: '+r.label+'.', '');
        markActionDirty();
        refreshAll(); render();
      };
      row.appendChild(btn);
      list.appendChild(row);
    });
  }
  render();
  const closeBtn = document.createElement('button');
  closeBtn.className='btn'; closeBtn.textContent='Đóng';
  closeBtn.onclick=()=>modal.classList.add('hidden');
  footer.appendChild(closeBtn);
}

function useUVLight(){
  if(!S || S.inventory.uvlight<=0) return;
  const dist = roomDistance(S.playerRoom, S.monsterRoom);
  if(dist<=1){
    S.inventory.uvlight--;
    const far = ROOM_KEYS.filter(r=>r!==S.playerRoom && !isRoomSafe(r) && roomDistance(S.playerRoom,r)>=2);
    S.monsterRoom = far.length ? pick(far) : S.monsterRoom;
    S.invulnUntil = S.gameMinutes + 12;
    addLog('💡 Bạn chiếu thẳng đèn UV vào The TIU — nó bị choáng và lùi ra xa!', '');
  } else {
    addLog('The TIU hiện không ở gần đây — đèn UV chưa phát huy tác dụng lúc này.', '');
  }
  markActionDirty();
  refreshHud(); refreshActionPane();
}

function useNoiseTrap(){
  if(!S || S.inventory.noisetrap<=0) return;
  S.inventory.noisetrap--;
  S.noiseTrap = {room:S.playerRoom, until:S.gameMinutes+70};
  addLog('📢 Bạn đặt Bẫy gây nhiễu tại '+ROOM_DEF[S.playerRoom].name+' — The TIU có thể sẽ bị thu hút tới đó thay vì bạn.', '');
  markActionDirty();
  refreshHud(); refreshActionPane();
}

/* ============== NHIỆM VỤ ĐIỀU TRA PHỤ (Lore Sub-quests) ============== */
function pickupLore(){
  if(!S || !S.loreClues[S.playerRoom]) return;
  const clueId = S.loreClues[S.playerRoom];
  const clue = LORE_CLUES.find(c=>c.id===clueId);
  delete S.loreClues[S.playerRoom];
  campaignLoreFound.add(clueId);
  addLog('📖 Bạn tìm thấy một manh mối ẩn tại '+ROOM_DEF[S.playerRoom].name+'. ('+campaignLoreFound.size+'/'+LORE_CLUES.length+')', '');
  markActionDirty();
  refreshHud(); refreshActionPane();
  showLoreOverlay(clue);
}

function showLoreOverlay(clue){
  if(!clue) return;
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = '📖 '+clue.title;
  document.getElementById('mgTimer').textContent = '';
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  footer.innerHTML = '';
  body.innerHTML = `<p style="font-size:13px;line-height:1.7;color:var(--text-main,#ddd);">${clue.text}</p>`;
  const closeBtn = document.createElement('button');
  closeBtn.className='btn primary'; closeBtn.textContent='Đóng';
  closeBtn.onclick=()=>modal.classList.add('hidden');
  footer.appendChild(closeBtn);
}

/* ============== GIAI ĐOẠN ĐÊM: BIẾN CỐ TRUNG TÂM & SĂN ĐUỔI DỒN DẬP ============== */
function edgeKey(a,b){ return [a,b].sort().join('|'); }
function isEdgeLocked(a,b){ return !!(S && S.lockedDoors[edgeKey(a,b)]); }

function checkPhaseTransition(){
  const newPhase = getPhase(S.gameMinutes);
  if(newPhase === S.phase) return;
  S.phase = newPhase;
  markActionDirty();
  if(newPhase===2 && !S.gridIncidentDone && !S.gridIncidentActive) triggerGridIncident();
  if(newPhase===3 && !S.frenzyStarted) startFrenzy();
}

function triggerGridIncident(){
  S.gridDown = true;
  S.gridIncidentActive = true;
  addLog('⚡ BIẾN CỐ: Toàn trường mất điện đột ngột! Hãy đến TÒA C (Phòng Kỹ Thuật) để khởi động lại cầu dao tổng trước khi The TIU lợi dụng bóng tối!', 'danger');
  S.activeEvents['C'] = {deadline: S.gameMinutes+99999, start:S.gameMinutes, mandatory:true, gridEvent:true};
  markActionDirty();
}

function startFrenzy(){
  S.frenzyStarted = true;
  addLog('🌒 The TIU bước vào trạng thái CUỒNG NỘ — di chuyển nhanh hơn hẳn! Một số cửa nối giữa các tòa vừa bị khóa.', 'danger');
  lockRandomDoors();
  markActionDirty();
}

function lockRandomDoors(){
  const edges = [];
  const seen = new Set();
  ROOM_KEYS.forEach(a=>{
    if(ROOM_DEF[a].safe) return;
    ROOM_DEF[a].connects.forEach(b=>{
      if(ROOM_DEF[b].safe) return;
      const k = edgeKey(a,b);
      if(!seen.has(k)){ seen.add(k); edges.push([a,b]); }
    });
  });
  const shuffled = shuffle(edges.slice());
  function graphConnected(extraLocked){
    const start = ROOM_KEYS[0];
    const visited = new Set([start]);
    const queue = [start];
    while(queue.length){
      const node = queue.shift();
      for(const nb of ROOM_DEF[node].connects){
        if(visited.has(nb)) continue;
        if(extraLocked.has(edgeKey(node,nb))) continue;
        visited.add(nb); queue.push(nb);
      }
    }
    return visited.size === ROOM_KEYS.length;
  }
  const locked = new Set();
  let target = Math.min(2, shuffled.length);
  for(const [a,b] of shuffled){
    if(locked.size >= target) break;
    const trial = new Set(locked); trial.add(edgeKey(a,b));
    if(graphConnected(trial)) locked.add(edgeKey(a,b));
  }
  locked.forEach(k=>{ S.lockedDoors[k] = true; });
}

function attemptUnlockDoor(dest){
  if(!S || !S.running || S.paused) return;
  const modal = document.getElementById('mgModal');
  document.getElementById('mapModal').classList.add('hidden');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = '🔒 CỬA BỊ KHÓA — đường đến '+ROOM_DEF[dest].name;
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  footer.innerHTML = '';
  const timerEl = document.getElementById('mgTimer');
  body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Ổ khóa đã bị The TIU phá hỏng cơ chế — bấm liên tục GIỰT KHÓA để bật nó ra trước khi hết giờ!</p>
    <div style="text-align:center;margin:16px 0;"><div style="height:14px;border:2px solid var(--line);border-radius:6px;overflow:hidden;max-width:260px;margin:0 auto;"><div id="lockProgressFill" style="height:100%;width:0%;background:var(--scan);transition:width .12s;"></div></div></div>`;
  const fillEl = body.querySelector('#lockProgressFill');
  const btn = document.createElement('button');
  btn.className='btn primary'; btn.textContent='GIỰT KHÓA';
  const needed = 3;
  let progress = 0, timeLeft = 8, timerHandle = null, done=false;
  startMinigamePressureFx(document.getElementById('mgBox'));
  function cleanup(){
    clearInterval(timerHandle);
    stopMinigamePressureFx();
    modal.classList.add('hidden');
  }
  function succeed(){
    if(done) return; done=true;
    cleanup();
    delete S.lockedDoors[edgeKey(S.playerRoom,dest)];
    addLog('Bạn đã gỡ khóa thành công! Cửa nối '+ROOM_DEF[S.playerRoom].name+' - '+ROOM_DEF[dest].name+' đã mở.', '');
    movePlayer(dest);
  }
  function fail(){
    if(done) return; done=true;
    cleanup();
    S.meter = Math.min(100, S.meter+8);
    addLog('Bạn không kịp gỡ khóa — tiếng động thu hút The TIU đến gần hơn!', 'warn');
    if(S.gameMinutes>=S.breakerUntil && Math.random()<0.5){
      const path = bfsPath(S.monsterRoom, S.playerRoom, !S.enraged);
      if(path && path.length>1){ S.monsterRoom = path[1]; }
    }
    markActionDirty();
    refreshAll();
  }
  btn.onclick=()=>{
    if(done) return;
    progress++;
    fillEl.style.width = Math.min(100, progress/needed*100)+'%';
    if(progress>=needed) succeed();
  };
  footer.appendChild(btn);
  timerEl.textContent = 'Thời gian còn lại: '+timeLeft+'s';
  timerHandle = setInterval(()=>{
    timeLeft--;
    timerEl.textContent = 'Thời gian còn lại: '+timeLeft+'s';
    if(timeLeft<=0) fail();
  }, 1000);
}

/* ============== EPILOGUE — BUỔI SÁNG SAU CÙNG ==============
   Chạy sau khi kết thúc thành công: sinh tồn qua Đêm 3 (ending thường) HOẶC cầm cự đủ 15
   lượt trong trận đánh boss bí mật (secret ending). Người chơi được tự do đi lại quanh
   trường (không còn The TIU, không còn sự cố) trong khung giờ EPILOGUE_START_MIN ->
   EPILOGUE_END_MIN, cho đến khi đi vào Thư viện — nơi hé lộ đoạn kết thật sự và đột ngột
   chuyển sang màn hình kết thúc Chapter 1. ---- */

function renderEpilogueActionPane(){
  const def = ROOM_DEF[S.playerRoom];
  document.getElementById('roomTitle').textContent = def.name;
  const safeTagEl = document.getElementById('roomSafeTag');
  safeTagEl.textContent = '☀ BUỔI SÁNG — AN TOÀN';
  safeTagEl.style.color = 'var(--scan)';

  const banner = document.getElementById('roomBanner');
  banner.classList.add('safebanner');
  const dayImg = ROOM_IMAGES_DAY[S.playerRoom];
  const imgUrl = dayImg || ROOM_IMAGES[S.playerRoom];
  banner.style.backgroundImage = imgUrl ? `url('${imgUrl}')` : ROOM_FALLBACK_GRADIENT[S.playerRoom];

  document.getElementById('resolveBtn').classList.remove('show');
  document.getElementById('npcSprite').classList.add('hidden');

  document.getElementById('roomDesc').textContent = def.sub
    + ' — Buổi sáng yên tĩnh. Không còn tiếng bước chân nào cả, nhưng đâu đó vẫn thấy có gì bất thường.';

  const btnWrap = document.getElementById('actionButtons');
  btnWrap.innerHTML = '';

  const moveGroup = document.createElement('div');
  moveGroup.className = 'actionGroup';
  const moveTitle = document.createElement('div');
  moveTitle.className = 'actionGroupTitle';
  moveTitle.textContent = 'DI CHUYỂN';
  moveGroup.appendChild(moveTitle);
  const moveRow = document.createElement('div');
  moveRow.className = 'actionGroupRow';
  def.connects.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = '➜ '+ROOM_DEF[c].name;
    b.onclick = ()=>movePlayer(c);
    moveRow.appendChild(b);
  });
  moveGroup.appendChild(moveRow);
  btnWrap.appendChild(moveGroup);

  document.getElementById('invRow').innerHTML =
    `<div class="itemChip">Buổi sáng: <b>${formatClock(S.gameMinutes)}</b></div>
     <div class="itemChip">Hãy đi một vòng quanh trường trước khi về... Thư viện vẫn còn đó.</div>`;
}

function startEpilogue(variant){
  if(!S) return;
  S.epilogue = true;
  S.epilogueVariant = variant; // 'normal' | 'secret'
  S.running = true;
  S.paused = false;
  S.gameMinutes = EPILOGUE_START_MIN;
  S.playerRoom = 'A';
  S.activeEvents = {};
  S.enraged = false;
  S.meter = 0;
  S.cameraMovesLeft = 0;
  S.lastTick = performance.now();
  addLog('Buổi sáng đã đến. Không khí trong khuôn viên trường có gì đó khác lạ...', '');

  hideAllOverlays();
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('blackout').classList.remove('on');
  document.getElementById('miniMapWrap')?.classList.remove('mapBlackout');
  document.getElementById('mapModal')?.classList.remove('mapBlackout');
  document.getElementById('meterOuter').classList.remove('enraged');
  document.getElementById('meterOuter').classList.add('epi-hide');
  document.getElementById('staminaOuter').classList.add('epi-hide');
  setRoomTitleGlitch(false);
  buildMap();
  refreshAll();

  const introLines = variant==='secret' ? EPILOGUE_INTRO_SECRET : EPILOGUE_INTRO_NORMAL;
  playVN(introLines, ()=>{});
}

function epilogueMove(dest){
  S.gameMinutes = Math.min(EPILOGUE_END_MIN, S.gameMinutes + BASE_MOVE_COST_MIN);
  S.playerRoom = dest;
  addLog('Bạn đi đến '+ROOM_DEF[dest].name+' dưới ánh nắng buổi sáng.', '');
  refreshAll();
  if(dest==='LIB') triggerEpilogueLibraryDiscovery();
}

function triggerEpilogueLibraryDiscovery(){
  if(!S) return;
  S.running = false;
  const lines = S.epilogueVariant==='secret' ? EPILOGUE_LIB_SECRET : EPILOGUE_LIB_NORMAL;
  playVN(lines, showChapterEndScreen);
}

/* Màn hình kết thúc Chapter 1 — xuất hiện đột ngột (kèm chớp trắng) ngay sau khi người
   chơi tìm thấy dấu vết của TIU trong Thư viện, bất kể đến từ ending thường hay secret. */
function showChapterEndScreen(){
  if(SETTINGS.flash){
    document.getElementById('flash').classList.remove('flash-on'); void document.getElementById('flash').offsetWidth;
    document.getElementById('flash').classList.add('flash-on');
  }
  hideAllOverlays();
  const variant = S && S.epilogueVariant;
  document.getElementById('chapterEndSub').textContent = variant==='secret'
    ? 'Ba mảnh La Peace, Wibu Việt Nhật, Chàng Lính Ngu Lắm và Trọng — tất cả đã cùng viết nên một cái kết khác cho đêm nay. Nhưng dấu vết trong Thư viện vẫn còn đó...'
    : 'Bạn đã sống sót qua 3 đêm lẩn trốn The TIU. Nhưng những gì bạn vừa tìm thấy trong Thư viện sáng nay... có lẽ câu chuyện chưa thực sự kết thúc.';
  document.getElementById('chapterEndScreen').classList.remove('hidden');
}

function eventLabel(ev){
  return {stage:'Kiểm tra sân khấu', floors:'Bật/tắt các tầng', wire:'Nối dây điện', quiz:'Trả lời câu hỏi', wibu:'Bắt Wibu Việt Nhật', books:'Sắp xếp lại sách', bikes:'Dắt xe về đúng hàng', ball:'Tìm quả bóng lạc'}[ev]||ev;
}

function onRoomClick(k){
  if(k===S.playerRoom) return;
  if(!ROOM_DEF[S.playerRoom].connects.includes(k)) return;
  if(isEdgeLocked(S.playerRoom, k)){ attemptUnlockDoor(k); return; }
  movePlayer(k);
  document.getElementById('mapModal').classList.add('hidden');
}

/* ============== MOVEMENT ============== */
function movePlayer(dest){
  if(!S.running || S.paused) return;
  if(S.epilogue){ epilogueMove(dest); return; }
  const noisy = S.gameMinutes < S.speedBuffUntil;
  const cost = noisy ? BUFF_MOVE_COST_MIN : BASE_MOVE_COST_MIN; // 10 phút bình thường, 5 phút khi có buff Nước tăng lực
  const staminaCost = noisy ? MOVE_STAMINA_COST_BUFFED : MOVE_STAMINA_COST; // % thể lực tiêu hao mỗi lần di chuyển
  S.stamina = Math.max(0, S.stamina - staminaCost);
  S.gameMinutes += cost;
  S.playerRoom = dest;
  addLog('Bạn di chuyển đến '+ROOM_DEF[dest].name+'.','');
  if(S.cameraMovesLeft>0) S.cameraMovesLeft--;
  markActionDirty();
  advanceWorld(cost, {isMove:true}); // di chuyển tốn 10 phút (hoặc 5 phút nếu có buff) -> không hồi thể lực trong khoảng thời gian này

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
function advanceWorld(minutesPassed, opts={}){
  // --- Giai đoạn đêm: kiểm tra xem đã bước sang mốc mới chưa ---
  checkPhaseTransition();

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

  // --- Thể lực: di chuyển tốn thẳng % (trừ ở movePlayer, không hồi trong lúc đó); đứng yên thì hồi dần theo thời gian ---
  if(!opts.isMove){
    S.stamina = Math.min(100, S.stamina + STAMINA_REGEN_IDLE*minutesPassed);
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

  // expire unresolved events -> ignored penalty (không áp dụng cho sự cố bắt buộc gridEvent)
  for(const room in S.activeEvents){
    const ev0 = S.activeEvents[room];
    if(!ev0.mandatory && S.gameMinutes >= ev0.deadline){
      delete S.activeEvents[room];
      S.meter = Math.min(100, S.meter + NIGHT_CFG[S.night].meterGainIgnore);
      addLog('Sự cố tại '+ROOM_DEF[room].name+' đã bị bỏ lỡ! The TIU trở nên bất ổn hơn.','warn');
      markActionDirty();
    }
  }

  // --- Biến cố môi trường & ảo giác: sự cố dây chuyền lan sang phòng liền kề nếu để quá lâu ---
  for(const room in S.activeEvents){
    const ev = S.activeEvents[room];
    if(ev.mandatory || ev.chainChecked) continue;
    const total = ev.deadline - ev.start;
    const elapsed = S.gameMinutes - ev.start;
    if(total>0 && elapsed/total >= 0.5){
      ev.chainChecked = true;
      if(Math.random() < 0.45){
        const candidates = ROOM_DEF[room].connects.filter(r=>!ROOM_DEF[r].safe && !ROOM_DEF[r].noEvent && !S.activeEvents[r]);
        if(candidates.length){
          const spread = pick(candidates);
          S.activeEvents[spread] = {deadline: S.gameMinutes + rand(45,70), start: S.gameMinutes, chainedFrom: room};
          addLog('🔥 Sự cố dây chuyền! '+ROOM_DEF[room].name+' quá tải và lan sự cố sang '+ROOM_DEF[spread].name+'!', 'danger');
          markActionDirty();
        }
      }
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
    const factor = NIGHT_CFG[S.night].meterMoveSpeedFactor * (S.gridDown?1.35:1) * (S.phase===3?1.6:1);
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
  // Chỗ Gửi Xe (PARK) và Sân Bóng (FIELD) được đánh dấu noEvent — không bao giờ phát sinh sự cố ở đó.
  let room = (!ROOM_DEF[S.monsterRoom].safe && !ROOM_DEF[S.monsterRoom].noEvent && !S.activeEvents[S.monsterRoom]) ? S.monsterRoom : null;
  if(!room){
    const near = ROOM_DEF[S.monsterRoom].connects.filter(k=>!ROOM_DEF[k].safe && !ROOM_DEF[k].noEvent && !S.activeEvents[k]);
    room = near.length ? pick(near) : null;
  }
  if(!room) return;
  S.activeEvents[room] = {deadline: S.gameMinutes + rand(70,110), start: S.gameMinutes};
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
  if(S && S.running && !S.paused && !S.epilogue && S.gameMinutes>=S.breakerUntil){
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

  // --- Bẫy gây nhiễu: TIU bị thu hút về phía bẫy thay vì hành vi bình thường ---
  if(S.noiseTrap){
    if(S.gameMinutes >= S.noiseTrap.until){
      S.noiseTrap = null;
    } else if(from === S.noiseTrap.room){
      S.noiseTrap = null; // đã đến nơi -> bẫy tiêu hao
    } else {
      const path = bfsPath(from, S.noiseTrap.room, !S.enraged);
      if(path && path.length>1){
        S.monsterRoom = path[1];
        S.lastSeenRoom = from;
        S.lastSeenAt = S.gameMinutes;
        addLog('The TIU bị tiếng ồn từ Bẫy gây nhiễu thu hút và lao về phía '+ROOM_DEF[S.noiseTrap.room].name+'...', 'tiu');
        return;
      }
    }
  }

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
  S.paused = true; // đóng băng thế giới trong lúc màn jumpscare đang hiện — người chơi phải bấm nút mới chơi tiếp
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

  // fullscreen jumpscare display: ảnh TIU phóng to dần rồi lao thẳng ra khỏi màn hình (kèm SFX),
  // sau đó bảng thông báo trồi lên với 2 lựa chọn "TIẾP TỤC" / "BỎ CUỘC" — người chơi phải bấm
  // một trong hai nút thì pha jumpscare mới kết thúc (không tự động đóng nữa).
  const js = document.getElementById('jumpscareOverlay');
  const jsMonster = document.getElementById('jsMonster');
  const jsPanel = document.getElementById('jsPanel');
  const jsPanelText = document.getElementById('jsPanelText');
  const jsBtnRow = document.getElementById('jsPanelBtnRow');
  const jsContinueBtn = document.getElementById('jsContinueBtn');
  const jsGiveUpBtn = document.getElementById('jsGiveUpBtn');
  const sfx = document.getElementById('jumpscareSfxAudio');

  jsMonster.style.backgroundImage = TIU_IMAGE ? `url('${TIU_IMAGE}')` : '';
  jsMonster.classList.toggle('no-img', !TIU_IMAGE);
  jsPanel.classList.remove('show');

  jsPanelText.innerHTML = dead
    ? 'THE TIU ĐÃ TÓM ĐƯỢC BẠN LẦN CUỐI...<span class="jsPanelSub">Bạn gục ngã tại '+ROOM_DEF[caughtRoom].name+'.</span>'
    : 'THE TIU ĐÃ TÓM ĐƯỢC BẠN!<span class="jsPanelSub">Còn lại '+hpLeft+' HP — vừa xảy ra tại '+ROOM_DEF[caughtRoom].name+'</span>';

  // Khi đã hết HP thì không thể "chơi tiếp" — chỉ còn một nút dẫn tới màn hình kết quả.
  jsContinueBtn.textContent = dead ? 'XEM KẾT QUẢ' : 'TIẾP TỤC';
  jsGiveUpBtn.classList.toggle('hidden', dead);

  js.classList.remove('hidden');
  js.classList.remove('active','lunge'); void js.offsetWidth;
  js.classList.add('active','lunge'); // TIU phóng to rồi lao ra khỏi màn hình (0.9s) + màn hình rung lắc, chạy song song

  // SFX phát đúng lúc TIU lao ra khỏi màn hình (điền đường dẫn vào TIU_JUMPSCARE_SFX ở đầu file)
  if(TIU_JUMPSCARE_SFX){
    try{
      sfx.src = TIU_JUMPSCARE_SFX;
      sfx.volume = (window.UIT_SOUND_MUTED?0:1) * (SETTINGS.masterVolume/100);
      sfx.currentTime = 0;
      sfx.play().catch(()=>{});
    }catch(e){}
  }

  // Bảng thông báo + nút lựa chọn trồi lên ngay sau khi TIU đã lao ra khỏi màn hình
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
    if(dead){
      gameOver();
    } else {
      S.paused = false;
      S.lastTick = performance.now();
      refreshAll();
    }
  };

  jsGiveUpBtn.onclick = ()=>{
    closeJumpscare();
    S.running = false;
    showTitle();
  };
}

/* ============== TICK LOOP (real time) ============== */
function updateBlackoutUI(){
  const blackedOut = !!(S && (S.gameMinutes < S.breakerUntil || S.gridDown));
  const bo = document.getElementById('blackout');
  if(bo) bo.classList.toggle('on', blackedOut);
  // Sơ đồ góc màn hình (#miniMapWrap) CHỦ Ý không bị ẩn/mờ khi mất điện — nó nằm ở layer trên cùng
  // (xem z-index trong style.css) để người chơi vẫn thấy đường đi và di chuyển được trong bóng tối.
  const mapModal = document.getElementById('mapModal');
  if(mapModal) mapModal.classList.toggle('mapBlackout', blackedOut);
  const expandBtn = document.getElementById('miniMapExpand');
  if(expandBtn){
    expandBtn.disabled = blackedOut;
    expandBtn.textContent = blackedOut ? '⚡ Mất tín hiệu' : '⤢ Phóng to';
  }
  return blackedOut;
}
let rafId=null;
let lastActionRebuild = 0;
function tick(now){
  if(S && S.running && !S.paused && !S.epilogue){
    const dtReal = now - S.lastTick;
    S.lastTick = now;
    const dGameMin = dtReal / REAL_MS_PER_GAME_MIN;
    if(dGameMin>0){
      S.gameMinutes += dGameMin;
      advanceWorld(dGameMin);
      if(!S.running){ refreshHud(); refreshMap(); rafId = requestAnimationFrame(tick); return; }
      checkEncounter();
      updateBlackoutUI();
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
  const isGridEvent = !!(S.activeEvents[room] && S.activeEvents[room].gridEvent);
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
      S.points += 10 + S.night*5;
      S.meter = Math.max(0, S.meter - 6);
      addLog('Bạn đã xử lý xong sự cố tại '+ROOM_DEF[room].name+'. (+điểm, giảm mức hoạt động)','');
      if(isGridEvent){
        S.gridDown = false;
        S.gridIncidentActive = false;
        S.gridIncidentDone = true;
        S.points += 25;
        addLog('✅ Bạn đã khởi động lại cầu dao tổng — điện đã có trở lại toàn trường!', '');
      }
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
      if(isGridEvent){
        // Sự cố bắt buộc: phải thử lại, không được coi là đã bỏ lỡ
        S.activeEvents[room] = {deadline: S.gameMinutes+99999, start:S.gameMinutes, mandatory:true, gridEvent:true};
        addLog('Bạn thất bại khi khởi động lại cầu dao — điện vẫn mất, hãy quay lại Tòa C để thử lại!', 'danger');
      }
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
    const bimLimit = BIMBIM_NIGHT_LIMIT[S.night] ?? 2;
    const bimLeft = Math.max(0, bimLimit - S.bimbimBoughtTonight);
    const bimOut = bimLeft<=0;
    body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Điểm hiện có: <span id="pointsVal">${S.points}</span></p>
    <div id="shopBody">
      <div class="shopItem"><span>Bim Bim (hồi 1 HP) — 20đ <span style="color:${bimOut?'var(--blood-bright)':'var(--text-dim)'};font-size:11px;">(còn ${bimLeft}/${bimLimit} suất đêm nay)</span></span><button class="btn primary" id="buyBim" ${bimOut?'disabled':''}>${bimOut?'Hết hàng':'Mua'}</button></div>
      <div class="shopItem"><span>Nước tăng lực (buff tốc độ) — 15đ</span><button class="btn primary" id="buyWater">Mua</button></div>
      <div class="shopItem"><span>Suất ăn khuya (+50 Thể lực) — 10đ</span><button class="btn primary" id="buyFood">Mua</button></div>
    </div>
    <p style="font-size:11px;color:var(--text-dim);margin-top:10px;">Căn tin đã hết hàng cho Camera Sinh viên, Sập Cầu Dao, Đèn UV và Bẫy gây nhiễu — hãy tự nhặt linh kiện rải rác quanh khuôn viên và ghé <b>Bàn chế tạo</b> để tự làm ra chúng.</p>`;
    document.getElementById('buyBim').onclick=()=>{
      if(S.bimbimBoughtTonight >= bimLimit){
        addLog('Căn tin đã hết suất Bim Bim đêm nay — bạn buộc phải tự xoay sở ngoài kia!','warn');
        return;
      }
      if(S.points>=20){
        S.points-=20; S.inventory.bimbim++; S.bimbimBoughtTonight++;
        addLog('Bạn mua Bim Bim tại Căn tin ('+S.bimbimBoughtTonight+'/'+bimLimit+' suất đêm nay).','');
        refreshAll(); render();
      }
    };
    document.getElementById('buyWater').onclick=()=>{
      if(S.points>=15){ S.points-=15; S.inventory.water++; addLog('Bạn mua Nước tăng lực tại Căn tin.',''); refreshAll(); render(); }
    };
    document.getElementById('buyFood').onclick=()=>{
      if(S.points>=10){ S.points-=10; S.stamina=Math.min(100,S.stamina+50); addLog('Bạn ăn một suất ăn khuya, hồi thể lực.',''); refreshAll(); render(); }
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
    document.getElementById('winSub').textContent='Phòng trọ giờ đã sẵn sàng để dọn vào. The TIU tạm thời im lặng... nhưng trước khi rời trường, có lẽ nên đi một vòng lần cuối.';
    document.getElementById('nextNightBtn').textContent='TIẾP TỤC';
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); startEpilogue('normal'); };
  } else {
    document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
    document.getElementById('winSub').textContent=NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại. Chuẩn bị cho đêm lẩn trốn tiếp theo — The TIU sẽ hung hãn hơn.';
    document.getElementById('nextNightBtn').textContent='BẮT ĐẦU ĐÊM '+(S.night+1);
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); beginNight(S.night+1); };
  }
  document.getElementById('winScreen').classList.remove('hidden');
}

/* ============== SECRET BOSS BATTLE ==============
   Mở khóa khi người chơi nhặt đủ 3 mảnh La Peace và nói chuyện với Trọng (chỉ ở chế độ
   chơi thường, xem talkToNPC). Trọng truyền mana cho 3 người để cầm cự 10 lượt trong khi
   cậu ấy hoàn tất tế lễ thanh tẩy TIU. Giao diện chuyển hẳn sang chiến đấu theo lượt kiểu
   JRPG cổ điển (Tấn công / Phòng thủ / Kỹ năng) với các pha tấn công kiểu bullet-hell từ boss. */

// Nhạc nền chiến đấu (rock/symphony bùng nổ) — điền đường dẫn file của bạn vào đây,
// ví dụ: 'assets/sfx/OST/battle.mp3'. Để trống thì trận đánh sẽ diễn ra không nhạc riêng.
const BATTLE_MUSIC = "assets/sfx/OST/battle.mp3";
// TIU trong trận đánh bí mật có lượng máu khổng lồ và không bao giờ có thể bị hạ gục
// chỉ bằng cách tấn công (xem resolveRound/finishBattle) — chiến thắng chỉ đến khi
// party cầm cự đủ BATTLE_MAX_TURN lượt để Trọng hoàn tất nghi lễ thanh tẩy.
const BOSS_MAX_HP = 999999;
const BATTLE_MAX_TURN = 15;

const PARTY_DEF = {
  YOU:  {name:'BẠN', avatarText:'★', avatarBg:'#2a2a2a', maxHp:150, skillName:'Vì Tao Là Người Bông', skillCd:4,
         skillDesc:'Gây choáng khiến TIU không thể ra đòn ở lượt tấn công tiếp theo.'},
  WIBU: {name:'WIBU VIỆT NHẬT', avatarText:'和', avatarBg:'#5a3a8a', maxHp:140, skillName:'Chúc Phúc Của Otaku', skillCd:5,
         skillDesc:'Hồi 50 HP cho toàn đội.'},
  LINH: {name:'CHÀNG LÍNH NGU LẮM', avatarText:'💤', avatarBg:'#2a5a3a', maxHp:170, skillName:'Siêu Hùng Bất Tử', skillCd:3,
         skillDesc:'Dựng khiên khiêu khích — cả lượt này chỉ mình cậu ấy chịu sát thương từ TIU.'}
};
const BATTLE_PARTY_ORDER = ['YOU','WIBU','LINH'];

// Mỗi pattern giờ phát ra NHIỀU CHUỖI đạn liên tiếp (nhiều đợt trong cùng 1 lượt boss) —
// người chơi phải điều khiển "linh hồn hợp nhất" (hình tròn) bằng WASD/mũi tên để né trong
// #dodgeBox. dmg là sát thương của MỖI LẦN trúng đòn (có thể trúng nhiều lần trong 1 chuỗi).
const BOSS_PATTERNS = [
  {name:'MƯA DỮ LIỆU LỖI', desc:'Từng đợt ký tự đỏ rực đổ xuống dồn dập như mưa.', dmg:[5,9], bulletType:'rain', dodgeDuration:4600},
  {name:'VÒNG XOÁY HỖN LOẠN', desc:'TIU tan thành hàng trăm mảnh vỡ xoáy liên hồi quanh tâm.', dmg:[5,9], bulletType:'spiral', dodgeDuration:4800},
  {name:'TIA QUÉT KÝ ỨC', desc:'Nhiều luồng sáng trắng lần lượt quét ngang/dọc, chỉ báo trước rồi bắn thật.', dmg:[7,12], bulletType:'sweep', dodgeDuration:5000},
  {name:'BÓNG ĐÊM NUỐT CHỬNG', desc:'Nhiều đợt sóng nổ tỏa tròn dồn dập từ tâm lao ra.', dmg:[5,9], bulletType:'burst', dodgeDuration:4600},
  {name:'GỌNG KÌM BỐN PHÍA', desc:'Đạn ập vào liên tục từ cả bốn phía, siết chặt không gian né tránh.', dmg:[6,10], bulletType:'cross', dodgeDuration:5000}
];

let BS = null;          // trạng thái trận đấu hiện tại
let battleMusicEl = null;

function freshBattleState(){
  const party = {};
  BATTLE_PARTY_ORDER.forEach(k=>{
    party[k] = {hp:PARTY_DEF[k].maxHp, maxHp:PARTY_DEF[k].maxHp, cd:0, action:null, defending:false, taunting:false};
  });
  return {
    turn:1, maxTurn:BATTLE_MAX_TURN,
    boss:{hp:BOSS_MAX_HP, maxHp:BOSS_MAX_HP, stunned:false},
    party, order:BATTLE_PARTY_ORDER, pickIdx:0, log:[], over:false,
    dodgeSoften:0 // số lệnh "Tấn công" ở lượt vừa rồi -> làm chậm & giãn chuỗi đạn né tiếp theo
  };
}

function startSecretBattle(){
  BS = freshBattleState();
  if(S) S.paused = true;
  document.getElementById('battleOverlay').classList.remove('hidden');
  playShatterFx();
  startBattleMusic();
  addBattleLog('Trọng dang tay truyền mana cho cả ba người — không gian vỡ tan thành từng mảnh...','sys');
  addBattleLog('THE TIU hiện nguyên hình trước party!','danger');
  addBattleLog('Đòn đánh của party không thể hạ gục TIU — chỉ cần CẦM CỰ đủ '+BS.maxTurn+' lượt để Trọng hoàn tất nghi lễ!','warn');
  renderBattle();
  promptNextAction();
}

/* ---- Hiệu ứng vỡ màn hình khi vào trận ---- */
function playShatterFx(){
  const el = document.getElementById('battleShatter');
  el.innerHTML = '';
  el.classList.remove('go');
  const cols=5, rows=4;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const d = document.createElement('div');
      d.className = 'shatter-shard';
      d.style.left = (c*100/cols)+'%';
      d.style.top = (r*100/rows)+'%';
      d.style.width = (100/cols)+'%';
      d.style.height = (100/rows)+'%';
      d.style.setProperty('--tx', ((Math.random()-0.5)*140)+'vw');
      d.style.setProperty('--ty', ((Math.random()-0.5)*140)+'vh');
      d.style.setProperty('--rot', (Math.random()*140-70)+'deg');
      d.style.animationDelay = (Math.random()*0.15)+'s';
      el.appendChild(d);
    }
  }
  void el.offsetWidth;
  el.classList.add('go');
}

/* ---- Nhạc chiến đấu (rock/symphony) thay thế nhạc ambient u ám ---- */
function startBattleMusic(){
  battleMusicEl = document.getElementById('battleMusicAudio');
  if(!battleMusicEl || !BATTLE_MUSIC) return;
  try{
    battleMusicEl.src = BATTLE_MUSIC;
    battleMusicEl.loop = true;
    battleMusicEl.volume = (window.UIT_SOUND_MUTED?0:1) * (SETTINGS.masterVolume/100);
    battleMusicEl.currentTime = 0;
    battleMusicEl.play().catch(()=>{});
  }catch(e){}
}
function stopBattleMusic(){
  if(battleMusicEl){ try{ battleMusicEl.pause(); }catch(e){} }
}

/* ---- Render trạng thái trận đấu ---- */
function renderBattle(){
  if(!BS) return;
  document.getElementById('battleTurnNum').textContent = BS.turn;
  document.getElementById('battleTurnMax').textContent = BS.maxTurn;
  const bossPct = Math.max(2, BS.boss.hp/BS.boss.maxHp*100); // thanh máu TIU không bao giờ hiện 0% — không thể bị đánh gục
  document.getElementById('bossHpBarFill').style.width = bossPct+'%';
  document.getElementById('bossHpText').textContent = Math.max(0,Math.round(BS.boss.hp))+' / '+BS.boss.maxHp;
  const bossSprite = document.getElementById('bossSprite');
  bossSprite.style.backgroundImage = TIU_IMAGE ? `url('${TIU_IMAGE}')` : '';
  bossSprite.classList.toggle('no-img', !TIU_IMAGE);

  const partyPanel = document.getElementById('partyPanel');
  partyPanel.innerHTML = '';
  BS.order.forEach(key=>{
    const def = PARTY_DEF[key], st = BS.party[key];
    const pct = Math.max(0, st.hp/st.maxHp*100);
    const card = document.createElement('div');
    card.className = 'partyCard'+(st.hp<=0?' ko':'')+(st.taunting?' taunting':'');
    let statusHtml = '';
    if(st.hp<=0) statusHtml = '<div class="pcStatus ko">GỤC NGÃ</div>';
    else if(st.taunting) statusHtml = '<div class="pcStatus taunt">KHIÊU KHÍCH</div>';
    else if(st.defending) statusHtml = '<div class="pcStatus def">PHÒNG THỦ</div>';
    card.innerHTML = `<div class="pcAvatar" style="background:${def.avatarBg}">${def.avatarText}</div>
      <div class="pcName">${def.name}</div>
      <div class="pcHpBar"><div class="pcHpFill" style="width:${pct}%"></div></div>
      <div class="pcHpText">${Math.max(0,Math.round(st.hp))}/${st.maxHp}</div>
      <div class="pcSkillCd">${st.cd>0 ? 'Kỹ năng hồi: '+st.cd+' lượt' : 'Kỹ năng sẵn sàng'}</div>
      ${statusHtml}`;
    partyPanel.appendChild(card);
  });
}

function addBattleLog(msg, cls){
  BS.log.unshift({msg,cls});
  if(BS.log.length>40) BS.log.pop();
  document.getElementById('battleLogPane').innerHTML = BS.log.map(l=>`<div class="entry ${l.cls||''}">${l.msg}</div>`).join('');
}

/* ---- Chọn lệnh cho từng thành viên (Tấn công / Phòng thủ / Kỹ năng) ---- */
function promptNextAction(){
  while(BS.pickIdx < BS.order.length){
    const key = BS.order[BS.pickIdx];
    if(BS.party[key].hp<=0){ BS.pickIdx++; continue; }
    showBattleMenu(key);
    return;
  }
  resolveRound();
}

function showBattleMenu(key){
  const def = PARTY_DEF[key], st = BS.party[key];
  const menu = document.getElementById('battleMenu');
  menu.innerHTML = `<div class="battleMenuHead">LƯỢT CỦA ${def.name}</div>`;
  const row = document.createElement('div');
  row.className = 'battleMenuRow';

  const atkBtn = document.createElement('button');
  atkBtn.className = 'battleCmdBtn atk';
  atkBtn.textContent = '⚔ Tấn công';
  atkBtn.onclick = ()=>chooseAction(key,'attack');
  row.appendChild(atkBtn);

  const defBtn = document.createElement('button');
  defBtn.className = 'battleCmdBtn def';
  defBtn.textContent = '🛡 Phòng thủ';
  defBtn.onclick = ()=>chooseAction(key,'defend');
  row.appendChild(defBtn);

  const sklBtn = document.createElement('button');
  sklBtn.className = 'battleCmdBtn skl';
  sklBtn.textContent = '✦ '+def.skillName+(st.cd>0?' ('+st.cd+')':'');
  sklBtn.disabled = st.cd>0;
  sklBtn.onclick = ()=>chooseAction(key,'skill');
  row.appendChild(sklBtn);

  menu.appendChild(row);
  const hint = document.createElement('div');
  hint.className = 'battleMenuHint';
  hint.textContent = def.skillDesc;
  menu.appendChild(hint);
}

function chooseAction(key, action){
  BS.party[key].action = action;
  BS.pickIdx++;
  promptNextAction();
}

/* ---- Xử lý lượt của party rồi tới lượt của boss ---- */
function resolveRound(){
  document.getElementById('battleMenu').innerHTML = '<div class="battleMenuHint">Đang xử lý lượt...</div>';

  // hồi giảm cooldown kỹ năng từ lượt trước
  BS.order.forEach(k=>{ if(BS.party[k].cd>0) BS.party[k].cd--; });
  BS.order.forEach(k=>{ BS.party[k].defending=false; BS.party[k].taunting=false; });
  BS.boss.stunned = false;

  let atkCount = 0;
  BS.order.forEach(key=>{
    const st = BS.party[key], def = PARTY_DEF[key];
    if(st.hp<=0 || !st.action) return;
    if(st.action==='attack'){
      atkCount++;
      const dmg = Math.round(rand(12,20));
      // TIU được Trọng phong ấn tạm thời — sát thương chỉ mang tính "cầm chân", máu không bao giờ về 0
      BS.boss.hp = Math.max(Math.round(BS.boss.maxHp*0.015), BS.boss.hp - dmg);
      addBattleLog(def.name+' tấn công THE TIU, gây '+dmg+' sát thương (không đủ để hạ gục).','atk');
    } else if(st.action==='defend'){
      st.defending = true;
      addBattleLog(def.name+' thủ thế, chuẩn bị chịu đòn.','def');
    } else if(st.action==='skill'){
      applyBattleSkill(key);
    }
  });

  renderBattle();

  // Lưu ý: TIU KHÔNG BAO GIỜ bị hạ gục bằng đòn đánh — chiến thắng chỉ đến ở endRound()
  // khi party cầm cự đủ BS.maxTurn lượt. Không có finishBattle(true) ở đây.

  // Mỗi lệnh "Tấn công" trong lượt này làm CHẬM tốc độ đạn & GIÃN mật độ của chuỗi đòn né
  // tiếp theo của TIU — cho các lựa chọn JRPG giá trị thực tế thay vì chỉ là hình thức.
  BS.dodgeSoften = atkCount;
  if(atkCount>0){
    addBattleLog('Party dồn '+atkCount+' đòn tấn công — chuỗi đạn né tiếp theo của TIU sẽ CHẬM & THƯA hơn!','atk');
  }

  const staggerChance = atkCount*0.10;
  const staggered = Math.random() < staggerChance;
  if(staggered){
    addBattleLog('Cả party dồn dập ra đòn — TIU loạng choạng, mất lượt tấn công!','warn');
  }

  setTimeout(()=>{ bossTurn(staggered); }, 700);
}

function applyBattleSkill(key){
  const st = BS.party[key], def = PARTY_DEF[key];
  if(key==='YOU'){
    BS.boss.stunned = true;
    st.cd = def.skillCd;
    addBattleLog('BẠN hét lên "Vì tao là người bông!!" — TIU khựng lại, choáng váng!','skill');
  } else if(key==='WIBU'){
    BS.order.forEach(k=>{ const p=BS.party[k]; if(p.hp>0) p.hp = Math.min(p.maxHp, p.hp+50); });
    st.cd = def.skillCd;
    addBattleLog('WIBU VIỆT NHẬT dùng Chúc Phúc Của Otaku — cả team hồi 50 HP!','skill');
  } else if(key==='LINH'){
    st.taunting = true;
    st.cd = def.skillCd;
    addBattleLog('CHÀNG LÍNH NGU LẮM hét "Tới tao đây!!" — dựng khiên khiêu khích TIU!','skill');
  }
}

/* ---- Chọn CHUỖI pattern cho lượt boss hiện tại ----
   Càng về các lượt sau, xác suất & độ dài của việc NỐI LIỀN nhiều pattern bullet-hell
   lại với nhau thành 1 chuỗi đòn dài càng tăng. Tới đúng lượt cuối cùng (BS.maxTurn),
   TIU dồn hết sức tàn — TẤT CẢ các pattern sẽ được nối liền lại thành 1 chuỗi duy nhất. */
function chooseBossPatternChain(turn){
  const all = BOSS_PATTERNS;
  if(turn >= BS.maxTurn){
    // lượt cuối: bung hết mọi chiêu thức, nối liền thành 1 chuỗi đòn tổng lực
    return shuffle(all.slice());
  }
  const progress = (turn-1) / Math.max(1, BS.maxTurn-2); // tăng dần 0 -> ~1 khi tới gần lượt cuối
  let chainLen = 1;
  for(let i=0; i<all.length-1; i++){
    if(Math.random() < 0.10 + progress*0.55) chainLen++;
    else break; // trượt là dừng nối chuỗi, tránh việc luôn full ngay từ đầu
  }
  chainLen = Math.min(chainLen, all.length);
  return shuffle(all.slice()).slice(0, chainLen);
}

/* ---- Lượt của boss: chạy lần lượt từng pattern trong chuỗi (bullet-hell nối liền nhau) ---- */
function bossTurn(staggered){
  if(BS.boss.stunned){
    addBattleLog('TIU bị choáng, không thể ra đòn lượt này.','skill');
    endRound();
    return;
  }
  if(staggered){
    endRound();
    return;
  }
  const chain = chooseBossPatternChain(BS.turn);
  if(chain.length > 1){
    const isFinal = BS.turn >= BS.maxTurn;
    addBattleLog((isFinal ? 'TIU GIÃY GIỤA TRONG TUYỆT VỌNG — DỒN TOÀN BỘ SỨC TÀN, NỐI LIỀN CẢ '+chain.length+' CHIÊU THỨC THÀNH 1 CHUỖI ĐÒN CUỐI CÙNG: '
      : 'THE TIU nối liền '+chain.length+' chiêu thức thành 1 CHUỖI ĐÒN DÀI: ')+chain.map(p=>p.name).join(' → '),'danger');
  }
  runBossChain(chain, 0, 0);
}

/* Chạy từng pattern trong chuỗi nối tiếp nhau, cộng dồn sát thương của cả chuỗi lại
   rồi mới áp dụng 1 lần lên party khi chuỗi kết thúc. */
function runBossChain(chain, idx, totalDmg){
  if(idx >= chain.length){
    applyBossChainDamage(totalDmg);
    return;
  }
  const pattern = chain[idx];
  document.getElementById('bossPatternTag').textContent = '⚠ '+pattern.name + (chain.length>1 ? ' ('+(idx+1)+'/'+chain.length+')' : '');
  addBattleLog((idx===0 ? 'THE TIU tung chiêu: ' : '...nối liền chiêu tiếp theo: ')+pattern.name+' — '+pattern.desc, 'danger');
  runDodgePhase(pattern, (hits)=>{
    let segDmg = 0;
    if(hits>0){ for(let i=0;i<hits;i++) segDmg += Math.round(rand(pattern.dmg[0], pattern.dmg[1])); }
    else addBattleLog('Linh hồn hợp nhất né trọn chiêu "'+pattern.name+'"!', 'warn');
    const gap = chain.length>1 ? 260 : 0; // khoảng nghỉ ngắn giữa các đòn trong chuỗi
    setTimeout(()=>{ runBossChain(chain, idx+1, totalDmg+segDmg); }, gap);
  });
}

function applyBossChainDamage(totalDmg){
  const tauntKey = BS.order.find(k=>BS.party[k].taunting && BS.party[k].hp>0);
  const targets = tauntKey ? [tauntKey] : BS.order.filter(k=>BS.party[k].hp>0);
  if(totalDmg<=0){
    addBattleLog('Cả chuỗi đòn bị né trọn vẹn — không ai bị thương!','warn');
  } else {
    targets.forEach(k=>{
      const st = BS.party[k], def = PARTY_DEF[k];
      let dmg = totalDmg;
      if(st.defending) dmg = Math.round(dmg*0.75);
      st.hp = Math.max(0, st.hp - dmg);
      addBattleLog(def.name+' hứng chịu tổng cộng '+dmg+' sát thương từ cả chuỗi đòn'+(st.defending?' — đã phòng thủ':'')+'.','dmg');
    });
  }
  renderBattle();
  if(BS.order.every(k=>BS.party[k].hp<=0)){ finishBattle(false); return; }
  endRound();
}

/* ============== DODGE PHASE — né chuỗi đạn bằng "linh hồn hợp nhất" ==============
   Thay vì chỉ xem hiệu ứng rồi nhận sát thương cố định, người chơi điều khiển 1 hình tròn
   (đại diện cho linh hồn hợp nhất của cả 3 người: BẠN + WIBU VIỆT NHẬT + CHÀNG LÍNH NGU LẮM)
   bằng WASD hoặc phím mũi tên trong #dodgeBox để né các chuỗi đạn bullet-hell của TIU.
   Mỗi pattern giờ bắn ra NHIỀU ĐỢT đạn nối tiếp nhau (chuỗi) thay vì 1 lần bắn đơn giản. */
const DODGE_KEYS = {
  ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
  w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right'
};
let DZ = null; // trạng thái runtime của pha né đạn hiện tại

function runDodgePhase(pattern, cb){
  const arena = document.getElementById('dodgeArena');
  const box = document.getElementById('dodgeBox');
  const soul = document.getElementById('soulCircle');
  box.querySelectorAll('.dbullet').forEach(b=>b.remove());
  arena.classList.remove('hidden');
  document.getElementById('dodgeHitNum').textContent = '0';

  const rect = {w: box.clientWidth || 340, h: box.clientHeight || 260};
  const soulR = 7;
  // Đòn "Tấn công" của party ở lượt trước làm TIU chậm lại: đạn bay chậm hơn (speedFactor)
  // và thưa hơn (densityBoost giãn khoảng cách giữa các đợt) — càng nhiều Tấn công, càng dễ né.
  const soften = BS ? (BS.dodgeSoften||0) : 0;
  const speedFactor = Math.max(0.55, 1 - soften*0.12);
  const densityBoost = Math.min(1.6, 1 + soften*0.15);
  DZ = {
    x: rect.w/2, y: rect.h - 26,
    keys: {up:false,down:false,left:false,right:false},
    bullets: [],
    hitsTaken: 0,
    invulnUntil: 0,
    start: performance.now(),
    duration: (pattern.dodgeDuration||4600) + (BS ? Math.min(600, (BS.turn-1)*30) : 0), // dài & dồn dập hơn ở lượt sau
    spawnQueue: buildDodgeSpawnQueue(pattern, rect, BS ? BS.turn : 1, densityBoost),
    speedFactor,
    rect, soulR
  };

  DZ.keydownHandler = (e)=>{
    const dir = DODGE_KEYS[e.key];
    if(!dir) return;
    e.preventDefault();
    DZ.keys[dir] = true;
  };
  DZ.keyupHandler = (e)=>{
    const dir = DODGE_KEYS[e.key];
    if(!dir) return;
    DZ.keys[dir] = false;
  };
  document.addEventListener('keydown', DZ.keydownHandler);
  document.addEventListener('keyup', DZ.keyupHandler);

  soul.style.transform = `translate(${DZ.x}px, ${DZ.y}px)`;
  soul.classList.remove('hit');

  let last = DZ.start;
  function frame(now){
    if(!DZ) return; // pha đã bị hủy giữa chừng (vd rời trận)
    const dt = Math.min(48, now-last); last = now;
    const elapsed = now - DZ.start;

    // di chuyển linh hồn theo phím giữ (WASD / mũi tên), giới hạn trong khung
    const speed = 0.24; // px/ms
    let mx=0,my=0;
    if(DZ.keys.up) my -= 1;
    if(DZ.keys.down) my += 1;
    if(DZ.keys.left) mx -= 1;
    if(DZ.keys.right) mx += 1;
    if(mx||my){
      const len = Math.hypot(mx,my);
      DZ.x += (mx/len)*speed*dt;
      DZ.y += (my/len)*speed*dt;
    }
    DZ.x = Math.max(DZ.soulR, Math.min(DZ.rect.w-DZ.soulR, DZ.x));
    DZ.y = Math.max(DZ.soulR, Math.min(DZ.rect.h-DZ.soulR, DZ.y));
    soul.style.transform = `translate(${DZ.x}px, ${DZ.y}px)`;

    // phát chuỗi đạn theo lịch đã lên
    while(DZ.spawnQueue.length && DZ.spawnQueue[0].t <= elapsed){
      spawnDodgeBullet(DZ.spawnQueue.shift(), box);
    }

    // cập nhật từng viên đạn + kiểm tra va chạm
    for(let i=DZ.bullets.length-1;i>=0;i--){
      const b = DZ.bullets[i];
      updateDodgeBullet(b, dt);
      if(b.dead){ b.el.remove(); DZ.bullets.splice(i,1); continue; }
      if(!b.laser) b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      if(now > DZ.invulnUntil && dodgeHitTest(b, DZ)){
        DZ.hitsTaken++;
        document.getElementById('dodgeHitNum').textContent = DZ.hitsTaken;
        DZ.invulnUntil = now + 550;
        soul.classList.add('hit');
        setTimeout(()=>{ if(soul) soul.classList.remove('hit'); }, 220);
      }
    }

    if(elapsed < DZ.duration || DZ.bullets.length || DZ.spawnQueue.length){
      DZ.raf = requestAnimationFrame(frame);
    } else {
      endDodgePhase(cb);
    }
  }
  DZ.raf = requestAnimationFrame(frame);
}

function endDodgePhase(cb){
  if(!DZ) return;
  document.removeEventListener('keydown', DZ.keydownHandler);
  document.removeEventListener('keyup', DZ.keyupHandler);
  cancelAnimationFrame(DZ.raf);
  document.getElementById('dodgeArena').classList.add('hidden');
  document.getElementById('dodgeBox').querySelectorAll('.dbullet').forEach(b=>b.remove());
  const hits = DZ.hitsTaken;
  DZ = null;
  cb(hits);
}

/* ---- Sinh lịch phát đạn: mỗi pattern giờ gồm NHIỀU ĐỢT (chuỗi) liên tiếp, độ dồn dập
   tăng dần theo lượt (turn) để trận đấu càng về sau càng khó né hơn ---- */
function buildDodgeSpawnQueue(pattern, rect, turn, densityBoost){
  let density = Math.max(0.62, 1 - (turn-1)*0.03); // khoảng cách giữa các đợt rút ngắn dần theo lượt
  density *= (densityBoost||1); // nới rộng lại nếu party vừa dồn nhiều đòn Tấn công (xem BS.dodgeSoften)
  const gens = {
    rain: genRainQueue, spiral: genSpiralQueue, sweep: genSweepQueue,
    burst: genBurstQueue, cross: genCrossQueue
  };
  const fn = gens[pattern.bulletType] || genRainQueue;
  return fn(rect, (pattern.dodgeDuration||4600), density);
}
function genRainQueue(rect, duration, density){
  const q=[]; let t=250;
  while(t < duration-500){
    const cols = 5 + Math.floor(Math.random()*3);
    for(let i=0;i<cols;i++){
      const x = 18 + Math.random()*(rect.w-36);
      q.push({t, kind:'fall', x, speed:0.15+Math.random()*0.09});
    }
    t += 420*density;
  }
  return q;
}
function genSpiralQueue(rect, duration, density){
  const q=[]; let t=150; let ang=Math.random()*360;
  const cx=rect.w/2, cy=rect.h/2;
  while(t < duration-300){
    q.push({t, kind:'radial', cx, cy, ang, speed:0.095});
    q.push({t, kind:'radial', cx, cy, ang:ang+180, speed:0.095});
    ang += 24;
    t += 95*density;
  }
  return q;
}
function genSweepQueue(rect, duration, density){
  const q=[]; let t=250; let count=0;
  while(t < duration-500){
    const horiz = count%2===0;
    q.push({t, kind:'laser', horiz, pos: 18+Math.random()*((horiz?rect.h:rect.w)-36), telegraph:520});
    t += 780*density;
    count++;
  }
  return q;
}
function genBurstQueue(rect, duration, density){
  const q=[]; let t=200;
  const cx=rect.w/2, cy=rect.h/2;
  while(t < duration-400){
    const n = 10 + Math.floor(Math.random()*4);
    for(let i=0;i<n;i++) q.push({t, kind:'radial', cx, cy, ang:(360/n)*i, speed:0.13});
    t += 640*density;
  }
  return q;
}
function genCrossQueue(rect, duration, density){
  const q=[]; let t=250;
  while(t < duration-400){
    for(let edge=0; edge<4; edge++){
      q.push({t, kind:'edge', edge, offset:Math.random(), speed:0.15+Math.random()*0.05});
    }
    t += 520*density;
  }
  return q;
}

function spawnDodgeBullet(ev, box){
  const el = document.createElement('div');
  const b = {el, dead:false, age:0, life:6500, r:6};
  const sf = (DZ && DZ.speedFactor) || 1; // đòn Tấn công lượt trước -> đạn bay chậm hơn
  if(ev.kind==='fall'){
    el.className = 'dbullet t-rain';
    b.x = ev.x; b.y = -12; b.vx = 0; b.vy = ev.speed*sf; b.r=6;
  } else if(ev.kind==='radial'){
    el.className = 'dbullet t-radial';
    const rad = ev.ang*Math.PI/180;
    b.x = ev.cx; b.y = ev.cy; b.vx = Math.cos(rad)*ev.speed*sf; b.vy = Math.sin(rad)*ev.speed*sf; b.r=6;
  } else if(ev.kind==='edge'){
    el.className = 'dbullet t-edge';
    const rect = DZ.rect;
    const spd = ev.speed*sf;
    let sx,sy,vx,vy;
    if(ev.edge===0){ sx=ev.offset*rect.w; sy=-12; vx=0; vy=spd; }
    else if(ev.edge===1){ sx=rect.w+12; sy=ev.offset*rect.h; vx=-spd; vy=0; }
    else if(ev.edge===2){ sx=ev.offset*rect.w; sy=rect.h+12; vx=0; vy=-spd; }
    else { sx=-12; sy=ev.offset*rect.h; vx=spd; vy=0; }
    b.x=sx; b.y=sy; b.vx=vx; b.vy=vy; b.r=6;
  } else if(ev.kind==='laser'){
    // đòn Tấn công lượt trước cũng kéo dài thời gian cảnh báo (telegraph) của tia quét,
    // cho người chơi nhiều thời gian phản ứng hơn.
    const telegraph = (ev.telegraph||500) / sf;
    b.laser = true; b.horiz = ev.horiz; b.pos = ev.pos;
    b.age = -telegraph; b.life = telegraph + 320;
    el.className = 'dbullet '+(ev.horiz?'t-laser-h':'t-laser-v')+' telegraph';
    if(ev.horiz){ el.style.top = ev.pos+'px'; el.style.left='0'; }
    else { el.style.left = ev.pos+'px'; el.style.top='0'; }
  }
  box.appendChild(el);
  DZ.bullets.push(b);
}

function updateDodgeBullet(b, dt){
  b.age += dt;
  if(b.laser){
    if(b.age >= 0 && b.el.classList.contains('telegraph')){
      b.el.classList.remove('telegraph');
      b.el.classList.add('firing');
    }
    if(b.age > b.life) b.dead = true;
    return;
  }
  b.x += b.vx*dt; b.y += b.vy*dt;
  const rect = DZ.rect;
  if(b.x < -30 || b.x > rect.w+30 || b.y < -30 || b.y > rect.h+30) b.dead = true;
  if(b.age > b.life) b.dead = true;
}

function dodgeHitTest(b, dz){
  if(b.laser){
    if(b.el.classList.contains('telegraph')) return false; // chỉ đang cảnh báo, chưa bắn thật
    return b.horiz ? Math.abs(dz.y - b.pos) < (9 + dz.soulR) : Math.abs(dz.x - b.pos) < (9 + dz.soulR);
  }
  return Math.hypot(dz.x-b.x, dz.y-b.y) < (b.r + dz.soulR - 1);
}

/* ---- Kết thúc 1 lượt (round) và kiểm tra điều kiện thắng theo mốc 10 lượt ---- */
function endRound(){
  BS.turn++;
  if(BS.turn > BS.maxTurn){ finishBattle(true); return; }
  BS.pickIdx = 0;
  BS.order.forEach(k=>{ BS.party[k].action=null; });
  document.getElementById('bossPatternTag').textContent='';
  renderBattle();
  promptNextAction();
}

/* ---- Thắng/thua trận đánh bí mật ---- */
function finishBattle(won){
  BS.over = true;
  document.getElementById('battleMenu').innerHTML='';
  stopBattleMusic();
  if(won){
    addBattleLog('Trọng hoàn tất tế lễ thanh tẩy — hình hài TIU rạn nứt rồi vỡ tan thành từng mảnh!','sys');
    playBossShatterFx(()=>{
      addBattleLog('Một luồng ánh sáng trắng ấm áp lan tỏa khắp không gian, nuốt trọn những mảnh vỡ cuối cùng của TIU!','sys');
      playWhiteFlashFx(()=>{
        document.getElementById('battleVictoryFx').classList.remove('go');
        document.getElementById('battleOverlay').classList.add('hidden');
        playVN(TRONG_VICTORY_DIALOGUE.lines, ()=>{ triggerSecretEnding(); });
      });
    });
  } else {
    addBattleLog('Cả party gục ngã... nghi lễ thanh tẩy thất bại.','danger');
    setTimeout(()=>{
      document.getElementById('battleOverlay').classList.add('hidden');
      if(S){
        S.running = false;
        document.getElementById('goSub').textContent = 'Trận chiến bí mật thất bại — TIU đã áp đảo cả party trước khi Trọng kịp hoàn thành tế lễ thanh tẩy.';
        document.getElementById('gameOverScreen').classList.remove('hidden');
      }
    }, 1400);
  }
}

function playWhiteFlashFx(cb){
  const fx = document.getElementById('battleVictoryFx');
  fx.classList.remove('go'); void fx.offsetWidth;
  fx.classList.add('go');
  setTimeout(cb, 2000); // màn hình lóe sáng trắng dần đều trong 2 giây trước khi vào hội thoại kết
}

/* ---- Hình hài TIU rạn nứt rồi vỡ tan thành từng mảnh khi party cầm cự đủ 15 lượt ---- */
function playBossShatterFx(cb){
  const sprite = document.getElementById('bossSprite');
  if(!sprite){ cb && cb(); return; }
  const rect = sprite.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.id = 'bossShatterFx';
  layer.style.left = rect.left+'px';
  layer.style.top = rect.top+'px';
  layer.style.width = rect.width+'px';
  layer.style.height = rect.height+'px';
  document.body.appendChild(layer);

  const cols = 5, rows = 5;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const shard = document.createElement('div');
      shard.className = 'boss-shard';
      shard.style.left = (c*100/cols)+'%';
      shard.style.top = (r*100/rows)+'%';
      shard.style.width = (100/cols)+'%';
      shard.style.height = (100/rows)+'%';
      if(TIU_IMAGE){
        shard.style.backgroundImage = `url('${TIU_IMAGE}')`;
        shard.style.backgroundSize = (cols*100)+'% '+(rows*100)+'%';
        shard.style.backgroundPosition = (cols<=1?0:(c*100/(cols-1)))+'% '+(rows<=1?0:(r*100/(rows-1)))+'%';
      } else {
        shard.style.background = 'var(--blood-bright)';
      }
      const cx = c-(cols-1)/2, cy = r-(rows-1)/2;
      shard.style.setProperty('--tx', ((Math.random()-0.5)*30 + cx*26)+'vw');
      shard.style.setProperty('--ty', ((Math.random()-0.5)*24 + cy*22)+'vh');
      shard.style.setProperty('--rot', (Math.random()*260-130)+'deg');
      shard.style.animationDelay = (Math.random()*0.12)+'s';
      layer.appendChild(shard);
    }
  }

  sprite.classList.add('dissolving');
  void layer.offsetWidth;
  layer.querySelectorAll('.boss-shard').forEach(s=>s.classList.add('go'));

  setTimeout(()=>{
    layer.remove();
    sprite.classList.remove('dissolving');
    sprite.style.backgroundImage = '';
    cb && cb();
  }, 950);
}

/* ============== SECRET ENDING (3 La Peace + nói chuyện với Trọng) ==============
   Chỉ có thể kích hoạt trong chế độ chơi thường (nút BẮT ĐẦU — không phải CHỌN MÀN/CHỌN CHAPTER),
   và chỉ sau khi cầm cự thành công qua trận đánh boss bí mật ở trên. */
function triggerSecretEnding(){
  if(!S) return;
  S.running = false;
  showSecretEndScreen();
}
function showSecretEndScreen(){
  document.getElementById('winTitle').textContent = '✦ SECRET ENDING — HÒA GIẢI ✦';
  document.getElementById('winSub').textContent = 'Ba mảnh La Peace hợp nhất thành một luồng sáng ấm áp. TIU và Trọng cùng tan vào ánh sáng ấy — có lẽ, đây mới là câu trả lời thật sự cho việc "đừng ngủ quên ở UIT".';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'TIẾP TỤC';
  nextBtn.onclick = ()=>{ document.getElementById('winScreen').classList.add('hidden'); startEpilogue('secret'); };
  document.getElementById('winScreen').classList.remove('hidden');
}

/* ============== FLOW ============== */
function refreshAll(){
  refreshHud(); refreshMap(); refreshActionPane();
}
function beginNight(n, standalone){
  if(n===1){
    campaignLaPeace = 0; // mỗi lượt chơi mới (từ Đêm 1) reset lại số La Peace đã nhặt
    campaignNpcTalks = { E: new Set(), B: new Set() }; // ... và reset lại tiến độ tin tưởng NPC
    campaignLoreFound = new Set(); // ... và reset lại các manh mối đã tìm thấy
  }
  S = freshState(n);
  S.standalone = !!standalone;
  addLog('Ca trực '+NIGHT_CFG[n].name+' bắt đầu lúc 00:00. Bạn xuất phát tại '+ROOM_DEF[S.playerRoom].name+'.','');
  buildMap();
  refreshAll();
  hideAllOverlays();
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('blackout').classList.remove('on');
  document.getElementById('miniMapWrap')?.classList.remove('mapBlackout');
  document.getElementById('mapModal')?.classList.remove('mapBlackout');
  document.getElementById('meterOuter').classList.remove('enraged','epi-hide');
  document.getElementById('staminaOuter').classList.remove('epi-hide');
  setRoomTitleGlitch(false);
  updateBlackoutUI();
  playVN(VN_INTRO[n], ()=>{});
}
function hideAllOverlays(){
  ['titleScreen','chapterSelectScreen','chapterIntroScreen','nightSelectScreen','settingsScreen','gameOverScreen','winScreen','chapterEndScreen'].forEach(id=>{
    document.getElementById(id).classList.add('hidden');
  });
}
function showTitle(){
  hideAllOverlays();
  document.getElementById('titleScreen').classList.remove('hidden');
}

/* ---- Chapters: hiện tại chỉ có Chapter 1 (nội dung đầy đủ trong file này).
   Chapter 2 trở đi sẽ được bổ sung sau — placeholder "SẮP RA MẮT" cho đến lúc đó. ---- */
const CHAPTERS = [
  { id:1, name:'CHAPTER 1', title:'ĐỪNG NGỦ QUÊN Ở UIT', desc:'3 đêm lén ở lại khuôn viên trường để trốn The TIU.', locked:false },
  { id:2, name:'CHAPTER 2', title:'???', desc:'Sắp ra mắt.', locked:true }
];

/* ---- Panel tóm tắt / hướng dẫn hiện ra khi bắt đầu một chapter ---- */
const CHAPTER_INTRO = {
  1:{
    title:'CHAPTER 1',
    subtitle:'ĐỪNG NGỦ QUÊN Ở UIT',
    html:`<p>Phòng trọ của bạn phải <b>3 ngày nữa mới dọn vào được</b>, nên tối nay bạn đành lén ở lại trong khuôn viên trường để chờ qua ngày.
    Bạn phải sống sót qua các khu vực: Nhà A, B, C, D, E, Thư viện và Căn tin.
    Mỗi đêm trôi qua từ 00:00 đến 07:30 (kéo dài khoảng 15 phút thực tế). Mỗi khu vực sẽ phát sinh sự cố ngẫu nhiên — bỏ lỡ hoặc làm hỏng
    sẽ khiến <b style="color:var(--blood-bright)">The TIU</b> hoạt động mạnh hơn và dễ phát hiện ra bạn hơn. Nếu bạn đứng cùng tòa với The TIU, bạn sẽ bị jumpscare
    và mất 1 HP. Mất 3 HP là thua. <b>Căn tin chỉ an toàn khi mở cửa</b> (01:00-02:00 &amp; 04:00-05:00) — nán lại đó quá lâu cũng khiến bạn cạn <b>Thể lực</b> và bị đói.
    Khi thanh mức độ hoạt động chạm 100%, <b style="color:var(--blood-bright)">Huyết Nguyệt</b> sẽ kích hoạt và không nơi nào còn an toàn. Hãy để ý các sinh viên khác cũng đang lén ở lại trong khuôn viên — họ có thể giúp bạn.</p>
    <p>Mỗi đêm chia làm 3 giai đoạn: <b>Khởi động</b> (tuần tra, thu gom linh kiện), <b>Biến cố trung tâm</b> (mất điện toàn trường — phải chạy đến <b>Tòa C</b> khởi động lại cầu dao tổng), rồi <b>Săn đuổi dồn dập</b> (The TIU nhanh hơn hẳn và một số cửa bị khóa, cần gỡ khóa hoặc đi vòng).
    Hãy nhặt <b>linh kiện</b> (pin cũ, dây điện, băng keo, ống thép) rải rác trong các góc tối rồi ghé <b>Bàn chế tạo</b> ở Căn tin để tự chế Camera, Cầu dao, Đèn UV hay Bẫy gây nhiễu. Đừng quên tìm các <b>manh mối</b> ẩn (nhật ký, đĩa ghi âm, mật mã) để hiểu thêm về The TIU.
    Bấm <b>ESC</b> khi đang chơi để mở bảng tạm dừng.</p>`
  }
};

let chapterIntroBackAction = showTitle;
function showChapterIntro(chapterId, onContinue, onBack){
  const info = CHAPTER_INTRO[chapterId];
  if(!info){ onContinue(); return; }
  hideAllOverlays();
  document.getElementById('chapterIntroTitle').textContent = info.title;
  document.getElementById('chapterIntroSubtitle').textContent = info.subtitle;
  document.getElementById('chapterIntroBody').innerHTML = info.html;
  document.getElementById('chapterIntroScreen').classList.remove('hidden');
  chapterIntroBackAction = onBack || showTitle;
  document.getElementById('chapterIntroContinueBtn').onclick = ()=>{ hideAllOverlays(); onContinue(); };
}
document.getElementById('chapterIntroBackBtn').onclick = ()=> chapterIntroBackAction();

function buildChapterSelect(){
  const wrap = document.getElementById('chapterCardWrap');
  wrap.innerHTML='';
  CHAPTERS.forEach(ch=>{
    const card=document.createElement('div');
    card.className='nightCard chapterCard' + (ch.locked ? ' locked' : '');
    card.innerHTML = `<b>${ch.name} — ${ch.title}</b><span>${ch.desc}</span>`;
    if(ch.locked){
      card.innerHTML += `<span class="chapterLockedTag">🔒 SẮP RA MẮT</span>`;
    } else {
      card.onclick=()=>{
        showChapterIntro(ch.id, ()=>{
          buildNightSelect();
          document.getElementById('nightSelectScreen').classList.remove('hidden');
        }, ()=>{
          hideAllOverlays(); buildChapterSelect();
          document.getElementById('chapterSelectScreen').classList.remove('hidden');
        });
      };
    }
    wrap.appendChild(card);
  });
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

document.getElementById('startBtn').onclick=()=>{
  showChapterIntro(1, ()=>beginNight(1,false), showTitle);
};
document.getElementById('chapterSelectBtn').onclick=()=>{
  hideAllOverlays(); buildChapterSelect();
  document.getElementById('chapterSelectScreen').classList.remove('hidden');
};
document.getElementById('settingsBtn').onclick=()=>{
  settingsOrigin = 'title';
  hideAllOverlays(); buildSettings();
  document.getElementById('settingsScreen').classList.remove('hidden');
};
document.getElementById('backFromChapterSelect').onclick = showTitle;
document.getElementById('backFromSelect').onclick = ()=>{
  hideAllOverlays(); buildChapterSelect();
  document.getElementById('chapterSelectScreen').classList.remove('hidden');
};
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
document.getElementById('chapterEndMenuBtn').onclick = ()=>{
  if(S){ S.epilogue = false; S.running = false; }
  showTitle();
};

/* ============== PAUSE MENU (ESC) ============== */
function isBlockingOverlayOpen(){
  return ['mgModal','mapModal','vnOverlay','jumpscareOverlay','gameOverScreen','winScreen','settingsScreen','battleOverlay','chapterEndScreen']
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

/* ---- CHEAT (dev/test): bấm phím "P" nhảy thẳng vào trận đánh boss bí mật / secret ending,
   bỏ qua yêu cầu nhặt đủ 3 La Peace và tìm gặp Trọng. Chỉ hoạt động khi đang có 1 ván
   đang chạy và chưa ở trong trận đánh khác. ---- */
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'p' && e.key !== 'P') return;
  if(e.ctrlKey || e.metaKey || e.altKey) return; // tránh trùng với tổ hợp phím khác của trình duyệt/OS
  e.preventDefault();
  if(!S || !S.running) return;
  if(isBlockingOverlayOpen()) return;
  if(BS && !BS.over) return;
  campaignLaPeace = 3;
  startSecretBattle();
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