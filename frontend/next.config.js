/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'ipfs.io', 'gateway.pinata.cloud'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  webpack: (config, { isServer }) => {
    // Externalize @zama-fhe/relayer-sdk on server-side (SSR)
    if (isServer) {
      config.externals = [...(config.externals || []), '@zama-fhe/relayer-sdk'];
      return config;
    }
    
    // Client-side only configuration
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    };
    
    // Ignore WASM and module warnings
    config.ignoreWarnings = [
      /Can't resolve '__wbindgen_placeholder__'/,
      { module: /node_modules\/@zama-fhe\/relayer-sdk/ },
      /Critical dependency: the request of a dependency is an expression/,
      /parseVec could not cast the value/,
      /Module parse failed/,
    ];
    
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
      os: false,
      buffer: false,
      util: false,
      assert: false,
      process: false,
    };
    
    return config;
  },
  // Prevent hydration errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
