import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";
const OUTPUT_DIR = path.join(process.cwd(), "public/data");

function safeText(text = "") {
  return String(text)
    .replace(/"/g, "")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeNumber(val) {
  const num = Number(String(val).replace(/[^\d]/g, ""));
  return isNaN(num) ? 0 : num;
}

function decodeBuffer(buffer) {
  return new TextDecoder("windows-1258").decode(buffer);
}

function slugify(text) {
  return safeText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  try {
    console.log("🚀 Fetching CSV...");

    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV download failed");

    const buffer = await res.arrayBuffer();
    const text = decodeBuffer(buffer);

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true
    });

    const products = [];
    const search = [];
    const skuSet = new Set();

    for (const row of records) {
      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);
      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title) + "-" + sku;

      /* ✅ SEARCH INDEX (NHẸ) */
      search.push({
        title,
        slug
      });

      /* ✅ FULL DATA */
      products.push({
        title,
        slug,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: safeText(row.desc)
      });
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "search.json"),
      JSON.stringify(search)
    );

    fs.writeFileSync(
      path.join(OUTPUT_DIR, "products.json"),
      JSON.stringify(products)
    );

    console.log("✅ Products:", products.length);
    console.log("✅ Search index:", search.length);
    console.log("✅ DONE ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();