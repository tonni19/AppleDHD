import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The packaged iOS/Android app loads these files from the device, so every route
  // has to be a plain static asset — no server at runtime.
  output: "export",

  images: {
    // There is no image optimiser in a static export.
    unoptimized: true,
  },

  // Emit `/x/index.html` rather than `/x.html`, which is what a webview's file
  // server resolves correctly.
  trailingSlash: true,
};

export default nextConfig;
