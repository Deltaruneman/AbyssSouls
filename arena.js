/* =========================================================================
   arena.js — ĐỒNG BỘ NHÂN VẬT (KEY) + ĐẤU TRƯỜNG (Supabase)
   Nạp SAU script.js. Cần supabase_config.js (URL + anon key). Nếu chưa cấu hình -> hiện hướng dẫn, game vẫn chạy bình thường.

   - Người chơi đăng ký -> được cấp 1 KEY (chỉ hiện 1 lần). Nhập key ở thiết bị khác để tải nhân vật về.
   - ⬆ Lưu nhân vật: bản lưu đầy đủ + (tùy chọn) công khai "bản dựng" cho đấu trường.
   - ⚔ Đấu thử: bạn TỰ ĐIỀU KHIỂN nhân vật đang chơi đấu với bản sao (AI) của người khác — không tính điểm.
   - 🏆 Xếp hạng: máy chủ mô phỏng trận (2 bên AI, engine chạy trên server) -> không thể gian lận kết quả.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.TIU_CLOUD || {};
  const ENABLED = !!(CFG.url && CFG.anonKey && String(CFG.url).indexOf("YOUR_") < 0 && String(CFG.anonKey).indexOf("YOUR_") < 0);
  const LS_KEY = "tiu_cloud_key", LS_PUBLISH = "tiu_cloud_publish";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CLASS_NAME = { fighter: "Đấu sĩ", assassin: "Sát thủ", mage: "Pháp sư", healer: "Hộ tế", summoner: "Triệu hồi" };

  /* ---------- lưu key trên thiết bị ---------- */
  function getKey() { try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(LS_KEY, k); else localStorage.removeItem(LS_KEY); } catch (e) { /* bỏ qua */ } }
  function wantPublish() { try { return localStorage.getItem(LS_PUBLISH) !== "0"; } catch (e) { return true; } }
  function setPublish(v) { try { localStorage.setItem(LS_PUBLISH, v ? "1" : "0"); } catch (e) { /* bỏ qua */ } }
  const maskKey = (k) => k ? k.replace(/^(TIU-\w{5})-\w{5}-\w{5}-(\w{5})$/, "$1-•••••-•••••-$2") : "";

  /* ---------- gọi Supabase ---------- */
  const ERR_VI = {
    invalid_key: "Key không đúng hoặc không tồn tại.", too_many_registrations: "Đang có quá nhiều đăng ký, thử lại sau ít phút.",
    data_too_large: "Dữ liệu nhân vật quá lớn.", build_too_large: "Bản dựng quá lớn.", self_match: "Không thể đấu với chính mình.",
    no_build: "Bạn chưa lưu & công khai nhân vật (mục ⬆ Lưu nhân vật).", no_opponent: "Đối thủ không còn khả dụng.",
    invalid_own_build: "Nhân vật của bạn không hợp lệ.", invalid_opponent_build: "Nhân vật đối thủ không hợp lệ.",
    too_fast: "Chậm lại một chút giữa các trận.", daily_limit: "Hết lượt hôm nay.", same_opponent: "Đã đấu đủ số trận xếp hạng với người này hôm nay.",
    rating_changed: "Điểm vừa thay đổi do trận khác, hãy thử lại.", server_error: "Lỗi máy chủ, thử lại sau."
  };
  function niceError(e) {
    const code = (e && (e.code || e.message)) || "";
    for (const k in ERR_VI) if (String(code).indexOf(k) >= 0) return ERR_VI[k];
    if (e && e.name === "TypeError") return "Không kết nối được máy chủ. Kiểm tra mạng và cấu hình supabase_config.js.";
    return (e && e.message) ? String(e.message).slice(0, 160) : "Lỗi không xác định.";
  }
  async function http(path, body) {
    const r = await fetch(CFG.url.replace(/\/$/, "") + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CFG.anonKey, Authorization: "Bearer " + CFG.anonKey },
      body: JSON.stringify(body || {})
    });
    let data = null; const text = await r.text();
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { message: text }; }
    if (!r.ok) { const err = new Error((data && (data.message || data.error)) || ("HTTP " + r.status)); err.code = (data && (data.error || data.message)) || ""; err.status = r.status; throw err; }
    return data;
  }
  const rpc = (name, body) => http("/rest/v1/rpc/" + name, body);
  const matchApi = (body) => http("/functions/v1/arena-match", body);

  /* ---------- tiện ích UI ---------- */
  let wasPauseOpen = false;
  function modal(title, html, buttons) { showModal(title, html, buttons); }
  function closeArena() {
    closeModal(true);
    if (wasPauseOpen) { const pm = $("pauseMenu"); if (pm) pm.classList.remove("hidden"); wasPauseOpen = false; }
  }
  function info(title, html, back) {
    modal(title, html, [{ label: back ? "← Quay lại" : "Đóng", primary: true, onClick: back || closeArena }]);
  }
  function busy(text) { modal("☁ ĐANG XỬ LÝ", `<p style="font-size:14px;">${esc(text)}</p>`, []); }
  async function guard(text, fn, back) {
    busy(text);
    try { return await fn(); }
    catch (e) { info("⚠ LỖI", `<p style="font-size:14px;color:var(--blood-bright);">${esc(niceError(e))}</p>`, back); return undefined; }
  }
  function inGame() { return typeof S !== "undefined" && S && S.running && RPG.getState && RPG.getState() && RPG.player(); }
  function hasChar() { return typeof S !== "undefined" && RPG.getState && RPG.getState() && RPG.player() && RPG.player().level >= 1; }

  /* ---------- trang chính ---------- */
  function openArena() {
    const pm = $("pauseMenu");
    wasPauseOpen = !!(pm && !pm.classList.contains("hidden"));
    if (pm && wasPauseOpen) pm.classList.add("hidden");
    if (!ENABLED) return pageNotConfigured();
    if (!getKey()) return pageAuth();
    pageHome();
  }
  function pageNotConfigured() {
    info("☁ ĐẤU TRƯỜNG & ĐỒNG BỘ", `<p style="font-size:14px;">Tính năng này cần máy chủ <b>Supabase</b>. Hãy mở <b>supabase_config.js</b> và điền <code>url</code> + <code>anonKey</code> của dự án (xem <b>supabase/README.md</b>).</p>
      <p style="font-size:13px;color:var(--text-dim);">Phần chơi đơn không bị ảnh hưởng.</p>`);
  }
  function pageAuth() {
    modal("☁ ĐĂNG NHẬP BẰNG KEY", `<p style="font-size:14px;">Mỗi người chơi có <b>1 key</b> để lưu nhân vật và đồng bộ giữa các thiết bị. Key chỉ hiện <b>một lần</b> khi tạo — hãy lưu lại.</p>
      <p style="font-size:13px;margin-top:10px;"><b>Chưa có key?</b> Nhập tên hiển thị trên bảng xếp hạng:</p>
      <input id="arenaName" type="text" maxlength="20" placeholder="Tên hiển thị" style="width:100%;padding:8px;font-size:16px;background:#0a0a0c;border:1px solid var(--line);color:var(--text);">
      <p style="font-size:13px;margin-top:12px;"><b>Đã có key?</b> Dán vào đây để đồng bộ:</p>
      <input id="arenaKeyIn" type="text" maxlength="40" placeholder="TIU-XXXXX-XXXXX-XXXXX-XXXXX" style="width:100%;padding:8px;font-size:16px;background:#0a0a0c;border:1px solid var(--line);color:var(--text);">`,
      [{ label: "✨ Tạo key mới", primary: true, onClick: doRegister },
       { label: "🔑 Dùng key này", onClick: doLogin },
       { label: "Đóng", onClick: closeArena }]);
  }
  async function doRegister() {
    const name = ($("arenaName") && $("arenaName").value) || "";
    const res = await guard("Đang tạo key...", () => rpc("register_player", { p_name: name }), pageAuth);
    if (!res) return;
    setKey(res.key);
    modal("🔑 KEY CỦA BẠN", `<p style="font-size:14px;">Chào <b>${esc(res.name)}</b>! Đây là key của bạn:</p>
      <p style="font-size:22px;letter-spacing:2px;text-align:center;margin:14px 0;color:var(--amber);user-select:all;">${esc(res.key)}</p>
      <p style="font-size:13px;color:var(--blood-bright);"><b>Lưu key này ngay.</b> Máy chủ chỉ lưu bản băm — nếu mất key, KHÔNG có cách khôi phục nhân vật. Ai có key này đều dùng được nhân vật của bạn.</p>`,
      [{ label: "📋 Sao chép", onClick: () => copy(res.key) }, { label: "Tôi đã lưu key", primary: true, onClick: pageHome }]);
  }
  async function doLogin() {
    const k = (($("arenaKeyIn") && $("arenaKeyIn").value) || "").trim().toUpperCase();
    if (!/^TIU-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}$/.test(k)) { info("⚠ KEY SAI ĐỊNH DẠNG", `<p style="font-size:14px;">Key có dạng <b>TIU-XXXXX-XXXXX-XXXXX-XXXXX</b>.</p>`, pageAuth); return; }
    const p = await guard("Đang kiểm tra key...", () => rpc("get_profile", { p_key: k }), pageAuth);
    if (!p) return;
    setKey(k); pageHome();
  }
  function copy(text) {
    try { navigator.clipboard.writeText(text).then(() => { if (typeof addLog === "function" && typeof S !== "undefined" && S) addLog("📋 Đã sao chép.", ""); }); } catch (e) { /* người dùng tự bôi đen */ }
  }

  async function pageHome() {
    const key = getKey();
    const p = await guard("Đang tải hồ sơ...", () => rpc("get_profile", { p_key: key }), pageAuth);
    if (!p) return;
    const ch = p.has_character
      ? `Nhân vật đã lưu: <b>${esc(CLASS_NAME[p.class_id] || p.class_id || "?")}</b> Lv${esc(p.level || "?")} ${p.has_build ? "· <span style=\"color:var(--amber);\">công khai đấu trường</span>" : "· riêng tư"}`
      : "Chưa lưu nhân vật nào.";
    modal("☁ " + p.name.toUpperCase(), `<p style="font-size:14px;">🔑 <b>${esc(maskKey(key))}</b></p>
      <p style="font-size:14px;">${ch}</p>
      <p style="font-size:14px;">🏅 Điểm xếp hạng: <b style="color:var(--amber);">${p.rating}</b> · Thắng ${p.wins} · Thua ${p.losses}</p>
      <p style="font-size:12px;color:var(--text-dim);">Hoàn thành game sẽ tự động lưu nhân vật lên đây. Đấu thử cần đang trong một ván chơi; đấu xếp hạng dùng nhân vật đã lưu.</p>`, [
      { label: "⬆ Lưu nhân vật", onClick: pageSave, disabled: !hasChar() },
      { label: "⬇ Tải nhân vật", onClick: pageLoad, disabled: !p.has_character },
      { label: "⚔ Đối thủ", primary: true, onClick: pageOpponents },
      { label: "🏆 Xếp hạng", onClick: pageLeaderboard },
      { label: "📜 Lịch sử", onClick: pageHistory },
      { label: "⚙ Tài khoản", onClick: pageAccount },
      { label: "Đóng", onClick: closeArena }
    ]);
  }

  /* ---------- lưu / tải nhân vật ---------- */
  function pageSave() {
    const me = RPG.player();
    const b = TiuArena.exportBuild(me), v = TiuArena.validateBuild(b);
    modal("⬆ LƯU NHÂN VẬT", `<p style="font-size:14px;"><b>${esc(me.name)}</b> — ${esc(CLASS_NAME[me.classId] || me.classId)} Lv${me.level}, ${b.talents.length} tài năng.</p>
      <p style="font-size:13px;">• <b>Lưu & công khai</b>: người khác thấy bạn trong danh sách đối thủ và có thể thách đấu bản sao AI của bạn. Chỉ công khai <i>bản dựng</i> (class, cấp, tài năng, trang bị) — không lộ vật phẩm hay tiến độ.</p>
      <p style="font-size:13px;">• <b>Chỉ lưu</b>: dùng để đồng bộ sang thiết bị khác, không tham gia đấu trường.</p>
      ${v.ok ? "" : `<p style="font-size:13px;color:var(--blood-bright);">⚠ Bản dựng chưa hợp lệ để công khai: ${esc(v.reason)}</p>`}`, [
      { label: "⬆ Lưu & công khai", primary: true, disabled: !v.ok, onClick: () => doSave(true) },
      { label: "Chỉ lưu (riêng tư)", onClick: () => doSave(false) },
      { label: "← Quay lại", onClick: pageHome }]);
  }
  async function doSave(publish) {
    const me = RPG.player();
    const r = await guard("Đang lưu lên đám mây...", () => rpc("save_character", { p_key: getKey(), p_data: TiuArena.exportCharacter(me), p_build: publish ? TiuArena.exportBuild(me) : null }), pageHome);
    if (!r) return;
    setPublish(publish);
    info("✔ ĐÃ LƯU", `<p style="font-size:14px;">Nhân vật đã lên đám mây${publish ? " và đã công khai đấu trường" : " (riêng tư)"}.</p>`, pageHome);
  }
  async function autoSave() {   // gọi khi hoàn thành game (ending)
    if (!ENABLED || !getKey() || !hasChar()) return false;
    try {
      const me = RPG.player(), publish = wantPublish() && TiuArena.validateBuild(TiuArena.exportBuild(me)).ok;
      await rpc("save_character", { p_key: getKey(), p_data: TiuArena.exportCharacter(me), p_build: publish ? TiuArena.exportBuild(me) : null });
      if (typeof addLog === "function" && typeof S !== "undefined" && S) addLog("☁ Đã lưu nhân vật lên đám mây" + (publish ? " (công khai đấu trường)." : "."), "good");
      return true;
    } catch (e) { return false; }
  }
  async function pageLoad() {
    const d = await guard("Đang tải nhân vật...", () => rpc("load_character", { p_key: getKey() }), pageHome);
    if (!d) return;
    const v = TiuArena.validateBuild(d);
    modal("⬇ NHÂN VẬT TRÊN ĐÁM MÂY", `<p style="font-size:14px;"><b>${esc(d.name)}</b> — ${esc(CLASS_NAME[d.classId] || d.classId)} Lv${esc(d.level)} · NG+${esc(d.ngPlus | 0)}</p>
      <p style="font-size:13px;">Tải về sẽ bắt đầu một ván <b>New Game+</b> mới với nhân vật này (giữ cấp, tài năng, trang bị, vật phẩm). ${inGame() ? "<b style=\"color:var(--blood-bright);\">Ván đang chơi sẽ bị thay thế.</b>" : ""}</p>
      ${v.ok ? "" : `<p style="color:var(--blood-bright);font-size:13px;">⚠ Dữ liệu không hợp lệ: ${esc(v.reason)}</p>`}`, [
      { label: "▶ Bắt đầu New Game+", primary: true, disabled: !v.ok, onClick: () => startFromCloud(d, v.build) },
      { label: "← Quay lại", onClick: pageHome }]);
  }
  function startFromCloud(d, build) {
    closeArena();
    ["titleScreen", "settingsScreen", "gameOverScreen", "winScreen", "pauseMenu"].forEach((id) => { const e = $(id); if (e) e.classList.add("hidden"); });
    RPG.init({ playerName: build.name, playerClass: build.classId });
    const me = RPG.player(), talents = {};
    build.talents.forEach((k) => { talents[k] = true; });
    const items = {}, comps = {};
    Object.keys(d.items || {}).forEach((k) => { if (RPG.ITEMS[k]) items[k] = Math.max(0, Math.min(20, d.items[k] | 0)); });
    Object.keys(d.components || {}).forEach((k) => { if (RPG.COMPONENTS[k]) comps[k] = Math.max(0, Math.min(30, d.components[k] | 0)); });
    Object.assign(me, { level: build.level, exp: RPG.CFG.EXP_TABLE[build.level], talents: talents, equip: build.equip, bonusPoints: build.bonusPoints,
      taintedDrl: Math.max(0, Math.min(99, d.taintedDrl | 0)), taintedEver: !!d.taintedEver, items: items, components: comps, ngPlus: Math.max(0, Math.min(9, d.ngPlus | 0)) + 1 });
    const st = RPG.getStats(me); me.maxHp = st.hp; me.hp = st.hp;
    resetStory();
    beginNight(1, 1, {});
    addLog("☁ Nhân vật được tải từ đám mây — NEW GAME+" + me.ngPlus + ".", "good");
  }

  /* ---------- đối thủ ---------- */
  async function pageOpponents() {
    const rows = await guard("Đang tìm đối thủ...", () => rpc("list_opponents", { p_key: getKey(), p_limit: 8 }), pageHome);
    if (!rows) return;
    const body = rows.length ? rows.map((o, i) => `<div class="shopItem"><span>⚔ <b>${esc(o.name)}</b> — ${esc(CLASS_NAME[o.class_id] || o.class_id)} Lv${esc(o.level)}<br><span style="font-size:12px;color:var(--text-dim);">Điểm ${o.rating} · ${o.wins}T/${o.losses}B</span></span>
        <span style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn" data-friendly="${i}" ${inGame() ? "" : "disabled"}>Đấu thử</button><button class="btn primary" data-ranked="${i}">Xếp hạng</button></span></div>`).join("")
      : `<p style="font-size:14px;">Chưa có đối thủ nào công khai. Hãy là người đầu tiên: lưu & công khai nhân vật của bạn!</p>`;
    modal("⚔ ĐỐI THỦ GỢI Ý", body + `<p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Đấu thử: bạn tự điều khiển nhân vật đang chơi (cần đang trong ván), không tính điểm. Xếp hạng: máy chủ mô phỏng bằng nhân vật đã lưu, AI điều khiển cả hai.</p>`,
      [{ label: "↻ Làm mới", onClick: pageOpponents }, { label: "← Quay lại", onClick: pageHome }]);
    document.querySelectorAll("#mgBody [data-ranked]").forEach((b) => { b.onclick = () => doMatch(rows[+b.getAttribute("data-ranked")], true); });
    document.querySelectorAll("#mgBody [data-friendly]").forEach((b) => { b.onclick = () => startFriendly(rows[+b.getAttribute("data-friendly")]); });
  }
  async function doMatch(opp, ranked) {
    const r = await guard("Máy chủ đang mô phỏng trận...", () => matchApi({ key: getKey(), opponentId: opp.id, ranked: ranked }), pageOpponents);
    if (!r) return;
    const head = r.draw ? "🤝 HÒA" : (r.youWon ? "🏆 BẠN THẮNG" : "💀 BẠN THUA");
    const rt = r.ranked ? `<p style="font-size:15px;">Điểm: ${r.rating.before} → <b style="color:var(--amber);">${r.rating.after}</b> (${r.rating.delta >= 0 ? "+" : ""}${r.rating.delta})</p>` : `<p style="font-size:13px;color:var(--text-dim);">Trận thử — không tính điểm.</p>`;
    modal(head, `<p style="font-size:14px;">vs <b>${esc(r.opponent.name)}</b> (${esc(CLASS_NAME[r.opponent.classId] || r.opponent.classId)} Lv${r.opponent.level}) · ${r.rounds} lượt</p>
      <p style="font-size:14px;">HP còn lại — bạn: <b>${r.yourHp}%</b> · đối thủ: <b>${r.opponentHp}%</b></p>${rt}
      <div style="max-height:28vh;overflow-y:auto;border:1px solid var(--line);padding:8px;margin-top:8px;font-size:13px;line-height:1.5;">${r.log.map(esc).join("<br>")}</div>`,
      [{ label: "Đấu tiếp", primary: true, onClick: pageOpponents }, { label: "← Hồ sơ", onClick: pageHome }]);
  }

  /* ---------- đấu thử: bạn tự điều khiển ---------- */
  async function startFriendly(opp) {
    if (!inGame()) { info("⚔ ĐẤU THỬ", `<p style="font-size:14px;">Hãy vào một ván chơi (Tiếp tục / Bắt đầu) rồi mở Đấu trường từ menu Tạm dừng (Esc).</p>`, pageOpponents); return; }
    const b = await guard("Đang lấy nhân vật đối thủ...", () => rpc("get_opponent_build", { p_key: getKey(), p_id: opp.id }), pageOpponents);
    if (!b) return;
    const v = TiuArena.validateBuild(b);
    if (!v.ok) { info("⚠ ĐỐI THỦ KHÔNG HỢP LỆ", `<p style="font-size:14px;">${esc(v.reason)}</p>`, pageOpponents); return; }
    const me = RPG.player(), stash = { hp: me.hp, items: me.items };
    const st = RPG.getStats(me); me.items = {}; me.hp = st.hp; me.maxHp = st.hp;   // đấu trường: HP đầy, không dùng vật phẩm
    const ghost = TiuArena.makeGhost(v.build, "GHOST_" + String(opp.id).slice(0, 8));
    closeModal(true);
    startBattle({ enemyIds: [ghost.id], enemyFighters: [ghost], allyFighters: [], final: false, arena: true,
      cleanup: () => { me.items = stash.items; me.hp = Math.max(1, Math.min(stash.hp, me.maxHp)); },
      onDone: (won, rounds) => {
        modal(won ? "🏆 BẠN THẮNG BẢN SAO" : "💀 BẠN THUA BẢN SAO", `<p style="font-size:14px;">Đối thủ: <b>${esc(v.build.name)}</b> (${esc(CLASS_NAME[v.build.classId] || v.build.classId)} Lv${v.build.level}) · ${rounds} lượt.</p>
          <p style="font-size:13px;color:var(--text-dim);">Trận thử — không ảnh hưởng điểm, HP và vật phẩm của bạn.</p>`,
          [{ label: "Đấu tiếp", primary: true, onClick: pageOpponents }, { label: "← Hồ sơ", onClick: pageHome }]);
      } });
  }

  /* ---------- bảng xếp hạng / lịch sử / tài khoản ---------- */
  async function pageLeaderboard() {
    const rows = await guard("Đang tải bảng xếp hạng...", () => rpc("leaderboard", { p_limit: 20 }), pageHome);
    if (!rows) return;
    const body = rows.length ? rows.map((r, i) => `<div class="shopItem"><span><b>${i + 1}.</b> ${esc(r.name)} — ${esc(CLASS_NAME[r.class_id] || r.class_id)} Lv${esc(r.level)}</span><span style="color:var(--amber);white-space:nowrap;">${r.rating} · ${r.wins}T/${r.losses}B</span></div>`).join("") : `<p style="font-size:14px;">Chưa có ai trên bảng xếp hạng.</p>`;
    info("🏆 BẢNG XẾP HẠNG", body, pageHome);
  }
  async function pageHistory() {
    const rows = await guard("Đang tải lịch sử...", () => rpc("recent_matches", { p_key: getKey(), p_limit: 12 }), pageHome);
    if (!rows) return;
    const icon = { win: "✔", loss: "✖", draw: "＝" };
    const body = rows.length ? rows.map((m, i) => `<div class="shopItem"><span>${icon[m.result] || "?"} ${m.role === "attacker" ? "Bạn thách đấu" : "Bị thách đấu bởi"} <b>${esc(m.opponent)}</b>${m.ranked ? "" : " (thử)"}<br><span style="font-size:12px;color:var(--text-dim);">${new Date(m.created_at).toLocaleString()} · ${m.rounds} lượt${m.ranked ? " · điểm " + m.before_rating + " → " + m.after_rating : ""}</span></span><button class="btn" data-log="${i}">Xem diễn biến</button></div>`).join("") : `<p style="font-size:14px;">Chưa có trận nào.</p>`;
    modal("📜 LỊCH SỬ TRẬN", body, [{ label: "← Quay lại", primary: true, onClick: pageHome }]);
    document.querySelectorAll("#mgBody [data-log]").forEach((b) => {
      b.onclick = async () => {
        const m = rows[+b.getAttribute("data-log")];
        const log = await guard("Đang tải diễn biến...", () => rpc("get_match_log", { p_key: getKey(), p_match: m.id }), pageHistory);
        if (!log) return;
        info("📜 DIỄN BIẾN", `<div style="max-height:50vh;overflow-y:auto;font-size:13px;line-height:1.5;">${log.map(esc).join("<br>")}</div>`, pageHistory);
      };
    });
  }
  function pageAccount() {
    modal("⚙ TÀI KHOẢN", `<p style="font-size:14px;">Key của bạn:</p>
      <p style="font-size:20px;letter-spacing:2px;text-align:center;margin:10px 0;color:var(--amber);user-select:all;">${esc(getKey())}</p>
      <p style="font-size:12px;color:var(--text-dim);">Nhập key này trên thiết bị khác để đồng bộ nhân vật. Không chia sẻ key cho người khác.</p>
      <p style="font-size:13px;margin-top:10px;">Đổi tên hiển thị:</p>
      <input id="arenaName2" type="text" maxlength="20" placeholder="Tên mới" style="width:100%;padding:8px;font-size:16px;background:#0a0a0c;border:1px solid var(--line);color:var(--text);">`, [
      { label: "📋 Sao chép key", onClick: () => copy(getKey()) },
      { label: "✏ Đổi tên", onClick: async () => { const n = $("arenaName2") && $("arenaName2").value; if (!n || !n.trim()) return; const r = await guard("Đang đổi tên...", () => rpc("set_name", { p_key: getKey(), p_name: n }), pageAccount); if (r) pageHome(); } },
      { label: "🚪 Đăng xuất khỏi thiết bị", danger: true, onClick: () => { setKey(""); pageAuth(); } },
      { label: "← Quay lại", primary: true, onClick: pageHome }]);
  }

  /* ---------- gắn vào giao diện ---------- */
  function mount() {
    const b1 = $("arenaBtn"), b2 = $("pauseArenaBtn");
    if (b1) b1.onclick = openArena;
    if (b2) b2.onclick = openArena;
    // Gõ chữ trong ô nhập không được kích hoạt phím tắt của game
    window.addEventListener("keydown", (e) => { const t = e.target; if (t && t.tagName === "INPUT") e.stopPropagation(); }, true);
    window.addEventListener("keyup", (e) => { const t = e.target; if (t && t.tagName === "INPUT") e.stopPropagation(); }, true);
  }
  window.TiuCloud = { enabled: ENABLED, open: openArena, autoSave: autoSave, getKey: getKey };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
