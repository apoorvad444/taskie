// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "taskie-017.up.railway.app"],
    },
  },
};

module.exports = nextConfig;
