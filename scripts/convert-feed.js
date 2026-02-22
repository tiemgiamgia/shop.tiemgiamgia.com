import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const OUTPUT_DIR = path.join(process.cwd(), "public/data");
const PRODUCTS_DIR = path.join(OUTPUT_DIR, "products");

/* ================= CONFIG ================= */

const CHUNK_SIZE = 500;

/* ================= UTIL ================= */

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

/* ✅ FIX FONT TUYỆT ĐỐI */

function decodeBuffer(buffer) {
  console.log("✅ Force Encoding: Windows-1258");

  return new TextDecoder("windows-1258").decode(buffer);
}

/* ✅ NORMALIZE */

function normalizeText(text = "") {
  return safeText(text)
    .normalize("NFC");        // 🔥 FIX Unicode tổ hợp
}

/* ✅ FORMAT DESC */

function formatDesc(desc = "") {

  const clean = normalizeText(desc);

  return clean
    .replace(/ - /g, "\n- ")
    .replace(/ ▶ /g, "\n▶ ")
    .replace(/ 🔸 /g, "\n🔸 ")
    .replace(/ \/ /g, "\n")
    .trim();
}

function slugify(text) {
  return normalizeText(text)
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

    const products = [];
    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = normalizeText(row.name);
      const slug = slugify(title) + "-" + sku;

      products.push({
        title,
        slug,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: formatDesc(row.desc)   // ✅ DESC CHUẨN
      });
    }

    /* ✅ CHUNK PRODUCTS */

    fs.rmSync(PRODUCTS_DIR, { recursive: true, force: true });
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

    let page = 1;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {

      const chunk = products.slice(i, i + CHUNK_SIZE);

      fs.writeFileSync(
        path.join(PRODUCTS_DIR, `page-${page}.json`),
        JSON.stringify(chunk)
      );

      page++;
    }

    console.log("✅ Products:", products.length);
    console.log("✅ Pages:", page - 1);
    console.log("✅ FONT + DESC FIXED ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();