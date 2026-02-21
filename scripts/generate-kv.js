import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";
const OUTPUT_FILE = "./kv-import.json";

function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    const row = {};

    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || "").trim();
    });

    return row;
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanDescription(desc = "") {
  return desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

async function generate() {
  console.log("🔥 Fetching feed...");

  const res = await fetch(FEED_URL);
  const csvText = await res.text();

  const rows = parseCSV(csvText);

  const homepage = [];
  const kvData = [];

  rows.forEach((row, index) => {
    if (!row.name || !row.sku) return;

    const slug = `${slugify(row.name)}-${row.sku}`;

    const product = {
      title: row.name,
      price: Number(row.price || 0),
      image: row.image,
      description: cleanDescription(row.desc),
      category: row.category || "uncategorized"
    };

    kvData.push({
      key: `product:${slug}`,
      value: JSON.stringify(product)
    });

    if (homepage.length < 50) {
      homepage.push(slug);
    }
  });

  kvData.push({
    key: "homepage",
    value: JSON.stringify(homepage)
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kvData));

  console.log("✅ KV import file ready");
  console.log(`✅ ${kvData.length} KV entries`);
}

generate();