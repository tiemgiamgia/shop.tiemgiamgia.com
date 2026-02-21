import { loadFeed } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";

export async function generateMetadata({ params }) {
  const sku = params.slug.split("-").pop();
  const products = await loadFeed();
  const product = products.find(p => p.sku === sku);

  if (!product) return {};

  return {
    title: product.name,
    description: product.desc?.slice(0, 160)
  };
}

export default async function Page({ params }) {
  const sku = params.slug.split("-").pop();

  const products = await loadFeed();
  const product = products.find(p => p.sku === sku);

  if (!product) return <div>Not found</div>;

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
