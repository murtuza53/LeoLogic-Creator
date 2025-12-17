import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverActions: {
    bodySizeLimit: '50mb',
  },
   webpack: (config, { isServer }) => {
    // This is to fix a bug with handlebars and webpack
    config.module.rules.push({
        test: /node_modules\/handlebars\/lib\/index\.js$/,
        loader: 'string-replace-loader',
        options: {
            search: 'require.extensions',
            replace: 'undefined',
        },
    });
    return config;
  },
};

export default nextConfig;
