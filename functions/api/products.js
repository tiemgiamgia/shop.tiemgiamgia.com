export async function onRequest(context) {
  const url = new URL(context.request.url);
  const page = Number(url.searchParams.get("page") || 1);
  const limit = 20;

  const cache = caches.default;
  const cacheKey = new Request("https://cache/products-json");

  let response = await cache.match(cacheKey);
  let productsJSON;

  if (!response) {
    console.log("Building JSON cache...");

    const csvRes = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");
    const buffer = await csvRes.arrayBuffer();
    const csvText = decodeCSV(buffer);

    const rows = csvText.split("\n").slice(1);

    const products = rows
      .map(row => parseCSVLine(row))
      .filter(cols => cols.length > 5 && cols[0])
      .map(cols => ({
        sku: clean(cols[0]),
        name: clean(cols[1]),
        price: Number(clean(cols[3]) || 0),
        image: clean(cols[5])
      }));

    productsJSON = JSON.stringify(products);

    response = new Response(productsJSON, {
      headers: {
        "Cache-Control": "public, max-age=86400"
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    productsJSON = await response.text();
  }

  const allProducts = JSON.parse(productsJSON);

  const start = (page - 1) * limit;
  const slice = allProducts.slice(start, start + limit);

  return Response.json(slice);
}

/* ================= ENCODING FIX ================= */

function decodeCSV(buffer) {
  try {
    return new TextDecoder("utf-8").decode(buffer);
  } catch {
    return new TextDecoder("windows-1258").decode(buffer);
  }
}

/* ================= CSV PARSER ================= */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else current += char;
  }

  result.push(current);
  return result;
}

/* ================= CLEAN DATA ================= */

function clean(value = '') {
  return value
    .replace(/^"|"$/g, '')
    .replace(/\r/g, '')
    .trim();
}