/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com"
      }
    ]
  },
  experimental: {
    // garde swcPlugins vide si nécessaire, sinon retire complètement
    swcPlugins: []
  }
};

module.exports = nextConfig;
