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

    // Ignore problematic ONNX helper files that Webpack tries to parse as JS
    config.module.rules.push({
      test: /ort.*\.js$/,
      type: "javascript/auto",
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
