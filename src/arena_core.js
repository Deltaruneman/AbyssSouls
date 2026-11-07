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
