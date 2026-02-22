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

const KEYWORD_WEIGHT = {
  ao: 8,
  quan: 8,
  honda: 7,
  winner: 7,
  yamaha: 7,
  bluetooth: 4
};

/* 🔥 LIGHT MODE → FIX Cloudflare 25MB */
const LIGHT_MODE = true;

/* ================= UTIL ================= */

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

function slugify(text) {
  return safeText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanWords(title) {
  return slugify(title)
    .split("-")
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function getWeight(word) {
  return KEYWORD_WEIGHT[word] || 1;
}

function detectDelimiter(csv) {
  const firstLine = csv.split("\n")[0];
  return firstLine.includes(";") ? ";" : ",";
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

    let text;

    try {
      text = new TextDecoder("utf-8").decode(buffer);
      console.log("✅ Encoding: UTF-8");
    } catch {
      console.log("⚠ UTF-8 failed → fallback Windows-1258");
      text = new TextDecoder("windows-1258").decode(buffer);
    }

    const delimiter = detectDelimiter(text);
    console.log("✅ Delimiter:", delimiter);

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
      delimiter
    });

    console.log("✅ CSV rows:", records.length);

    const products = [];
    const keywordMap = new Map();
    const skuSet = new Set();

    let missingPrice = 0;
    let missingImage = 0;

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      /* 🔥 REMOVE DUPLICATE SKU */
      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const safeTitle = safeText(row.name);

      let slug = slugify(safeTitle) + "-" + sku;

      const safePrice = safeNumber(row.price);
      const safeDiscount = safeNumber(row.discount);
      const safeImage = safeText(row.image);

      if (!safePrice) missingPrice++;
      if (!safeImage) missingImage++;

      const product = {
        title: safeTitle,
        slug,
        price: safePrice,
        discount: safeDiscount,
        image: safeImage,
        affiliate: `https://go.isclix.com/deep_link/5275212048974723439/4751584435713464237?url=${safeText(row.url)}`
      };

      /* 🔥 LIGHT MODE → bỏ field nặng */
      if (!LIGHT_MODE) {
        product.brand = safeText(row.brand);
        product.category = safeText(row.category);
        product.desc = safeText(row.desc);
      }

      products.push(product);

      /* KEYWORD ENGINE */

      const words = cleanWords(safeTitle);

      for (const word of words) {
        keywordMap.set(
          word,
          (keywordMap.get(word) || 0) + getWeight(word)
        );
      }
    }

    console.log("✅ Unique SKU:", products.length);
    console.log("📊 Missing price:", missingPrice);
    console.log("📊 Missing image:", missingImage);

    if (products.length === 0) {
      console.log("🚨 Feed empty → fallback");
      products.push({ title: "fallback product" });
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    /* 🔥 MINIFY JSON → giảm size mạnh */
    fs.writeFileSync(INDEX_JSON, JSON.stringify(products));

    const sortedKeywords = [...keywordMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, score]) => ({ keyword, score }));

    fs.writeFileSync(KEYWORD_JSON, JSON.stringify(sortedKeywords));

    const trending = sortedKeywords
      .slice(0, 120)
      .map(k => k.keyword);

    fs.writeFileSync(TRENDING_JSON, JSON.stringify(trending));

    console.log("✅ Products:", products.length);
    console.log("✅ Keywords:", sortedKeywords.length);
    console.log("✅ Trending:", trending.length);

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();