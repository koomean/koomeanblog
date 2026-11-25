(() => {
  const origins = [
    "https://koomean.com",
    "https://blog.koomean.com",
    "https://link.koomean.com",
    "https://status.koomean.com"
  ];
  if (!origins.includes(location.origin) || !globalThis.crypto?.randomUUID) return;

  const endpoint = "https://koomean-status.meanchannel52.workers.dev/api/presence";
  const storageKey = "koomean.active-browser.v1";
  const interval = 30_000;
  const idLifetime = 120_000;
  let activeBrowser;
  let lastSent = -Infinity;
  let timer;

  function browserId(now) {
    let id;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored?.expires > now &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(stored.id)) {
        id = stored.id;
      }
    } catch {
      // Keep reporting from this page when browser storage is unavailable.
    }
    id ??= activeBrowser?.expires > now ? activeBrowser.id : crypto.randomUUID();
    activeBrowser = { id, expires: now + idLifetime };
    try {
      localStorage.setItem(storageKey, JSON.stringify(activeBrowser));
    } catch {
      // The in-memory ID still deduplicates heartbeats from this page.
    }
    return id;
  }

  function heartbeat() {
    if (document.visibilityState !== "visible" || document.prerendering) return;
    const elapsed = performance.now();
    if (elapsed - lastSent < 8_000) return;
    lastSent = elapsed;

    void fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: browserId(Date.now()) }),
      keepalive: true
    }).catch(() => {});
  }

  function updateHeartbeat() {
    clearInterval(timer);
    if (document.visibilityState !== "visible" || document.prerendering) return;
    heartbeat();
    timer = setInterval(heartbeat, interval);
  }

  document.addEventListener("visibilitychange", updateHeartbeat);
  document.addEventListener("prerenderingchange", updateHeartbeat);
  window.addEventListener("pageshow", updateHeartbeat);
  window.addEventListener("pagehide", () => clearInterval(timer));
  updateHeartbeat();
})();
