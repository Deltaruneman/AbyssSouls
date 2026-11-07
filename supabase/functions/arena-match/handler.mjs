/* Logic trận đấu trường — thuần JS, không phụ thuộc Deno, để kiểm thử được bằng Node.
   index.ts nối handler này với Supabase (PostgREST + service role). */
import { TiuArena } from "./engine.mjs";

export const LIMITS = { minGapMs: 5000, rankedPerDay: 40, friendlyPerDay: 200, sameOpponentPerDay: 3, logLines: 140 };

const err = (status, code, message) => ({ status, json: { error: code, message } });

/* db: { playerByKeyHash(hash), character(id), playerName(id), lastMatchAt(id), countSince(id, sinceISO, {ranked, vs}), applyMatch(args) } */
export async function handleMatch(body, db, sha256hex, now = Date.now()) {
  if (!body || typeof body.key !== "string" || typeof body.opponentId !== "string") return err(400, "bad_request", "Thiếu key hoặc opponentId.");
  const ranked = body.ranked !== false;
  if (body.key.length < 10 || body.key.length > 64) return err(401, "invalid_key", "Key không hợp lệ.");
  const me = await db.playerByKeyHash(await sha256hex(body.key));
  if (!me) return err(401, "invalid_key", "Key không hợp lệ.");
  if (me.id === body.opponentId) return err(400, "self_match", "Không thể đấu với chính mình.");

  const [cm, cd] = await Promise.all([db.character(me.id), db.character(body.opponentId)]);
  if (!cm || !cm.build) return err(409, "no_build", "Bạn chưa lưu nhân vật lên đám mây (mục ⬆ Lưu nhân vật).");
  if (!cd || !cd.build) return err(404, "no_opponent", "Đối thủ không còn tồn tại hoặc chưa công khai nhân vật.");

  // Không tin build do client gửi: validate lại bằng đúng luật của engine
  const va = TiuArena.validateBuild(cm.build), vb = TiuArena.validateBuild(cd.build);
  if (!va.ok) return err(422, "invalid_own_build", "Nhân vật của bạn không hợp lệ: " + va.reason);
  if (!vb.ok) return err(422, "invalid_opponent_build", "Nhân vật đối thủ không hợp lệ (bị bỏ qua): " + vb.reason);

  // Giới hạn tốc độ / chống farm điểm
  const last = await db.lastMatchAt(me.id);
  if (last && now - new Date(last).getTime() < LIMITS.minGapMs) return err(429, "too_fast", "Đợi vài giây giữa các trận.");
  const since = new Date(now - 24 * 3600 * 1000).toISOString();
  if (ranked) {
    if (await db.countSince(me.id, since, { ranked: true }) >= LIMITS.rankedPerDay) return err(429, "daily_limit", "Hết lượt xếp hạng hôm nay (" + LIMITS.rankedPerDay + ").");
    if (await db.countSince(me.id, since, { ranked: true, vs: body.opponentId }) >= LIMITS.sameOpponentPerDay) return err(429, "same_opponent", "Đã đấu đủ " + LIMITS.sameOpponentPerDay + " trận xếp hạng với người này hôm nay.");
  } else if (await db.countSince(me.id, since, { ranked: false }) >= LIMITS.friendlyPerDay) return err(429, "daily_limit", "Hết lượt đấu thử hôm nay.");

  const seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
  const sim = TiuArena.simulate(va.build, vb.build, seed);
  const winner = sim.winner === "A" ? "attacker" : sim.winner === "B" ? "defender" : "draw";

  const rA = cm.rating, rD = cd.rating;
  let afterA = rA, afterD = rD;
  if (ranked) {
    const score = sim.winner === "A" ? 1 : sim.winner === "B" ? 0 : 0.5;
    const e = TiuArena.elo(rA, rD, score, 32, 16);       // người khiêu chiến K=32, người bị khiêu chiến K=16 (ít bị ảnh hưởng hơn)
    afterA = e.a; afterD = e.b;
  }
  const log = sim.log.slice(0, LIMITS.logLines);
  const args = { att: me.id, def: body.opponentId, ranked, seed, winner, rounds: sim.rounds, attBefore: rA, attAfter: afterA, defBefore: rD, defAfter: afterD, log };
  let matchId;
  try { matchId = await db.applyMatch(args); }
  catch (e) {
    if (String(e && e.message).includes("rating_changed")) {   // có người vừa đánh xong -> thử lại 1 lần với điểm mới
      return err(409, "rating_changed", "Điểm vừa thay đổi do trận khác, hãy thử lại.");
    }
    throw e;
  }
  return { status: 200, json: {
    matchId, ranked, winner, youWon: winner === "attacker", draw: winner === "draw", rounds: sim.rounds,
    yourHp: sim.hpA, opponentHp: sim.hpB, opponent: { name: cd.build.name, classId: cd.build.classId, level: cd.build.level },
    rating: { before: rA, after: afterA, delta: afterA - rA }, log
  } };
}
