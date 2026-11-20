/* =========================================================================
   kbnav.js — ĐIỀU HƯỚNG BÀN PHÍM CHO MỌI LỰA CHỌN NGOÀI TRẬN ĐẤU
   Nạp SAU script.js. Menu chiến đấu & modal (shop/túi/NPC...) đã có sẵn trong script.js.
   File này bổ sung:
     - Lựa chọn hội thoại (VN):  ↑↓ / W S chọn · Enter/Space/J/E xác nhận · 1-4 chọn nhanh (có sẵn)
     - Tiếp tục hội thoại:       Enter / Space / J
     - Menu chính, Tạm dừng, Game over, Thắng đêm, Jumpscare
     - Cài đặt: ↑↓ chọn dòng · Enter bật/tắt · ←→ chỉnh âm lượng · Esc quay lại
     - Bản đồ: ←↑↓→ chọn khu vực liền kề (viền xanh) · Enter đi · Esc/M đóng
   ========================================================================= */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cur = null;          // phần tử đang được chọn
  var curScope = null;

  function visible(el) {
    if (!el || el.disabled) return false;
    if (el.closest && el.closest(".hidden")) return false;
    return el.getClientRects().length > 0;
  }
  function shown(id) { var el = $(id); return !!el && !el.classList.contains("hidden"); }
  function mark(el) {
    if (cur && cur !== el) cur.classList.remove("kb");
    cur = el || null;
    if (cur) { cur.classList.add("kb"); if (cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" }); }
  }
  function clearMark() { if (cur) cur.classList.remove("kb"); cur = null; }

  /* Xác định phạm vi đang hoạt động: trả về { name, items, back } hoặc null */
  function scope() {
    if(window.TiuTutorial && window.TiuTutorial.isActive()) return null;
    // Trận đấu / modal / QTE đã có bộ điều khiển riêng
    if (typeof isBattleActive === "function" && isBattleActive()) return null;
    if (shown("mgModal")) return null;

    if (shown("vnOverlay")) {
      var ch = Array.prototype.slice.call(document.querySelectorAll("#vnChoices .vnChoice"));
      if (shown("vnChoices") && ch.length) return { name: "vnChoices", items: ch };
      return { name: "vn", items: [] };
    }
    if (shown("settingsScreen")) {
      var rows = [];
      document.querySelectorAll("#settingsWrap .settingRow").forEach(function (r) {
        var btns = r.querySelectorAll("button");
        if (btns.length) btns.forEach(function (b) { if (visible(b)) rows.push(b); });
        else rows.push(r);
      });
      rows.push($("backFromSettings"));
      return { name: "settings", items: rows, back: $("backFromSettings") };
    }
    if (shown("pauseMenu")) return { name: "list", items: pick(["pauseResumeBtn", "pauseSaveBtn", "pauseSettingsBtn", "pauseMainMenuBtn"]), back: $("pauseResumeBtn") };
    if (shown("jumpscareOverlay")) {
      var j = pick(["jsContinueBtn", "jsGiveUpBtn"]);
      return j.length ? { name: "list", items: j } : null;
    }
    if (shown("gameOverScreen")) return { name: "list", items: pick(["retryBtn", "menuFromGameOver"]) };
    if (shown("winScreen")) return { name: "list", items: pick(["nextNightBtn", "menuFromWin"]) };
    if (shown("titleScreen")) return { name: "list", items: pick(["continueBtn", "startBtn", "settingsBtn"]) };
    if (shown("mapModal")) {
      var rn = Array.prototype.slice.call(document.querySelectorAll("#mapSvgWrap .room-node.reachable"));
      return { name: "map", items: rn, back: $("closeMapBtn") };
    }
    return null;
  }
  function pick(ids) { return ids.map($).filter(visible); }

  /* Tự đánh dấu mục đầu tiên khi một scope mới xuất hiện */
  var lastKey = "";
  function sync() {
    var sc = scope();
    var key = sc ? sc.name + ":" + sc.items.length + ":" + (sc.items[0] ? (sc.items[0].id || sc.items[0].textContent.slice(0, 12)) : "") : "";
    if (key !== lastKey || (cur && sc && sc.items.length && !sc.items.includes(cur))) {
      lastKey = key; clearMark();
      if (sc && sc.items.length && sc.name !== "vnChoices") mark(sc.items[0]);
      if (sc && sc.name === "vnChoices") { // chờ 350ms để tránh bấm nhầm khi đang spam J qua thoại
        setTimeout(function () { var s2 = scope(); if (s2 && s2.name === "vnChoices" && !cur) mark(s2.items[0]); }, 350);
      }
    }
    curScope = sc;
    return sc;
  }
  setInterval(sync, 120);
  window.addEventListener('keydown',function(e){
    if(e.key!=='Tab')return;
    var ids=['tutLayer','mgModal','vnOverlay','settingsScreen','pauseMenu','jumpscareOverlay','gameOverScreen','winScreen','titleScreen','mapModal','battleOverlay'];
    var panel=ids.map($).find(function(el){return el && visible(el) && (el.id!=='tutLayer'||el.classList.contains('on'));});
    if(!panel)return;
    var items=Array.from(panel.querySelectorAll('button,input,select,textarea,[tabindex="0"]')).filter(visible);
    if(!items.length){e.preventDefault();return;}
    var at=items.indexOf(document.activeElement);
    e.preventDefault();
    var next=at<0?(e.shiftKey?items.length-1:0):(at+(e.shiftKey?-1:1)+items.length)%items.length;
    items[next].focus({preventScroll:true}); items[next].scrollIntoView({block:'nearest'});
  },true);

  function activate(el) {
    if (!el) return;
    if (el.classList.contains("toggle")) { el.click(); return; }
    if (el.classList.contains("settingRow")) { var t = el.querySelector(".toggle"); if (t) t.click(); return; }
    el.click();
  }

  document.addEventListener('focusin',function(e){
    var sc=scope(); if(sc && sc.items.includes(e.target)) mark(e.target);
    else if(sc && sc.name==='settings' && e.target.type==='range') mark(e.target.closest('.settingRow'));
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && t.type !== "range") || t.isContentEditable)) return;
    var sc = sync();
    if (!sc) return;
    var k = (e.key || "").toLowerCase();
    var eat = function () { e.preventDefault(); e.stopImmediatePropagation(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); };
    var confirmKey = (k === "enter" || k === " " || k === "j" || k === "e");

    /* Hội thoại thường: Enter/Space tiếp tục (J đã có sẵn) */
    if (sc.name === "vn") {
      if ((k === "enter" || k === " ") && window.TiuGame) { eat(); if(!e.repeat) window.TiuGame.nextDialogue(); }
      return;
    }

    var items = sc.items;
    if (!items.length) return;
    var idx = items.indexOf(cur);
    var vertical = (k === "arrowdown" || k === "s" || k === "arrowup" || k === "w");
    var horizontal = (k === "arrowright" || k === "d" || k === "arrowleft" || k === "a");
    var fwd = (k === "arrowdown" || k === "s" || k === "arrowright" || k === "d");

    /* Cài đặt: ←→ chỉnh thanh trượt, ↑↓ đổi dòng */
    if (sc.name === "settings") {
      var row = cur && cur.classList && cur.classList.contains("settingRow") ? cur : null;
      var slider = row && row.querySelector('input[type="range"]');
      if (horizontal && slider) {
        eat();
        var step = fwd ? 5 : -5;
        slider.value = Math.max(+slider.min, Math.min(+slider.max, (+slider.value) + step));
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (vertical) { eat(); mark(items[(Math.max(idx, 0) + (fwd ? 1 : -1) + items.length) % items.length]); return; }
      if (confirmKey && !e.repeat) { eat(); activate(cur || items[0]); return; }
      if ((k === "escape" || k === "backspace" || k === "x") && !e.repeat) { eat(); $("backFromSettings").click(); return; }
      return;
    }

    if (vertical || horizontal) {
      eat();
      mark(items[idx < 0 ? 0 : (idx + (fwd ? 1 : -1) + items.length) % items.length]);
      return;
    }
    if (confirmKey) {
      if (sc.name === "vnChoices" && !cur) { eat(); return; } // chưa highlight -> bỏ qua để khỏi chọn nhầm
      eat();
      if (!e.repeat) activate(cur && items.indexOf(cur) >= 0 ? cur : items[0]);
      return;
    }
    if (k >= "1" && k <= "9" && sc.name !== "vnChoices") { // vnChoices đã có 1-4 sẵn
      var n = items[parseInt(k, 10) - 1];
      if (n) { eat(); if (!e.repeat) activate(n); }
      return;
    }
    if ((k === "escape" || k === "backspace" || k === "x" || (k === "m" && sc.name === "map")) && sc.back && !e.repeat) {
      eat(); sc.back.click();
    }
  }, true);
})();
