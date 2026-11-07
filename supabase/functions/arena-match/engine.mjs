/* FILE TỰ SINH bởi tools/build_engine.cjs — KHÔNG sửa tay. */
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
    MAX_LEVEL: 8,
    EXP_TABLE: [0, 0, 30, 80, 150, 220, 310, 420, 560], // EXP_TABLE[lv] = EXP tích lũy cần để đạt lv
    GROWTH_LEVELS: [2, 4, 6, 8],               // Lv không có skill -> cộng chỉ số
    GROWTH_PCT: 0.10,                    // +10% chỉ số gốc mỗi mốc
    ULT_UNLOCK_LEVEL: 1,                 // Ultimate dùng được từ Lv1 (chỉ cần đầy Nộ)

    EXP_BASE_WIN: 20,
    EXP_PER_ENEMY_LEVEL: 10,
    EXP_UNDERDOG_BONUS: 0.5,             // thắng đối thủ Lv cao hơn: +50%

    START_DRL: 30,
    DRL_STEAL_PCT: 0.25,                 // THẮNG: cướp 25% ĐRL của kẻ thua
    DRL_PLAYER_LOSS_PCT: 0.25,            // người chơi THUA: bị trừ 25% ĐRL (NPC đánh nhau với nhau: kẻ thua mất đúng phần bị cướp)
    TIU_PENALTY: 5,                      // The TIU bắt được người chơi (chỉ Chapter 1)

    BATTLE_MINUTES: 60,                  // 1 trận đấu tốn 60 phút đồng hồ trong game
    REGEN_PER_HOUR: 0.10,                // hồi dần 10% HP tối đa mỗi giờ game (ngoài trận)
    REST_HEAL_PCT: 0.35,                 // "Nghỉ ngơi 1 giờ" ở Căn tin: +35% HP tối đa

    RAGE_MAX: 100,
    RAGE_ON_ATTACK: 25,
    RAGE_ON_SKILL: 35,

    LAPEACE_NEEDED: 3,                   // tổng số loại Mảnh La Peace (mỗi loại cho 1 sức mạnh riêng, xem LAPEACE_PIECES)
    LAPEACE_DEADLINE_MIN: 180,           // 03:00 — mảnh chưa ai nhặt sẽ rơi vào tay 1 đối thủ ngẫu nhiên
    MANA_TRANSFER_PCT: 0.5,              // Mana Transfer: sau khi tung Ultimate được hồi lại 50% thanh Nộ
    DIE_TWICE_HP_PCT: 0.5,               // Die Twice: hồi sinh với 50% HP tối đa (1 lần mỗi trận)

    TRUST_MAX: 3,
    RECRUIT_TRUST: 2,
    PARTY_MAX_ALLIES: 1,                 // tối đa 2 đồng đội + người chơi = 3 người (giống PARTY_DEF cũ)

    // hồi chiêu đề xuất (spec chưa nêu) — Ultimate không dùng CD mà dùng Nộ đầy
    SKILL_CD: { 1: 2, 3: 3, 5: 4, 7: 4 },
    ULT_AWAKEN_LEVEL: 8, ULT_AWAKEN_MULT: 1.25,   // Lv8: Ultimate thức tỉnh +25% sát thương

    // ---- Thể lực khi di chuyển giữa các khu vực ----
    STAMINA_MAX: 100,
    STAMINA_MOVE_COST: 20,               // mỗi lần đổi khu vực (5 lần thì cạn)
    STAMINA_REGEN_PER_MIN: 0.4,          // hồi dần theo phút game (24/giờ)
    STAMINA_REST_GAIN: 50,               // "Nghỉ ngơi 1 giờ" ở Căn tin
    AMBUSH_REARM: 40,                    // (cũ) không còn dùng
    EXHAUST_HP_PCT: 0.5,                 // đi khi thiếu thể lực -> bị đánh lén: vào trận chỉ còn tối đa 50% HP, mọi skill đang hồi chiêu

    // ---- The TIU là boss: bị bắt = đấu với TIU (hiện thân của mọi skill) ----
    TIU_TAINTED_WIN: 8,                  // thắng TIU: +8 ĐRL vấy bẩn
    TIU_HP_BASE: 190, TIU_HP_PER_LV: 42, // HP TIU = base + perLv * Lv người chơi
    TIU_ATK_BASE: 13, TIU_ATK_PER_LV: 1.5,
    TIU_DEF_BASE: 12, TIU_DEF_PER_LV: 2,
    TIU_SPD: 45,

    // ---- Đồng đội bỏ đội nếu người chơi không kiếm thêm ĐRL ----
    PARTY_CHECK_MIN: 120,                // cứ mỗi 120 phút game kiểm tra 1 lần
    PARTY_MIN_GAIN: 5,                   // phải kiếm thêm ít nhất 5 ĐRL trong mỗi kỳ
    PARTY_LEAVE_AMBUSH: 0.25,            // 25% đồng đội rời đội sẽ đánh lén người chơi

    // ---- Thể Lực (TL): tài nguyên thứ hai — mỗi skill thường tốn TL (Ultimate chỉ tốn Nộ) ----
    SP_MAX: 100, SP_START: 50,           // mỗi trận bắt đầu với 50/100 TL
    SP_COST: { 1: 20, 3: 30, 5: 40, 7: 50 }, // chi phí theo cấp skill (skill mở ở Lv1/3/5/7)
    SP_REGEN: 5,                         // hồi mỗi lượt
    SP_ON_ATTACK: 5,                     // đánh thường: +5 TL
    SP_ON_DEFEND: 25,                    // phòng thủ: +25 TL (hồi sức)

    // ---- Cân bằng PvP (chỉ áp dụng cho fighter có cờ pvp=true; chế độ chơi đơn KHÔNG bị ảnh hưởng) ----
    // Hệ số nhân chỉ số gốc theo class, tìm bằng mô phỏng round-robin 5 class ở Lv3/4/6/8 (xem tools/balance).
    PVP_CLASS: {
      fighter: { hp: 0.94, atk: 1.15, def: 0.76, spd: 1.23 },
      assassin: { hp: 1.00, atk: 0.87, def: 0.54, spd: 0.76 },
      mage: { hp: 0.87, atk: 0.94, def: 0.88, spd: 1.50 },
      healer: { hp: 1.07, atk: 1.24, def: 1.24, spd: 1.15 },
      summoner: { hp: 1.00, atk: 1.16, def: 1.02, spd: 1.15 }
    },

    // ---- Hệ thuộc tính & chí mạng ----
    WEAK_MULT: 1.3,                      // đánh trúng YẾU ĐIỂM: x1.3 sát thương, +WEAK_RAGE Nộ cho người đánh
    RESIST_MULT: 0.7,                    // đánh vào hệ KHÁNG: x0.7
    WEAK_RAGE: 10,
    CRIT_BASE: 0.05, CRIT_PER_SPD: 0.0015, CRIT_WEAK_BONUS: 0.15, CRIT_CAP: 0.60,   // tỉ lệ chí mạng = base + SPD*perSpd (+15% nếu trúng yếu điểm)
    CRIT_MULT: 1.5
  };

  /* ------------------------- HỆ THUỘC TÍNH ------------------------- */
  const ELEMENTS = {
    slash:   { name: "Chém",      icon: "⚔️" },
    fire:    { name: "Hỏa",       icon: "🔥" },
    ice:     { name: "Băng",      icon: "❄️" },
    thunder: { name: "Lôi",       icon: "⚡" },
    poison:  { name: "Độc",       icon: "☠️" },
    void:    { name: "Hư Không",  icon: "🌀" }
  };
  /* Vòng khắc chế: Chém > Pháp sư · Lôi > Đấu sĩ · Băng > Sát thủ · Độc > Triệu hồi · Hỏa > Hộ tế · Hư Không > The TIU */
  const AFFINITY = {
    fighter:  { weak: "thunder", resist: "slash",   basic: "slash" },
    assassin: { weak: "ice",     resist: "void",    basic: "slash" },
    mage:     { weak: "slash",   resist: "thunder", basic: "fire" },
    healer:   { weak: "fire",    resist: "poison",  basic: "poison" },
    summoner: { weak: "poison",  resist: "fire",    basic: "void" }
  };
  const SKILL_ELEMENT = {
    // skill gây sát thương -> hệ
    fireball: "fire", iceWall: "ice", toxicBlast: "poison", finisher: "slash", shadowStep: "slash", meteor: "fire", plague: "poison",
    // Ultimate
    lastStopper: "slash", perfectKill: "slash", thunder: "thunder", bitterMedicine: "poison", voidSummon: "void"
  };
  /* ------------------------- TÀI NĂNG (Talent) -------------------------
     Điểm tài năng: 1 điểm ở Lv1, +1 mỗi 2 cấp (Lv3/5/7) và +1 cho mỗi nhiệm vụ đồng đội (tối đa 8 điểm cho 9 tài năng). Mỗi tài năng tốn 1 điểm.
     3 nhánh x 3 bậc; bậc sau cần bậc trước cùng nhánh. Chỉ có 5 điểm cho 9 tài năng -> phải chọn build. */
  const TALENT_BRANCHES = {
    atk: { name: "CÔNG KÍCH", icon: "⚔️", desc: "Chí mạng và khai thác yếu điểm" },
    def: { name: "BỀN BỈ",    icon: "🛡️", desc: "Trụ lâu, phòng thủ hiệu quả" },
    sp:  { name: "THỂ LỰC",  icon: "🔷", desc: "Dùng skill dày hơn, nhịp độ nhanh" }
  };
  const TALENTS = {
    atk1: { branch: "atk", tier: 1, name: "Mắt Cáo",   icon: "🦅", short: "+10% chí mạng",                 desc: "+10% tỉ lệ chí mạng." },
    atk2: { branch: "atk", tier: 2, name: "Đột Phá",   icon: "💥", short: "Yếu điểm ×1.45",                desc: "Đánh trúng YẾU ĐIỂM: sát thương ×1.45 (thay vì ×1.3)." },
    atk3: { branch: "atk", tier: 3, name: "Sát Ý",     icon: "🩸", short: "Chí mạng ×2, Ult +30%",         desc: "Chí mạng gây ×2.0 sát thương và Ultimate mạnh thêm 30%." },
    def1: { branch: "def", tier: 1, name: "Da Trâu",   icon: "🐂", short: "+15% HP",                       desc: "+15% HP tối đa." },
    def2: { branch: "def", tier: 2, name: "Gồng Mình", icon: "🧱", short: "Thủ giảm 65%",                  desc: "Phòng thủ giảm 65% sát thương (đỡ Ultimate giảm 80%), +10 Nộ thêm khi bị đánh." },
    def3: { branch: "def", tier: 3, name: "Bất Khuất", icon: "🔥", short: "1 lần trụ 1 HP / trận",         desc: "Mỗi trận 1 lần: đòn chí tử chỉ để lại 1 HP." },
    sp1:  { branch: "sp",  tier: 1, name: "Điềm Tĩnh", icon: "🧘", short: "+TL đầu trận & mỗi lượt",       desc: "+15 Thể Lực đầu trận, hồi thêm +3 Thể Lực mỗi lượt." },
    sp2:  { branch: "sp",  tier: 2, name: "Tiết Kiệm", icon: "💧", short: "Skill rẻ hơn 25%",              desc: "Skill tốn ít hơn 25% Thể Lực." },
    sp3:  { branch: "sp",  tier: 3, name: "Dồn Nộ",    icon: "⚡", short: "Skill +15 Nộ, hồi chiêu −1",    desc: "Dùng skill: +15 Nộ thêm và hồi chiêu ngắn hơn 1 lượt." }
  };

  function ultAwakened(f) { return !!(f && !f.tiu && f.level >= CFG.ULT_AWAKEN_LEVEL); }
  function hasTalent(f, id) { return !!(f && !f.tiu && f.talents && f.talents[id]); }
  function talentSpent(f) { return Object.keys(f.talents || {}).length; }
  function talentEarned(f) { return 1 + Math.floor((f.level - 1) / 2) + (f.bonusPoints || 0); }   // Lv1:1, Lv3:2, Lv5:3, Lv7:4 (+ nhiệm vụ)
  function talentPoints(f) { return f && f.isPlayer ? Math.max(0, talentEarned(f) - talentSpent(f)) : 0; }
  function canTakeTalent(f, id) {
    const t = TALENTS[id]; if (!t || !f.isPlayer || hasTalent(f, id)) return false;
    if (talentPoints(f) < 1) return false;
    if (t.tier > 1 && !hasTalent(f, t.branch + (t.tier - 1))) return false;
    return true;
  }
  function takeTalent(f, id) {
    if (!canTakeTalent(f, id)) return false;
    f.talents = f.talents || {}; f.talents[id] = true;
    syncMaxHp(f); return true;
  }
  const NPC_BUILDS = {
    fighter:  ["def1", "def2", "atk1", "def3", "atk2", "atk3"],
    assassin: ["atk1", "atk2", "atk3", "sp1", "sp2", "def1"],
    mage:     ["sp1", "atk1", "sp2", "atk2", "atk3", "def1"],
    healer:   ["def1", "sp1", "sp2", "def2", "sp3", "def3"],
    summoner: ["sp1", "def1", "sp2", "atk1", "def2", "atk2"]
  };
  /* NPC / quái tự học tài năng theo class. extra = điểm cộng thêm (đêm càng muộn NPC càng "tinh"). */
  function autoTalents(f, extra) {
    if (!f || f.isPlayer || f.tiu || f.minion) return;
    const n = 1 + Math.floor((f.level - 1) / 2) + (extra || 0), list = NPC_BUILDS[f.classId] || NPC_BUILDS.fighter;
    f.talents = {};
    list.slice(0, Math.max(0, n)).forEach(function (id) { f.talents[id] = true; });
    const st = getStats(f), r = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.maxHp = st.hp; f.hp = Math.max(1, Math.round(f.maxHp * r));
  }
  /* Đặt level tuyệt đối (cho phép GIẢM) — dùng khi random cấp đối thủ mỗi lần chạm trán */
  function forceLevel(f, lv) {
    lv = Math.max(1, Math.min(CFG.MAX_LEVEL, lv));
    const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.level = lv; f.exp = CFG.EXP_TABLE[lv];
    f.maxHp = getStats(f).hp; f.hp = Math.max(1, Math.round(f.maxHp * ratio));
  }
  function resetTalents(f) { f.talents = {}; syncMaxHp(f); }
  function syncMaxHp(f) {
    const st = getStats(f), old = f.maxHp || st.hp;
    f.maxHp = st.hp;
    f.hp = Math.min(f.maxHp, Math.max(1, (f.hp || old) + Math.max(0, f.maxHp - old)));
  }

  function affinityOf(f) {
    if (!f) return {};
    if (f.tiu) return { weak: f.tiuWeak || "void", resist: null, basic: "void" };
    return AFFINITY[f.classId] || {};
  }
  function basicElement(f) { return affinityOf(f).basic || null; }
  function elementLabel(key) { const e = ELEMENTS[key]; return e ? e.icon + " " + e.name : "—"; }

  /* ============================ 2) CLASS ============================ */
  // effects: danh sách mô tả hiệu ứng cho combat engine.
  //   power = hệ số sát thương nhân với ATK (đề xuất, chỉnh tuỳ ý)
  const CLASSES = {
    fighter: {
      id: "fighter", name: "Đấu Sĩ", icon: "🛡️",
      base: { hp: 100, atk: 20, def: 60, spd: 20 },
      passive: { id: "ironWill", name: "Ý chí thép", rageOnHit: 35,
                 desc: "Mỗi lần bị tấn công trúng, tích thêm 35 Nộ." },
      skills: [
        { id: "guard", lvl: 1, name: "Rho Aias", target: "self",
          desc: "Tăng 40 DEF trong 2 turn.",
          effects: [{ type: "buff", stat: "def", amount: 40, turns: 2 }] },
        { id: "counter", lvl: 3, name: "Phản đòn", target: "self",
          desc: "Miễn nhiễm sát thương 1 turn. Nếu địch ra ĐÒN THƯỜNG: phản lại 100% sát thương; skill/Ultimate thì không phản được.",
          effects: [{ type: "immune", turns: 1 }, { type: "reflect", pct: 1.0, turns: 1 }] },
        { id: "lastStand", lvl: 5, name: "Cửu mệnh", target: "self",
          desc: "Xóa mọi debuff, tăng 20 ATK và 20 DEF trong 3 turn.",
          effects: [{ type: "cleanse" },
                    { type: "buff", stat: "atk", amount: 20, turns: 3 },
                    { type: "buff", stat: "def", amount: 20, turns: 3 }] },
        { id: "bulwark", lvl: 7, name: "Thành lũy bất khuất", target: "self",
          desc: "+60 DEF trong 3 turn, hồi 15% HP tối đa và +25 Nộ.",
          effects: [{ type: "buff", stat: "def", amount: 60, turns: 3 }, { type: "healPct", pct: 0.15 }, { type: "rage", amount: 25 }] }
      ],
      ultimate: { id: "lastStopper", name: "Chốt chặn cuối cùng", target: "aoe",
        desc: "Mất 25% HP hiện tại, gây sát thương cực lớn lên toàn bộ kẻ địch.",
        effects: [{ type: "selfCostCurHpPct", pct: 0.25 }, { type: "damage", power: 4.5 }] }
    },

    assassin: {
      id: "assassin", name: "Sát Thủ", icon: "🗡️",
      base: { hp: 60, atk: 70, def: 10, spd: 60 },
      skills: [
        { id: "nimble", lvl: 1, name: "Trace on ", target: "self",
          desc: "Tăng 40 ATK trong 2 turn.",
          effects: [{ type: "buff", stat: "atk", amount: 40, turns: 2 }] },
        { id: "finisher", lvl: 3, name: "Xạ Sát Bách Thủ", target: "single",
          desc: "Gây sát thương lớn lên 1 kẻ địch.",
          effects: [{ type: "damage", power: 1.3 }] },
        { id: "instinct", lvl: 5, name: "Hòa vào màn đêm", target: "self",
          desc: "Tàng hình 2 turn (không thể bị chỉ định, chỉ nhận sát thương từ skill AoE).",
          effects: [{ type: "stealth", turns: 2 }] },
        { id: "shadowStep", lvl: 7, name: "Ảnh trảm", target: "single",
          desc: "Chém cực nhanh gây sát thương rất lớn và +30 SPD trong 2 turn.",
          effects: [{ type: "damage", power: 1.9 }, { type: "buff", stat: "spd", amount: 30, turns: 2 }] }
      ],
      ultimate: { id: "perfectKill", name: "Vô hạn kiếm giới", target: "single",
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
                    { type: "recastExplode", powerPerTurn: 0.5 }] },
        { id: "meteor", lvl: 7, name: "Thiên thạch vẫn lạc", target: "aoe",
          desc: "Mưa thiên thạch gây sát thương lớn lên toàn bộ kẻ địch, giảm 15 DEF của chúng trong 2 turn.",
          effects: [{ type: "damage", power: 1.3 }, { type: "debuff", stat: "def", amount: 15, turns: 2 }] }
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
          effects: [{ type: "poisonDamage", powerPerStack: 0.6, baseStacks: 1 }] },
        { id: "plague", lvl: 7, name: "Đại dịch hạch", target: "single",
          desc: "Chồng ngay 3 tầng độc lên 1 mục tiêu (độc mạnh hơn).",
          effects: [{ type: "poisonStack", amount: 3, max: 3, dotPower: 0.7 }] }
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
          effects: [{ type: "healSummons", pct: 0.4 }] },
        { id: "legion", lvl: 7, name: "Hiệu triệu quân đoàn", target: "self",
          desc: "+50 ATK trong 3 turn, +30 Nộ và +20 Thể Lực.",
          effects: [{ type: "buff", stat: "atk", amount: 50, turns: 3 }, { type: "rage", amount: 30 }, { type: "sp", amount: 20 }] }
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
    bimbim:  { name: "Bim Bim", icon: "🍟", usable: ["combat", "map"], target: "self", price: 8,
               desc: "Hồi 30% HP tối đa.",
               effects: [{ type: "healPct", pct: 0.30 }] },
    water:   { name: "Nước tăng lực", icon: "🥤", usable: ["combat"], target: "self", price: 6,
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
    antidote:{ name: "Thuốc giải", icon: "💊", usable: ["combat", "map"], target: "self", price: 10,
               desc: "Xóa Cháy, Độc, Đóng băng, Tê liệt.",
               effects: [{ type: "cleanse", only: ["burn", "poison", "freeze", "paralyze"] }] },
    tainted_bimbim: { name: "Bim Bim Nhiễm Bẩn", icon: "🖤", usable: ["combat", "map"], target: "self", price: null, taintedPrice: 3, special: true,
               desc: "Hồi 60% HP tối đa, +30 Nộ và +30 Thể Lực.",
               effects: [{ type: "healPct", pct: 0.60 }, { type: "rage", amount: 30 }, { type: "sp", amount: 30 }] },
    tainted_core:    { name: "Lõi Hận Thù", icon: "🔮", usable: ["combat"], target: "self", price: null, taintedPrice: 6, special: true,
               desc: "Lập tức đầy thanh Nộ (Ultimate sẵn sàng) và đầy Thể Lực.",
               effects: [{ type: "rage", amount: 100 }, { type: "sp", amount: 100 }] },
    tainted_shroud:  { name: "Áo Choàng Vấy Bẩn", icon: "🧥", usable: ["combat"], target: "self", price: null, taintedPrice: 5, special: true,
               desc: "+45 DEF và +20 ATK trong 3 turn.",
               effects: [{ type: "buff", stat: "def", amount: 45, turns: 3 }, { type: "buff", stat: "atk", amount: 20, turns: 3 }] },
    armor:   { name: "Áo giáp bìa carton", icon: "📦", usable: ["combat"], target: "self", price: null,
               desc: "+20 DEF trong 3 turn.",
               effects: [{ type: "buff", stat: "def", amount: 20, turns: 3 }] }
  };
  const RELICS = {
    lapeace: { name: "Mảnh La Peace", icon: "💠" }
  };
  /* Mỗi loại Mảnh La Peace = 1 sức mạnh đặc biệt cho người nắm giữ (người chơi lẫn NPC). Mỗi loại chỉ có 1 mảnh. */
  const LAPEACE_ORDER = ["spellBreaker", "manaTransfer", "dieTwice"];
  const LAPEACE_PIECES = {
    spellBreaker: { id: "spellBreaker", name: "Spell Breaker", icon: "✦",
      desc: "Khi kẻ địch tung ULTIMATE lên bạn sẽ hiện QTE parry: bấm đúng để phá giải hoàn toàn đòn đó." },
    manaTransfer: { id: "manaTransfer", name: "Mana Transfer", icon: "🔷",
      desc: "Sau mỗi lần tung ULTIMATE, bạn được hồi lại 50% thanh Nộ." },
    dieTwice:     { id: "dieTwice", name: "Die Twice", icon: "♻️",
      desc: "Sau khi chết lần đầu trong một trận, bạn hồi sinh với 50% HP tối đa." }
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

  /* ------------------------- TRANG BỊ (chế tạo từ linh kiện, 3 ô: vũ khí / giáp / bùa) -------------------------
     Chế tạo ở bàn chế tạo (Căn tin) -> tự động mang vào ô tương ứng, thay món cũ. */
  const EQUIP_SLOTS = { weapon: { name: "Vũ khí", icon: "🗡️" }, armor: { name: "Giáp", icon: "🦺" }, charm: { name: "Bùa", icon: "🍀" } };
  const EQUIPMENT = {
    bat:    { slot: "weapon", name: "Gậy Bóng Chày Gắn Đinh", icon: "🏏", recipe: { pipe: 2, tape: 1 },           bonus: { atk: 8 } },
    laser:  { slot: "weapon", name: "Kiếm Pin Laser",          icon: "🔦", recipe: { pin: 3, pipe: 2, wire: 1 },   bonus: { atk: 16, crit: 0.05 } },
    vest:   { slot: "armor",  name: "Áo Giáp Ống Thép",        icon: "🦺", recipe: { pipe: 3, tape: 2 },           bonus: { def: 10, hp: 15 } },
    plate:  { slot: "armor",  name: "Giáp Phế Liệu Gia Cố",    icon: "🛡️", recipe: { pipe: 4, tape: 3, wire: 1 },  bonus: { def: 20, hp: 30 } },
    lucky:  { slot: "charm",  name: "Bùa Sinh Viên May Mắn",   icon: "🍀", recipe: { wire: 2, pin: 1, tape: 1 },   bonus: { crit: 0.08, spd: 5 } },
    core:   { slot: "charm",  name: "Lõi Pin Cộng Hưởng",      icon: "🔋", recipe: { pin: 3, wire: 2 },            bonus: { sp: 3, spd: 5 } }
  };
  function equipBonus(f, key) {
    let t = 0;
    if (!f || f.tiu || !f.equip) return 0;
    Object.keys(f.equip).forEach(function (slot) { const e = EQUIPMENT[f.equip[slot]]; if (e && e.bonus[key]) t += e.bonus[key]; });
    return t;
  }
  function canCraftEquip(f, id) {
    const e = EQUIPMENT[id]; if (!e || (f.equip && f.equip[e.slot] === id)) return false;
    return Object.keys(e.recipe).every(function (k) { return (f.components[k] || 0) >= e.recipe[k]; });
  }
  function craftEquip(f, id) {
    if (!canCraftEquip(f, id)) return false;
    const e = EQUIPMENT[id];
    Object.keys(e.recipe).forEach(function (k) { f.components[k] -= e.recipe[k]; });
    f.equip = f.equip || {}; f.equip[e.slot] = id;
    const st = getStats(f); f.maxHp = st.hp; f.hp = Math.min(st.hp, f.hp + (e.bonus.hp || 0));
    return true;
  }

  /* ============================ 5) DANH SÁCH NHÂN VẬT ============================ */
  const DEFAULT_PLAYER_NAME = "Tôi Yêu UIT";
  // legacyKey: khoá cũ trong script.js (S.npc.B / S.npc.E) để dễ nối code về sau
  const NPC_ROSTER = [
    { id: "WIBU",  legacyKey: "E", name: "Wibu Việt Nhật",      title: "Lolicon", homeRoom: "E" },
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
    if (f.statsOverride) return Object.assign({}, f.statsOverride);   // The TIU
    const b = CLASSES[f.classId].base;
    let mult = 1;
    CFG.GROWTH_LEVELS.forEach(function (lv) { if (f.level >= lv) mult += CFG.GROWTH_PCT; });
    const pm = (f.pvp && CFG.PVP_CLASS && CFG.PVP_CLASS[f.classId]) || { hp: 1, atk: 1, def: 1, spd: 1 };
    return {
      hp: Math.round(b.hp * mult * (hasTalent(f, "def1") ? 1.15 : 1) * pm.hp) + equipBonus(f, "hp"), atk: Math.round(b.atk * mult * pm.atk) + equipBonus(f, "atk"),
      def: Math.round(b.def * mult * pm.def) + equipBonus(f, "def"), spd: Math.round(b.spd * mult * pm.spd) + equipBonus(f, "spd")
    };
  }

  function createFighter(o) {
    const f = {
      id: o.id, name: o.name, title: o.title || "", isPlayer: !!o.isPlayer,
      legacyKey: o.legacyKey || null, classId: o.classId, homeRoom: o.homeRoom || null,
      level: 1, exp: 0, hp: 0, maxHp: 0, rage: 0, pieces: [], laPeace: 0, spellBreaker: false,
      drl: CFG.START_DRL, trust: 0, inParty: false, alive: true,
      items: {}, components: {}, statuses: []
    };
    f.maxHp = getStats(f).hp;
    f.hp = f.maxHp;
    return f;
  }

  /* ============================ SKILL ============================ */
  function allClassSkills() {
    const out = [];
    CLASS_IDS.forEach(function (cid) { CLASSES[cid].skills.forEach(function (s) { out.push(s); }); });
    return out;
  }
  function getSkills(f) {
    if (f.tiu) return allClassSkills().map(function (s) { return Object.assign({ cd: CFG.SKILL_CD[s.lvl], unlocked: true }, s); });
    const c = CLASSES[f.classId];
    return c.skills.map(function (s) {
      return Object.assign({ cd: CFG.SKILL_CD[s.lvl], unlocked: f.level >= s.lvl }, s);
    });
  }
  function getUltimate(f) {
    if (f.tiu) {   // TIU xoay vòng Ultimate của cả 5 class
      const list = CLASS_IDS.map(function (cid) { return CLASSES[cid].ultimate; });
      return Object.assign({ unlocked: true, rageCost: CFG.RAGE_MAX }, list[(f.ultIdx || 0) % list.length]);
    }
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
    // Đánh bại kẻ nắm giữ Mảnh La Peace -> lấy hết mảnh của họ (người chơi thua thì KHÔNG bị mất mảnh)
    const pieces = loser.isPlayer ? [] : transferPieces(loser, winner);
    return { winnerId: winner.id, loserId: loser.id, drl: gain, lost: lost, exp: exp, pieces: pieces };
  }
  /* The TIU: hiện thân của TẤT CẢ người từng tham gia — mang đủ skill của mọi class. Mạnh lên theo Lv người chơi. */
  const TIU_VARIANTS = [
    { weak: "void",    name: "The TIU",              title: "Hiện thân của tất cả" },
    { weak: "ice",     name: "The TIU · Bóng Băng",  title: "Cái lạnh của những người đã bị loại" },
    { weak: "thunder", name: "The TIU · Thần Lôi",   title: "Cơn giận của những người đã bị loại" },
    { weak: "fire",    name: "The TIU · Hỏa Ngục",   title: "Hiện thân cuối cùng" }
  ];
  function makeTiu(playerLv, variantIdx) {
    const v = TIU_VARIANTS[Math.max(0, Math.min(TIU_VARIANTS.length - 1, variantIdx || 0))];
    const lv = Math.max(1, playerLv || 1);
    const hp = CFG.TIU_HP_BASE + CFG.TIU_HP_PER_LV * lv;
    return {
      id: "TIU", name: v.name, title: v.title, tiuWeak: v.weak, isPlayer: false, tiu: true, classId: "assassin",
      level: 5, exp: 0, hp: hp, maxHp: hp, rage: 0, pieces: [], laPeace: 0, spellBreaker: false,
      drl: 0, trust: 0, inParty: false, alive: true, items: {}, components: {}, statuses: [], ultIdx: 0,
      statsOverride: { hp: hp, atk: CFG.TIU_ATK_BASE + CFG.TIU_ATK_PER_LV * lv,
                       def: CFG.TIU_DEF_BASE + CFG.TIU_DEF_PER_LV * lv, spd: CFG.TIU_SPD }
    };
  }
  /* ------------------------- QUÁI / MINI-BOSS TRONG PHÒNG ------------------------- */
  const MOB_KINDS = {
    guard:     { name: "Bảo vệ Căn tin",      icon: "👮", classId: "fighter",  hp: 120, hpLv: 30, atk: 12, atkLv: 1.8, def: 16, defLv: 2,   spd: 18, drl: 4, drops: { pin: 1, tape: 1 } },
    librarian: { name: "Thủ thư ma",           icon: "👻", classId: "mage",     hp: 90,  hpLv: 26, atk: 16, atkLv: 2.2, def: 10, defLv: 1.5, spd: 26, drl: 4, drops: { wire: 1, pin: 1 } },
    janitor:   { name: "Lao công bóng đêm",    icon: "🧹", classId: "assassin", hp: 100, hpLv: 28, atk: 18, atkLv: 2.4, def: 8,  defLv: 1.2, spd: 40, drl: 5, drops: { pipe: 1, tape: 1 } },
    club:      { name: "Hội trưởng CLB ma",    icon: "🎭", classId: "summoner", hp: 110, hpLv: 30, atk: 14, atkLv: 2,   def: 12, defLv: 1.6, spd: 22, drl: 5, drops: { wire: 1, pipe: 1 } },
    nurse:     { name: "Y tá phòng y tế",      icon: "🩺", classId: "healer",   hp: 110, hpLv: 28, atk: 12, atkLv: 1.8, def: 14, defLv: 1.8, spd: 28, drl: 4, drops: { tape: 1, pin: 1 } }
  };
  let _mobSeq = 0;
  function makeMob(kind, lv, minion) {
    const k = MOB_KINDS[kind] || MOB_KINDS.guard; lv = Math.max(1, lv || 1);
    const hp = minion ? Math.round(34 + 9 * lv) : Math.round(k.hp + k.hpLv * lv);
    const m0 = {
      id: "MOB" + (++_mobSeq), name: minion ? "Sinh viên bóng ma" : k.name, title: minion ? "Tay sai" : "Mini-boss", mob: true, minion: !!minion, mobKind: kind, mobIcon: minion ? "👤" : k.icon,
      isPlayer: false, classId: minion ? "assassin" : k.classId, level: minion ? 1 : Math.min(CFG.MAX_LEVEL, Math.max(3, lv)), exp: 0, hp: hp, maxHp: hp, rage: 0,
      pieces: [], laPeace: 0, spellBreaker: false, drl: 0, trust: 0, inParty: false, alive: true, items: {}, components: {}, statuses: [],
      statsOverride: minion ? { hp: hp, atk: Math.round(7 + 1.2 * lv), def: Math.round(5 + lv), spd: 24 }
                            : { hp: hp, atk: Math.round(k.atk + k.atkLv * lv), def: Math.round(k.def + k.defLv * lv), spd: k.spd },
      rewardDrl: minion ? 0 : k.drl + Math.floor(lv / 3), drops: minion ? {} : k.drops
    };
    return mobFinish(m0);
  }
  function mobFinish(m) { if (!m.minion) autoTalents(m, 0); return m; }
  function makeMobGroup(kind, lv) { return [makeMob(kind, lv, false), makeMob(kind, lv, true), makeMob(kind, lv, true)]; }
  function addTainted(f, n) { f.taintedDrl = (f.taintedDrl || 0) + n; f.taintedEver = true; return f.taintedDrl; }
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
    const dropped = (out.pieces || []).slice();      // mảnh của người bị loại rơi ra, đêm sau lại có thể xuất hiện
    out.pieces = []; syncPieces(out);
    return { eliminated: out, playerEliminated: out.isPlayer, remaining: aliveFighters().length, droppedPieces: dropped };
  }

  /* ============================ CÂN BẰNG CẤP ĐỘ ĐỐI THỦ ============================ */
  /* Nâng Lv lên `lv` (không bao giờ hạ). Chỉ số/HP tính lại theo Lv mới, giữ nguyên tỉ lệ HP hiện tại. */
  function setLevel(f, lv) {
    lv = Math.min(CFG.MAX_LEVEL, lv);
    if (lv <= f.level) return false;
    const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.level = lv;
    f.exp = Math.max(f.exp, CFG.EXP_TABLE[lv]);
    f.maxHp = getStats(f).hp;
    f.hp = Math.max(1, Math.round(f.maxHp * ratio));
    return true;
  }
  /* Mọi đối thủ còn sống (không phải đồng đội) được nâng lên ít nhất = max(mốc theo đêm, Lv người chơi). Trả về danh sách đối thủ vừa được nâng. */
  function scaleOpponents(floorLv) {
    const me = state.fighters.PLAYER;
    const target = Math.min(CFG.MAX_LEVEL, Math.max(floorLv || 1, me.level));
    return aliveFighters().filter(function (f) {
      return !f.isPlayer && !f.inParty && setLevel(f, target);
    });
  }

  /* ============================ LA PEACE (3 loại mảnh, mỗi loại 1 sức mạnh) ============================ */
  /* f.pieces = danh sách loại mảnh đang giữ. f.laPeace (số mảnh) và f.spellBreaker (bool) được đồng bộ để code cũ vẫn chạy. */
  function syncPieces(f) {
    f.pieces = f.pieces || [];
    f.laPeace = f.pieces.length;
    f.spellBreaker = f.pieces.indexOf("spellBreaker") >= 0;
  }
  function hasPiece(f, type) { return !!(f && f.pieces && f.pieces.indexOf(type) >= 0); }
  /* Người còn sống đang giữ loại mảnh này (hoặc null) */
  function pieceOwner(type) {
    return aliveFighters().filter(function (f) { return hasPiece(f, type); })[0] || null;
  }
  /* Các loại mảnh chưa ai (còn sống) nắm giữ -> có thể xuất hiện trên bản đồ */
  function unownedPieces() {
    return LAPEACE_ORDER.filter(function (t) { return !pieceOwner(t); });
  }
  /* Nhặt 1 Mảnh La Peace loại `type` (bỏ trống = loại chưa ai giữ đầu tiên).
     Trả về {count, type, unlocked}: unlocked=true nếu thực sự nhận thêm sức mạnh mới. */
  function addLaPeace(f, type) {
    f.pieces = f.pieces || [];
    if (!type) type = unownedPieces()[0];
    if (!type || !LAPEACE_PIECES[type] || hasPiece(f, type)) { syncPieces(f); return { count: f.pieces.length, type: type || null, unlocked: false }; }
    f.pieces.push(type);
    syncPieces(f);
    return { count: f.pieces.length, type: type, unlocked: true };
  }
  /* Người thắng lấy toàn bộ mảnh của người thua. Trả về mảng loại mảnh vừa chuyển. */
  function transferPieces(from, to) {
    const moved = (from.pieces || []).filter(function (t) { return !hasPiece(to, t); });
    from.pieces = (from.pieces || []).filter(function (t) { return moved.indexOf(t) < 0; });
    to.pieces = (to.pieces || []).concat(moved);
    syncPieces(from); syncPieces(to);
    return moved;
  }
  /* Mảnh không ai nhặt trước 03:00 -> 1 đối thủ ngẫu nhiên nhận (ưu tiên đối thủ chưa vào đội người chơi). Trả về fighter nhận. */
  function giveToRandomOpponent(type) {
    let pool = aliveFighters().filter(function (f) { return !f.isPlayer && !f.inParty; });
    if (!pool.length) pool = aliveFighters().filter(function (f) { return !f.isPlayer; });
    if (!pool.length) return null;
    const f = pool[Math.floor(rng() * pool.length)];
    addLaPeace(f, type);
    return f;
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
  const load = function (data) {
    state = data ? JSON.parse(JSON.stringify(data)) : null;
    if (state) Object.keys(state.fighters).forEach(function (id) {   // tương thích save cũ (chỉ có bộ đếm laPeace)
      const f = state.fighters[id];
      if (!f.talents) f.talents = {};
      Object.keys(f.talents).forEach(function (k) { if (!TALENTS[k]) delete f.talents[k]; });
      if (!f.equip) f.equip = {};
      if (!f.pieces) { f.pieces = []; for (let i = 0; i < (f.laPeace || 0) && i < LAPEACE_ORDER.length; i++) f.pieces.push(LAPEACE_ORDER[i]); }
      syncPieces(f);
    });
    return state;
  };

  /* ============================ XUẤT RA NGOÀI ============================ */
  const RPG = {
    CFG: CFG, CLASSES: CLASSES, CLASS_IDS: CLASS_IDS, CLASS_QUIZ: CLASS_QUIZ,
    ITEMS: ITEMS, RELICS: RELICS, LAPEACE_PIECES: LAPEACE_PIECES, LAPEACE_ORDER: LAPEACE_ORDER, COMPONENTS: COMPONENTS, RECIPES: RECIPES, NPC_ROSTER: NPC_ROSTER,
    DEFAULT_PLAYER_NAME: DEFAULT_PLAYER_NAME,
    setRng: setRng, scoreQuiz: scoreQuiz, init: init, get: get, player: player,
    getState: getState, serialize: serialize, load: load,
    getStats: getStats, getSkills: getSkills, getUltimate: getUltimate,
    addRage: addRage, rageOnAttack: rageOnAttack, rageOnSkill: rageOnSkill, canUseUltimate: canUseUltimate,
    heal: heal, healPct: healPct, regen: regen, healAll: healAll,
    expToNext: expToNext, expForWin: expForWin, addExp: addExp,
    resolveDuel: resolveDuel, setLevel: setLevel, scaleOpponents: scaleOpponents, tiuPenalty: tiuPenalty, makeTiu: makeTiu, TIU_VARIANTS: TIU_VARIANTS, makeMob: makeMob, makeMobGroup: makeMobGroup, MOB_KINDS: MOB_KINDS, EQUIPMENT: EQUIPMENT, EQUIP_SLOTS: EQUIP_SLOTS, equipBonus: equipBonus, canCraftEquip: canCraftEquip, craftEquip: craftEquip, TALENTS: TALENTS, TALENT_BRANCHES: TALENT_BRANCHES, autoTalents: autoTalents, forceLevel: forceLevel, talentEarned: talentEarned, ultAwakened: ultAwakened, hasTalent: hasTalent, talentPoints: talentPoints, canTakeTalent: canTakeTalent, takeTalent: takeTalent, resetTalents: resetTalents, ELEMENTS: ELEMENTS, SKILL_ELEMENT: SKILL_ELEMENT, affinityOf: affinityOf, basicElement: basicElement, elementLabel: elementLabel, addTainted: addTainted, aliveFighters: aliveFighters,
    rankAscending: rankAscending, eliminateLowest: eliminateLowest,
    addLaPeace: addLaPeace, hasPiece: hasPiece, pieceOwner: pieceOwner, unownedPieces: unownedPieces,
    transferPieces: transferPieces, giveToRandomOpponent: giveToRandomOpponent, syncPieces: syncPieces,
    talk: talk, partyAllies: partyAllies, canRecruit: canRecruit, recruit: recruit, dismiss: dismiss,
    countItem: countItem, addItem: addItem, removeItem: removeItem, addComponent: addComponent,
    canCraft: canCraft, craft: craft, lootRandomItem: lootRandomItem,
    simulateDuel: simulateDuel, simulateNpcNight: simulateNpcNight
  };
  global.RPG = RPG;
  if (typeof module !== "undefined" && module.exports) module.exports = RPG;
})(typeof window !== "undefined" ? window : globalThis);
/* =========================================================================
   rpg_combat.js — MODULE 2: COMBAT ENGINE (turn-based, không phụ thuộc DOM)
   Nạp SAU rpg_core.js, TRƯỚC script.js.  Xuất ra window.RPGCombat.

   LUỒNG MỘT TRẬN (UI chỉ cần gọi theo thứ tự này):
     const B = RPGCombat.create({ allies:[playerFighter, ...partyAllies], enemies:[npcFighter] });
     while(!B.over){
       const info = RPGCombat.beginRound(B);            // {round, pending:[uid...]}
       for(const uid of info.pending){
         const u = RPGCombat.unit(B, uid);
         const menu = RPGCombat.options(B, u);           // dựng menu Tấn công/Phòng thủ/Skill/Ult/Item
         // ... người chơi chọn; nếu là skill/ult thì chạy QTE lấy quality 0..1
         RPGCombat.submit(B, uid, {type:'skill', id:'guard', target:enemyUid, quality:0.9});
       }
       const gen = RPGCombat.roundGen(B);                // generator: mỗi lần .next() ra 1 sự kiện để UI diễn hoạt
       // sự kiện {type:'dodgeRequest'} chỉ xuất hiện khi create({dodge:true}) -> UI chạy né đạn rồi gen.next(heSo 0..1)
     }
     const summary = RPGCombat.settle(B);                // cướp 50% ĐRL, EXP, loot, ghi vào RPG state

   Muốn chạy nhanh không hoạt ảnh:  RPGCombat.runRound(B)  /  RPGCombat.autoBattle(B)

   QUY ƯỚC QUAN TRỌNG
   - HP vào trận = HP hiện tại của nhân vật (được giữ lại sau mỗi trận, tối thiểu 1); Nộ luôn bắt đầu từ 0.
     Sau trận settle() ghi HP về nhân vật (người thua còn 1 HP). Hồi máu ngoài trận: RPG.regen/healPct/healAll.
   - "N turn" của buff/debuff/status = tồn tại qua N lượt hành động CỦA CHỦ THỂ sau lượt áp dụng.
   - Hồi chiêu N = phải chờ N lượt của chính mình rồi mới dùng lại.
   - quality (QTE) < 0.4: skill thất bại (mất lượt, vẫn tính hồi chiêu). Ngược lại hiệu lực 70%–100%.
   ========================================================================= */
