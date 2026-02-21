import "../public/css/site.css";

export const metadata = {
  title: "Tiệm Giảm Giá",
  description: "Sản phẩm Shopee giá tốt"
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
        <script src="/js/sticky-bar.js" defer></script>
      </body>
    </html>
  );
}
