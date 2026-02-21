import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

/* ===============================
   ✅ CSV PARSER CHUẨN (KHÔNG VỠ DESC)
=============================== */
function parseCSV(text) {
  const rows = [];
  let current = "";
  let insideQuotes = false;

  for (let char of text) {
    if (char === '"') insideQuotes = !insideQuotes;

    if (char === "\n" && !insideQuotes) {
      rows.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current) rows.push(current);

  const headers = splitCSVLine(rows[0]);

  return rows.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || "").trim();
    });

    return row;
  });
}

/* ===============================
   ✅ SPLIT CSV LINE SAFE
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
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

/* ===============================
   ✅ SLUGIFY SEO SAFE
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
   ✅ CLEAN DESCRIPTION
=============================== */
function cleanDescription(desc = "") {
  return desc
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
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
      throw new Error(`Feed error: ${res.status}`);
    }

    const csvText = await res.text();

    console.log("🔥 Parsing CSV...");

    const rows = parseCSV(csvText);

    console.log(`🔥 Raw rows: ${rows.length}`);

    const kvData = [];
    const homepageSlugs = [];

    rows.forEach((row, index) => {

      const title = row.name;
      const sku = row.sku;

      /* ✅ BỎ DÒNG RÁC */
      if (!title || !sku || sku === "nan") return;

      const slug = `${slugify(title)}-${sku}`;

      const product = {
        title,
        sku,
        slug,
        price: Number(row.price || 0),
        discount: Number(row.discount || 0),
        image: row.image || "",
        description: cleanDescription(row.desc || ""),
        category: row.category || ""
      };

      /* ✅ PRODUCT ENTRY */
      kvData.push({
        key: `product:${slug}`,
        value: JSON.stringify(product)
      });

      /* ✅ HOMEPAGE (50 sản phẩm đầu) */
      if (homepageSlugs.length < 50) {
        homepageSlugs.push(slug);
      }

    });

    /* ✅ HOMEPAGE KEY */
    kvData.push({
      key: "homepage",
      value: JSON.stringify(homepageSlugs)
    });

    fs.writeFileSync(
      "./kv-data.json",
      JSON.stringify(kvData, null, 2)
    );

    console.log(`✅ Valid products: ${kvData.length - 1}`);
    console.log(`✅ Homepage products: ${homepageSlugs.length}`);
    console.log(`✅ KV entries: ${kvData.length}`);
    console.log("✅ kv-data.json ready");

  } catch (err) {
    console.error("💀 GENERATE FAILED");
    console.error(err);
    process.exit(1);
  }
}

generate();