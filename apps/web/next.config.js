import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.redwood.app" }],
  },
};

export default nextConfig;
