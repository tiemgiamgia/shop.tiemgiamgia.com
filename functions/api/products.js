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
      headers: {
        "Cache-Control": "public, max-age=86400"
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    csvText = await response.text();
  }

  const rows = csvText.split("\n").slice(1); // bỏ header

  const start = (page - 1) * limit;
  const slice = rows.slice(start, start + limit);

  const products = slice
    .map(row => parseCSVLine(row))
    .filter(cols => cols.length > 5 && cols[0]) // lọc dòng rác
    .map(cols => ({
      sku: clean(cols[0]),
      name: clean(cols[1]),
      price: clean(cols[3]),
      image: clean(cols[5])
    }));

  return Response.json(products);
}

/* ================= CSV PARSER ================= */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } 
    else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } 
    else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/* ================= CLEAN DATA ================= */

function clean(value = '') {
  return value
    .replace(/^"|"$/g, '')     // bỏ quote ngoài
    .replace(/\r/g, '')        // bỏ ký tự rác
    .trim();
}