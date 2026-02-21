let page = 1;
let loading = false;

const grid = document.getElementById("grid");
const loadingEl = document.getElementById("loading");
const searchBox = document.getElementById("searchBox");

async function loadProducts() {
  if (loading) return;
  loading = true;

  const res = await fetch(`/api/products?page=${page}`);
  const products = await res.json();

  products.forEach(p => {
    grid.innerHTML += `
      <a class="card" href="/product/${p.sku}">
        <img src="${p.image}">
        <div>${p.name}</div>
        <div class="price">${Number(p.price).toLocaleString()}đ</div>
      </a>
    `;
  });

  page++;
  loading = false;
}

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadProducts();
  }
});

/* Search đơn giản client-side */

searchBox?.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();

  document.querySelectorAll(".card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(keyword) ? "block" : "none";
  });
});

loadProducts();