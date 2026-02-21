let cachedProducts = null;

function buildSlug(name, sku) {
  return (
    name
      ?.toLowerCase()
      ?.normalize("NFD")
      ?.replace(/[\u0300-\u036f]/g, "")     // bỏ dấu tiếng Việt
      ?.replace(/[^a-z0-9]+/g, "-")
      ?.replace(/(^-|-$)/g, "") +
    "-" +
    sku
  );
}

export async function loadFeed() {

  // 🔥 Cache cực quan trọng cho Cloudflare Worker
  if (cachedProducts) return cachedProducts;

  try {
    const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");

    if (!res.ok) {
      console.error("Feed fetch failed");
      return [];
    }

    const text = await res.text();

    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && l !== "nan");

    const startIndex = lines.findIndex(l => /^\d+$/.test(l));

    if (startIndex === -1) {
      console.error("Feed structure error");
      return [];
    }

    const products = [];

    for (let i = startIndex; i < lines.length; i += 8) {

      if (!lines[i] || !lines[i + 1]) continue;

      const sku = lines[i];
      const name = lines[i + 1];

      products.push({
        sku,
        name,
        url: lines[i + 2] || "",
        price: Number(lines[i + 3] || 0),
        discount: Number(lines[i + 4] || 0),
        image: lines[i + 5] || "",
        desc: lines[i + 6] || "",
        category: lines[i + 7] || "",
        slug: buildSlug(name, sku)
      });
    }

    // 🔥 Cache lại → Worker không fetch feed mỗi request
    cachedProducts = products;

    console.log("Feed loaded:", products.length);

    return products;

  } catch (err) {
    console.error("Feed crash:", err);
    return [];
  }
}