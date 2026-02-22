import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

const DATA_DIR = path.join(process.cwd(), "public/data");
const PRODUCT_DIR = path.join(DATA_DIR, "products");

const CHUNK_SIZE = 5000; // 🔥 cực kỳ quan trọng (CF limit)

/* ================= ENCODING FIX ================= */

/* 🔥 Repair UTF8 vỡ kiểu Shopee */

function repairVietnamese(text = "") {
  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

/* 🔥 Xoá byte rác / control char */

function cleanGarbage(text = "") {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, "")  // control chars
    .replace(/\uFFFD/g, "")                 // ký tự �
    .trim();
}

/* 🔥 Decode CSV chuẩn Shopee */

function decodeBuffer(buffer) {
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  /* Nếu phát hiện font vỡ → fallback */

  if (utf8.includes("Ã") || utf8.includes("áº")) {
    console.log("⚠ Broken UTF-8 → fallback Windows-1258");
    return new TextDecoder("windows-1258").decode(buffer);
  }

  console.log("✅ Encoding: UTF-8");
  return utf8;
}

/* ================= SAFE UTIL ================= */

function safeText(text = "") {
  let cleaned = String(text)
    .replace(/"/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ");

  cleaned = repairVietnamese(cleaned); // 🔥 FIX FONT
  cleaned = cleanGarbage(cleaned);     // 🔥 FIX BYTE RÁC

  return cleaned;
}

function safeNumber(val) {
  const num = Number(String(val).replace(/[^\d]/g, ""));
  return isNaN(num) ? 0 : num;
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

    /* CLEAN OUTPUT */

    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    fs.mkdirSync(PRODUCT_DIR, { recursive: true });

    const search = [];
    const products = [];

    const skuSet = new Set();

    for (const row of records) {

      if (!row.name || !row.sku) continue;

      const sku = safeText(row.sku);

      /* 🔥 REMOVE DUPLICATE SKU */

      if (skuSet.has(sku)) continue;
      skuSet.add(sku);

      const title = safeText(row.name);
      const slug = slugify(title);

      /* 🔥 SEARCH INDEX (nhẹ) */

      search.push({ title, slug, sku });

      /* 🔥 PRODUCT DATA */

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

    /* 🔥 CHUNK PRODUCTS (Cloudflare Safe) */

    let chunkIndex = 1;

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {

      const chunk = products.slice(i, i + CHUNK_SIZE);

      fs.writeFileSync(
        path.join(PRODUCT_DIR, `${chunkIndex}.json`),
        JSON.stringify(chunk)
      );

      chunkIndex++;
    }

    /* 🔥 SEARCH INDEX */

    fs.writeFileSync(
      path.join(DATA_DIR, "search.json"),
      JSON.stringify(search)
    );

    console.log("✅ Products:", products.length);
    console.log("✅ Chunks:", chunkIndex - 1);
    console.log("✅ Search index:", search.length);
    console.log("✅ DONE ✅");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

run();