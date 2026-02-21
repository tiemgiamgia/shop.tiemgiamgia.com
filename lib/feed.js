export async function loadFeed() {
  const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv", {
    next: { revalidate: 3600 }   // 🔥 cache cực quan trọng
  });

  const text = await res.text();

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l !== "nan");

  const products = [];

  const startIndex = lines.findIndex(l => /^\d+$/.test(l));

  for (let i = startIndex; i < lines.length; i += 8) {
    const sku = lines[i];
    const name = lines[i + 1];

    if (!sku || !name) continue;

    products.push({
      sku,
      name,
      url: lines[i + 2],
      price: Number(lines[i + 3] || 0),
      discount: Number(lines[i + 4] || 0),
      image: lines[i + 5],
      desc: lines[i + 6],
      category: lines[i + 7],
      slug: buildSlug(name, sku)
    });
  }

  return products;
}

function buildSlug(name, sku) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    sku
  );
}