(function (global) {
  "use strict";
  const RPG = (typeof require !== "undefined" && !global.RPG) ? require("./rpg_core.js") : global.RPG;

  const CC = {
    DMG_SCALE: 0.9,        // nhân sát thương toàn cục (chỉnh để trận dài/ngắn hơn)
    DEF_FACTOR: 0.8,       // sát thương = ATK*power - DEF*0.8
    MIN_DMG_PCT: 0.2,      // sàn: ít nhất 20% (ATK*power)
    VARIANCE: [0.9, 1.1],
    DEFEND_MULT: 0.5,
    DEFEND_ULT_MULT: 0.3,      // Phòng thủ ĐÚNG LÚC (địch tung Ultimate): chỉ nhận 30% sát thương
    DEFEND_RAGE: 10,           // Phòng thủ bị đánh: +10 Nộ (1 lần / lượt) — "gồng" tích Nộ
    DEFEND_ULT_RAGE: 25,       // đỡ đúng Ultimate: +25 Nộ thay vì +10
    FREEZE_MULT: 1.5,
    QTE_FAIL_BELOW: 0.4,
    SUMMON_HP: { sword: 0.4, guard: 0.7 },
    SWORD_ATK_PCT: 0.5, SWORDSMAN_ATK_PCT: 1.0,   // sức đánh của Ma Kiếm / Ma Kiếm Sĩ (theo ATK chủ)
    SUMMON_DEF_PCT: 0.5,
    POISON_TURNS: 3, POISON_MAX_ULT: 6,
    SWORDSMAN_RAGE_ATTACK: 15, SWORDSMAN_ULT_POWER: 2.0,
    MAX_ROUNDS: 40,
    // ---- Chế độ PvP (đấu trường): phòng thủ theo TỈ LỆ thay vì trừ thẳng, để không có class nào miễn nhiễm hoàn toàn ----
    PVP_DEF_K: 100,        // sát thương = ATK*power * K/(K+DEF)
    PVP_DMG_SCALE: 1.0,
    PVP_DOT_MULT: 1.0,     // nhân sát thương độc/cháy theo thời gian trong PvP (DoT bỏ qua DEF nên dễ thành 'khắc chế cứng')
    PVP_SWORD_ATK_PCT: 0.754, PVP_SWORDSMAN_ATK_PCT: 1.322, PVP_HP_SWORD: 0.500, PVP_HP_GUARD: 0.658   // chỉ số summon khi PvP
  };

  let rng = Math.random;
  let pvpMode = false;   // đặt bởi create({pvp:true})
  const rand = (a, b) => a + rng() * (b - a);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ----------------------------- TẠO TRẬN ----------------------------- */
  /* opts: allies[], enemies[] (RPG fighters; allies[0] là người chơi),
           controlAllies (đồng đội do người chơi điều khiển, mặc định false = AI),
           autoPlayer (người chơi cũng do AI — dùng cho mô phỏng/test),
           dodge (QTE phòng thủ mọi đòn địch ra lên người chơi — dành cho boss cuối),
           [Mảnh La Peace — sức mạnh đặc biệt cho BẤT KỲ nhân vật nào giữ mảnh (f.pieces):
              spellBreaker : người chơi có QTE parry CHỈ cho Ultimate của địch
              manaTransfer : sau khi tung Ultimate được hồi lại 50% Nộ
              dieTwice     : hồi sinh 50% HP sau khi chết lần đầu trong trận],
           loseOnPlayerDeath (mặc định true), maxRounds, rng */
  function create(opts) {
    if (opts.rng) rng = opts.rng;
    const B = {
      opts: Object.assign({ controlAllies: false, autoPlayer: false, dodge: false,
                            loseOnPlayerDeath: true, maxRounds: CC.MAX_ROUNDS }, opts),
      units: [], round: 0, log: [], buf: [], over: false, winner: null,
      nextUid: 1, settled: false, playerUnit: null
    };
    B.dodge = !!B.opts.dodge;
    pvpMode = !!B.opts.pvp;
    B.known = Object.assign({}, B.opts.known || {});   // id địch mà người chơi đã biết hệ (thuộc tính)
    opts.allies.forEach(function (f, i) {
      const u = makeUnit(B, f, "A");
      u.controller = B.opts.autoPlayer ? "ai" : (f.isPlayer || B.opts.controlAllies) ? "player" : "ai";
      if (f.isPlayer && !B.playerUnit) B.playerUnit = u;
    });
    if (!B.playerUnit) B.playerUnit = B.units.find(function (u) { return u.side === "A"; });
    // SPELL BREAKER: người chơi đang giữ Mảnh La Peace loại Spell Breaker -> được QTE parry Ultimate của kẻ địch
    B.spellBreaker = !!(B.playerUnit && B.playerUnit.f && RPG.hasPiece(B.playerUnit.f, "spellBreaker"));
    opts.enemies.forEach(function (f) { makeUnit(B, f, "E").controller = "ai"; });
    return B;
  }

  function makeUnit(B, f, side) {
    const st = RPG.getStats(f);
    const u = {
      uid: "u" + (B.nextUid++), f: f, id: f.id, name: f.name, side: side, controller: "ai",
      isSummon: false, hp: clamp(f.hp > 0 ? f.hp : st.hp, 1, st.hp), maxHp: st.hp, rage: 0, sp: RPG.CFG.SP_START + (RPG.hasTalent(f, "sp1") ? 15 : 0),   // HP được giữ lại từ trận trước
      base: { atk: st.atk, def: st.def, spd: st.spd },
      mods: [], st: {}, cds: {}, alive: true, spirit: null, defending: false, action: null,
      taunt: false, voidActive: false, revived: false   // revived: đã dùng Die Twice trong trận này
    };
    B.units.push(u);
    return u;
  }
  const unit = (B, uid) => B.units.find(function (u) { return u.uid === uid; });

  /* ----------------------------- CHỈ SỐ ----------------------------- */
  function eff(u, stat) {
    if (u.isSummon && stat === "spd") return eff(u.owner, "spd");
    let v = u.base[stat];
    u.mods.forEach(function (m) { if (m.stat === stat) v += m.amount; });
    if (stat === "spd" && u.spirit) v *= 1.5;               // Tinh linh gió: +50% SPD
    return Math.max(0, Math.round(v));
  }
  function effAtk(u, basic) {
    if (u.isSummon) return Math.round(effAtk(u.owner) * u.atkPct * (u.dmgMult || 1));
    let a = eff(u, "atk");
    if (basic && u.spirit) a *= 1.25;                        // Tinh linh gió: +25% sức mạnh đánh thường
    return a;
  }

  /* ----------------------------- LOG / SỰ KIỆN ----------------------------- */
  function emit(B, msg, cls, extra) {
    const ev = Object.assign({ type: "log", msg: msg, cls: cls || "", round: B.round }, extra || {});
    B.log.push(ev); B.buf.push(ev);
    return ev;
  }
  function* flush(B) { while (B.buf.length) yield B.buf.shift(); }

  /* ----------------------------- SÁT THƯƠNG ----------------------------- */
  function calcDamage(src, dst, power, o) {
    o = o || {};
    const atk = effAtk(src, o.basic);
    const raw = atk * power;
    const def = o.ignoreDef ? 0 : eff(dst, "def");
    let d;
    if (pvpMode) { d = raw * CC.PVP_DEF_K / (CC.PVP_DEF_K + Math.max(0, def)); d *= rand(CC.VARIANCE[0], CC.VARIANCE[1]) * CC.PVP_DMG_SCALE; }
    else { d = Math.max(raw * CC.MIN_DMG_PCT, raw - def * CC.DEF_FACTOR); d *= rand(CC.VARIANCE[0], CC.VARIANCE[1]) * CC.DMG_SCALE; }
    return d;
  }

  /* amount: sát thương đã tính; áp Đóng băng/Phòng thủ/Miễn nhiễm/Phản đòn; trả về sát thương thực nhận */
  function hit(B, src, dst, amount, o) {
    o = o || {};
    if (!dst.alive) return 0;
    if (amount <= 0) { emit(B, dst.name + " né được hoàn toàn đòn đánh!", "good"); return 0; }
    let d = amount;
    if (dst.st.freeze) d *= CC.FREEZE_MULT;
    if (dst.defending && !o.dot) {
      d *= o.ult ? (tal(dst, "def2") ? 0.2 : CC.DEFEND_ULT_MULT) : (tal(dst, "def2") ? 0.35 : CC.DEFEND_MULT);
      if (o.ult) o.tag = ((o.tag ? o.tag + " · " : "") + "🛡 ĐỠ ĐÚNG LÚC");
      if (!dst.braced && dst.f && !dst.isSummon) {
        dst.braced = true;
        dst.rage = clamp(dst.rage + (o.ult ? CC.DEFEND_ULT_RAGE : CC.DEFEND_RAGE) + (tal(dst, "def2") ? 10 : 0), 0, RPG.CFG.RAGE_MAX);
      }
    }
    d = Math.max(1, Math.round(d));
    if (dst.st.immune) {
      emit(B, dst.name + " miễn nhiễm sát thương!", "good", { dst: dst.uid });
      if (dst.st.reflect && src && src.alive && !o.dot && !o.reflected) {
        if (o.basic) {   // Phản đòn chỉ phản được ĐÒN THƯỜNG
          const r = Math.max(1, Math.round(d * dst.st.reflect.pct));
          emit(B, "↩ PHẢN ĐÒN! " + dst.name + " phản lại " + r + " sát thương!", "atk", { src: dst.uid, dst: src.uid, amount: r });
          hit(B, dst, src, r, { reflected: true, trueDmg: true });
        } else emit(B, "Phản đòn vô hiệu trước skill/Ultimate — " + dst.name + " chỉ miễn nhiễm được đòn này.", "warn");
      }
      return 0;
    }
    dst.hp = Math.max(0, dst.hp - d);
    if (!o.dot && dst.f) {                                   // nội tại Class (Đấu Sĩ: Ý chí thép)
      const ps = RPG.CLASSES[dst.f.classId].passive;
      if (ps && ps.rageOnHit) dst.rage = clamp(dst.rage + ps.rageOnHit, 0, RPG.CFG.RAGE_MAX);
    }
    emit(B, (src && !o.dot ? src.name + " gây " : dst.name + " nhận ") + d + " sát thương" +
            (o.dot ? " (" + (o.label || "hiệu ứng") + ")" : " lên " + dst.name) +
            (dst.st.freeze ? " (Đóng băng +50%)" : "") + (o.tag ? " " + o.tag : "") + ".",
         "atk", { type: "damage", src: src && src.uid, dst: dst.uid, amount: d });
    if (dst.hp <= 0 && tal(dst, "def3") && !dst.endured) {   // Bất Khuất: 1 lần / trận
      dst.endured = true; dst.hp = 1;
      emit(B, "🔥 BẤT KHUẤT! " + dst.name + " nghiến răng trụ lại với 1 HP!", "skill");
    }
    if (dst.hp <= 0) kill(B, dst);
    return d;
  }
  function kill(B, u) {
    if (!u.alive) return;
    // DIE TWICE: chết lần đầu trong trận -> hồi sinh với 50% HP, xóa hiệu ứng xấu (1 lần / trận)
    if (!u.isSummon && u.f && !u.revived && RPG.hasPiece(u.f, "dieTwice")) {
      u.revived = true;
      u.hp = Math.max(1, Math.round(u.maxHp * RPG.CFG.DIE_TWICE_HP_PCT));
      cleanse(u);
      emit(B, "♻ DIE TWICE! " + u.name + " hồi sinh với " + u.hp + " HP!", "good", { type: "revive", dst: u.uid, amount: u.hp });
      return;
    }
    u.alive = false; u.hp = 0;
    emit(B, u.name + " gục ngã!", "danger", { type: "death", dst: u.uid });
    B.units.forEach(function (s) { if (s.isSummon && s.owner === u && s.alive) { s.alive = false; s.hp = 0; } });
  }
  function heal(B, u, amount) {
    const h = Math.max(0, Math.min(u.maxHp - u.hp, Math.round(amount)));
    u.hp += h;
    emit(B, u.name + " hồi " + h + " HP.", "good", { type: "heal", dst: u.uid, amount: h });
    return h;
  }

  /* ----------------------------- BUFF / TRẠNG THÁI ----------------------------- */
  function addMod(u, stat, amount, turns) { u.mods.push({ stat: stat, amount: amount, turns: turns, fresh: true }); }
  function setSt(u, key, data) { u.st[key] = Object.assign({ fresh: true }, data); }
  const NEG = ["burn", "poison", "freeze", "paralyze", "stun"];
  function cleanse(u, only) {
    (only || NEG).forEach(function (k) { delete u.st[k]; });
    if (!only) u.mods = u.mods.filter(function (m) { return m.amount >= 0; });
  }
  function tickTimed(o) { if (o.fresh) { o.fresh = false; return false; } o.turns--; return o.turns <= 0; }

  /* ----------------------------- MỤC TIÊU ----------------------------- */
  const enemiesOf = (B, u) => B.units.filter(function (x) { return x.alive && x.side !== u.side; });
  const alliesOf  = (B, u) => B.units.filter(function (x) { return x.alive && x.side === u.side; });
  /* Đơn mục tiêu: bỏ Tàng hình; nếu có Taunt thì chỉ được chọn Taunt. AoE: đánh tất cả (kể cả Tàng hình). */
  function legalTargets(B, u, aoe) {
    const en = enemiesOf(B, u);
    if (aoe) return en;
    let pool = en.filter(function (x) { return !x.st.stealth; });
    const t = pool.filter(function (x) { return x.taunt; });
    if (t.length) pool = t;
    return pool.length ? pool : en;
  }
  function pickTargets(B, u, kind, targetUid) {
    if (kind === "self" || kind === "summon" || kind === "none") return [u];
    if (kind === "aoe" || kind === "allEnemies") return enemiesOf(B, u);
    const legal = legalTargets(B, u, false);
    const chosen = legal.find(function (x) { return x.uid === targetUid; });
    if (chosen) return [chosen];
    legal.sort(function (a, b) { return a.hp - b.hp; });
    return legal.length ? [legal[0]] : [];
  }

  /* ----------------------------- TRIỆU HỒI ----------------------------- */
  function findSummon(B, owner, kind) {
    return B.units.find(function (s) { return s.isSummon && s.alive && s.owner === owner && s.kind === kind; });
  }
  function spawnSummon(B, owner, kind, spec) {
    const s = {
      uid: "u" + (B.nextUid++), f: null, id: kind, name: spec.name, side: owner.side, controller: "ai",
      isSummon: true, owner: owner, kind: kind, hp: spec.hp, maxHp: spec.hp, rage: 0, sp: 0,
      base: { atk: 0, def: Math.round(owner.base.def * CC.SUMMON_DEF_PCT), spd: 0 },
      mods: [], st: {}, cds: {}, alive: true, spirit: null, defending: false, action: null,
      taunt: !!spec.taunt, atkPct: spec.atkPct, dmgMult: 1, hasRage: false
    };
    B.units.push(s);
    return s;
  }
  function applyVoid(B, s) {
    if (s.kind === "sword")    { s.dmgMult = 1.75; s.name = "Hỗn Mang Kiếm"; }
    if (s.kind === "guard")    { const mh = Math.round(s.maxHp * 1.5); s.hp += mh - s.maxHp; s.maxHp = mh; s.name = "Giáp Hư Không"; }
    if (s.kind === "swordsman"){ s.hasRage = true; s.name = "Hỗn Mang Kiếm Sĩ"; }
  }
  function doSummon(B, u, kind) {
    const mh = u.maxHp;
    if (kind === "windSpirit") {
      if (u.spirit) { return "explode"; }
      u.spirit = { age: 0 };
      emit(B, u.name + " triệu hồi Tinh linh gió! (+25% sức mạnh đánh thường, +50% SPD)", "skill");
      return "ok";
    }
    if (kind === "sword") {
      const old = findSummon(B, u, "sword");
      if (old) { old.hp = old.maxHp; emit(B, "Ma Kiếm được làm mới sức mạnh.", "skill"); return; }
      if (findSummon(B, u, "swordsman")) { emit(B, "Ma Kiếm Sĩ đã ở trên sân — không cần thêm Ma Kiếm.", ""); return; }
      const s = spawnSummon(B, u, "sword", { name: "Ma Kiếm", hp: Math.round(mh * (pvpMode ? CC.PVP_HP_SWORD : CC.SUMMON_HP.sword)), atkPct: (pvpMode ? CC.PVP_SWORD_ATK_PCT : CC.SWORD_ATK_PCT) });
      if (u.voidActive) applyVoid(B, s);
      emit(B, u.name + " triệu hồi " + s.name + "!", "skill", { type: "summon", uid: s.uid });
    } else if (kind === "guard") {
      if (findSummon(B, u, "swordsman")) { emit(B, "Ma Kiếm Sĩ đã ở trên sân.", ""); return; }
      const og = findSummon(B, u, "guard");
      if (og) { og.hp = og.maxHp; emit(B, "Hộ Vệ được làm mới sức mạnh.", "skill"); return; }
      const sw = findSummon(B, u, "sword");
      const ghp = Math.round(mh * (pvpMode ? CC.PVP_HP_GUARD : CC.SUMMON_HP.guard));
      if (sw) {                                           // HỢP THỂ
        const hp = sw.hp + ghp;
        sw.alive = false; sw.hp = 0;
        const s = spawnSummon(B, u, "swordsman", { name: "Ma Kiếm Sĩ", hp: hp, atkPct: (pvpMode ? CC.PVP_SWORDSMAN_ATK_PCT : CC.SWORDSMAN_ATK_PCT), taunt: true });
        if (u.voidActive) applyVoid(B, s);
        emit(B, "Ma Kiếm và Hộ Vệ hợp thể thành " + s.name + "!", "skill", { type: "summon", uid: s.uid });
      } else {
        const s = spawnSummon(B, u, "guard", { name: "Hộ Vệ", hp: ghp, atkPct: 0, taunt: true });
        if (u.voidActive) applyVoid(B, s);
        emit(B, u.name + " triệu hồi " + s.name + " (Taunt)!", "skill", { type: "summon", uid: s.uid });
      }
    }
  }

  /* ----------------------------- HIỆU ỨNG (generator) ----------------------------- */
  function* dmgGen(B, src, dst, power, o, ctx) {
    let mult = 1;
    // QTE phòng thủ: trận cuối (mọi đòn) hoặc có Spell Breaker (CHỈ Ultimate của địch)
    const needQte = (B.dodge || (B.spellBreaker && ctx.ult)) && src.side === "E" && dst.f && dst.f.isPlayer;
    if (needQte) {
      if (ctx.dodge == null) {
        const r = yield { type: "dodgeRequest", src: src.uid, dst: dst.uid, power: power, ult: !!ctx.ult, skill: ctx.skillName || "" };
        ctx.dodge = (typeof r === "number") ? clamp(r, 0, 1) : 1;
      }
      mult = ctx.dodge;
      if (mult === 0 && ctx.ult) {
        emit(B, "✦ SPELL BREAKER! " + dst.name + " phá giải hoàn toàn Ultimate \"" + ctx.skillName + "\" của " + src.name + "!", "good", { type: "parry", dst: dst.uid });
        yield* flush(B);
        return;
      }
    }
    let dmg = calcDamage(src, dst, power, o) * mult;
    const tags = [];
    // ----- Hệ thuộc tính (yếu điểm / kháng) & chí mạng theo SPD -----
    const el = ctx.element || null;
    const aff = RPG.affinityOf(dst.f && !dst.isSummon ? dst.f : null);
    let isWeak = false;
    if (el && aff.weak === el)        { isWeak = true; dmg *= RPG.CFG.WEAK_MULT + (tal(src, "atk2") ? 0.15 : 0); tags.push("💥 YẾU ĐIỂM " + RPG.ELEMENTS[el].icon); }
    else if (el && aff.resist === el) { dmg *= RPG.CFG.RESIST_MULT; tags.push("🛡 KHÁNG " + RPG.ELEMENTS[el].icon); }
    if (el && (isWeak || aff.resist === el) && dst.f && src.side === "A") B.known[dst.f.id] = true;   // người chơi "khám phá" hệ của địch
    const critChance = Math.min(RPG.CFG.CRIT_CAP, RPG.CFG.CRIT_BASE + eff(src, "spd") * RPG.CFG.CRIT_PER_SPD + (isWeak ? RPG.CFG.CRIT_WEAK_BONUS : 0) + (tal(src, "atk1") ? 0.10 : 0) + (src.isSummon ? 0 : RPG.equipBonus(src.f, "crit")));
    if (mult > 0 && rng() < critChance) { dmg *= (tal(src, "atk3") ? 2.0 : RPG.CFG.CRIT_MULT); tags.push("✨ CHÍ MẠNG"); }
    if (isWeak && src.f && !src.isSummon) src.rage = clamp(src.rage + RPG.CFG.WEAK_RAGE, 0, RPG.CFG.RAGE_MAX);
    hit(B, src, dst, dmg, Object.assign({}, o, { tag: tags.join(" · "), ult: !!ctx.ult }));
    yield* flush(B);
  }

  const parried = (ctx, t) => ctx.dodge === 0 && t.f && t.f.isPlayer;

  function* applyEffects(B, u, effects, targets, scale, ctx, defn) {
    for (const e of effects) {
      switch (e.type) {
        case "damage":
          for (const t of targets) if (t.alive) yield* dmgGen(B, u, t, e.power * scale * ultAmp(u, ctx), {}, ctx);
          break;
        case "trueDamage":
          for (const t of targets) if (t.alive) hit(B, u, t, e.amount, { trueDmg: true });
          break;
        case "buff":
          addMod(u, e.stat, e.amount, e.turns);
          emit(B, u.name + " +" + e.amount + " " + e.stat.toUpperCase() + " trong " + e.turns + " turn.", "skill");
          break;
        case "debuff":
          for (const t of targets) if (t.alive && !parried(ctx, t)) { addMod(t, e.stat, -e.amount, e.turns); emit(B, t.name + " bị giảm " + e.amount + " " + e.stat.toUpperCase() + "!", "skill"); }
          break;
        case "immune": setSt(u, "immune", { turns: e.turns }); emit(B, u.name + " miễn nhiễm sát thương!", "skill"); break;
        case "reflect": setSt(u, "reflect", { turns: e.turns, pct: e.pct }); break;
        case "stealth": setSt(u, "stealth", { turns: e.turns }); emit(B, u.name + " tàng hình!", "skill"); break;
        case "cleanse": cleanse(u, e.only); emit(B, u.name + " được thanh tẩy hiệu ứng xấu.", "good"); break;
        case "healPct": heal(B, u, u.maxHp * e.pct * scale); break;
        case "sp": gainSp(u, e.amount); emit(B, u.name + " +" + e.amount + " Thể Lực.", "skill"); break;
        case "rage": u.rage = clamp(u.rage + e.amount, 0, RPG.CFG.RAGE_MAX); emit(B, u.name + " +" + e.amount + " Nộ.", "skill"); break;
        case "selfCostCurHpPct": {
          const c = Math.min(u.hp - 1, Math.round(u.hp * e.pct));
          u.hp -= Math.max(0, c);
          emit(B, u.name + " hy sinh " + Math.max(0, c) + " HP để bộc phát!", "warn");
          break;
        }
        case "status":
          for (const t of targets) {
            if (!t.alive || parried(ctx, t) || rng() >= (e.chance == null ? 1 : e.chance)) continue;
            if (e.status === "burn") setSt(t, "burn", { turns: e.turns, dmg: Math.max(1, Math.round(effAtk(u) * e.dotPower * scale * CC.DMG_SCALE * (pvpMode ? CC.PVP_DOT_MULT : 1))) });
            else if (e.status === "freeze") setSt(t, "freeze", { turns: e.turns });
            else setSt(t, e.status, { turns: e.turns });           // paralyze / stun: tiêu hao khi bị bỏ lượt
            emit(B, t.name + " dính hiệu ứng " + ({ burn: "Cháy", freeze: "Đóng băng", paralyze: "Tê liệt", stun: "Choáng" }[e.status] || e.status) + "!", "skill", { type: "status", dst: t.uid, status: e.status });
          }
          break;
        case "poisonStack":
          for (const t of targets) if (t.alive) {
            const p = t.st.poison || { stacks: 0 };
            setSt(t, "poison", { stacks: Math.min(e.max, p.stacks + e.amount), turns: CC.POISON_TURNS,
                                  dmg: Math.max(1, Math.round(effAtk(u) * e.dotPower * CC.DMG_SCALE * (pvpMode ? CC.PVP_DOT_MULT : 1))) });
            emit(B, t.name + " nhiễm độc (" + t.st.poison.stacks + " stack)!", "skill");
          }
          break;
        case "poisonDamage":
          for (const t of targets) if (t.alive) {
            const stacks = (t.st.poison ? t.st.poison.stacks : 0) + (e.baseStacks && !t.st.poison ? e.baseStacks : 0);
            if (stacks > 0) yield* dmgGen(B, u, t, e.powerPerStack * stacks * scale * (pvpMode ? CC.PVP_DOT_MULT : 1), { ignoreDef: true }, ctx);
            else emit(B, t.name + " không có độc để kích nổ.", "");
          }
          break;
        case "doublePoisonStacks":
          for (const t of targets) if (t.alive && t.st.poison && !parried(ctx, t)) {
            t.st.poison.stacks = Math.min(CC.POISON_MAX_ULT, t.st.poison.stacks * 2);
            t.st.poison.turns = Math.max(t.st.poison.turns, CC.POISON_TURNS);
            emit(B, "Độc trên " + t.name + " nhân đôi → " + t.st.poison.stacks + " stack!", "skill");
          }
          break;
        case "execute":
          for (const t of targets) if (t.alive && !parried(ctx, t) && rng() < e.chance) { emit(B, u.name + " KẾT LIỄU " + t.name + " ngay lập tức!", "danger"); kill(B, t); }
          break;
        case "summon":
          if (e.summon === "windSpirit") {
            if (doSummon(B, u, "windSpirit") === "explode") {
              const age = Math.max(1, u.spirit.age);
              const rec = RPG.CLASSES.mage.skills.find(function (s) { return s.id === "windSpirit"; }).effects.find(function (x) { return x.type === "recastExplode"; });
              emit(B, "Tinh linh gió phát nổ sau " + age + " turn!", "skill");
              u.spirit = null;
              for (const t of enemiesOf(B, u)) yield* dmgGen(B, u, t, rec.powerPerTurn * age * scale, {}, ctx);
            }
          } else if (e.summon === "sword" || e.summon === "guard") doSummon(B, u, e.summon);
          break;
        case "healSummons":
          B.units.filter(function (s) { return s.isSummon && s.alive && s.owner === u; }).forEach(function (s) { heal(B, s, s.maxHp * e.pct * scale); });
          break;
        case "upgradeSummon":
          u.voidActive = true;
          B.units.filter(function (s) { return s.isSummon && s.alive && s.owner === u; }).forEach(function (s) { applyVoid(B, s); });
          emit(B, "Sức mạnh Hư Không tràn vào các vật triệu hồi!", "skill");
          break;
        case "scout": {
          const t = targets[0];
          if (t && t.f) B.known[t.f.id] = true;   // máy ảnh: lộ hệ thuộc tính của địch
          if (t) emit(B, "📷 " + t.name + " — " + RPG.CLASSES[t.f.classId].name + " Lv" + t.f.level + ", HP " + t.hp + "/" + t.maxHp + ", Nộ " + t.rage + ", ĐRL " + t.f.drl +
            ((t.f.pieces && t.f.pieces.length) ? ", 💠 " + t.f.pieces.map(function (p) { return RPG.LAPEACE_PIECES[p].name; }).join("/") : "") + ".", "skill", { type: "scout", dst: t.uid });
          break;
        }
        case "recastExplode": case "fuse": case "placeTrap": break;     // đã xử lý ở nơi khác / chỉ dùng ngoài map
      }
      yield* flush(B);
    }
  }

  /* ----------------------------- HÀNH ĐỘNG ----------------------------- */
  const qScale = q => { q = (q == null ? 1 : q); return q < CC.QTE_FAIL_BELOW ? 0 : 0.7 + 0.3 * clamp((q - CC.QTE_FAIL_BELOW) / (1 - CC.QTE_FAIL_BELOW), 0, 1); };
  const hasSummon = (B, u) => B.units.some(function (s) { return s.isSummon && s.alive && s.owner === u; });

  /* Thể Lực: skill thường tốn TL. Summon và The TIU không bị giới hạn. */
  function tal(u, id) { return !!(u && !u.isSummon && u.f && RPG.hasTalent(u.f, id)); }
  function ultAmp(u, ctx) {   // Ultimate: thức tỉnh Lv8 (+25%) và tài năng Sát Thần (+30%)
    if (!ctx || !ctx.ult || u.isSummon || !u.f) return 1;
    return (RPG.ultAwakened(u.f) ? RPG.CFG.ULT_AWAKEN_MULT : 1) * (tal(u, "atk3") ? 1.3 : 1);
  }
  function skillCost(u, s) {
    if (u.isSummon || (u.f && u.f.tiu)) return 0;
    const base = RPG.CFG.SP_COST[s.lvl] || 0;
    return tal(u, "sp2") ? Math.ceil(base * 0.75) : base;
  }
  function canPay(u, s) { return u.sp >= skillCost(u, s); }
  function gainSp(u, n) { if (!u.isSummon && !(u.f && u.f.tiu)) u.sp = clamp(u.sp + n, 0, RPG.CFG.SP_MAX); }
  function skillReady(u, s) { return !(u.cds[s.id] > 0) && canPay(u, s); }

  function* execAction(B, u, a) {
    const ctx = { dodge: null, ult: false, skillName: "" };
    if (a.type === "defend") { gainSp(u, RPG.CFG.SP_ON_DEFEND); emit(B, u.name + " thủ thế, chuẩn bị chịu đòn" + (u.isSummon ? "" : " (+" + RPG.CFG.SP_ON_DEFEND + " Thể Lực)") + ".", "def"); yield* flush(B); return; }

    if (a.type === "attack") {
      const ts = pickTargets(B, u, "single", a.target);
      if (!ts.length) return;
      emit(B, u.name + " tấn công " + ts[0].name + "!", "atk", { type: "attack", src: u.uid, dst: ts[0].uid });
      ctx.element = u.isSummon ? "void" : RPG.basicElement(u.f);
      yield* dmgGen(B, u, ts[0], 1.0, { basic: true }, ctx);
      if (!u.isSummon) { u.rage = clamp(u.rage + RPG.CFG.RAGE_ON_ATTACK, 0, RPG.CFG.RAGE_MAX); gainSp(u, RPG.CFG.SP_ON_ATTACK); }
      else if (u.hasRage) {
        u.rage += CC.SWORDSMAN_RAGE_ATTACK;
        if (u.rage >= RPG.CFG.RAGE_MAX) {
          u.rage = 0;
          emit(B, u.name + " bộc phát Nộ — chém quét toàn trận!", "skill");
          for (const t of enemiesOf(B, u)) yield* dmgGen(B, u, t, CC.SWORDSMAN_ULT_POWER, {}, ctx);
        }
      }
      return;
    }

    if (a.type === "item") {
      const it = RPG.ITEMS[a.id];
      if (!it || it.usable.indexOf("combat") < 0 || !u.f || RPG.countItem(u.f, a.id) < 1) {
        emit(B, u.name + " lục túi nhưng không có " + (it ? it.name : "vật phẩm") + "!", ""); yield* flush(B); return;
      }
      RPG.removeItem(u.f, a.id, 1);
      emit(B, u.name + " dùng " + it.icon + " " + it.name + ".", "good");
      const kind = it.target === "enemy" ? "single" : it.target;
      yield* applyEffects(B, u, it.effects, pickTargets(B, u, kind, a.target), 1, ctx, it);
      return;
    }

    // skill / ultimate
    const isUlt = a.type === "ultimate";
    const def = isUlt ? RPG.getUltimate(u.f) : RPG.getSkills(u.f).find(function (s) { return s.id === a.id; });
    if (!def || !def.unlocked || (!isUlt && !skillReady(u, def)) || (isUlt && !(u.rage >= RPG.CFG.RAGE_MAX))) {
      emit(B, u.name + " không thể dùng kỹ năng này — đành tấn công thường.", "");
      yield* execAction(B, u, { type: "attack", target: a.target }); return;
    }
    ctx.ult = isUlt; ctx.skillName = def.name; ctx.element = RPG.SKILL_ELEMENT[def.id] || null;
    if (isUlt && u.f && u.f.tiu) u.f.ultIdx = (u.f.ultIdx || 0) + 1;   // lần sau TIU tung Ultimate của class kế tiếp
    // MANA TRANSFER: sau khi tung Ultimate được hồi lại một phần Nộ thay vì về 0
    const manaRefund = isUlt && !u.isSummon && u.f && RPG.hasPiece(u.f, "manaTransfer");
    if (isUlt) u.rage = manaRefund ? Math.round(RPG.CFG.RAGE_MAX * RPG.CFG.MANA_TRANSFER_PCT) : 0;
    else { u.cds[def.id] = Math.max(1, def.cd + 1 - (tal(u, "sp3") ? 1 : 0)); u.rage = clamp(u.rage + RPG.CFG.RAGE_ON_SKILL + (tal(u, "sp3") ? 15 : 0), 0, RPG.CFG.RAGE_MAX); u.sp -= skillCost(u, def); }
    const scale = qScale(a.quality);
    emit(B, (isUlt ? "✧ " : "✦ ") + u.name + " dùng \"" + def.name + "\"" + (scale === 0 ? " — THẤT BẠI!" : "") + (isUlt ? " ✧" : ""), isUlt ? "skill" : "skill", { type: "cast", src: u.uid, skill: def.id });
    if (manaRefund) emit(B, "🔷 MANA TRANSFER! " + u.name + " hồi lại " + u.rage + " Nộ.", "good");
    if (scale === 0) { yield* flush(B); return; }
    const targets = pickTargets(B, u, def.target, a.target);
    if (def.target !== "self" && def.target !== "summon" && !targets.length) { yield* flush(B); return; }
    yield* applyEffects(B, u, def.effects, targets, scale, ctx, def);
  }

  /* ----------------------------- AI ----------------------------- */
  function skillUseful(B, u, s) {
    const en = enemiesOf(B, u);
    switch (s.id) {
      case "guard": return !u.mods.some(function (m) { return m.stat === "def" && m.amount > 0; });
      case "counter": return u.hp < u.maxHp * 0.6 || rng() < 0.3;
      case "lastStand": return Object.keys(u.st).some(function (k) { return NEG.indexOf(k) >= 0; }) || u.hp < u.maxHp * 0.5;
      case "nimble": return !u.mods.some(function (m) { return m.stat === "spd" && m.amount > 0; });
      case "instinct": return !u.st.stealth;
      case "windSpirit": return !u.spirit || u.spirit.age >= 2;
      case "poison": return en.some(function (t) { return !t.st.poison || t.st.poison.stacks < 3; });
      case "blessing": return u.hp < u.maxHp * 0.6;
      case "toxicBlast": return en.some(function (t) { return t.st.poison; });
      case "summonSword": return !findSummon(B, u, "sword") && !findSummon(B, u, "swordsman");
      case "summonGuard": return !findSummon(B, u, "guard") && !findSummon(B, u, "swordsman");
      case "manaTransfer": return B.units.some(function (x) { return x.isSummon && x.alive && x.owner === u && x.hp < x.maxHp * 0.7; });
      default: return true;
    }
  }
  /* ---- AI thông minh dần theo đêm: B.opts.aiLevel 0..5 (đêm càng muộn / New Game+ càng cao). Đồng đội tối đa cấp 2. ----
       L1: chọn mục tiêu & skill theo hệ yếu/kháng · L2: biết PHÒNG THỦ khi địch sắp tung Ultimate / để hồi Thể Lực
       L3: dè sẻn Ultimate cho thời điểm hiệu quả, dùng đồ hồi máu sớm hơn · L4+: ưu tiên kết liễu, chọn skill theo sát thương kỳ vọng */
  function aiLvl(B, u) { const L = B.opts.aiLevel || 0; return u.side === "E" ? L : (B.opts.allyAiLevel != null ? B.opts.allyAiLevel : Math.min(2, L)); }
  function foeMult(el, t) {
    if (!el || !t.f || t.isSummon) return 1;
    const a = RPG.affinityOf(t.f);
    return a.weak === el ? RPG.CFG.WEAK_MULT : (a.resist === el ? RPG.CFG.RESIST_MULT : 1);
  }
  function skillPower(s) {
    let p = 1; (s.effects || []).forEach(function (e) { if (e.type === "damage" && e.power > p) p = e.power; });
    return p;
  }
  function aiTarget(B, u, legal, el, L) {
    if (!legal.length || L < 1) return undefined;
    let best = null, bestScore = -1e9;
    legal.forEach(function (t) {
      let sc = (1 - t.hp / t.maxHp) * 1.0 + (foeMult(el, t) - 1) * 2.0 + (t.isSummon ? -0.35 : 0.1);
      if (L >= 4 && t.hp <= u.maxHp * 0.25) sc += 1.0;   // kết liễu
      if (sc > bestScore) { bestScore = sc; best = t; }
    });
    return best ? best.uid : undefined;
  }
  function aiChoose(B, u) {
    const L = aiLvl(B, u);
    const q = Math.min(1, 0.75 + rng() * 0.25 + 0.04 * L);
    if (u.isSummon) return { type: "attack" };
    const f = u.f, en = enemiesOf(B, u);
    if (!en.length) return { type: "defend" };
    const legal = legalTargets(B, u, false);
    const ult = RPG.getUltimate(f);
    const classOk = f.tiu || ((f.classId !== "fighter" || u.hp > u.maxHp * 0.4) &&
      (f.classId !== "summoner" || hasSummon(B, u)) &&
      (f.classId !== "healer" || en.some(function (t) { return t.st.poison; })));
    let ultOk = ult.unlocked && u.rage >= RPG.CFG.RAGE_MAX && classOk;
    if (ultOk && L >= 3 && B.round < 3 && u.hp > u.maxHp * 0.6 && !legal.some(function (t) { return t.hp < t.maxHp * 0.6; })) ultOk = rng() < 0.35;   // chưa đáng tung
    if (ultOk) return { type: "ultimate", quality: q, target: aiTarget(B, u, legal, RPG.SKILL_ELEMENT[ult.id], L) };
    const healAt = L >= 3 ? 0.5 : 0.35;
    if (u.hp < u.maxHp * healAt && RPG.countItem(f, "bimbim") > 0) return { type: "item", id: "bimbim" };
    if (Object.keys(u.st).some(function (k) { return ["burn", "poison", "freeze"].indexOf(k) >= 0; }) && RPG.countItem(f, "antidote") > 0) return { type: "item", id: "antidote" };
    // L2+: biết thủ thế trước Ultimate của đối phương, hoặc để hồi Thể Lực khi cạn
    if (L >= 2) {
      const threat = en.some(function (t) { return !t.isSummon && t.rage >= RPG.CFG.RAGE_MAX; });
      if (threat && u.hp < u.maxHp * 0.85 && rng() < 0.55) return { type: "defend" };
      const starved = RPG.getSkills(f).some(function (s) { return s.unlocked && !(u.cds[s.id] > 0) && !canPay(u, s); });
      if (starved && u.sp < 20 && u.hp > u.maxHp * 0.4 && rng() < 0.5) return { type: "defend" };
    }
    const ready = RPG.getSkills(f).filter(function (s) { return s.unlocked && skillReady(u, s) && skillUseful(B, u, s); });
    const offense = ready.filter(function (s) { return s.target === "single" || s.target === "aoe"; });
    const support = ready.filter(function (s) { return s.target === "summon" || s.id === "blessing"; });
    const selfBuff = ready.filter(function (s) { return offense.indexOf(s) < 0 && support.indexOf(s) < 0; });
    const pickOf = function (arr) { return arr[Math.floor(rng() * arr.length)]; };
    const offP = Math.min(0.95, 0.75 + 0.05 * L);
    if (support.length && rng() < 0.8) return { type: "skill", id: pickOf(support).id, quality: q };
    if (offense.length && rng() < offP) {
      let s = pickOf(offense);
      if (L >= 1 && legal.length) {   // chọn skill có sát thương kỳ vọng cao nhất (theo hệ yếu/kháng)
        let bestV = -1;
        offense.forEach(function (o) {
          const el = RPG.SKILL_ELEMENT[o.id], tgt = aiTarget(B, u, legal, el, L), tt = legal.find(function (x) { return x.uid === tgt; }) || legal[0];
          const v = skillPower(o) * foeMult(el, tt) * (o.target === "aoe" ? Math.max(1, en.length * 0.8) : 1) * (0.9 + rng() * 0.2);
          if (v > bestV) { bestV = v; s = o; }
        });
      }
      return { type: "skill", id: s.id, quality: q, target: aiTarget(B, u, legal, RPG.SKILL_ELEMENT[s.id], L) };
    }
    if (selfBuff.length && rng() < (L >= 2 ? 0.2 : 0.3)) return { type: "skill", id: pickOf(selfBuff).id, quality: q };
    if (u.hp < u.maxHp * 0.3 && rng() < 0.25) return { type: "defend" };
    return { type: "attack", target: aiTarget(B, u, legal, RPG.basicElement(f), L) };
  }

  /* ----------------------------- MENU CHO UI ----------------------------- */
  function options(B, u) {
    const skills = RPG.getSkills(u.f).map(function (s) {
      return { id: s.id, name: s.name, lvl: s.lvl, target: s.target, desc: s.desc, unlocked: s.unlocked, el: RPG.SKILL_ELEMENT[s.id] || null,
               cd: u.cds[s.id] > 0 ? u.cds[s.id] - 1 : 0, cost: skillCost(u, s), ready: s.unlocked && skillReady(u, s) };
    });
    const ult = RPG.getUltimate(u.f);
    const items = Object.keys(u.f.items).filter(function (k) {
      return RPG.ITEMS[k] && RPG.ITEMS[k].usable.indexOf("combat") >= 0 && u.f.items[k] > 0;
    }).map(function (k) { return { id: k, name: RPG.ITEMS[k].name, icon: RPG.ITEMS[k].icon, count: u.f.items[k], target: RPG.ITEMS[k].target, desc: RPG.ITEMS[k].desc }; });
    return {
      attack: true, defend: true, skills: skills, items: items, sp: u.sp, spMax: RPG.CFG.SP_MAX,
      basicEl: u.isSummon ? "void" : RPG.basicElement(u.f),
      ultimate: { id: ult.id, name: ult.name, target: ult.target, desc: ult.desc, unlocked: ult.unlocked, el: RPG.SKILL_ELEMENT[ult.id] || null,
                  rage: u.rage, rageMax: RPG.CFG.RAGE_MAX, ready: ult.unlocked && u.rage >= RPG.CFG.RAGE_MAX },
      targets: legalTargets(B, u, false).map(function (t) { return { uid: t.uid, name: t.name, hp: t.hp, maxHp: t.maxHp }; })
    };
  }

  /* ----------------------------- VÒNG ĐẤU ----------------------------- */
  function beginRound(B) {
    B.round++;
    B.units.forEach(function (u) { u.action = null; });
    const pending = B.units.filter(function (u) {
      return u.alive && !u.isSummon && u.controller === "player" && !u.st.paralyze && !u.st.stun;
    }).map(function (u) { return u.uid; });
    return { round: B.round, pending: pending };
  }
  /* Trả về {ok, reason} — kiểm tra hợp lệ trước khi nhận lệnh */
  function submit(B, uid, a) {
    const u = unit(B, uid);
    if (!u || !u.alive) return { ok: false, reason: "dead" };
    if (a.type === "skill") {
      const s = RPG.getSkills(u.f).find(function (x) { return x.id === a.id; });
      if (!s || !s.unlocked) return { ok: false, reason: "locked" };
      if (u.cds[s.id] > 0) return { ok: false, reason: "cooldown" };
      if (!canPay(u, s)) return { ok: false, reason: "sp" };
    } else if (a.type === "ultimate") {
      const ult = RPG.getUltimate(u.f);
      if (!ult.unlocked) return { ok: false, reason: "locked" };
      if (u.rage < RPG.CFG.RAGE_MAX) return { ok: false, reason: "rage" };
    } else if (a.type === "item") {
      if (RPG.countItem(u.f, a.id) < 1) return { ok: false, reason: "noitem" };
    } else if (a.type !== "attack" && a.type !== "defend") return { ok: false, reason: "invalid" };
    u.action = a;
    return { ok: true };
  }

  function checkOver(B) {
    if (B.over) return;
    const alive = side => B.units.some(function (x) { return x.alive && x.side === side && !x.isSummon; });
    if (B.opts.loseOnPlayerDeath && B.playerUnit && !B.playerUnit.alive) { B.over = true; B.winner = "E"; }
    else if (!alive("E")) { B.over = true; B.winner = "A"; }
    else if (!alive("A")) { B.over = true; B.winner = "E"; }
    if (B.over) emit(B, B.winner === "A" ? "★ CHIẾN THẮNG!" : "✖ THẤT BẠI...", B.winner === "A" ? "good" : "danger", { type: "over", winner: B.winner });
  }

  function* endTurn(B, u) {
    if (!u.alive) return;
    if (u.st.burn) hit(B, null, u, u.st.burn.dmg, { dot: true, trueDmg: true, label: "Cháy" });
    if (u.alive && u.st.poison) hit(B, null, u, u.st.poison.dmg * u.st.poison.stacks, { dot: true, trueDmg: true, label: "Độc x" + u.st.poison.stacks });
    if (u.alive) {
      ["burn", "poison", "freeze", "stealth", "immune", "reflect"].forEach(function (k) {
        if (u.st[k] && tickTimed(u.st[k])) delete u.st[k];
      });
      u.mods = u.mods.filter(function (m) { return !tickTimed(m); });
      Object.keys(u.cds).forEach(function (k) { if (u.cds[k] > 0) u.cds[k]--; });
      gainSp(u, RPG.CFG.SP_REGEN + (tal(u, "sp1") ? 3 : 0) + (u.isSummon ? 0 : RPG.equipBonus(u.f, "sp")));
      if (u.spirit) u.spirit.age++;
    }
    yield* flush(B);
  }

  /* Generator: mỗi .next() trả về 1 sự kiện {type, msg, cls, ...}. Kết thúc khi hết vòng. */
  function* roundGen(B) {
    if (B.over) return;
    emit(B, "— LƯỢT " + B.round + " —", "turn", { type: "round", round: B.round });
    yield* flush(B);
    // ---- The TIU đổi giai đoạn theo %HP: <=66% (Giai đoạn 2), <=33% (Giai đoạn 3: cuồng nộ) ----
    for (const t of B.units) {
      if (!t.alive || !t.f || !t.f.tiu) continue;
      const ratio = t.hp / t.maxHp, ph = ratio <= 0.33 ? 3 : (ratio <= 0.66 ? 2 : 1);
      if (ph > (t.phase || 1)) {
        t.phase = ph;
        const baseAtk = RPG.getStats(t.f).atk;
        if (ph === 2) {
          emit(B, "☠ THE TIU — GIAI ĐOẠN 2! Nó gào lên, các linh hồn bên trong trỗi dậy!", "danger");
          addMod(t, "atk", Math.round(baseAtk * 0.2), 99); t.rage = clamp(t.rage + 40, 0, RPG.CFG.RAGE_MAX);
        } else {
          emit(B, "☠ THE TIU — GIAI ĐOẠN 3: CUỒNG NỘ! Nó xé toạc mọi hiệu ứng xấu và dồn hết sức tàn!", "danger");
          cleanse(t); addMod(t, "atk", Math.round(baseAtk * 0.25), 99); addMod(t, "spd", 15, 99); t.rage = RPG.CFG.RAGE_MAX;
        }
        yield* flush(B);
      } else if ((t.phase || 1) >= 3 && t.rage < RPG.CFG.RAGE_MAX) {
        t.rage = clamp(t.rage + 15, 0, RPG.CFG.RAGE_MAX);   // cuồng nộ: tích Nộ nhanh -> Ultimate dồn dập
      }
    }
    const order = B.units.filter(function (u) { return u.alive; })
      .map(function (u) { return { u: u, k: eff(u, "spd") + rng() * 0.01 }; })
      .sort(function (a, b) { return b.k - a.k; }).map(function (x) { return x.u; });
    order.forEach(function (u) { if (u.action && u.action.type === "defend") u.defending = true; });

    for (const u of order) {
      if (B.over) break;
      if (!u.alive) continue;
      if (u.st.paralyze || u.st.stun) {
        const k = u.st.paralyze ? "paralyze" : "stun";
        emit(B, u.name + (k === "paralyze" ? " bị Tê liệt" : " bị Choáng") + " — mất lượt!", "warn");
        if (--u.st[k].turns <= 0) delete u.st[k];
        yield* flush(B);
      } else {
        const a = u.action || aiChoose(B, u);
        yield* execAction(B, u, a);
        yield* flush(B);
      }
      checkOver(B); yield* flush(B);
      if (B.over) break;
      yield* endTurn(B, u);
      checkOver(B); yield* flush(B);
    }
    B.units.forEach(function (u) { u.defending = false; u.braced = false; u.action = null; });
    if (!B.over && B.round >= B.opts.maxRounds) {
      const pct = s => B.units.filter(function (x) { return x.side === s && !x.isSummon; }).reduce(function (a, x) { return a + x.hp / x.maxHp; }, 0);
      B.over = true; B.winner = pct("A") > pct("E") ? "A" : "E";
      emit(B, "Hết giờ — bên còn nhiều máu hơn chiến thắng.", "warn", { type: "over", winner: B.winner });
      yield* flush(B);
    }
  }

  /* Chạy trọn 1 vòng, không hoạt ảnh. dodgeFn(request) -> 0..1 (mặc định 1 = không né) */
  function runRound(B, dodgeFn) {
    const gen = roundGen(B), events = [];
    let r = gen.next();
    while (!r.done) {
      if (r.value.type === "dodgeRequest") r = gen.next(dodgeFn ? dodgeFn(r.value) : 1);
      else { events.push(r.value); r = gen.next(); }
    }
    return { events: events, over: B.over, winner: B.winner };
  }
  function autoBattle(B) {
    while (!B.over) {
      const info = beginRound(B);
      info.pending.forEach(function (uid) { submit(B, uid, aiChoose(B, unit(B, uid))); });
      runRound(B);
    }
    return B.winner;
  }

  /* ----------------------------- QUYẾT TOÁN ----------------------------- */
  /* Thắng: người chơi cướp 50% ĐRL mỗi đối thủ + EXP + 1 vật phẩm. Đồng đội nhận EXP bằng người chơi.
     Thua: mỗi đối thủ cướp 50% ĐRL của người chơi (và nhận EXP). Gọi đúng 1 lần/trận. */
  function settle(B) {
    if (!B.over || B.settled) return null;
    B.settled = true;
    // Ghi lại HP sau trận (người thua kiệt sức còn 1 HP). Làm TRƯỚC khi cộng EXP để bonus lên cấp được tính.
    B.units.forEach(function (u) { if (!u.isSummon && u.f) u.f.hp = Math.max(1, Math.min(u.f.maxHp, u.hp)); });
    const pf = B.playerUnit.f;
    const foes = B.units.filter(function (u) { return u.side === "E" && !u.isSummon; }).map(function (u) { return u.f; });
    const mates = B.units.filter(function (u) { return u.side === "A" && !u.isSummon && u.f !== pf; }).map(function (u) { return u.f; });
    const out = { winner: B.winner, duels: [], allyExp: [] };
    if (foes.length && foes.every(function (e) { return e.mob; })) {   // trận với quái / mini-boss
      if (B.winner === "A") {
        let expSum = 0, drl = 0; const drops = {};
        foes.forEach(function (e) {
          expSum += e.minion ? 6 : 30 + 8 * pf.level;
          if (!e.minion) { drl += e.rewardDrl || 0; Object.keys(e.drops || {}).forEach(function (k) { drops[k] = (drops[k] || 0) + e.drops[k]; }); }
        });
        const exp = RPG.addExp(pf, expSum);
        pf.drl += drl; Object.keys(drops).forEach(function (k) { RPG.addComponent(pf, k, drops[k]); });
        out.duels.push({ mob: true, winnerId: pf.id, loserId: foes[0].id, mobName: foes[0].name, drl: drl, lost: 0, exp: exp, drops: drops, pieces: [] });
        mates.forEach(function (m) { out.allyExp.push({ id: m.id, exp: RPG.addExp(m, Math.round(expSum / 2)) }); });
      } else {
        const lost = Math.min(Math.max(0, pf.drl - 1), 3); pf.drl -= lost;
        out.duels.push({ mob: true, winnerId: foes[0].id, loserId: pf.id, mobName: foes[0].name, drl: 0, lost: lost, exp: { gained: 0, unlocked: [], levelsGained: [] }, drops: {}, pieces: [] });
      }
      return out;
    }
    if (B.winner === "A") {
      foes.forEach(function (e) {
        if (e.tiu) {   // thắng The TIU: không cướp ĐRL, nhận ĐRL VẤY BẨN + EXP
          const exp = RPG.addExp(pf, 40 + 15 * pf.level);
          RPG.addTainted(pf, RPG.CFG.TIU_TAINTED_WIN);
          out.duels.push({ tiu: true, winnerId: pf.id, loserId: "TIU", drl: 0, lost: 0, tainted: RPG.CFG.TIU_TAINTED_WIN, exp: exp, pieces: [], loot: null });
          return;
        }
        const r = RPG.resolveDuel(pf, e); r.loot = RPG.lootRandomItem(e, pf); out.duels.push(r);
      });
      const gain = out.duels.reduce(function (a, d) { return a + d.exp.gained; }, 0);
      mates.forEach(function (m) { out.allyExp.push({ id: m.id, exp: RPG.addExp(m, gain) }); });
    } else {
      foes.forEach(function (e) {
        if (e.tiu) {   // thua The TIU: mất ĐRL như cũ (TIU_PENALTY)
          out.duels.push({ tiu: true, winnerId: "TIU", loserId: pf.id, drl: 0, lost: RPG.tiuPenalty(pf), tainted: 0, exp: { gained: 0, unlocked: [], levelsGained: [] }, pieces: [] });
          return;
        }
        out.duels.push(RPG.resolveDuel(e, pf));
      });
    }
    return out;
  }

  const api = {
    CC: CC, create: create, unit: unit, options: options, beginRound: beginRound, submit: submit,
    roundGen: roundGen, runRound: runRound, autoBattle: autoBattle, settle: settle,
    aiChoose: aiChoose, legalTargets: legalTargets, calcDamage: calcDamage, eff: eff,
    setRng: function (fn) { rng = fn || Math.random; }
  };
  global.RPGCombat = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
/* =========================================================================
   arena_core.js — LÕI ĐẤU TRƯỜNG (dùng chung cho TRÌNH DUYỆT và MÁY CHỦ SUPABASE)
   Nạp SAU rpg_core.js và rpg_combat.js. Xuất ra window.TiuArena / globalThis.TiuArena.

   NGUYÊN TẮC CHỐNG GIAN LẬN
   - Máy chủ KHÔNG tin chỉ số do người chơi gửi. Người chơi chỉ gửi "bản dựng" (build):
     class, cấp, danh sách tài năng, trang bị. Chỉ số thật được engine tự tính từ build.
   - validateBuild() kiểm tra build hợp lệ (đúng ngân sách điểm tài năng, đúng thứ tự bậc, trang bị đúng ô...).
   - simulate() chạy trận đấu HOÀN TOÀN trên máy chủ bằng cùng engine, 2 bên đều do AI điều khiển, RNG có seed.
   - Trận đấu trường KHÔNG dùng vật phẩm, không dùng ĐRL/mảnh La Peace -> công bằng.

   LƯU Ý: simulate() gọi RPG.init() nên CHỈ chạy trên máy chủ / script kiểm thử. Trình duyệt không được gọi hàm này
   (sẽ ghi đè trạng thái ván đang chơi).
   ========================================================================= */
(function (global) {
  "use strict";
  const RPG = global.RPG, RPGCombat = global.RPGCombat;
  const VERSION = 1;
  const MAX_BONUS_POINTS = 4;           // tối đa 4 nhiệm vụ đồng đội
  const AI_LEVEL = 3;                   // độ thông minh AI cho cả 2 bên

  function str(v, max, def) {
    let t = typeof v === "string" ? v : "";
    t = t.replace(/[\u0000-\u001f<>"'`\\]/g, "").trim().slice(0, max);
    return t || def;
  }

  /* Trích "bản dựng" từ nhân vật đang chơi (nhỏ gọn, dùng cho đấu trường) */
  function exportBuild(me) {
    return {
      v: VERSION, name: str(me.name, 20, "Vô danh"), classId: me.classId, level: me.level | 0,
      talents: Object.keys(me.talents || {}).filter(function (k) { return me.talents[k]; }),
      equip: Object.assign({}, me.equip || {}), bonusPoints: Math.min(MAX_BONUS_POINTS, me.bonusPoints | 0)
    };
  }

  /* Bản lưu đầy đủ để đồng bộ giữa các thiết bị (dùng khi bắt đầu New Game+ từ đám mây) */
  function exportCharacter(me) {
    const b = exportBuild(me);
    return Object.assign(b, {
      exp: me.exp | 0, taintedDrl: me.taintedDrl | 0, taintedEver: !!me.taintedEver,
      items: Object.assign({}, me.items || {}), components: Object.assign({}, me.components || {}),
      ngPlus: me.ngPlus | 0, tiuKills: me.tiuKills | 0, mobKills: me.mobKills | 0
    });
  }

  /* Kiểm tra + chuẩn hóa build. Trả về { ok, build } hoặc { ok:false, reason } */
  function validateBuild(b) {
    if (!b || typeof b !== "object") return { ok: false, reason: "build rỗng" };
    if (!RPG.CLASSES[b.classId]) return { ok: false, reason: "class không hợp lệ" };
    const level = b.level | 0;
    if (level < 1 || level > RPG.CFG.MAX_LEVEL) return { ok: false, reason: "cấp độ không hợp lệ" };
    const bonus = Math.max(0, Math.min(MAX_BONUS_POINTS, b.bonusPoints | 0));
    const talents = Array.isArray(b.talents) ? b.talents : [];
    const set = {};
    for (let i = 0; i < talents.length; i++) {
      const id = talents[i], t = RPG.TALENTS[id];
      if (!t) return { ok: false, reason: "tài năng không tồn tại: " + String(id).slice(0, 12) };
      set[id] = true;
    }
    const ids = Object.keys(set);
    const budget = 1 + Math.floor((level - 1) / 2) + bonus;
    if (ids.length > budget) return { ok: false, reason: "vượt ngân sách điểm tài năng (" + ids.length + "/" + budget + ")" };
    for (let i = 0; i < ids.length; i++) {
      const t = RPG.TALENTS[ids[i]];
      if (t.tier > 1 && !set[t.branch + (t.tier - 1)]) return { ok: false, reason: "thiếu bậc tài năng trước: " + ids[i] };
    }
    const equip = {}, eq = b.equip && typeof b.equip === "object" ? b.equip : {};
    const slots = Object.keys(RPG.EQUIP_SLOTS);
    for (let i = 0; i < slots.length; i++) {
      const id = eq[slots[i]];
      if (!id) continue;
      const e = RPG.EQUIPMENT[id];
      if (!e || e.slot !== slots[i]) return { ok: false, reason: "trang bị không hợp lệ: " + String(id).slice(0, 12) };
      equip[slots[i]] = id;
    }
    return { ok: true, build: { v: VERSION, name: str(b.name, 20, "Vô danh"), classId: b.classId, level: level, talents: ids, equip: equip, bonusPoints: bonus } };
  }

  /* Dựng fighter "bản sao" từ build ĐÃ validate (không đụng RPG.state) */
  function makeGhost(build, id) {
    const talents = {};
    build.talents.forEach(function (k) { talents[k] = true; });
    const f = {
      id: id || "GHOST", name: build.name, title: "Bản sao đấu trường", isPlayer: false, ghost: true, pvp: true,
      classId: build.classId, level: 1, exp: 0, hp: 1, maxHp: 1, rage: 0, pieces: [], laPeace: 0, spellBreaker: false,
      drl: 0, trust: 0, inParty: false, alive: true, items: {}, components: {}, statuses: [],
      talents: talents, equip: Object.assign({}, build.equip)
    };
    RPG.forceLevel(f, build.level);
    f.hp = f.maxHp;
    return f;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Mô phỏng 1 trận giữa 2 build (CHỈ chạy trên máy chủ). seed -> kết quả tái lập được.
     Bên đánh trước được tung đồng xu theo seed để không bên nào được lợi thế vị trí. */
  function simulate(buildA, buildB, seed) {
    seed = seed >>> 0;
    const rng = mulberry32(seed);
    RPG.init({ playerClass: buildA.classId, playerName: buildA.name });   // chỉ để engine có state hợp lệ
    RPG.setRng && RPG.setRng(rng); RPGCombat.setRng(rng);
    const swap = (seed & 1) === 1;                       // đồng xu: ai đứng phe "A" (phe A hành động trước khi bằng SPD)
    const first = swap ? buildB : buildA, second = swap ? buildA : buildB;
    const fa = makeGhost(first, "ARENA_1"), fb = makeGhost(second, "ARENA_2");
    const B = RPGCombat.create({ allies: [fa], enemies: [fb], autoPlayer: true, aiLevel: AI_LEVEL, allyAiLevel: AI_LEVEL, rng: rng, loseOnPlayerDeath: true, pvp: true });
    let guard = 0;
    while (!B.over && guard++ < 80) {
      const info = RPGCombat.beginRound(B);
      info.pending.forEach(function (uid) { RPGCombat.submit(B, uid, RPGCombat.aiChoose(B, RPGCombat.unit(B, uid))); });
      RPGCombat.runRound(B);
    }
    const ua = B.units.find(function (u) { return u.f === fa; }), ub = B.units.find(function (u) { return u.f === fb; });
    const ra = Math.max(0, ua.hp) / ua.maxHp, rb = Math.max(0, ub.hp) / ub.maxHp;
    let w;                                               // 'first' | 'second' | 'draw'
    if (ua.alive && !ub.alive) w = "first";
    else if (!ua.alive && ub.alive) w = "second";
    else if (Math.abs(ra - rb) < 0.005) w = "draw";      // hết lượt tối đa: so % HP còn lại
    else w = ra > rb ? "first" : "second";
    let winner = w === "draw" ? "draw" : ((w === "first") !== swap ? "A" : "B");
    const hpOf = function (isA) { const u = (isA !== swap) ? ua : ub; return Math.round(Math.max(0, u.hp) / u.maxHp * 100); };
    const log = (B.log || []).map(function (l) { return String(l.msg || l.text || l); });
    return { winner: winner, rounds: B.round, hpA: hpOf(true), hpB: hpOf(false), swapped: swap, seed: seed, log: log };
  }

  /* Elo: scoreA = 1 (A thắng) / 0 (thua) / 0.5 (hòa). kA, kB: hệ số K từng bên. */
  function elo(ra, rb, scoreA, kA, kB) {
    const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    return {
      a: Math.max(100, Math.round(ra + kA * (scoreA - ea))),
      b: Math.max(100, Math.round(rb + (kB == null ? kA : kB) * ((1 - scoreA) - (1 - ea))))
    };
  }

  global.TiuArena = { VERSION: VERSION, exportBuild: exportBuild, exportCharacter: exportCharacter, validateBuild: validateBuild,
                      makeGhost: makeGhost, simulate: simulate, elo: elo, mulberry32: mulberry32 };
  if (typeof module !== "undefined" && module.exports) module.exports = global.TiuArena;
})(typeof window !== "undefined" ? window : globalThis);

export const RPG = globalThis.RPG;
export const RPGCombat = globalThis.RPGCombat;
export const TiuArena = globalThis.TiuArena;
