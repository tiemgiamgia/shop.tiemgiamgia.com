import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

async function main() {
  console.log("Downloading CSV...");

  const res = await fetch(FEED_URL);
  const buffer = await res.arrayBuffer();

  const csvText = decodeCSV(buffer);

  console.log("Parsing CSV...");

  const rows = parseCSV(csvText);

  console.log("Converting JSON...");

  const products = {};

  rows.forEach(cols => {
    if (!cols[0]) return;

    const sku = clean(cols[0]);

    products[sku] = {
      sku,
      name: clean(cols[1]),
      url: clean(cols[2]),
      price: Number(clean(cols[3]) || 0),
      discount: Number(clean(cols[4]) || 0),
      image: clean(cols[5]),
      desc: clean(cols[6]),
      category: clean(cols[7])
    };
  });

  fs.writeFileSync("products.json", JSON.stringify(products));

  console.log("✅ Done → products.json");
}

/* ================= ENCODING FIX ================= */

function decodeCSV(buffer) {
  try {
    return new TextDecoder("utf-8").decode(buffer);
  } catch {
    return new TextDecoder("windows-1258").decode(buffer);
  }
}

/* ================= CSV PARSER CHUẨN ================= */
/* Hỗ trợ quotes + multiline */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    }
    else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    }
    else if (char === "\n" && !insideQuotes) {
      row.push(current);
      rows.push(row);

      row = [];
      current = "";
    }
    else {
      current += char;
    }
  }

  if (current) {
    row.push(current);
    rows.push(row);
  }

  return rows.slice(1); // bỏ header
}

/* ================= CLEAN DATA ================= */

function clean(value = "") {
  return value
    .replace(/^"|"$/g, "")
    .replace(/\r/g, "")
    .trim();
}

main();