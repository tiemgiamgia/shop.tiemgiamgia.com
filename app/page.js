import { loadPreviewProducts } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";
import SearchBox from "@/components/SearchBox";

export default async function Home() {

  const products = await loadPreviewProducts();

  if (!products?.length) {
    return (
      <>
        <Header />

        <main className="container">
          <SearchBox />

          <h1>Tiệm Giảm Giá</h1>
          <p>Đang tải sản phẩm...</p>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="container">

        <SearchBox />

        <h1>Sản phẩm mới</h1>

        <div className="grid">
          {products.slice(0, 20).map(p => (
            <a
              key={p.sku}
              href={`/${p.slug}-${p.sku}`}
              className="card"
            >
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
              />

              <div>{p.title}</div>

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