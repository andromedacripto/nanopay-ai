import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações de performance e compatibilidade
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Headers de segurança para Web3
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
