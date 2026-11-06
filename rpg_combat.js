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
         "atk", { type: "damage", src: src && src.uid, dst: dst.uid, amount: d,
           element: o.element || null, ultimate: !!o.ult, critical: !!o.critical, weak: !!o.weak, resisted: !!o.resisted });
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
      emit(B, u.name + " triệu hồi Tinh linh gió! (+25% sức mạnh đánh thường, +50% SPD)", "skill", { type: "summon", src: u.uid });
      return "ok";
    }
    if (kind === "sword") {
      const old = findSummon(B, u, "sword");
      if (old) { old.hp = old.maxHp; emit(B, "Ma Kiếm được làm mới sức mạnh.", "skill"); return; }
      if (findSummon(B, u, "swordsman")) { emit(B, "Ma Kiếm Sĩ đã ở trên sân — không cần thêm Ma Kiếm.", ""); return; }
      const s = spawnSummon(B, u, "sword", { name: "Ma Kiếm", hp: Math.round(mh * (pvpMode ? CC.PVP_HP_SWORD : CC.SUMMON_HP.sword)), atkPct: (pvpMode ? CC.PVP_SWORD_ATK_PCT : CC.SWORD_ATK_PCT) });
      if (u.voidActive) applyVoid(B, s);
      emit(B, u.name + " triệu hồi " + s.name + "!", "skill", { type: "summon", src: u.uid, uid: s.uid });
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
        emit(B, "Ma Kiếm và Hộ Vệ hợp thể thành " + s.name + "!", "skill", { type: "summon", src: u.uid, uid: s.uid });
      } else {
        const s = spawnSummon(B, u, "guard", { name: "Hộ Vệ", hp: ghp, atkPct: 0, taunt: true });
        if (u.voidActive) applyVoid(B, s);
        emit(B, u.name + " triệu hồi " + s.name + " (Taunt)!", "skill", { type: "summon", src: u.uid, uid: s.uid });
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
    hit(B, src, dst, dmg, Object.assign({}, o, {
      tag: tags.join(" · "), ult: !!ctx.ult, element: el,
      critical: tags.indexOf("✨ CHÍ MẠNG") >= 0, weak: isWeak, resisted: !!(el && !isWeak && aff.resist === el)
    }));
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
          emit(B, u.name + " +" + e.amount + " " + e.stat.toUpperCase() + " trong " + e.turns + " turn.", "skill", { type: "buff", dst: u.uid, stat: e.stat });
          break;
        case "debuff":
          for (const t of targets) if (t.alive && !parried(ctx, t)) { addMod(t, e.stat, -e.amount, e.turns); emit(B, t.name + " bị giảm " + e.amount + " " + e.stat.toUpperCase() + "!", "skill", { type: "debuff", dst: t.uid, stat: e.stat }); }
          break;
        case "immune": setSt(u, "immune", { turns: e.turns }); emit(B, u.name + " miễn nhiễm sát thương!", "skill", { type: "status", dst: u.uid, status: "immune" }); break;
        case "reflect": setSt(u, "reflect", { turns: e.turns, pct: e.pct }); emit(B, u.name + " sẵn sàng phản đòn!", "skill", { type: "status", dst: u.uid, status: "reflect" }); break;
        case "stealth": setSt(u, "stealth", { turns: e.turns }); emit(B, u.name + " tàng hình!", "skill", { type: "status", dst: u.uid, status: "stealth" }); break;
        case "cleanse": cleanse(u, e.only); emit(B, u.name + " được thanh tẩy hiệu ứng xấu.", "good", { type: "cleanse", dst: u.uid }); break;
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
            emit(B, t.name + " nhiễm độc (" + t.st.poison.stacks + " stack)!", "skill", { type: "status", dst: t.uid, status: "poison" });
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
    if (a.type === "defend") { gainSp(u, RPG.CFG.SP_ON_DEFEND); emit(B, u.name + " thủ thế, chuẩn bị chịu đòn" + (u.isSummon ? "" : " (+" + RPG.CFG.SP_ON_DEFEND + " Thể Lực)") + ".", "def", { type: "defend", src: u.uid }); yield* flush(B); return; }

    if (a.type === "attack") {
      const ts = pickTargets(B, u, "single", a.target);
      if (!ts.length) return;
      ctx.element = u.isSummon ? "void" : RPG.basicElement(u.f);
      emit(B, u.name + " tấn công " + ts[0].name + "!", "atk", { type: "attack", src: u.uid, dst: ts[0].uid, element: ctx.element });
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
    emit(B, (isUlt ? "✧ " : "✦ ") + u.name + " dùng \"" + def.name + "\"" + (scale === 0 ? " — THẤT BẠI!" : "") + (isUlt ? " ✧" : ""), isUlt ? "skill" : "skill", { type: "cast", src: u.uid, skill: def.id, element: ctx.element, ultimate: isUlt });
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
