import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      {
        source: "/contact",
        destination: "https://www.botlane.io/contact",
        permanent: false,
      },
      {
        source: "/assist",
        destination: "/#products",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
