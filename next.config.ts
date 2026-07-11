import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/leave-guide", destination: "/parental-leave-101", permanent: true },
      { source: "/leave-guide/:slug", destination: "/parental-leave-101/:slug", permanent: true },
      { source: "/how-leave-works", destination: "/parental-leave-101", permanent: true },
    ];
  },
};

export default nextConfig;
