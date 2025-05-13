/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Add your Whop App origin here
      allowedOrigins: ["2ockbpmadrkpt4chjrc5.apps.whop.com"],
    },
  },
};

export default nextConfig;
