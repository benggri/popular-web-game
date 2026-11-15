import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pixelfx ships untranspiled ES modules straight from GitHub
  transpilePackages: ["pixelfx"],
};

export default nextConfig;
