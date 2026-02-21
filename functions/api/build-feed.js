export async function onRequest() {

  const res = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");
  const buffer = await res.arrayBuffer();

  const text = decodeCSV(buffer);

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && l !== "nan"); // bỏ rác

  const products = [];

  /* 🔥 Tìm dòng SKU đầu tiên */
  let startIndex = lines.findIndex(l => /^\d+$/.test(l));

  if (startIndex === -1) {
    return new Response("Feed error", { status: 500 });
  }

  for (let i = startIndex; i < lines.length; i += 8) {

    const sku = lines[i];
    const name = lines[i + 1];
    const url = lines[i + 2];
    const price = lines[i + 3];
    const discount = lines[i + 4];
    const image = lines[i + 5];
    const desc = lines[i + 6];
    const category = lines[i + 7];

    if (!sku || !name) continue;

    products.push({
      sku,
      name,
      url,
      price: Number(price || 0),
      discount: Number(discount || 0),
      image,
      desc,
      category
    });
  }

  return Response.json(products, {
    headers: {
      "Cache-Control": "public, max-age=86400"
    }
  });
}

/* ================= ENCODING ================= */

function decodeCSV(buffer) {
  try {
    return new TextDecoder("utf-8").decode(buffer);
  } catch {
    return new TextDecoder("windows-1258").decode(buffer);
  }
}