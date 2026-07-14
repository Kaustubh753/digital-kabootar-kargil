/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite is a built-in experimental module; ensure it is treated as an
  // external server dependency and never bundled for the client.
  serverExternalPackages: ["node:sqlite"],
  experimental: {
    // Suppress the noisy experimental-SQLite warning in server logs.
  },
};

export default nextConfig;
