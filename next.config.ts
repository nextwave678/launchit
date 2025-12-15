import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer, dir }) => {
    // Fix for __dirname not being defined in Edge runtime
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Provide __dirname polyfill to prevent runtime errors
    config.plugins.push(
      new webpack.DefinePlugin({
        __dirname: isServer ? JSON.stringify(dir) : JSON.stringify('/'),
      })
    );
    
    return config;
  },
};

export default nextConfig;
