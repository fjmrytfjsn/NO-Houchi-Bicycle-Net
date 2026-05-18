/** @type {import('next').NextConfig} */
function getOwnerApiBaseUrl() {
  return (
    process.env.OWNER_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).replace(/\/$/, '');
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBaseUrl = getOwnerApiBaseUrl();

    if (!apiBaseUrl) {
      return [];
    }

    return [
      {
        source: '/api/owner/:path*',
        destination: `${apiBaseUrl}/owner/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
