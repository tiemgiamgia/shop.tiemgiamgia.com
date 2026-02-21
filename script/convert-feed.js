import fs from "fs";

const FEED_URL = "https://feeds.tiemgiamgia.com/shopee.csv";

function buildSlug(name, sku) {
  return (
    name
      .toLowerCase()
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
  const res = await fetch(FEED_URL);
  const text = await res.text();

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l !== "nan");

  const startIndex = lines.findIndex(l => /^\d+$/.test(l));

  if (startIndex === -1) {
    console.log("Feed structure error");
    return;
  }

  const products = [];

  for (let i = startIndex; i < lines.length; i += 8) {
    if (!lines[i] || !lines[i + 1]) continue;

    const sku = lines[i];

    products.push({
      sku,
      name: lines[i + 1],
      url: lines[i + 2],
      price: Number(lines[i + 3] || 0),
      discount: Number(lines[i + 4] || 0),
      image: lines[i + 5],
      desc: lines[i + 6],
      category: lines[i + 7] || "",
      slug: buildSlug(lines[i + 1], sku)
    });
  }

  /* ✅ đảm bảo thư mục tồn tại */
  fs.mkdirSync("public/data", { recursive: true });

  fs.writeFileSync(
    "public/data/feed.json",
    JSON.stringify(products, null, 2)
  );

  console.log("DONE → public/data/feed.json");
  console.log("Products:", products.length);
}

run();
