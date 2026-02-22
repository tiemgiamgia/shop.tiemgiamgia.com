import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const DATA_DIR = path.join(process.cwd(), "public/data");
const PRODUCT_DIR = path.join(DATA_DIR, "products");
const SEARCH_DIR = path.join(DATA_DIR, "search");

const CHUNK_SIZE = 5000;

/* ================= SAFE ================= */

function safeText(text = "") {
  return String(text)
    .replace(/"/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .trim();
}

function safeNumber(val) {
  const num = Number(String(val).replace(/[^\d]/g, ""));
  return isNaN(num) ? 0 : num;
}

function slugify(text = "") {
  return safeText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ================= RUN ================= */

async function run() {
  try {

    console.log("🚀 Fetching CSV...");

    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV download failed");

    const text = await res.text();

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    console.log("✅ CSV rows:", records.length);

    fs.rmSync(DATA_DIR, { recursive: true, force: true });

    fs.mkdirSync(PRODUCT_DIR, { recursive: true });
    fs.mkdirSync(SEARCH_DIR, { recursive: true });

    const products = [];
    const search = [];
    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);
      if (skuSet.has(sku)) continue;

      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title);

      products.push({
        title,
        slug,
        sku,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: safeText(row.desc),
        url: safeText(row.url),
      });

      search.push({ title, slug, sku });
    }

    /* 🔥 CHUNK PRODUCTS */

    let page = 1;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {

      const chunk = products.slice(i, i + CHUNK_SIZE);

      fs.writeFileSync(
        path.join(PRODUCT_DIR, `${page}.json`),
        JSON.stringify(chunk)
      );

      page++;
    }

    /* 🔥 CHUNK SEARCH */

    page = 1;

    for (let i = 0; i < search.length; i += CHUNK_SIZE) {

      const chunk = search.slice(i, i + CHUNK_SIZE);

      fs.writeFileSync(
        path.join(SEARCH_DIR, `${page}.json`),
        JSON.stringify(chunk)
      );

      page++;
    }

    console.log("✅ Products:", products.length);
    console.log("✅ DONE 😈");

  } catch (err) {

    console.error("❌ ERROR:", err.message);

    process.exit(1);
  }
}

run();