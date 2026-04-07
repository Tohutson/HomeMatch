import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "ap.rdcpix.com" }],
  },
};

export default nextConfig;
