/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true   // 🔥 Quan trọng nếu dùng ảnh ngoài (Shopee CDN)
  }
};

export default nextConfig;