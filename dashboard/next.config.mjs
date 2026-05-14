/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Cloudflare compatibility
  typescript: {
    ignoreBuildErrors: true, // Optional: skips type checks during build for faster deploy
  },
  eslint: {
    ignoreDuringBuilds: true, // Optional: skips lint checks during build
  },
};

export default nextConfig;
