/* mine-site-message-badge.js */
;(function () {
  'use strict';

  function getSB() {
    return window.SB_CONFIG || null;
  }

  function buildHeaders(SB) {
    try {
      if (SB && typeof SB.headers === 'function') return SB.headers();
    } catch (e) {}
    // Fallback if SB.headers() is not available
    var key = (SB && (SB.anonKey || SB.anon_key || SB.apikey || SB.apiKey)) || '';
    var h = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (key) {
      h.apikey = key;
      h.Authorization = 'Bearer ' + key;
    }
    return h;
  }

  function getUserId() {
    try {
      return (
        localStorage.getItem('sb_user_id_v1') ||
        localStorage.getItem('currentUserId') ||
        null
      );
    } catch (e) {
      return null;
    }
  }

  async function ensureUserId() {
    var uid = getUserId();
    if (uid) return uid;

    if (window.ExaAuth && typeof window.ExaAuth.ensureSupabaseUserId === 'function') {
      try {
        uid = await window.ExaAuth.ensureSupabaseUserId();
      } catch (e) {}
    }
    return uid || null;
  }

  function injectStyleOnce() {
    if (document.getElementById('siteMsgBadgeStyle')) return;
    var style = document.createElement('style');
    style.id = 'siteMsgBadgeStyle';
    style.textContent =
      '.site-msg-badge{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:999px;background:#ff3b30;}' +
      '.site-msg-icon{position:relative;}';
    document.head.appendChild(style);
  }

  function findSiteMessageItem() {
    // Prefer stable selector: icon alt="Site message"
    var img = document.querySelector('.section-item img[alt="Site message"]');
    if (img) {
      var item = img.closest('.section-item');
      if (item) return item;
    }
    // Fallback: label text
    var labels = document.querySelectorAll('.section-item .section-label');
    for (var i = 0; i < labels.length; i++) {
      if ((labels[i].textContent || '').trim() === 'Site message') {
        return labels[i].closest('.section-item');
      }
    }
    return null;
  }

  function setBadgeVisible(visible) {
    injectStyleOnce();
    var item = findSiteMessageItem();
    if (!item) return;

    var icon = item.querySelector('.section-icon') || item;
    if (!icon) return;

    icon.classList.add('site-msg-icon');

    var badge = icon.querySelector('.site-msg-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'site-msg-badge';
      icon.appendChild(badge);
    }
    badge.style.display = visible ? 'block' : 'none';
  }

  async function hasUnread(uid) {
    var SB = getSB();
    if (!SB || !SB.url) return false;

    var url =
      SB.url +
      '/rest/v1/user_messages?select=id' +
      '&user_id=eq.' + encodeURIComponent(uid) +
      '&is_read=eq.false' +
      '&limit=1';

    try {
      var res = await fetch(url, { method: 'GET', headers: buildHeaders(SB) });
      if (!res.ok) return false;
      var data = await res.json();
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      return false;
    }
  }

  async function run() {
    // Fast initial render from localStorage (optional)
    try {
      var cached = localStorage.getItem('site_msg_unread');
      if (cached === '1') setBadgeVisible(true);
      if (cached === '0') setBadgeVisible(false);
    } catch (e) {}

    var uid = await ensureUserId();
    if (!uid) {
      setBadgeVisible(false);
      return;
    }

    var unread = await hasUnread(uid);
    setBadgeVisible(unread);

    try {
      localStorage.setItem('site_msg_unread', unread ? '1' : '0');
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
