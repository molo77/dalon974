/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "source.unsplash.com"]
  },
  experimental: {
    // garde swcPlugins vide si nécessaire, sinon retire complètement
    swcPlugins: []
  }
};

module.exports = nextConfig;
