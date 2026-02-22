import fs from "fs";
import path from "path";

function buildSlug(name, sku) {
  return (
    name
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    sku
  );
}

function parseCSV(csv) {
  const rows = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "\n" && !insideQuotes) {
      rows.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current) rows.push(current);

  return rows.map(row => row.split(","));
}

async function run() {
  try {
    console.log("Fetching feed...");

    const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");

    if (!res.ok) {
      console.error("Feed fetch failed:", res.status);
      return;
    }

    /* ✅ FIX BOM + ENCODING */

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);

    console.log("Feed size:", (text.length / 1024 / 1024).toFixed(2), "MB");

    const rows = parseCSV(text);

    console.log("CSV rows:", rows.length);

    /* HEADER */

    const header = rows[0];

    console.log("Header:", header);

    const skuIndex = header.indexOf("sku");
    const nameIndex = header.indexOf("name");
    const urlIndex = header.indexOf("url");
    const priceIndex = header.indexOf("price");
    const discountIndex = header.indexOf("discount");
    const imageIndex = header.indexOf("image");
    const descIndex = header.indexOf("desc");

    if (skuIndex === -1) {
      console.error("CSV STRUCTURE ERROR");
      return;
    }

    const rawProducts = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      if (!row[skuIndex]) continue;

      rawProducts.push({
        sku: row[skuIndex]?.trim(),
        name: row[nameIndex]?.trim(),
        url: row[urlIndex]?.trim(),
        price: Number(row[priceIndex] || 0),
        discount: Number(row[discountIndex] || 0),
        image: row[imageIndex]?.trim(),
        desc: row[descIndex]?.trim()
      });
    }

    console.log("Products (raw):", rawProducts.length);

    /* DEBUG THIẾU FIELD */

    let missingName = 0;
    let missingImage = 0;
    let missingPrice = 0;

    rawProducts.forEach(p => {
      if (!p.name) missingName++;
      if (!p.image) missingImage++;
      if (!p.price) missingPrice++;
    });

    console.log("Missing name:", missingName);
    console.log("Missing image:", missingImage);
    console.log("Missing price:", missingPrice);

    /* REMOVE DUP SKU */

    const map = new Map();

    rawProducts.forEach(p => {
      if (!p.sku) return;
      if (map.has(p.sku)) return;

      map.set(p.sku, {
        ...p,
        slug: buildSlug(p.name, p.sku)
      });
    });

    const products = Array.from(map.values());

    console.log("Unique SKU:", products.length);

    /* SAVE JSON */

    const outputDir = path.join(process.cwd(), "public/data");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, "feed.json"),
      JSON.stringify(products, null, 2),
      "utf-8"
    );

    console.log("Feed saved → public/data/feed.json");

  } catch (err) {
    console.error("Feed crash:", err);
  }
}

run();