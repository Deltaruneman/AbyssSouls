/* =========================================================================
   arena.js — TÀI KHOẢN, SLOT NHÂN VẬT + ĐẤU TRƯỜNG (Supabase)
   Nạp SAU script.js. Cần config/supabase_config.js (URL + anon key). Nếu chưa cấu hình -> hiện hướng dẫn, game vẫn chạy bình thường.

   - Đăng nhập email/mật khẩu; tài khoản mới có ba nhân vật/slot PvP độc lập.
   - Hỗ trợ key cũ để người chơi hiện tại không mất nhân vật.
   - ⬆ Lưu nhân vật: bản lưu đầy đủ + (tùy chọn) công khai "bản dựng" cho đấu trường.
   - ⚔ PvP trực tiếp: hai người thật chọn hành động mỗi lượt; trạng thái đồng bộ qua Supabase.
   - 🤖 Đấu thử / 🏆 Xếp hạng AI: các chế độ mô phỏng riêng, không phải PvP trực tiếp.
   ========================================================================= */
(function () {
  "use strict";
  const CFG = window.TIU_CLOUD || {};
  const ENABLED = !!(CFG.url && CFG.anonKey && String(CFG.url).indexOf("YOUR_") < 0 && String(CFG.anonKey).indexOf("YOUR_") < 0);
  const LS_KEY = "tiu_cloud_key", LS_PUBLISH = "tiu_cloud_publish", LS_AUTH = "tiu_auth_session", LS_SLOT = "tiu_active_slot";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CLASS_NAME = { fighter: "Đấu sĩ", assassin: "Sát thủ", mage: "Pháp sư", healer: "Hộ tế", summoner: "Triệu hồi" };
  let accountSlotPlayerIds = new Set();

  /* ---------- lưu key trên thiết bị ---------- */
  function getKey() { try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(LS_KEY, k); else localStorage.removeItem(LS_KEY); } catch (e) { /* bỏ qua */ } }
  function accountScopedKey(key) { const auth = getAuth(), id = auth && auth.user && auth.user.id; return id ? key + "_" + id : key; }
  function publishStorageKey() { return getAuth() && activeSlot() ? accountScopedKey(LS_PUBLISH) + "_slot_" + activeSlot() : LS_PUBLISH; }
  function wantPublish() { try { return localStorage.getItem(publishStorageKey()) !== "0"; } catch (e) { return true; } }
  function setPublish(v) { try { localStorage.setItem(publishStorageKey(), v ? "1" : "0"); } catch (e) { /* bỏ qua */ } }
  function getAuth() { try { return JSON.parse(localStorage.getItem(LS_AUTH) || "null"); } catch (e) { return null; } }
  function setAuth(s) { try { if (s) localStorage.setItem(LS_AUTH, JSON.stringify(s)); else localStorage.removeItem(LS_AUTH); } catch (e) { /* bỏ qua */ } }
  function activeSlot() { try { return Number(localStorage.getItem(accountScopedKey(LS_SLOT))) || 0; } catch (e) { return 0; } }
  function setActiveSlot(slot) { try { localStorage.setItem(accountScopedKey(LS_SLOT), String(slot)); } catch (e) { /* bỏ qua */ } }
  function isNewActiveSlot() { try { return localStorage.getItem(accountScopedKey("tiu_active_slot_new")) === "1"; } catch (e) { return false; } }
  const maskKey = (k) => k ? k.replace(/^(TIU-\w{5})-\w{5}-\w{5}-(\w{5})$/, "$1-•••••-•••••-$2") : "";

  /* ---------- gọi Supabase ---------- */
  const ERR_VI = {
    auth_required: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.", account_not_initialized: "Không tìm thấy hồ sơ tài khoản. Hãy đăng nhập lại.", invalid_slot: "Ô nhân vật không hợp lệ.", slot_not_found: "Không tìm thấy ô nhân vật.",
    invalid_grant: "Email hoặc mật khẩu chưa đúng, hoặc email chưa được xác nhận.", invalid_credentials: "Email hoặc mật khẩu chưa đúng.", email_not_confirmed: "Hãy xác nhận địa chỉ email trước khi đăng nhập.", user_already_exists: "Email này đã có tài khoản. Hãy đăng nhập thay vì đăng ký lại.", weak_password: "Mật khẩu chưa đủ mạnh. Hãy dùng mật khẩu dài hơn.",
    invalid_key: "Key không đúng hoặc không tồn tại.", too_many_registrations: "Đang có quá nhiều đăng ký, thử lại sau ít phút.",
    data_too_large: "Dữ liệu nhân vật quá lớn.", build_too_large: "Bản dựng quá lớn.", self_match: "Không thể đấu với chính mình.",
    no_build: "Bạn chưa lưu & công khai nhân vật (mục ⬆ Lưu nhân vật).", no_opponent: "Đối thủ không còn khả dụng.",
    invalid_own_build: "Nhân vật của bạn không hợp lệ.", invalid_opponent_build: "Nhân vật đối thủ không hợp lệ.",
    too_fast: "Chậm lại một chút giữa các trận.", daily_limit: "Hết lượt hôm nay.", same_opponent: "Đã đấu đủ số trận xếp hạng với người này hôm nay.",
    rating_changed: "Điểm vừa thay đổi do trận khác, hãy thử lại.", server_error: "Lỗi máy chủ, thử lại sau.",
    no_own_build: "Hãy lưu và công khai nhân vật của bạn trước khi thách đấu.", live_match_exists: "Bạn hoặc đối thủ đang có trận trực tiếp chưa kết thúc.",
    action_already_submitted: "Bạn đã chọn hành động cho lượt này.", live_match_not_active: "Trận này chưa bắt đầu hoặc đã kết thúc.",
    live_match_not_found: "Không tìm thấy trận trực tiếp.", live_match_expired: "Lời mời đã hết hạn.", live_match_not_pending: "Lời mời này không còn chờ phản hồi.", bad_action: "Hành động PvP không hợp lệ."
  };
  function niceError(e) {
    const code = (e && (e.code || e.message)) || "";
    for (const k in ERR_VI) if (String(code).indexOf(k) >= 0) return ERR_VI[k];
    if (e && e.name === "TypeError") return "Không kết nối được máy chủ. Kiểm tra mạng và cấu hình config/supabase_config.js.";
    return (e && e.message) ? String(e.message).slice(0, 160) : "Lỗi không xác định.";
  }
  function supabaseHeaders(session) {
    const headers = { "Content-Type": "application/json", apikey: CFG.anonKey };
    if (session && session.access_token) headers.Authorization = "Bearer " + session.access_token;
    else if (!/^sb_(publishable|secret)_/.test(String(CFG.anonKey || ""))) headers.Authorization = "Bearer " + CFG.anonKey;
    return headers;
  }
  async function http(path, body) {
    const session = await authSessionFresh();
    const r = await fetch(CFG.url.replace(/\/$/, "") + path, {
      method: "POST",
      headers: supabaseHeaders(session),
      body: JSON.stringify(body || {})
    });
    let data = null; const text = await r.text();
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { message: text }; }
    if (!r.ok) { const err = new Error((data && (data.message || data.error)) || ("HTTP " + r.status)); err.code = (data && (data.error || data.message)) || ""; err.status = r.status; throw err; }
    return data;
  }
  const rpc = (name, body) => http("/rest/v1/rpc/" + name, body);
  async function authHttp(path, body, session) {
    const headers = supabaseHeaders(session);
    const r = await fetch(CFG.url.replace(/\/$/, "") + path, { method: "POST", headers: headers, body: JSON.stringify(body || {}) });
    const text = await r.text(); let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { message: text }; }
    if (!r.ok) { const err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("HTTP " + r.status)); err.code = (data && (data.error || data.code || data.msg)) || ""; err.status = r.status; throw err; }
    return data;
  }
  async function authSessionFresh() {
    let session = getAuth();
    if (!session || !session.access_token) return null;
    if (session.expires_at && session.expires_at * 1000 > Date.now() + 60000) return session;
    if (!session.refresh_token) { setAuth(null); return null; }
    try {
      const fresh = await authHttp("/auth/v1/token?grant_type=refresh_token", { refresh_token: session.refresh_token });
      session = Object.assign({}, session, fresh, { expires_at: fresh.expires_at || Math.floor(Date.now()/1000) + (fresh.expires_in || 3600) });
      setAuth(session); return session;
    } catch (e) { setAuth(null); return null; }
  }
  async function accountRpc(name, body) {
    const session = await authSessionFresh();
    if (!session) { const e = new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại."); e.code = "auth_required"; throw e; }
    return authHttp("/rest/v1/rpc/" + name, body, session);
  }
  function saveAuthSession(session) {
    if (!session || !session.access_token) return false;
    session.expires_at = session.expires_at || Math.floor(Date.now()/1000) + (session.expires_in || 3600);
    setAuth(session); return true;
  }
  const matchApi = (body) => http("/functions/v1/arena-match", body);
  let livePollTimer = null;
  let liveMatchId = null;
  let liveMenu = null;
  let liveInboxTimer = null;
  const liveInboxSeen = new Set();

  /* ---------- tiện ích UI ---------- */
  let wasPauseOpen = false;
  let resumeGameOnClose = false;
  function modal(title, html, buttons) { showModal(title, html, buttons); }
  function closeArena() {
    closeModal(true);
    if (wasPauseOpen) { const pm = $("pauseMenu"); if (pm) pm.classList.remove("hidden"); wasPauseOpen = false; }
    else if (resumeGameOnClose && typeof S!=="undefined" && S && S.running && typeof isBattleActive==="function" && !isBattleActive()) { S.paused=false; S.lastTick=performance.now(); }
    resumeGameOnClose=false;
  }
  function startLiveInboxPolling() {
    if(liveInboxTimer) clearInterval(liveInboxTimer);
    if(!ENABLED || !getKey()) return;
    const poll=async()=>{
      if(!getKey() || (typeof isBattleActive==="function" && isBattleActive())) return;
      const vn=$("vnOverlay"); if(vn && !vn.classList.contains("hidden")) return;
      try {
        const matches=await rpc("list_live_matches",{p_key:getKey()});
        const incoming=(matches||[]).find(m=>m.status==="pending" && m.opponent_id===m.my_id && !liveInboxSeen.has(m.id));
        if(!incoming) return;
        if(!$("mgModal").classList.contains("hidden")) return;
        liveInboxSeen.add(incoming.id);
        modal("⚔ LỜI MỜI PvP TRỰC TIẾP",`<p><b>${esc(incoming.challenger_name)}</b> muốn đấu giao hữu với bạn theo lượt.</p><p style="font-size:12px;color:var(--text-dim);">Lời mời hết hạn sau 5 phút. Trận trực tiếp hiện không cộng/trừ điểm xếp hạng.</p>`,[
          {label:"Chấp nhận",primary:true,onClick:async()=>{const resume=!!(typeof S!=="undefined"&&S&&S.running&&$("titleScreen").classList.contains("hidden"));const m=await guard("Đang kết nối trận...",()=>rpc("respond_live_match",{p_key:getKey(),p_match:incoming.id,p_accept:true}),()=>{});if(m&&m.status==="active"){resumeGameOnClose=resume;openLiveMatch(incoming.id);}}},
          {label:"Từ chối",danger:true,onClick:async()=>{try{await rpc("respond_live_match",{p_key:getKey(),p_match:incoming.id,p_accept:false});}catch(e){}resumeGameOnClose=false;closeModal();}}
        ]);
      } catch(e) { /* migration chưa được cài; không ảnh hưởng phần chơi đơn */ }
    };
    poll(); liveInboxTimer=setInterval(poll,2500);
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
    resumeGameOnClose=!!(typeof S!=="undefined"&&S&&S.running&&$("titleScreen").classList.contains("hidden")&&!wasPauseOpen);
    if (pm && wasPauseOpen) pm.classList.add("hidden");
    if (!ENABLED) return pageNotConfigured();
    if (getAuth()) return pageSlots();
    if (!getKey()) return pageAuth();
    pageHome();
  }
  function pageNotConfigured() {
    info("☁ ĐẤU TRƯỜNG & ĐỒNG BỘ", `<p style="font-size:14px;">Tính năng này cần máy chủ <b>Supabase</b>. Hãy mở <b>config/supabase_config.js</b> và điền <code>url</code> + <code>anonKey</code> của dự án (xem <b>supabase/README.md</b>).</p>
      <p style="font-size:13px;color:var(--text-dim);">Phần chơi đơn không bị ảnh hưởng.</p>`);
  }
  function pageAuth(message) {
    modal("⚔ ĐẤU TRƯỜNG · TÀI KHOẢN", '<div class="arenaAuthIntro"><span class="arenaEyebrow">THE TIU COMPETITIVE HUB</span><p>Đăng nhập để quản lý <b>3 slot nhân vật</b>, lưu hồ sơ và mở các chế độ đấu.</p></div>' +
      (message ? '<p class="arenaNotice">' + esc(message) + '</p>' : '') +
      '<label class="arenaFieldLabel" for="accountEmail">Email</label><input id="accountEmail" type="email" maxlength="254" autocomplete="email" placeholder="ban@email.com">' +
      '<label class="arenaFieldLabel" for="accountPassword">Mật khẩu</label><input id="accountPassword" type="password" maxlength="128" autocomplete="current-password" placeholder="Tối thiểu 8 ký tự">' +
      '<label class="arenaFieldLabel" for="accountDisplay">Tên hiển thị (chỉ khi đăng ký)</label><input id="accountDisplay" type="text" maxlength="20" autocomplete="nickname" placeholder="Tên trên bảng đấu">' +
      '<div class="arenaAuthFine">Tài khoản mới có sẵn ba slot PvP độc lập. Nhân vật có thể vào đấu trường ngay sau khi tạo, không cần hoàn thành ending.</div>',
      [{ label: "Đăng nhập", primary: true, onClick: doAuthLogin },
       { label: "Tạo tài khoản", onClick: doAuthRegister },
       { label: "🔑 Dùng key cũ", onClick: pageLegacyAuth },
       { label: "Đóng", onClick: closeArena }]);
  }
  function pageLegacyAuth() {
    modal("☁ ĐĂNG NHẬP BẰNG KEY CŨ", '<p style="font-size:14px;">Dùng key đã tạo trước đây để truy cập hồ sơ PvP cũ.</p>' +
      '<p style="font-size:13px;margin-top:12px;"><b>Chưa có key?</b> Nhập tên hiển thị:</p>' +
      '<input id="arenaName" type="text" maxlength="20" placeholder="Tên hiển thị" style="width:100%;padding:8px;font-size:16px;background:#0a0a0c;border:1px solid var(--line);color:var(--text);">' +
      '<p style="font-size:13px;margin-top:12px;"><b>Đã có key?</b> Dán key để đồng bộ:</p>' +
      '<input id="arenaKeyIn" type="text" maxlength="40" placeholder="TIU-XXXXX-XXXXX-XXXXX-XXXXX" style="width:100%;padding:8px;font-size:16px;background:#0a0a0c;border:1px solid var(--line);color:var(--text);">',
      [{ label: "✨ Tạo key cũ", onClick: doRegister },
       { label: "🔑 Dùng key này", primary: true, onClick: doLogin },
       { label: "← Tài khoản", onClick: () => pageAuth() }]);
  }
  async function doAuthLogin() {
    const email = (($("accountEmail") && $("accountEmail").value) || "").trim();
    const password = ($("accountPassword") && $("accountPassword").value) || "";
    if (!email || !password) return pageAuth("Nhập email và mật khẩu để tiếp tục.");
    const session = await guard("Đang đăng nhập...", async () => {
      const data = await authHttp("/auth/v1/token?grant_type=password", { email: email, password: password });
      if (!saveAuthSession(data)) throw new Error("Supabase không trả về phiên đăng nhập.");
      return data;
    }, () => pageAuth());
    if (session) pageSlots();
  }
  async function doAuthRegister() {
    const email = (($("accountEmail") && $("accountEmail").value) || "").trim();
    const password = ($("accountPassword") && $("accountPassword").value) || "";
    const displayName = (($("accountDisplay") && $("accountDisplay").value) || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return pageAuth("Email chưa đúng định dạng.");
    if (password.length < 8) return pageAuth("Mật khẩu cần ít nhất 8 ký tự.");
    const result = await guard("Đang tạo tài khoản...", () => authHttp("/auth/v1/signup", { email: email, password: password, data: { display_name: displayName || email.split("@")[0] } }), () => pageAuth());
    if (!result) return;
    if (result.access_token) { saveAuthSession(result); pageSlots(); return; }
    info("📩 XÁC NHẬN EMAIL", "<p>Tài khoản đã được tạo. Hãy mở email xác nhận của Supabase, sau đó quay lại đăng nhập.</p>", () => pageAuth());
  }
  async function pageSlots() {
    const session = await authSessionFresh();
    if (!session) { setKey(""); return pageAuth("Phiên đăng nhập hết hạn. Hãy đăng nhập lại."); }
    const displayName = session.user && session.user.user_metadata && session.user.user_metadata.display_name;
    const initialized = await guard("Đang chuẩn bị hồ sơ và 3 slot nhân vật...", () => accountRpc("tiu_account_init", { p_display_name: displayName || null }), () => pageAuth());
    if (!initialized) return;
    const data = await guard("Đang tải các nhân vật...", () => accountRpc("tiu_account_slots", {}), () => pageAuth());
    if (!data) return;
    const slots = Array.isArray(data.slots) ? data.slots : [];
    accountSlotPlayerIds = new Set(slots.map(s => s.player_id).filter(Boolean));
    const cards = [1,2,3].map(slotNo => {
      const slot = slots.find(s => Number(s.slot_no) === slotNo) || { slot_no: slotNo };
      const selected = activeSlot() === slotNo;
      const occupied = !!slot.has_character;
      const glyph = occupied ? ({ fighter:"⚔", assassin:"✦", mage:"◇", healer:"✚", summoner:"☽" }[slot.class_id] || "◆") : String(slotNo).padStart(2,"0");
      return '<article class="arenaSlotCard ' + (selected ? "isCurrent" : "") + " " + (occupied ? "isOccupied" : "isEmpty") + '">' +
        '<div class="arenaSlotTop"><span class="arenaSlotNo">SLOT 0' + slotNo + '</span><span class="arenaSlotState">' + (selected ? "ĐANG CHỌN" : occupied ? "ĐÃ TẠO" : "TRỐNG") + '</span></div>' +
        '<div class="arenaSlotPortrait">' + glyph + '</div><h3>' + (occupied ? esc(CLASS_NAME[slot.class_id] || slot.class_id || "Nhân vật") : "Chưa có nhân vật") + '</h3>' +
        '<p>' + (occupied ? "Cấp " + esc(slot.level || 1) + " · " + esc(slot.rating || 1000) + " điểm" : "Tạo nhân vật từ ván chơi của bạn") + '</p>' +
        '<div class="arenaSlotStats">' + (occupied ? "<span>🏆 " + esc(slot.wins || 0) + " thắng</span><span>🛡 " + esc(slot.losses || 0) + " thua</span><span>" + (slot.has_build ? "🌐 Công khai" : "🔒 Riêng tư") + "</span>" : "<span>Hồ sơ và điểm PvP độc lập</span><span>Lưu build đầu tiên từ nhân vật đang chơi</span>") + '</div>' +
        '<button class="btn ' + (selected ? "" : "primary") + ' arenaSlotAction" data-account-slot="' + slotNo + '" data-slot-new="' + (occupied ? "0" : "1") + '">' + (selected ? "Tiếp tục với nhân vật này" : occupied ? "Chọn nhân vật" : "Chọn slot trống") + '</button></article>';
    }).join("");
    modal("⚔ ĐẤU TRƯỜNG · CHỌN NHÂN VẬT", '<div class="arenaHubHero"><div><span class="arenaEyebrow">THE TIU COMPETITIVE HUB · ' + esc(data.display_name || "") + '</span><h2>Chọn nhân vật ra trận</h2><p>Mỗi slot có dữ liệu, trang bị và điểm PvP riêng.</p></div><span class="arenaHubMark">✦</span></div><div class="arenaSlotGrid">' + cards + '</div>', [
      { label: "⚙ Tài khoản", onClick: pageAccount },
      { label: "Đóng", onClick: closeArena }
    ]);
    document.querySelectorAll("#mgBody [data-account-slot]").forEach(button => { button.onclick = () => activateAccountSlot(Number(button.getAttribute("data-account-slot")), button.getAttribute("data-slot-new") === "1"); });
  }
  async function activateAccountSlot(slotNo, isNewSlot) {
    const result = await guard("Đang mở nhân vật...", () => accountRpc("tiu_activate_character_slot", { p_slot: slotNo }), pageSlots);
    if (!result || !result.key) return;
    setKey(result.key);
    setActiveSlot(slotNo);
    try { localStorage.setItem(accountScopedKey("tiu_active_slot_new"), isNewSlot ? "1" : "0"); } catch (e) { /* bỏ qua */ }
    startLiveInboxPolling();
    if (isNewSlot && !inGame()) { closeArena(); if (typeof startNewGame === "function") { startNewGame(); return; } }
    pageHome();
  }
  async function doRegister() {
    const name = ($("arenaName") && $("arenaName").value) || "";
    const res = await guard("Đang tạo key...", () => rpc("register_player", { p_name: name }), pageLegacyAuth);
    if (!res) return;
    setKey(res.key);
    startLiveInboxPolling();
    modal("🔑 KEY CỦA BẠN", `<p style="font-size:14px;">Chào <b>${esc(res.name)}</b>! Đây là key của bạn:</p>
      <p style="font-size:22px;letter-spacing:2px;text-align:center;margin:14px 0;color:var(--amber);user-select:all;">${esc(res.key)}</p>
      <p style="font-size:13px;color:var(--blood-bright);"><b>Lưu key này ngay.</b> Máy chủ chỉ lưu bản băm — nếu mất key, KHÔNG có cách khôi phục nhân vật. Ai có key này đều dùng được nhân vật của bạn.</p>`,
      [{ label: "📋 Sao chép", onClick: () => copy(res.key) }, { label: "Tôi đã lưu key", primary: true, onClick: pageHome }]);
  }
  async function doLogin() {
    const k = (($("arenaKeyIn") && $("arenaKeyIn").value) || "").trim().toUpperCase();
    if (!/^TIU-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}$/.test(k)) { info("⚠ KEY SAI ĐỊNH DẠNG", `<p style="font-size:14px;">Key có dạng <b>TIU-XXXXX-XXXXX-XXXXX-XXXXX</b>.</p>`, pageLegacyAuth); return; }
    const p = await guard("Đang kiểm tra key...", () => rpc("get_profile", { p_key: k }), pageLegacyAuth);
    if (!p) return;
    setKey(k); startLiveInboxPolling(); pageHome();
  }
  function copy(text) {
    try { navigator.clipboard.writeText(text).then(() => { if (typeof addLog === "function" && typeof S !== "undefined" && S) addLog("📋 Đã sao chép.", ""); }); } catch (e) { /* người dùng tự bôi đen */ }
  }

  async function pageHome() {
    const key = getKey();
    if (getAuth() && !key) return pageSlots();
    const p = await guard("Đang tải hồ sơ...", () => rpc("get_profile", { p_key: key }), pageAuth);
    if (!p) return;
    const ch = p.has_character
      ? `Nhân vật đã lưu: <b>${esc(CLASS_NAME[p.class_id] || p.class_id || "?")}</b> Lv${esc(p.level || "?")} ${p.has_build ? "· <span style=\"color:var(--amber);\">công khai đấu trường</span>" : "· riêng tư"}`
      : "Chưa lưu nhân vật nào.";
    const slotLabel = getAuth() ? `<p class="arenaActiveSlot">NHÂN VẬT ĐANG CHỌN <b>SLOT 0${activeSlot()}</b> · ${esc(p.name)}</p>` : "";
    modal("⚔ ĐẤU TRƯỜNG", `${slotLabel}<p style="font-size:14px;">🔑 <b>${esc(maskKey(key))}</b></p>
      <p style="font-size:14px;">${ch}</p>
      <p style="font-size:14px;">🏅 Điểm xếp hạng: <b style="color:var(--amber);">${p.rating}</b> · Thắng ${p.wins} · Thua ${p.losses}</p>
      <p style="font-size:12px;color:var(--text-dim);">Không cần hoàn thành ending để PvP. Nhân vật mới được lưu riêng tư vào slot ngay khi tạo; chọn <b>Lưu nhân vật → Lưu & công khai</b> để xuất hiện trong danh sách đấu. Đấu thử không ảnh hưởng tiến trình.</p>`, [
      { label: "⬆ Lưu nhân vật", onClick: pageSave, disabled: !hasChar() },
      { label: "⬇ Tải nhân vật", onClick: pageLoad, disabled: !p.has_character },
      { label: "⚔ Vào đấu trường", primary: true, onClick: pageOpponents },
      ...(getAuth() ? [{ label: "👥 Chọn nhân vật", onClick: pageSlots }] : []),
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
  async function autoSave(options) {   // đồng bộ lúc tạo nhân vật đầu tiên hoặc khi kết thúc game
    const initialOnly = !!(options && options.initialOnly);
    if (initialOnly) { if (!getAuth() || !isNewActiveSlot()) return false; }
    if (!ENABLED || !getKey() || !hasChar()) return false;
    try {
      const me = RPG.player(), publish = !initialOnly && wantPublish() && TiuArena.validateBuild(TiuArena.exportBuild(me)).ok;
      await rpc("save_character", { p_key: getKey(), p_data: TiuArena.exportCharacter(me), p_build: publish ? TiuArena.exportBuild(me) : null });
      if (initialOnly) { setPublish(false); try { localStorage.setItem(accountScopedKey("tiu_active_slot_new"), "0"); } catch (e) { /* bỏ qua */ } }
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
    let liveMatches = [], liveReady = true, directoryRows = rows.filter(o => !accountSlotPlayerIds.has(o.id));
    try {
      const results=await Promise.all([rpc("list_live_matches",{p_key:getKey()}),rpc("list_live_opponents",{p_key:getKey(),p_limit:8})]);
      liveMatches=results[0]||[]; directoryRows=(results[1]||rows).filter(o => !accountSlotPlayerIds.has(o.id));
    } catch (e) { liveReady = false; }
    const liveList = liveMatches.filter(m=>m.status==='active' || m.status==='pending');
    const liveHtml = liveList.length ? `<h3 style="color:var(--amber);margin:8px 0;">PvP TRỰC TIẾP</h3>`+liveList.map((m,i)=>{
      const incoming=m.status==='pending' && m.opponent_id===m.my_id;
      const peer=m.challenger_id===m.my_id ? m.opponent_name : m.challenger_name;
      return `<div class="shopItem"><span>⚔ <b>${esc(peer)}</b><br><span style="font-size:12px;color:var(--text-dim);">${incoming?'Đang chờ bạn chấp nhận lời mời':(m.status==='pending'?'Đang chờ đối thủ chấp nhận':'Đang đấu · lượt '+m.current_round)}</span></span>
        <span style="display:flex;gap:6px;"><button class="btn ${incoming?'primary':''}" data-live="${i}">${incoming?'Chấp nhận':'Mở trận'}</button>${incoming?'':`<button class="btn danger" data-live-forfeit="${i}">Bỏ trận</button>`}</span></div>`;
    }).join("") : `<p style="font-size:12px;color:var(--text-dim);">Chưa có lời mời hoặc trận PvP trực tiếp nào.</p>`;
    const body = liveHtml + (liveReady ? "" : `<p style="font-size:12px;color:var(--blood-bright);">PvP trực tiếp chưa được bật trong Supabase. Chạy migration <b>20261107000000_live_pvp.sql</b> trước.</p>`) + (directoryRows.length ? directoryRows.map((o, i) => `<div class="shopItem"><span>⚔ <b>${esc(o.name)}</b> — ${esc(CLASS_NAME[o.class_id] || o.class_id)} Lv${esc(o.level)}<br><span style="font-size:12px;color:var(--text-dim);">${liveReady?(o.online?'🟢 Đang online':'⚪ Offline')+' · ':''}Điểm ${o.rating} · ${o.wins}T/${o.losses}B</span></span>
        <span style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn primary" data-live-invite="${i}" ${inGame()&&liveReady&&o.online?"":"disabled"}>PvP trực tiếp</button><button class="btn" data-friendly="${i}" ${inGame() ? "" : "disabled"}>Đấu thử AI</button><button class="btn" data-ranked="${i}">Xếp hạng AI</button></span></div>`).join("")
      : `<p style="font-size:14px;">Chưa có đối thủ nào công khai. Hãy là người đầu tiên: lưu & công khai nhân vật của bạn!</p>`);
    modal("⚔ ĐỐI THỦ GỢI Ý", body + `<p style="font-size:12px;color:var(--text-dim);margin-top:8px;">PvP trực tiếp giao hữu: hai người cùng chọn hành động từng lượt, đồng bộ gần thời gian thực; không cộng/trừ điểm xếp hạng. Cần cả hai online và đã công khai nhân vật. Đấu thử/Xếp hạng AI vẫn là hai chế độ riêng.</p>`,
      [{ label: "↻ Làm mới", onClick: pageOpponents }, { label: "← Quay lại", onClick: pageHome }]);
    document.querySelectorAll("#mgBody [data-ranked]").forEach((b) => { b.onclick = () => doMatch(directoryRows[+b.getAttribute("data-ranked")], true); });
    document.querySelectorAll("#mgBody [data-friendly]").forEach((b) => { b.onclick = () => startFriendly(directoryRows[+b.getAttribute("data-friendly")]); });
    document.querySelectorAll("#mgBody [data-live-invite]").forEach((b) => { b.onclick = () => inviteLiveMatch(directoryRows[+b.getAttribute("data-live-invite")]); });
    document.querySelectorAll("#mgBody [data-live]").forEach((b) => { b.onclick = () => handleLiveEntry(liveList[+b.getAttribute("data-live")]); });
    document.querySelectorAll("#mgBody [data-live-forfeit]").forEach((b) => { b.onclick = () => forfeitLiveMatch(liveList[+b.getAttribute("data-live-forfeit")]); });
  }
  async function inviteLiveMatch(opp) {
    const m = await guard("Đang gửi lời mời PvP trực tiếp...", () => rpc("invite_live_match", { p_key: getKey(), p_opponent: opp.id }), pageOpponents);
    if (m) openLiveMatch(m.id);
  }
  async function handleLiveEntry(m) {
    if (m.status === "pending" && m.opponent_id === m.my_id) {
      const accepted = await guard("Đang chấp nhận lời mời...", () => rpc("respond_live_match", { p_key: getKey(), p_match: m.id, p_accept: true }), pageOpponents);
      if (accepted) openLiveMatch(m.id);
    } else openLiveMatch(m.id);
  }
  async function forfeitLiveMatch(m) {
    const done = await guard("Đang kết thúc trận...", () => rpc("forfeit_live_match", { p_key: getKey(), p_match: m.id }), pageOpponents);
    if (done) { if(liveMatchId===m.id) stopLivePolling(); pageOpponents(); }
  }
  function liveRng(seed) {
    let a = seed | 0;
    return function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function liveSnapshot(m) {
    const va = TiuArena.validateBuild(m.challenger_build), vb = TiuArena.validateBuild(m.opponent_build);
    if (!va.ok || !vb.ok) throw new Error("Build PvP không hợp lệ.");
    const rng = liveRng(Number(m.seed) || 1);
    RPG.setRng(rng); RPGCombat.setRng(rng);
    try {
      const a = TiuArena.makeGhost(va.build, "LIVE_A"), b = TiuArena.makeGhost(vb.build, "LIVE_B");
      const B = RPGCombat.create({ allies:[a], enemies:[b], controlAllies:true, pvp:true, loseOnPlayerDeath:false });
      B.units.forEach(u=>{ u.controller="player"; });
      const bySide = { A:B.units.find(u=>u.side==="A"), E:B.units.find(u=>u.side==="E") };
      const history = Array.isArray(m.actions) ? m.actions : [];
      const endRound = Math.max(1, Number(m.current_round)||1);
      for(let round=1;round<endRound && !B.over;round++){
        const pair = history.filter(x=>Number(x.round)===round);
        if(pair.length<2) break;
        RPGCombat.beginRound(B);
        [m.challenger_id,m.opponent_id].forEach(pid=>{
          const entry=pair.find(x=>x.player_id===pid);
          if(!entry || !entry.action || entry.action.type==="skip") return;
          const unit=pid===m.challenger_id?bySide.A:bySide.E;
          RPGCombat.submit(B,unit.uid,entry.action);
        });
        RPGCombat.runRound(B);
      }
      const info = (!B.over && m.status==="active") ? RPGCombat.beginRound(B) : {pending:[]};
      return { B:B, bySide:bySide, info:info, roundActions:history.filter(x=>Number(x.round)===Number(m.current_round)) };
    } finally {
      RPG.setRng(Math.random); RPGCombat.setRng(Math.random);
    }
  }
  function stopLivePolling() {
    if(livePollTimer){ clearInterval(livePollTimer); livePollTimer=null; }
    liveMatchId=null; liveMenu=null;
  }
  function setLiveFooter(items, key) {
    if(!liveMenu || liveMenu.footerKey===key) return;
    liveMenu.footerKey=key;
    const footer=$("mgFooter"); footer.innerHTML="";
    items.forEach(item=>{
      const b=document.createElement("button"); b.className="btn"+(item.primary?" primary":"")+(item.danger?" danger":"");
      b.textContent=item.label; b.disabled=!!item.disabled; b.onclick=item.onClick||(()=>{}); footer.appendChild(b);
    });
  }
  function liveMainButtons(m, snap, mine, localUnit, options) {
    const mode=liveMenu.mode||"main", round=Number(m.current_round)||1;
    const mineAct=snap.roundActions.find(x=>x.player_id===mine);
    if(m.status!=="active") return [{label:"← Đóng",primary:true,onClick:()=>{stopLivePolling();closeArena();}}];
    if(mineAct) return [{label:"Đang chờ đối thủ…",disabled:true},{label:"Đóng cửa sổ",onClick:()=>{stopLivePolling();closeArena();}}];
    if(!snap.info.pending.includes(localUnit.uid)) return [{label:"Đang bỏ lượt…",disabled:true},{label:"Đóng cửa sổ",onClick:()=>{stopLivePolling();closeArena();}}];
    const submit=async action=>{
      try { await rpc("submit_live_action",{p_key:getKey(),p_match:m.id,p_action:action}); liveMenu.mode="main"; liveMenu.footerKey=""; await liveTick(m.id); }
      catch(e){ info("⚠ KHÔNG GỬI ĐƯỢC LƯỢT",`<p>${esc(niceError(e))}</p>`,()=>openLiveMatch(m.id)); }
    };
    const back={label:"← Quay lại",onClick:()=>{liveMenu.mode="main";liveMenu.footerKey="";liveTick(m.id);}};
    if(mode==="targets"){
      const targets=RPGCombat.legalTargets(snap.B,localUnit,false);
      return targets.map(t=>({label:"🎯 "+t.name+" · HP "+Math.ceil(t.hp)+"/"+t.maxHp,onClick:()=>submit(Object.assign({},liveMenu.pendingAction,{target:t.uid}))})).concat([back]);
    }
    if(mode==="skills"){
      return options.skills.filter(s=>s.ready).map(s=>({label:"✦ "+s.name+(s.cost?" · "+s.cost+" TL":""),onClick:()=>{
        const a={type:"skill",id:s.id,quality:1}; if(s.target==="single"){liveMenu.pendingAction=a;liveMenu.mode="targets";} else submit(a);
        liveMenu.footerKey="";liveTick(m.id);
      }})).concat([back]);
    }
    const buttons=[{label:"⚔ Tấn công",primary:true,onClick:()=>{liveMenu.pendingAction={type:"attack",quality:1};liveMenu.mode="targets";liveMenu.footerKey="";liveTick(m.id);}},
      {label:"🛡 Phòng thủ",onClick:()=>submit({type:"defend"})},
      {label:"✨ Kỹ năng",disabled:!options.skills.some(s=>s.ready),onClick:()=>{liveMenu.mode="skills";liveMenu.footerKey="";liveTick(m.id);}}];
    const ult=options.ultimate;
    if(ult.ready) buttons.push({label:"✦ "+ult.name,onClick:()=>{const a={type:"ultimate",id:ult.id,quality:1};if(ult.target==="single"){liveMenu.pendingAction=a;liveMenu.mode="targets";liveMenu.footerKey="";liveTick(m.id);}else submit(a);}});
    buttons.push({label:"Bỏ trận",danger:true,onClick:()=>forfeitLiveMatch({id:m.id})});
    return buttons;
  }
  async function liveTick(id) {
    if(!liveMenu || liveMatchId!==id || liveMenu.busy || $("mgModal").classList.contains("hidden")) return;
    const openTitle=$("mgTitle").textContent;
    if(!(openTitle.startsWith("⌛ ĐANG KẾT NỐI TRẬN PvP") || openTitle.startsWith("⚔ PvP TRỰC TIẾP") || openTitle==="⌛ ĐANG CHỜ ĐỐI THỦ" || openTitle==="⚔ TRẬN ĐÃ ĐÓNG")) return;
    liveMenu.busy=true;
    try {
      const m=await rpc("get_live_match",{p_key:getKey(),p_match:id});
      if(!liveMenu || liveMatchId!==id) return;
      if(m.status==="active" || m.status==="completed" || m.status==="forfeit"){
        const snap=liveSnapshot(m), mine=m.my_id, isA=mine===m.challenger_id;
        const local=snap.bySide[isA?"A":"E"], foe=snap.bySide[isA?"E":"A"];
        if(snap.B.over && m.status==="active" && !liveMenu.finishing){
          liveMenu.finishing=true;
          const winner=snap.B.winner==="A"?m.challenger_id:m.opponent_id;
          await rpc("finish_live_match",{p_key:getKey(),p_match:id,p_winner:winner,p_is_draw:false});
          liveMenu.finishing=false; liveMenu.footerKey=""; return await liveTick(id);
        }
        const logs=(snap.B.log||[]).slice(-8).map(x=>esc(x.msg||x.text||"")).filter(Boolean).join("<br>");
        const mineAct=snap.roundActions.find(x=>x.player_id===mine);
        const foeAct=snap.roundActions.find(x=>x.player_id!==mine);
        const result=m.status==="completed"||m.status==="forfeit";
        const title=result?(m.is_draw?"🤝 HÒA":m.winner===mine?"🏆 BẠN THẮNG":"💀 BẠN THUA"):"⚔ PvP TRỰC TIẾP · LƯỢT "+snap.B.round;
        $("mgTitle").textContent=title;
        $("mgBody").innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div class="shopItem" style="display:block;border-left:2px solid var(--scan);"><b>${esc(local.name)}</b><br><small>${esc(CLASS_NAME[local.f.classId]||local.f.classId)} Lv${local.f.level} · HP ${Math.max(0,Math.ceil(local.hp))}/${local.maxHp} · Nộ ${local.rage}</small></div>
          <div class="shopItem" style="display:block;border-left:2px solid var(--blood-bright);"><b>${esc(foe.name)}</b><br><small>${esc(CLASS_NAME[foe.f.classId]||foe.f.classId)} Lv${foe.f.level} · HP ${Math.max(0,Math.ceil(foe.hp))}/${foe.maxHp} · Nộ ${foe.rage}</small></div></div>
          <p style="font-size:13px;color:var(--text-dim);">${result?(m.is_draw?"Trận giao hữu kết thúc hòa.":"Giao hữu — người thắng: "+esc(m.winner===m.challenger_id?m.challenger_name:m.opponent_name)):mineAct?"Đã gửi lượt của bạn · đang chờ "+esc(isA?m.opponent_name:m.challenger_name):foeAct?esc(isA?m.opponent_name:m.challenger_name)+" đã chọn lượt · hãy hành động":"Giao hữu 1v1 · cả hai chọn hành động trong cùng lượt; trận phân giải sau khi cả hai gửi."}</p>
          <div style="max-height:24vh;overflow:auto;border:1px solid var(--line);padding:8px;font-size:12px;line-height:1.5;">${logs||"Trận đấu bắt đầu — hãy chọn hành động."}</div>`;
        const op=RPGCombat.options(snap.B,local);
        setLiveFooter(liveMainButtons(m,snap,mine,local,op),[m.status,m.current_round,!!mineAct,liveMenu.mode,liveMenu.pendingAction&&liveMenu.pendingAction.id].join("|"));
        if(m.status==="active" && !mineAct && !snap.info.pending.includes(local.uid)){
          const skipKey=m.current_round+":"+mine;
          if(liveMenu.skipKey!==skipKey){liveMenu.skipKey=skipKey;await rpc("submit_live_action",{p_key:getKey(),p_match:id,p_action:{type:"skip"}});liveMenu.footerKey="";}
        }
      } else {
        $("mgTitle").textContent=m.status==="pending"?"⌛ ĐANG CHỜ ĐỐI THỦ":"⚔ TRẬN ĐÃ ĐÓNG";
        $("mgBody").innerHTML=`<p style="font-size:14px;">${m.status==="pending"?"Đã gửi lời mời cho "+esc(m.opponent_name)+". Trận bắt đầu khi họ chấp nhận.":m.status==="rejected"?"Đối thủ đã từ chối lời mời.":m.status==="expired"?"Lời mời hết hạn.":"Trận không còn hoạt động."}</p><p style="font-size:12px;color:var(--text-dim);">Cửa sổ này tự kiểm tra trạng thái mỗi giây.</p>`;
        setLiveFooter([{label:"Bỏ lời mời",danger:true,onClick:()=>forfeitLiveMatch({id})},{label:"Đóng cửa sổ",onClick:()=>{stopLivePolling();closeArena();}}],[m.status,m.updated_at].join("|"));
      }
    } catch(e) {
      if(liveMenu && liveMatchId===id){$("mgBody").innerHTML=`<p style="color:var(--blood-bright);">${esc(niceError(e))}</p>`;}
    } finally { if(liveMenu && liveMatchId===id) liveMenu.busy=false; }
  }
  function openLiveMatch(id) {
    stopLivePolling(); liveMatchId=id; liveMenu={mode:"main",pendingAction:null,footerKey:"",skipKey:null,busy:false,finishing:false};
    modal("⌛ ĐANG KẾT NỐI TRẬN PvP",`<p>Đang đồng bộ trạng thái trận...</p>`,[{label:"Đóng",onClick:()=>{stopLivePolling();closeArena();}}]);
    liveTick(id); livePollTimer=setInterval(()=>liveTick(id),1000);
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
    me.pvp = true;   // áp dụng hệ số cân bằng PvP cho nhân vật của bạn trong trận thử
    const st = RPG.getStats(me); me.items = {}; me.hp = st.hp; me.maxHp = st.hp;   // đấu trường: HP đầy, không dùng vật phẩm
    const ghost = TiuArena.makeGhost(v.build, "GHOST_" + String(opp.id).slice(0, 8));
    closeModal(true);
    startBattle({ enemyIds: [ghost.id], enemyFighters: [ghost], allyFighters: [], final: false, arena: true,
      cleanup: () => { me.pvp = false; me.items = stash.items; me.maxHp = RPG.getStats(me).hp; me.hp = Math.max(1, Math.min(stash.hp, me.maxHp)); },
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
    const auth = getAuth();
    if (auth) {
      modal("⚙ TÀI KHOẢN", '<div class="arenaAccountCard"><span class="arenaEyebrow">ĐANG ĐĂNG NHẬP</span><h3>' + esc(auth.user && auth.user.email || "Tài khoản The TIU") + '</h3><p>Slot nhân vật đang dùng: <b>0' + activeSlot() + '</b></p></div>', [
        { label: "↔ Đổi nhân vật", primary: true, onClick: pageSlots },
        { label: "🚪 Đăng xuất", danger: true, onClick: signOutAccount },
        { label: "← Quay lại", onClick: pageHome }
      ]);
      return;
    }
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
  async function signOutAccount() {
    const session = await authSessionFresh();
    if (session) { try { await authHttp("/auth/v1/logout", {}, session); } catch (e) { /* vẫn xóa phiên cục bộ */ } }
    const scopedSlot = accountScopedKey(LS_SLOT), scopedNewSlot = accountScopedKey("tiu_active_slot_new");
    setAuth(null); setKey(""); accountSlotPlayerIds = new Set();
    try { localStorage.removeItem(scopedSlot); localStorage.removeItem(scopedNewSlot); } catch (e) { /* bỏ qua */ }
    if (liveInboxTimer) { clearInterval(liveInboxTimer); liveInboxTimer = null; }
    pageAuth("Bạn đã đăng xuất khỏi tài khoản này trên thiết bị.");
  }

  /* ---------- gắn vào giao diện ---------- */
  function mount() {
    const b1 = $("arenaBtn"), b2 = $("pauseArenaBtn");
    if (b1) b1.onclick = openArena;
    if (b2) b2.onclick = openArena;
    const playerCard = $("playerArenaBtn");
    if (playerCard) playerCard.onclick = openArena;
    startLiveInboxPolling();
    // Gõ chữ trong ô nhập không được kích hoạt phím tắt của game
    window.addEventListener("keydown", (e) => { const t = e.target; if (t && t.tagName === "INPUT") e.stopPropagation(); }, true);
    window.addEventListener("keyup", (e) => { const t = e.target; if (t && t.tagName === "INPUT") e.stopPropagation(); }, true);
  }
  window.TiuCloud = { enabled: ENABLED, open: openArena, autoSave: autoSave, getKey: getKey };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
