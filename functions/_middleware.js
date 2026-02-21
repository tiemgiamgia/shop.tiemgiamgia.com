export async function onRequest(context) {

  const { request, next } = context;
  const cache = caches.default;

  const url = new URL(request.url);

  /* ===============================
     🔥 KHÔNG CACHE FILE TĨNH
  =============================== */
  if (
    url.pathname.startsWith("/site.css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".webp")
  ) {
    return next();
  }

  const cacheKey = new Request(request.url);

  /* ===============================
     1️⃣ CHECK EDGE CACHE
  =============================== */
  let response = await cache.match(cacheKey);

  if (response) {
    return response;   // 🚀 TTFB siêu nhanh
  }

  /* ===============================
     2️⃣ SSR RENDER
  =============================== */
  response = await next();

  /* ===============================
     3️⃣ CHỈ CACHE HTML
  =============================== */
  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {

    const cachedResponse = new Response(response.body, response);

    cachedResponse.headers.set(
      "Cache-Control",
      "public, max-age=86400"
    );

    await cache.put(cacheKey, cachedResponse.clone());
  }

  return response;
}