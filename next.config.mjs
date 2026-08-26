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
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://YOUR-BACKEND-NAME.onrender.com/api/:path*' // Replace this with your Render URL after deploying
          : 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
}

export default nextConfig