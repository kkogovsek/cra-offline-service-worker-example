const version = "v7";

async function precache() {
  const menifestRes = await fetch("/asset-manifest.json");
  const manifest = await menifestRes.json();

  const filesToCache = Object.values(manifest.files).concat("/");
  const cache = await caches.open(version);
  console.log("precaching", filesToCache);
  return cache.addAll(filesToCache);
}

self.addEventListener("install", async (e) => {
  e.waitUntil(precache());
});

async function clearCache() {
  const cacheNames = await caches.keys();
  const toClear = cacheNames.filter((v) => v !== version);
  console.log("clearing caches", toClear);
  return Promise.all(toClear.map((v) => caches.delete(v)));
}

self.addEventListener("activate", (e) => {
  e.waitUntil(clearCache());
});

async function cacheFirst(req) {
  if (req.mode === "navigate") {
    try {
      const res = await fetch("/");
      console.log("Serving fresh index.html");
      return res;
    } catch (e) {
      console.log("Fallback navigate request");
      return caches.match("/");
    }
  }
  const url = new URL(req.url);
  const cache = await caches.open(version);
  const res = await cache.match(req);
  if (res) {
    console.log("serving from cache", url.pathname);
    return res;
  }

  console.log("fallback to fetch", url.pathname);
  return fetch(req);
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin && e.request.method === "GET") {
    e.respondWith(cacheFirst(e.request));
  }
});
