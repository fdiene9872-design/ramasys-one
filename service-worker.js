/* RAMASYS One PWA — navigation-only offline fallback.
   Supabase/API/auth requests and private user data are never cached here. */
const CACHE_NAME = "ramasys-one-shell-v1";
const APP_SCOPE = new URL(self.registration.scope);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("ramasys-one-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return (await cache.match(request)) || (await cache.match(new URL("./", APP_SCOPE).href)) || new Response(
        "<main style=\"font-family:system-ui;padding:2rem\"><h1>RAMASYS One</h1><p>Connexion Internet indisponible. Reconnectez-vous pour accéder aux données de votre organisation.</p></main>",
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 }
      );
    }
  })());
});
