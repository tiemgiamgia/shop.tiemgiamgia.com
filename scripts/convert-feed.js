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

const MAX_PRODUCTS_PER_KEYWORD = 20;   // 🔥 giảm mạnh
const MIN_VOLUME = 3;                  // 🔥 keyword phải có >=3 sản phẩm
const MAX_KEYWORDS = 4000;             // 🔥 chặn trần size

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

function decodeBuffer(buffer) {
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  if (utf8.includes("Ã") || utf8.includes("áº")) {
    console.log("⚠ Broken UTF-8 → fallback Windows-1258");
    return new TextDecoder("windows-1258").decode(buffer);
  }

  return utf8;
}

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
    const keywordMap = new Map();
    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title) + "-" + sku;

      products.push({
        title,
        slug,
        price: safeNumber(row.price),
        discount: safeNumber(row.discount),
        image: safeText(row.image),
        desc: safeText(row.desc)
      });

      const keywords = extractKeywords(title);

      for (const keyword of keywords) {

        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, []);
        }

        const list = keywordMap.get(keyword);

        if (list.length < MAX_PRODUCTS_PER_KEYWORD) {
          list.push(slug);
        }
      }
    }

    console.log("✅ Products:", products.length);

    /* 🔥 FILTER KEYWORD VOLUME */

    const filteredKeywords = [...keywordMap.entries()]
      .filter(([_, list]) => list.length >= MIN_VOLUME)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, MAX_KEYWORDS);

    const keywordEngine = Object.fromEntries(filteredKeywords);

    const trending = filteredKeywords
      .slice(0, 120)
      .map(([keyword]) => keyword);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(INDEX_JSON, JSON.stringify(products));
    fs.writeFileSync(KEYWORD_JSON, JSON.stringify(keywordEngine));
    fs.writeFileSync(TRENDING_JSON, JSON.stringify(trending));

    console.log("✅ Keywords:", filteredKeywords.length);
    console.log("✅ Trending:", trending.length);

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();