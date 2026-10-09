import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md 는 이 저장소의 단일 지침 파일이다. next dev 가 자동으로 고치지 않게 한다.
  agentRules: false,
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
