import { loadFeed } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "Sản phẩm | Tiệm Giảm Giá"
  };
}

export default async function Page({ params }) {

  const slugParts = params.slug.split("-");
  const sku = slugParts[slugParts.length - 1];

  const products = await loadFeed();
  const product = products.find(p => p.sku === sku);

  if (!product) notFound();

  return (
    <>
      <Header />

      <main className="container">
        <div className="product">
          <img src={product.image} />

          <div>
            <h1>{product.name}</h1>

            <div className="price">
              {product.price.toLocaleString()}đ
            </div>

            <p>{product.desc}</p>

            <a href={product.url}>Xem trên Shopee</a>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}