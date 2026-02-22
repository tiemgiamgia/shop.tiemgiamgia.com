import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

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

    const buffer = await res.arrayBuffer();

    console.log(
      "Feed size:",
      (buffer.byteLength / 1024 / 1024).toFixed(2),
      "MB"
    );

    /* 🔥 FIX ENCODING */

    let text;

    try {
      text = new TextDecoder("utf-8").decode(buffer);
    } catch {
      console.log("UTF-8 failed → fallback Windows-1258");
      text = new TextDecoder("windows-1258").decode(buffer);
    }

    /* 🔥 PARSE CSV CHUẨN */

    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    });

    console.log("CSV parsed:", records.length);

    const rawProducts = records.map(r => ({
      sku: r.sku,
      name: r.name,
      url: r.url,
      price: r.price ? Number(r.price) : null,
      discount: r.discount ? Number(r.discount) : null,
      image: r.image,
      desc: r.desc
    }));

    console.log("Products (raw):", rawProducts.length);

    /* 🔥 REMOVE DUPLICATE */

    const map = new Map();

    for (const p of rawProducts) {
      if (!p.sku) continue;
      if (map.has(p.sku)) continue;

      map.set(p.sku, {
        ...p,
        slug: buildSlug(p.name, p.sku)
      });
    }

    const products = Array.from(map.values());

    console.log("Unique SKU:", products.length);

    /* LOG KIỂM TRA */

    const missingPrice = products.filter(p => !p.price).length;
    const missingImage = products.filter(p => !p.image).length;

    console.log("Missing price:", missingPrice);
    console.log("Missing image:", missingImage);

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