import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./db/migrations/**"],
  },
};

export default nextConfig;
