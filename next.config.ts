import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/empty-module.js" },
      path: { browser: "./lib/empty-module.js" },
    },
  },
};

export default nextConfig;
