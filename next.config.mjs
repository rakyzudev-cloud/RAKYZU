/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Correct key for Next.js 14
    serverComponentsExternalPackages: [
      "@imgly/background-removal",
      "onnxruntime-web",
    ],
    serverActions: {
      bodySizeLimit: "550mb",
    },
  },

  webpack: (config, { isServer }) => {
    // Fallbacks needed for browser-only libraries
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      module: false,
    };

    // Prevent Node-only packages from being bundled
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    // WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Treat .wasm as static assets
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Jangan pernah bundle/minify ulang file onnxruntime — perlakukan sebagai asset mentah
    config.module.rules.push({
      test: /onnxruntime-web.*\.(m?js)$/,
      type: "asset/resource",
    });

    return config;
  },

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
