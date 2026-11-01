/* ═══════════════════════════════════════════════════════
   theme.js – Global Light / Dark Theme Manager
   ═══════════════════════════════════════════════════════ */
"use strict";

(function () {
  function getPreferredTheme() {
    return localStorage.getItem("viva_theme") || localStorage.getItem("viva-theme") || "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("viva_theme", theme);
    localStorage.setItem("viva-theme", theme);

    // Update all theme buttons on the page
    const btns = document.querySelectorAll("#themeToggleBtn, .fui-theme-btn, .theme-toggle-btn");
    btns.forEach(btn => {
      const isDark = theme === "dark";
      btn.setAttribute("title", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
      const icon = btn.querySelector(".theme-icon");
      if (icon) {
        icon.textContent = isDark ? "☀️" : "🌙";
      } else {
        btn.textContent = isDark ? "☀️" : "🌙";
      }
    });
  }

  // Apply immediately to prevent layout flash
  applyTheme(getPreferredTheme());

  function initThemeControls() {
    applyTheme(getPreferredTheme());

    document.querySelectorAll("#themeToggleBtn, .fui-theme-btn, .theme-toggle-btn").forEach(btn => {
      // Remove any duplicate listeners by cloning or direct assignment
      btn.onclick = (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
      };
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeControls);
  } else {
    initThemeControls();
  }
})();
