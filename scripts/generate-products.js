import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";
const OUTPUT_FILE = "./public/index.json";

/* ===============================
   🔥 SLUGIFY SEO SAFE
=============================== */
function slugify(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   🧼 CLEAN DESCRIPTION
=============================== */
function cleanDescription(desc = "") {
  return desc
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/* ===============================
   🚀 MAIN PARSER (BLOCK MODE)
=============================== */
async function generate() {
  try {
    console.log("🔥 Fetching Shopee feed...");

    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error("Feed fetch failed");

    const text = await res.text();

    console.log("🔥 Parsing feed (block mode)...");

    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    /* ✅ Header detection */
    const headers = lines.slice(0, 8);

    console.log("🔥 Headers:", headers);

    const products = [];

    for (let i = 8; i < lines.length; i += 8) {

      const sku       = lines[i];
      const name      = lines[i + 1];
      const url       = lines[i + 2];
      const priceRaw  = lines[i + 3];
      const discount  = lines[i + 4];
      const image     = lines[i + 5];
      const desc      = lines[i + 6];
      const category  = lines[i + 7];

      if (!name || !sku) continue;

      const baseSlug = slugify(name);
      const slug = `${baseSlug}-${sku}`;

      products.push({
        title: name,
        slug,
        sku,

        price: Number(priceRaw || 0),
        discount: Number(discount || 0),

        image,
        description: cleanDescription(desc),
        category,

        /* ✅ URL SEO */
        url: `/${slug}/`
      });
    }

    if (!fs.existsSync("./public")) {
      fs.mkdirSync("./public");
    }

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(products)
    );

    console.log("✅ index.json generated");
    console.log(`✅ ${products.length} products ready`);

  } catch (err) {
    console.error("💀 GENERATE FAILED");
    console.error(err);
    process.exit(1);
  }
}

generate();