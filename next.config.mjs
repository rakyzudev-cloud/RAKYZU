/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Required for ffmpeg.wasm and some AI libs
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  // Increase body size limit for large uploads if using server actions later
  experimental: {
    serverActions: {
      bodySizeLimit: '550mb',
    },
  },
};

export default nextConfig;
