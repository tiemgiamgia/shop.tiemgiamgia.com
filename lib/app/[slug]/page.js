import { loadFeed } from "@/lib/feed";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";

export async function generateMetadata({ params }) {
  const products = await loadFeed();
  const product = products.find(p => p.slug === params.slug);

  if (!product) return {};

  return {
    title: product.name,
    description: product.desc?.slice(0, 160)
  };
}

export default async function Page({ params }) {
  const products = await loadFeed();

  const product = products.find(p => p.slug === params.slug);

  if (!product) return <div>Not found</div>;

  return (
    <>
      <Header />

      <main className="container">
        <h1>{product.name}</h1>
        <img src={product.image} />
        <div>{product.price.toLocaleString()}đ</div>
        <p>{product.desc}</p>
      </main>

      <Footer />
    </>
  );
}
