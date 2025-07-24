import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { dev, isServer }) => {
    // Suppress warnings for optional dependencies
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('cardinal');
    }
    
    // Exclude native modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      config.externals = config.externals || [];
      config.externals.push({
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@azure/storage-blob': 'commonjs @azure/storage-blob',
        'mysqldump': 'commonjs mysqldump',
        'mysql2': 'commonjs mysql2',
        'pg': 'commonjs pg',
        'mssql': 'commonjs mssql',
      });
    }
    
    // Ignore module warnings for optional and native dependencies
    config.ignoreWarnings = [
      /Module not found: Can't resolve 'cardinal'/,
      /Critical dependency: the request of a dependency is an expression/,
      /Can't resolve 'encoding'/,
    ];
    
    return config;
  },
};

export default nextConfig;
