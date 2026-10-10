(function(){
"use strict";

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

const NPC_IMAGES = { E:"", B:"", TRONG:"" };


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


const EPILOGUE_START_MIN = 15*60;
const EPILOGUE_END_MIN = 18*60;
const TIU_IMAGE = "assets/images/TIU.png";
const TRONG_CURSE_IMAGE = "assets/images/trong_curse.png";
const TRONG_CURSE_MUSIC = "assets/sfx/OST/battle2.mp3";
const TRONG_CHASE_JUMPSCARE_SFX = "assets/sfx/TrongAttack.mp3";
const TRONG_CHASE_PROXIMITY_MUSIC = "assets/sfx/OST/TrongNear.mp3";
const TIU_JUMPSCARE_SFX = "assets/sfx/TIUAttack.mp3";
const TIU_PROXIMITY_MUSIC = "assets/sfx/OST/TIU.mp3";
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

/* ---- Chapter 2, Đêm 3: TRỌNG "The Grimoire" thay thế The TIU làm kẻ đuổi bắt. Dùng để đổi
   toàn bộ hình ảnh/nhạc/text jumpscare + nhãn HUD sang Trọng mà không phải nhân đôi engine né
   tránh. Xem PHẦN "ĐÊM 3 — TRỌNG ĐUỔI BẮT" bên dưới (jumpscare(), updateProximityAudio()...). ---- */
function isTrongChaseNight(){ return !!(S && S.chapter===2 && S.night===3 && !S.epilogue); }
function chaseMonsterLabel(){ return isTrongChaseNight() ? 'TRỌNG' : 'THE TIU'; }

const GAME_MINUTES_TOTAL = 7.5*60; // 00:00 -> 07:30 — MẶC ĐỊNH cho Chapter 1 (không đổi)
const REAL_MS_PER_GAME_MIN = (15*60*1000) / GAME_MINUTES_TOTAL; // 1 màn ~ 15 phút thực tế (Chapter 1)

/* ---- Chapter 2: đêm chạy 21:00 -> 07:30 (630 phút game), KHÁC với Chapter 1 (00:00 -> 07:30,
   450 phút). S.gameMinutes vẫn luôn bắt đầu từ 0 ở đầu mỗi đêm (duration kể từ lúc bắt đầu ca
   trực) — S.nightStartClockMin là GIỜ THỰC (tính bằng phút kể từ 00:00) mà mốc gameMinutes=0
   tương ứng, dùng để quy đổi ra giờ hiển thị HUD + khung giờ mở Căn Tin (xem formatClock,
   isCanteenOpen). S.nightTotalMin thay thế GAME_MINUTES_TOTAL làm mốc kết thúc đêm.
   REAL_MS_PER_GAME_MIN KHÔNG đổi theo chapter -> đêm Chapter 2 dài hơn (630 vs 450 phút game)
   nên sẽ tốn nhiều thời gian thực hơn tương ứng (~21 phút thay vì ~15 phút) — hợp lý vì nội
   dung Chapter 2 (đội hình 3 người, 3 giai đoạn/đêm) nhiều hơn hẳn. */
function nightClockCfg(chapter){
  return chapter===2
    ? { startClockMin: 21*60, totalMin: 10.5*60 } // 21:00 -> 07:30
    : { startClockMin: 0,     totalMin: GAME_MINUTES_TOTAL }; // 00:00 -> 07:30
}
const BASE_MOVE_COST_MIN = 10; // mỗi lượt di chuyển giữa 2 tòa liền kề LUÔN mất đúng 10 phút (game-time)
const BUFF_MOVE_COST_MIN = 5;  // đang có buff Nước tăng lực -> mỗi lượt di chuyển chỉ mất 5 phút

/* ---- Trọng (Chapter 1): luôn xuất hiện ở Tòa C trong khung 04:00-06:00 mỗi đêm ---- */
const TRONG_WINDOW = [240, 360]; // phút kể từ 00:00 (Chapter 1 bắt đầu ca trực lúc 00:00)
function isTrongWindow(){ return !!S && S.gameMinutes>=TRONG_WINDOW[0] && S.gameMinutes<TRONG_WINDOW[1]; }

/* ---- Camping fix: Căn tin chỉ mở trong khung giờ cố định ---- */
const CANTEEN_WINDOWS = [[60,120],[240,300]]; // 01:00-02:00 & 04:00-05:00 (giờ THỰC trong ngày, không phải phút kể từ lúc bắt đầu ca trực)
function isCanteenOpen(gmin){
  const startOffset = (S && S.nightStartClockMin) || 0;
  const t = (gmin + startOffset) % (24*60);
  return CANTEEN_WINDOWS.some(([a,b])=>t>=a && t<b);
}
/* Phòng có thực sự an toàn ngay lúc này không (tính cả trạng thái Huyết Nguyệt) */
function isRoomSafe(k){
  if(S && S.enraged) return false; // Huyết Nguyệt: The TIU phá vỡ mọi quy tắc safezone
  if(!ROOM_DEF[k].safe) return false;
  return isCanteenOpen(S ? S.gameMinutes : 0);
}

/* ---- Thể lực ---- */
const MOVE_STAMINA_COST = 15;        // % thể lực tiêu hao mỗi lần di chuyển (bình thường)
const MOVE_STAMINA_COST_BUFFED = 5; // % thể lực tiêu hao mỗi lần di chuyển khi có buff Nước tăng lực
const STAMINA_REGEN_IDLE = 1;        // mỗi phút game đứng yên (không di chuyển) hồi 1% thể lực
const STARVE_TICK_MIN = 55;          // cạn thể lực -> mất máu mỗi X phút game

/* ---- Huyết Nguyệt ---- */
const ENRAGE_DURATION_MIN = 100;   // Huyết Nguyệt kéo dài bao lâu (phút game) trước khi hạ nhiệt

/* ---- Tiếng ồn khi có buff tốc độ ---- */
const NOISE_ATTRACT_CHANCE = 0.35;
/* Di chuyển BÌNH THƯỜNG (không buff) khi MỨC ĐỘ HOẠT ĐỘNG đã cao vẫn có
   một xác suất nhỏ gây chú ý — càng căng thẳng, bước chân bình thường càng dễ bị nghe thấy.
   Chỉ tính từ ngưỡng NOISE_NORMAL_METER_FLOOR trở lên (dưới ngưỡng này coi như an toàn tuyệt đối). */
const NOISE_NORMAL_METER_FLOOR = 55;
const NOISE_NORMAL_MAX_CHANCE = 0.22; // xác suất tối đa (khi meter chạm 100) khi di chuyển bình thường

/* ---- Mức Độ Hoạt Động (meter) giờ còn tăng liên tục theo tình huống, không chỉ khi bỏ lỡ/thất bại
   sự cố — tạo áp lực dồn dập hơn qua thời gian thay vì chỉ nhảy bậc theo phase. ---- */
const TENSION_NEARMISS_GAIN = 4;        // The TIU áp sát (phòng liền kề) -> hoạt động tăng vọt
const TENSION_NEARMISS_COOLDOWN = 26;   // phút game giữa 2 lần cộng dồn near-miss (tránh cộng dồn liên tục)
const TENSION_IDLE_GRACE_MIN = 40;      // đứng yên một chỗ (khu KHÔNG an toàn) bao lâu thì mới bắt đầu bị tính
const TENSION_IDLE_GAIN_PER_MIN = 0.05; // mỗi phút đứng yên thêm (sau khi hết grace) cộng dồn hoạt động

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
  const total = (S && S.nightTotalMin) || GAME_MINUTES_TOTAL; // co giãn theo tổng thời lượng đêm thật (450 Chapter 1 / 630 Chapter 2)
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
  {id:'diary1', title:'Nhật ký cũ — Trang giấy xé vội', text:'"...tôi thấy nó lần đầu tiên ở hành lang Tòa E, một thực thể kì dị..."'},
  {id:'audio1', title:'Đĩa ghi âm bảo vệ ca đêm', text:'Giọng nói rè rè phát ra từ chiếc đĩa cũ: "...báo cáo 2 giờ 15, phát hiện tiếng động lạ tại Tòa C, sau đó... [tạp âm]..."'},
  {id:'safe1', title:'Mật mã két sắt phòng quản lý', text:'Một mảnh giấy nhàu nát ghi vội: "Mã két: 0 - 4 - 1 - 9."'},
  {id:'diary2', title:'Nhật ký cũ — Trang giấy thứ hai', text:'"...The TIU không phải lúc nào cũng như vậy. Có ai đó đã làm gì với nó, từ rất lâu rồi..."'},
  {id:'audio2', title:'Đoạn ghi âm cuối cùng', text:'"...nếu ai nghe được đoạn này, đừng xuống Tòa C một mình sau 1 giờ sáng. Đừng đi một mình..."'},
  {id:'note1', title:'Mẩu giấy nhét trong sách thư viện', text:'"Ba mảnh La Peace... có ai đó đang gom chúng. Chắc không phải để xoa dịu ai cả."'},
  {id:'chat1', title:'Màn hình chat bỏ quên', text:'Một cửa sổ chat còn sáng: "Mika: Anh Trọng ơi, hôm nay em ra ngoài được chưa? — Sắp rồi em. Đợi anh thêm chút nữa."'},
  {id:'chalk1', title:'Vòng phấn bị lau vội', text:'Một vòng ma pháp vẽ bằng phấn, lau dở. Ở giữa còn sót dòng chữ: "Nghi lễ triệu hồi — thiếu ma lực."'},
  {id:'mark1', title:'Mảnh giấy ghi chép', text:'"Ấn chú dẫn lối: nhắm ngẫu nhiên, cho ngủ quên, đừng để chúng nhớ gì. Chủ nhân: dòng họ pháp sư. Ký tên: T."'}
];

/* Những manh mối đã tìm thấy xuyên suốt lượt chơi thường (đêm 1 -> 3), reset khi bắt đầu
   lại từ Đêm 1 (giống campaignLaPeace / campaignNpcTalks). */
let campaignLoreFound = new Set();

/* ---- Túi đồ: thông tin hiển thị (tên/mô tả) cho từng loại vật phẩm & linh kiện ---- */
const ITEM_META = {
  bimbim:    {name:'Bim Bim',              icon:'🍟', desc:'Đồ ăn vặt — dùng ngay để hồi 1 HP.'},
  water:     {name:'Nước tăng lực',        icon:'🥤', desc:'Uống để tăng tốc di chuyển và giảm hao thể lực trong 90 phút game, nhưng bước chân sẽ ồn hơn.'},
  camera:    {name:'Camera Sinh viên',     icon:'📷', desc:'Định vị trực tiếp The TIU trên sơ đồ trong 3 lượt di chuyển tiếp theo.'},
  breaker:   {name:'Bộ Sập Cầu Dao',       icon:'⚡', desc:'Ngắt điện toàn khuôn viên, vô hiệu hóa The TIU trong 60 phút — nhưng bạn phải di chuyển trong bóng tối.'},
  uvlight:   {name:'Đèn chiếu UV',         icon:'💡', desc:'Làm choáng và đẩy lùi The TIU nếu nó đang ở gần bạn.'},
  noisetrap: {name:'Bẫy gây nhiễu',        icon:'📢', desc:'Đặt tại phòng hiện tại để thu hút The TIU đi nơi khác.'}
};
const COMPONENT_META = {
  pin:  {name:'Pin cũ',    icon:'🔋', desc:'Nguyên liệu chế tạo. Đem tới Bàn chế tạo trong khu an toàn để làm ra vật phẩm.'},
  wire: {name:'Dây điện',  icon:'🔌', desc:'Nguyên liệu chế tạo. Đem tới Bàn chế tạo trong khu an toàn để làm ra vật phẩm.'},
  tape: {name:'Băng keo',  icon:'🧷', desc:'Nguyên liệu chế tạo. Đem tới Bàn chế tạo trong khu an toàn để làm ra vật phẩm.'},
  pipe: {name:'Ống thép',  icon:'🔧', desc:'Nguyên liệu chế tạo. Đem tới Bàn chế tạo trong khu an toàn để làm ra vật phẩm.'}
};

/* ================= CHAPTER 2 — GIAI ĐOẠN 2 (ĐỘI HÌNH 3 NGƯỜI) =================
   Toàn bộ hằng số & helper cho hệ thống Bộ Đàm, Chàng Lính (B) / Wibu Việt Nhật (E)
   làm việc độc lập, Stress/Safety, Setup Gauge (Đêm 1) và 3 giai đoạn Đêm 2.
   Chỉ có hiệu lực khi S.chapter===2 (xem freshState()). */

/* Mỗi lệnh gửi qua Bộ Đàm tốn bấy nhiêu phút game — rẻ hơn nhiều so với việc
   người chơi tự di chuyển (BASE_MOVE_COST_MIN=10), vì đây là hành động từ xa. */
const RADIO_COMMAND_COST_MIN = 2;

/* Thời lượng (phút game) mỗi nhiệm vụ chuyên môn cần hoàn thành, xem Phần 4 design doc. */
const TASK_DURATION_MIN = {
  scavengeHeavy: 40,   // Chàng Lính (B) — thu gom thiết bị cơ khí tại B hoặc E
  scavengeTech:  40,   // Wibu (E) — lấy linh kiện máy tính tại D
  buildTrap:     120,  // Chàng Lính (B) — dựng Bẫy Quang Học tại FIELD
  wireBoosterC:  120,  // Wibu (E) — đấu nối điện cao áp tại C
};

/* Nhãn hiển thị + giai đoạn (stage) của từng nhiệm vụ — nhiệm vụ stage 1 (buildTrap/
   wireBoosterC) chỉ mở khoá SAU KHI nhiệm vụ stage 0 tương ứng đã hoàn thành
   (npc.stage tăng dần 0 -> 1 -> 2 mỗi khi completeNPCTask(), xem PHẦN 2). */
const TASK_LABELS = {
  scavengeHeavy: 'Thu gom thiết bị cơ khí',
  scavengeTech:  'Lấy linh kiện máy tính',
  buildTrap:     'Dựng Bẫy Quang Học tại Trận Địa',
  wireBoosterC:  'Đấu nối điện cao áp tại Tòa C',
};
const TASK_STAGE = { scavengeHeavy:0, scavengeTech:0, buildTrap:1, wireBoosterC:1 };

/* Nhiệm vụ khả dụng tiếp theo cho 1 NPC dựa trên npc.stage hiện tại.
   stage 0 -> nhiệm vụ thu gom; stage 1 -> nhiệm vụ thi công/đấu nối; stage 2 -> hết việc. */
function availableTaskFor(k){
  const npc = S.npc[k];
  if(!npc || npc.stage>=2) return null;
  if(k==='B') return npc.stage===0 ? 'scavengeHeavy' : 'buildTrap';
  if(k==='E') return npc.stage===0 ? 'scavengeTech' : 'wireBoosterC';
  return null;
}

/* Phòng đích ứng với từng loại nhiệm vụ. scavengeHeavy phụ thuộc S.scavengeRoomB
   (chốt ngẫu nhiên B hoặc E lúc freshState mỗi đêm). */
function taskRoomFor(npcKey, task){
  const map = {
    scavengeHeavy: S.scavengeRoomB,
    buildTrap:     'FIELD',
    scavengeTech:  'D',
    wireBoosterC:  'C',
  };
  return map[task] || null;
}

/* 3 mốc phát sóng cố định dùng ở Đêm 2 — Giai đoạn Lùa Địch (Phần 6.1). */
const LURE_STATIONS = ['B','E','D'];
const LURE_STATION_OWNER = { B:'npcB', E:'npcE', D:'player' };

/* Khoảng cách ngắn nhất (số bước) giữa 2 phòng — TÁI DÙNG roomDistance() đã có sẵn
   trong file (đặt gần bfsPath()/moveMonster, phía dưới). Alias để code Phần 3 (Stress)
   đọc rõ nghĩa hơn khi dùng trong ngữ cảnh "khoảng cách NPC <-> TIU". */
function roomGraphDistance(fromRoom, toRoom){ return roomDistance(fromRoom, toRoom); }

/* Bước đi kế tiếp trên đường đi ngắn nhất từ fromRoom -> toRoom, TÁI DÙNG bfsPath()
   đã có sẵn (dùng cho AI của TIU) thay vì viết lại BFS riêng. avoidSafe=false vì NPC
   đồng đội được phép băng qua khu an toàn khi di chuyển. */
function nextStepToward(fromRoom, toRoom){
  if(fromRoom === toRoom) return fromRoom;
  const path = bfsPath(fromRoom, toRoom, false);
  return (path && path.length>1) ? path[1] : fromRoom;
}

let campaignCarry = null;
let campaignSpellMastery = 0;
let trongTrainedForNight = { 1:false, 2:false };
const SAVE_KEY = 'uit_savegame_v1';
/* Cờ "đã hoàn thành Chapter 1" — lưu riêng, không bị xoá khi deleteSaveGame(). Chapter 2 bị khoá cho tới khi có cờ này. */
const CH1_CLEARED_KEY = 'uit_chapter1_cleared';
function isChapter1Cleared(){ try{ return localStorage.getItem(CH1_CLEARED_KEY)==='1'; }catch(e){ return false; } }
function markChapter1Cleared(){ try{ localStorage.setItem(CH1_CLEARED_KEY,'1'); }catch(e){} }

function pickDistinctRooms(pool, n){
  const arr = shuffle(pool.slice());
  return arr.slice(0, Math.min(n, arr.length));
}

/* ============== STATE ============== */
let S = null;

/* ---- Lưu / Tải game ---- */
function serializeSave(){
  if(!S) return null;
  return {
    v: 1,
    savedAt: Date.now(),
    state: S,
    campaign: {
      laPeace: campaignLaPeace,
      npcTalksE: Array.from(campaignNpcTalks.E),
      npcTalksB: Array.from(campaignNpcTalks.B),
      loreFound: Array.from(campaignLoreFound),
      carry: campaignCarry
    }
  };
}
function persistSave(){
  if(!S || !S.running) return;
  try{
    const data = serializeSave();
    if(data) localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){}
}
let _autoSaveTimer = null;
function scheduleAutoSave(){
  if(_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(persistSave, 800);
}
function readSaveGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function hasSaveGame(){ return !!readSaveGame(); }
function deleteSaveGame(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
function loadGame(){
  const data = readSaveGame();
  if(!data || !data.state) return false;
  S = data.state;
  S.lastTick = performance.now();
  campaignLaPeace = (data.campaign && data.campaign.laPeace) || 0;
  campaignNpcTalks = {
    E: new Set((data.campaign && data.campaign.npcTalksE) || []),
    B: new Set((data.campaign && data.campaign.npcTalksB) || [])
  };
  campaignLoreFound = new Set((data.campaign && data.campaign.loreFound) || []);
  campaignCarry = (data.campaign && data.campaign.carry) || null;
  buildMap();
  hideAllOverlays();
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('meterOuter').classList.remove('epi-hide');
  document.getElementById('staminaOuter').classList.remove('epi-hide');
  setRoomTitleGlitch(!!S.enraged);
  refreshAll();
  updateBlackoutUI();
  refreshBagBadge();
  addLog('📂 Đã tải lại tiến trình đã lưu.', '');
  return true;
}

/* Chapter 2 (bản dựng thử) là nơi các tính năng khó hơn — cúp điện/cầu dao và
   thu gom & chế tạo vật phẩm — được kích hoạt. Chapter 1 không còn dùng các
   tính năng này nữa (xem freshState, checkPhaseTransition, refreshActionPane). */
function isHardMode(){ return !!(S && S.chapter===2); }

function freshState(night, chapter){
  chapter = chapter || 1;
  const startRoom = ROOM_KEYS[Math.floor(Math.random()*ROOM_KEYS.length)];
  let monsterRoom = ROOM_KEYS.filter(r=>r!==startRoom && !ROOM_DEF[r].safe)[Math.floor(Math.random()*4)];
  // --- La Peace: mảnh năng lượng ôn hòa, 1 mảnh ẩn xuất hiện ngẫu nhiên mỗi đêm.
  // Chỗ Gửi Xe và Sân Bóng có tỉ lệ xuất hiện La Peace cao hơn hẳn các khu vực khác. ---
  const peaceSpots = ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe && r!==startRoom);
  const laPeaceRoom = weightedPeaceRoom(peaceSpots.length ? peaceSpots : ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe));

  // --- Thu gom: rải linh kiện ngẫu nhiên vào các góc tối (tối đa 5 phòng không an toàn) ---
  // Chỉ áp dụng ở Chapter 2 — thu gom & chế tạo là tính năng độ khó cao dành riêng cho đó.
  const nonSafeRooms = ROOM_KEYS.filter(r=>!ROOM_DEF[r].safe);
  const scavengeRooms = chapter===2 ? pickDistinctRooms(nonSafeRooms, Math.min(5, nonSafeRooms.length)) : [];
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

  // --- Đội hình 3 người (Chapter 2, Đêm 1 & 2): Chàng Lính (B) / Wibu (E) ---
  // scavengeRoomB: nơi Chàng Lính đi thu gom thiết bị cơ khí — random B hoặc E mỗi đêm.
  const scavengeRoomB = chapter===2 ? pick(['B','E']) : null;
  const npcTeam = chapter===2 ? {
    B: { name:'Chàng Lính', room:'CANTEEN', task:null, taskProgress:0, stress:0, status:'idle', downSince:null, moveAccum:0, stage:0 },
    E: { name:'Wibu Việt Nhật', room:'CANTEEN', task:null, taskProgress:0, stress:0, status:'idle', downSince:null, moveAccum:0, stage:0 },
  } : null;

  const clockCfg = nightClockCfg(chapter);

  return {
    chapter,
    night,
    gameMinutes: 0,
    nightStartClockMin: clockCfg.startClockMin, // 0 (Chapter 1) | 1260=21:00 (Chapter 2)
    nightTotalMin: clockCfg.totalMin,            // 450 (Chapter 1) | 630 (Chapter 2)
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
    // --- nhịp độ dồn dập (mục 1) ---
    lastMoveAt: 0,        // gameMinutes tại lần di chuyển gần nhất, dùng để phát hiện đứng yên quá lâu
    nextTensionTickAt: 0, // cooldown giữa 2 lần cộng dồn "near-miss" vào meter
    // --- Huyết Nguyệt ---
    enraged: (chapter===2 && night===2), // Đêm 2 Chapter 2: TIU Cuồng Nộ NGAY TỪ ĐẦU đêm (Phần 6.1), giữ mãi tới hết đêm — xem advanceWorld()
    enrageUntil: 0,
    // --- item hiệu ứng ---
    cameraMovesLeft: 0,
    breakerUntil: 0,
    // --- visual novel / NPC ---
    paused: false,
    npcSeen: {},     // {roomKey: nightNumber đã xem}
    trongSeen: false,
    trongBattleStarted: false, // true nếu đã đưa đủ 3 mảnh cho Trọng & vào trận tế lễ (Đêm 3)
    trongSealFail: false,      // true nếu Đêm 3 kết thúc mà không có tế lễ -> ending Trọng phong ấn TIU
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
    loreClues: loreClues,     // roomKey -> clue id còn nằm đó

    // ===== Chapter 2 — Đội hình 3 người (chỉ có ý nghĩa khi chapter===2) =====
    scavengeRoomB: scavengeRoomB,     // 'B' | 'E' | null — nơi Chàng Lính thu gom đêm nay
    npc: npcTeam,                     // {B:{...}, E:{...}} | null — xem PHẦN 1 design doc
    setupGauge: 0,                    // 0-100, chốt cuối Đêm 1 (finalizeSetupGauge()), quyết định độ khó Đêm 2
    setupGaugeCapPenalty: 0,          // phạt cộng dồn khi NPC bị TIU bắt lúc đang 'down' (Phần 3.2)
    laPeaceIntegrated: 0,             // số mảnh La Peace đã nạp vào bộ khuếch đại (04:00-07:30 Đêm 1)
    laPeaceCarried: 0,                // số mảnh đã nhặt nhưng CHƯA nạp vào bộ khuếch đại (xem depositLaPeace())
    laPeaceNeeded: 1,                 // ⚠ tạm đặt =1 vì hệ thống spawn hiện tại (weightedPeaceRoom) chỉ rải
                                       // ĐÚNG 1 mảnh La Peace/đêm — cần mở thêm điểm spawn riêng cho Chapter 2
                                       // Đêm 1 nếu muốn khớp đúng ý "các mảnh" (số nhiều) trong bản thiết kế gốc.
    spellMastery: 0,                  // 0-100, học từ Trọng trước Đêm 1/Đêm 2 (buổi 16:30-20:45)
    phaseN1: 'scout',                 // scout | construct | charge — xem checkNight1Phase() (PHẦN 5)
    night2: {                         // trạng thái riêng cho 3 giai đoạn Đêm 2 (Phần 6)
      phase: 'luring',                // luring | lockdown | overload | resolved
      lureSync: { B:false, E:false, D:false },
      overloadMeter: 0,               // 0-100, tuyến tính theo thời gian 04:30->07:30, luôn chạm 100 lúc 07:30
      trapIntegrity: 100,             // 0-100, giảm khi bị TIU tấn công ở Overload Phase, phải giữ >0
      syncWindowActive: false,
      activeThreats: [],              // [{id, lane, deadline}] — Overload Phase (Phần 6.3)
    },
    chapter3: {                       // chỉ dùng nếu endingRoute==='secret' (Đêm 3, xem Phần 8.2)
      active: false,
      downCount: 0,                   // 0,1,2 = có thể "đứng dậy"; chạm 3 = trigger tiến hoá
      soulsAwakened: false,
    },
    endingRoute: null,                // 'normal' | 'secret' — chốt ở đỉnh điểm Overload Phase (Phần 6.4)
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
function clamp(v,lo,hi){ return Math.min(hi, Math.max(lo, v)); }

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
/* Mỗi phần tử của `lines` thường là {spk,text}. Từ nay hỗ trợ thêm nhánh rẽ:
   {spk,text,choices:[{label, insert:[...dòng thoại kế tiếp...]}]} — khi gặp
   dòng có `choices`, nút TIẾP TỤC được thay bằng các nút lựa chọn; bấm vào
   một lựa chọn sẽ chèn `insert` (nếu có) ngay sau dòng hiện tại rồi tiếp tục
   như bình thường. Dùng cho các đoạn thoại có nhánh lựa chọn (xem
   CHAPTER2_OPEN_SECRET trong dialogue.js). */
/* Bộ điều khiển của đoạn hội thoại ĐANG PHÁT (null nếu không có) — phục vụ phím tắt J / Ctrl
   (xem mục "PHÍM TẮT" ở cuối file). Mỗi lần gọi playVN() sẽ tạo bộ điều khiển mới và ghi đè. */
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
  if(S.chapter===2) return null; // Hội thoại NPC riêng cho Chapter 2 sẽ được bổ sung sau
  if(roomKey==='C' && isTrongWindow() && !S.trongSeen){
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
    const shards = campaignLaPeace;
    // Đủ 3 mảnh ở Đêm 3 (chế độ chơi thường) -> Trọng làm tế lễ, không còn yêu cầu tin tưởng Wibu/Lính.
    const unlockSecret = !S.standalone && S.night===3 && shards>=3;
    playVN(buildTrongLines(S.night, shards), ()=>{
      applyVNReward(TRONG_DIALOGUE.reward);
      if(unlockSecret){
        S.trongBattleStarted = true;
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
  const startOffset = (S && S.nightStartClockMin) || 0; // 0 (Chapter 1) hoặc 21:00=1260 (Chapter 2)
  let total = gmin + startOffset;
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
  document.getElementById('nightBadge').textContent = S.epilogue ? 'BUỔI SÁNG' : (S.chapter===2 ? 'CH.2 · ' : '')+NIGHT_CFG[S.night].name;
  const hpWrap = document.getElementById('hpWrap');
  hpWrap.innerHTML='';
  for(let i=0;i<3;i++){
    const d=document.createElement('div');
    d.className='hpdot'+(i<S.hp?'':' lost');
    hpWrap.appendChild(d);
  }
  document.getElementById('meterFill').style.width = Math.min(100,S.meter)+'%';
  document.getElementById('vignette').classList.toggle('critical', S.hp===1);

  // --- Mục 1: đưa Mức Độ Hoạt Động ra CSS/DOM để tạo áp lực hình ảnh liên tục, mượt dần
  //     theo mức độ thay vì chỉ nhảy bậc — xem #tensionPulse và body.tension-* trong style.css,
  //     và horror-polish.js đọc data-tension để random nhấp nháy môi trường. ---
  const tensionPct = S.epilogue ? 0 : Math.max(0, Math.min(100, S.meter));
  document.documentElement.style.setProperty('--tension', (tensionPct/100).toFixed(3));
  document.body.dataset.tension = tensionPct.toFixed(0);
  document.body.classList.toggle('tension-mid', tensionPct>=40 && tensionPct<70);
  document.body.classList.toggle('tension-high', tensionPct>=70 && tensionPct<90);
  document.body.classList.toggle('tension-critical', tensionPct>=90);
  const meterLabelEl = document.getElementById('meterLabel');
  if(meterLabelEl) meterLabelEl.textContent = 'MỨC ĐỘ HOẠT ĐỘNG — '+chaseMonsterLabel();

  const stFill = document.getElementById('staminaFill');
  stFill.style.width = Math.max(0,S.stamina)+'%';
  stFill.classList.toggle('low', S.stamina<30);

  const tiuEl = document.getElementById('tiuLastSeen');
  const tiuLabelEl = document.getElementById('tiuLastSeenLabel');
  if(tiuLabelEl) tiuLabelEl.textContent = chaseMonsterLabel()+' LẦN CUỐI THẤY TẠI';
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
let lastNpcVisible = false; // theo dõi NPC (vd. Trọng 04:00-06:00) xuất hiện/biến mất theo thời gian
function markActionDirty(){ actionPaneDirty = true; scheduleAutoSave(); refreshBagBadge(); }

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
  const td = tdActive(); // chế độ top-down: tương tác trong phòng chuyển sang phím E (xem phần TOP-DOWN)
  banner.classList.toggle('td-on', td);
  const imgUrl = ROOM_IMAGES[S.playerRoom];
  banner.style.backgroundImage = td ? 'none' : (imgUrl
    ? `url('${imgUrl}')`
    : ROOM_FALLBACK_GRADIENT[S.playerRoom]);

  const resolveBtn = document.getElementById('resolveBtn');
  const curEvent = S.activeEvents[S.playerRoom];
  const hasEvent = !!curEvent;
  resolveBtn.classList.toggle('show', hasEvent && !td);
  if(hasEvent){
    resolveBtn.textContent = curEvent.mandatory ? '⚡ KHỞI ĐỘNG LẠI CẦU DAO TỔNG' : '⚠ XỬ LÝ: '+eventLabel(def.event);
    resolveBtn.onclick = ()=>startMinigame(S.playerRoom);
  }

  const npcMeta = getRoomNPCMeta(S.playerRoom);
  const npcSprite = document.getElementById('npcSprite');
  npcSprite.classList.toggle('hidden', !npcMeta || td);
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

  if(def.safe && !td){
    const b=document.createElement('button');
    b.className='btn primary';
    b.textContent = safeNow ? 'Mở quầy Căn tin' : 'Căn tin đang đóng cửa';
    b.disabled = !safeNow;
    b.onclick=openShop;
    itemGroup.row.appendChild(b);

    if(isHardMode()){
      const bench=document.createElement('button');
      bench.className='btn';
      bench.textContent='🛠 Bàn chế tạo';
      bench.onclick=openCraftBench;
      itemGroup.row.appendChild(bench);
    }
  }

  const useBim=document.createElement('button');
  useBim.className='btn danger';
  useBim.textContent='Dùng Bim Bim (+1 HP)';
  useBim.disabled = !canUseBimBim();
  useBim.onclick=()=>{ useBimBim(); refreshActionPane(); };
  itemGroup.row.appendChild(useBim);

  const useWater=document.createElement('button');
  useWater.className='btn';
  useWater.textContent='Uống Nước tăng lực (buff tốc độ, đỡ hao thể lực, gây tiếng ồn)';
  useWater.disabled = !canUseWater();
  useWater.onclick=()=>{ useWaterBoost(); refreshActionPane(); };
  itemGroup.row.appendChild(useWater);

  const useCam=document.createElement('button');
  useCam.className='btn';
  useCam.textContent='Dùng Camera Sinh viên (định vị TIU 3 lượt)';
  useCam.disabled = !canUseCamera();
  useCam.onclick=()=>{ useCameraItem(); refreshActionPane(); };
  itemGroup.row.appendChild(useCam);

  if(isHardMode()){
    const useBreaker=document.createElement('button');
    useBreaker.className='btn danger';
    useBreaker.textContent='Sập Cầu Dao (vô hiệu hóa TIU 60p, tối màn hình)';
    useBreaker.disabled = !canUseBreakerItem();
    useBreaker.onclick=()=>{ useBreakerItem(); refreshActionPane(); };
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
  }

  if(S.laPeaceRoom===S.playerRoom && !S.laPeaceFound && !td){
    const usePeace=document.createElement('button');
    usePeace.className='btn peace';
    usePeace.textContent='✦ Nhặt La Peace (mảnh năng lượng ôn hòa)';
    usePeace.onclick=pickupLaPeace;
    itemGroup.row.appendChild(usePeace);
  }

  if(canDepositLaPeace() && !td){
    const useDeposit=document.createElement('button');
    useDeposit.className='btn peace';
    useDeposit.textContent='⚡ Nạp La Peace vào bộ khuếch đại ('+S.laPeaceCarried+' đang mang theo)';
    useDeposit.onclick=depositLaPeace;
    itemGroup.row.appendChild(useDeposit);
  }

  if(S.scavenge[S.playerRoom] && !td){
    const type = S.scavenge[S.playerRoom];
    const usePickup=document.createElement('button');
    usePickup.className='btn peace';
    usePickup.textContent='🔧 Nhặt '+COMPONENT_NAMES[type]+' trong góc tối';
    usePickup.onclick=pickupScavenge;
    itemGroup.row.appendChild(usePickup);
  }

  if(S.loreClues[S.playerRoom] && !td){
    const useLore=document.createElement('button');
    useLore.className='btn peace';
    useLore.textContent='📖 Thu thập manh mối';
    useLore.onclick=pickupLore;
    itemGroup.row.appendChild(useLore);
  }
  btnWrap.appendChild(itemGroup.g);

  /* ---- Nhóm mới: BỘ ĐÀM (Chapter 2, Đêm 1) — điều phối Chàng Lính (B) & Wibu (E) ---- */
  if(radioTeamActive() && S.night===1){
    btnWrap.appendChild(buildRadioGroup());
  }
  /* ---- Nhóm mới: ĐÊM 2 — Lùa Địch / Sập Bẫy / Quá Tải Cầu Dao (Phần 6) ---- */
  if(radioTeamActive() && S.night===2){
    btnWrap.appendChild(buildNight2Panel());
  }

  /* ---- Nhóm 3: TƯƠNG TÁC ---- */
  if(npcMeta && npcMeta.talkable && !td){
    const interactGroup = makeGroup('TƯƠNG TÁC');
    const talkBtn=document.createElement('button');
    talkBtn.className='btn npc';
    talkBtn.textContent='💬 Nói chuyện với '+npcMeta.name;
    talkBtn.onclick=()=>talkToNPC(npcMeta);
    interactGroup.row.appendChild(talkBtn);
    btnWrap.appendChild(interactGroup.g);
  }

  /* Số lượng vật phẩm không còn hiển thị ở đây nữa — xem trong 🎒 Túi đồ.
     Độ tin tưởng NPC cũng được ẩn, chỉ xem qua nút nhỏ "⋮" cạnh ô Túi đồ
     (xem refreshHiddenStats()). Ở đây chỉ giữ lại các chỉ số tổng quan. */
  const inv = document.getElementById('invRow');
  inv.innerHTML = `${isHardMode() ? '<div class="itemChip">Linh kiện: <b>'+COMPONENT_TYPES.map(k=>COMPONENT_NAMES[k]+' '+S.components[k]).join(' / ')+'</b></div>' : ''}
                    <div class="itemChip">Manh mối: <b>${campaignLoreFound.size}/${LORE_CLUES.length}</b></div>
                    <div class="itemChip">Giai đoạn: <b>${PHASE_NAMES[S.phase]}</b></div>
                    <div class="itemChip">Buff tốc độ: <b>${S.gameMinutes<S.speedBuffUntil?'ĐANG BẬT':'—'}</b></div>
                    <div class="itemChip">Thể lực: <b>${Math.round(Math.max(0,S.stamina))}%</b></div>
                    <div class="itemChip">La Peace: <b>${campaignLaPeace}/3</b></div>
                    ${(isHardMode() && S.night===1) ? `<div class="itemChip">Đêm 1: <b>${PHASE_N1_NAMES[S.phaseN1]}</b></div>
                    <div class="itemChip">Trận Địa: <b>${S.setupGauge}%</b></div>
                    <div class="itemChip">Đang mang La Peace: <b>${S.laPeaceCarried||0}</b></div>` : ''}`;
  refreshHiddenStats();
}

/* ---- Chỉ số ẩn (độ tin tưởng NPC...): không hiện thường trực nữa, chỉ xem
   khi bấm nút "⋮" nhỏ cạnh ô Túi đồ trên HUD. ---- */
function refreshHiddenStats(){
  const pop = document.getElementById('hiddenStatsPopover');
  if(!pop || !S) return;
  pop.innerHTML = `<div class="hiddenStatsTitle">CHỈ SỐ ẨN</div>
                    <div class="itemChip">Tin tưởng Wibu Việt Nhật: <b>${campaignNpcTalks.E.size}/3</b></div>
                    <div class="itemChip">Tin tưởng Chàng Lính: <b>${campaignNpcTalks.B.size}/3</b></div>`;
}

/* ============== LA PEACE (vật phẩm ẩn) ============== */
function pickupLaPeace(){
  if(!S || S.laPeaceFound || S.playerRoom!==S.laPeaceRoom) return;
  S.laPeaceFound = true;
  campaignLaPeace++;
  // Chapter 2 (đội hình 3 người): mảnh La Peace nhặt được CHƯA tính vào Setup Gauge ngay —
  // phải mang tới Căn tin/Tòa C để "nạp vào bộ khuếch đại" ở giai đoạn 04:00-07:30 (xem
  // depositLaPeace() + PHẦN 5 design doc). laPeaceCarried tách biệt hoàn toàn khỏi
  // campaignLaPeace (biến đó chỉ phục vụ điều kiện mở khoá secret ending riêng của Chapter 1).
  if(isHardMode()){
    S.laPeaceCarried = (S.laPeaceCarried||0) + 1;
    addLog('✦ Bạn tìm thấy một mảnh La Peace ẩn tại '+ROOM_DEF[S.playerRoom].name+'! Mang về Căn tin hoặc Tòa C để nạp vào bộ khuếch đại.', '');
  } else {
    addLog('✦ Bạn tìm thấy một mảnh La Peace (năng lượng ôn hòa) ẩn tại '+ROOM_DEF[S.playerRoom].name+'! ('+campaignLaPeace+'/3)', '');
  }
  markActionDirty();
  refreshHud(); refreshActionPane();
}

/* Nạp 1 mảnh La Peace đang mang theo vào bộ khuếch đại — chỉ khả dụng tại Căn tin/Tòa C,
   trong giai đoạn "charge" (04:00-07:30) của Đêm 1 Chapter 2. Xem PHẦN 5 design doc. */
const LA_PEACE_CHARGE_ROOMS = ['CANTEEN','C'];
function canDepositLaPeace(){
  return !!S && isHardMode() && S.night===1 && S.phaseN1==='charge'
    && (S.laPeaceCarried||0) > 0
    && LA_PEACE_CHARGE_ROOMS.includes(S.playerRoom)
    && S.laPeaceIntegrated < S.laPeaceNeeded;
}
function depositLaPeace(){
  if(!canDepositLaPeace()) return;
  S.laPeaceCarried--;
  S.laPeaceIntegrated = Math.min(S.laPeaceNeeded, S.laPeaceIntegrated+1);
  addLog('⚡ Bạn nạp 1 mảnh La Peace vào bộ khuếch đại tại '+ROOM_DEF[S.playerRoom].name+'! ('+S.laPeaceIntegrated+'/'+S.laPeaceNeeded+')', 'good');
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

/* ---- Vật phẩm dùng trực tiếp (dùng chung cho action pane & Túi đồ) ---- */
function canUseBimBim(){ return !!S && S.inventory.bimbim>0 && S.hp<3; }
function useBimBim(){
  if(!canUseBimBim()) return;
  S.inventory.bimbim--; S.hp++; addLog('Bạn ăn Bim Bim, hồi 1 HP.','');
  markActionDirty(); refreshHud();
}
function canUseWater(){ return !!S && S.inventory.water>0; }
function useWaterBoost(){
  if(!canUseWater()) return;
  S.inventory.water--; S.speedBuffUntil = S.gameMinutes + 90;
  addLog('Bạn uống Nước tăng lực — di chuyển nhanh hơn và chỉ tốn '+MOVE_STAMINA_COST_BUFFED+'% thể lực mỗi lần di chuyển trong 90 phút, nhưng bước chân sẽ ồn hơn.','');
  markActionDirty(); refreshHud();
}
function canUseCamera(){ return !!S && S.inventory.camera>0 && S.cameraMovesLeft<=0; }
function useCameraItem(){
  if(!canUseCamera()) return;
  S.inventory.camera--; S.cameraMovesLeft = 3;
  addLog('Bạn bật Camera Sinh viên — theo dõi trực tiếp '+chaseMonsterLabel()+' trong 3 lượt di chuyển tới.','');
  markActionDirty(); refreshHud(); refreshMap();
}
function canUseBreakerItem(){ return !!S && S.inventory.breaker>0 && S.gameMinutes>=S.breakerUntil; }
function useBreakerItem(){
  if(!canUseBreakerItem()) return;
  S.inventory.breaker--; S.breakerUntil = S.gameMinutes + 60;
  addLog('RẦM! Bạn sập cầu dao — toàn khuôn viên mất điện. '+chaseMonsterLabel()+' bị vô hiệu hóa 60 phút, nhưng bạn phải di chuyển mù.','warn');
  markActionDirty(); refreshHud();
}

function useUVLight(){
  if(!S || S.inventory.uvlight<=0) return;
  const dist = roomDistance(S.playerRoom, S.monsterRoom);
  if(dist<=1){
    S.inventory.uvlight--;
    const far = ROOM_KEYS.filter(r=>r!==S.playerRoom && !isRoomSafe(r) && roomDistance(S.playerRoom,r)>=2);
    S.monsterRoom = far.length ? pick(far) : S.monsterRoom;
    S.invulnUntil = S.gameMinutes + 12;
    addLog('💡 Bạn chiếu thẳng đèn UV vào '+chaseMonsterLabel()+' — nó bị choáng và lùi ra xa!', '');
  } else {
    addLog(''+chaseMonsterLabel()+' hiện không ở gần đây — đèn UV chưa phát huy tác dụng lúc này.', '');
  }
  markActionDirty();
  refreshHud(); refreshActionPane();
}

function useNoiseTrap(){
  if(!S || S.inventory.noisetrap<=0) return;
  S.inventory.noisetrap--;
  S.noiseTrap = {room:S.playerRoom, until:S.gameMinutes+70};
  addLog('📢 Bạn đặt Bẫy gây nhiễu tại '+ROOM_DEF[S.playerRoom].name+' — '+chaseMonsterLabel()+' có thể sẽ bị thu hút tới đó thay vì bạn.', '');
  markActionDirty();
  refreshHud(); refreshActionPane();
}

/* ============== TÚI ĐỒ ============== */
/* Bấm nút 🎒 ở HUD (mọi lúc trong đêm) để mở overlay liệt kê toàn bộ vật phẩm & linh kiện
   đang có: tên, mô tả, số lượng và nút Dùng (nếu vật phẩm đó dùng được ngay). */
function bagTotalCount(){
  if(!S) return 0;
  let n = 0;
  Object.keys(ITEM_META).forEach(k=> n += (S.inventory[k]||0));
  Object.keys(COMPONENT_META).forEach(k=> n += (S.components[k]||0));
  return n;
}
function refreshBagBadge(){
  const badge = document.getElementById('bagCountBadge');
  if(badge) badge.textContent = String(bagTotalCount());
}
const BAG_ITEM_USE = {
  bimbim:    { can: canUseBimBim,    use: useBimBim,    label: 'Dùng' },
  water:     { can: canUseWater,     use: useWaterBoost, label: 'Dùng' },
  camera:    { can: canUseCamera,    use: useCameraItem, label: 'Dùng' },
  breaker:   { can: canUseBreakerItem, use: useBreakerItem, label: 'Dùng' },
  uvlight:   { can: ()=> !!S && S.inventory.uvlight>0, use: useUVLight, label: 'Dùng' },
  noisetrap: { can: ()=> !!S && S.inventory.noisetrap>0, use: useNoiseTrap, label: 'Đặt bẫy' }
};
const BAG_TITLE = '🎒 TÚI ĐỒ';
/* Túi đồ dùng chung #mgModal với minigame/bàn chế tạo -> nhận biết "đang mở túi đồ" qua tiêu đề. */
function isBagOpen(){
  const m = document.getElementById('mgModal');
  return !!m && !m.classList.contains('hidden') && document.getElementById('mgTitle').textContent === BAG_TITLE;
}
function closeBagModal(){
  if(isBagOpen()) document.getElementById('mgModal').classList.add('hidden');
}
function openBagModal(){
  if(!S) return;
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = BAG_TITLE;
  document.getElementById('mgTimer').textContent = '';
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  footer.innerHTML = '';

  function render(){
    const rows = [];
    Object.keys(ITEM_META).forEach(key=>{
      const qty = S.inventory[key]||0;
      const meta = ITEM_META[key];
      const usable = BAG_ITEM_USE[key];
      rows.push({key, meta, qty, usable});
    });
    Object.keys(COMPONENT_META).forEach(key=>{
      const qty = S.components[key]||0;
      const meta = COMPONENT_META[key];
      rows.push({key, meta, qty, usable:null});
    });
    /* Vật phẩm/linh kiện có số lượng = 0 không được liệt kê trong túi đồ nữa. */
    const visibleRows = rows.filter(r=>r.qty>0);
    if(visibleRows.length===0){
      body.innerHTML = '<p style="font-size:12px;color:var(--text-dim);">Túi đồ hiện đang trống. Hãy đi tuần và thu gom vật phẩm quanh khuôn viên.</p>';
      return;
    }
    body.innerHTML = '<div id="bagList"></div>';
    const list = body.querySelector('#bagList');
    visibleRows.forEach(r=>{
      const row = document.createElement('div');
      row.className = 'bagItemRow';
      row.innerHTML = `<div class="bagItemIcon">${r.meta.icon}</div>
        <div class="bagItemInfo">
          <div class="bagItemName">${r.meta.name}</div>
          <div class="bagItemDesc">${r.meta.desc}</div>
        </div>
        <div class="bagItemQty">x${r.qty}</div>`;
      if(r.usable){
        const useBtn = document.createElement('button');
        useBtn.className = 'btn primary';
        useBtn.textContent = r.usable.label;
        useBtn.disabled = r.qty<=0 || !r.usable.can();
        useBtn.onclick = ()=>{
          r.usable.use();
          refreshActionPane();
          refreshBagBadge();
          render();
        };
        row.appendChild(useBtn);
      }
      list.appendChild(row);
    });
  }
  render();
  const closeBtn = document.createElement('button');
  closeBtn.className='btn'; closeBtn.textContent='Đóng';
  closeBtn.onclick=()=>modal.classList.add('hidden');
  footer.appendChild(closeBtn);
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
  // Cúp điện toàn trường & khóa cửa dồn dập là các tính năng độ khó cao — chỉ có ở Chapter 2.
  if(newPhase===2 && isHardMode() && !S.gridIncidentDone && !S.gridIncidentActive) triggerGridIncident();
  if(newPhase===3 && isHardMode() && !S.frenzyStarted) startFrenzy();
}

function triggerGridIncident(){
  S.gridDown = true;
  S.gridIncidentActive = true;
  addLog('⚡ BIẾN CỐ: Toàn trường mất điện đột ngột! Hãy đến TÒA C (Phòng Kỹ Thuật) để khởi động lại cầu dao tổng trước khi '+chaseMonsterLabel()+' lợi dụng bóng tối!', 'danger');
  S.activeEvents['C'] = {deadline: S.gameMinutes+99999, start:S.gameMinutes, mandatory:true, gridEvent:true};
  markActionDirty();
}

function startFrenzy(){
  S.frenzyStarted = true;
  addLog('🌒 '+chaseMonsterLabel()+' bước vào trạng thái CUỒNG NỘ — di chuyển nhanh hơn hẳn! Một số cửa nối giữa các tòa vừa bị khóa.', 'danger');
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

/* Minigame "Giựt khóa" — nâng cấp từ bấm liên tục (mỏi tay, ít kỹ năng) sang dạng TIMING:
   1 kim quét qua lại trên thanh ngang, người chơi phải bấm đúng lúc kim nằm trong vùng xanh.
   Cần trúng đủ `needed` lần trước khi hết giờ; vùng xanh đổi vị trí + kim tăng tốc theo đêm
   để giữ độ khó leo thang giống các minigame khác trong game. */
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
  const needed = 3;
  body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Ổ khóa đã bị ${chaseMonsterLabel()} phá hỏng cơ chế — bấm <b>GIỰT KHÓA</b> đúng lúc kim quét vào vùng xanh để bật chốt ra trước khi hết giờ!</p>
    <div id="lockTimingTrack">
      <div id="lockZone"></div>
      <div id="lockNeedle"></div>
    </div>
    <div style="text-align:center;font-size:11px;color:var(--text-dim);margin-top:6px;">Đã bật: <span id="lockHitCount">0</span>/${needed}</div>`;
  const trackEl = body.querySelector('#lockTimingTrack');
  const zoneEl = body.querySelector('#lockZone');
  const needleEl = body.querySelector('#lockNeedle');
  const hitCountEl = body.querySelector('#lockHitCount');
  const btn = document.createElement('button');
  btn.className='btn primary'; btn.textContent='GIỰT KHÓA';

  let progress = 0, timeLeft = 10, timerHandle = null, rafHandle = null, done=false;
  // Tốc độ + độ rộng vùng xanh scale theo đêm để giữ độ khó nhất quán với các minigame khác.
  const speed = 1.15 + (S.night-1)*0.22;      // vòng quét / giây
  let zoneWidthPct = Math.max(14, 22 - (S.night-1)*3);
  let zoneStartPct = Math.random()*(100-zoneWidthPct);
  let startTs = null;

  function placeZone(){
    zoneStartPct = Math.random()*(100-zoneWidthPct);
    zoneEl.style.left = zoneStartPct+'%';
    zoneEl.style.width = zoneWidthPct+'%';
  }
  placeZone();

  function needlePct(ts){
    const t = (ts - startTs)/1000;
    // Sóng tam giác (đi-về đều tốc độ) thay vì sin để việc "đoán nhịp" công bằng hơn.
    const cyclePos = (t*speed) % 2;
    return (cyclePos<=1 ? cyclePos : 2-cyclePos) * 100;
  }

  function frame(ts){
    if(done) return;
    if(!startTs) startTs = ts;
    const pct = needlePct(ts);
    needleEl.style.left = pct+'%';
    rafHandle = requestAnimationFrame(frame);
  }
  rafHandle = requestAnimationFrame(frame);

  startMinigamePressureFx(document.getElementById('mgBox'));
  function cleanup(){
    clearInterval(timerHandle);
    cancelAnimationFrame(rafHandle);
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
    addLog('Bạn không kịp gỡ khóa — tiếng động thu hút '+chaseMonsterLabel()+' đến gần hơn!', 'warn');
    if(S.gameMinutes>=S.breakerUntil && Math.random()<0.5){
      const path = bfsPath(S.monsterRoom, S.playerRoom, !S.enraged);
      if(path && path.length>1){ S.monsterRoom = path[1]; }
    }
    markActionDirty();
    refreshAll();
  }
  btn.onclick=()=>{
    if(done) return;
    const pct = parseFloat(needleEl.style.left)||0;
    const inZone = pct >= zoneStartPct && pct <= zoneStartPct+zoneWidthPct;
    if(inZone){
      progress++;
      hitCountEl.textContent = progress;
      trackEl.classList.remove('lockMiss'); trackEl.classList.add('lockHit');
      setTimeout(()=>trackEl.classList.remove('lockHit'), 150);
      if(progress>=needed) succeed();
      else { zoneWidthPct = Math.max(10, zoneWidthPct-2); placeZone(); }
    } else {
      trackEl.classList.remove('lockHit'); trackEl.classList.add('lockMiss');
      setTimeout(()=>trackEl.classList.remove('lockMiss'), 150);
      timeLeft = Math.max(0, timeLeft-1); // bấm trật bị trừ bớt thời gian, tạo cái giá cho việc đoán ẩu
      timerEl.textContent = 'Thời gian còn lại: '+timeLeft+'s';
      if(timeLeft<=0) fail();
    }
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

  const introLines = variant==='secret' ? EPILOGUE_INTRO_SECRET : (S.trongSealFail ? EPILOGUE_INTRO_SEALED : EPILOGUE_INTRO_NORMAL);
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
  markChapter1Cleared(); // đã tới màn kết Chapter 1 (ending thường hoặc secret) -> mở khoá Chapter 2
  if(SETTINGS.flash){
    document.getElementById('flash').classList.remove('flash-on'); void document.getElementById('flash').offsetWidth;
    document.getElementById('flash').classList.add('flash-on');
  }
  hideAllOverlays();
  const variant = S && S.epilogueVariant;
  document.getElementById('chapterEndSub').textContent = variant==='secret'
    ? 'Ba mảnh La Peace đã vào tay Trọng, và hắn bảo mọi chuyện đã xong. Nhưng cửa sổ chat bỏ quên trong Thư viện lại kể một câu chuyện khác...'
    : 'Bạn đã sống sót qua 3 đêm lẩn trốn The TIU. Nhưng những gì bạn vừa tìm thấy trong Thư viện sáng nay... có lẽ câu chuyện chưa thực sự kết thúc.';
  document.getElementById('chapterEndScreen').classList.remove('hidden');
}

/* ==============================================================
   CHAPTER 2 — MỞ ĐẦU
   Kích hoạt từ nút "TIẾP TỤC SANG CHAPTER 2" trên chapterEndScreen.
   Chọn đoạn hội thoại phù hợp dựa trên:
   - S.epilogueVariant: 'secret' -> Trọng xuất hiện, giải thích sự thật
     (playVN xử lý nhánh rẽ nếu có, xem ở trên).
   - 'normal': tùy mức tin tưởng đã tích lũy với 2 NPC
     (campaignNpcTalks.E / .B, size > 0 nghĩa là đã từng nói chuyện /
     tin tưởng) mà gộp nhóm khác nhau trước khi ra Tòa A.
   Nội dung hội thoại nằm trong dialogue.js (CHAPTER2_OPEN_*).
   Chapter 2 gameplay (bản đồ, phòng, sự kiện...) chưa được xây dựng —
   sau đoạn mở đầu, game hiện màn hình "sắp ra mắt" thay vì vào map mới. ---- */
function pickChapter2NormalOpening(){
  const trustE = campaignNpcTalks.E.size>0;
  const trustB = campaignNpcTalks.B.size>0;
  if(trustE && trustB) return CHAPTER2_OPEN_NORMAL_BOTH;
  if(trustE) return CHAPTER2_OPEN_NORMAL_SINGLE_E;
  if(trustB) return CHAPTER2_OPEN_NORMAL_SINGLE_B;
  return CHAPTER2_OPEN_NORMAL_SOLO;
}

function startChapter2Opening(){
  hideAllOverlays();
  const variant = S && S.epilogueVariant;
  const lines = variant==='secret' ? CHAPTER2_OPEN_SECRET : pickChapter2NormalOpening();
  playVN(lines, startChapter2Gameplay);
}

/* Clone của engine đêm/tòa nhà Chapter 1, dùng làm phần mở đầu Chapter 2 — cầu dao điện,
   thu gom & chế tạo (các tính năng độ khó cao) chỉ xuất hiện từ đây trở đi (xem isHardMode()).
   Nội dung phòng ốc/hội thoại chi tiết riêng cho Chapter 2 sẽ được bổ sung sau. */
function startChapter2Gameplay(){
  hideAllOverlays();
  beginNight(1, false, 2);
}

function showChapter2ComingSoon(){
  hideAllOverlays();
  const sub = document.getElementById('chapter2ComingSoonSub');
  if(sub){
    sub.textContent = 'Cả nhóm đã tập hợp dưới hiên Tòa A — nhưng câu chuyện của Chapter 2 vẫn còn đang được viết tiếp. Hẹn gặp lại trong bản cập nhật sau.';
  }
  document.getElementById('chapter2ComingSoonScreen').classList.remove('hidden');
}

function eventLabel(ev){
  return {stage:'Kiểm tra sân khấu', floors:'Bật/tắt các tầng', wire:'Nối dây điện', quiz:'Trả lời câu hỏi', wibu:'Bắt Wibu Việt Nhật', books:'Sắp xếp lại sách', bikes:'Dắt xe về đúng hàng', ball:'Tìm quả bóng lạc'}[ev]||ev;
}

function onRoomClick(k){
  if(k===S.playerRoom) return;
  if(!ROOM_DEF[S.playerRoom].connects.includes(k)) return;
  if(isEdgeLocked(S.playerRoom, k)){ attemptUnlockDoor(k); return; }
  if(movePlayer(k)) document.getElementById('mapModal').classList.add('hidden');
}

/* ============== MOVEMENT ============== */
function movePlayer(dest){
  if(!S.running || S.paused) return false;
  if(S.epilogue){ epilogueMove(dest); return true; }
  const noisy = S.gameMinutes < S.speedBuffUntil; // buff Nước tăng lực: nhanh nhưng ồn
  const cost = noisy ? BUFF_MOVE_COST_MIN : BASE_MOVE_COST_MIN;
  const staminaCost = noisy ? MOVE_STAMINA_COST_BUFFED : MOVE_STAMINA_COST;
  // Hết thể lực hoặc không đủ thể lực cho 1 lần di chuyển -> KHÔNG thể di chuyển (phải nghỉ ngơi/ăn để hồi)
  if(S.stamina < staminaCost){
    addLog('Bạn kiệt sức, không đủ thể lực để di chuyển (cần '+staminaCost+'%, còn '+Math.max(0,Math.floor(S.stamina))+'%). Hãy nghỉ ngơi hoặc ăn gì đó để hồi thể lực.','warn');
    refreshAll();
    return false;
  }
  S.stamina = Math.max(0, S.stamina - staminaCost);
  S.gameMinutes += cost;
  const tdFrom = S.playerRoom;
  S.playerRoom = dest;
  tdEnterRoom(dest, tdFrom);
  S.lastMoveAt = S.gameMinutes; // reset đồng hồ "đứng yên quá lâu" dùng cho mục 1 (tension liên tục)
  addLog('Bạn di chuyển đến '+ROOM_DEF[dest].name+'.', '');
  if(S.cameraMovesLeft>0) S.cameraMovesLeft--;
  markActionDirty();
  advanceWorld(cost, {isMove:true}); // di chuyển tốn thời gian tương ứng -> không hồi thể lực trong khoảng đó

  // Hệ thống tiếng ồn:
  // 1) buff tốc độ (Nước tăng lực) khiến bước chân ồn hẳn -> xác suất cố định bị nghe thấy
  // 2) di chuyển bình thường: khi The TIU đã khá "căng" (meter cao), ngay cả bước chân bình
  //    thường cũng có xác suất nhỏ (tăng dần theo meter) khiến nó chú ý -> nhịp chơi dồn dập hơn
  if(S.running && S.gameMinutes>=S.breakerUntil){
    let attractChance = 0;
    if(noisy){
      attractChance = NOISE_ATTRACT_CHANCE;
    } else if(S.meter > NOISE_NORMAL_METER_FLOOR){
      const t = (S.meter - NOISE_NORMAL_METER_FLOOR) / (100 - NOISE_NORMAL_METER_FLOOR);
      attractChance = t * NOISE_NORMAL_MAX_CHANCE;
    }
    if(attractChance>0 && Math.random()<attractChance){
      const path = bfsPath(S.monsterRoom, dest, !S.enraged);
      if(path && path.length>1){
        S.monsterRoom = path[1];
        addLog('Tiếng bước chân của bạn vọng khắp hành lang... '+chaseMonsterLabel()+' đã nghe thấy!','tiu');
      }
    }
  }

  if(S.running) checkEncounter();
  refreshAll();
  return true;
}

/* ============== CHAPTER 2 — BỘ ĐÀM (QUICK COMMAND) & NPC ĐỒNG ĐỘI ==============
   Chỉ hoạt động khi isHardMode() (chapter===2) và S.npc tồn tại. Xem PHẦN 2 design doc.
   4 lệnh cơ bản: MOVE_TO, DO_TASK, RETREAT, NOISE_LURE — gửi qua sendRadioCommand(). */

function radioTeamActive(){
  return !!(S && isHardMode() && S.npc);
}

/* Gửi 1 lệnh tới 1 hoặc cả 2 NPC. target: 'B' | 'E' | 'both'. cmd: 'MOVE_TO' | 'DO_TASK' | 'RETREAT' | 'NOISE_LURE'.
   payload: {room} cho MOVE_TO/DO_TASK (room chỉ cần cho MOVE_TO — DO_TASK tự suy ra phòng từ npc.task). */
function sendRadioCommand(target, cmd, payload){
  if(!radioTeamActive() || !S.running || S.paused) return false;
  payload = payload || {};

  if(cmd === 'NOISE_LURE'){
    // Lệnh này áp dụng cho chính người chơi (đặt bẫy tại chỗ), không nhắm vào NPC nào.
    if(S.inventory.noisetrap<=0){
      addLog('[BỘ ĐÀM] Hết Bẫy gây nhiễu, không thể ra hiệu thu hút TIU.', 'warn');
      return false;
    }
    useNoiseTrap();
    advanceWorld(RADIO_COMMAND_COST_MIN);
    refreshAll();
    return true;
  }

  const npcKeys = target==='both' ? ['B','E'] : [target];
  let anyValid = false;

  npcKeys.forEach(k=>{
    const npc = S.npc[k];
    if(!npc || npc.status==='down' || npc.status==='captured'){
      addLog(`[BỘ ĐÀM] ${npc?npc.name:k} không phản hồi.`, 'warn');
      return;
    }

    switch(cmd){
      case 'MOVE_TO': {
        const dest = payload.room;
        if(!dest || !ROOM_DEF[dest]){ return; }
        npc.pendingDestination = dest;
        npc.status = 'moving';
        npc.moveAccum = npc.moveAccum || 0;
        addLog(`[BỘ ĐÀM] ${npc.name}: "Rõ, đang di chuyển tới ${ROOM_DEF[dest].name}."`, 'radio');
        anyValid = true;
        break;
      }
      case 'DO_TASK': {
        // Lệnh này BAO HÀM cả di chuyển: giao nhiệm vụ kế tiếp cho NPC, NPC tự pathfind
        // tới đúng phòng rồi tự chuyển sang 'working' khi tới nơi (xem tickNPC()).
        const task = payload.task || availableTaskFor(k);
        if(!task){
          addLog(`[BỘ ĐÀM] ${npc.name} hiện không còn nhiệm vụ nào để giao.`, 'warn');
          return;
        }
        if(TASK_STAGE[task] !== npc.stage){
          addLog(`[BỘ ĐÀM] ${npc.name}: "Nhiệm vụ đó chưa tới lượt — phải xong việc trước đã."`, 'warn');
          return;
        }
        assignNPCTask(k, task);
        const destRoom = taskRoomFor(k, task);
        if(npc.room === destRoom){
          npc.status = 'working';
          addLog(`[BỘ ĐÀM] ${npc.name}: "Rõ, bắt tay vào ${TASK_LABELS[task]} ngay."`, 'radio');
        } else {
          npc.pendingDestination = destRoom;
          npc.status = 'moving';
          npc.moveAccum = npc.moveAccum || 0;
          addLog(`[BỘ ĐÀM] ${npc.name}: "Rõ, lên đường tới ${ROOM_DEF[destRoom].name} để ${TASK_LABELS[task].toLowerCase()}."`, 'radio');
        }
        anyValid = true;
        break;
      }
      case 'RETREAT': {
        npc.pendingDestination = 'CANTEEN';
        npc.status = 'moving';
        npc.moveAccum = npc.moveAccum || 0;
        // Huỷ trạng thái làm việc NHƯNG giữ nguyên taskProgress -> tiếp tục được sau này.
        addLog(`[BỘ ĐÀM] ${npc.name}: "Rõ, rút lui về Căn tin!"`, 'radio');
        anyValid = true;
        break;
      }
      case 'RESOLVE_THREAT': {
        // Chapter 2, Đêm 2 — Giai đoạn Quá Tải (Phần 6.3): xử lý sự cố đe doạ Trận Địa.
        if(resolveOverloadThreatByNPC(payload.threatId, k)) anyValid = true;
        break;
      }
    }
  });

  if(anyValid){
    advanceWorld(RADIO_COMMAND_COST_MIN);
    markActionDirty();
    refreshAll();
  }
  return anyValid;
}

/* Giao nhiệm vụ chuyên môn kế tiếp cho 1 NPC (không tốn lượt riêng — người chơi vẫn cần
   MOVE_TO rồi DO_TASK để thực thi). Dùng khi mở bảng lệnh để liệt kê nhiệm vụ khả dụng. */
function assignNPCTask(k, task){
  const npc = S.npc[k];
  if(!npc || npc.status==='down' || npc.status==='captured') return false;
  npc.task = task;
  npc.taskProgress = npc.taskProgress || 0; // giữ nguyên nếu đang tiếp tục nhiệm vụ dở
  return true;
}

/* Cập nhật cả 2 NPC mỗi tick — gọi từ advanceWorld(). Chỉ chạy ở Đêm 1 (nơi có hệ thống
   nhiệm vụ thu gom/thi công); Đêm 2 dùng luồng riêng (Giai đoạn Lùa Địch/Sập Bẫy/Quá Tải). */
function tickTeamNPCs(dtMin){
  if(!radioTeamActive() || S.night!==1) return;
  ['B','E'].forEach(k=> tickNPC(k, dtMin));
  checkNPCCapture();
}

function tickNPC(k, dtMin){
  const npc = S.npc[k];
  if(!npc || npc.status==='captured') return;

  if(npc.status==='moving'){
    npc.moveAccum = (npc.moveAccum||0) + dtMin;
    while(npc.moveAccum >= BASE_MOVE_COST_MIN && npc.room !== npc.pendingDestination){
      npc.moveAccum -= BASE_MOVE_COST_MIN;
      npc.room = nextStepToward(npc.room, npc.pendingDestination);
    }
    if(npc.room === npc.pendingDestination){
      npc.moveAccum = 0;
      npc.pendingDestination = null;
      const onTaskRoom = npc.task && taskRoomFor(k, npc.task)===npc.room;
      npc.status = onTaskRoom ? 'working' : 'idle';
      addLog(`[BỘ ĐÀM] ${npc.name} đã đến ${ROOM_DEF[npc.room].name}.`, 'radio');
      markActionDirty();
    }
  }

  if(npc.status==='working'){
    // Đặc quyền Wibu Việt Nhật (E): thao tác kỹ thuật nhanh hơn 20% -> tích lũy tiến độ nhanh hơn.
    const workRate = (k==='E') ? dtMin*1.2 : dtMin;
    npc.taskProgress += workRate;
    if(npc.taskProgress >= TASK_DURATION_MIN[npc.task]){
      completeNPCTask(k);
    }
  }

  updateNPCStress(k, dtMin);
}

function completeNPCTask(k){
  const npc = S.npc[k];
  addLog(`[BỘ ĐÀM] ${npc.name}: "Xong việc rồi!"`, 'good');
  npc.task = null;
  npc.taskProgress = 0;
  npc.status = 'idle';
  npc.stage = Math.min(2, npc.stage + 1);
  markActionDirty();
}

/* ---- Stress/Safety (Phần 3 design doc) ---- */
function updateNPCStress(k, dtMin){
  const npc = S.npc[k];
  if(npc.status!=='working' && npc.status!=='down') return;

  const dist = roomGraphDistance(npc.room, S.monsterRoom);
  let ratePerMin;
  if(dist === 0)      ratePerMin = 6.5;
  else if(dist === 1) ratePerMin = 2.2;
  else if(dist === 2) ratePerMin = 0.6;
  else                ratePerMin = -0.5;

  // Đặc quyền Chàng Lính (B): kháng Stress tốt hơn khi gặp TIU -> giảm 25% tốc độ tăng stress.
  if(k==='B' && ratePerMin>0) ratePerMin *= 0.75;

  npc.stress = clamp(npc.stress + ratePerMin*dtMin, 0, 100);

  if(npc.stress >= 100 && npc.status==='working'){
    resolveStressBreak(k);
  }
}

function resolveStressBreak(k){
  const npc = S.npc[k];
  const roll = Math.random();
  if(roll < 0.5){
    npc.status = 'moving';
    npc.pendingDestination = 'CANTEEN';
    npc.moveAccum = 0;
    // taskProgress KHÔNG bị reset — chỉ đóng băng, tiếp tục được sau này.
    addLog(`⚠ ${npc.name} hoảng loạn, bỏ chạy về Căn Tin!`, 'danger');
  } else {
    npc.status = 'down';
    npc.downSince = S.gameMinutes;
    addLog(`⚠ ${npc.name} đã gục ngã tại ${ROOM_DEF[npc.room].name}! Cần hỗ trợ ngay.`, 'danger');
  }
  markActionDirty();
}

/* Người chơi đứng cùng phòng với NPC đang 'down' và bấm nút hỗ trợ (UI ở Phần 9) ->
   gọi hàm này. Cứu xong NPC tiếp tục làm dở nhiệm vụ, stress hồi về mức trung bình. */
function tryRescueNPC(k){
  const npc = S.npc[k];
  if(!npc || npc.status!=='down' || S.playerRoom!==npc.room) return false;
  npc.status = npc.task ? 'working' : 'idle';
  npc.stress = 40;
  npc.downSince = null;
  addLog(`Bạn đã đỡ ${npc.name} dậy, trấn an và tiếp tục công việc.`, 'good');
  markActionDirty();
  advanceWorld(BASE_MOVE_COST_MIN); // hô hấp/dựng dậy tốn 1 lượt (10 phút game), như thiết kế
  refreshAll();
  return true;
}

/* TIU bắt gặp NPC đang bất tỉnh -> NPC bị bắt, mất luôn nhiệm vụ đêm nay (phạt Setup Gauge).
   Đây là fail-state cục bộ, KHÔNG phải Game Over toàn cục. */
function checkNPCCapture(){
  ['B','E'].forEach(k=>{
    const npc = S.npc[k];
    if(npc.status==='down' && npc.room===S.monsterRoom){
      npc.status = 'captured';
      S.setupGaugeCapPenalty = (S.setupGaugeCapPenalty||0) + 25;
      addLog(`☠ ${npc.name} đã bị TIU bắt! Nhiệm vụ của họ thất bại đêm nay.`, 'critical');
      markActionDirty();
    }
  });
}

const NPC_STATUS_LABELS = {
  idle: 'Đang rảnh, chờ lệnh',
  moving: 'Đang di chuyển...',
  working: 'Đang làm việc...',
  down: '⚠ ĐÃ GỤC NGÃ — CẦN HỖ TRỢ',
  captured: '☠ ĐÃ BỊ TIU BẮT',
};

/* Dựng UI nhóm "BỘ ĐÀM" trong actionButtons — gọi từ refreshActionPane() (Đêm 1, Chapter 2). */
function buildRadioGroup(){
  const g = document.createElement('div');
  g.className = 'actionGroup radioGroup';
  const h = document.createElement('div');
  h.className = 'actionGroupTitle';
  h.textContent = '📻 BỘ ĐÀM';
  g.appendChild(h);

  ['B','E'].forEach(k=>{
    const npc = S.npc[k];
    const card = document.createElement('div');
    card.className = 'radioNpcCard status-'+npc.status;

    const head = document.createElement('div');
    head.className = 'radioNpcHead';
    head.innerHTML = `<b>${npc.name}</b> <span class="radioNpcRoom">— ${ROOM_DEF[npc.room].name}</span>`;
    card.appendChild(head);

    const passiveLine = document.createElement('div');
    passiveLine.className = 'radioNpcPassive';
    passiveLine.textContent = k==='E'
      ? '⚙ Đặc quyền: thao tác kỹ thuật nhanh hơn 20%'
      : '🛡 Đặc quyền: kháng Stress tốt hơn khi gần TIU';
    card.appendChild(passiveLine);

    const statusLine = document.createElement('div');
    statusLine.className = 'radioNpcStatus';
    statusLine.textContent = NPC_STATUS_LABELS[npc.status] || npc.status;
    card.appendChild(statusLine);

    // Thanh Stress
    const stressWrap = document.createElement('div');
    stressWrap.className = 'radioBarWrap';
    stressWrap.innerHTML = `<span class="radioBarLabel">Áp lực</span>
      <div class="radioBar"><div class="radioBarFill stress" style="width:${Math.round(npc.stress)}%"></div></div>`;
    card.appendChild(stressWrap);

    // Thanh tiến độ nhiệm vụ (nếu đang có task)
    if(npc.task){
      const dur = TASK_DURATION_MIN[npc.task];
      const pct = Math.min(100, Math.round(npc.taskProgress/dur*100));
      const taskWrap = document.createElement('div');
      taskWrap.className = 'radioBarWrap';
      taskWrap.innerHTML = `<span class="radioBarLabel">${TASK_LABELS[npc.task]}</span>
        <div class="radioBar"><div class="radioBarFill progress" style="width:${pct}%"></div></div>`;
      card.appendChild(taskWrap);
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'radioBtnRow';

    if(npc.status==='captured'){
      // Không còn lệnh nào khả dụng — NPC đã mất cho đêm nay.
    } else if(npc.status==='down'){
      if(S.playerRoom===npc.room){
        const rescueBtn = document.createElement('button');
        rescueBtn.className = 'btn primary';
        rescueBtn.textContent = '🤝 Đỡ dậy & trấn an';
        rescueBtn.onclick = ()=>{ tryRescueNPC(k); refreshActionPane(); };
        btnRow.appendChild(rescueBtn);
      } else {
        const hint = document.createElement('div');
        hint.className = 'radioHint';
        hint.textContent = 'Cần bạn có mặt tại '+ROOM_DEF[npc.room].name+' để hỗ trợ.';
        btnRow.appendChild(hint);
      }
    } else {
      const task = availableTaskFor(k);
      if(task && npc.status!=='working'){
        const taskBtn = document.createElement('button');
        taskBtn.className = 'btn';
        taskBtn.textContent = '[Thực hiện nhiệm vụ] '+TASK_LABELS[task];
        taskBtn.onclick = ()=>{ sendRadioCommand(k,'DO_TASK',{task}); refreshActionPane(); };
        btnRow.appendChild(taskBtn);
      }
      if(npc.status!=='moving'){
        const retreatBtn = document.createElement('button');
        retreatBtn.className = 'btn danger';
        retreatBtn.textContent = '[Rút lui về Căn tin]';
        retreatBtn.onclick = ()=>{ sendRadioCommand(k,'RETREAT',{}); refreshActionPane(); };
        btnRow.appendChild(retreatBtn);
      }
    }
    card.appendChild(btnRow);
    g.appendChild(card);
  });

  // Lệnh dùng chung: Gây tiếng ồn thu hút TIU (tiêu hao Bẫy gây nhiễu, tái dùng useNoiseTrap()).
  const noiseBtn = document.createElement('button');
  noiseBtn.className = 'btn';
  noiseBtn.textContent = `[Gây tiếng ồn thu hút TIU] (còn ${S.inventory.noisetrap||0})`;
  noiseBtn.disabled = (S.inventory.noisetrap||0) <= 0;
  noiseBtn.onclick = ()=>{ sendRadioCommand(null,'NOISE_LURE',{}); refreshActionPane(); };
  g.appendChild(noiseBtn);

  return g;
}

/* Dựng UI nhóm "ĐÊM 2" — thay thế buildRadioGroup() ở Đêm 2 (khác luồng hoàn toàn: không có
   task/stage, chỉ có kích hoạt trạm phát sóng (luring) và xử lý sự cố (overload)). */
function buildNight2Panel(){
  const n2 = S.night2;
  const g = document.createElement('div');
  g.className = 'actionGroup radioGroup';
  const h = document.createElement('div');
  h.className = 'actionGroupTitle';
  h.textContent = '📻 ĐIỀU PHỐI ĐÊM 2 — '+NIGHT2_PHASE_NAMES[n2.phase];
  g.appendChild(h);

  if(n2.phase==='luring'){
    const hint = document.createElement('div');
    hint.className = 'radioHint';
    hint.style.color = 'var(--text-dim)';
    hint.textContent = 'Đưa cả 3 người tới đúng trạm (Chàng Lính→Tòa B, Wibu→Tòa E, Bạn→Tòa D) rồi kích hoạt CÙNG LÚC để lùa TIU vào Trận Địa.';
    g.appendChild(hint);

    ['B','E'].forEach(k=>{
      const npc = S.npc[k];
      const card = document.createElement('div');
      card.className = 'radioNpcCard status-'+npc.status;
      card.innerHTML = `<div class="radioNpcHead"><b>${npc.name}</b> <span class="radioNpcRoom">— ${ROOM_DEF[npc.room].name}</span></div>
        <div class="radioNpcStatus">Trạm phụ trách: ${ROOM_DEF[k].name} ${n2.lureSync[k]?'✅ ĐÃ ĐỒNG BỘ':''}</div>`;
      const btnRow = document.createElement('div');
      btnRow.className = 'radioBtnRow';
      if(npc.status!=='down' && npc.status!=='captured' && !n2.lureSync[k]){
        if(npc.room!==k){
          const moveBtn = document.createElement('button');
          moveBtn.className = 'btn';
          moveBtn.textContent = '[Đến vị trí] '+ROOM_DEF[k].name;
          moveBtn.onclick = ()=>{ sendRadioCommand(k,'MOVE_TO',{room:k}); refreshActionPane(); };
          btnRow.appendChild(moveBtn);
        } else {
          const actBtn = document.createElement('button');
          actBtn.className = 'btn primary';
          actBtn.textContent = '📡 Kích hoạt trạm';
          actBtn.onclick = ()=>{ tryActivateLureStation(k); refreshActionPane(); };
          btnRow.appendChild(actBtn);
        }
      }
      card.appendChild(btnRow);
      g.appendChild(card);
    });

    const dCard = document.createElement('div');
    dCard.className = 'radioNpcCard';
    dCard.innerHTML = `<div class="radioNpcHead"><b>Trạm của bạn</b> <span class="radioNpcRoom">— ${ROOM_DEF.D.name}</span></div>
      <div class="radioNpcStatus">${n2.lureSync.D?'✅ ĐÃ ĐỒNG BỘ':'Chưa kích hoạt'}</div>`;
    if(!n2.lureSync.D && S.playerRoom==='D'){
      const actBtn = document.createElement('button');
      actBtn.className = 'btn primary';
      actBtn.textContent = '📡 Kích hoạt trạm';
      actBtn.onclick = ()=>{ tryActivateLureStation('D'); refreshActionPane(); };
      const row = document.createElement('div'); row.className='radioBtnRow'; row.appendChild(actBtn);
      dCard.appendChild(row);
    }
    g.appendChild(dCard);
  }

  if(n2.phase==='lockdown'){
    const hint = document.createElement('div');
    hint.className = 'radioHint';
    hint.style.color = 'var(--text-dim)';
    hint.textContent = 'Đang chờ đồng bộ giật cầu dao...';
    g.appendChild(hint);
  }

  if(n2.phase==='overload'){
    const meterLine = document.createElement('div');
    meterLine.className = 'radioNpcStatus';
    meterLine.innerHTML = `Quá tải: <b>${n2.overloadMeter}%</b> — Độ bền Trận Địa: <b>${n2.trapIntegrity}%</b>`;
    g.appendChild(meterLine);

    if(n2.activeThreats.length===0){
      const okLine = document.createElement('div');
      okLine.className = 'radioHint';
      okLine.style.color = 'var(--text-dim)';
      okLine.textContent = 'Trận Địa tạm ổn định — chưa có sự cố nào.';
      g.appendChild(okLine);
    }

    n2.activeThreats.forEach(t=>{
      const card = document.createElement('div');
      card.className = 'radioNpcCard status-down';
      const owner = OVERLOAD_LANE_OWNER[t.lane];
      const ownerName = owner==='player' ? 'Bạn' : S.npc[owner].name;
      const room = OVERLOAD_LANE_ROOM[t.lane];
      card.innerHTML = `<div class="radioNpcStatus">${OVERLOAD_LANE_LABELS[t.lane]}<br>Người phụ trách: <b>${ownerName}</b> (cần có mặt tại ${ROOM_DEF[room].name})</div>`;
      const btnRow = document.createElement('div');
      btnRow.className = 'radioBtnRow';
      if(owner==='player'){
        const btn = document.createElement('button');
        btn.className = 'btn primary';
        btn.textContent = canResolveUVBlockThreat() ? '💡 Dùng Đèn UV chặn ngay' : 'Cần có mặt tại '+ROOM_DEF[room].name;
        btn.disabled = !canResolveUVBlockThreat();
        btn.onclick = ()=>{ resolvePlayerUVBlock(); refreshActionPane(); };
        btnRow.appendChild(btn);
      } else {
        const npc = S.npc[owner];
        if(npc.room!==room){
          const moveBtn = document.createElement('button');
          moveBtn.className = 'btn';
          moveBtn.textContent = '[Đến vị trí] '+ROOM_DEF[room].name;
          moveBtn.onclick = ()=>{ sendRadioCommand(owner,'MOVE_TO',{room}); refreshActionPane(); };
          btnRow.appendChild(moveBtn);
        } else {
          const fixBtn = document.createElement('button');
          fixBtn.className = 'btn primary';
          fixBtn.textContent = '🔧 Ra lệnh xử lý ngay';
          fixBtn.onclick = ()=>{ sendRadioCommand(owner,'RESOLVE_THREAT',{threatId:t.id}); refreshActionPane(); };
          btnRow.appendChild(fixBtn);
        }
      }
      card.appendChild(btnRow);
      g.appendChild(card);
    });
  }

  return g;
}

/* ============== CHAPTER 2 — ĐÊM 1: 3 GIAI ĐOẠN (PHẦN 5 design doc) ==============
   Hoàn toàn TÁCH BIỆT với S.phase (KHỞI ĐỘNG/BIẾN CỐ TRUNG TÂM/SĂN ĐUỔI DỒN DẬP) đã có sẵn —
   hệ đó vẫn tiếp tục chạy song song để quyết định tốc độ TIU/khoá cửa/sự cố bắt buộc như cũ.
   S.phaseN1 chỉ phục vụ NHÃN + LOGIC RIÊNG cho đội hình 3 người (trinh sát/thi công/nạp năng
   lượng) — dùng đúng mốc giờ 21:00/00:00/04:00/07:30 nhờ đồng hồ đã lệch offset ở trên. */
const PHASE_N1_NAMES = { scout:'TRINH SÁT & THU GOM', construct:'THI CÔNG BẪY', charge:'NẠP NĂNG LƯỢNG LA PEACE' };

function checkNight1Phase(){
  if(!isHardMode() || S.night!==1) return;
  let next;
  if(S.gameMinutes < 180)      next = 'scout';      // 21:00–00:00
  else if(S.gameMinutes < 420) next = 'construct';   // 00:00–04:00
  else                          next = 'charge';      // 04:00–07:30

  if(next !== S.phaseN1){
    S.phaseN1 = next;
    addLog('— '+PHASE_N1_NAMES[next]+' —', 'radio');
    markActionDirty();
  }
}

/* Chốt % hoàn thiện Trận Địa cuối Đêm 1 — công thức Phần 5: 35% Bẫy Quang Học (Chàng Lính)
   + 35% Đấu nối điện cao áp (Wibu) + 30% La Peace đã nạp, trừ đi phạt nếu NPC bị TIU bắt. */
function finalizeSetupGauge(){
  if(!S.npc) return;
  const buildRatio = npcTaskCompletionRatio('B','buildTrap');
  const wireRatio  = npcTaskCompletionRatio('E','wireBoosterC');
  const peaceRatio = clamp((S.laPeaceIntegrated||0) / (S.laPeaceNeeded||1), 0, 1);

  let gauge = Math.round(buildRatio*35 + wireRatio*35 + peaceRatio*30);
  gauge -= (S.setupGaugeCapPenalty||0);
  S.setupGauge = clamp(gauge, 0, 100);
  addLog('📊 Trận Địa hoàn thiện '+S.setupGauge+'% khi kết thúc Đêm 1.', 'radio');
}

/* Tỉ lệ hoàn thành (0-1) của MỘT nhiệm vụ stage-1 (buildTrap/wireBoosterC) cụ thể cho 1 NPC —
   trả về 1 nếu NPC đã hoàn thành hẳn (stage===2), tỉ lệ dở dang nếu đang làm đúng task đó,
   hoặc 0 nếu chưa tới lượt (còn ở stage 0) hoặc đang làm nhiệm vụ khác. */
function npcTaskCompletionRatio(k, stage1Task){
  const npc = S.npc[k];
  if(!npc) return 0;
  if(npc.stage>=2) return 1; // đã xong cả 2 nhiệm vụ
  if(npc.task===stage1Task) return clamp((npc.taskProgress||0)/TASK_DURATION_MIN[stage1Task], 0, 1);
  return 0; // vẫn còn ở stage 0 (thu gom) hoặc đang idle/di chuyển giữa 2 stage
}

/* ============== CHAPTER 2 — ĐÊM 2: 3 GIAI ĐOẠN (PHẦN 6 design doc) ==============
   Lùa Địch (luring) -> Sập Bẫy (lockdown) -> Quá Tải Cầu Dao (overload) -> Trận đánh cuối.
   TIU ở trạng thái Cuồng Nộ (S.enraged) NGAY TỪ ĐẦU đêm (ép buộc trong freshState/advanceWorld
   ở trên) — không có khu an toàn nào bảo vệ được người chơi/NPC trong suốt Đêm 2.
   Khi hoàn tất Giai đoạn Quá Tải, người chơi được CHỌN giữa route Normal (kết liễu ngay — TIU
   thanh tẩy, kết thúc câu chuyện ở Đêm 2) và route Secret (do dự -> Trọng tự nuốt lấy TIU,
   biến thành "The Grimoire", mở khóa Đêm 3: Trọng đuổi bắt nhân vật chính, xem
   triggerNight2Climax() / triggerLaPeaceAwakening()). */

const NIGHT2_PHASE_NAMES = { luring:'LÙA ĐỊCH VÀO TRẬN ĐỊA', lockdown:'SẬP BẪY MA TRẬN', overload:'QUÁ TẢI CẦU DAO', resolved:'HOÀN TẤT' };

/* ---- Giai đoạn 1: LÙA ĐỊCH ---- */
function tryActivateLureStation(stationKey){
  if(!isHardMode() || S.night!==2 || S.night2.phase!=='luring') return false;
  if(S.night2.lureSync[stationKey]) return false; // đã kích hoạt rồi

  if(stationKey==='D'){
    if(S.playerRoom!=='D'){ addLog('Bạn cần có mặt tại '+ROOM_DEF.D.name+' để kích hoạt trạm này.', 'warn'); return false; }
  } else {
    const npc = S.npc[stationKey];
    if(!npc || npc.room!==stationKey || npc.status==='down' || npc.status==='captured'){
      addLog((npc?npc.name:stationKey)+' hiện chưa có mặt tại '+ROOM_DEF[stationKey].name+'.', 'warn');
      return false;
    }
  }

  S.night2.lureSync[stationKey] = true;
  addLog('📡 Trạm phát sóng tại '+ROOM_DEF[stationKey].name+' đã đồng bộ.', 'radio');
  markActionDirty();

  if(LURE_STATIONS.every(k=>S.night2.lureSync[k])) startLureRoute();
  return true;
}

/* Tái dùng CHÍNH XÁC cơ chế "Bẫy gây nhiễu" (S.noiseTrap) đã có sẵn để lôi kéo TIU về FIELD —
   TIU sẽ tự bám theo đường ngắn nhất tới đó (bfsPath), không cần script hoá tuyến đường thủ công.
   Đơn giản hoá so với mô tả gốc ("đúng tuyến đường định sẵn") nhưng tận dụng được AI có sẵn. */
function startLureRoute(){
  addLog('🔊 Cả 3 trạm đã đồng bộ! Sóng âm đang lùa TIU về phía Trận Địa Chính (Sân Bóng)...', 'radio');
  S.noiseTrap = { room:'FIELD', until: S.gameMinutes + 99999 };
}

function checkNight2Phase(){
  if(!isHardMode() || S.night!==2) return;
  const n2 = S.night2;

  if(n2.phase==='luring'){
    if(S.gameMinutes>=240 && !n2.warnedLateLuring){
      n2.warnedLateLuring = true;
      addLog('⚠ Đã quá 01:00 mà vẫn chưa lùa được TIU vào Trận Địa — cố gắng lên, thời gian cho Giai đoạn Quá Tải sẽ càng eo hẹp.', 'warn');
    }
    if(S.monsterRoom==='FIELD' && LURE_STATIONS.every(k=>n2.lureSync[k])){
      enterLockdownPhase();
    }
    return;
  }

  if(n2.phase==='overload'){
    const total = Math.max(1, S.nightTotalMin - n2.overloadStartMin);
    const elapsed = S.gameMinutes - n2.overloadStartMin;
    n2.overloadMeter = clamp(Math.round(elapsed/total*100), 0, 100);

    if(S.gameMinutes >= n2.nextThreatAt && n2.activeThreats.length < 3){
      spawnOverloadThreat();
      n2.nextThreatAt = S.gameMinutes + rand(8,14);
    }
    checkThreatDeadlines();

    if(n2.trapIntegrity<=0){
      trapBreakFailState();
    } else if(n2.overloadMeter>=100){
      n2.phase = 'resolved';
      triggerNight2Climax();
    }
  }
}

/* ---- Giai đoạn 2: SẬP BẪY (minigame đồng bộ 3 điểm) ---- */
function enterLockdownPhase(){
  S.night2.phase = 'lockdown';
  S.noiseTrap = null; // đã hoàn thành lôi kéo, không cần bẫy nữa
  addLog('⚡ TIU đã lọt vào Trận Địa Chính! Phát lệnh SẬP BẪY ngay!', 'danger');
  markActionDirty();
  refreshAll();
  openLockdownSyncModal();
}

function openLockdownSyncModal(){
  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = '⚡ SẬP BẪY MA TRẬN — GIẬT CẦU DAO ĐỒNG BỘ';
  document.getElementById('mgTimer').textContent = '';
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">
      Bấm GIẬT CẦU DAO đúng lúc con trỏ nằm trong vùng xanh để đồng bộ với Chàng Lính & Wibu
      (độ chính xác của họ phụ thuộc mức thành thạo phép ấn: ${Math.round(50+(S.spellMastery||0)/2)}%).</p>
    <div class="syncBarWrap"><div class="syncBarZoneGood"></div><div class="syncBarZonePerfect"></div><div class="syncBarMarker" id="syncMarker"></div></div>`;
  footer.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'bigbtn';
  btn.textContent = '⚡ GIẬT CẦU DAO';
  footer.appendChild(btn);

  let pos = 0, dir = 1, raf = null, resolved = false;
  const speed = 2.2;
  function tick(){
    pos += dir*speed;
    if(pos>=100){ pos=100; dir=-1; }
    if(pos<=0){ pos=0; dir=1; }
    const marker = document.getElementById('syncMarker');
    if(marker) marker.style.left = pos+'%'; else return; // modal đã đóng -> dừng loop
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  btn.onclick = ()=>{
    if(resolved) return;
    resolved = true;
    if(raf) cancelAnimationFrame(raf);
    const quality = lockdownSyncQualityFor(pos);
    modal.classList.add('hidden');
    resolveLockdownSync(quality);
  };
}

/* Vùng "hoàn hảo" 45-55%, vùng "tốt" 30-70%, ngoài ra là trượt — tách riêng thành hàm thuần
   để test được không cần DOM/animation. */
function lockdownSyncQualityFor(pos){
  if(pos>=45 && pos<=55) return 'perfect';
  if(pos>=30 && pos<=70) return 'good';
  return 'miss';
}

function resolveLockdownSync(playerQuality){
  const npcAccuracy = 0.5 + (S.spellMastery||0)/200; // 50%-100% tuỳ spellMastery
  const npcBHit = Math.random() < npcAccuracy;
  const npcEHit = Math.random() < npcAccuracy;
  const playerHit = playerQuality !== 'miss';
  const hits = (playerHit?1:0) + (npcBHit?1:0) + (npcEHit?1:0);

  addLog('[BỘ ĐÀM] Đồng bộ: Bạn '+(playerHit?'✔':'✘')+' — Chàng Lính '+(npcBHit?'✔':'✘')+' — Wibu '+(npcEHit?'✔':'✘')+' ('+hits+'/3)', 'radio');

  if(hits>=3){
    addLog('✦ ĐỒNG BỘ HOÀN HẢO! Ma trận La Peace xích chặt TIU tại chỗ!', 'good');
    S.night2.trapIntegrity = 100;
    enterOverloadPhase();
  } else if(hits===2){
    addLog('Đồng bộ một phần — TIU bị khống chế nhưng bẫy không thật sự ổn định.', 'warn');
    S.night2.trapIntegrity = 60;
    enterOverloadPhase();
  } else {
    addLog('☠ Đồng bộ thất bại — TIU giật tung một góc bẫy và thoát khỏi Trận Địa!', 'danger');
    S.night2.phase = 'luring';
    S.night2.lureSync = { B:false, E:false, D:false };
    const opts = ROOM_DEF['FIELD'].connects;
    S.monsterRoom = pick(opts);
  }
  markActionDirty();
  refreshAll();
}

/* ---- Giai đoạn 3: QUÁ TẢI CẦU DAO ---- */
function enterOverloadPhase(){
  S.night2.phase = 'overload';
  S.night2.overloadStartMin = S.gameMinutes;
  S.night2.overloadMeter = 0;
  S.night2.activeThreats = [];
  S.night2.nextThreatAt = S.gameMinutes + rand(8,14);
  addLog('⚡ GIAI ĐOẠN QUÁ TẢI CẦU DAO bắt đầu — cầm cự tới bình minh (07:30)!', 'danger');
  markActionDirty();
}

const OVERLOAD_LANE_LABELS = {
  fence:  'Hàng rào bẫy đang rung chuyển dữ dội!',
  powerC: 'Dòng điện tại Tòa C mất ổn định!',
  uvBlock:'Một luồng ảo giác đang lao thẳng vào Trận Địa!',
};
const OVERLOAD_LANE_OWNER = { fence:'B', powerC:'E', uvBlock:'player' };
const OVERLOAD_LANE_ROOM  = { fence:'FIELD', powerC:'C', uvBlock:'FIELD' };
const OVERLOAD_THREAT_DEADLINE_MIN = 15;
const OVERLOAD_INTEGRITY_PENALTY = 15;

function spawnOverloadThreat(){
  const lane = pick(Object.keys(OVERLOAD_LANE_LABELS));
  const threat = { id: 't'+Date.now()+Math.random().toString(36).slice(2,6), lane, deadline: S.gameMinutes + OVERLOAD_THREAT_DEADLINE_MIN };
  S.night2.activeThreats.push(threat);
  addLog('⚠ '+OVERLOAD_LANE_LABELS[lane], 'danger');
  markActionDirty();
}

function checkThreatDeadlines(){
  const n2 = S.night2;
  const remaining = [];
  n2.activeThreats.forEach(t=>{
    if(S.gameMinutes > t.deadline){
      n2.trapIntegrity = clamp(n2.trapIntegrity - OVERLOAD_INTEGRITY_PENALTY, 0, 100);
      addLog('☠ Không xử lý kịp sự cố — Trận Địa mất '+OVERLOAD_INTEGRITY_PENALTY+'% độ bền! ('+n2.trapIntegrity+'%)', 'critical');
    } else {
      remaining.push(t);
    }
  });
  n2.activeThreats = remaining;
}

function resolveOverloadThreatByNPC(threatId, k){
  const npc = S.npc[k];
  const threat = S.night2.activeThreats.find(t=>t.id===threatId);
  if(!npc || !threat) return false;
  if(OVERLOAD_LANE_OWNER[threat.lane] !== k){
    addLog('[BỘ ĐÀM] '+npc.name+' không đảm nhiệm sự cố này.', 'warn');
    return false;
  }
  const requiredRoom = OVERLOAD_LANE_ROOM[threat.lane];
  if(npc.room !== requiredRoom){
    addLog('[BỘ ĐÀM] '+npc.name+': "Tôi chưa ở '+ROOM_DEF[requiredRoom].name+', không xử lý được từ đây!"', 'warn');
    return false;
  }
  S.night2.activeThreats = S.night2.activeThreats.filter(t=>t.id!==threatId);
  addLog('✔ '+npc.name+' đã xử lý xong: '+OVERLOAD_LANE_LABELS[threat.lane], 'good');
  markActionDirty();
  return true;
}

function canResolveUVBlockThreat(){
  return !!S && isHardMode() && S.night===2 && S.night2.phase==='overload'
    && S.playerRoom==='FIELD'
    && S.night2.activeThreats.some(t=>t.lane==='uvBlock');
}
function resolvePlayerUVBlock(){
  if(!canResolveUVBlockThreat()) return;
  const threat = S.night2.activeThreats.find(t=>t.lane==='uvBlock');
  S.night2.activeThreats = S.night2.activeThreats.filter(t=>t.id!==threat.id);
  addLog('✔ Bạn dùng Đèn UV chặn đứng luồng ảo giác tại Trận Địa!', 'good');
  markActionDirty();
  advanceWorld(2);
  refreshAll();
}

function trapBreakFailState(){
  addLog('☠ Trận Địa đã bị phá vỡ hoàn toàn! TIU thoát khỏi Ma Trận La Peace!', 'critical');
  S.night2.phase = 'luring';
  S.night2.lureSync = { B:false, E:false, D:false };
  S.night2.trapIntegrity = 100;
  S.night2.activeThreats = [];
  const opts = ROOM_DEF['FIELD'].connects;
  S.monsterRoom = pick(opts);
  markActionDirty();
  refreshAll();
}

/* ---- Trận đánh cuối cùng (tái dùng hệ thống battleOverlay của Chapter 1) ---- */
function triggerNight2Climax(){
  addLog('☀ 07:30 — Dòng điện quá tải đã tích đủ. Nhưng dòng La Peace đang chảy sai hướng — có điều gì đó không ổn!', 'danger');
  // Cho người chơi TỰ CHỌN giữa route Normal (ngắt cầu dao, vạch mặt Trọng ngay -> đánh Trọng cùng đồng đội,
  // kết thúc ở Đêm 2) và route Secret (do dự -> Trọng nuốt TIU, biến thành "The Grimoire", mở khóa Đêm 3).
  const promptLines = VN_CH2_CLIMAX_CHOICE.lines.slice();
  const lastIdx = promptLines.length-1;
  promptLines[lastIdx] = Object.assign({}, promptLines[lastIdx], {
    choices: promptLines[lastIdx].choices.map((c,i)=>Object.assign({}, c, {
      insert: i===1 ? VN_CH2_SECRET_HESITATION_DIALOGUE.lines.concat(VN_CH2_SECRET_TRANSFORM_DIALOGUE.lines) : VN_CH2_NORMAL_CONFRONT.lines,
      onChoose: ()=>{ S.night2ClimaxRoute = (i===0) ? 'normal' : 'secret'; },
    })),
  });
  playVN(promptLines, ()=>{
    if(S.night2ClimaxRoute==='secret') triggerChapter2SecretPathToNight3();
    else runNight2ClimaxBattleNormal();
  });
}
function runNight2ClimaxBattleNormal(){
  // Route Normal: Trọng bị vạch mặt ngay tại Trận Địa -> cả ba cùng đánh hắn (combat FF + QTE, boss CÓ THỂ bị hạ gục).
  startSecretBattle({
    killable: true,
    bossMaxHp: 650,
    bossName: 'TRỌNG — NGƯỜI GIỮ SÁCH',
    bossImage: (typeof TRONG_CURSE_IMAGE !== 'undefined') ? TRONG_CURSE_IMAGE : null,
    patterns: BOSS_PATTERNS_TRONG,
    patternPoolA: BOSS_PATTERNS_TRONG_SWIFT,
    patternPoolB: BOSS_PATTERNS_TRONG_HEAVY,
    chainSelector: chooseTrongPatternChain,
    sealThresholdRatio: 0,
    maxTurn: Infinity,
    introLog: [
      {msg:'Quyển sách của Trọng bật mở giữa Trận Địa — hắn không còn là người dẫn đường nữa!', cls:'danger'},
      {msg:'Kim Kiếm La Peace của bạn vừa thức tỉnh, cùng Wibu Việt Nhật và Chàng Lính Ngu Lắm đối đầu hắn.', cls:''},
      {msg:'Tấn công thường không cần QTE; KỸ NĂNG cần bấm chuỗi mũi tên (BẠN 5, WIBU 3, LÍNH 4). Khi bị đánh: bấm đúng hướng để ĐỠ (giảm 50% sát thương), trong vùng sáng để PARRY (đỡ 100%). Hạ gục Trọng để chặn nghi lễ!', cls:'warn'},
    ],
    victoryShatterMsg: 'Mũi kim xuyên qua trang sách cuối cùng — quyển sách của Trọng khép lại, chữ nghĩa tan thành dòng!',
    victoryLightMsg: 'Những đốm La Peace bay vụt về khắp khuôn viên, trả lại cho từng chủ nhân.',
    onVictory: ()=>{ playVN(VN_CH2_VICTORY_DIALOGUE.lines, ()=>{ triggerChapter2NormalEnding(); }); },
    defeatLogMsg: 'Cả party gục ngã... Trọng gom nốt La Peace, nghi lễ tiếp tục.',
    defeatScreenMsg: 'Trọng đã áp đảo cả party — nghi lễ của hắn không bị chặn lại. Thử lại lần nữa.',
  });
}

/* Route Secret: Trọng tự nuốt lấy TIU và trở thành "The Grimoire" — đêm 2 khép lại ở đây,
   nhưng câu chuyện tiếp tục sang Đêm 3 (thay vì kết thúc game như route Normal). */
function triggerChapter2SecretPathToNight3(){
  if(!S) return;
  S.running = false;
  S.endingRoute = 'secret_pending';
  document.getElementById('winTitle').textContent = '✦ ĐÊM 2 KẾT THÚC — QUYỂN SÁCH MỞ RA ✦';
  document.getElementById('winSub').textContent = 'Trọng đã lộ mặt: hắn nuốt trọn TIU và Trận Địa, trở thành THE GRIMOIRE. Người từng dẫn đường cho cả ba, giờ là kẻ muốn lấy đi thứ gì đó đang ngủ yên trong bạn.';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'BẮT ĐẦU ĐÊM 3';
  nextBtn.onclick = ()=>{
    document.getElementById('winScreen').classList.add('hidden');
    campaignCarry = { inventory: Object.assign({}, S.inventory), components: Object.assign({}, S.components), setupGauge: S.setupGauge };
    beginNight(3, false, 2);
  };
  document.getElementById('menuFromWin').onclick = showTitle;
  document.getElementById('winScreen').classList.remove('hidden');
}

/* Chapter 2, Đêm 3 — chạy khi người chơi bị TRỌNG tóm đủ 3 lần (xem jumpscare()). Thay vì Game
   Over, đây là lúc La Peace bên trong nhân vật chính thức tỉnh, dẫn thẳng vào trận đánh cuối
   cùng với TRỌNG — THE GRIMOIRE (tái dùng đúng engine boss/bullet-hell đã có). */
function triggerLaPeaceAwakening(){
  if(!S) return;
  S.running = false; // trận đánh boss quản lý vòng lặp/nhạc riêng của nó, không cần tick thế giới nữa
  addLog('✦ La Peace bên trong bạn đã thức tỉnh — bạn không còn là con mồi nữa.', 'good');
  playVN(VN_CH3_LAPEACE_AWAKENING.lines, ()=>{
    startTrongCurseOneBattle();
  });
}



function triggerChapter2NormalEnding(){
  if(!S) return;
  S.running = false;
  S.endingRoute = 'normal';
  document.getElementById('winTitle').textContent = '✦ NORMAL ENDING — QUYỂN SÁCH ĐÓNG LẠI ✦';
  document.getElementById('winSub').textContent = 'Trọng bị đánh bại, nghi lễ bị chặn đứng. La Peace trở về với chủ cũ, và The TIU — mảnh ký ức méo mó của một cô gái chưa từng tồn tại — lặng lẽ tan vào ánh bình minh.';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'VỀ MÀN HÌNH CHÍNH';
  nextBtn.onclick = showTitle;
  document.getElementById('winScreen').classList.remove('hidden');
}

/* ============== HẾT PHẦN ĐÊM 2 ============== */

/* ============== CHAPTER 2 — BUỔI HỌC PHÉP VỚI TRỌNG (16:30-20:45, PHẦN 0 #6 / PHẦN 7) ==============
   Chạy từ beginNight() ngay khi bắt đầu Đêm 1 hoặc Đêm 2 của Chapter 2 (nếu chưa học đêm đó
   trong phiên chơi hiện tại — xem trongTrainedForNight). Gồm 2 bước: (1) hội thoại mở đầu qua
   playVN(), rồi (2) minigame bấm phím mũi tên theo đúng thứ tự qua #mgModal. Kết quả cộng vào
   S.spellMastery (0-100), đồng thời lưu vào campaignSpellMastery để sống sót qua retry. */

const ARROW_KEYS = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
const ARROW_GLYPHS = { ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→' };

function randomArrowSequence(len){
  const seq = [];
  for(let i=0;i<len;i++) seq.push(pick(ARROW_KEYS));
  return seq;
}

/* Hàm THUẦN (không đụng DOM) — so khớp input với target theo từng vị trí, trả về tỉ lệ đúng
   0-1. Tách riêng để test được độc lập với bàn phím/animation. */
function computeArrowSequenceAccuracy(targetSeq, inputSeq){
  if(!targetSeq || !targetSeq.length) return 1;
  let correct = 0;
  for(let i=0;i<targetSeq.length;i++){
    if(inputSeq[i]===targetSeq[i]) correct++;
  }
  return correct/targetSeq.length;
}

function startTrongTrainingSequence(n){
  const introLines = n===1 ? VN_TRONG_TEACH_SOLO_INTRO.lines : VN_TRONG_TEACH_GROUP_INTRO.lines;
  playVN(introLines, ()=>{
    openTrongTrainingMinigame(n);
  });
}

function openTrongTrainingMinigame(n){
  S.paused = true; // playVN() đã tự unpause sau hội thoại mở đầu -> pause lại cho minigame
  const participantCount = (n===1) ? 1 : 3;
  const seqLen = 6 + participantCount*2; // 8 ký hiệu (solo) / 12 ký hiệu (cả 3)
  const target = randomArrowSequence(seqLen);
  const input = [];

  const modal = document.getElementById('mgModal');
  modal.classList.remove('hidden');
  document.getElementById('mgTitle').textContent = participantCount===1
    ? '🔮 TRỌNG DẠY BẠN DẤU ẤN CƠ BẢN'
    : '🔮 TRỌNG DẠY CẢ BA DẤU ẤN CƠ BẢN';
  document.getElementById('mgTimer').textContent = '';
  const body = document.getElementById('mgBody');
  const footer = document.getElementById('mgFooter');
  footer.innerHTML = '';

  function render(){
    body.innerHTML = `<p style="font-size:12px;color:var(--text-dim);margin-bottom:10px;">
        Dùng phím mũi tên trên bàn phím, lặp lại ĐÚNG thứ tự dấu ấn bên dưới (đã bấm ${input.length}/${target.length}).</p>
      <div class="arrowSeqRow">${target.map((k,idx)=>{
        const cls = idx<input.length ? (input[idx]===k?'hit':'miss') : (idx===input.length?'current':'');
        return `<span class="arrowGlyph ${cls}">${ARROW_GLYPHS[k]}</span>`;
      }).join('')}</div>`;
  }
  render();

  function cleanup(){
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){
    if(!ARROW_KEYS.includes(e.key)) return;
    e.preventDefault();
    input.push(e.key);
    render();
    if(input.length>=target.length){
      cleanup();
      const accuracy = computeArrowSequenceAccuracy(target, input);
      setTimeout(()=>{
        modal.classList.add('hidden');
        resolveTrongTraining(n, participantCount, accuracy);
      }, 400);
    }
  }
  document.addEventListener('keydown', onKey);
}

function resolveTrongTraining(n, participantCount, accuracy){
  const gain = Math.round(accuracy * (participantCount===1 ? 40 : 60));
  S.spellMastery = clamp((S.spellMastery||0) + gain, 0, 100);
  campaignSpellMastery = S.spellMastery; // sống sót qua retry (xem beginNight())
  trongTrainedForNight[n] = true;

  const success = accuracy >= 0.5;
  addLog('🔮 Buổi học phép với Trọng kết thúc ('+Math.round(accuracy*100)+'% chính xác) — mức thành thạo hiện tại: '+S.spellMastery+'%.', 'radio');
  markActionDirty();

  const outcomeLines = n===1
    ? (success ? VN_TRONG_TEACH_SOLO_SUCCESS.lines  : VN_TRONG_TEACH_SOLO_FAIL.lines)
    : (success ? VN_TRONG_TEACH_GROUP_SUCCESS.lines : VN_TRONG_TEACH_GROUP_FAIL.lines);
  playVN(outcomeLines, ()=>{ refreshAll(); });
}

/* ============== HẾT PHẦN BUỔI HỌC PHÉP VỚI TRỌNG ============== */

function advanceWorld(minutesPassed, opts={}){
  // --- Giai đoạn đêm: kiểm tra xem đã bước sang mốc mới chưa ---
  checkPhaseTransition();
  // --- Chapter 2, Đêm 1: 3 giai đoạn trinh sát/thi công/nạp năng lượng (Phần 5) ---
  checkNight1Phase();
  // --- Chapter 2, Đêm 2: Lùa Địch / Sập Bẫy / Quá Tải Cầu Dao (Phần 6) ---
  checkNight2Phase();

  // decay meter slowly (chậm hơn khi đang Huyết Nguyệt)
  if(!S.enraged){
    S.meter = Math.max(0, S.meter - NIGHT_CFG[S.night].meterDecay*minutesPassed);
  }

  // --- Huyết Nguyệt: kích hoạt khi meter chạm 100% ---
  if(!S.enraged && S.meter>=100){
    S.enraged = true;
    S.enrageUntil = S.gameMinutes + ENRAGE_DURATION_MIN;
    addLog('🩸 HUYẾT NGUYỆT! '+chaseMonsterLabel()+' đã mất kiểm soát — mọi khu an toàn không còn tác dụng!','danger');
    markActionDirty();
  }
  if(S.enraged && S.gameMinutes >= S.enrageUntil && !(isHardMode() && S.night===2)){
    S.enraged = false;
    S.meter = 50;
    addLog('Huyết Nguyệt đã hạ nhiệt... '+chaseMonsterLabel()+' tạm thời bình thường trở lại.','tiu');
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
      addLog('Sự cố tại '+ROOM_DEF[room].name+' đã bị bỏ lỡ! '+chaseMonsterLabel()+' trở nên bất ổn hơn.','warn');
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

  // --- Chapter 2: cập nhật 2 NPC đồng đội (di chuyển tự động, tiến độ nhiệm vụ, Stress) ---
  tickTeamNPCs(minutesPassed);

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

  updateProximityTension(minutesPassed);

  if(S.gameMinutes >= S.nightTotalMin) endNightSuccess();
}

/* ============== MỤC 1: NHỊP ĐỘ DỒN DẬP — MỨC ĐỘ HOẠT ĐỘNG TĂNG LIÊN TỤC ==============
   Trước đây S.meter chỉ tăng khi người chơi bỏ lỡ/thất bại sự cố -> áp lực tăng theo bậc
   rời rạc. Hàm này bổ sung 2 nguồn tăng liên tục, mượt hơn, khiến ván chơi ngày càng dồn
   dập thay vì chỉ đột biến theo phase:
     1) Đứng yên quá lâu ở khu KHÔNG an toàn -> The TIU ngày càng táo tợn hơn theo thời gian.
     2) The TIU áp sát (chỉ còn cách 1 phòng) -> hoạt động tăng vọt, có cooldown để không
        cộng dồn liên tục mỗi khung hình. */
function updateProximityTension(minutesPassed){
  if(!S || !S.running || S.epilogue) return;

  if(!isRoomSafe(S.playerRoom) && !S.enraged){
    const idleMin = S.gameMinutes - (S.lastMoveAt||0);
    if(idleMin > TENSION_IDLE_GRACE_MIN){
      S.meter = Math.min(100, S.meter + TENSION_IDLE_GAIN_PER_MIN*minutesPassed);
    }
  }

  if(!isRoomSafe(S.playerRoom) && S.gameMinutes >= (S.nextTensionTickAt||0)){
    const d = roomDistance(S.playerRoom, S.monsterRoom);
    if(d===1){
      S.meter = Math.min(100, S.meter + TENSION_NEARMISS_GAIN);
      S.nextTensionTickAt = S.gameMinutes + TENSION_NEARMISS_COOLDOWN;
    }
  }
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
  addLog('⚠ '+chaseMonsterLabel()+' gây ra sự cố tại '+ROOM_DEF[room].name+': '+eventLabel(ROOM_DEF[room].event)+'!','warn');
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
let proximityTrackKind = 'tiu'; // 'tiu' | 'trong' — theo dõi track nào đang được nạp vào proximityAudioEl
/* Đảm bảo proximityAudioEl luôn phát đúng nhạc cảnh báo cho kẻ đuổi bắt hiện tại — TIU ở hầu
   hết các đêm, riêng Chapter 2 Đêm 3 đổi sang nhạc riêng của TRỌNG (xem TRONG_CHASE_PROXIMITY_MUSIC
   ở đầu file). Gọi mỗi khung hình từ updateProximityAudio() để tự chuyển track khi cần. */
function syncProximityAudioTrack(){
  if(!proximityAudioEl) return;
  const wantKind = isTrongChaseNight() ? 'trong' : 'tiu';
  if(wantKind === proximityTrackKind) return;
  const wantSrc = wantKind==='trong' ? TRONG_CHASE_PROXIMITY_MUSIC : TIU_PROXIMITY_MUSIC;
  if(!wantSrc) return;
  const wasPlaying = !proximityAudioEl.paused;
  proximityAudioEl.pause();
  proximityAudioEl.src = wantSrc;
  proximityAudioEl.currentTime = 0;
  proximityTrackKind = wantKind;
  if(wasPlaying) proximityAudioEl.play().catch(()=>{});
}
function updateProximityAudio(){
  if(!proximityAudioEl || !TIU_PROXIMITY_MUSIC) return;
  syncProximityAudioTrack();
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
        addLog(chaseMonsterLabel()+' bị tiếng ồn từ Bẫy gây nhiễu thu hút và lao về phía '+ROOM_DEF[S.noiseTrap.room].name+'...', 'tiu');
        return;
      }
    }
  }

  let opts = ROOM_DEF[from].connects.filter(r=>!isRoomSafe(r));
  if(opts.length===0) opts = ROOM_DEF[from].connects.slice();
  let next;

  const decisionMeter = S.meter;

  if(S.enraged || decisionMeter>70){
    // >70% (hoặc Huyết Nguyệt): rình rập — bám theo đường đi ngắn nhất tới người chơi
    const path = bfsPath(from, S.playerRoom, !S.enraged);
    if(path && path.length>1) next = path[1];
    else next = pick(opts);
  } else if(decisionMeter>=30){
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
  addLog(chaseMonsterLabel()+' vừa rời khỏi '+ROOM_DEF[from].name+'...','tiu');
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
  const trongChase = isTrongChaseNight(); // Chapter 2, Đêm 3: TRỌNG đuổi bắt thay vì The TIU
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
  addLog('JUMPSCARE! '+chaseMonsterLabel()+' đã tóm được bạn tại '+ROOM_DEF[caughtRoom].name+'!','danger');

  // fullscreen jumpscare display: ảnh phóng to dần rồi lao thẳng ra khỏi màn hình (kèm SFX),
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

  const jsImage = trongChase ? TRONG_CURSE_IMAGE : TIU_IMAGE;
  jsMonster.style.backgroundImage = jsImage ? `url('${jsImage}')` : '';
  jsMonster.classList.toggle('no-img', !jsImage);
  jsPanel.classList.remove('show');

  // Lần bắt thứ 3 (HP về 0) trong Đêm 3 Chapter 2 KHÔNG dẫn tới Game Over như bình thường —
  // đây là khoảnh khắc La Peace bên trong nhân vật chính thức tỉnh (xem triggerLaPeaceAwakening()).
  const awakening = dead && trongChase;

  if(awakening){
    jsPanelText.innerHTML = 'LẦN THỨ BA...<span class="jsPanelSub">Một luồng năng lượng ấm áp bùng lên trong lồng ngực bạn tại '+ROOM_DEF[caughtRoom].name+'.</span>';
    jsContinueBtn.textContent = 'THỨC TỈNH LA PEACE ▶';
  } else {
    jsPanelText.innerHTML = dead
      ? chaseMonsterLabel()+' ĐÃ TÓM ĐƯỢC BẠN LẦN CUỐI...<span class="jsPanelSub">Bạn gục ngã tại '+ROOM_DEF[caughtRoom].name+'.</span>'
      : chaseMonsterLabel()+' ĐÃ TÓM ĐƯỢC BẠN!<span class="jsPanelSub">Còn lại '+hpLeft+' HP — vừa xảy ra tại '+ROOM_DEF[caughtRoom].name+'</span>';
    jsContinueBtn.textContent = dead ? 'XEM KẾT QUẢ' : 'TIẾP TỤC';
  }

  // Khi đã hết HP thì không thể "chơi tiếp" — chỉ còn một nút dẫn tới màn hình kết quả (hoặc,
  // riêng route thức tỉnh La Peace, dẫn thẳng vào trận đánh cuối).
  jsGiveUpBtn.classList.toggle('hidden', dead);

  js.classList.remove('hidden');
  js.classList.remove('active','lunge'); void js.offsetWidth;
  js.classList.add('active','lunge'); // TIU/Trọng phóng to rồi lao ra khỏi màn hình (0.9s) + màn hình rung lắc, chạy song song

  // SFX phát đúng lúc kẻ đuổi bắt lao ra khỏi màn hình (điền đường dẫn ở đầu file)
  const jsSfx = trongChase ? TRONG_CHASE_JUMPSCARE_SFX : TIU_JUMPSCARE_SFX;
  if(jsSfx){
    try{
      sfx.src = jsSfx;
      sfx.volume = (window.UIT_SOUND_MUTED?0:1) * (SETTINGS.masterVolume/100);
      sfx.currentTime = 0;
      sfx.play().catch(()=>{});
    }catch(e){}
  }

  // Bảng thông báo + nút lựa chọn trồi lên ngay sau khi kẻ đuổi bắt đã lao ra khỏi màn hình
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
    if(awakening){
      triggerLaPeaceAwakening();
    } else if(dead){
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
  updateBreakerFloatBtn();
  return blackedOut;
}
/* Nút nổi "KHỞI ĐỘNG LẠI CẦU DAO TỔNG": chỉ hiện khi đang có biến cố mất điện toàn trường
   VÀ người chơi đang có mặt tại Tòa C — nổi lên trên cả lớp phủ tối (#blackout) để không bị
   khuất trong bóng tối. */
function updateBreakerFloatBtn(){
  const btn = document.getElementById('breakerFloatBtn');
  if(!btn) return;
  const gridEv = !!(S && S.activeEvents && S.activeEvents.C && S.activeEvents.C.gridEvent);
  const show = !!(S && S.running && !S.paused && !S.epilogue && S.gridDown && gridEv
    && S.playerRoom==='C' && !isBlockingOverlayOpen());
  btn.classList.toggle('show', show);
  if(show){
    const td = tdActive();
    const sub = btn.querySelector('.breakerFloatSub');
    if(sub) sub.textContent = td ? 'Chạy tới bảng điện đang nhấp nháy đỏ rồi bấm E' : 'Bấm để xử lý sự cố ngay tại Tòa C';
    btn.style.pointerEvents = td ? 'none' : '';
  }
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
      const npcVisibleNow = !!getRoomNPCMeta(S.playerRoom);
      if(npcVisibleNow !== lastNpcVisible){ lastNpcVisible = npcVisibleNow; actionPaneDirty = true; }
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
      addLog('Bạn thất bại ở sự cố tại '+ROOM_DEF[room].name+'! '+chaseMonsterLabel()+' trở nên bất ổn hơn.','warn');
      // Giải sai sự cố: TIU bị thu hút và có tỷ lệ nhảy cóc đến vị trí kề cận phòng đó ngay lập tức
      if(S.gameMinutes>=S.breakerUntil && Math.random()<0.6){
        const adj = ROOM_DEF[room].connects.filter(r=>!isRoomSafe(r));
        const target = adj.length ? pick(adj) : room;
        S.monsterRoom = target;
        S.lastSeenRoom = room;
        S.lastSeenAt = S.gameMinutes;
        addLog(''+chaseMonsterLabel()+' bị thu hút bởi sự hỗn loạn và nhảy cóc đến gần '+ROOM_DEF[room].name+'!','tiu');
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
  // Chốt % hoàn thiện Trận Địa ngay khi Đêm 1 (Chapter 2) kết thúc — quyết định độ khó Đêm 2.
  if(S.chapter===2 && S.night===1) finalizeSetupGauge();
  // VN_OUTRO hiện chỉ có nội dung cho Chapter 1 — Chapter 2 chuyển thẳng sang màn hình kết quả.
  if(S.chapter===2){ showEndScreen(); return; }
  // Đêm 3 (Chapter 1, chơi thường) mà không có tế lễ -> đoạn kết Trọng cố phong ấn TIU.
  if(S.night===3 && !S.standalone && !S.trongBattleStarted){
    S.trongSealFail = true;
    playVN(VN_OUTRO[S.night], ()=>playVN(TRONG_SEAL_FAIL_ENDING, showEndScreen));
    return;
  }
  playVN(VN_OUTRO[S.night], showEndScreen);
}
function showEndScreen(){
  if(S.chapter===2){
    if(S.standalone){
      document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
      document.getElementById('winSub').textContent='CHAPTER 2 — '+NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại.'
        + (S.night===3 ? ' TRỌNG tạm thời mất dấu bạn — nhưng La Peace bên trong bạn vẫn chưa có dịp thức tỉnh thật sự.' : '');
      document.getElementById('nextNightBtn').textContent='CHƠI LẠI ĐÊM NÀY';
      document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); beginNight(S.night,true,2); };
    } else if(S.night>=3){
      // Sống sót tới 7:30 sáng mà chưa bị TRỌNG tóm đủ 3 lần: La Peace chưa có dịp thức tỉnh
      // giữa đêm — buộc phải đối diện ngay khi trời sắp sáng, để câu chuyện luôn đi tới trận
      // đánh cuối cùng dù người chơi né tránh giỏi tới đâu (xem triggerLaPeaceAwakening()).
      document.getElementById('winScreen').classList.add('hidden');
      triggerLaPeaceAwakening();
      return;
    } else {
      const setupPct = isHardMode() ? S.setupGauge : null;
      document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
      document.getElementById('winSub').textContent='CHAPTER 2 — '+NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại.'
        + (setupPct!==null ? ' Trận Địa đã hoàn thiện '+setupPct+'% — mức độ này sẽ quyết định độ khó của Đêm 2.' : ' Cẩn thận — cầu dao điện và The TIU sẽ khó lường hơn.');
      document.getElementById('nextNightBtn').textContent='BẮT ĐẦU ĐÊM '+(S.night+1);
      document.getElementById('nextNightBtn').onclick=()=>{
        document.getElementById('winScreen').classList.add('hidden');
        campaignCarry = {
          inventory: Object.assign({}, S.inventory),
          components: Object.assign({}, S.components),
          // Chỉ có ý nghĩa khi chuyển từ Đêm 1 -> Đêm 2 của Chapter 2 (xem PHẦN 5 design doc).
          // spellMastery KHÔNG cần mang qua đây nữa -> đã theo dõi bằng campaignSpellMastery
          // (biến cấp phiên chơi, sống sót qua retry) và được beginNight() tự đồng bộ vào S.
          setupGauge: S.setupGauge,
        };
        beginNight(S.night+1, false, 2);
      };
    }
    document.getElementById('winScreen').classList.remove('hidden');
    return;
  }
  if(S.standalone){
    document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
    document.getElementById('winSub').textContent=NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại.';
    document.getElementById('nextNightBtn').textContent='CHƠI LẠI ĐÊM NÀY';
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); beginNight(S.night,true); };
  } else if(S.night>=3){
    document.getElementById('winTitle').textContent='BẠN ĐÃ SỐNG SÓT QUA 3 ĐÊM';
    document.getElementById('winSub').textContent = S.trongSealFail
      ? 'Bạn đã sống sót, nhưng phải đánh đổi bằng thứ gì đó mà bạn không dám nghĩ tới. Trước khi rời trường, có lẽ nên đi một vòng lần cuối.'
      : 'Phòng trọ giờ đã sẵn sàng để dọn vào. The TIU tạm thời im lặng... nhưng trước khi rời trường, có lẽ nên đi một vòng lần cuối.';
    document.getElementById('nextNightBtn').textContent='TIẾP TỤC';
    document.getElementById('nextNightBtn').onclick=()=>{ document.getElementById('winScreen').classList.add('hidden'); startEpilogue('normal'); };
  } else {
    document.getElementById('winTitle').textContent='ĐÃ ĐẾN 7:30 SÁNG';
    document.getElementById('winSub').textContent=NIGHT_CFG[S.night].name+' hoàn thành với '+S.hp+' HP còn lại. Chuẩn bị cho đêm lẩn trốn tiếp theo — The TIU sẽ hung hãn hơn.';
    document.getElementById('nextNightBtn').textContent='BẮT ĐẦU ĐÊM '+(S.night+1);
    document.getElementById('nextNightBtn').onclick=()=>{
      document.getElementById('winScreen').classList.add('hidden');
      // Ghi lại vật phẩm & linh kiện còn giữ được để mang sang đêm tiếp theo.
      campaignCarry = { inventory: Object.assign({}, S.inventory), components: Object.assign({}, S.components) };
      beginNight(S.night+1);
    };
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
  // ---- simpleOnly: chỉ được State Machine chọn khi boss còn ở pha "KHỞI ĐỘNG" (HP cao) ----
  {name:'ĐẠN THẲNG CƠ BẢN', desc:'Từng viên đạn bắn thẳng đều đặn từ trên xuống — tốc độ cố định, dễ đoán trước.', dmg:[3,5], bulletType:'straight', dodgeDuration:4000, simpleOnly:true},
  {name:'MƯA DỮ LIỆU LỖI', desc:'Từng đợt ký tự đỏ rực đổ xuống dồn dập như mưa.', dmg:[5,9], bulletType:'rain', dodgeDuration:4600},
  {name:'VÒNG XOÁY HỖN LOẠN', desc:'TIU tan thành hàng trăm mảnh vỡ, xoáy liên hồi quanh tâm rồi bắn ra theo từng viên nối tiếp.', dmg:[5,9], bulletType:'spiral', dodgeDuration:4800},
  {name:'TIA QUÉT KÝ ỨC', desc:'Nhiều luồng sáng trắng lần lượt quét ngang/dọc, chỉ báo trước rồi bắn thật.', dmg:[7,12], bulletType:'sweep', dodgeDuration:5000},
  {name:'BÓNG ĐÊM NUỐT CHỬNG', desc:'Nhiều đợt sóng nổ tỏa tròn dồn dập từ tâm lao ra.', dmg:[5,9], bulletType:'burst', dodgeDuration:4600},
  {name:'GỌNG KÌM BỐN PHÍA', desc:'Đạn ập vào liên tục từ cả bốn phía, siết chặt không gian né tránh.', dmg:[6,10], bulletType:'cross', dodgeDuration:5000},
  {name:'SÓNG TRUY SÁT', desc:'Từng luồng đạn lượn sóng bay ra từ rìa màn hình, nhắm thẳng vào vị trí của bạn lúc phóng ra.', dmg:[5,9], bulletType:'wave', dodgeDuration:4800},
  {name:'VỌT TỐC BẤT NGỜ', desc:'Đạn xuất phát chậm rãi rồi đột ngột tăng tốc gấp nhiều lần giữa chừng — chớ chủ quan!', dmg:[6,11], bulletType:'acceldash', dodgeDuration:4600},
  // ---- 2 pattern lấy cảm hứng từ các trận boss kinh điển Undertale/Deltarune (đã gỡ các pattern dạng tường) ----
  {name:'LƯỠI KIẾM XOAY TÍT', desc:'Từng chùm lưỡi kiếm xoay tít quanh tâm rồi văng dần ra ngoài thành vòng xoáy mở rộng — style The Knight.', dmg:[6,10], bulletType:'orbit', dodgeDuration:5000},
  {name:'BÚA CÔNG LÝ GIÁNG XUỐNG', desc:'Hàng loạt giáo phán xét dựng lên dồn dập khắp trận địa theo từng cụm liên tiếp, không kịp thở — style Hammer of Justice.', dmg:[7,11], bulletType:'judgement', dodgeDuration:5000},
];

/* ---- Pattern KẾT HỢP dành riêng cho State Machine theo % HP (xem applyHpStateMachine bên
   dưới): bắn ĐỒNG THỜI trong cùng 1 chuỗi đạn — vừa XOẮN ỐC (từ tâm, cộng dồn góc liên tục
   từng viên một) VỪA ĐẠN LƯỢN SÓNG nhắm thẳng vào người chơi. combinedOnly:true nghĩa là
   pattern này CHỈ xuất hiện sau khi boss đã "lộ bài" (HP tụt dưới ngưỡng chuyển pha). ---- */
const BOSS_PATTERN_COMBO = {
  name:'HỖN CHIẾN: XOẮN ỐC & SÓNG TRUY SÁT',
  desc:'Boss vừa xoáy tít hàng loạt đạn xoắn ốc từ tâm, vừa tung thêm những luồng sóng lượn nhắm thẳng vào bạn!',
  dmg:[6,10], bulletType:'combo', dodgeDuration:5600, combinedOnly:true
};

/* ============== ĐÊM 3 — BỘ CHIÊU THỨC CỦA TRỌNG "THE GRIMOIRE" ==============
   Các pattern chia làm 2 nhóm theo phong cách:

   SWIFT (nhanh, dồn dập, khó đoán): PHI TIÊU ĐỘC, BẮN TỈA TỨ GÓC, BÓNG ĐEN TẢN LOẠN,
   TÀNG HÌNH ĐÁNH LÉN — sát thương mỗi đòn thấp-vừa nhưng liên tục, có cộng dồn độc.

   HEAVY (ít đòn nhưng cực nặng): ĐẬP BÚA ĐỊA CHẤN, XÔNG THẲNG, KHIÊN ĐẤT — cảnh báo dài,
   bù lại rất khó né nếu phản xạ trễ.

   Xem chooseTrongPatternChain() để biết cách 2 nhóm này được chọn theo % HP còn lại
   (đầu trận ưu tiên SWIFT -> giữa trận xen kẽ -> cuối trận, sau mốc phong ấn, HEAVY dồn dập hơn). */
const BOSS_PATTERNS_TRONG_SWIFT = [
  {name:'PHI TIÊU ĐỘC', desc:'Trọng ném liên tiếp những mũi phi tiêu tẩm độc, nhắm thẳng vào vị trí của bạn.', dmg:[4,7], bulletType:'dart', dodgeDuration:4200, poison:true},
  {name:'BẮN TỈA TỨ GÓC', desc:'Trọng thoắt ẩn thoắt hiện trên 4 góc trận địa, bắn tỉa liên hồi từ xa.', dmg:[5,9], bulletType:'pillar', dodgeDuration:4800},
  {name:'BÓNG ĐEN TẢN LOẠN', desc:'Hàng chục mảnh bóng đen nhỏ lao ra từ mọi phía, hỗn loạn và khó đoán.', dmg:[3,6], bulletType:'swarm', dodgeDuration:5000},
  {name:'TÀNG HÌNH ĐÁNH LÉN', desc:'Trọng biến mất khỏi tầm mắt — một vòng vây bất ngờ bung ra ngay quanh bạn.', dmg:[6,10], bulletType:'ambush', dodgeDuration:3800},
];
const BOSS_PATTERNS_TRONG_HEAVY = [
  {name:'ĐẬP BÚA ĐỊA CHẤN', desc:'Trọng giáng một cú đấm rung chuyển toàn bộ trận địa — chỉ còn đúng 1 điểm an toàn.', dmg:[10,16], bulletType:'quake', dodgeDuration:5200},
  {name:'XÔNG THẲNG', desc:'Trọng lùi lại rồi lao thẳng qua trận địa như một cơn lốc sắt thép.', dmg:[12,18], bulletType:'charge', dodgeDuration:4400},
  {name:'KHIÊN ĐẤT', desc:'Trọng dựng một lớp khiên đất dày, tạm ngừng tấn công để gồng mình phòng thủ.', dmg:[0,0], bulletType:'shield', dodgeDuration:3200, shieldSelf:true},
];
/* ============== NÂNG CẤP UNDERTALE/DELTARUNE — 3 PATTERN MỚI CHO BOX COMBAT ==============
   Dùng riêng cho trận Trọng "The Grimoire" ở chế độ undertaleMode (xem freshBattleState /
   startTrongCurseOneBattle). 3 pattern đúng tinh thần thiết kế được yêu cầu:
   1) Tuyến Tính — đạn bay ngang/dọc tốc độ khác nhau (bulletType 'uxlinear').
   2) Gaster Blaster style — cột tia laser xuất hiện sau 1 giây cảnh báo TẠI vị trí người chơi
      đang đứng lúc phóng ra (bulletType 'uxblaster').
   3) Jevil/Spamton style — đạn nảy dội liên tục vào các cạnh khung né (bulletType 'uxbounce'). */
const BOSS_PATTERNS_TRONG_UNDERTALE = [
  {name:'MƯA THOI DỆT ĐỊNH MỆNH', desc:'Từng tia đạn bay thẳng ngang và dọc khung né, mỗi đợt lại đổi tốc độ — không đợt nào giống đợt nào.', dmg:[4,8], bulletType:'uxlinear', dodgeDuration:4600},
  {name:'NÒNG SÚNG PHÁN XÉT', desc:'Một cỗ nòng súng vô hình khoá thẳng vào đúng vị trí bạn đang đứng, cảnh báo đúng 1 giây rồi xả hết đạn thành cột tia xuyên suốt khung né.', dmg:[9,15], bulletType:'uxblaster', dodgeDuration:5200},
  {name:'ĐÙA CỢT HỖN MANG', desc:'Từng viên đạn nảy bật điên loạn giữa các cạnh khung né, quỹ đạo không thể đoán trước — càng lâu càng dày đặc.', dmg:[5,9], bulletType:'uxbounce', dodgeDuration:5000},
  // ---- Bổ sung thêm 2 pattern kinh điển Undertale/Deltarune cho trận Trọng (đã gỡ các pattern dạng tường) ----
  {name:'LƯỠI KIẾM XOAY TÍT', desc:'Từng chùm lưỡi kiếm xoay tít quanh tâm rồi văng dần ra ngoài — style The Knight.', dmg:[6,9], bulletType:'orbit', dodgeDuration:4800},
  {name:'BÚA CÔNG LÝ GIÁNG XUỐNG', desc:'Hàng loạt giáo phán xét dựng lên dồn dập liên tiếp khắp trận địa — style Hammer of Justice.', dmg:[6,10], bulletType:'judgement', dodgeDuration:4800},
];
// Nhóm SWIFT nhận thêm Tuyến Tính + Hỗn Mang + Xoay Tít (dồn dập, khó đoán); nhóm HEAVY nhận
// thêm Nòng Súng Phán Xét + Búa Công Lý (đòn nặng, dồn ép không gian).
// Chỉ số trong BOSS_PATTERNS_TRONG_UNDERTALE: 0 Tuyến Tính | 1 Nòng Súng | 2 Hỗn Mang | 3 Xoay Tít | 4 Búa Công Lý
BOSS_PATTERNS_TRONG_SWIFT.push(BOSS_PATTERNS_TRONG_UNDERTALE[0], BOSS_PATTERNS_TRONG_UNDERTALE[2], BOSS_PATTERNS_TRONG_UNDERTALE[3]);
BOSS_PATTERNS_TRONG_HEAVY.push(BOSS_PATTERNS_TRONG_UNDERTALE[1], BOSS_PATTERNS_TRONG_UNDERTALE[4]);

const BOSS_PATTERNS_TRONG = [...BOSS_PATTERNS_TRONG_SWIFT, ...BOSS_PATTERNS_TRONG_HEAVY];

let BS = null;          // trạng thái trận đấu hiện tại
let battleMusicEl = null;

function freshBattleState(opts){
  opts = opts || {};
  const order = opts.order || BATTLE_PARTY_ORDER;
  const hpMul = opts.partyHpMultiplier || 1;
  const party = {};
  order.forEach(k=>{
    const maxHp = Math.round(PARTY_DEF[k].maxHp*hpMul);
    party[k] = {hp:maxHp, maxHp, cd:0, action:null, defending:false, taunting:false};
  });
  return {
    turn:1, maxTurn:opts.maxTurn || BATTLE_MAX_TURN,
    boss:{hp:opts.bossMaxHp||BOSS_MAX_HP, maxHp:opts.bossMaxHp||BOSS_MAX_HP, stunned:false, shielded:false},
    party, order, pickIdx:0, log:[], over:false,
    dodgeSoften:0, // số lệnh "Tấn công" ở lượt vừa rồi -> làm chậm & giãn chuỗi đạn né tiếp theo
    // ---- Các cờ mới hỗ trợ boss CÓ THỂ bị hạ gục thật (vd Trọng — The Grimoire, Đêm 3) ----
    // Mặc định (killable=false) giữ NGUYÊN hành vi cũ: boss không bao giờ chết, thắng chỉ đến
    // khi cầm cự đủ maxTurn lượt (dùng cho trận bí mật Chapter 1 & màn Quá Tải Chapter 2).
    killable: !!opts.killable,
    bossName: opts.bossName || 'THE TIU',
    bossImage: opts.bossImage || null, // null -> renderBattle() dùng TIU_IMAGE mặc định
    patterns: opts.patterns || BOSS_PATTERNS,      // bộ pattern riêng cho từng trận (mặc định BOSS_PATTERNS)
    patternPoolA: opts.patternPoolA || null,       // tuỳ chọn: 2 nhóm pattern trộn theo %HP (xem chooseTrongPatternChain)
    patternPoolB: opts.patternPoolB || null,
    chainSelector: opts.chainSelector || null,     // hàm chọn chuỗi pattern tuỳ biến, mặc định null -> dùng chooseBossPatternChain
    sealThresholdRatio: opts.sealThresholdRatio!=null ? opts.sealThresholdRatio : 0.2,
    sealChoiceShown: false,
    onSealChoice: opts.onSealChoice || null,        // callback khi HP chạm ngưỡng phong ấn (chỉ dùng nếu killable)
    poisonStacks: 0,                                // mỗi lần trúng "Phi Tiêu Độc" cộng dồn, gây thêm sát thương cuối lượt boss
    souls: !!opts.souls,                            // true nếu MC đang chiến đấu dưới dạng "Kim Kiếm La Peace" (đổi flavor text kỹ năng)
    musicSrc: opts.musicSrc || null,                 // null -> startBattleMusic() dùng BATTLE_MUSIC mặc định
    // ---- State Machine chuyển pha bắn theo %HP (xem applyHpStateMachine) — mặc định BẬT,
    // chỉ có tác dụng khi chainSelector đang dùng là chooseBossPatternChain (mặc định); trận
    // Trọng — The Grimoire dùng chainSelector riêng (chooseTrongPatternChain) nên không bị ảnh hưởng.
    hpStateMachineEnabled: opts.hpStateMachineEnabled !== false,
    hpPhaseThreshold: opts.hpPhaseThreshold != null ? opts.hpPhaseThreshold : 0.5,
    hpPhase: 'SIMPLE',
    // ---- NÂNG CẤP UNDERTALE/DELTARUNE (chỉ dùng cho trận Trọng "The Grimoire") ----
    undertaleMode: !!opts.undertaleMode,          // bật menu FIGHT/ACT/ITEM thay cho Tấn công/Phòng thủ/Kỹ năng
    tauntStacks: 0, reassureStacks: 0, tauntStackMax: 3, // ACT: Chế nhạo / Trấn an, tối đa 3 stack mỗi loại
    tauntUltCd: 0, reassureUltCd: 0,   // hồi chiêu của Sát Chiêu Hoàn Hảo / Ta Sẽ Không Bỏ Ai Ở Lại (mở khoá khi stack tương ứng đạt tối đa)
    bossDmgMult: 1,                // tính lại mỗi lần ACT: +15%/stack Chế nhạo, -15%/stack Trấn an
    willBuffActive: false,        // "Ý Chí Của Người Bông" đã kích hoạt (buff sát thương + tự hồi máu)
    willBuffScale: 1,             // hệ số nhân sát thương của kỹ năng YOU — Ultimate nâng lên 1.5
    ultimateUsed: false,          // "Lend Me Your Power" chỉ dùng được đúng 1 lần/trận
  };
}
/* Ultimate "Lend Me Your Power" chỉ mở khoá khi độ tin tưởng của CẢ 2 NPC (Wibu Việt Nhật &
   Chàng Lính Ngu Lắm) đã đạt tối đa (campaignNpcTalks.E/.B đều >=3, giống điều kiện mở khoá
   trận bí mật Chapter 1 ở dòng ~625). Trả về false an toàn nếu chưa từng gặp campaignNpcTalks. */
function trongUltimateUnlocked(){
  try{
    return !!(campaignNpcTalks && campaignNpcTalks.E && campaignNpcTalks.B
      && campaignNpcTalks.E.size>=3 && campaignNpcTalks.B.size>=3);
  }catch(e){ return false; }
}

/* opts (tất cả optional, mặc định = đúng hành vi trận đánh bí mật Chapter 1 như cũ):
   - introLog: [{msg,cls}] — log hiển thị lúc mở màn
   - onVictory: callback khi thắng (mặc định: hội thoại chiến thắng của Trọng -> triggerSecretEnding)
   - onDefeat: callback khi thua (mặc định: hiện gameOverScreen với thông báo trận bí mật)
   - defeatLogMsg / defeatScreenMsg: text tuỳ biến cho 2 trường hợp trên
   - victoryShatterMsg / victoryLightMsg: 2 dòng log hiệu ứng vỡ màn hình lúc thắng */
function startSecretBattle(opts){
  opts = opts || {};
  BS = freshBattleState(opts);
  BS.onVictory = opts.onVictory || null;              // null -> dùng default (Chapter 1) trong finishBattle()
  BS.onDefeat = opts.onDefeat || null;
  BS.defeatLogMsg = opts.defeatLogMsg || 'Cả party gục ngã... nghi lễ thanh tẩy thất bại.';
  BS.defeatScreenMsg = opts.defeatScreenMsg || 'Trận chiến bí mật thất bại — TIU đã áp đảo cả party trước khi Trọng kịp hoàn thành tế lễ thanh tẩy.';
  BS.victoryShatterMsg = opts.victoryShatterMsg || 'Trọng hoàn tất tế lễ thanh tẩy — hình hài TIU rạn nứt rồi vỡ tan thành từng mảnh!';
  BS.victoryLightMsg = opts.victoryLightMsg || 'Một luồng ánh sáng trắng ấm áp lan tỏa khắp không gian, nuốt trọn những mảnh vỡ cuối cùng của TIU!';
  if(S) S.paused = true;
  document.getElementById('battleOverlay').classList.remove('hidden');
  document.getElementById('bossName').textContent = BS.bossName;
  playShatterFx();
  startBattleMusic();
  const introLog = opts.introLog || [
    {msg:'Trọng dang tay truyền mana cho cả ba người — không gian vỡ tan thành từng mảnh...', cls:''},
    {msg:BS.bossName+' hiện nguyên hình trước party!', cls:'danger'},
    {msg:'Đòn đánh của party không thể hạ gục TIU — chỉ cần CẦM CỰ đủ '+BS.maxTurn+' lượt để Trọng hoàn tất nghi lễ!', cls:'warn'},
  ];
  introLog.forEach(l=> addBattleLog(l.msg, l.cls));
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
  const src = (BS && BS.musicSrc) || BATTLE_MUSIC;
  if(!battleMusicEl || !src) return;
  try{
    battleMusicEl.src = src;
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
  const bossPct = BS.killable
    ? Math.max(0, BS.boss.hp/BS.boss.maxHp*100)
    : Math.max(2, BS.boss.hp/BS.boss.maxHp*100); // TIU (không killable): thanh máu không bao giờ hiện 0% — không thể bị đánh gục
  document.getElementById('bossHpBarFill').style.width = bossPct+'%';
  document.getElementById('bossHpText').textContent = Math.max(0,Math.round(BS.boss.hp))+' / '+BS.boss.maxHp;
  document.getElementById('battleTurnMax').textContent = isFinite(BS.maxTurn) ? BS.maxTurn : '∞';
  document.getElementById('battleNoKillNote').textContent = (BS.killable && BS.sealThresholdRatio===0)
    ? '✦ Hạ gục '+BS.bossName+' để chặn nghi lễ của hắn ✦'
    : BS.killable
    ? '✦ '+BS.bossName+' CÓ THỂ bị hạ gục thật sự — nhưng khi HP xuống 20%, sẽ có lựa chọn khác ngoài việc kết liễu ✦'
    : '✦ '+BS.bossName+' không thể bị hạ gục bằng đòn đánh — chỉ có thể thắng bằng cách CẦM CỰ ĐỦ '+BS.maxTurn+' LƯỢT ✦';
  const bossSprite = document.getElementById('bossSprite');
  const bossImg = BS.bossImage || TIU_IMAGE;
  bossSprite.style.backgroundImage = bossImg ? `url('${bossImg}')` : '';
  bossSprite.classList.toggle('no-img', !bossImg);

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
  if(BS.undertaleMode){ showUndertaleMenu(key); return; }
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
  hint.textContent = def.skillDesc+' (QTE '+(SKILL_QTE_COUNT[key]||3)+' mũi tên — Tấn công/Phòng thủ thường không cần QTE)';
  menu.appendChild(hint);
}

/* ============== NÂNG CẤP UNDERTALE/DELTARUNE — MENU BOX COMBAT (FIGHT/ACT/ITEM) ==============
   FIGHT (Tấn công thường/buffed), ACT (Chế nhạo/Trấn an — thay thế hẳn nút Kỹ Năng cũ, đây
   chính là nơi "Ý Chí Của Người Bông" được kích hoạt), ITEM (Bim Bim). Ultimate "Lend Me Your
   Power" hiện thêm 1 nút riêng khi đủ điều kiện mở khoá (tin tưởng tối đa 2 NPC) và chưa dùng
   lần nào trong trận. */
function undertaleSkillLabel(){
  if(BS.willBuffActive && BS.willBuffScale>=1.5) return 'LA PEACE CỦA BÔNG HOA';
  if(BS.willBuffActive) return 'Ý CHÍ CỦA NGƯỜI BÔNG';
  return 'VÌ TAO LÀ NGƯỜI BÔNG';
}
function showUndertaleMenu(key){
  const st = BS.party[key];
  const menu = document.getElementById('battleMenu');
  menu.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'battleMenuHead';
  head.textContent = 'LƯỢT CỦA BẠN';
  menu.appendChild(head);

  const row = document.createElement('div');
  row.className = 'battleMenuRow uxRow';

  const fightBtn = document.createElement('button');
  fightBtn.className = 'battleCmdBtn atk';
  fightBtn.textContent = '⚔ FIGHT';
  fightBtn.onclick = ()=>chooseAction(key,'attack');
  row.appendChild(fightBtn);

  const actBtn = document.createElement('button');
  actBtn.className = 'battleCmdBtn skl';
  actBtn.textContent = '✦ ACT';
  actBtn.onclick = ()=>showUndertaleActSubmenu(key);
  row.appendChild(actBtn);

  const itemBtn = document.createElement('button');
  itemBtn.className = 'battleCmdBtn def';
  itemBtn.textContent = '🍟 ITEM';
  itemBtn.onclick = ()=>showUndertaleItemSubmenu(key);
  row.appendChild(itemBtn);

  menu.appendChild(row);

  if(trongUltimateUnlocked() && !BS.ultimateUsed){
    const ultRow = document.createElement('div');
    ultRow.className = 'battleMenuRow';
    const ultBtn = document.createElement('button');
    ultBtn.className = 'battleCmdBtn ultimate';
    ultBtn.textContent = '✧ LEND ME YOUR POWER ✧';
    ultBtn.onclick = ()=>chooseAction(key,'ultimate');
    ultRow.appendChild(ultBtn);
    menu.appendChild(ultRow);
    const ultHint = document.createElement('div');
    ultHint.className = 'battleMenuHint';
    ultHint.textContent = 'Wibu Việt Nhật & Chàng Lính Ngu Lắm dồn hết niềm tin cho bạn [QTE '+(SKILL_QTE_COUNT[key]||5)+' mũi tên] — nâng cấp '+undertaleSkillLabel()+' thành LA PEACE CỦA BÔNG HOA, tăng 50% sức mạnh cho phần còn lại của trận. Chỉ dùng được 1 lần.';
    menu.appendChild(ultHint);
  }

  const stackLine = document.createElement('div');
  stackLine.className = 'battleMenuHint';
  stackLine.innerHTML = `😈 Chế nhạo: <b>${BS.tauntStacks}/${BS.tauntStackMax}</b> &nbsp;|&nbsp; 🕊 Trấn an: <b>${BS.reassureStacks}/${BS.tauntStackMax}</b> &nbsp;|&nbsp; Sát thương ${BS.bossName}: <b>${Math.round((BS.bossDmgMult||1)*100)}%</b>`;
  menu.appendChild(stackLine);

  const hint = document.createElement('div');
  hint.className = 'battleMenuHint';
  hint.textContent = BS.willBuffActive
    ? (undertaleSkillLabel()+' đang kích hoạt — mỗi đòn FIGHT vừa gây thêm sát thương vừa hồi máu cho bạn.')
    : 'ACT để chế nhạo (Trọng tăng tấn công nhưng mất máu) hoặc trấn an (Trọng giảm tấn công) — dùng Trấn an lần đầu sẽ đánh thức kỹ năng của bạn.';
  menu.appendChild(hint);
}

function showUndertaleActSubmenu(key){
  const menu = document.getElementById('battleMenu');
  menu.innerHTML = '<div class="battleMenuHead">ACT — CHỌN HÀNH ĐỘNG</div>';
  const row = document.createElement('div');
  row.className = 'battleMenuRow';

  const tauntMaxed = BS.tauntStacks >= BS.tauntStackMax;
  const tauntOnCd = tauntMaxed && BS.tauntUltCd>0;
  const tauntBtn = document.createElement('button');
  tauntBtn.className = 'battleCmdBtn atk';
  tauntBtn.textContent = tauntMaxed
    ? ('💀 Sát Chiêu Hoàn Hảo'+(tauntOnCd?' ('+BS.tauntUltCd+')':''))
    : '😈 Chế nhạo';
  tauntBtn.disabled = tauntOnCd;
  tauntBtn.onclick = ()=>chooseAction(key,'act_taunt');
  row.appendChild(tauntBtn);

  const reassureMaxed = BS.reassureStacks >= BS.tauntStackMax;
  const reassureOnCd = reassureMaxed && BS.reassureUltCd>0;
  const calmBtn = document.createElement('button');
  calmBtn.className = 'battleCmdBtn def';
  calmBtn.textContent = reassureMaxed
    ? ('🕊 Ta Sẽ Không Bỏ Ai Ở Lại'+(reassureOnCd?' ('+BS.reassureUltCd+')':''))
    : '🕊 Trấn an';
  calmBtn.disabled = reassureOnCd;
  calmBtn.onclick = ()=>chooseAction(key,'act_reassure');
  row.appendChild(calmBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'battleCmdBtn';
  backBtn.textContent = '↩ Quay lại';
  backBtn.onclick = ()=>showUndertaleMenu(key);
  row.appendChild(backBtn);

  menu.appendChild(row);
  const hint = document.createElement('div');
  hint.className = 'battleMenuHint';
  hint.textContent = tauntMaxed || reassureMaxed
    ? 'Đủ 3/3 stack, Chế nhạo/Trấn an đã biến thành chiêu thức riêng — mỗi lần dùng xong sẽ mất 3 lượt để hồi lại.'
    : '[QTE '+(SKILL_QTE_COUNT[key]||5)+' mũi tên] Chế nhạo: mỗi stack (tối đa '+BS.tauntStackMax+') tăng sát thương của '+BS.bossName+' nhưng khiến hắn mất một phần HP vì mất kiểm soát. Trấn an: mỗi stack (tối đa '+BS.tauntStackMax+') giảm sát thương của '+BS.bossName+' — lần đầu dùng sẽ đánh thức "'+undertaleSkillLabel()+'" trong bạn.';
  menu.appendChild(hint);
}

function showUndertaleItemSubmenu(key){
  const menu = document.getElementById('battleMenu');
  menu.innerHTML = '<div class="battleMenuHead">ITEM — TÚI ĐỒ</div>';
  const row = document.createElement('div');
  row.className = 'battleMenuRow';

  const bimCount = (S && S.inventory && S.inventory.bimbim) || 0;
  const bimBtn = document.createElement('button');
  bimBtn.className = 'battleCmdBtn def';
  bimBtn.textContent = '🍟 Bim Bim ('+bimCount+')';
  bimBtn.disabled = bimCount<=0;
  bimBtn.onclick = ()=>chooseAction(key,'item_bimbim');
  row.appendChild(bimBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'battleCmdBtn';
  backBtn.textContent = '↩ Quay lại';
  backBtn.onclick = ()=>showUndertaleMenu(key);
  row.appendChild(backBtn);

  menu.appendChild(row);
  const hint = document.createElement('div');
  hint.className = 'battleMenuHint';
  hint.textContent = 'Ăn Bim Bim ngay tại trận — hồi máu cho bạn (tiêu 1 suất Bim Bim trong túi đồ ngoài đời thực).';
  menu.appendChild(hint);
}

function skillLabelFor(key, action){
  if(action==='act_taunt') return BS.tauntStacks>=BS.tauntStackMax ? 'Sát Chiêu Hoàn Hảo' : 'Chế nhạo';
  if(action==='act_reassure') return BS.reassureStacks>=BS.tauntStackMax ? 'Ta Sẽ Không Bỏ Ai Ở Lại' : 'Trấn an';
  if(action==='ultimate') return 'Lend Me Your Power';
  return BS.undertaleMode ? undertaleSkillLabel() : PARTY_DEF[key].skillName;
}
function chooseAction(key, action){
  // Đòn đánh thường: KHÔNG có QTE. Chỉ kỹ năng (skill / ACT / ultimate) mới qua QTE theo độ phức tạp từng nhân vật.
  if(SKILL_ACTIONS.includes(action)){
    document.getElementById('battleMenu').innerHTML = '<div class="battleMenuHint">Chuẩn bị niệm chú...</div>';
    runSkillQte(key, skillLabelFor(key, action), (r)=>{
      const st = BS.party[key];
      st.action = action;
      st.skillQ = {accuracy:r.accuracy, perfect:r.perfect, total:r.total};
      addBattleLog(PARTY_DEF[key].name+' niệm "'+skillLabelFor(key, action)+'": '+r.perfect+' chính xác, '+r.blocked+' ổn, '+r.hits+' trật ('+Math.round(r.accuracy*100)+'%)'+(r.accuracy<0.4?' — THẤT BẠI!':'.'),'skill');
      BS.pickIdx++;
      promptNextAction();
    });
    return;
  }
  BS.party[key].action = action;
  BS.pickIdx++;
  promptNextAction();
}

/* ---- Xử lý lượt của party rồi tới lượt của boss ---- */
function resolveRound(){
  document.getElementById('battleMenu').innerHTML = '<div class="battleMenuHint">Đang xử lý lượt...</div>';

  // hồi giảm cooldown kỹ năng từ lượt trước
  BS.order.forEach(k=>{ if(BS.party[k].cd>0) BS.party[k].cd--; });
  if(BS.tauntUltCd>0) BS.tauntUltCd--;
  if(BS.reassureUltCd>0) BS.reassureUltCd--;
  BS.order.forEach(k=>{ BS.party[k].defending=false; BS.party[k].taunting=false; });
  BS.boss.stunned = false;

  let atkCount = 0;

  // NÂNG CẤP ACT: Chế nhạo/Trấn an giờ phát hội thoại qua playVN() (bất đồng bộ — chờ người
  // chơi bấm TIẾP TỤC) nên được tách hẳn ra khỏi vòng forEach đồng bộ bên dưới. Vì trận Trọng
  // luôn chỉ có đúng 1 thành viên ('YOU'), xử lý riêng rồi return sớm là đủ và an toàn.
  const actorKey = BS.order.find(k=> BS.party[k].hp>0 && (BS.party[k].action==='act_taunt' || BS.party[k].action==='act_reassure'));
  if(actorKey){
    if(BS.party[actorKey].action==='act_taunt') resolveActTaunt(actorKey, atkCount);
    else resolveActReassure(actorKey, atkCount);
    return;
  }

  BS.order.forEach(key=>{
    const st = BS.party[key], def = PARTY_DEF[key];
    if(st.hp<=0 || !st.action) return;
    if(st.action==='attack'){
      atkCount++;
      let dmg = Math.round(rand(12,20));
      if(BS.willBuffActive) dmg = Math.round(dmg * (BS.willBuffScale||1)); // Ý Chí Của Người Bông / La Peace Của Bông Hoa
      if(BS.boss.shielded) dmg = Math.round(dmg*0.5); // Khiên Đất của Trọng — giảm nửa sát thương lượt này
      if(BS.killable){
        BS.boss.hp = Math.max(0, BS.boss.hp - dmg);
        addBattleLog(def.name+' tấn công '+BS.bossName+', gây '+dmg+' sát thương.'+(BS.boss.shielded?' (Khiên Đất giảm bớt tác động!)':''),'atk');
      } else {
        // TIU được Trọng phong ấn tạm thời — sát thương chỉ mang tính "cầm chân", máu không bao giờ về 0
        BS.boss.hp = Math.max(Math.round(BS.boss.maxHp*0.015), BS.boss.hp - dmg);
        addBattleLog(def.name+' tấn công '+BS.bossName+', gây '+dmg+' sát thương (không đủ để hạ gục).','atk');
      }
      if(BS.willBuffActive){
        const heal = Math.round(dmg*0.25);
        st.hp = Math.min(st.maxHp, st.hp+heal);
        addBattleLog(def.name+' hấp thụ ngược lại '+heal+' HP từ luồng năng lượng vừa gây ra.','skill');
      }
    } else if(st.action==='defend'){
      st.defending = true;
      addBattleLog(def.name+' thủ thế, chuẩn bị chịu đòn.','def');
    } else if(st.action==='skill'){
      applyBattleSkill(key);
    } else if(st.action==='item_bimbim'){
      if(S && S.inventory && S.inventory.bimbim>0){
        S.inventory.bimbim--;
        const heal = Math.round(st.maxHp*0.18) + 1; // "hồi 1 HP" quy đổi theo thang máu trận đấu (S.hp gốc chỉ có thang 0-3)
        st.hp = Math.min(st.maxHp, st.hp+heal);
        addBattleLog(def.name+' ăn Bim Bim ngay giữa trận, hồi '+heal+' HP!','good');
      } else {
        addBattleLog(def.name+' lục túi nhưng không còn Bim Bim nào...', '');
      }
    } else if(st.action==='ultimate'){
      BS.ultimateUsed = true;
      BS.willBuffActive = true;
      if(skillFailed(st)){ addBattleLog(def.name+' mất nhịp — sợi dây La Peace chỉ truyền được một nửa sức mạnh!','warn'); }
      BS.willBuffScale = skillFailed(st) ? Math.max(BS.willBuffScale||1, 1.25) : 1.25 + 0.25*Math.min(1, skillScale(st)/1.2);
      addBattleLog('✧ "LEND ME YOUR POWER" ✧ — Wibu Việt Nhật và Chàng Lính Ngu Lắm gửi trọn niềm tin qua sợi dây La Peace!','skill');
      addBattleLog(def.name+' cảm nhận ý chí gộp lại thành một — '+undertaleSkillLabel()+' bùng lên, sức mạnh tăng vọt 50%!','skill');
      st.hp = Math.min(st.maxHp, st.hp + Math.round(st.maxHp*0.2*skillScale(st)));
    }
  });

  finishResolveRound(atkCount);
}

/* ============== ACT — PHÁT HỘI THOẠI BẠN <-> TRỌNG ==============
   Nội dung nằm trong TRONG_ACT_DIALOGUE (dialogue.js): mỗi lượt là MỘT CẶP {you, trong} nên
   luôn khớp nhau, và leo thang theo số stack hiện có (tier 0 -> 1 -> 2). */
/* Chọn 1 cặp thoại theo loại ACT ('taunt' | 'reassure') và số stack hiện có; tránh lặp lại
   đúng cặp vừa dùng ở tier đó nếu còn cặp khác để chọn. */
function pickActExchange(kind, stackCount){
  const tiers = TRONG_ACT_DIALOGUE[kind].tiers;
  const tierIdx = Math.min(Math.max(stackCount, 0), tiers.length-1);
  const pool = tiers[tierIdx];
  BS.actDialogueLast = BS.actDialogueLast || {};
  const key = kind+':'+tierIdx;
  let candidates = pool.map((_, i)=>i);
  if(candidates.length > 1) candidates = candidates.filter(i=> i !== BS.actDialogueLast[key]);
  const idx = candidates[Math.floor(Math.random()*candidates.length)];
  BS.actDialogueLast[key] = idx;
  return pool[idx];
}
function buildActLines(ex){
  return [
    {spk:'BẠN',   text:'"'+ex.you+'"'},
    {spk:'TRỌNG', text:'"'+ex.trong+'"'},
  ];
}

/* ============== NÂNG CẤP UNDERTALE/DELTARUNE — ACT: CHẾ NHẠO ==============
   Dưới 3/3 stack: phát 1 câu BẠN + 1 câu TRỌNG đáp trả qua playVN() (y hệt hội thoại thường
   trong game), rồi mới tăng stack + tăng bossDmgMult + chip HP TRỌNG. Đủ 3/3 stack: biến
   thành SÁT CHIÊU HOÀN HẢO — đòn kết liễu sát thương lớn, hồi chiêu 3 lượt. */
function resolveActTaunt(key, atkCount){
  const st = BS.party[key], def = PARTY_DEF[key];
  st.defending = false;
  if(skillFailed(st)){
    addBattleLog('Lời chế nhạo của '+def.name+' lạc nhịp, chẳng khiến '+BS.bossName+' bận tâm — ACT thất bại!','warn');
    finishResolveRound(atkCount);
    return;
  }

  if(BS.tauntStacks >= BS.tauntStackMax){
    if(BS.tauntUltCd > 0){
      addBattleLog('BẠN muốn tung SÁT CHIÊU HOÀN HẢO, nhưng chiêu vẫn còn hồi ('+BS.tauntUltCd+' lượt nữa).','warn');
      finishResolveRound(atkCount);
      return;
    }
    playVN(buildActLines(TRONG_ACT_DIALOGUE.taunt.ultimate), ()=>{
      const dmg = Math.round((BS.boss.maxHp*0.16 + rand(10,18))*skillScale(st));
      if(BS.killable) BS.boss.hp = Math.max(0, BS.boss.hp - dmg);
      else BS.boss.hp = Math.max(Math.round(BS.boss.maxHp*0.015), BS.boss.hp - dmg);
      BS.tauntUltCd = 3;
      addBattleLog('✦ SÁT CHIÊU HOÀN HẢO ✦ — '+def.name+' tung đòn kết liễu, gây '+dmg+' sát thương lên '+BS.bossName+'! (Hồi chiêu: 3 lượt)','skill');
      finishResolveRound(atkCount);
    });
    return;
  }

  // Cặp thoại BẠN + TRỌNG lấy từ CÙNG một object (xem TRONG_ACT_DIALOGUE) -> luôn khớp nhau.
  playVN(buildActLines(pickActExchange('taunt', BS.tauntStacks)), ()=>{
    BS.tauntStacks++;
    const chip = Math.round(BS.boss.maxHp*0.04);
    BS.boss.hp = Math.max(1, BS.boss.hp - chip); // Trọng mất kiểm soát vì cơn giận -> tự hao HP, nhưng không bao giờ về 0 do lệnh này
    BS.bossDmgMult = clamp(1 + BS.tauntStacks*0.15 - BS.reassureStacks*0.15, 0.25, 2.2);
    addBattleLog(BS.bossName+' nổi giận vì bị chế nhạo — sức tấn công tăng lên, nhưng mất '+chip+' HP vì mất kiểm soát! (Chế nhạo '+BS.tauntStacks+'/'+BS.tauntStackMax+')','danger');
    finishResolveRound(atkCount);
  });
}

/* ============== NÂNG CẤP UNDERTALE/DELTARUNE — ACT: TRẤN AN ==============
   Dưới 3/3 stack: phát 1 câu BẠN + 1 câu TRỌNG đáp trả qua playVN(), rồi tăng stack + giảm
   bossDmgMult (lần đầu dùng cũng đánh thức "Ý Chí Của Người Bông"). Đủ 3/3 stack: biến thành
   "TA SẼ KHÔNG BỎ AI Ở LẠI" — tăng HP tối đa của bản thân, hồi chiêu 3 lượt. */
function resolveActReassure(key, atkCount){
  const st = BS.party[key], def = PARTY_DEF[key];
  st.defending = true; // trấn an cũng khiến bạn chuẩn bị tinh thần, giảm nhẹ sát thương lượt boss tới
  if(skillFailed(st)){
    addBattleLog('Lời trấn an của '+def.name+' nghẹn lại giữa chừng — ACT thất bại!','warn');
    finishResolveRound(atkCount);
    return;
  }

  if(BS.reassureStacks >= BS.tauntStackMax){
    if(BS.reassureUltCd > 0){
      addBattleLog('BẠN muốn nói "Ta sẽ không bỏ ai ở lại", nhưng cần thêm '+BS.reassureUltCd+' lượt nữa mới đủ bình tâm để lặp lại.','warn');
      finishResolveRound(atkCount);
      return;
    }
    playVN(buildActLines(TRONG_ACT_DIALOGUE.reassure.ultimate), ()=>{
      const gain = Math.round(st.maxHp*0.2*skillScale(st));
      st.maxHp += gain;
      st.hp = Math.min(st.maxHp, st.hp + gain);
      BS.reassureUltCd = 3;
      addBattleLog('✦ "TA SẼ KHÔNG BỎ AI Ở LẠI" ✦ — '+def.name+' vững tin hẳn lên, HP tối đa tăng thêm '+gain+'! (Hồi chiêu: 3 lượt)','good');
      finishResolveRound(atkCount);
    });
    return;
  }

  playVN(buildActLines(pickActExchange('reassure', BS.reassureStacks)), ()=>{
    BS.reassureStacks++;
    BS.bossDmgMult = clamp(1 + BS.tauntStacks*0.15 - BS.reassureStacks*0.15, 0.25, 2.2);
    addBattleLog(BS.bossName+' dịu lại đôi chút — sức tấn công của hắn giảm xuống. (Trấn an '+BS.reassureStacks+'/'+BS.tauntStackMax+')','good');
    // Lần đầu trấn an thành công (BS.undertaleMode) -> chính bạn cũng bình tâm lại, "Ý Chí Của
    // Người Bông" thức tỉnh: buff sát thương FIGHT + tự hồi máu mỗi đòn (xem nhánh 'attack').
    if(BS.undertaleMode && !BS.willBuffActive){
      BS.willBuffActive = true;
      BS.willBuffScale = Math.max(BS.willBuffScale||1, 1.25);
      const heal = Math.round(st.maxHp*0.12);
      st.hp = Math.min(st.maxHp, st.hp+heal);
      addBattleLog('Chính khoảnh khắc trấn an ấy khiến '+def.name+' cũng bình tâm lại — '+undertaleSkillLabel()+' thức tỉnh trong bạn, hồi thêm '+heal+' HP!','skill');
    }
    finishResolveRound(atkCount);
  });
}

/* ---- Phần đuôi chung của resolveRound(): kiểm tra ngưỡng phong ấn/tử vong, tính hiệu ứng
   né đạn lượt tới rồi chuyển sang lượt boss. Tách riêng để cả nhánh đồng bộ (attack/defend/
   skill/item/ultimate) lẫn 2 nhánh ACT bất đồng bộ (chờ playVN) đều gọi chung được. ---- */
function finishResolveRound(atkCount){
  renderBattle();

  // Boss THẬT SỰ có thể bị hạ gục (Đêm 3 — Trọng The Grimoire): kiểm tra ngưỡng phong ấn
  // TRƯỚC khi kiểm tra tử vong — nếu không, một lượt sát thương lớn có thể "nhảy cóc" qua
  // thẳng mốc 15% mà người chơi không bao giờ thấy lựa chọn Phong Ấn/Kết Liễu.
  if(BS.killable){
    if(!BS.sealChoiceShown && BS.boss.hp <= BS.boss.maxHp*BS.sealThresholdRatio){
      BS.boss.hp = Math.round(BS.boss.maxHp*BS.sealThresholdRatio); // chốt đúng về mốc 15%, không để tụt sâu hơn trước khi hỏi
      BS.sealChoiceShown = true;
      renderBattle();
      if(BS.onSealChoice){ BS.onSealChoice(); return; } // tạm dừng, chờ người chơi chọn Phong Ấn/Kết Liễu
    }
    if(BS.boss.hp<=0){ finishBattle(true); return; }
  }
  // Lưu ý: với boss KHÔNG killable (mặc định), TIU KHÔNG BAO GIỜ bị hạ gục bằng đòn đánh —
  // chiến thắng chỉ đến ở endRound() khi party cầm cự đủ BS.maxTurn lượt.

  // Mỗi lệnh "Tấn công" trong lượt này làm CHẬM tốc độ đạn & GIÃN mật độ của chuỗi đòn né
  // tiếp theo của boss — cho các lựa chọn JRPG giá trị thực tế thay vì chỉ là hình thức.
  BS.dodgeSoften = atkCount;
  if(atkCount>0){
    addBattleLog('Party dồn '+atkCount+' đòn tấn công — đòn phản công kế tiếp của '+BS.bossName+' sẽ ÍT NHỊP hơn & thời gian bấm RỘNG hơn!','atk');
  }

  const staggerChance = atkCount*0.10;
  const staggered = Math.random() < staggerChance;
  if(staggered){
    addBattleLog('Cả party dồn dập ra đòn — '+BS.bossName+' loạng choạng, mất lượt tấn công!','warn');
  }

  setTimeout(()=>{ bossTurn(staggered); }, 700);
}

function applyBattleSkill(key){
  const st = BS.party[key], def = PARTY_DEF[key];
  st.cd = def.skillCd;
  if(skillFailed(st)){
    addBattleLog(def.name+' niệm sai chú — "'+skillLabelFor(key,'skill')+'" thất bại, kỹ năng vẫn phải hồi '+def.skillCd+' lượt!','warn');
    return;
  }
  const scale = skillScale(st);
  if(key==='YOU'){
    BS.boss.stunned = true;
    if(BS.undertaleMode){
      if(!BS.willBuffActive){
        BS.willBuffActive = true;
        BS.willBuffScale = Math.max(BS.willBuffScale||1, 1.25);
        addBattleLog('BẠN hét lên "Vì tao là người bông!!" — '+undertaleSkillLabel()+' thức tỉnh! '+BS.bossName+' khựng lại, choáng váng!','skill');
      } else {
        addBattleLog(undertaleSkillLabel()+' bùng lên lần nữa — '+BS.bossName+' khựng lại, choáng váng!','skill');
      }
      const heal = Math.round(st.maxHp*0.12*scale);
      st.hp = Math.min(st.maxHp, st.hp+heal);
      addBattleLog('BẠN hồi '+heal+' HP từ chính luồng ý chí vừa giải phóng.','good');
    } else if(BS.souls) addBattleLog('Ánh sáng La Peace bùng lên từ tay BẠN — '+BS.bossName+' khựng lại, choáng váng!','skill');
    else addBattleLog('BẠN hét lên "Vì tao là người bông!!" — '+BS.bossName+' khựng lại, choáng váng!','skill');
  } else if(key==='WIBU'){
    const heal = Math.round(50*scale);
    BS.order.forEach(k=>{ const p=BS.party[k]; if(p.hp>0) p.hp = Math.min(p.maxHp, p.hp+heal); });
    addBattleLog('WIBU VIỆT NHẬT dùng Chúc Phúc Của Otaku — cả team hồi '+heal+' HP!','skill');
  } else if(key==='LINH'){
    st.taunting = true;
    addBattleLog('CHÀNG LÍNH NGU LẮM hét "Tới tao đây!!" — dựng khiên khiêu khích '+BS.bossName+'!'+(scale>=1.2?' (Khiên hoàn hảo!)':''),'skill');
  }
}

/* ---- Chọn CHUỖI pattern cho lượt boss hiện tại ----
   Càng về các lượt sau, xác suất & độ dài của việc NỐI LIỀN nhiều pattern bullet-hell
   lại với nhau thành 1 chuỗi đòn dài càng tăng. Tới đúng lượt cuối cùng (BS.maxTurn),
   TIU dồn hết sức tàn — TẤT CẢ các pattern sẽ được nối liền lại thành 1 chuỗi duy nhất. */
/* ============== STATE MACHINE: TỰ ĐỘNG CHUYỂN PHA THEO % MÁU BOSS ==============
   2 trạng thái: 'SIMPLE' (mặc định lúc mới vào trận — chỉ dùng các pattern đánh dấu
   simpleOnly, ví dụ ĐẠN THẲNG CƠ BẢN) và 'COMBINED' (bung ra sau khi HP boss tụt xuống
   dưới BS.hpPhaseThreshold — loại hẳn các pattern simpleOnly ra khỏi vòng chọn và bổ sung
   BOSS_PATTERN_COMBO — vừa xoắn ốc vừa đạn sóng nhắm người chơi). Việc chuyển pha là MỘT
   CHIỀU (SIMPLE -> COMBINED), không quay lại dù HP có được hồi, đúng tinh thần "boss lộ
   chiêu mới khi dồn máu vào thế đường cùng". Bật/tắt qua BS.hpStateMachineEnabled. */
function applyHpStateMachine(patterns){
  if(!BS.hpStateMachineEnabled) return patterns;
  if(!BS.hpPhase) BS.hpPhase = 'SIMPLE';
  const threshold = BS.hpPhaseThreshold!=null ? BS.hpPhaseThreshold : 0.5;
  const ratio = clamp(BS.boss.hp / BS.boss.maxHp, 0, 1);
  if(BS.hpPhase === 'SIMPLE' && ratio <= threshold){
    BS.hpPhase = 'COMBINED';
    addBattleLog(BS.bossName+' gầm lên giận dữ khi máu tụt xuống dưới '+Math.round(threshold*100)+'% — LỘ RA CHIÊU THỨC KẾT HỢP MỚI!', 'danger');
  }
  if(BS.hpPhase === 'COMBINED') return [...patterns.filter(p=>!p.simpleOnly), BOSS_PATTERN_COMBO];
  return patterns.filter(p=>!p.combinedOnly);
}

function chooseBossPatternChain(turn){
  const all = applyHpStateMachine(BS.patterns);
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

/* ---- Chọn chuỗi pattern riêng cho Trọng — The Grimoire (Đêm 3) ----
   Không dựa vào số lượt (boss có thể sống rất lâu hoặc chết rất nhanh tuỳ lối chơi) mà dựa
   vào TỈ LỆ HP CÒN LẠI: HP càng cao, nhóm SWIFT (nhanh/dồn dập) càng chiếm ưu thế; HP càng
   thấp, nhóm HEAVY (nặng/huỷ diệt) càng áp đảo. Chuỗi cũng dài & dồn dập hơn khi HP thấp (Trọng càng lúc càng liều lĩnh). */
function chooseTrongPatternChain(){
  const ratio = clamp(BS.boss.hp / BS.boss.maxHp, 0, 1);
  const poolA = BS.patternPoolA || BS.patterns; // SWIFT
  const poolB = BS.patternPoolB || BS.patterns; // HEAVY
  let weightA;
  if(ratio > 0.6) weightA = 0.8;
  else if(ratio > 0.2) weightA = 0.5;
  else weightA = 0.2; // dưới mốc phong ấn (nếu người chơi chọn KHÔNG phong ấn) -> nhóm HEAVY cuồng nộ áp đảo

  const hpUrgency = 1 - ratio; // 0 (đầy máu) -> 1 (gần chết)
  let chainLen = 1;
  const maxLen = poolA.length + poolB.length;
  for(let i=0; i<maxLen-1; i++){
    if(Math.random() < 0.12 + hpUrgency*0.5) chainLen++;
    else break;
  }
  chainLen = Math.min(chainLen, maxLen);

  const chain = [];
  for(let i=0;i<chainLen;i++){
    const pool = Math.random() < weightA ? poolA : poolB;
    chain.push(pick(pool));
  }
  return chain;
}

/* ---- Lượt của boss: chạy lần lượt từng pattern trong chuỗi (bullet-hell nối liền nhau) ---- */
function bossTurn(staggered){
  if(BS.boss.stunned){
    addBattleLog(BS.bossName+' bị choáng, không thể ra đòn lượt này.','skill');
    endRound();
    return;
  }
  if(staggered){
    endRound();
    return;
  }
  const chain = (BS.chainSelector || chooseBossPatternChain)(BS.turn);
  if(chain.length > 1){
    const isFinal = BS.turn >= BS.maxTurn;
    addBattleLog((isFinal ? BS.bossName+' GIÃY GIỤA TRONG TUYỆT VỌNG — DỒN TOÀN BỘ SỨC TÀN, NỐI LIỀN CẢ '+chain.length+' CHIÊU THỨC THÀNH 1 CHUỖI ĐÒN CUỐI CÙNG: '
      : BS.bossName+' nối liền '+chain.length+' chiêu thức thành 1 CHUỖI ĐÒN DÀI: ')+chain.map(p=>p.name).join(' → '),'danger');
  }
  runBossChain(chain, 0, 0);
}

/* Tỉ lệ sát thương PHẢI NHẬN khi chỉ "ĐỠ ĐƯỢC" (bấm đúng hướng nhưng ngoài vùng sáng): đỡ 50%.
   PARRY (trong vùng sáng) = đỡ 100% (nhận 0). TRÚNG ĐÒN = nhận 100%. */
const BLOCK_DAMAGE_RATIO = 0.5;

/* Chạy từng pattern trong chuỗi nối tiếp nhau, cộng dồn sát thương của cả chuỗi lại
   rồi mới áp dụng 1 lần lên party khi chuỗi kết thúc. */
function runBossChain(chain, idx, totalDmg){
  if(idx >= chain.length){
    applyBossChainDamage(totalDmg);
    return;
  }
  const pattern = chain[idx];
  document.getElementById('bossPatternTag').textContent = '⚠ '+pattern.name + (chain.length>1 ? ' ('+(idx+1)+'/'+chain.length+')' : '');
  addBattleLog((idx===0 ? BS.bossName+' tung chiêu: ' : '...nối liền chiêu tiếp theo: ')+pattern.name+' — '+pattern.desc, 'danger');
  runDodgePhase(pattern, (res)=>{
    // res = {hits, blocked, perfect} từ QTE phòng thủ (vẫn chấp nhận số nguyên cũ = chỉ có hits).
    // PARRY = đỡ 100% (0 sát thương) | ĐỠ ĐƯỢC = chỉ đỡ 50% | TRÚNG ĐÒN = nhận đủ 100%.
    const hits = (typeof res==='number') ? res : (res.hits||0);
    const blocked = (typeof res==='number') ? 0 : (res.blocked||0);
    let segDmg = 0;
    for(let i=0;i<blocked;i++) segDmg += Math.round(rand(pattern.dmg[0], pattern.dmg[1]) * BLOCK_DAMAGE_RATIO);
    if(hits>0){
      for(let i=0;i<hits;i++) segDmg += Math.round(rand(pattern.dmg[0], pattern.dmg[1]));
      // Phi Tiêu Độc: mỗi lần trúng đòn thuộc pattern có tag "poison" cộng dồn 1 stack,
      // gây thêm sát thương DoT vào cuối lượt boss (xem applyBossChainDamage()).
      if(pattern.poison) BS.poisonStacks = (BS.poisonStacks||0) + hits;
      // Khiên Đất: pattern không tấn công, chỉ dựng khiên -> không tính là "hits" gây thương thật
      if(pattern.shieldSelf){ BS.boss.shielded = true; segDmg = 0; }
    }
    else if(blocked===0) addBattleLog((BS.souls ? 'Kim Kiếm La Peace' : 'Linh hồn hợp nhất')+' đỡ trọn chiêu "'+pattern.name+'"!', 'warn');
    const gap = chain.length>1 ? 260 : 0; // khoảng nghỉ ngắn giữa các đòn trong chuỗi
    setTimeout(()=>{ runBossChain(chain, idx+1, totalDmg+segDmg); }, gap);
  });
}

function applyBossChainDamage(totalDmg){
  const tauntKey = BS.order.find(k=>BS.party[k].taunting && BS.party[k].hp>0);
  const targets = tauntKey ? [tauntKey] : BS.order.filter(k=>BS.party[k].hp>0);

  // Phi Tiêu Độc: DoT cộng dồn từ các stack trúng độc, cộng thêm vào tổng sát thương
  // của lượt này rồi RESET stack (độc phát tác dồn một lần, không kéo dài vô hạn).
  if(BS.poisonStacks>0){
    const poisonDmg = BS.poisonStacks*4;
    addBattleLog('Chất độc từ Phi Tiêu ngấm vào — cộng thêm '+poisonDmg+' sát thương!','dmg');
    totalDmg += poisonDmg;
    BS.poisonStacks = 0;
  }

  // NÂNG CẤP ACT (undertaleMode): Chế nhạo/Trấn an tích luỹ thành BS.bossDmgMult, áp dụng lên
  // TOÀN BỘ sát thương của lượt boss này (kể cả DoT độc vừa cộng ở trên).
  if(BS.bossDmgMult && BS.bossDmgMult !== 1){
    totalDmg = Math.round(totalDmg * BS.bossDmgMult);
  }

  if(totalDmg<=0){
    addBattleLog('Cả chuỗi đòn bị đỡ trọn vẹn — không ai bị thương!','warn');
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

/* ==============================================================
   COMBAT KIỂU FINAL FANTASY CỔ ĐIỂN + QTE MŨI TÊN
   --------------------------------------------------------------
   Thay thế hoàn toàn pha BULLET-HELL (runDodgePhaseLegacy bên dưới giữ lại để tham khảo, không
   còn được gọi). Một engine QTE (runArrowQte) dùng cho 2 trường hợp:
     1) KỸ NĂNG của party (Kỹ năng / ACT / Ultimate): Tấn công thường KHÔNG có QTE. Mỗi nhân vật
        có số mũi tên theo độ phức tạp kỹ năng (SKILL_QTE_COUNT): BẠN 5, WIBU 3, LÍNH 4.
        Độ chính xác (0-1) quyết định kỹ năng thành công/mạnh cỡ nào (xem skillScale()).
     2) PHÒNG THỦ (lượt boss): mỗi chiêu của boss có độ phức tạp NGẪU NHIÊN 1-7 mũi tên.
          - Bấm đúng hướng trong "CỬA SỔ PARRY" (đoạn sáng trên thanh thời gian) = PARRY (đỡ 100%)
          - Bấm đúng hướng ngoài cửa sổ nhưng còn kịp                              = ĐỠ ĐƯỢC (chỉ đỡ 50%)
          - Bấm sai / hết giờ                                                      = TRÚNG ĐÒN
        Độ khó (0-1) tăng theo lượt và độ phức tạp chiêu, làm: cửa sổ parry HẸP dần, DỊCH CHUYỂN
        ngẫu nhiên mỗi cú (và trôi dọc thanh ở độ khó cao), mũi tên RUNG LẮC mạnh hơn.
        Một số chiêu còn có FEINT: mũi tên đổi hướng giữa chừng.
   runDodgePhase(pattern, cb) gọi cb({hits, blocked, perfect}) — runBossChain tính sát thương:
         parry 0%, đỡ được 50%, trúng đòn 100% (xem BLOCK_DAMAGE_RATIO).
   ============================================================== */
const QTE_KEYMAP = {
  ArrowUp:'ArrowUp', ArrowDown:'ArrowDown', ArrowLeft:'ArrowLeft', ArrowRight:'ArrowRight',
  w:'ArrowUp', s:'ArrowDown', a:'ArrowLeft', d:'ArrowRight',
  W:'ArrowUp', S:'ArrowDown', A:'ArrowLeft', D:'ArrowRight'
};
// Số mũi tên QTE của kỹ năng theo độ phức tạp từng nhân vật
const SKILL_QTE_COUNT = { YOU:5, WIBU:3, LINH:4 };
const SKILL_ACTIONS = ['skill','act_taunt','act_reassure','ultimate'];
// Chiêu hay "lừa" bằng feint / chiêu nhanh (cửa sổ thời gian hẹp hơn)
const QTE_FEINT_TYPES = ['acceldash','ambush','uxbounce','dart','swarm','combo','wave','orbit'];
const QTE_FAST_TYPES = ['sweep','judgement','acceldash','dart','charge','uxblaster','uxlinear'];

let QTE = null; // trạng thái QTE đang chạy (null = không có)

/* Hệ số hiệu lực kỹ năng theo độ chính xác QTE: 0.4 (vừa đủ) -> 1.0 (hoàn hảo) -> 1.2 (toàn PARRY).
   Dưới 40% chính xác = kỹ năng THẤT BẠI (xem skillFailed()). */
function skillFailed(st){ return st.skillQ && st.skillQ.accuracy < 0.4; }
function skillScale(st){
  if(!st.skillQ) return 1;
  const q = st.skillQ;
  return 0.4 + 0.6*q.accuracy + (q.perfect===q.total ? 0.2 : 0);
}

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
function runDodgePhase(pattern, cb){
  const turn = BS ? BS.turn : 1;
  const soften = BS ? (BS.dodgeSoften||0) : 0; // số đòn Tấn công ở lượt trước -> thời gian bấm rộng hơn
  const complexity = 1 + Math.floor(Math.random()*7); // 1..7
  // Độ khó 0-1: tăng theo lượt và theo độ phức tạp của chính chiêu này
  const difficulty = clamp((turn-1)*0.05 + (complexity-1)*0.07, 0, 1);
  let windowMs = 1500 - Math.round(difficulty*420);
  windowMs *= (1 + Math.min(0.3, soften*0.1));
  if(QTE_FAST_TYPES.includes(pattern.bulletType)) windowMs *= 0.82;
  if(pattern.bulletType==='quake' || pattern.bulletType==='pillar') windowMs *= 1.12;
  windowMs = clamp(windowMs, 620, 1900);
  const parryWidth = 0.34 - difficulty*0.2;            // 0.34 -> 0.14: cửa sổ parry hẹp dần
  const shake = Math.round(difficulty*11);             // 0 -> 11px: mũi tên rung lắc mạnh dần
  const drift = difficulty > 0.35 ? (difficulty-0.35)*0.5 : 0; // cửa sổ parry bắt đầu trôi khi đủ khó
  const feintChance = QTE_FEINT_TYPES.includes(pattern.bulletType) ? (0.25 + Math.min(0.2,(turn-1)*0.015)) : 0;
  const who = BS && BS.souls ? 'Kim Kiếm La Peace' : (BS && BS.order.length>1 ? 'Cả đội' : 'Bạn');
  runArrowQte({
    mode:'defend',
    title:'⚠ '+pattern.name+' — ĐỘ PHỨC TẠP '+complexity+'/7',
    subtitle:pattern.desc+'<br><b>Bấm đúng hướng để ĐỠ (chỉ giảm 50% sát thương); bấm trong vùng sáng để PARRY (đỡ 100%)!</b> ('+who+')',
    count:complexity, windowMs, feintChance, parryWidth, shake, drift,
    onDone:(r)=>{
      if(r.hits===0 && r.blocked===0 && r.perfect>0) addBattleLog('PARRY x'+r.perfect+' — '+who+' đỡ 100% chiêu "'+pattern.name+'" (độ phức tạp '+complexity+')!','good');
      else if(r.blocked>0) addBattleLog('Chỉ ĐỠ ĐƯỢC '+r.blocked+' mũi tên (không parry kịp) — chỉ giảm 50% sát thương của chúng'+(r.perfect>0 ? ', '+r.perfect+' mũi tên PARRY hoàn toàn' : '')+'.','warn');
      cb({hits:r.hits, blocked:r.blocked, perfect:r.perfect});
    }
  });
}

/* ---- KỸ NĂNG: QTE số mũi tên theo nhân vật (BẠN 5 / WIBU 3 / LÍNH 4). Đòn đánh thường KHÔNG qua đây. ---- */
function runSkillQte(key, label, cb){
  const def = PARTY_DEF[key];
  const count = SKILL_QTE_COUNT[key] || 3;
  let windowMs = 1500 - (count-3)*60;
  if(BS.willBuffActive) windowMs *= 1.12;
  runArrowQte({
    mode:'attack',
    title:'✦ '+label.toUpperCase()+' — '+count+' MŨI TÊN',
    subtitle:def.name+' niệm chú: bấm đúng chuỗi mũi tên! Dưới 40% chính xác, kỹ năng thất bại.',
    count, windowMs, feintChance:0, parryWidth:0.5, shake:0, drift:0,
    onDone:(r)=> cb(r)
  });
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

function runDodgePhaseLegacy(pattern, cb){ // (bullet-hell cũ — không còn được gọi)
  const arena = document.getElementById('dodgeArena');
  const box = document.getElementById('dodgeBox');
  const soul = document.getElementById('soulCircle');
  box.querySelectorAll('.dbullet').forEach(b=>b.remove());
  arena.classList.remove('hidden');
  document.getElementById('dodgeHitNum').textContent = '0';

  const rect = {w: box.clientWidth || 620, h: box.clientHeight || 440};
  const soulR = 8;
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
    // (khung né đã được phóng to hơn bản gốc nên tăng tốc độ theo tỉ lệ để giữ cảm giác né tương tự)
    const speed = 0.34; // px/ms
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
      if(!b.laser && !b.hazard) b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
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
    burst: genBurstQueue, cross: genCrossQueue,
    dart: genDartQueue, pillar: genPillarQueue, swarm: genSwarmQueue,
    ambush: genAmbushQueue, quake: genQuakeQueue, charge: genChargeQueue, shield: genShieldQueue,
    straight: genStraightQueue, wave: genWaveQueue, acceldash: genAccelDashQueue, combo: genComboSpiralWaveQueue,
    uxlinear: genUxLinearQueue, uxblaster: genUxBlasterQueue, uxbounce: genUxBounceQueue,
    orbit: genOrbitQueue, judgement: genJudgementQueue,
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
/* NÂNG CẤP — Đạn xoắn ốc (Spiral) đúng kiểu bullet-hell: thay vì bắn cả cụm đạn cùng lúc,
   ta bắn TỪNG VIÊN MỘT theo nhịp thời gian đều đặn, và sau mỗi viên lại CỘNG DỒN thêm 1 góc
   cố định (angStep, mặc định +12°) vào hướng bắn của viên tiếp theo — quỹ đạo tổng thể của
   cả chuỗi đạn sẽ tự vẽ ra hình xoắn ốc lan dần ra khỏi tâm. opts cho phép tuỳ biến số "cánh"
   xoắn (armCount — bắn armCount viên đối xứng đều 360° quanh tâm mỗi nhịp, mặc định 2 cánh
   để giữ độ dày hình ảnh như bản gốc), tốc độ, góc bắt đầu... dùng lại được cho pattern COMBO. */
function genSpiralQueue(rect, duration, density, opts){
  opts = opts || {};
  const q=[]; let t = opts.startDelay!=null ? opts.startDelay : 150;
  let ang = opts.startAngle!=null ? opts.startAngle : Math.random()*360;
  const cx=rect.w/2, cy=rect.h/2;
  const angStep = opts.angStep!=null ? opts.angStep : 12;       // độ tăng cố định sau MỖI VIÊN đạn
  const armCount = opts.armCount!=null ? opts.armCount : 2;     // số viên bắn đối xứng mỗi nhịp
  const speed = opts.speed!=null ? opts.speed : 0.1;
  const fireInterval = (opts.fireInterval!=null ? opts.fireInterval : 90) * density;
  while(t < duration-300){
    for(let i=0;i<armCount;i++){
      q.push({t, kind:'radial', cx, cy, ang: ang + (360/armCount)*i, speed,
        accelAfter: opts.accelAfter, accelMul: opts.accelMul});
    }
    ang += angStep; // liên tục cộng thêm góc cố định -> tạo quỹ đạo xoắn ốc
    t += fireInterval;
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

/* ============== NÂNG CẤP BULLET PATTERN ==============
   4 kỹ thuật mới: (1) bắn thẳng đơn giản — dùng cho State Machine ở pha đầu trận; (2) đạn
   lượn sóng — cộng Math.sin() theo thời gian vào trục vuông góc với hướng bay; (3) đạn thay
   đổi gia tốc — xuất phát chậm rồi nhân vọt vận tốc sau 1 khoảng thời gian ngắn; (4) pattern
   COMBO ghép chung xoắn ốc + sóng truy sát, dùng riêng cho trạng thái 'COMBINED' của State
   Machine (xem applyHpStateMachine ở phần Boss Battle). ---- */

/* Đạn thẳng cơ bản: rơi thẳng đứng từ trên xuống với tốc độ không đổi, không nhắm, không gia
   tốc — dùng làm pattern "khởi động" dễ nhất trước khi boss lộ chiêu kết hợp. */
function genStraightQueue(rect, duration, density){
  const q=[]; let t=300;
  while(t < duration-400){
    const x = 20 + Math.random()*(rect.w-40);
    q.push({t, kind:'fall', x, speed:0.09});
    t += 700*density;
  }
  return q;
}

/* Đạn lượn sóng: bắn từ rìa màn hình, mặc định NHẮM THẲNG vào vị trí linh hồn ngay lúc phóng
   ra (giống 'aimed'/dart) nhưng trên đường bay còn CỘNG THÊM dao động hình sin theo trục
   vuông góc với hướng bay — quỹ đạo uốn lượn khó đoán dù điểm khởi đầu là một đường thẳng. */
function genWaveQueue(rect, duration, density, opts){
  opts = opts || {};
  const q=[]; let t = opts.startDelay!=null ? opts.startDelay : 500;
  const interval = (opts.fireInterval!=null ? opts.fireInterval : 850) * density;
  while(t < duration-500){
    const fromTop = Math.random()<0.5;
    const cx = fromTop ? Math.random()*rect.w : (Math.random()<0.5?-10:rect.w+10);
    const cy = fromTop ? -10 : Math.random()*rect.h;
    q.push({t, kind:'wave', cx, cy,
      aimAtPlayer: opts.aimAtPlayer!==false,
      speed: opts.speed!=null ? opts.speed : 0.1,
      waveAmp: opts.waveAmp!=null ? opts.waveAmp : 26,
      waveFreq: opts.waveFreq!=null ? opts.waveFreq : 0.0065,
      accelAfter: opts.accelAfter, accelMul: opts.accelMul});
    t += interval;
  }
  return q;
}

/* Đạn thay đổi gia tốc: bắn thẳng nhắm vào vị trí lúc phóng ra (giống dart) nhưng khởi đầu
   RẤT CHẬM (speed thấp), rồi sau accelAfter mili-giây thì bất ngờ NHÂN vận tốc lên accelMul
   lần — người chơi dễ chủ quan tưởng đạn chậm, đến khi nó vọt tốc thì có thể đã trễ nhịp né. */
function genAccelDashQueue(rect, duration, density){
  const q=[]; let t=350;
  while(t < duration-500){
    const fromTop = Math.random()<0.5;
    const cx = fromTop ? Math.random()*rect.w : (Math.random()<0.5?-10:rect.w+10);
    const cy = fromTop ? -10 : Math.random()*rect.h;
    q.push({t, kind:'aimed', cx, cy, speed:0.05, accelAfter:600, accelMul:3.2});
    t += 950*density;
  }
  return q;
}

/* Pattern COMBO cho State Machine: ghép chung 1 chuỗi xoắn ốc (từ tâm, cộng dồn góc liên
   tục) VÀ 1 chuỗi sóng truy sát (nhắm thẳng người chơi) diễn ra ĐỒNG THỜI, sắp xếp lại theo
   mốc thời gian bắn để 2 chuỗi đan xen nhau trong cùng 1 lượt né. */
function genComboSpiralWaveQueue(rect, duration, density){
  const spiral = genSpiralQueue(rect, duration, density, {angStep:14, fireInterval:85, speed:0.115, armCount:2});
  const wave = genWaveQueue(rect, duration, density, {fireInterval:900, waveAmp:22, speed:0.11});
  return spiral.concat(wave).sort((a,b)=>a.t-b.t);
}

/* ============== ĐÊM 3 — CÁC LOẠI ĐẠN MỚI CHO TRỌNG "THE GRIMOIRE" ==============
   Các loại đạn riêng của Trọng: nhóm nhanh/dồn dập (SWIFT) và nhóm chậm/cực nặng (HEAVY).
   Xem BOSS_PATTERNS_TRONG. */

/* PHI TIÊU ĐỘC: đạn bay thẳng từ mép màn hình, nhắm về ĐÚNG vị trí linh hồn tại
   thời điểm phóng ra (không tự bám đuổi sau đó) — một cú ném có chủ đích, vẫn né được nếu
   phản xạ kịp. Gắn cờ 'poison' ở cấp pattern (xem BOSS_PATTERNS_TRONG) để cộng dồn DoT. */
function genDartQueue(rect, duration, density){
  const q=[]; let t=350;
  while(t < duration-500){
    const fromTop = Math.random()<0.5;
    const cx = fromTop ? Math.random()*rect.w : (Math.random()<0.5?-10:rect.w+10);
    const cy = fromTop ? -10 : Math.random()*rect.h;
    q.push({t, kind:'aimed', cx, cy, speed:0.155});
    t += 900*density;
  }
  return q;
}
/* BẮN TỈA TỨ GÓC: bắn từ 4 góc cố định hướng về tâm, đều đặn
   và có thể đoán trước hơn hẳn Phi Tiêu — bù lại bắn theo nhịp dồn dập từ nhiều cột cùng lúc. */
function genPillarQueue(rect, duration, density){
  const q=[]; let t=300;
  const corners = [{x:14,y:14},{x:rect.w-14,y:14},{x:14,y:rect.h-14},{x:rect.w-14,y:rect.h-14}];
  const cx=rect.w/2, cy=rect.h/2;
  while(t < duration-450){
    corners.forEach(c=>{
      const ang = Math.atan2(cy-c.y, cx-c.x)*180/Math.PI + (Math.random()*30-15);
      q.push({t, kind:'radial', cx:c.x, cy:c.y, ang, speed:0.14});
    });
    t += 680*density;
  }
  return q;
}
/* BÓNG ĐEN TẢN LOẠN: rất nhiều đạn nhỏ, yếu nhưng hỗn loạn (di chuyển lắc nhẹ ngẫu nhiên
   mỗi khung hình — xem cờ jitter trong updateDodgeBullet) từ khắp các cạnh màn hình. */
function genSwarmQueue(rect, duration, density){
  const q=[]; let t=300;
  while(t < duration-500){
    const n = 5 + Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const edge = Math.floor(Math.random()*4);
      const offset = Math.random();
      q.push({t, kind:'edge', edge, offset, speed:0.11+Math.random()*0.05, jitter:true});
    }
    t += 340*density;
  }
  return q;
}
/* TÀNG HÌNH ĐÁNH LÉN: một vòng đạn bất ngờ bung ra NGAY QUANH vị trí linh hồn hiện
   tại (bắt sống toạ độ lúc phóng), hội tụ vào tâm — đứng yên là dính chắc, phải NHÚC NHÍCH
   ngay khi thấy "báo động" xuất hiện quanh mình. Tần suất thưa nhưng luôn bất ngờ. */
function genAmbushQueue(rect, duration, density){
  const q=[]; let t=500;
  while(t < duration-600){
    const n = 6;
    for(let i=0;i<n;i++) q.push({t, kind:'ambush', ang:(360/n)*i, speed:0.1});
    t += 1300*density;
  }
  return q;
}
/* ĐẬP BÚA ĐỊA CHẤN: cảnh báo dài (chậm nhưng cực nặng đòn) rồi phủ gần hết
   khung né, chỉ chừa lại 1 vùng an toàn nhỏ — buộc phải áp sát đúng 1 điểm duy nhất. */
function genQuakeQueue(rect, duration, density){
  const q=[]; let t=350;
  while(t < duration-1300){
    const safeX = 40 + Math.random()*(rect.w-80);
    const safeY = 40 + Math.random()*(rect.h-80);
    q.push({t, kind:'quake', safeX, safeY, safeR:44, telegraph:950, active:600});
    t += 1900*density;
  }
  return q;
}
/* XÔNG THẲNG: tái dùng cơ chế "laser" sẵn có nhưng bản RỘNG hơn nhiều + cảnh báo
   dài hơn (chuẩn bị lao thẳng đầy áp lực) — sát thương/lần trúng cao hơn. */
function genChargeQueue(rect, duration, density){
  const q=[]; let t=400;
  while(t < duration-800){
    const horiz = Math.random()<0.5;
    q.push({t, kind:'laser', horiz, pos: 18+Math.random()*((horiz?rect.h:rect.w)-36), telegraph:950, wide:true});
    t += 1700*density;
  }
  return q;
}
/* KHIÊN ĐẤT: KHÔNG tấn công thật (dmg:[0,0] ở cấp pattern) — chỉ vài đạn thưa,
   chậm, mang tính hình ảnh "Trọng đang gồng mình dựng khiên" thay vì đe doạ thực sự. Cờ
   shieldSelf được applyBossChainDamage/runBossChain xử lý để giảm sát thương lượt sau. */
function genShieldQueue(rect, duration, density){
  const q=[]; let t=400;
  const cx=rect.w/2, cy=rect.h/2;
  while(t < duration-600){
    q.push({t, kind:'radial', cx, cy, ang:Math.random()*360, speed:0.05});
    t += 1000*density;
  }
  return q;
}

/* ============== NÂNG CẤP UNDERTALE/DELTARUNE — 3 GENERATOR ĐẠN MỚI ============== */

/* 1) TUYẾN TÍNH — tái dùng cơ chế 'edge' sẵn có (đạn bay thẳng từ 1 cạnh khung né sang phía
   đối diện) nhưng CHỈ dùng 2 trục cố định (edge 0/2 = trên/dưới -> bay DỌC, edge 1/3 =
   trái/phải -> bay NGANG), mỗi đợt tự đổi tốc độ ngẫu nhiên trong 1 khoảng khá rộng để không
   đợt nào giống đợt nào, đúng như yêu cầu "tia đạn ngang dọc, tốc độ khác nhau". */
function genUxLinearQueue(rect, duration, density){
  const q=[]; let t=280; let waveIdx=0;
  while(t < duration-450){
    const vertical = waveIdx%2===0; // xen kẽ từng đợt: 1 đợt dọc, 1 đợt ngang
    const n = 3 + Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const edge = vertical ? (Math.random()<0.5?0:2) : (Math.random()<0.5?1:3);
      const offset = (i+0.5)/n + (Math.random()*0.12-0.06);
      const speed = 0.09 + Math.random()*0.14; // tốc độ khác nhau mỗi viên
      q.push({t: t + i*70, kind:'edge', edge, offset: clamp(offset,0.04,0.96), speed});
    }
    t += 560*density;
    waveIdx++;
  }
  return q;
}

/* 2) GASTER BLASTER STYLE — 1 cặp tia laser (ngang + dọc) KHOÁ vào đúng vị trí linh hồn TẠI
   THỜI ĐIỂM PHÓNG RA (không phải lúc lên lịch trước), cảnh báo đúng ~1 giây rồi bắn thật —
   tạo cảm giác "cỗ súng phán xét" nhắm bạn rồi mới nhả đạn, giống Gaster Blaster/Karma. Cờ
   lockToPlayer=true được đọc trong spawnDodgeBullet() để lấy DZ.x/DZ.y NGAY LÚC SPAWN. */
function genUxBlasterQueue(rect, duration, density){
  const q=[]; let t=350;
  while(t < duration-1400){
    q.push({t, kind:'laser', horiz:true,  lockToPlayer:true, telegraph:1000, wide:true});
    q.push({t: t+120, kind:'laser', horiz:false, lockToPlayer:true, telegraph:1000, wide:true});
    t += 2100*density;
  }
  return q;
}

/* 3) HỖN LOẠN DỘI TƯỜNG (Jevil/Spamton style) — đạn xuất phát từ mép ngẫu nhiên với hướng bay
   ngẫu nhiên, KHÔNG biến mất khi chạm cạnh khung né mà NẢY DỘI lại (phản xạ vận tốc) — xem cờ
   'bounce' được xử lý riêng trong updateDodgeBullet(). Càng về cuối pattern càng dồn dập. */
function genUxBounceQueue(rect, duration, density){
  const q=[]; let t=260;
  while(t < duration-700){
    const n = 2 + Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){
      const fromEdge = Math.floor(Math.random()*4);
      let x,y;
      if(fromEdge===0){ x=Math.random()*rect.w; y=8; }
      else if(fromEdge===1){ x=rect.w-8; y=Math.random()*rect.h; }
      else if(fromEdge===2){ x=Math.random()*rect.w; y=rect.h-8; }
      else { x=8; y=Math.random()*rect.h; }
      const ang = Math.random()*360;
      q.push({t, kind:'bounce', x, y, ang, speed:0.1+Math.random()*0.06});
    }
    t += 480*density;
  }
  return q;
}

/* ============== 2 PATTERN LẤY CẢM HỨNG TỪ UNDERTALE/DELTARUNE ==============
   Mượn tinh thần thiết kế (không sao chép asset/hình ảnh gốc) từ The Knight (Deltarune) và
   nhịp độ dồn dập kiểu "Hammer of Justice" (Undyne). Các pattern dạng TƯỜNG (Bức Tường Xương
   kiểu Sans, Triều Lửa kiểu Asgore) đã được gỡ bỏ theo yêu cầu. */

/* 1) THE KNIGHT (Deltarune) — LƯỠI KIẾM XOAY TÍT: từng chùm lưỡi kiếm bắn ra rồi XOAY QUANH
   TÂM khung né (thay vì bay thẳng ra như 'spiral' cũ) trong khi bán kính quỹ đạo tăng dần —
   tạo cảm giác một vòng xoáy lưỡi kiếm mở rộng dần ra khắp trận địa, đúng chất "cơn lốc kiếm"
   của The Knight. Tốc độ xoay tăng dần theo thời gian trong cùng 1 pattern để dồn ép người chơi. */
function genOrbitQueue(rect, duration, density){
  const q=[]; let t=300;
  const cx=rect.w/2, cy=rect.h/2;
  const armCount = 3;
  let baseAngle = Math.random()*360;
  let wave=0;
  while(t < duration-500){
    const spinDir = wave%2===0 ? 1 : -1; // đổi chiều xoay theo từng đợt cho khó đoán hơn
    for(let i=0;i<armCount;i++){
      q.push({t, kind:'orbit', cx, cy, angle: baseAngle+(360/armCount)*i,
        radius: 18, angularSpeed: (0.0026 + Math.min(0.0018, wave*0.00012))*spinDir,
        radiusGrowth: 0.05, life: 2600});
    }
    baseAngle += 33;
    t += 300*density;
    wave++;
  }
  return q;
}

/* 2) "HAMMER OF JUSTICE" (nhịp độ kiểu Undyne) — BÚA CÔNG LÝ: tái dùng cơ chế 'laser' dọc sẵn
   có nhưng bắn thành CỤM 4-6 mũi giáo liên tiếp cực nhanh (telegraph rút ngắn còn ~1/3 so với
   pattern thường) ở nhiều vị trí X ngẫu nhiên cùng lúc — tạo cảm giác dồn dập, gấp gáp không
   kịp thở đúng tinh thần các đợt giáo phán xét dồn dập của Undyne. */
function genJudgementQueue(rect, duration, density){
  const q=[]; let t=380;
  while(t < duration-550){
    const n = 4 + Math.floor(Math.random()*3);
    const positions = [];
    for(let i=0;i<n;i++) positions.push(20+Math.random()*(rect.w-40));
    positions.sort((a,b)=>a-b);
    positions.forEach((pos,i)=>{
      q.push({t: t+i*70, kind:'laser', horiz:false, pos, telegraph:360});
    });
    t += 820*density;
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
    if(ev.jitter){ el.classList.add('swarm'); b.jitter = true; }
    if(ev.accelAfter!=null){ b.accelAfter = ev.accelAfter; b.accelMul = ev.accelMul||2; }
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
    if(ev.jitter){ el.classList.add('swarm'); b.jitter = true; }
    if(ev.accelAfter!=null){ b.accelAfter = ev.accelAfter; b.accelMul = ev.accelMul||2; }
  } else if(ev.kind==='aimed'){
    // Phi Tiêu Độc: nhắm thẳng vào vị trí linh hồn NGAY LÚC PHÓNG ra khỏi tay.
    el.className = 'dbullet t-dart';
    const dx = DZ.x - ev.cx, dy = DZ.y - ev.cy;
    const dist = Math.hypot(dx,dy) || 1;
    b.x = ev.cx; b.y = ev.cy; b.vx = (dx/dist)*ev.speed*sf; b.vy = (dy/dist)*ev.speed*sf; b.r=6;
    // NÂNG CẤP — Đạn thay đổi gia tốc: nếu pattern đặt accelAfter, đạn xuất phát với vận tốc
    // hiện tại (thường đặt thấp ở nơi gọi), sau accelAfter (ms) sẽ NHÂN vọt lên accelMul lần
    // (xem xử lý 1 lần trong updateDodgeBullet) — tạo yếu tố bất ngờ giữa chừng cú bay.
    if(ev.accelAfter!=null){ b.accelAfter = ev.accelAfter; b.accelMul = ev.accelMul||2; }
  } else if(ev.kind==='wave'){
    // NÂNG CẤP — Đạn lượn sóng: hướng bay chính có thể nhắm thẳng vào linh hồn NGAY LÚC PHÓNG
    // (giống 'aimed') hoặc theo góc cố định ev.ang; trên đường bay, vị trí thực tế còn được
    // cộng thêm độ lệch Math.sin(thời gian * tần số) theo trục VUÔNG GÓC với hướng bay, khiến
    // quỹ đạo uốn lượn khó đoán dù xuất phát là một đường thẳng nhắm chính xác.
    el.className = 'dbullet t-wave';
    let dirX, dirY;
    if(ev.aimAtPlayer){
      const dx = DZ.x - ev.cx, dy = DZ.y - ev.cy;
      const dist = Math.hypot(dx,dy) || 1;
      dirX = dx/dist; dirY = dy/dist;
    } else {
      const rad = (ev.ang||0)*Math.PI/180;
      dirX = Math.cos(rad); dirY = Math.sin(rad);
    }
    b.wave = true;
    b.originX = ev.cx; b.originY = ev.cy;
    b.dirX = dirX; b.dirY = dirY;
    b.perpX = -dirY; b.perpY = dirX; // vector vuông góc với hướng bay -> trục để lượn sóng
    b.waveSpeed = (ev.speed!=null ? ev.speed : 0.1) * sf;
    b.waveFreq = ev.waveFreq!=null ? ev.waveFreq : 0.0065;
    b.waveAmp = ev.waveAmp!=null ? ev.waveAmp : 26;
    b.wavePhase = Math.random()*Math.PI*2;
    b.x = ev.cx; b.y = ev.cy; b.r = 6;
    if(ev.accelAfter!=null){ b.accelAfter = ev.accelAfter; b.accelMul = ev.accelMul||2; }
  } else if(ev.kind==='ambush'){
    // Tàng Hình: vòng đạn bung ra QUANH vị trí linh hồn hiện tại, hội tụ ngược vào chính điểm đó.
    el.className = 'dbullet t-radial ambush';
    const rad = ev.ang*Math.PI/180;
    const ringR = 46;
    const originX = DZ.x + Math.cos(rad)*ringR;
    const originY = DZ.y + Math.sin(rad)*ringR;
    b.x = originX; b.y = originY;
    b.vx = -Math.cos(rad)*ev.speed*sf; b.vy = -Math.sin(rad)*ev.speed*sf; b.r=6;
  } else if(ev.kind==='quake'){
    // Đập Búa Địa Chấn: hazard phủ toàn bộ khung né trừ 1 vùng an toàn nhỏ.
    el.className = 'dbullet t-quake telegraph';
    el.style.setProperty('--safe-x', ev.safeX+'px');
    el.style.setProperty('--safe-y', ev.safeY+'px');
    el.style.setProperty('--safe-r', ev.safeR+'px');
    b.hazard = true; b.safeX = ev.safeX; b.safeY = ev.safeY; b.safeR = ev.safeR;
    b.age = -ev.telegraph; b.life = ev.telegraph + ev.active;
  } else if(ev.kind==='laser'){
    // đòn Tấn công lượt trước cũng kéo dài thời gian cảnh báo (telegraph) của tia quét,
    // cho người chơi nhiều thời gian phản ứng hơn.
    const telegraph = (ev.telegraph||500) / sf;
    // NÂNG CẤP Gaster Blaster (uxblaster): lockToPlayer -> chốt vị trí NGAY LÚC PHÓNG (thời
    // điểm spawnDodgeBullet được gọi), không dùng ev.pos đã định sẵn từ lúc lên lịch trước.
    const pos = ev.lockToPlayer ? (ev.horiz ? DZ.y : DZ.x) : ev.pos;
    b.laser = true; b.horiz = ev.horiz; b.pos = pos; b.wide = !!ev.wide;
    b.age = -telegraph; b.life = telegraph + 320;
    el.className = 'dbullet '+(ev.horiz?'t-laser-h':'t-laser-v')+(ev.wide?' wide':'')+' telegraph'+(ev.lockToPlayer?' t-blaster':'');
    if(ev.horiz){ el.style.top = pos+'px'; el.style.left='0'; }
    else { el.style.left = pos+'px'; el.style.top='0'; }
  } else if(ev.kind==='bounce'){
    // NÂNG CẤP Jevil/Spamton — đạn nảy dội (bounce) vào các cạnh khung né thay vì biến mất.
    el.className = 'dbullet t-bounce';
    const rad = ev.ang*Math.PI/180;
    b.x = ev.x; b.y = ev.y; b.vx = Math.cos(rad)*ev.speed*sf; b.vy = Math.sin(rad)*ev.speed*sf; b.r=6;
    b.bounce = true; b.life = 9000; b.bounces = 0;
  } else if(ev.kind==='orbit'){
    // The Knight — Lưỡi Kiếm Xoay Tít: đạn xoay quanh tâm với bán kính tăng dần theo thời gian
    // thay vì bay thẳng ra — quỹ đạo cong thành vòng xoáy mở rộng dần.
    el.className = 'dbullet t-orbit';
    const rad = ev.angle*Math.PI/180;
    b.orbit = true; b.cx = ev.cx; b.cy = ev.cy; b.angle = rad;
    b.angularSpeed = ev.angularSpeed * sf; b.radius = ev.radius; b.radiusGrowth = ev.radiusGrowth*sf;
    b.x = ev.cx + Math.cos(rad)*ev.radius; b.y = ev.cy + Math.sin(rad)*ev.radius; b.r = 6;
    b.life = ev.life || 2600;
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
  if(b.hazard){
    if(b.age >= 0 && b.el.classList.contains('telegraph')){
      b.el.classList.remove('telegraph');
      b.el.classList.add('firing');
    }
    if(b.age > b.life) b.dead = true;
    return;
  }
  if(b.wave){
    // NÂNG CẤP — Đạn lượn sóng: vị trí = điểm xuất phát + quãng đường đã bay theo hướng chính
    // + độ lệch hình sin (theo thời gian) trên trục vuông góc với hướng bay.
    if(b.accelAfter!=null && !b.accelerated && b.age >= b.accelAfter){
      b.waveSpeed *= b.accelMul; b.accelerated = true; b.el.classList.add('accel-burst');
      setTimeout(()=>{ if(b.el) b.el.classList.remove('accel-burst'); }, 340); // chỉ chớp sáng nhất thời, không đè vĩnh viễn lên vòng hào quang t-wave
    }
    const travel = b.waveSpeed*b.age;
    const osc = Math.sin(b.age*b.waveFreq + b.wavePhase) * b.waveAmp;
    b.x = b.originX + b.dirX*travel + b.perpX*osc;
    b.y = b.originY + b.dirY*travel + b.perpY*osc;
    const rectW = DZ.rect;
    if(b.x < -40 || b.x > rectW.w+40 || b.y < -40 || b.y > rectW.h+40) b.dead = true;
    if(b.age > b.life) b.dead = true;
    return;
  }
  if(b.orbit){
    // The Knight — Lưỡi Kiếm Xoay Tít: góc quay liên tục cộng dồn + bán kính tăng dần theo
    // thời gian -> quỹ đạo vẽ ra một vòng xoáy mở rộng dần quanh tâm khung né.
    b.angle += b.angularSpeed*dt;
    b.radius += b.radiusGrowth*dt;
    b.x = b.cx + Math.cos(b.angle)*b.radius;
    b.y = b.cy + Math.sin(b.angle)*b.radius;
    const rect = DZ.rect;
    if(b.x < -40 || b.x > rect.w+40 || b.y < -40 || b.y > rect.h+40) b.dead = true;
    if(b.age > b.life) b.dead = true;
    return;
  }
  if(b.jitter){
    // Bóng Đen Tản Loạn: lắc nhẹ ngẫu nhiên mỗi khung hình, tạo cảm giác di chuyển hỗn loạn/khó đoán.
    b.vx += (Math.random()-0.5)*0.01;
    b.vy += (Math.random()-0.5)*0.01;
  }
  // NÂNG CẤP — Đạn thay đổi gia tốc: áp dụng ĐÚNG 1 LẦN khi đạn đã bay đủ accelAfter (ms) kể
  // từ lúc xuất hiện — nhân thẳng vx/vy hiện tại lên accelMul lần, tạo cú "vọt tốc" bất ngờ
  // giữa chừng quỹ đạo thay vì giữ tốc độ đều từ đầu tới cuối.
  if(b.accelAfter!=null && !b.accelerated && b.age >= b.accelAfter){
    b.vx *= b.accelMul; b.vy *= b.accelMul; b.accelerated = true; b.el.classList.add('accel-burst');
    setTimeout(()=>{ if(b.el) b.el.classList.remove('accel-burst'); }, 340); // chỉ chớp sáng nhất thời
  }
  if(b.bounce){
    // NÂNG CẤP Jevil/Spamton — thay vì bay ra ngoài rồi biến mất, đạn PHẢN XẠ vận tốc khi
    // chạm cạnh khung né (đổi dấu vx/vy tương ứng), tạo quỹ đạo hỗn loạn không thể đoán trước
    // càng lâu càng khó lường. Giới hạn số lần nảy để tránh đạn tồn tại vô hạn (dead sau ~14 lần).
    b.x += b.vx*dt; b.y += b.vy*dt;
    const rect = DZ.rect, r = b.r;
    if(b.x < r){ b.x = r; b.vx = Math.abs(b.vx); b.bounces++; }
    else if(b.x > rect.w-r){ b.x = rect.w-r; b.vx = -Math.abs(b.vx); b.bounces++; }
    if(b.y < r){ b.y = r; b.vy = Math.abs(b.vy); b.bounces++; }
    else if(b.y > rect.h-r){ b.y = rect.h-r; b.vy = -Math.abs(b.vy); b.bounces++; }
    if(b.age > b.life || b.bounces>14) b.dead = true;
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
    const tol = (b.wide ? 32 : 9) + dz.soulR;
    return b.horiz ? Math.abs(dz.y - b.pos) < tol : Math.abs(dz.x - b.pos) < tol;
  }
  if(b.hazard){
    if(b.el.classList.contains('telegraph')) return false; // chỉ đang cảnh báo địa chấn, chưa "nổ" thật
    const distFromSafe = Math.hypot(dz.x-b.safeX, dz.y-b.safeY);
    return distFromSafe > (b.safeR - dz.soulR*0.4); // ra ngoài vùng an toàn = trúng đòn địa chấn
  }
  return Math.hypot(dz.x-b.x, dz.y-b.y) < (b.r + dz.soulR - 1);
}

/* ---- Kết thúc 1 lượt (round) và kiểm tra điều kiện thắng theo mốc 10 lượt ---- */
function endRound(){
  BS.turn++;
  BS.boss.shielded = false; // Khiên Đất chỉ có hiệu lực đúng 1 lượt tấn công của party
  // Mốc "cầm cự đủ N lượt để thắng" CHỈ áp dụng cho boss KHÔNG killable (TIU/Quá Tải Chapter 2).
  // Với boss killable (Trọng — The Grimoire), chiến thắng chỉ đến khi HP thật sự về 0 hoặc qua
  // lựa chọn Phong Ấn — xem resolveRound(). Hết lượt mà chưa hạ được thì trận cứ tiếp diễn.
  if(!BS.killable && BS.turn > BS.maxTurn){ finishBattle(true); return; }
  BS.pickIdx = 0;
  BS.order.forEach(k=>{ BS.party[k].action=null; BS.party[k].skillQ=null; });
  document.getElementById('bossPatternTag').textContent='';
  renderBattle();
  promptNextAction();
}

/* ---- Thắng/thua trận đánh (dùng chung cho trận bí mật Chapter 1 VÀ màn Quá Tải Cầu Dao
   Chapter 2 Đêm 2 — xem opts của startSecretBattle() ở trên) ---- */
function finishBattle(won){
  BS.over = true;
  document.getElementById('battleMenu').innerHTML='';
  stopBattleMusic();
  if(won){
    addBattleLog(BS.victoryShatterMsg,'sys');
    playBossShatterFx(()=>{
      addBattleLog(BS.victoryLightMsg,'sys');
      playWhiteFlashFx(()=>{
        document.getElementById('battleVictoryFx').classList.remove('go');
        document.getElementById('battleOverlay').classList.add('hidden');
        if(BS.onVictory) BS.onVictory();
        else playVN(TRONG_VICTORY_DIALOGUE.lines, ()=>{ triggerSecretEnding(); });
      });
    });
  } else {
    addBattleLog(BS.defeatLogMsg,'danger');
    setTimeout(()=>{
      document.getElementById('battleOverlay').classList.add('hidden');
      if(BS.onDefeat){ BS.onDefeat(); }
      else if(S){
        S.running = false;
        document.getElementById('goSub').textContent = BS.defeatScreenMsg;
        document.getElementById('gameOverScreen').classList.remove('hidden');
      }
    }, 1400);
  }
}

/* ============== ĐÊM 3 — TRẬN ĐÁNH TRỌNG "THE GRIMOIRE" ==============
   Điểm vào duy nhất cho trận đấu này. Người chơi chiến đấu MỘT MÌNH dưới dạng "Souls of the
   Undying One" (order:['YOU'] — khác trận bí mật Chapter 1/màn Quá Tải Chapter 2 vốn dùng cả
   3 người), đúng tinh thần "nhân vật chính tự đánh thức La Peace của bản thân". HP nhân vật
   được nhân hệ số vì không còn WIBU hồi máu hộ. Boss THẬT SỰ có thể bị hạ gục (killable:true),
   và tại đúng mốc 15% HP sẽ dừng lại để hỏi Phong Ấn/Kết Liễu — xem PHẦN thiết kế boss. */
function startTrongCurseOneBattle(){
  startSecretBattle({
    order: ['YOU'],
    partyHpMultiplier: 1.8,
    souls: true,
    killable: true,
    undertaleMode: true,
    bossMaxHp: 700,
    bossName: 'TRỌNG — THE GRIMOIRE',
    bossImage: (typeof TRONG_CURSE_IMAGE !== 'undefined') ? TRONG_CURSE_IMAGE : null,
    musicSrc: (typeof TRONG_CURSE_MUSIC !== 'undefined') ? TRONG_CURSE_MUSIC : null,
    patterns: BOSS_PATTERNS_TRONG,
    patternPoolA: BOSS_PATTERNS_TRONG_SWIFT,   // nhóm SWIFT — áp đảo lúc HP còn cao
    patternPoolB: BOSS_PATTERNS_TRONG_HEAVY, // nhóm HEAVY — áp đảo lúc HP thấp/sau mốc phong ấn
    chainSelector: chooseTrongPatternChain,
    sealThresholdRatio: 0.15,
    onSealChoice: triggerTrongSealChoice,
    introLog: [
      {msg:'Kim Kiếm La Peace trỗi dậy trong bạn — sức mạnh của La Peace hoà cùng ý chí sinh tồn!', cls:''},
      {msg:'TRỌNG — THE GRIMOIRE hiện ra trước mặt, không còn chút gì của người bạn cũ.', cls:'danger'},
      {msg:'Lần này trận chiến có thể thực sự phân thắng bại — nhưng khi dồn được hắn tới đường cùng, hãy cân nhắc thật kỹ trước khi ra đòn cuối.', cls:'warn'},
    ],
    victoryShatterMsg: 'Nhát đánh cuối cùng xuyên qua lớp giáp tà thuật — TRỌNG THE GRIMOIRE gục xuống, ánh sáng đen kịt vụt tắt.',
    victoryLightMsg: 'Không có luồng sáng ấm áp nào cả lần này — chỉ có một khoảng lặng nặng nề bao trùm lấy cả ba.',
    onVictory: ()=>{ playVN(VN_TRONG_BAD_ENDING_DIALOGUE.lines, ()=>{ triggerChapter2BadEnding(); }); },
    defeatLogMsg: 'Kim Kiếm La Peace vụn vỡ... sức mạnh vừa thức tỉnh đã lụi tàn ngay trong trận chiến đầu tiên.',
    defeatScreenMsg: 'TRỌNG — THE GRIMOIRE đã áp đảo hoàn toàn. Có lẽ ý chí thức tỉnh của bạn vẫn chưa đủ mạnh — thử lại lần nữa.',
  });
}

/* Gọi từ resolveRound() khi HP Trọng chạm đúng mốc 15% (chỉ 1 lần/trận — sealChoiceShown).
   Hiển thị VN_TRONG_CURSE_SEAL_PROMPT với lựa chọn nhúng ở dòng cuối; mỗi lựa chọn gắn
   onChoose để đánh dấu route rồi mới chèn tiếp đoạn thoại tương ứng. */
function triggerTrongSealChoice(){
  BS.sealRoute = null;
  const promptLines = VN_TRONG_CURSE_SEAL_PROMPT.lines.map(l=>l);
  const lastIdx = promptLines.length-1;
  promptLines[lastIdx] = Object.assign({}, promptLines[lastIdx], {
    choices: promptLines[lastIdx].choices.map((c,i)=>Object.assign({}, c, {
      insert: i===0 ? VN_TRONG_SEAL_CHOSEN.lines : VN_TRONG_KILL_CHOSEN.lines,
      onChoose: ()=>{ BS.sealRoute = (i===0); }
    }))
  });
  playVN(promptLines, ()=>{
    if(BS.sealRoute){
      finishTrongSealed();
    } else {
      resumeTrongBattleAfterKillChoice();
    }
  });
}

function resumeTrongBattleAfterKillChoice(){
  document.getElementById('battleOverlay').classList.remove('hidden');
  addBattleLog('Trọng hoàn toàn mất kiểm soát — hắn gầm lên trong tuyệt vọng!', 'danger');
  renderBattle();
  setTimeout(()=>{ bossTurn(false); }, 700);
}

/* Kết thúc trận bằng cách PHONG ẤN thay vì hạ gục — KHÔNG đi qua finishBattle() thông thường
   vì đây không phải chiến thắng bằng sát thương. */
function finishTrongSealed(){
  document.getElementById('battleOverlay').classList.add('hidden');
  stopBattleMusic();
  playVN(VN_TRONG_SEALED_ENDING_DIALOGUE.lines, ()=>{ triggerChapter2SealedEnding(); });
}

function triggerChapter2SealedEnding(){
  if(!S) return;
  S.running = false;
  S.endingRoute = 'secret_sealed';
  document.getElementById('winTitle').textContent = '✦ SECRET ENDING — PHONG ẤN ✦';
  document.getElementById('winSub').textContent = 'Mũi kim đã khâu lại những gì bị xé toạc. Quyển sách khép lại, Trọng trở lại là chính mình — và bắt đầu hành trình đi xin lỗi những người hắn đã gieo ấn chú.';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'VỀ MÀN HÌNH CHÍNH';
  nextBtn.onclick = showTitle;
  document.getElementById('winScreen').classList.remove('hidden');
}

function triggerChapter2BadEnding(){
  if(!S) return;
  S.running = false;
  S.endingRoute = 'secret_bad';
  document.getElementById('winTitle').textContent = '☠ BAD ENDING — CÁI GIÁ CỦA CHIẾN THẮNG ☠';
  document.getElementById('winSub').textContent = 'Trọng gục xuống, nhưng thứ ánh sáng cuối cùng của hắn không chịu tan đi — nó vẫn đọng lại trong lòng bàn tay bạn, nặng hơn bạn nghĩ. Cuốn sách trắng đang chờ ai đó viết tiếp.';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'VỀ MÀN HÌNH CHÍNH';
  nextBtn.onclick = showTitle;
  document.getElementById('winScreen').classList.remove('hidden');
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
  document.getElementById('winTitle').textContent = '✦ ĐÊM CUỐI — TẾ LỄ "HOÀN TẤT" ✦';
  document.getElementById('winSub').textContent = 'TIU im bặt, ba mảnh La Peace biến mất trong tay Trọng, và hắn mỉm cười. Chỉ có điều... nụ cười ấy khiến bạn thấy lạnh sống lưng.';
  const nextBtn = document.getElementById('nextNightBtn');
  nextBtn.textContent = 'TIẾP TỤC';
  nextBtn.onclick = ()=>{ document.getElementById('winScreen').classList.add('hidden'); startEpilogue('secret'); };
  document.getElementById('winScreen').classList.remove('hidden');
}

/* ============== FLOW ============== */
function refreshAll(){
  refreshHud(); refreshMap(); refreshActionPane();
}
function beginNight(n, standalone, chapter){
  chapter = chapter || 1;
  if(n===1){
    campaignLaPeace = 0; // mỗi lượt chơi mới (từ Đêm 1) reset lại số La Peace đã nhặt
    campaignNpcTalks = { E: new Set(), B: new Set() }; // ... và reset lại tiến độ tin tưởng NPC
    campaignLoreFound = new Set(); // ... và reset lại các manh mối đã tìm thấy
    campaignCarry = null; // ... và reset lại vật phẩm/linh kiện mang theo qua từng đêm
    campaignSpellMastery = 0;
    trongTrainedForNight = { 1:false, 2:false };
  } else if(standalone){
    // Chơi lẻ từng đêm (KHÔNG tiếp nối chiến dịch) -> luôn học lại phép ấn từ đầu, tránh dùng
    // nhầm tiến độ còn sót lại từ một lượt chơi standalone khác trước đó trong cùng phiên.
    campaignSpellMastery = 0;
    trongTrainedForNight = { 1:false, 2:false };
  }
  S = freshState(n, chapter);
  S.standalone = !!standalone;
  if(chapter===2) S.spellMastery = campaignSpellMastery; // luôn đồng bộ, kể cả khi retry cùng đêm
  // Vật phẩm & linh kiện được giữ lại xuyên suốt các đêm của một lượt chơi thường (không áp
  // dụng cho chế độ chơi lẻ từng đêm qua "CHỌN MÀN", vốn luôn bắt đầu với vật phẩm mặc định).
  if(!S.standalone && campaignCarry){
    S.inventory = Object.assign({}, S.inventory, campaignCarry.inventory);
    S.components = Object.assign({}, S.components, campaignCarry.components);
    // Setup Gauge được mang từ Đêm 1 sang Đêm 2 (Chapter 2 — Phần 5). spellMastery KHÔNG còn
    // lấy từ đây nữa — đã đồng bộ trực tiếp từ campaignSpellMastery ở trên (đúng cho cả retry).
    if(campaignCarry.setupGauge!=null) S.setupGauge = campaignCarry.setupGauge;
  }
  addLog((chapter===2?'[CHAPTER 2] ':'')+'Ca trực '+NIGHT_CFG[n].name+' bắt đầu lúc '+formatClock(0)+'. Bạn xuất phát tại '+ROOM_DEF[S.playerRoom].name+'.','');
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
  refreshBagBadge();
  persistSave();
  // VN_INTRO hiện chỉ có nội dung cho Chapter 1. Chapter 2 có hội thoại mở đầu riêng cho Đêm 1/2
  // (buổi học phép, xem startTrongTrainingSequence) và Đêm 3 (VN_CH2_NIGHT3_INTRO — TRỌNG "The
  // Curse One" đuổi bắt nhân vật chính, xem isTrongChaseNight()).
  if(chapter===1){
    playVN(VN_INTRO[n], ()=>{ maybeAutoTutorial(n, chapter); });
  } else if(chapter===2 && (n===1 || n===2) && !trongTrainedForNight[n]){
    // Buổi học phép 16:30-20:45 với Trọng — CHỈ diễn ra lần đầu tiên đêm đó được bắt đầu trong
    // phiên chơi hiện tại (không replay khi retry sau khi chết giữa đêm). Xem PHẦN 7 design doc.
    startTrongTrainingSequence(n);
  } else if(chapter===2 && n===3){
    playVN(VN_CH2_NIGHT3_INTRO, ()=>{});
  }
}
function hideAllOverlays(){
  ['titleScreen','chapterSelectScreen','chapterIntroScreen','nightSelectScreen','settingsScreen','gameOverScreen','winScreen','chapterEndScreen','chapter2ComingSoonScreen'].forEach(id=>{
    document.getElementById(id).classList.add('hidden');
  });
}
function showTitle(){
  hideAllOverlays();
  document.getElementById('titleScreen').classList.remove('hidden');
  refreshContinueBtn();
}
function refreshContinueBtn(){
  const btn = document.getElementById('continueBtn');
  if(!btn) return;
  btn.classList.toggle('hidden', !hasSaveGame());
}

/* ---- Chapters: Chapter 1 có đầy đủ nội dung câu chuyện. Chapter 2 hiện là bản dựng thử
   dùng lại engine đêm/tòa nhà của Chapter 1 — nội dung phòng ốc/hội thoại riêng và cân bằng
   độ khó chi tiết sẽ được bổ sung/tinh chỉnh sau. Các tính năng độ khó cao (cúp điện/cầu dao,
   thu gom & chế tạo vật phẩm) đã được chuyển hẳn sang đây, xem isHardMode(). ---- */
const CHAPTERS = [
  { id:1, name:'CHAPTER 1', title:'ĐỪNG NGỦ QUÊN Ở UIT', desc:'3 đêm lén ở lại khuôn viên trường để trốn The TIU.', locked:false },
  { id:2, name:'CHAPTER 2', title:'???', desc:'Bản dựng thử — khó hơn: có cúp điện & chế tạo vật phẩm. Chi tiết sẽ được bổ sung sau.', locked:false, requiresCh1:true }
];

/* ---- Panel tóm tắt / hướng dẫn hiện ra khi bắt đầu một chapter ---- */
const CHAPTER_INTRO = {
  1:{
    title:'CHAPTER 1',
    subtitle:'ĐỪNG NGỦ QUÊN Ở UIT',
    html:`<p>Một đêm kì lại <b> bạn mở mắt trong không gian thật yên ắng </b>, nên tối nay bạn đã vô tình ngủ quên ở UIT, mọi chuyện sẽ thật bình thường nếu như không có nó xuất hiện.
    Bạn phải sống sót qua các khu vực: Nhà A, B, C, D, E, Thư viện và Căn tin theo luật chơi mà một thứ sinh vật mang tên the TIU đặt ra.
    Mỗi đêm trôi qua từ 00:00 đến 07:30. Mỗi khu vực sẽ phát sinh sự cố ngẫu nhiên — bỏ lỡ hoặc làm hỏng
    sẽ khiến <b style="color:var(--blood-bright)">The TIU, thứ thực thể sinh ra từ những lỗi bug</b> hoạt động mạnh hơn và dễ phát hiện ra bạn hơn. Nếu bạn đứng cùng tòa với The TIU, bạn sẽ bị jumpscare
    và mất 1 HP. Mất 3 HP là thua. <b>Căn tin chỉ an toàn khi mở cửa</b> (01:00-02:00 &amp; 04:00-05:00) — nán lại đó quá lâu cũng khiến bạn cạn <b>Thể lực</b> và bị đói.
    Khi thanh mức độ hoạt động chạm 100%, <b style="color:var(--blood-bright)">Huyết Nguyệt</b> sẽ kích hoạt và không nơi nào còn an toàn. Hãy để ý các sinh viên khác cũng đang lén ở lại trong khuôn viên — họ có thể giúp bạn.</p>
    <p>Mỗi đêm chia làm 3 giai đoạn: <b>Khởi động</b> (tuần tra, xử lý sự cố nhỏ), rồi <b>Săn đuổi dồn dập</b> về cuối đêm khi The TIU nhanh hơn hẳn. Đừng quên tìm các <b>manh mối</b> ẩn (nhật ký, đĩa ghi âm, mật mã) để hiểu thêm về The TIU.
    Bấm <b>ESC</b> khi đang chơi để mở bảng tạm dừng.</p>`
  },
  2:{
    title:'CHAPTER 2',
    subtitle:'???',
    html:`<p>Chapter 2 dùng lại đúng bản đồ của Chapter 1 nhưng ở <b>độ khó cao</b>: đêm sẽ có thêm <b>biến cố trung tâm</b> — mất điện toàn trường, buộc bạn phải chạy đến <b>Tòa C</b> khởi động lại cầu dao tổng trước khi The TIU lợi dụng bóng tối. Về cuối đêm, một số cửa nối giữa các tòa còn bị <b>khóa ngẫu nhiên</b>.
    Bạn cũng có thể nhặt <b>linh kiện</b> (pin cũ, dây điện, băng keo, ống thép) rải trong các góc tối rồi ghé <b>Bàn chế tạo</b> ở Căn tin để tự chế Camera, Bộ Sập Cầu Dao, Đèn UV hay Bẫy gây nhiễu — những vật phẩm này chỉ có ở Chapter 2.</p>
    <p><b style="color:var(--blood-bright)">Đêm 3</b> đổi hẳn không khí: nếu bạn do dự khi Trọng lộ mặt ở Đêm 2, hắn sẽ nuốt TIU và trở thành <b>TRỌNG — THE GRIMOIRE</b> — kẻ đuổi bắt mới của Đêm 3. Bị tóm đủ 3 lần, có thứ gì đó trong chính bạn sẽ bắt đầu thức dậy, dẫn thẳng vào trận đối đầu cuối cùng.</p>
    <p><b>Chiến đấu</b> theo lượt kiểu Final Fantasy cổ điển, kết hợp QTE: <b>đòn đánh thường</b> không cần QTE, còn <b>kỹ năng</b> yêu cầu bấm chuỗi mũi tên (Bạn 5, Wibu 3, Lính Ngu Lắm 4; dưới 40% chính xác = thất bại). Khi <b>bị đánh</b>, mỗi chiêu của boss có độ phức tạp ngẫu nhiên 1–7 mũi tên: bấm đúng hướng để ĐỠ (chỉ giảm 50% sát thương), bấm trong <b>vùng sáng</b> để PARRY (đỡ 100%). Vùng này hẹp dần, dịch chuyển, mũi tên rung lắc mạnh dần — và có mũi tên <b>đổi hướng</b> giữa chừng.</p>`
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
    const needCh1 = !!ch.requiresCh1 && !isChapter1Cleared();
    const card=document.createElement('div');
    card.className='nightCard chapterCard' + ((ch.locked || needCh1) ? ' locked' : '');
    card.innerHTML = `<b>${ch.name} — ${ch.title}</b><span>${ch.desc}</span>`;
    if(ch.locked){
      card.innerHTML += `<span class="chapterLockedTag">🔒 SẮP RA MẮT</span>`;
    } else if(needCh1){
      card.innerHTML += `<span class="chapterLockedTag">🔒 HOÀN THÀNH CHAPTER 1 ĐỂ MỞ KHÓA</span>`;
    } else {
      card.onclick=()=>{
        showChapterIntro(ch.id, ()=>{
          buildNightSelect(ch.id);
          const titleEl = document.getElementById('nightSelectTitle');
          if(titleEl) titleEl.textContent = 'CHỌN MÀN — '+ch.name;
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
const NIGHT_DESCR_CH2 = {
  1: NIGHT_DESCR[1],
  2: NIGHT_DESCR[2],
  3: "Không còn Wibu, không còn Chàng Lính — chỉ có TRỌNG, THE GRIMOIRE, kẻ đang muốn lấy đi thứ gì đó bên trong bạn."
};
function buildNightSelect(chapter){
  chapter = chapter || 1;
  const wrap = document.getElementById('nightCardWrap');
  wrap.innerHTML='';
  const descMap = chapter===2 ? NIGHT_DESCR_CH2 : NIGHT_DESCR;
  [1,2,3].forEach(n=>{
    const card=document.createElement('div');
    card.className='nightCard';
    card.innerHTML = `<b>${NIGHT_CFG[n].name}</b><span>${descMap[n]}</span>`;
    card.onclick=()=>{ hideAllOverlays(); beginNight(n, true, chapter); };
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

  buildSaveGameSection(wrap);
}

/* ---- Lưu / Tải game (trong CÀI ĐẶT) ---- */
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
    saveBtn.disabled = !S || !S.running;
    const data = readSaveGame();
    if(data && data.state){
      const d = new Date(data.savedAt);
      const nightName = NIGHT_CFG[data.state.night] ? NIGHT_CFG[data.state.night].name : ('Đêm '+data.state.night);
      statusEl.textContent = 'Đã lưu lúc '+d.toLocaleString('vi-VN')+' — '+nightName+', HP '+data.state.hp+'/3.';
      loadBtn.disabled = false;
      delBtn.disabled = false;
    } else {
      statusEl.textContent = 'Chưa có dữ liệu đã lưu.';
      loadBtn.disabled = true;
      delBtn.disabled = true;
    }
  }
  refresh();

  saveBtn.onclick = ()=>{
    if(!S || !S.running) return;
    persistSave();
    addLog('💾 Đã lưu tiến trình game.', '');
    refresh();
  };
  loadBtn.onclick = ()=>{
    const ok = loadGame();
    if(ok) return; // loadGame() đã tự ẩn hết overlay (kể cả màn Cài đặt) và vào lại game
    refresh();
  };
  delBtn.onclick = ()=>{
    deleteSaveGame();
    refresh();
    refreshContinueBtn();
  };
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
  beginNight(S.night, S.standalone, S.chapter); // ⚠ bug cũ: thiếu tham số chapter khiến retry Chapter 2 bị tụt về luật Chapter 1
};
document.getElementById('menuFromGameOver').onclick = showTitle;
document.getElementById('menuFromWin').onclick = showTitle;
document.getElementById('chapterEndMenuBtn').onclick = ()=>{
  if(S){ S.epilogue = false; S.running = false; }
  showTitle();
};
document.getElementById('chapter2ContinueBtn').onclick = ()=>{
  if(S){ S.epilogue = false; S.running = false; }
  startChapter2Opening();
};
document.getElementById('chapter2ComingSoonMenuBtn').onclick = showTitle;

/* ============== PAUSE MENU (ESC) ============== */
function isBlockingOverlayOpen(){
  return ['tutorialLayer','mgModal','mapModal','vnOverlay','jumpscareOverlay','gameOverScreen','winScreen','settingsScreen','battleOverlay','chapterEndScreen','chapter2ComingSoonScreen']
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


document.addEventListener('keydown', (e)=>{
  if(e.key !== 'p' && e.key !== 'P') return;
  if(e.ctrlKey || e.metaKey || e.altKey) return; // tránh trùng với tổ hợp phím khác của trình duyệt/OS
  e.preventDefault();
  if(!S || !S.running) return;
  if(isBlockingOverlayOpen()) return;
  if(BS && !BS.over) return;
  // Phím tắt debug: nhảy thẳng tới boss fight của secret ending — hoạt động cho cả
  // Chapter 1 (trận bí mật Trọng mặc định) LẪN Chapter 2 (trận Trọng "The Grimoire").
  if(S.chapter === 2){
    startTrongCurseOneBattle();
  } else {
    campaignLaPeace = 3;
    startSecretBattle();
  }
});

/* ============== PHÍM TẮT ==============
   J    : tiếp tục hội thoại (sang câu thoại kế tiếp)
   Ctrl : bỏ qua (skip) hội thoại — tua tới hết đoạn, tự dừng nếu gặp câu có lựa chọn
   B    : mở / đóng Túi đồ
   M    : mở / đóng Bản đồ
   Quy tắc chung: không kích hoạt khi đang gõ vào ô nhập liệu; các phím chữ bị bỏ qua nếu đang
   giữ Ctrl/Alt/Meta (tránh đè lên Ctrl+B, Ctrl+M... của trình duyệt); giữ phím không lặp lại
   (tránh lỡ tay trượt qua nhiều câu thoại hoặc đóng/mở liên tục). B/M chỉ MỞ được khi game
   đang chạy, không có overlay/minigame/trận đấu nào khác, không ở menu tạm dừng, và nút HUD
   tương ứng đang hiện & không bị vô hiệu (vd. bản đồ bị khoá khi mất điện). */
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
  const btn = document.getElementById('continueBtn');
  if(!btn) return;
  btn.onclick = ()=>{ loadGame(); };
  refreshContinueBtn();
})();

/* ============== NÚT NỔI KHỞI ĐỘNG LẠI CẦU DAO (blackout, tại Tòa C) ============== */
(function initBreakerFloatBtn(){
  const btn = document.getElementById('breakerFloatBtn');
  if(!btn) return;
  btn.onclick = ()=>{ if(tdActive()) return; if(S && S.playerRoom==='C') startMinigame('C'); };
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

/* ============== HƯỚNG DẪN (TUTORIAL) ==============
   Tour ngắn giới thiệu CƠ CHẾ CHÍNH của Chapter 1 (đồng hồ, HP, TIU, mức độ hoạt động, thể lực,
   di chuyển, sự cố, Căn tin, túi đồ, phím tắt). CỐ Ý không nhắc tới các chi tiết ẩn (La Peace,
   manh mối, NPC, kết thúc bí mật...) để người chơi tự khám phá.
   - Tự chạy 1 lần duy nhất sau hội thoại mở đầu Đêm 1 (cờ lưu ở localStorage).
   - Xem lại bất cứ lúc nào: nút "HƯỚNG DẪN" ở màn hình chính hoặc menu tạm dừng (ESC).
   - Khi mở từ màn hình chính (chưa có ván nào) sẽ chỉ hiện thẻ chữ ở giữa màn hình, không có vùng sáng. */
const TUTORIAL_KEY = 'uit_tutorial_done_v1';
const TUTORIAL_STEPS = [
  { title:'Chào mừng đến ca trực đêm',
    html:`Bạn bị kẹt lại UIT từ <b>00:00 đến 07:30</b>. Mục tiêu duy nhất: <b>sống sót đến sáng</b> và tránh <span class="tutWarn">THE TIU</span>.<br><br>Hướng dẫn này chỉ nói những điều cơ bản — còn lại hãy tự khám phá. Game <b>tạm dừng</b> trong lúc bạn xem.` },
  { title:'Đồng hồ', sel:'#clockVal', block:true,
    html:`Thời gian trôi liên tục, kể cả khi bạn đứng yên. Mỗi lần di chuyển còn tốn thêm <b>10 phút</b>. Sống đến <b>07:30</b> là qua đêm.` },
  { title:'Máu (HP)', sel:'#hpWrap', block:true,
    html:`Bạn có <b>3 HP</b>. Nếu ở <b>cùng tòa với The TIU</b>, bạn bị jumpscare và <span class="tutWarn">mất 1 HP</span>. Hết HP là thua (có thể thử lại đêm đó).` },
  { title:'Vị trí The TIU', sel:'#tiuLastSeen', block:true,
    html:`Ô này cho biết <b>nơi The TIU được thấy lần cuối</b>. Nó luôn lang thang — dựa vào đó đoán hướng nó đi và tránh xa, nhất là khi nó ở tòa liền kề.` },
  { title:'Mức độ hoạt động', sel:'#meterOuter',
    html:`Càng cao, The TIU càng <b>nhanh</b> và càng biết đường tới chỗ bạn.<ul>
      <li>Tăng khi bạn bỏ lỡ / làm hỏng sự cố, hoặc đứng yên quá lâu.</li>
      <li>Giảm khi bạn xử lý xong sự cố.</li>
      <li>Chạm <span class="tutWarn">100%</span> → <b>Huyết Nguyệt</b>: không còn nơi nào an toàn.</li></ul>` },
  { title:'Thể lực', sel:'#staminaOuter',
    html:`Mỗi lần di chuyển tốn <b>15% thể lực</b>; đứng yên thì hồi dần. Cạn thể lực bạn sẽ <span class="tutWarn">không đi được</span> và bị đói mất máu. Đừng chạy loạn, cũng đừng trốn mãi một chỗ.` },
  { title:'Đi lại trong tòa', sel:'#roomBanner',
    html:`Mỗi tòa là một khu vực riêng nhìn từ trên xuống. Dùng <b>WASD</b> hoặc <b>mũi tên</b> để đi lại. Muốn sang tòa khác, đi tới <b>cánh cửa viền xanh</b> trên tường rồi bấm <b>E</b>.` },
  { title:'Phím E — tương tác', sel:'#roomBanner',
    html:`Phím <b>E</b> dùng cho mọi thứ: nói chuyện, nhặt đồ, mua đồ ở quầy, mở cửa, xử lý sự cố. Lại gần một vật có thể tương tác, gợi ý <b>[E]</b> sẽ hiện lên. Hãy thăm dò các góc phòng.` },
  { title:'Sơ đồ', sel:'#miniMapWrap',
    html:`Sơ đồ cho thấy vị trí của bạn và các khu vực. Bấm <b>Phóng to</b> hoặc phím <b>M</b>, rồi bấm vào khu liền kề để đi thẳng sang đó — tốn thời gian và thể lực giống như đi qua cửa.` },
  { title:'Xử lý sự cố', sel:'#roomBanner',
    html:`Sự cố hay xuất hiện <b>gần The TIU</b>. Tòa có sự cố sẽ có một <b>bảng điều khiển nhấp nháy đỏ</b>: đi tới gần và bấm <b>E</b> để bắt đầu mini-game.<ul>
      <li>Làm xong mini-game kịp giờ → <b>+điểm</b>, giảm mức hoạt động.</li>
      <li>Bỏ lỡ hoặc làm hỏng → The TIU bất ổn hơn.</li></ul>Hãy cân nhắc: sự cố đáng làm, nhưng cũng là chỗ nguy hiểm.` },
  { title:'Điểm & Căn tin', sel:'#pointsHud', block:true,
    html:`<b>Điểm</b> kiếm từ việc xử lý sự cố. Dùng điểm mua đồ ở <b>Căn tin</b>: Bim Bim (hồi máu), Nước tăng lực, suất ăn khuya (hồi thể lực).<br><br>Căn tin chỉ <b>an toàn khi mở cửa</b> (01:00–02:00 và 04:00–05:00). Nán lại quá lâu bạn sẽ đói.` },
  { title:'Túi đồ', sel:'#bagBtn',
    html:`Xem và dùng vật phẩm của bạn tại đây (phím <b>B</b>). Mỗi món có mô tả công dụng riêng.` },
  { title:'Phím tắt & lời cuối',
    html:`<ul><li><b>WASD / mũi tên</b>: đi lại &nbsp;·&nbsp; <b>E</b>: tương tác</li><li><b>ESC</b>: tạm dừng</li><li><b>M</b>: sơ đồ &nbsp;·&nbsp; <b>B</b>: túi đồ</li><li><b>J</b>: tiếp tục hội thoại &nbsp;·&nbsp; <b>Ctrl</b>: bỏ qua hội thoại</li></ul><br>Khuôn viên này còn nhiều bí mật chưa ai kể cho bạn. Chúc may mắn!` }
];
let TUT = null;

function isTutorialDone(){ try{ return localStorage.getItem(TUTORIAL_KEY)==='1'; }catch(e){ return false; } }
function markTutorialDone(){ try{ localStorage.setItem(TUTORIAL_KEY,'1'); }catch(e){} }

function maybeAutoTutorial(n, chapter){
  if(chapter!==1 || n!==1 || isTutorialDone()) return;
  if(!S || !S.running) return;
  startTutorial({});
}
function startTutorial(opts){
  opts = opts || {};
  TUT = { i:0, fromPause:!!opts.fromPause, live: !!(S && S.running) };
  if(TUT.live) S.paused = true; // đóng băng thế giới trong lúc xem hướng dẫn
  document.getElementById('tutorialLayer').classList.remove('hidden');
  renderTutorialStep();
}
function endTutorial(){
  if(!TUT) return;
  const t = TUT; TUT = null;
  markTutorialDone();
  document.getElementById('tutorialLayer').classList.add('hidden');
  if(t.fromPause){
    document.getElementById('pauseMenu').classList.remove('hidden'); // quay lại menu tạm dừng (S.paused vẫn true)
  } else if(t.live && S && S.running){
    S.paused = false;
    S.lastTick = performance.now();
  }
}
function tutorialTargetEl(st){
  if(!TUT || !TUT.live || !st.sel) return null;
  let el = document.querySelector(st.sel);
  if(el && st.block) el = el.closest('.hud-block') || el;
  if(!el || !el.getClientRects().length) return null;
  return el;
}
function renderTutorialStep(){
  if(!TUT) return;
  const st = TUTORIAL_STEPS[TUT.i];
  const last = TUT.i===TUTORIAL_STEPS.length-1;
  document.getElementById('tutStep').textContent = 'HƯỚNG DẪN '+(TUT.i+1)+'/'+TUTORIAL_STEPS.length;
  document.getElementById('tutTitle').textContent = st.title;
  document.getElementById('tutBody').innerHTML = st.html;
  document.getElementById('tutPrevBtn').disabled = TUT.i===0;
  document.getElementById('tutNextBtn').textContent = last ? (TUT.live && !TUT.fromPause ? 'BẮT ĐẦU CHƠI ▶' : 'XONG ▶') : 'TIẾP ▶';
  document.getElementById('tutSkipBtn').style.display = last ? 'none' : '';
  placeTutorial();
}
function placeTutorial(){
  if(!TUT) return;
  const st = TUTORIAL_STEPS[TUT.i];
  const spot = document.getElementById('tutSpot');
  const card = document.getElementById('tutCard');
  const block = document.getElementById('tutBlock');
  const el = tutorialTargetEl(st);
  const vw = window.innerWidth, vh = window.innerHeight;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  block.classList.toggle('dim', !el);
  spot.classList.toggle('hidden', !el);
  let left, top;
  if(el){
    const r = el.getBoundingClientRect(), pad = 6;
    spot.style.left = (r.left-pad)+'px'; spot.style.top = (r.top-pad)+'px';
    spot.style.width = (r.width+pad*2)+'px'; spot.style.height = (r.height+pad*2)+'px';
    left = r.left + r.width/2 - cw/2;
    top = r.bottom + pad + 14;                           // ưu tiên đặt thẻ bên dưới vùng sáng
    if(top + ch > vh - 10) top = r.top - pad - 14 - ch;  // hết chỗ -> đặt bên trên
    if(top < 10) top = Math.max(10, (vh - ch)/2);        // vùng sáng quá lớn -> đặt giữa màn hình
  } else {
    left = (vw - cw)/2; top = (vh - ch)/2;
  }
  card.style.left = Math.max(10, Math.min(vw - cw - 10, left))+'px';
  card.style.top = Math.max(10, Math.min(vh - ch - 10, top))+'px';
}
function tutorialNext(){
  if(!TUT) return;
  if(TUT.i >= TUTORIAL_STEPS.length-1){ endTutorial(); return; }
  TUT.i++; renderTutorialStep();
}
function tutorialPrev(){
  if(!TUT || TUT.i<=0) return;
  TUT.i--; renderTutorialStep();
}
document.getElementById('tutNextBtn').onclick = tutorialNext;
document.getElementById('tutPrevBtn').onclick = tutorialPrev;
document.getElementById('tutSkipBtn').onclick = endTutorial;
document.getElementById('tutorialBtn').onclick = ()=> startTutorial({});
document.getElementById('pauseTutorialBtn').onclick = ()=>{
  document.getElementById('pauseMenu').classList.add('hidden');
  startTutorial({fromPause:true});
};
window.addEventListener('resize', placeTutorial);
document.addEventListener('keydown', (e)=>{
  if(!TUT || e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key==='Enter' || e.key==='ArrowRight'){ e.preventDefault(); tutorialNext(); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); tutorialPrev(); }
  else if(e.key==='Escape'){ e.preventDefault(); endTutorial(); }
});

/* ============== TOP-DOWN: MỖI TÒA LÀ MỘT KHU VỰC ĐI LẠI ĐƯỢC ==============
   Dữ liệu map nằm ở maps.js (window.TD_MAPS, mảng 2 chiều + bảng mã ô TD_TILE).
   Engine này chỉ ĐỌC trạng thái game hiện có (S.activeEvents, S.scavenge, S.loreClues, S.laPeaceRoom,
   getRoomNPCMeta, canDepositLaPeace...) và gắn mọi tương tác vào phím E — không tự giữ trạng thái riêng
   ngoài vị trí người chơi (S.tdX/tdY/tdRoom) và hạt giống chia điểm giấu đồ (S.tdSeed), cả hai đều được lưu theo save game.
   Va chạm với The TIU vẫn tính theo PHÒNG như cũ (cùng tòa = jumpscare) — chưa tính theo vị trí trong tòa.
   Thiếu maps.js hoặc thiếu map của một phòng -> phòng đó tự dùng lại giao diện nút bấm cũ. */
const TD_SPEED = 4.4;   // ô / giây
const TD_RADIUS = 0.3;  // bán kính va chạm của người chơi (đơn vị ô)
const TD_REACH = 1.7;   // khoảng cách tối đa (đơn vị ô) để bấm E tương tác
const TD = { S:null, room:null, x:1.5, y:1.5, face:{x:0,y:1}, moving:false, keys:{}, lastTs:0,
             canvas:null, ctx:null, W:0, H:0, dpr:1, imgs:{}, debug:false, npcMeta:null, near:null };

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
const TD_ENABLED = true; /* WASD chỉ đi lại TRONG phòng; chuyển tòa chỉ bằng sơ đồ (mini map / phóng to) */
function tdActive(){
  if(!TD_ENABLED) return false;
  return !!(S && S.running && !S.epilogue && tdMap(S.playerRoom));
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
function tdInteractables(m){
  const room = S.playerRoom, def = ROOM_DEF[room], ix = m._ix, list = [];
  const meta = TD.npcMeta;
  if(meta){
    const pos = tdSpot(m,'npc',0);
    list.push({kind:'npc', pos, meta, label: meta.talkable ? '💬 Nói chuyện với '+meta.name : null,
      act: meta.talkable ? ()=>talkToNPC(meta) : null});
  }
  const ev = S.activeEvents[room];
  if(ev){
    list.push({kind:'event', pos:tdSpot(m,'event',1), mandatory:!!ev.mandatory,
      label: ev.mandatory ? '⚡ Khởi động lại cầu dao tổng' : '⚠ Xử lý sự cố: '+eventLabel(def.event),
      act: ()=>startMinigame(room)});
  }
  if(def.safe){
    const open = isRoomSafe(room);
    list.push({kind:'shop', pos:tdSpot(m,'shop',2), icon:'🛒', label: open ? '🛒 Mở quầy Căn tin' : '🛒 Quầy Căn tin (đang đóng cửa)',
      act: ()=>{ if(isRoomSafe(room)) openShop(); else addLog('Quầy Căn tin đang đóng cửa. Căn tin chỉ mở theo khung giờ cố định.','warn'); }});
    if(isHardMode()) list.push({kind:'bench', pos:tdSpot(m,'bench',3), icon:'🛠', label:'🛠 Bàn chế tạo', act:openCraftBench});
  }
  if(canDepositLaPeace()){
    list.push({kind:'amp', pos:tdSpot(m,'amp',4), icon:'⚡', label:'⚡ Nạp La Peace vào bộ khuếch đại ('+S.laPeaceCarried+' đang mang)', act:depositLaPeace});
  }
  const hasPickup = S.scavenge[room] || S.loreClues[room] || (S.laPeaceRoom===room && !S.laPeaceFound);
  if(hasPickup){
    const sp = tdItemSpots(m, room);
    if(S.scavenge[room]) list.push({kind:'pickup', pos:sp[0], label:'🔧 Nhặt '+COMPONENT_NAMES[S.scavenge[room]], act:pickupScavenge});
    if(S.loreClues[room]) list.push({kind:'pickup', pos:sp[1], label:'📖 Thu thập manh mối', act:pickupLore});
    if(S.laPeaceRoom===room && !S.laPeaceFound) list.push({kind:'pickup', pos:sp[2], label:'✦ Nhặt La Peace (mảnh năng lượng ôn hòa)', act:pickupLaPeace});
  }
  /* Cửa ra (ô 10) KHÔNG còn tương tác bằng E: muốn sang tòa khác phải dùng sơ đồ. */
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
  TD.npcMeta = getRoomNPCMeta(room);
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
  return !!(S && S.running && !S.paused && !S.epilogue && !TUT && tdActive()
    && !isBlockingOverlayOpen() && !(BS && !BS.over) && isPauseMenuClosed());
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
TD.testColors = true;
function tdDrawTestTiles(ctx,m,tp,ox,oy){
  const exitTo = {};
  ((m._ix && m._ix.exitList) || []).forEach(e=>{ exitTo[e.pos[0]+','+e.pos[1]] = e.to; });
  ctx.save();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font = 'bold '+Math.max(9,Math.round(tp*0.32))+'px monospace';
  for(let y=0;y<m.rows;y++){
    for(let x=0;x<m.cols;x++){
      const c = tdTile(m,x,y), px = ox+x*tp, py = oy+y*tp, col = TD_TEST_COLORS[c] || TD_TEST_COLORS[0];
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
  if(TD.testColors && !overImage){ tdDrawTestTiles(ctx,m,tp,ox,oy); return; }
  ctx.save();
  if(overImage) ctx.globalAlpha = 0.5;
  for(let y=0;y<m.rows;y++){
    for(let x=0;x<m.cols;x++){
      const c = tdTile(m,x,y), px = ox+x*tp, py = oy+y*tp;
      const col = TD_COLORS[c];
      if(col){
        ctx.fillStyle = col[0]; ctx.fillRect(px,py,tp,tp);
        if(c!==2){ ctx.strokeStyle = col[1]; ctx.lineWidth = 2; ctx.strokeRect(px+2,py+2,tp-4,tp-4); }
      } else {
        ctx.fillStyle = ((x+y)&1) ? '#1b1812' : '#17140f'; ctx.fillRect(px,py,tp,tp);
      }
      if(TD.debug){
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
  if(img) ctx.drawImage(img, ox, oy, tp*m.cols, tp*m.rows);
  if(!img || TD.debug) tdDrawTiles(ctx,m,tp,ox,oy,!!img);
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

  // mất điện: bóng tối + đèn pin quanh người chơi, bảng điện vẫn nhấp nháy để dò đường
  if(S.gameMinutes < S.breakerUntil || S.gridDown){
    const g = ctx.createRadialGradient(px,py,tp*0.6,px,py,tp*3.4);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.55,'rgba(0,0,0,0.6)'); g.addColorStop(1,'rgba(0,0,0,0.96)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    list.filter(it=>it.kind==='event').forEach(it=>{
      const [cx,cy] = C(it.pos), pulse = 0.5+0.5*Math.sin(t*5);
      const g2 = ctx.createRadialGradient(cx,cy,2,cx,cy,tp*(1.2+0.5*pulse));
      g2.addColorStop(0,'rgba(230,41,63,0.9)'); g2.addColorStop(1,'rgba(230,41,63,0)');
      ctx.fillStyle = g2; ctx.fillRect(cx-tp*2,cy-tp*2,tp*4,tp*4);
      ctx.fillStyle = '#fff'; tdIcon(ctx,'⚡',cx,cy,tp*0.55);
    });
  } else if(S.enraged){
    ctx.fillStyle = 'rgba(140,0,14,0.14)'; ctx.fillRect(0,0,W,H);
  }

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
  TD.npcMeta = getRoomNPCMeta(S.playerRoom);
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

/* ============== LƯU GAME KHI RỜI TRANG ============== */
window.addEventListener('beforeunload', ()=>{ persistSave(); });

buildMap();
initProximityAudio();
rafId = requestAnimationFrame(tick);

})();