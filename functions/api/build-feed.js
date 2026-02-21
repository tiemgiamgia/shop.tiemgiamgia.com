export async function onRequest(context) {
  const url = new URL(context.request.url);

  const page = Number(url.searchParams.get("page") || 1);
  const chunkSize = 500;

  const cache = caches.default;
  const cacheKey = new Request(`https://cache/feed-page-${page}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  console.log("Building chunk:", page);

  const csvRes = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");

  const buffer = await csvRes.arrayBuffer();
  const csvText = decodeCSV(buffer);

  const rows = csvText.split("\n").slice(1);

  const start = (page - 1) * chunkSize;
  const slice = rows.slice(start, start + chunkSize);

  const products = slice
    .map(row => parseCSVLine(row))
    .filter(cols => cols.length > 5 && cols[0])
    .map(cols => ({
      sku: clean(cols[0]),
      name: clean(cols[1]),
      url: clean(cols[2]),
      price: Number(clean(cols[3]) || 0),
      discount: Number(clean(cols[4]) || 0),
      image: clean(cols[5]),
      desc: clean(cols[6]),
      category: clean(cols[7])
    }));

  const response = Response.json(products, {
    headers: {
      "Cache-Control": "public, max-age=86400"
    }
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

/* ================= ENCODING ================= */

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

/* ================= CLEAN ================= */

function clean(value = '') {
  return value.replace(/^"|"$/g, '').replace(/\r/g, '').trim();
}