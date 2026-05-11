/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/owner/:path*',
        destination: 'http://localhost:4000/owner/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
