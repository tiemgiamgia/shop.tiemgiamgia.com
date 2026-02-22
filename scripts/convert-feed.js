import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const DATA_DIR = path.join(process.cwd(), "public/data");
const PRODUCT_DIR = path.join(DATA_DIR, "products");

const CHUNK_SIZE = 5000;

/* ================= SAFE ================= */

function safeText(text = "") {
  return String(text)
    .replace(/"/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeNumber(val) {
  const num = Number(String(val).replace(/[^\d]/g, ""));
  return isNaN(num) ? 0 : num;
}

/* ================= DECODE ================= */

function decodeBuffer(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

/* ================= SLUG ================= */

function slugify(text) {
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

    const buffer = await res.arrayBuffer();

    console.log(
      "✅ Feed size:",
      (buffer.byteLength / 1024 / 1024).toFixed(2),
      "MB"
    );

    const text = decodeBuffer(buffer);

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true
    });

    console.log("✅ CSV rows:", records.length);

    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    fs.mkdirSync(PRODUCT_DIR, { recursive: true });

    const search = [];
    const products = [];
    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title);

      search.push({ title, slug, sku });

      products.push({
        title,
        slug,
        sku,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: safeText(row.desc)
      });
    }

    /* 🔥 CHUNK */

    let chunkIndex = 1;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {

      const chunk = products.slice(i, i + CHUNK_SIZE);

      fs.writeFileSync(
        path.join(PRODUCT_DIR, `${chunkIndex}.json`),
        JSON.stringify(chunk)
      );

      chunkIndex++;
    }

    fs.writeFileSync(
      path.join(DATA_DIR, "search.json"),
      JSON.stringify(search)
    );

    console.log("✅ Products:", products.length);
    console.log("✅ Chunks:", chunkIndex - 1);
    console.log("✅ DONE ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();