export async function onRequest(context) {

  const { request, next } = context;
  const cache = caches.default;

  const url = new URL(request.url);

  /* STATIC */
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.startsWith("/assets/")
  ) {
    return next();
  }

  /* JSON CACHE */
  if (url.pathname.endsWith(".json")) {

    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await next();

    const newResponse = response.clone();   // 🔥 FIX

    newResponse.headers.set(
      "Cache-Control",
      "public, max-age=3600"
    );

    await cache.put(request, newResponse);

    return response;
  }

  /* HTML CACHE */
  const cacheKey = new Request(request.url);

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) return cachedResponse;

  const response = await next();

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {

    const newResponse = response.clone();   // 🔥 FIX

    newResponse.headers.set(
      "Cache-Control",
      "public, max-age=86400"
    );

    await cache.put(cacheKey, newResponse);
  }

  return response;
}