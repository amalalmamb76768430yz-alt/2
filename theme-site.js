// theme-site.js
// Internal theme switch (no DB, no external libs). Persists in localStorage.
// Default: night
(function () {
  const STORAGE_KEY = "site_theme";
  const DEFAULT_THEME = "night"; // "night" | "day"

  function getStoredTheme() {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      return t === "day" || t === "night" ? t : null;
    } catch (e) {
      return null;
    }
  }

  function storeTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function ensureStyleInjected() {
    if (document.getElementById("site-theme-style")) return;
    const style = document.createElement("style");
    style.id = "site-theme-style";
    style.textContent = `
      /* Day theme uses an invert filter to safely convert the existing dark UI into a light UI
         across ALL pages without rewriting every inline color. Images/videos are re-inverted. */
      html[data-theme="day"] {
        filter: invert(1) hue-rotate(180deg);
        background: #ffffff;
      }
      html[data-theme="day"] img,
      html[data-theme="day"] video,
      html[data-theme="day"] iframe,
      html[data-theme="day"] canvas {
        filter: invert(1) hue-rotate(180deg);
      }
      /* Keep fixed-position overlays consistent */
      html[data-theme="day"] .toast,
      html[data-theme="day"] .modal,
      html[data-theme="day"] .popup {
        filter: none;
      }
    `;
    document.head.appendChild(style);
  }

  function applyTheme(theme) {
    const t = (theme === "day" || theme === "night") ? theme : DEFAULT_THEME;
    ensureStyleInjected();
    document.documentElement.setAttribute("data-theme", t);
    storeTheme(t);
    updateThemePageUI(t);
  }

  function updateThemePageUI(theme) {
    // Only runs meaningfully on theme.html (but safe everywhere)
    const options = document.querySelectorAll("section.option");
    if (!options || options.length === 0) return;

    options.forEach((opt) => {
      const isDay = !!opt.querySelector(".icon-circle.day");
      const thisTheme = isDay ? "day" : "night";
      const radio = opt.querySelector(".radio");
      if (!radio) return;

      const shouldCheck = (thisTheme === theme);
      // On this template: checked = no 'unchecked' class, unchecked = has 'unchecked'
      if (shouldCheck) {
        radio.classList.remove("unchecked");
      } else {
        radio.classList.add("unchecked");
      }
    });
  }

  function bindThemePageClicks() {
    const options = document.querySelectorAll("section.option");
    if (!options || options.length === 0) return;

    options.forEach((opt) => {
      opt.style.cursor = "pointer";
      opt.addEventListener("click", () => {
        const isDay = !!opt.querySelector(".icon-circle.day");
        applyTheme(isDay ? "day" : "night");
      });
    });
  }

  // Expose helpers (optional)
  window.setSiteTheme = applyTheme;
  window.getSiteTheme = () => document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    const stored = getStoredTheme();
    applyTheme(stored || DEFAULT_THEME);
    bindThemePageClicks();
  });
})();
