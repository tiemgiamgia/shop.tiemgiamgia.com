import { withCloudflare } from "@cloudflare/next-on-pages";

/** @type {import('next').NextConfig} */
const nextConfig = {

  reactStrictMode: true,

  images: {
    unoptimized: true   // 🔥 Bắt buộc nếu dùng ảnh ngoài (Shopee CDN)
  }

};

export default withCloudflare(nextConfig);