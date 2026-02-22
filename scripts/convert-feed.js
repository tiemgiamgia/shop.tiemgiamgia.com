import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const OUTPUT_DIR = path.join(process.cwd(), "public/data");

const INDEX_JSON = path.join(OUTPUT_DIR, "products.json");
const KEYWORD_JSON = path.join(OUTPUT_DIR, "keyword.json");
const TRENDING_JSON = path.join(OUTPUT_DIR, "trending.json");

/* ================= CONFIG ================= */

const STOP_WORDS = new Set([
  "sieu","chinh","hang","gia","re",
  "hot","new","sale","combo"
]);

const MAX_PRODUCTS_PER_KEYWORD = 40;

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

/* 🔥 FORMAT DESC CHUẨN SHOP */

function formatDesc(desc = "") {

  return String(desc)
    .replace(/\r/g, "")
    
    /* 🔥 xuống dòng trước bullet Shopee */
    .replace(/(🔸|▶|👉)/g, "\n$1")
    
    /* 🔥 xuống dòng trước dash list */
    .replace(/\s[-–]\s/g, "\n- ")
    
    /* 🔥 xuống dòng trước dấu / nếu cần */
    .replace(/\s\/\s/g, "\n/ ")

    /* 🔥 gom khoảng trắng */
    .replace(/\n+/g, "\n")
    .trim();
}

/* 🔥 FIX ENCODING */

function decodeBuffer(buffer) {
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  if (utf8.includes("Ã") || utf8.includes("áº")) {
    console.log("⚠ Broken UTF-8 → fallback Windows-1258");
    return new TextDecoder("windows-1258").decode(buffer);
  }

  return utf8;
}

/* 🔥 NORMALIZE */

function normalizeText(text = "") {
  return safeText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function slugify(text) {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isNumber(word) {
  return /^\d+$/.test(word);
}

/* 🔥 KEYWORD */

function extractKeywords(title) {

  const clean = normalizeText(title);

  const words = clean
    .split(/\s+/)
    .filter(w =>
      w.length > 1 &&
      !STOP_WORDS.has(w) &&
      !isNumber(w)
    );

  const phrases = [];

  for (const w of words) phrases.push(w);

  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + " " + words[i + 1]);
  }

  return phrases;
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
    const keywordEngine = {};
    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title) + "-" + sku;

      const product = {
        title,
        slug,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),

        /* ✅ DESC FIX */
        desc: formatDesc(row.desc)
      };

      products.push(product);

      const keywords = extractKeywords(title);

      for (const keyword of keywords) {

        if (!keywordEngine[keyword]) {
          keywordEngine[keyword] = [];
        }

        if (keywordEngine[keyword].length < MAX_PRODUCTS_PER_KEYWORD) {
          keywordEngine[keyword].push(slug);
        }
      }
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(INDEX_JSON, JSON.stringify(products));
    fs.writeFileSync(KEYWORD_JSON, JSON.stringify(keywordEngine));

    const trending = Object.entries(keywordEngine)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 120)
      .map(([keyword]) => keyword);

    fs.writeFileSync(TRENDING_JSON, JSON.stringify(trending));

    console.log("✅ Products:", products.length);
    console.log("✅ DONE ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();