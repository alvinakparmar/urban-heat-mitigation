/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // On Vercel, vercel.json routes /api/* to the Python serverless function.
  // For local dev, run the FastAPI backend separately and set NEXT_PUBLIC_API_URL
  // in .env.local (e.g. http://localhost:8000).
};

module.exports = nextConfig;