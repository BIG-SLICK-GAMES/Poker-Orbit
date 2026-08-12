const CACHE_NAME = "poker-orbit-mobile-v80";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/manifest.json",
  "/icon.svg",
  "/src/app.js",
  "/src/bonus-wheel.js",
  "/src/bonus-icons.js",
  "/src/camera.js",
  "/src/card-animation.js",
  "/src/master-control.js",
  "/src/ownership-highlights.js",
  "/src/purchase-auction.js",
  "/src/slot-reel.js",
  "/src/turn.js",
  "/assets/bonus-icons/100rp.png",
  "/assets/bonus-icons/50off.png",
  "/assets/bonus-icons/bankrupt.png",
  "/assets/bonus-icons/buy1get150.png",
  "/assets/bonus-icons/free.png",
  "/assets/bonus-icons/nosale.png",
  "/assets/bonus-icons/pic.png",
  "/assets/bonus-icons/shield.png",
  "/assets/bonus-icons/spinagain.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseCopy))
          .catch(() => {});
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
      .catch(() => caches.match("/index.html"))
  );
});
