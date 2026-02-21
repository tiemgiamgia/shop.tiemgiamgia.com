import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

/* ===============================
   CSV PARSER SAFE
=============================== */
function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });

    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanDescription(desc = "") {
  return desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/* ===============================
   MAIN
=============================== */
async function generate() {
  console.log("🔥 Fetching feed...");

  const res = await fetch(FEED_URL);
  const csvText = await res.text();

  const rows = parseCSV(csvText);

  console.log(`🔥 Found ${rows.length} rows`);

  const products = rows.map((row) => {

    const title = row.name;
    const sku = row.sku;

    if (!title || !sku) return null;

    const slug = `${slugify(title)}-${sku}`;

    return {
      title,
      sku,
      slug,
      price: Number(row.price || 0),
      image: row.image,
      description: cleanDescription(row.desc),
    };
  }).filter(Boolean);

  console.log(`✅ ${products.length} valid products`);

  /* SAVE FOR BULK IMPORT */
  fs.writeFileSync(
    "./kv-data.json",
    JSON.stringify(products, null, 2)
  );

  console.log("✅ kv-data.json ready");
}

generate();