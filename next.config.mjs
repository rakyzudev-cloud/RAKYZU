/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
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

    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // JANGAN pernah bundle package AI ini sama sekali.
    // Biarkan jadi require() runtime murni, gak pernah masuk graph webpack.
    if (!isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        {
          "onnxruntime-web": "commonjs onnxruntime-web",
          "@imgly/background-removal": "commonjs @imgly/background-removal",
        },
      ];
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
