/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // TODO<init> config
    remotePatterns: [{ protocol: "https", hostname: "cdn.fullstack-template.app" }],
  },
};

export default nextConfig;
