/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Note: do NOT set `output: 'standalone'` here.
  // Vercel manages its own serverless runtime and is incompatible with standalone mode.
  // If we later want to deploy this frontend via Docker, gate that behind an env var, e.g.:
  //   ...(process.env.BUILD_TARGET === 'docker' && { output: 'standalone' })
};

module.exports = nextConfig;
