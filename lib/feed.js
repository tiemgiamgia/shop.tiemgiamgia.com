export async function loadFeed() {
  try {

    const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv", {
      next: { revalidate: 3600 }
    });

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

      products.push({
        sku: lines[i],
        name: lines[i + 1],
        url: lines[i + 2],
        price: Number(lines[i + 3] || 0),
        discount: Number(lines[i + 4] || 0),
        image: lines[i + 5],
        desc: lines[i + 6],
        category: lines[i + 7],
        slug: buildSlug(lines[i + 1], lines[i])
      });
    }

    return products;

  } catch (err) {
    console.error("Feed crash:", err);
    return [];
  }
}