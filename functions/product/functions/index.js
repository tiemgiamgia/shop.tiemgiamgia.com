export async function onRequest(context) {
  const layout = await loadLayout();

  const content = `
    <div class="container">
      <h1>Tiệm Giảm Giá</h1>
      <p>Website tổng hợp sản phẩm Shopee</p>
    </div>
  `;

  return new Response(
    renderLayout(content, {
      title: "Tiệm Giảm Giá",
      desc: "Sản phẩm Shopee giá tốt"
    }, layout),
    { headers: { "Content-Type": "text/html;charset=UTF-8" } }
  );
}

/* ================= UTIL CHUNG ================= */

async function loadLayout() {
  const headerHTML = await fetch("https://yourdomain.com/layout/header.html").then(r => r.text());
  const footerHTML = await fetch("https://yourdomain.com/layout/footer.html").then(r => r.text());

  return { headerHTML, footerHTML };
}

function renderLayout(content, meta, layout) {
  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <title>${meta.title}</title>
    <meta name="description" content="${meta.desc}">
    <link rel="stylesheet" href="/site.css">
    <script src="/js/sticky-bar.js" defer></script>
  </head>
  <body>

    ${layout.headerHTML}

    ${content}

    ${layout.footerHTML}

  </body>
  </html>
  `;
}