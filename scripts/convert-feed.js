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

async function run() {
  try {
    console.log("Fetching feed...");

    const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");

    if (!res.ok) {
      console.error("Feed fetch failed");
      return;
    }

    const text = await res.text();

    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && l !== "nan");

    const startIndex = lines.findIndex(l => /^\d+$/.test(l));

    if (startIndex === -1) {
      console.error("Feed structure error");
      return;
    }

    const rawProducts = [];

    for (let i = startIndex; i < lines.length; i += 8) {
      if (!lines[i] || !lines[i + 1]) continue;

      rawProducts.push({
        sku: lines[i],
        name: lines[i + 1],
        url: lines[i + 2],
        price: Number(lines[i + 3] || 0),
        discount: Number(lines[i + 4] || 0),
        image: lines[i + 5],
        desc: lines[i + 6]
        // ❌ bỏ lines[i + 7]
      });
    }

    console.log("Products (raw):", rawProducts.length);

    /* 🔥 REMOVE DUPLICATE SKU */

    const map = new Map();

    for (const p of rawProducts) {
      if (map.has(p.sku)) continue;

      map.set(p.sku, {
        ...p,
        slug: buildSlug(p.name, p.sku)
      });
    }

    const products = Array.from(map.values());

    console.log("Final products:", products.length);

    /* SAVE JSON */

    const outputDir = path.join(process.cwd(), "public/data");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, "feed.json"),
      JSON.stringify(products)
    );

    console.log("Feed saved → public/data/feed.json");

  } catch (err) {
    console.error("Feed crash:", err);
  }
}

run();