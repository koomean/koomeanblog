(() => {
  const key = 'kms_blog_preferences';
  const options = {
    accent: ['blue', 'violet', 'teal', 'rose'],
    textSize: ['default', 'large', 'extra'],
    density: ['comfortable', 'compact'],
    motion: ['system', 'reduce']
  };
  const root = document.documentElement;
  const panel = document.getElementById('set-panel');
  const controls = [...panel.querySelectorAll('[data-blog-preference]')];
  const status = document.getElementById('settings-status');
  const defaults = Object.fromEntries(Object.entries(options).map(([name, values]) => [name, values[0]]));

  function read() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key)); } catch { return { ...defaults }; }
    return Object.fromEntries(Object.entries(options).map(([name, values]) => [
      name, values.includes(saved?.[name]) ? saved[name] : defaults[name]
    ]));
  }

  let preferences = read();
  function apply() {
    Object.assign(root.dataset, preferences);
    for (const control of controls) {
      const value = preferences[control.dataset.blogPreference];
      if (control.type === 'radio') control.checked = control.value === value;
      else control.value = value;
    }
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
      return true;
    } catch { return false; }
  }

  function report(message, saved) {
    status.textContent = saved ? message : 'ใช้การตั้งค่าสำหรับครั้งนี้ เบราว์เซอร์ไม่อนุญาตให้บันทึก';
  }

  panel.addEventListener('change', event => {
    const control = event.target;
    if (control.hasAttribute('data-koo-theme')) {
      status.textContent = '';
      return;
    }
    const name = control.dataset.blogPreference;
    if (!Object.hasOwn(options, name) || !options[name].includes(control.value)) return;
    preferences[name] = control.value;
    apply();
    report('บันทึกการตั้งค่าแล้ว', save());
  });
  document.getElementById('settings-reset').addEventListener('click', () => {
    preferences = { ...defaults };
    apply();
    const saved = save();
    const themeSaved = window.KooTheme.set('auto');
    report('คืนค่าเริ่มต้นแล้ว', saved && themeSaved);
  });
  window.addEventListener('storage', event => {
    if (event.storageArea !== localStorage || (event.key !== key && event.key !== null)) return;
    preferences = read();
    apply();
    status.textContent = '';
  });
  apply();
})();

const blogReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function blogScrollBehavior() {
  return blogReducedMotion.matches || document.documentElement.dataset.motion === 'reduce' ? 'instant' : 'smooth';
}
