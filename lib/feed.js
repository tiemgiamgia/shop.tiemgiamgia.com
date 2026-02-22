let cachedProducts = null;

export async function loadFeed() {

  // 🔥 Cache RAM trong Worker
  if (cachedProducts) {
    return cachedProducts;
  }

  const products = [];

  let page = 1;

  try {

    while (true) {

      const res = await fetch(
        `https://shop.tiemgiamgia.com/data/products/${page}.json`,
        { cache: "no-store" }   // 🔥 Cloudflare cực kỳ quan trọng
      );

      if (!res.ok) break;

      const chunk = await res.json();

      if (!chunk.length) break;

      products.push(...chunk);

      page++;
    }

    cachedProducts = products;  // 🔥 Cache sau khi load xong

    console.log("Feed loaded:", products.length);

    return products;

  } catch (err) {

    console.error("Feed crash:", err);

    return [];
  }
}