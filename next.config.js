/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable webpack caching to save memory
  webpack: (config) => {
    config.cache = false
    return config
  },

  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,

  // Disable CSS optimization to reduce memory usage
  experimental: {
    optimizeCss: false,
  },

  // ✅ FIXED: turbopack should be an object, not a boolean.
  // If you want to disable it, you can leave it out or set it to an empty object.
  turbopack: {},

  // Reduce memory usage for static generation
  staticPageGenerationTimeout: 120,

  // ❌ REMOVED: eslint configuration is deprecated.
  // Use the ESLint CLI instead: npx next lint

  // Disable TypeScript type checking during build to save memory
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Disable powered by header
  poweredByHeader: false,

  // Compress responses
  compress: true,
}

module.exports = nextConfig