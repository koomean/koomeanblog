(() => {
  const key = 'kms_theme';
  const json = false;
  const valid = value => ['auto', 'light', 'dark'].includes(value);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function read() {
    try {
      const saved = localStorage.getItem(key);
      const value = json ? JSON.parse(saved || '{}')?.theme : saved;
      return valid(value) ? value : 'auto';
    } catch { return 'auto'; }
  }
  let preference = read();
  let applied = '';
  function apply() {
    const theme = preference === 'auto' ? (media.matches ? 'dark' : 'light') : preference;
    const changed = applied !== theme || document.documentElement.dataset.themePreference !== preference;
    applied = theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = theme;
    document.querySelectorAll('[data-koo-theme]').forEach(select => { select.value = preference; });
    if (changed) window.dispatchEvent(new CustomEvent('koo-theme-change', { detail: { theme, preference } }));
  }
  window.KooTheme = {
    get preference() { return preference; },
    get theme() { return applied; },
    set(value, persist = true) {
      if (!valid(value)) return;
      preference = value;
      if (persist) {
        try {
          if (json) {
            let saved;
            try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch { saved = {}; }
            if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
            localStorage.setItem(key, JSON.stringify({ ...saved, theme: value }));
          } else localStorage.setItem(key, value);
        } catch { /* Keep the selected theme for this visit when storage is unavailable. */ }
      }
      apply();
    }
  };
  document.addEventListener('change', event => {
    if (event.target.matches?.('[data-koo-theme]')) window.KooTheme.set(event.target.value);
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = read(); apply(); }
  });
  media.addEventListener('change', () => { if (preference === 'auto') apply(); });
  document.addEventListener('DOMContentLoaded', apply);
  apply();
})();
