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

    const rows = text.split(/\r?\n/);

    console.log("CSV rows:", rows.length);

    const header = rows[0].split(",");

    console.log("Header:", header);

    const skuIndex = header.indexOf("sku");
    const nameIndex = header.indexOf("name");
    const urlIndex = header.indexOf("url");
    const priceIndex = header.indexOf("price");
    const discountIndex = header.indexOf("discount");
    const imageIndex = header.indexOf("image");
    const descIndex = header.indexOf("desc");

    const rawProducts = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

      if (!cols[skuIndex]) continue;

      rawProducts.push({
        sku: cols[skuIndex],
        name: cols[nameIndex],
        url: cols[urlIndex],
        price: cols[priceIndex] ? Number(cols[priceIndex]) : null,
        discount: cols[discountIndex]
          ? Number(cols[discountIndex])
          : null,
        image: cols[imageIndex],
        desc: cols[descIndex]
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