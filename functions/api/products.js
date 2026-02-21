export async function onRequest(context) {
  const url = new URL(context.request.url);
  const page = Number(url.searchParams.get("page") || 1);
  const limit = 20;

  const cache = caches.default;
  const cacheKey = new Request("https://cache/products");

  let response = await cache.match(cacheKey);
  let csvText;

  if (!response) {
    const csvRes = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");
    csvText = await csvRes.text();

    response = new Response(csvText, {
      headers: { "Cache-Control": "public, max-age=86400" }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    csvText = await response.text();
  }

  const rows = csvText.split("\n").map(r => r.trim()).slice(1);

  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);

  const products = slice.map(row => {
    const cols = row.split(",");
    return {
      sku: cols[0],
      name: cols[1],
      price: cols[3],
      image: cols[5]
    };
  });

  return Response.json(products);
}