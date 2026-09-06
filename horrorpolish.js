/* =========================================================================
   horror-polish.js
   Bổ sung hành vi cho các hiệu ứng mới trong style.css:
     1) Toggle nút cho #miniMapWrap / #logPane trên màn hình < 900px
     2) Tự động kích hoạt hiệu ứng .vhs-glitch mỗi khi #roomTitle đổi nội dung
        (tức là mỗi khi người chơi chuyển phòng) — không cần sửa script.js
     3) Tự động đồng bộ trạng thái "Nguy kịch" (HP = 1) từ #vignette.critical
        sang body.hp-critical để bật hiệu ứng mờ/nhiễu nâng cấp
   File này chỉ cần load SAU script.js (không phụ thuộc thứ tự nội bộ).
   ========================================================================= */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    /* ---------- 1) Toggle mini-map / log trên mobile ---------- */
    var mapBtn = document.getElementById("mapToggleBtn");
    var logBtn = document.getElementById("logToggleBtn");
    var mapWrap = document.getElementById("miniMapWrap");
    var logPane = document.getElementById("logPane");

    function toggle(panel, btn) {
      if (!panel || !btn) return;
      var open = panel.classList.toggle("panel-open");
      btn.classList.toggle("active", open);
    }

    if (mapBtn && mapWrap) {
      mapBtn.addEventListener("click", function () {
        toggle(mapWrap, mapBtn);
      });
    }
    if (logBtn && logPane) {
      logBtn.addEventListener("click", function () {
        toggle(logPane, logBtn);
        // Khi mở nhật ký, tự cuộn xuống dòng mới nhất
        if (logPane.classList.contains("panel-open")) {
          logPane.scrollTop = logPane.scrollHeight;
        }
      });
    }

    /* ---------- 2) VHS glitch tự động khi đổi phòng ---------- */
    var appEl = document.getElementById("app");
    var glitchTimer = null;

    window.triggerVhsGlitch = function () {
      if (!appEl) return;
      document.body.classList.remove("vhs-glitch-active");
      // ép reflow để restart animation nếu đang chạy dở
      void appEl.offsetWidth;
      document.body.classList.add("vhs-glitch-active");
      clearTimeout(glitchTimer);
      glitchTimer = setTimeout(function () {
        document.body.classList.remove("vhs-glitch-active");
      }, 520);
    };

    var roomTitleEl = document.getElementById("roomTitle");
    if (roomTitleEl && "MutationObserver" in window) {
      var lastText = roomTitleEl.textContent;
      var titleObserver = new MutationObserver(function () {
        var nowText = roomTitleEl.textContent;
        if (nowText !== lastText && nowText.trim() !== "" && nowText.trim() !== "—") {
          lastText = nowText;
          window.triggerVhsGlitch();
        } else {
          lastText = nowText;
        }
      });
      titleObserver.observe(roomTitleEl, { childList: true, characterData: true, subtree: true });
    }

    /* ---------- 2b) Mục 1: nhấp nháy môi trường NGẪU NHIÊN theo Mức Độ Hoạt Động ----------
       script.js ghi mức căng thẳng hiện tại (0-100) vào body.dataset.tension mỗi khung hình
       (xem refreshHud()). Ở đây, mỗi ~2.2s ta tung xúc xắc: căng thẳng càng cao thì xác suất
       nháy môi trường (glitchBars/neon) càng lớn -> nhịp chơi cảm giác dồn dập dần đều thay
       vì chỉ giật hình khi đổi phòng. Tách riêng khỏi triggerVhsGlitch() (mục 2 ở trên) vì
       đây là hiệu ứng nhẹ hơn, không rung app, không cần đợi đổi phòng mới xảy ra. */
    window.triggerTensionFlicker = function () {
      document.body.classList.remove("tension-flicker-active");
      void document.body.offsetWidth;
      document.body.classList.add("tension-flicker-active");
      setTimeout(function () {
        document.body.classList.remove("tension-flicker-active");
      }, 240);
    };

    setInterval(function () {
      var titleScreen = document.getElementById("titleScreen");
      if (titleScreen && !titleScreen.classList.contains("hidden")) return; // chỉ trong lúc đang chơi
      var t = parseFloat(document.body.dataset.tension || "0");
      if (!t || isNaN(t) || t < 35) return; // dưới ngưỡng này coi như chưa đủ căng để nháy
      var chance = ((t - 35) / 65) * 0.5; // 0 tại t=35 -> tối đa 0.5 tại t=100
      if (Math.random() < chance) window.triggerTensionFlicker();
    }, 2200);

    /* ---------- 3) Đồng bộ trạng thái Nguy kịch (HP=1) ---------- */
    var vignetteEl = document.getElementById("vignette");
    if (vignetteEl && "MutationObserver" in window) {
      var syncCritical = function () {
        document.body.classList.toggle("hp-critical", vignetteEl.classList.contains("critical"));
      };
      syncCritical();
      var criticalObserver = new MutationObserver(syncCritical);
      criticalObserver.observe(vignetteEl, { attributes: true, attributeFilter: ["class"] });
    }
  });
})();