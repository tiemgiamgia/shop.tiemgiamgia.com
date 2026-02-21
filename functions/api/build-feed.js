export async function onRequest(context) {
  const cache = caches.default;
  const cacheKey = new Request("https://cache/products-json");

  let cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  console.log("Building JSON feed...");

  const csvRes = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");
  const buffer = await csvRes.arrayBuffer();
  const csvText = decodeCSV(buffer);

  const rows = parseCSV(csvText);

  const products = {};

  rows.forEach(cols => {
    if (!cols[0]) return;

    const sku = clean(cols[0]);

    products[sku] = {
      sku,
      name: clean(cols[1]),
      url: clean(cols[2]),
      price: Number(clean(cols[3]) || 0),
      discount: Number(clean(cols[4]) || 0),
      image: clean(cols[5]),
      desc: clean(cols[6]),
      category: clean(cols[7])
    };
  });

  const json = JSON.stringify(products);

  const response = new Response(json, {
    headers: {
      "Content-Type": "application/json",
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

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for (let char of text) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    }
    else if (char === "\n" && !insideQuotes) {
      row.push(current);
      rows.push(row);

      row = [];
      current = "";
    }
    else current += char;
  }

  if (current) {
    row.push(current);
    rows.push(row);
  }

  return rows.slice(1);
}

/* ================= CLEAN ================= */

function clean(value = "") {
  return value.replace(/^"|"$/g, "").replace(/\r/g, "").trim();
}