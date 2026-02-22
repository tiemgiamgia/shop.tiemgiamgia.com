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
    console.log("Fetching CSV...");

    const res = await fetch(CSV_URL);

    if (!res.ok) throw new Error("CSV download failed");

    const buffer = await res.arrayBuffer();

    console.log(
      "Feed size:",
      (buffer.byteLength / 1024 / 1024).toFixed(2),
      "MB"
    );

    let text;

    try {
      text = new TextDecoder("utf-8").decode(buffer);
    } catch {
      text = new TextDecoder("windows-1258").decode(buffer);
    }

    const delimiter = detectDelimiter(text);

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true,
      delimiter
    });

    console.log("CSV rows:", records.length);

    const products = [];
    const keywordMap = new Map();
    const slugSet = new Set();

    for (const row of records) {
      if (!row.name) continue;

      const safeTitle = safeText(row.name);
      const id = row.sku;

      let slug = slugify(safeTitle);
      if (id) slug += `-${id}`;

      if (slugSet.has(slug)) continue;
      slugSet.add(slug);

      const safePrice = safeNumber(row.price);
      const safeDiscount = safeNumber(row.discount);

      products.push({
        title: safeTitle,
        slug,
        price: safePrice,
        discount: safeDiscount,
        image: safeText(row.image),
        brand: safeText(row.brand),
        category: safeText(row.category),
        desc: safeText(row.desc),
        affiliate: `https://go.isclix.com/deep_link/5275212048974723439/4751584435713464237?url=${safeText(row.url)}`
      });

      /* KEYWORD ENGINE */

      const words = cleanWords(safeTitle);

      for (const word of words) {
        keywordMap.set(
          word,
          (keywordMap.get(word) || 0) + getWeight(word)
        );
      }
    }

    if (products.length === 0) {
      products.push({ title: "fallback product" });
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(INDEX_JSON, JSON.stringify(products));

    const sortedKeywords = [...keywordMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, score]) => ({ keyword, score }));

    fs.writeFileSync(KEYWORD_JSON, JSON.stringify(sortedKeywords));

    const trending = sortedKeywords
      .slice(0, 120)
      .map(k => k.keyword);

    fs.writeFileSync(TRENDING_JSON, JSON.stringify(trending));

    console.log("Products:", products.length);
    console.log("Keywords:", sortedKeywords.length);
    console.log("Trending:", trending.length);

  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}

run();