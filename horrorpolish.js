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