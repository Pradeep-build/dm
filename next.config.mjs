/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? "https://deta-music-api.onrender.com/api/:path*" // <--- Paste your Render URL here
            : "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
