/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    return [{ source: '/api/:path*', destination: 'http://127.0.0.1:3002/api/:path*' }];
  },
  images: {
    domains: ['is1-ssl.mzstatic.com', 'www.gravatar.com'],
  },
};

export default nextConfig;
