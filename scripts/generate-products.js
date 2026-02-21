import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";
const OUTPUT_FILE = "./public/index.json";

/* ===============================
   🧠 CSV PARSER SAFE
=============================== */
function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const headers = splitCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });

    return row;
  });
}

/* ===============================
   🔥 SPLIT CSV LINE SAFE
=============================== */
function splitCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

/* ===============================
   🔥 SLUGIFY SEO SAFE
=============================== */
function slugify(text) {
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
    .replace(/<br\s*\/?>/gi, "\n")   // <br> → xuống dòng
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")         // xoá HTML
    .replace(/\n{2,}/g, "\n")        // tránh quá nhiều dòng trống
    .trim();
}

/* ===============================
   🚀 MAIN
=============================== */
async function generate() {
  try {
    console.log("🔥 Fetching Shopee feed...");

    const res = await fetch(FEED_URL);
    if (!res.ok) {
      throw new Error(`Feed fetch failed: ${res.status}`);
    }

    const csvText = await res.text();

    console.log("🔥 Parsing CSV...");
    const rows = parseCSV(csvText);

    console.log(`🔥 Found ${rows.length} rows`);

    const products = rows.map((row, index) => {

      const title =
        row.name ||
        row.title ||
        row.product_name ||
        `Product ${index + 1}`;

      const sku =
        row.sku ||
        row.item_sku ||
        row.product_sku ||
        index + 1;

      const priceRaw =
        row.price ||
        row.sale_price ||
        row.current_price ||
        "0";

      const image =
        row.image ||
        row.image_url ||
        row.thumbnail ||
        "";

      const description =
        cleanDescription(
          row.description ||
          row.desc ||
          row.product_description ||
          ""
        );

      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${sku}`;

      return {
        title,
        slug,
        sku,
        price: Number(priceRaw.replace(/[^\d]/g, "")) || 0,
        image,
        description,

        /* ✅ URL MỚI */
        url: `/${slug}/`
      };
    });

    if (!fs.existsSync("./public")) {
      fs.mkdirSync("./public");
    }

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(products, null, 2)
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