import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Exclude the obsidian symlink from Turbopack's filesystem traversal
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json", ".css"],
  },
  webpack(config) {
    // Exclude symlinked obsidian_context from webpack resolution
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/obsidian_context/**",
        "**/.git/**",
      ],
    };
    return config;
  },
};

export default nextConfig;
