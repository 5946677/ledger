// 资产台账 Service Worker v4 —— TWA 安全版：不抢首屏、不激进接管，仅做离线兜底
const CACHE = "cfo-ledger-v4";

// 安装：立即完成，不预缓存任何东西（避免 addAll 失败或拖慢首次加载）
self.addEventListener("install", e => {
  // 不调用 skipWaiting —— 让新 SW 正常等待，不打断正在进行的首次导航
});

// 激活：清掉旧版本缓存；不调用 clients.claim（不强行接管已打开的页面）
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // 只处理 GET；其他请求放行
  if (req.method !== "GET") return;

  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // 页面：网络优先，成功则顺便更新缓存；失败（离线）才用缓存兜底
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
  } else {
    // 其他静态资源：缓存优先，没有再走网络并缓存
    e.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached)
      )
    );
  }
});
