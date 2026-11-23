import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit"], // pdfkit reads its font metrics from disk at runtime
  // Fonts/images for PDFs + sharp's native libvips (not always picked up by file tracing).
  outputFileTracingIncludes: { "/api/**": ["./assets/fonts/**", "./public/*.png", "./node_modules/@img/**"] },
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
