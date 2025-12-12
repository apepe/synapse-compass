/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/Synapse:syn:synId',
        destination: '/?synId=:synId',
      },
      {
        source: '/Synapse/:synId',
        destination: '/?synId=:synId',
      },
    ]
  },
}

module.exports = nextConfig

