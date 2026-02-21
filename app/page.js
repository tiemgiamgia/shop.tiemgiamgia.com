import { loadFeed } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";

export default async function Home() {
  const products = await loadFeed();

  return (
    <>
      <Header />

      <main className="container">
        <h1>Sản phẩm mới</h1>

        <div className="grid">
          {products.slice(0, 20).map(p => (
            <a key={p.sku} href={`/${p.slug}`} className="card">
              <img src={p.image} />
              <div>{p.name}</div>
              <div className="price">
                {p.price.toLocaleString()}đ
              </div>
            </a>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}