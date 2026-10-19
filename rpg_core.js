/* =========================================================================
   rpg_core.js — MODULE 1: LÕI RPG (Battle Royale ĐRL)
   Nạp TRƯỚC script.js (index.html: dialogue.js, map.js, rpg_core.js, script.js).
   Không phụ thuộc DOM, không đụng vào S của script.js -> xuất ra window.RPG.

   Nội dung:
     1) CFG            — mọi hằng số cân bằng (sửa số ở đây là đủ)
     2) CLASSES        — 5 Class, chỉ số gốc, kỹ năng Lv1/3/5 + Ultimate (dạng DỮ LIỆU;
                         module 2 "combat engine" sẽ đọc `effects` để thực thi)
     3) CLASS_QUIZ     — bộ trắc nghiệm chọn Class
     4) ITEMS/RECIPES  — vật phẩm hỗ trợ combat + công thức chế tạo
     5) Fighter / EXP / Level (tối đa Lv5)
     6) ĐRL            — cướp/trừ 50%, loại người thấp nhất, TIU phạt
     7) Trust / Party  — nói chuyện, mời vào đội
     8) Mô phỏng NPC đánh nhau ngầm, serialize/load
   ========================================================================= */
(function (global) {
  "use strict";

  /* ============================ 1) CẤU HÌNH ============================ */
  const CFG = {
    MAX_LEVEL: 5,
    EXP_TABLE: [0, 0, 30, 80, 150, 250], // EXP_TABLE[lv] = EXP tích lũy cần để đạt lv
    GROWTH_LEVELS: [2, 4],               // Lv không có skill -> cộng chỉ số
    GROWTH_PCT: 0.10,                    // +10% chỉ số gốc mỗi mốc
    ULT_UNLOCK_LEVEL: 1,                 // Ultimate dùng được từ Lv1 (chỉ cần đầy Nộ)

    EXP_BASE_WIN: 20,
    EXP_PER_ENEMY_LEVEL: 10,
    EXP_UNDERDOG_BONUS: 0.5,             // thắng đối thủ Lv cao hơn: +50%

    START_DRL: 40,
    DRL_STEAL_PCT: 0.25,                 // THẮNG: cướp 25% ĐRL của kẻ thua
    DRL_PLAYER_LOSS_PCT: 0.5,            // người chơi THUA: bị trừ 50% ĐRL (NPC đánh nhau với nhau: kẻ thua mất đúng phần bị cướp)
    TIU_PENALTY: 5,                      // The TIU bắt được người chơi (chỉ Chapter 1)

    BATTLE_MINUTES: 60,                  // 1 trận đấu tốn 60 phút đồng hồ trong game
    REGEN_PER_HOUR: 0.10,                // hồi dần 10% HP tối đa mỗi giờ game (ngoài trận)
    REST_HEAL_PCT: 0.35,                 // "Nghỉ ngơi 1 giờ" ở Căn tin: +35% HP tối đa

    RAGE_MAX: 100,
    RAGE_ON_ATTACK: 25,
    RAGE_ON_SKILL: 35,

    LAPEACE_NEEDED: 3,                   // đủ 3 Mảnh La Peace -> học Spell Breaker (parry Ultimate của địch)

    TRUST_MAX: 3,
    RECRUIT_TRUST: 2,
    PARTY_MAX_ALLIES: 2,                 // tối đa 2 đồng đội + người chơi = 3 người (giống PARTY_DEF cũ)

    // hồi chiêu đề xuất (spec chưa nêu) — Ultimate không dùng CD mà dùng Nộ đầy
    SKILL_CD: { 1: 2, 3: 3, 5: 4 }
  };

  /* ============================ 2) CLASS ============================ */
  // effects: danh sách mô tả hiệu ứng cho combat engine.
  //   power = hệ số sát thương nhân với ATK (đề xuất, chỉnh tuỳ ý)
  const CLASSES = {
    fighter: {
      id: "fighter", name: "Đấu Sĩ", icon: "🛡️",
      base: { hp: 100, atk: 30, def: 30, spd: 40 },
      passive: { id: "ironWill", name: "Ý chí thép", rageOnHit: 35,
                 desc: "Mỗi lần bị tấn công trúng, tích thêm 35 Nộ." },
      skills: [
        { id: "guard", lvl: 1, name: "Thủ thế", target: "self",
          desc: "Tăng 40 DEF trong 2 turn.",
          effects: [{ type: "buff", stat: "def", amount: 40, turns: 2 }] },
        { id: "counter", lvl: 3, name: "Phản đòn", target: "self",
          desc: "Miễn nhiễm sát thương 1 turn, phản lại 50% sát thương địch vừa gây ra.",
          effects: [{ type: "immune", turns: 1 }, { type: "reflect", pct: 0.5, turns: 1 }] },
        { id: "lastStand", lvl: 5, name: "Chiến binh cuối cùng", target: "self",
          desc: "Xóa mọi debuff, tăng 20 ATK và 20 DEF trong 3 turn.",
          effects: [{ type: "cleanse" },
                    { type: "buff", stat: "atk", amount: 20, turns: 3 },
                    { type: "buff", stat: "def", amount: 20, turns: 3 }] }
      ],
      ultimate: { id: "lastStopper", name: "Chốt chặn cuối cùng", target: "aoe",
        desc: "Mất 25% HP hiện tại, gây sát thương cực lớn lên toàn bộ kẻ địch.",
        effects: [{ type: "selfCostCurHpPct", pct: 0.25 }, { type: "damage", power: 4.5 }] }
    },

    assassin: {
      id: "assassin", name: "Sát Thủ", icon: "🗡️",
      base: { hp: 70, atk: 60, def: 10, spd: 60 },
      skills: [
        { id: "nimble", lvl: 1, name: "Thân thủ nhanh nhẹn", target: "self",
          desc: "Tăng 40 SPD trong 2 turn.",
          effects: [{ type: "buff", stat: "spd", amount: 40, turns: 2 }] },
        { id: "finisher", lvl: 3, name: "Sát chiêu", target: "single",
          desc: "Gây sát thương lớn lên 1 kẻ địch.",
          effects: [{ type: "damage", power: 1.3 }] },
        { id: "instinct", lvl: 5, name: "Bản năng sát thủ", target: "self",
          desc: "Tàng hình 2 turn (không thể bị chỉ định, chỉ nhận sát thương từ skill AoE).",
          effects: [{ type: "stealth", turns: 2 }] }
      ],
      ultimate: { id: "perfectKill", name: "Sát chiêu hoàn hảo", target: "single",
        desc: "Gây sát thương cực lớn, 30% tỉ lệ kết liễu (Execute) mục tiêu ngay lập tức.",
        effects: [{ type: "damage", power: 2.4 }, { type: "execute", chance: 0.3 }] }
    },

    mage: {
      id: "mage", name: "Pháp Sư", icon: "🔮",
      base: { hp: 80, atk: 50, def: 20, spd: 50 },
      skills: [
        { id: "fireball", lvl: 1, name: "Hỏa cầu thuật", target: "aoe",
          desc: "Gây sát thương, 30% tỉ lệ gây hiệu ứng Cháy (DoT).",
          effects: [{ type: "damage", power: 0.85 },
                    { type: "status", status: "burn", chance: 0.3, turns: 3, dotPower: 0.3 }] },
        { id: "iceWall", lvl: 3, name: "Băng phong vạn dặm", target: "aoe",
          desc: "Giảm SPD kẻ địch, 50% tỉ lệ Đóng băng. Kẻ địch bị Đóng băng nhận thêm 50% damage.",
          effects: [{ type: "damage", power: 0.8 },
                    { type: "debuff", stat: "spd", amount: 20, turns: 2 },
                    { type: "status", status: "freeze", chance: 0.5, turns: 2, dmgTakenMult: 1.5 }] },
        { id: "windSpirit", lvl: 5, name: "Phong khởi", target: "aoe",
          desc: "Triệu hồi Tinh linh gió: đánh thường +25% sức mạnh, +50% SPD. Cast lần 2: Tinh linh phát nổ AoE theo số turn đã tồn tại.",
          effects: [{ type: "summon", summon: "windSpirit", atkMult: 1.25, spdMult: 1.5 },
                    { type: "recastExplode", powerPerTurn: 0.5 }] }
      ],
      ultimate: { id: "thunder", name: "Lôi thần giáng thế", target: "aoe",
        desc: "Sát thương lớn, 50% tỉ lệ gây Tê liệt (bỏ qua turn).",
        effects: [{ type: "damage", power: 2.0 },
                  { type: "status", status: "paralyze", chance: 0.5, turns: 1 }] }
    },

    healer: {
      id: "healer", name: "Dược Sư", icon: "🧪",
      base: { hp: 120, atk: 20, def: 50, spd: 30 },
      skills: [
        { id: "poison", lvl: 1, name: "Độc dược", target: "single",
          desc: "Gây độc (DoT), cộng dồn tối đa 3 stack.",
          effects: [{ type: "poisonStack", amount: 1, max: 3, dotPower: 0.5 }] },
        { id: "blessing", lvl: 3, name: "Phước lành dược sư", target: "self",
          desc: "Hồi 25% HP tối đa.",
          effects: [{ type: "healPct", pct: 0.25 }] },
        { id: "toxicBlast", lvl: 5, name: "Vụ nổ độc hại", target: "aoe",
          desc: "Gây sát thương Độc lên toàn bộ mục tiêu.",
          effects: [{ type: "poisonDamage", powerPerStack: 0.6, baseStacks: 1 }] }
      ],
      ultimate: { id: "bitterMedicine", name: "Thuốc đắng giã tật", target: "aoe",
        desc: "Gây sát thương tức thì theo số stack độc hiện có, sau đó nhân đôi stack độc trên kẻ địch.",
        effects: [{ type: "poisonDamage", powerPerStack: 1.2, baseStacks: 0 }, { type: "doublePoisonStacks" }] }
    },

    summoner: {
      id: "summoner", name: "Triệu Hồi Sư", icon: "👁️",
      base: { hp: 110, atk: 30, def: 40, spd: 20 },
      skills: [
        { id: "summonSword", lvl: 1, name: "Triệu hồi Ma Kiếm", target: "summon",
          desc: "Tạo đồng minh đánh kế tiếp, gây sát thương = 50% ATK Triệu Hồi Sư.",
          effects: [{ type: "summon", summon: "sword", atkPct: 0.5 }] },
        { id: "summonGuard", lvl: 3, name: "Triệu hồi Hộ Vệ", target: "summon",
          desc: "Tạo đồng minh có Taunt. Nếu đang có Ma Kiếm: hợp thể thành Ma Kiếm Sĩ (sát thương 100%, có Taunt).",
          effects: [{ type: "summon", summon: "guard", taunt: true },
                    { type: "fuse", from: ["sword", "guard"], into: "swordsman", atkPct: 1.0 }] },
        { id: "manaTransfer", lvl: 5, name: "Truyền Mana", target: "summon",
          desc: "Hồi máu cho các vật triệu hồi.",
          effects: [{ type: "healSummons", pct: 0.4 }] }
      ],
      ultimate: { id: "voidSummon", name: "Triệu hồi Hư Không", target: "summon",
        desc: "Ma Kiếm → Hỗn Mang Kiếm (+75% DMG); Hộ Vệ → Giáp Hư Không (+50% HP); Ma Kiếm Sĩ → Hỗn Mang Kiếm Sĩ (có thanh Nộ và dùng Nộ như Đấu Sĩ).",
        effects: [{ type: "upgradeSummon", sword: { dmgMult: 1.75 }, guard: { hpMult: 1.5 },
                    swordsman: { rage: true } }] }
    }
  };
  const CLASS_IDS = Object.keys(CLASSES);

  /* ============================ 3) TRẮC NGHIỆM CLASS ============================ */
  // Mỗi đáp án cộng 1 điểm cho class tương ứng. UI nên xáo trộn thứ tự đáp án.
  const CLASS_QUIZ = [
    { q: "Deadline còn 3 tiếng nữa, bạn làm gì?",
      a: [{ t: "Thức trắng cày một mạch tới sáng", c: "fighter" },
          { t: "Tập trung làm gọn trong đúng 1 tiếng", c: "assassin" },
          { t: "Nghĩ ra một giải pháp thần kỳ chưa ai dùng", c: "mage" },
          { t: "Pha cà phê, chia bánh cho cả nhóm cùng cố", c: "healer" },
          { t: "Giao việc cho cả hội và điều phối", c: "summoner" }] },
    { q: "Bạn hay ngồi ở đâu trong giảng đường?",
      a: [{ t: "Hàng đầu, chắc chắn và vững vàng", c: "fighter" },
          { t: "Cuối lớp, lặng lẽ quan sát", c: "assassin" },
          { t: "Cạnh cửa sổ, thả hồn theo mây", c: "mage" },
          { t: "Cạnh bạn đang mệt để chăm sóc", c: "healer" },
          { t: "Giữa đám bạn thân", c: "summoner" }] },
    { q: "Bị trừ ĐRL oan, bạn phản ứng thế nào?",
      a: [{ t: "Cãi tới cùng, không lùi bước", c: "fighter" },
          { t: "Âm thầm tìm cách lấy lại đúng lúc", c: "assassin" },
          { t: "Dùng lý lẽ sắc bén thuyết phục", c: "mage" },
          { t: "Thông cảm, nói chuyện nhẹ nhàng", c: "healer" },
          { t: "Rủ cả hội đi giải quyết cùng", c: "summoner" }] },
    { q: "Trong balo của bạn luôn có gì?",
      a: [{ t: "Chai nước lớn, sẵn sàng chịu đựng", c: "fighter" },
          { t: "Đúng một cây bút, gọn nhẹ", c: "assassin" },
          { t: "Sổ ghi đầy công thức và hình vẽ", c: "mage" },
          { t: "Túi thuốc, bánh kẹo để chia bạn", c: "healer" },
          { t: "Danh bạ đầy người sẵn sàng giúp", c: "summoner" }] },
    { q: "Bạn muốn nổi bật trong trận chiến này nhờ điều gì?",
      a: [{ t: "Đứng vững tới người cuối cùng", c: "fighter" },
          { t: "Một đòn chí mạng bất ngờ", c: "assassin" },
          { t: "Sức mạnh quét sạch diện rộng", c: "mage" },
          { t: "Làm đối thủ kiệt sức dần", c: "healer" },
          { t: "Điều khiển đồng đội của riêng mình", c: "summoner" }] }
  ];

  /* ============================ 4) VẬT PHẨM HỖ TRỢ COMBAT ============================ */
  // usable: nơi dùng được. target: 'self' | 'enemy' | 'allEnemies' | 'room' | 'none'
  const ITEMS = {
    bimbim:  { name: "Bim Bim", icon: "🍟", usable: ["combat", "map"], target: "self", price: 20,
               desc: "Hồi 30% HP tối đa.",
               effects: [{ type: "healPct", pct: 0.30 }] },
    water:   { name: "Nước tăng lực", icon: "🥤", usable: ["combat"], target: "self", price: 15,
               desc: "+25 Nộ và +20 SPD trong 2 turn.",
               effects: [{ type: "rage", amount: 25 }, { type: "buff", stat: "spd", amount: 20, turns: 2 }] },
    camera:  { name: "Máy quay soi", icon: "📷", usable: ["map", "combat"], target: "enemy", price: null,
               desc: "Xem Class, Lv, HP, ĐRL, Nộ và skill sắp dùng của đối thủ.",
               effects: [{ type: "scout" }] },
    flash:   { name: "Đèn flash", icon: "💡", usable: ["combat"], target: "enemy", price: null,
               desc: "Làm 1 mục tiêu choáng, mất 1 turn.",
               effects: [{ type: "status", status: "stun", chance: 1, turns: 1 }] },
    grenade: { name: "Lựu đạn điện", icon: "⚡", usable: ["combat"], target: "allEnemies", price: null,
               desc: "Gây 25 sát thương cố định (bỏ qua DEF) lên toàn bộ kẻ địch.",
               effects: [{ type: "trueDamage", amount: 25 }] },
    trap:    { name: "Bẫy gài", icon: "🪤", usable: ["map"], target: "room", price: null,
               desc: "Đặt ở phòng hiện tại. Ai bước vào bị trừ 20% HP và mất lượt đầu của trận kế tiếp.",
               effects: [{ type: "placeTrap", hpPct: 0.2, skipFirstTurn: true, durationMin: 120 }] },
    antidote:{ name: "Thuốc giải", icon: "💊", usable: ["combat", "map"], target: "self", price: 25,
               desc: "Xóa Cháy, Độc, Đóng băng, Tê liệt.",
               effects: [{ type: "cleanse", only: ["burn", "poison", "freeze", "paralyze"] }] },
    armor:   { name: "Áo giáp bìa carton", icon: "📦", usable: ["combat"], target: "self", price: null,
               desc: "+20 DEF trong 3 turn.",
               effects: [{ type: "buff", stat: "def", amount: 20, turns: 3 }] }
  };
  const RELICS = {
    lapeace: { name: "Mảnh La Peace", icon: "💠" }
  };
  const COMPONENTS = {
    pin:  { name: "Pin cũ", icon: "🔋" },
    wire: { name: "Dây điện", icon: "🔌" },
    tape: { name: "Băng keo", icon: "🧷" },
    pipe: { name: "Ống thép", icon: "🔧" }
  };
  const RECIPES = {
    grenade: { pin: 2, pipe: 1 },
    flash:   { pin: 1, wire: 1 },
    trap:    { wire: 1, tape: 1 },
    armor:   { tape: 2, pipe: 1 },
    camera:  { wire: 2, tape: 1 }
  };

  /* ============================ 5) DANH SÁCH NHÂN VẬT ============================ */
  const DEFAULT_PLAYER_NAME = "Tôi Yêu UIT";
  // legacyKey: khoá cũ trong script.js (S.npc.B / S.npc.E) để dễ nối code về sau
  const NPC_ROSTER = [
    { id: "WIBU",  legacyKey: "E", name: "Wibu Việt Nhật",      title: "Lolicon Protector", homeRoom: "E" },
    { id: "LINH",  legacyKey: "B", name: "Chàng Lính Ngu Lam",  title: "Quỷ Vương Bất Tử",  homeRoom: "B" },
    { id: "TRONG", legacyKey: null, name: "Trọng",              title: "Người Hoa Hòe",     homeRoom: "C" },
    { id: "TOBY",  legacyKey: null, name: "Toby",               title: "Sinh viên ngoại quốc, hay cúp tiết, luôn dắt theo một con chó phiền phức", homeRoom: "A" }
  ];

  /* ============================ HELPERS ============================ */
  let rng = Math.random;
  function setRng(fn) { rng = fn || Math.random; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let state = null; // { fighters:{id:f}, order:[ids], night:0, chapter:1 }

  /* ============================ FIGHTER / STATS ============================ */
  function getStats(f) {
    const b = CLASSES[f.classId].base;
    let mult = 1;
    CFG.GROWTH_LEVELS.forEach(function (lv) { if (f.level >= lv) mult += CFG.GROWTH_PCT; });
    return {
      hp: Math.round(b.hp * mult), atk: Math.round(b.atk * mult),
      def: Math.round(b.def * mult), spd: Math.round(b.spd * mult)
    };
  }

  function createFighter(o) {
    const f = {
      id: o.id, name: o.name, title: o.title || "", isPlayer: !!o.isPlayer,
      legacyKey: o.legacyKey || null, classId: o.classId, homeRoom: o.homeRoom || null,
      level: 1, exp: 0, hp: 0, maxHp: 0, rage: 0, laPeace: 0, spellBreaker: false,
      drl: CFG.START_DRL, trust: 0, inParty: false, alive: true,
      items: {}, components: {}, statuses: []
    };
    f.maxHp = getStats(f).hp;
    f.hp = f.maxHp;
    return f;
  }

  /* ============================ SKILL ============================ */
  function getSkills(f) {
    const c = CLASSES[f.classId];
    return c.skills.map(function (s) {
      return Object.assign({ cd: CFG.SKILL_CD[s.lvl], unlocked: f.level >= s.lvl }, s);
    });
  }
  function getUltimate(f) {
    const u = CLASSES[f.classId].ultimate;
    return Object.assign({ unlocked: f.level >= CFG.ULT_UNLOCK_LEVEL, rageCost: CFG.RAGE_MAX }, u);
  }
  function addRage(f, n) {
    f.rage = Math.max(0, Math.min(CFG.RAGE_MAX, f.rage + n));
    return f.rage;
  }
  const rageOnAttack = function (f) { return addRage(f, CFG.RAGE_ON_ATTACK); };
  const rageOnSkill  = function (f) { return addRage(f, CFG.RAGE_ON_SKILL); };
  function canUseUltimate(f) { return f.level >= CFG.ULT_UNLOCK_LEVEL && f.rage >= CFG.RAGE_MAX; }

  /* ============================ HP NGOÀI TRẬN (HP được giữ lại giữa các trận) ============================ */
  function heal(f, amount) {
    if (!f.alive) return 0;
    const h = Math.max(0, Math.min(f.maxHp - f.hp, Math.round(amount)));
    f.hp += h;
    return h;
  }
  function healPct(f, pct) { return heal(f, f.maxHp * pct); }
  /* Hồi dần theo thời gian: cộng dồn phần lẻ để không mất khi amount < 1 */
  function regen(f, amount) {
    if (!f.alive || f.hp >= f.maxHp) { f._acc = 0; return 0; }
    f._acc = (f._acc || 0) + amount;
    const whole = Math.floor(f._acc);
    if (whole <= 0) return 0;
    f._acc -= whole;
    return heal(f, whole);
  }
  function healAll() {
    state.order.forEach(function (id) { const f = state.fighters[id]; if (f.alive) { f.hp = f.maxHp; f._acc = 0; } });
  }

  /* ============================ EXP / LEVEL ============================ */
  function expToNext(f) {
    return f.level >= CFG.MAX_LEVEL ? 0 : CFG.EXP_TABLE[f.level + 1] - f.exp;
  }
  function expForWin(winner, loser) {
    let exp = CFG.EXP_BASE_WIN + CFG.EXP_PER_ENEMY_LEVEL * loser.level;
    if (loser.level > winner.level) exp = Math.round(exp * (1 + CFG.EXP_UNDERDOG_BONUS));
    return exp;
  }
  /* Trả về {gained, levelsGained:[lv...], unlocked:[{lvl,name,isUltimate}], newLevel} */
  function addExp(f, amount) {
    const res = { gained: 0, levelsGained: [], unlocked: [], newLevel: f.level };
    if (f.level >= CFG.MAX_LEVEL) return res;
    const before = f.exp;
    f.exp = Math.min(CFG.EXP_TABLE[CFG.MAX_LEVEL], f.exp + Math.max(0, Math.round(amount)));
    res.gained = f.exp - before;
    while (f.level < CFG.MAX_LEVEL && f.exp >= CFG.EXP_TABLE[f.level + 1]) {
      f.level++;
      res.levelsGained.push(f.level);
      const oldMax = f.maxHp;
      f.maxHp = getStats(f).hp;
      if (f.alive) f.hp += f.maxHp - oldMax; // lên cấp: tăng cả máu hiện tại tương ứng
      CLASSES[f.classId].skills.forEach(function (s) {
        if (s.lvl === f.level) res.unlocked.push({ lvl: s.lvl, name: s.name, isUltimate: false });
      });
      if (f.level === CFG.ULT_UNLOCK_LEVEL) {
        res.unlocked.push({ lvl: f.level, name: CLASSES[f.classId].ultimate.name, isUltimate: true });
      }
    }
    res.newLevel = f.level;
    return res;
  }

  /* ============================ ĐRL ============================ */
  /* Kết quả combat giữa 2 người: người thắng cướp 50% ĐRL người thua (người thua mất đúng số đó),
     cộng EXP cho người thắng. Trả về tóm tắt để UI hiển thị. */
  function resolveDuel(winner, loser) {
    const gain = Math.floor(loser.drl * CFG.DRL_STEAL_PCT);                         // người thắng cướp 25%
    const lost = loser.isPlayer ? Math.floor(loser.drl * CFG.DRL_PLAYER_LOSS_PCT) : gain; // người chơi thua: -50%
    loser.drl -= lost;
    winner.drl += gain;
    const exp = addExp(winner, expForWin(winner, loser));
    return { winnerId: winner.id, loserId: loser.id, drl: gain, lost: lost, exp: exp };
  }
  function tiuPenalty(f, amount) {
    const a = Math.min(f.drl, amount != null ? amount : CFG.TIU_PENALTY);
    f.drl -= a;
    return a;
  }
  function aliveFighters() {
    return state.order.map(function (id) { return state.fighters[id]; }).filter(function (f) { return f.alive; });
  }
  /* Thứ tự từ yếu -> mạnh: ĐRL thấp, rồi EXP thấp, rồi ngẫu nhiên */
  function rankAscending() {
    return shuffle(aliveFighters()).sort(function (a, b) {
      return (a.drl - b.drl) || (a.exp - b.exp);
    });
  }
  /* Cuối đêm Chapter 1: loại người có ĐRL thấp nhất. Người gọi tự xử lý nếu playerEliminated. */
  function eliminateLowest() {
    const list = rankAscending();
    if (list.length <= 2) return null;
    const out = list[0];
    out.alive = false; out.inParty = false;
    return { eliminated: out, playerEliminated: out.isPlayer, remaining: aliveFighters().length };
  }

  /* ============================ LA PEACE / SPELL BREAKER ============================ */
  /* Nhặt 1 Mảnh La Peace. Trả về {count, unlocked}: unlocked=true đúng lần thứ 3 (học Spell Breaker). */
  function addLaPeace(f) {
    f.laPeace = Math.min(CFG.LAPEACE_NEEDED, (f.laPeace || 0) + 1);
    let unlocked = false;
    if (f.laPeace >= CFG.LAPEACE_NEEDED && !f.spellBreaker) { f.spellBreaker = true; unlocked = true; }
    return { count: f.laPeace, unlocked: unlocked };
  }

  /* ============================ TRUST / PARTY ============================ */
  function talk(npc) {
    npc.trust = Math.min(CFG.TRUST_MAX, npc.trust + 1);
    return npc.trust;
  }
  function partyAllies() {
    return aliveFighters().filter(function (f) { return !f.isPlayer && f.inParty; });
  }
  function canRecruit(npc) {
    if (!npc.alive || npc.isPlayer) return { ok: false, reason: "invalid" };
    if (npc.inParty) return { ok: false, reason: "already" };
    if (npc.trust < CFG.RECRUIT_TRUST) return { ok: false, reason: "trust" };
    if (partyAllies().length >= CFG.PARTY_MAX_ALLIES) return { ok: false, reason: "full" };
    return { ok: true };
  }
  function recruit(npc) {
    const chk = canRecruit(npc);
    if (chk.ok) npc.inParty = true;
    return chk;
  }
  function dismiss(npc) { npc.inParty = false; }

  /* ============================ KHO ĐỒ / CHẾ TẠO ============================ */
  function countItem(f, id) { return f.items[id] || 0; }
  function addItem(f, id, n) { f.items[id] = (f.items[id] || 0) + (n == null ? 1 : n); return f.items[id]; }
  function removeItem(f, id, n) {
    n = n == null ? 1 : n;
    if (countItem(f, id) < n) return false;
    f.items[id] -= n;
    if (f.items[id] <= 0) delete f.items[id];
    return true;
  }
  function addComponent(f, id, n) { f.components[id] = (f.components[id] || 0) + (n == null ? 1 : n); }
  function canCraft(f, itemId) {
    const r = RECIPES[itemId];
    if (!r) return false;
    return Object.keys(r).every(function (k) { return (f.components[k] || 0) >= r[k]; });
  }
  function craft(f, itemId) {
    if (!canCraft(f, itemId)) return false;
    const r = RECIPES[itemId];
    Object.keys(r).forEach(function (k) { f.components[k] -= r[k]; });
    addItem(f, itemId, 1);
    return true;
  }
  /* Thắng NPC -> cướp 1 vật phẩm ngẫu nhiên (nếu có) */
  function lootRandomItem(from, to) {
    const keys = Object.keys(from.items).filter(function (k) { return from.items[k] > 0; });
    if (!keys.length) return null;
    const id = keys[Math.floor(rng() * keys.length)];
    removeItem(from, id, 1);
    addItem(to, id, 1);
    return id;
  }

  /* ============================ MÔ PHỎNG NPC ĐÁNH NHAU NGẦM ============================ */
  function power(f) {
    const s = getStats(f);
    return (s.atk * 2 + s.def + s.spd + s.hp / 2 + f.level * 10) * (0.85 + rng() * 0.3);
  }
  function simulateDuel(a, b) {
    const w = power(a) >= power(b) ? a : b;
    const l = w === a ? b : a;
    const r = resolveDuel(w, l);
    lootRandomItem(l, w);
    return r;
  }
  /* Mỗi đêm: các NPC còn sống, không ở trong đội người chơi, bắt cặp ngẫu nhiên đánh nhau */
  function simulateNpcNight() {
    const pool = shuffle(aliveFighters().filter(function (f) { return !f.isPlayer && !f.inParty; }));
    const out = [];
    for (let i = 0; i + 1 < pool.length; i += 2) out.push(simulateDuel(pool[i], pool[i + 1]));
    return out;
  }

  /* ============================ KHỞI TẠO / LƯU ============================ */
  function scoreQuiz(answers) {
    // answers: mảng các classId đã chọn (mỗi câu 1 đáp án) -> classId nhiều điểm nhất, hoà thì ngẫu nhiên
    const score = {};
    CLASS_IDS.forEach(function (c) { score[c] = 0; });
    answers.forEach(function (c) { if (score[c] != null) score[c]++; });
    const max = Math.max.apply(null, CLASS_IDS.map(function (c) { return score[c]; }));
    const top = CLASS_IDS.filter(function (c) { return score[c] === max; });
    return top[Math.floor(rng() * top.length)];
  }

  function init(opts) {
    opts = opts || {};
    if (opts.rng) setRng(opts.rng);
    const playerClass = opts.playerClass || CLASS_IDS[Math.floor(rng() * CLASS_IDS.length)];
    const rest = shuffle(CLASS_IDS.filter(function (c) { return c !== playerClass; }));
    state = { fighters: {}, order: [], night: 0, chapter: 1 };
    const name = (opts.playerName || "").trim() || DEFAULT_PLAYER_NAME;
    const player = createFighter({ id: "PLAYER", name: name, isPlayer: true, classId: playerClass });
    state.fighters.PLAYER = player; state.order.push("PLAYER");
    NPC_ROSTER.forEach(function (n, i) {
      const f = createFighter({ id: n.id, name: n.name, title: n.title, legacyKey: n.legacyKey,
                                homeRoom: n.homeRoom, classId: rest[i] });
      state.fighters[n.id] = f; state.order.push(n.id);
    });
    // Khởi đầu: mỗi người có sẵn 1 Bim Bim (giống inventory cũ)
    state.order.forEach(function (id) { addItem(state.fighters[id], "bimbim", 1); });
    return state;
  }
  const get = function (id) { return state.fighters[id]; };
  const player = function () { return state.fighters.PLAYER; };
  const getState = function () { return state; };
  const serialize = function () { return state ? JSON.parse(JSON.stringify(state)) : null; };
  const load = function (data) { state = data ? JSON.parse(JSON.stringify(data)) : null; return state; };

  /* ============================ XUẤT RA NGOÀI ============================ */
  const RPG = {
    CFG: CFG, CLASSES: CLASSES, CLASS_IDS: CLASS_IDS, CLASS_QUIZ: CLASS_QUIZ,
    ITEMS: ITEMS, RELICS: RELICS, COMPONENTS: COMPONENTS, RECIPES: RECIPES, NPC_ROSTER: NPC_ROSTER,
    DEFAULT_PLAYER_NAME: DEFAULT_PLAYER_NAME,
    setRng: setRng, scoreQuiz: scoreQuiz, init: init, get: get, player: player,
    getState: getState, serialize: serialize, load: load,
    getStats: getStats, getSkills: getSkills, getUltimate: getUltimate,
    addRage: addRage, rageOnAttack: rageOnAttack, rageOnSkill: rageOnSkill, canUseUltimate: canUseUltimate,
    heal: heal, healPct: healPct, regen: regen, healAll: healAll,
    expToNext: expToNext, expForWin: expForWin, addExp: addExp,
    resolveDuel: resolveDuel, tiuPenalty: tiuPenalty, aliveFighters: aliveFighters,
    rankAscending: rankAscending, eliminateLowest: eliminateLowest,
    addLaPeace: addLaPeace,
    talk: talk, partyAllies: partyAllies, canRecruit: canRecruit, recruit: recruit, dismiss: dismiss,
    countItem: countItem, addItem: addItem, removeItem: removeItem, addComponent: addComponent,
    canCraft: canCraft, craft: craft, lootRandomItem: lootRandomItem,
    simulateDuel: simulateDuel, simulateNpcNight: simulateNpcNight
  };
  global.RPG = RPG;
  if (typeof module !== "undefined" && module.exports) module.exports = RPG;
})(typeof window !== "undefined" ? window : globalThis);