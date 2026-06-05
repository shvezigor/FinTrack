import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => `fintrack-${Date.now()}`,
  transpilePackages: ["@resource-manager/shared"],
};

export default nextConfig;
