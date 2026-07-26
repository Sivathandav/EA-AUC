/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Player/team photos are rendered with plain <img> tags (not next/image)
  // since URLs are arbitrary and organizer-supplied - keeps setup friction-free.
};

export default nextConfig;
