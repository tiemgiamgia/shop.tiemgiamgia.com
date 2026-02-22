import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const DATA_DIR = path.join(process.cwd(), "public/data");
const PRODUCT_DIR = path.join(DATA_DIR, "products");

function safeText(text = "") {
  return String(text)
    .replace(/"/g, "")
    .replace(/\r/g, "")
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

    fs.rmSync(PRODUCT_DIR, { recursive: true, force: true });
    fs.mkdirSync(PRODUCT_DIR, { recursive: true });

    const search = [];
    const skuSet = new Set();

    for (const row of records) {
      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);
      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title) + "-" + sku;

      /* ✅ SEARCH INDEX */
      search.push({ title, slug });

      /* ✅ PRODUCT FILE RIÊNG */
      const product = {
        title,
        slug,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: safeText(row.desc)
      };

      fs.writeFileSync(
        path.join(PRODUCT_DIR, slug + ".json"),
        JSON.stringify(product)
      );
    }

    fs.writeFileSync(
      path.join(DATA_DIR, "search.json"),
      JSON.stringify(search)
    );

    console.log("✅ Products:", search.length);
    console.log("✅ DONE ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();