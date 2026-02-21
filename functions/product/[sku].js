export async function onRequest(context) {
  const { params } = context;
  const sku = params.sku;

  const cache = caches.default;
  const cacheKey = new Request("https://cache/products");

  let response = await cache.match(cacheKey);
  let csvText;

  if (!response) {
    const csvRes = await fetch("https://feeds.tiemgiamgia.com/shopee.csv");
    csvText = await csvRes.text();

    response = new Response(csvText, {
      headers: { "Cache-Control": "public, max-age=86400" }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    csvText = await response.text();
  }

  const rows = csvText.split("\n").map(r => r.trim());
  let product = null;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(",");
    if (cols[0] === sku) {
      product = {
        sku: cols[0],
        name: cols[1],
        url: cols[2],
        price: cols[3],
        discount: cols[4],
        image: cols[5],
        desc: cols[6],
        category: cols[7]
      };
      break;
    }
  }

  if (!product) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(renderPage(product), {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

function renderLayout(content, meta) {
  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <title>${meta.title}</title>
    <meta name="description" content="${meta.desc}">
    <meta name="robots" content="index, follow">
    <link rel="stylesheet" href="/css/site.css">
  </head>
  <body>

    ${layout.headerHTML}

    ${content}

    ${layout.footerHTML}


  </body>
  </html>
  `;
}

function renderPage(p) {
  const content = `
    <div class="container">
      <div class="product">
        <img src="${p.image}">
        <div>
          <h1>${p.name}</h1>
          <div class="price">
            ${Number(p.price).toLocaleString()}đ
          </div>
          <p>${p.desc}</p>
          <a href="${p.url}">Xem trên Shopee</a>
        </div>
      </div>
    </div>
  `;

  return renderLayout(content, {
    title: p.name,
    desc: p.desc.slice(0,160)
  });
}