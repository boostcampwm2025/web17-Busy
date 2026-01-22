/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['is1-ssl.mzstatic.com', 'www.gravatar.com'],
  },
};

export default nextConfig;
