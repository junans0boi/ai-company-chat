import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/company", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
