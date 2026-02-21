export async function onRequest(context) {

  const { request, next } = context;
  const cache = caches.default;

  const url = new URL(request.url);

  /* STATIC */
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/) ||
    url.pathname.startsWith("/assets/")
  ) {
    return next();
  }

  /* JSON */
  if (url.pathname.endsWith(".json")) {

    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await next();

    const clone = response.clone();
    clone.headers.set("Cache-Control", "public, max-age=3600");

    await cache.put(request, clone);

    return response;
  }

  /* HTML */
  const response = await next();

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {

    const clone = response.clone();

    /* 🔥 ÉP MIME CHO SAFARI */
    clone.headers.set(
      "Content-Type",
      "text/html; charset=UTF-8"
    );

    clone.headers.set(
      "Cache-Control",
      "public, max-age=86400"
    );

    await cache.put(request, clone);

    return response;
  }

  return response;
}