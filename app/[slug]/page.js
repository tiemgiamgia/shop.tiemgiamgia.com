import { loadFeed } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";

export default async function Page({ params }) {

  const slugParam = params?.slug || "";

  /* 🔥 Extract SKU an toàn */
  const parts = slugParam.split("-");
  const sku = parts.length ? parts.pop() : null;

  if (!sku) {
    return <div>Invalid product</div>;
  }

  const products = await loadFeed();
  const product = products.find(p => p.sku === sku);

  if (!product) {
    return <div>Not found</div>;
  }

  return (
    <>
      <Header />

      <main className="container">
        <div className="product">

          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
          />

          <div>
            <h1>{product.title}</h1>

            <div className="price">
              {product.price.toLocaleString()}đ
            </div>

            <p>{product.desc}</p>

            <a href={product.url}>
              Xem trên Shopee
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}