let cachedPreview = null;

/* ================= HOME → chỉ cần 1 chunk ================= */

export async function loadPreviewProducts() {

  if (cachedPreview) return cachedPreview;

  try {
    const res = await fetch(
      "https://shop.tiemgiamgia.com/data/products/1.json",
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    const data = await res.json();

    cachedPreview = data;

    console.log("Preview loaded:", data.length);

    return data;

  } catch (err) {

    console.error("Preview crash:", err);

    return [];
  }
}

/* ================= PRODUCT DETAIL ================= */

export async function loadProductBySku(sku) {

  let page = 1;

  try {

    while (true) {

      const res = await fetch(
        `https://shop.tiemgiamgia.com/data/products/${page}.json`,
        { cache: "no-store" }
      );

      if (!res.ok) break;

      const chunk = await res.json();

      if (!chunk.length) break;

      const found = chunk.find(p => p.sku === sku);

      if (found) {

        console.log("Product found in chunk:", page);

        return found;
      }

      page++;
    }

    return null;

  } catch (err) {

    console.error("Product crash:", err);

    return null;
  }
}