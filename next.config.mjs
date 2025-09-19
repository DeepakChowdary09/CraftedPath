/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}, // ✅ Correct usage
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/portraits/**", // ✅ Add this line!
      },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/*": require("path").resolve(__dirname, "*"),
      "@lib/*": require("path").resolve(__dirname, "lib", "*"),
    };
    return config;
  },
};

export default nextConfig;
