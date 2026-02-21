export async function onRequest(context) {

  const { request, next } = context;
  const cache = caches.default;

  const url = new URL(request.url);

  /* ===============================
     BYPASS STATIC
  =============================== */
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/) ||
    url.pathname.startsWith("/assets/")
  ) {
    return next();
  }

  /* ===============================
     CACHE JSON
  =============================== */
  if (url.pathname.endsWith(".json")) {

    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await next();

    const headers = new Headers(response.headers);

    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  /* ===============================
     CACHE HTML
  =============================== */

  const cacheKey = new Request(request.url);

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await next();

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {

    const headers = new Headers(response.headers);

    headers.set("Cache-Control", "public, max-age=86400");

    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

    await cache.put(cacheKey, newResponse.clone());

    return newResponse;
  }

  return response;
}