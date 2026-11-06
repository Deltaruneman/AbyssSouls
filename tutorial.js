/* =========================================================================
   tutorial.js — HƯỚNG DẪN TRỰC QUAN CHO NGƯỜI CHƠI MỚI
   Nạp SAU script.js. Hiện "đèn rọi" (spotlight) vào đúng phần giao diện đang được giải thích.
   - Tự bật lần đầu: hướng dẫn CƠ BẢN (đêm 1), CHIẾN ĐẤU (trận đầu), TÀI NĂNG (lần có điểm mới ở Lv3).
   - Phím: Enter / → / Space = tiếp · ← = lùi · Esc = bỏ qua · H = mở menu hướng dẫn bất cứ lúc nào.
   - Trạng thái "đã xem" lưu ở localStorage (tiu_tut_done).
   ========================================================================= */
(function () {
  "use strict";
  const LS = "tiu_tut_done";
  const $ = (id) => document.getElementById(id);
  const done = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } };
  const markDone = (k) => { try { const d = done(); d[k] = true; localStorage.setItem(LS, JSON.stringify(d)); } catch (e) { /* bỏ qua */ } };

  /* ------------------------------ NỘI DUNG CÁC BÀI ------------------------------ */
  const TOURS = {
    basic: { name: "Cơ bản", icon: "🧭", steps: [
      { title: "Chào mừng đến The TIU", text: "5 sinh viên thiếu ĐRL, chỉ 1 suất tốt nghiệp loại Giỏi. Sức mạnh của bạn là <b>ý chí</b> được The TIU mô phỏng thành hình hài. Hướng dẫn này dài khoảng 1 phút — bấm <b>Enter</b> để đi tiếp, <b>Esc</b> để bỏ qua." },
      { sel: "#hud", title: "Thanh trạng thái", text: "Giờ trong ca trực, <b>HP</b>, thanh kinh nghiệm, <b>Thể lực</b> đi lại và nơi The TIU được thấy lần cuối. Hết giờ ca là hết đêm." },
      { sel: "#energyOuter", title: "Thể lực đi lại", text: "Mỗi lần sang khu vực khác tốn <b>20 thể lực</b>. Cạn thể lực mà vẫn đi thì sẽ bị <b>đánh lén</b> (vào trận chỉ còn 50% HP, mọi skill đang hồi chiêu). Nghỉ ở Căn tin để hồi." },
      { sel: "#roomBanner", title: "Bản đồ khu vực", text: "Di chuyển bằng <b>WASD</b> hoặc phím mũi tên. Đứng cạnh một vật rồi bấm <b>E</b>: cửa sang khu khác, bảng sự cố (⚠ để kiếm ĐRL), điểm nhặt đồ, NPC, quầy Căn tin." },
      { sel: "#miniMapWrap", title: "Sơ đồ", text: "Cho bạn biết đang ở đâu. Bấm <b>M</b> để phóng to và chọn khu vực liền kề để đi." },
      { sel: "#nightBrief", title: "Mục tiêu đêm", text: "Ghi biến cố của đêm (mất điện, sương mù...), các phòng có <b>mini-boss</b> canh giữ và The TIU lần cuối thấy ở đâu. Đọc trước khi di chuyển." },
      { sel: "#actionPane", title: "Hành động", text: "Nút hành động trong phòng hiện ở đây. Đối thủ gặp được ở phòng thì chọn <b>nói chuyện / thách đấu</b>. Nói chuyện nhiều để tăng <b>Tin tưởng</b>: đủ 2 điểm sẽ lập đội và nhận nhiệm vụ riêng." },
      { sel: "#bagBtn", title: "Túi đồ [B]", text: "Vật phẩm hồi máu, giải độc... Mở bằng <b>B</b>." },
      { sel: "#talentBtn", title: "Tài năng [T]", text: "Bạn đang có <b>1 điểm Tài Năng</b> — học ngay! 3 nhánh: Công kích, Bền bỉ, Thể lực. Cứ 2 cấp có thêm 1 điểm, mỗi nhiệm vụ đồng đội +1." },
      { sel: "#logPane", title: "Nhật ký ca trực", text: "Mọi sự kiện được ghi ở đây: ai vừa đến, sự cố mới, kết quả trận." },
      { title: "Hãy tránh The TIU", text: "Nếu nó bắt được bạn, bạn phải <b>đối đầu</b> (rất khó) hoặc <b>bỏ cuộc</b> — và đó là một bad ending. Căn tin trong giờ an toàn là nơi trú ẩn. Bấm <b>H</b> bất cứ lúc nào để xem lại hướng dẫn." }
    ] },
    battle: { name: "Chiến đấu", icon: "⚔", steps: [
      { sel: "#pkAllyInfo", title: "Thẻ nhân vật", text: "<b>HP</b> là máu. <b>NỘ</b> tích khi đánh và bị đánh — đầy thanh là dùng được <b>Ultimate</b>. <b>TL</b> (Thể lực chiến đấu) là tài nguyên cho skill thường." },
      { sel: "#pkEnemyInfo", title: "Đối thủ", text: "Xem HP và Nộ của địch. <b>Nộ đầy</b> nghĩa là nó sắp tung Ultimate. Dòng <b>HỆ ĐỊCH</b> ở lời nhắc cho biết điểm yếu — hiện ❓ nếu bạn chưa khám phá." },
      { sel: "#pkMenu", title: "Chọn lệnh", text: "Dùng <b>↑↓</b> + <b>Enter</b> (hoặc phím số). <b>Tấn công</b>: +Nộ, +TL. <b>Kỹ năng</b>: tốn TL, có hồi chiêu. <b>Phòng thủ</b>: giảm sát thương và <b>+25 TL</b>. <b>Vật phẩm</b>. <b>ULTIMATE</b> khi đủ Nộ." },
      { sel: "#pkTextBox", title: "Hệ thuộc tính & chí mạng", text: "💥 <b>Yếu điểm</b>: ×1.3 sát thương. 🛡 <b>Kháng</b>: ×0.7. ✨ <b>Chí mạng</b> theo SPD. Đánh thử để lộ hệ của địch rồi chọn skill khắc hệ." },
      { sel: "#pkTurn", title: "Mẹo sinh tồn", text: "Địch <b>Nộ đầy</b> → hãy <b>Phòng thủ</b>: đỡ đúng Ultimate chỉ nhận 30% sát thương và được +25 Nộ. Hết TL thì phòng thủ để hồi sức, đừng cố xả skill." }
    ] },
    talent: { name: "Tài năng & trang bị", icon: "⭐", steps: [
      { sel: "#talentBtn", title: "Bạn có điểm Tài Năng mới", text: "Bấm <b>T</b> để mở. Học từ trên xuống trong mỗi nhánh. Bạn có thể <b>Tẩy điểm</b> miễn phí để thử build khác." },
      { sel: "#bagBtn", title: "Trang bị", text: "Thu thập linh kiện (từ điểm nhặt đồ và <b>mini-boss</b>) rồi chế tạo <b>vũ khí / giáp / bùa</b> ở Bàn chế tạo trong Căn tin. Đồ chế xong tự được mang vào." }
    ] }
  };

  /* ------------------------------ ENGINE ĐÈN RỌI ------------------------------ */
  let active = null;            // { key, steps, i, prevPaused, shownAt }
  const snoozed = {};           // bài đã bị đóng bằng Esc trong phiên này (không tự bật lại, chưa tính là "đã xem")
  let lastInputAt = 0;          // lần cuối người chơi bấm phím / chuột (để không bật hướng dẫn khi họ đang bấm liên tục để bỏ qua thoại)
  let idleSince = 0;
  const STEP_GUARD_MS = 700;    // sau khi một bước hiện ra, bỏ qua phím trong 0,7 giây để không bị "nhảy bước" do bấm nhanh
  let layer = null, spot = null, card = null;

  const CSS = "#tutLayer{display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:150;}#tutLayer.on{display:block;}#tutShield{position:absolute;left:0;top:0;right:0;bottom:0;background:transparent;}#tutLayer.nospot #tutShield{background:rgba(0,0,0,.78);}"
    + "#tutSpot{position:fixed;border:2px solid #e2b65c;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,.76),0 0 20px rgba(226,182,92,.65);transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;pointer-events:none;}"
    + "#tutCard{position:fixed;background:#14110d;color:#e8e0d0;border:1px solid #e2b65c;border-radius:6px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.7);font-size:15px;line-height:1.55;z-index:2;max-width:94vw;box-sizing:border-box;font-family:inherit;}"
    + "#tutTitle{font-size:20px;letter-spacing:1px;color:#e2b65c;margin-bottom:6px;font-weight:700;}#tutText b{color:#f3e2b3;}#tutFoot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px;}#tutCount{font-size:13px;color:#a89e8e;}#tutBtns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}"
    + "#tutBtns button{background:#241f18;color:#e8e0d0;border:1px solid #6b5a3a;padding:7px 12px;font-size:14px;cursor:pointer;font-family:inherit;}#tutBtns button.primary{border-color:#e2b65c;background:#3a2f1a;}"
    + "#tutToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#14110d;border:1px solid #e2b65c;color:#e8e0d0;padding:10px 16px;font-size:15px;border-radius:6px;opacity:0;pointer-events:none;transition:all .3s;z-index:160;max-width:92vw;text-align:center;}#tutToast.on{opacity:1;transform:translateX(-50%) translateY(0);}";
  function injectCss() {
    if (document.getElementById("tutStyle")) return;
    const st = document.createElement("style"); st.id = "tutStyle"; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  /* Lớp hướng dẫn có thực sự đang phủ màn hình không? (nếu không -> hủy, tuyệt đối không chặn phím) */
  function layerWorks() {
    try { const cs = getComputedStyle(layer); return cs.position === "fixed" && cs.display !== "none"; } catch (e) { return false; }
  }
  function build() {
    injectCss();
    if (layer) return;
    layer = document.createElement("div"); layer.id = "tutLayer";
    layer.innerHTML = '<div id="tutShield"></div><div id="tutSpot"></div><div id="tutCard" role="dialog" aria-live="polite"><div id="tutTitle"></div><div id="tutText"></div><div id="tutFoot"><span id="tutCount"></span><span id="tutBtns"><button class="btn" id="tutSkip">Bỏ qua</button><button class="btn" id="tutBack">← Lùi</button><button class="btn primary" id="tutNext">Tiếp ▶</button></span></div></div>';
    document.body.appendChild(layer);
    spot = $("tutSpot"); card = $("tutCard");
    $("tutNext").onclick = next; $("tutBack").onclick = back; $("tutSkip").onclick = () => finish("never");
    $("tutSkip").textContent = "Bỏ qua (không hiện lại)";
  }
  function toast(msg) {
    injectCss();
    let el = $("tutToast");
    if (!el) { el = document.createElement("div"); el.id = "tutToast"; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("on"), 4500);
  }
  function visible(el) { return !!el && el.getClientRects().length > 0 && !el.closest(".hidden"); }

  function place(step) {
    const el = step.sel ? document.querySelector(step.sel) : null;
    const W = window.innerWidth, H = window.innerHeight;
    card.style.left = card.style.top = card.style.right = card.style.bottom = card.style.transform = "";
    if (!visible(el)) {
      spot.style.display = "none"; layer.classList.add("nospot");
      card.style.left = "50%"; card.style.top = "50%"; card.style.transform = "translate(-50%,-50%)";
      return;
    }
    const r = el.getBoundingClientRect(), pad = 6;
    spot.style.display = "block"; layer.classList.remove("nospot");
    spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
    // đặt thẻ ở phía có nhiều chỗ nhất (trên / dưới / giữa)
    const cw = Math.min(380, W - 24), spaceBelow = H - r.bottom, spaceAbove = r.top;
    card.style.width = cw + "px";
    let left = Math.max(12, Math.min(W - cw - 12, r.left + r.width / 2 - cw / 2));
    card.style.left = left + "px";
    if (spaceBelow >= 190) card.style.top = Math.min(H - 190, r.bottom + 14) + "px";
    else if (spaceAbove >= 190) card.style.top = Math.max(12, r.top - 14 - card.offsetHeight) + "px";
    else { card.style.top = Math.max(12, (H - card.offsetHeight) / 2) + "px"; card.style.left = (r.left > W / 2 ? 12 : W - cw - 12) + "px"; }
  }
  function render() {
    const st = active.steps[active.i];
    $("tutTitle").textContent = st.title;
    $("tutText").innerHTML = st.text;
    $("tutCount").textContent = (active.i + 1) + " / " + active.steps.length;
    $("tutBack").style.visibility = active.i === 0 ? "hidden" : "visible";
    $("tutNext").textContent = active.i === active.steps.length - 1 ? "Xong ✓" : "Tiếp ▶";
    place(st); place(st);   // gọi 2 lần: lần 2 có chiều cao thật của thẻ
  }
  function start(key, force) {
    if (active) return false;
    const t = TOURS[key];
    if (!t || (!force && done()[key])) return false;
    build();
    active = { key: key, steps: t.steps, i: 0, shownAt: Date.now(), prevPaused: (typeof S !== "undefined" && S) ? !!S.paused : false };
    if (typeof S !== "undefined" && S && S.running && typeof isBattleActive === "function" && !isBattleActive()) S.paused = true;
    layer.classList.add("on");
    if (!layerWorks()) {   // hiển thị lỗi -> hủy ngay, trả lại trạng thái game, không đánh dấu đã xem
      layer.classList.remove("on");
      if (typeof S !== "undefined" && S && S.running) { S.paused = active.prevPaused; S.lastTick = performance.now(); }
      active = null; snoozed[key] = true;
      try { console.warn("[tutorial] Lớp hướng dẫn không hiển thị được — đã hủy."); } catch (e) { /* bỏ qua */ }
      return false;
    }
    render();
    return true;
  }
  function next() { if (!active) return; if (active.i >= active.steps.length - 1) finish("done"); else { active.i++; active.shownAt = Date.now(); render(); } }
  function back() { if (active && active.i > 0) { active.i--; active.shownAt = Date.now(); render(); } }
  /* mode: 'done' = xem hết · 'never' = bấm "Bỏ qua" (không hiện lại) · 'snooze' = Esc (hôm nay thôi, chưa tính đã xem) */
  function finish(mode) {
    if (!active) return;
    if (mode === "snooze") { snoozed[active.key] = true; toast("Bấm H hoặc nút ❓ để xem lại hướng dẫn bất cứ lúc nào."); }
    else markDone(active.key);
    layer.classList.remove("on");
    if (typeof S !== "undefined" && S && S.running && typeof isBattleActive === "function" && !isBattleActive()) { S.paused = active.prevPaused; S.lastTick = performance.now(); }
    active = null;
  }

  /* ------------------------------ MENU HƯỚNG DẪN (H) ------------------------------ */
  function openMenu() {
    if (active) finish("snooze");           // đang có hướng dẫn mở: đóng nó trước, rồi mở menu
    if (typeof showModal !== "function") return;
    const rows = Object.keys(TOURS).map((k) => `<div class="shopItem"><span>${TOURS[k].icon} <b>${TOURS[k].name}</b><br><span style="font-size:12px;color:var(--text-dim);">${TOURS[k].steps.length} bước${done()[k] ? " · đã xem" : ""}</span></span><button class="btn primary" data-tut="${k}">Xem</button></div>`).join("");
    try { showModal("❓ HƯỚNG DẪN", rows + `<p style="font-size:12px;color:var(--text-dim);margin-top:8px;">Bài Chiến đấu cần đang trong một trận để rọi đúng vào từng phần giao diện.</p>`, [
      { label: "Đặt lại tất cả (xem lại từ đầu)", onClick: () => { try { localStorage.removeItem(LS); } catch (e) { /* bỏ qua */ } openMenu(); } },
      { label: "Đóng", primary: true, onClick: () => closeModal() }]); } catch (e) { toast("Không mở được menu hướng dẫn: " + (e && e.message)); try { console.error(e); } catch (x) { /* bỏ qua */ } return; }
    document.querySelectorAll("#mgBody [data-tut]").forEach((b) => {
      b.onclick = () => { const k = b.getAttribute("data-tut"); delete snoozed[k]; closeModal(); setTimeout(() => start(k, true), 60); };
    });
  }

  /* ------------------------------ TỰ BẬT ĐÚNG LÚC ------------------------------ */
  function idle() {
    return typeof S !== "undefined" && S && S.running && !active &&
      !(typeof isBlockingOverlayOpen === "function" && isBlockingOverlayOpen()) &&
      !(typeof VN_ACTIVE !== "undefined" && VN_ACTIVE) && !(typeof TRAVEL !== "undefined" && TRAVEL.busy);
  }
  function poll() {
    if (active) { if (layer && !layerWorks()) finish("snooze"); return; }
    const d = done();
    const calm = Date.now() - lastInputAt > 1500;
    if (!idle()) idleSince = 0; else if (!idleSince) idleSince = Date.now();
    const settled = idleSince && Date.now() - idleSince > 1500 && calm;
    // Trận đầu tiên: khi menu lệnh đã hiện
    if (typeof isBattleActive === "function" && isBattleActive()) {
      const m = $("pkMenu");
      if (!d.battle && !snoozed.battle && calm && m && m.children.length > 0) start("battle");
      return;
    }
    if (!idle() || !settled) return;
    if (!d.basic && !snoozed.basic && !(S.ng > 0) && S.chapter === 1 && S.night === 1) { start("basic"); return; }
    if (d.basic && !d.talent && !snoozed.talent && RPG.getState && RPG.getState() && RPG.player().level >= 3 && RPG.talentPoints(RPG.player()) > 0) start("talent");
  }

  function mount() {
    const hb = $("helpBtn");
    if (hb) { hb.onclick = openMenu; setInterval(() => hb.classList.toggle("pulse", !done().basic), 1000); }
    window.addEventListener("keydown", (e) => {
      const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = (e.key || "").toLowerCase();
      if (active) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.repeat || Date.now() - active.shownAt < STEP_GUARD_MS) return;   // đang bấm dồn để bỏ qua thoại -> không nhảy bước
        if (k === "h") { finish("snooze"); openMenu(); }
        else if (k === "enter" || k === "arrowright" || k === " ") next();
        else if (k === "arrowleft") back();
        else if (k === "escape") finish("snooze");
        return;
      }
      if (k === "h" && !e.ctrlKey && !e.metaKey && !e.altKey && typeof S !== "undefined" && S && S.running && typeof isBlockingOverlayOpen === "function" && !isBlockingOverlayOpen() && !(typeof isBattleActive === "function" && isBattleActive())) {
        e.preventDefault(); e.stopImmediatePropagation(); openMenu();
      }
    }, true);
    window.addEventListener("keydown", () => { lastInputAt = Date.now(); }, true);
    window.addEventListener("mousedown", () => { lastInputAt = Date.now(); }, true);
    window.addEventListener("resize", () => { if (active) render(); });
    setInterval(poll, 800);
  }
  window.TiuTutorial = { start: start, openMenu: openMenu, isActive: () => !!active };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();