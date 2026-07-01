// 资产台账 Service Worker v5 —— 极简温和版
// 目的：满足 Chrome「可安装 PWA」的最低要求（需有 fetch 处理器），
// 但不预缓存、不 skipWaiting、不 clients.claim，避免任何抢占/卡死。
const CACHE = "cfo-ledger-v5";

self.addEventListener("install", () => {
  // 什么都不做，也不 skipWaiting
});

self.addEventListener("activate", e => {
  // 清掉历史遗留的旧缓存（v2/v3/v4）
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    // 页面：网络优先，离线时才用缓存兜底
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
  }
  // 其他资源：不拦截，走浏览器默认（最不容易出问题）
});
