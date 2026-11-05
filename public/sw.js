// Cache public assets only. Never persist auth, API, user data or OAuth callbacks.
const CACHE = "deepflow-public-v6";
const SHELL = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name !== CACHE &&
                (name.startsWith("deepflow-") || name === "icon-cache-v1"),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization") ||
    url.search ||
    /^\/(api|auth|rest|storage|functions)\//.test(url.pathname)
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        async () =>
          (await caches.match("/offline.html")) ||
          new Response("Connexion indisponible", { status: 503 }),
      ),
    );
    return;
  }
  if (
    !/^\/(assets|icons)\//.test(url.pathname) &&
    !SHELL.includes(url.pathname)
  )
    return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(request, clone)),
            );
          }
          return response;
        }),
    ),
  );
});
