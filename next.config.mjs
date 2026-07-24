/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Tell Next.js not to try to bundle these packages on the server
  serverExternalPackages: [
    "@imgly/background-removal",
    "onnxruntime-web",
  ],

  webpack: (config, { isServer }) => {
    // Existing fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Support WebAssembly (required by onnxruntime-web)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Treat .wasm files as assets
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Prevent Webpack from trying to parse certain ONNX / WASM helper files as JS modules
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }

    return config;
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "550mb",
    },
  },

  // Keep the headers that helped with FFmpeg
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
