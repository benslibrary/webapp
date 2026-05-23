import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Vercel Blob — every book cover lives here after the backfill;
      // covers from new admin entries also pass through put() so they
      // end up here too.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Naver profile images (used on /me when Naver gives a profile_image
      // URL — different CDN than the book covers).
      { protocol: "https", hostname: "phinf.pstatic.net" },
      { protocol: "https", hostname: "ssl.pstatic.net" },
    ],
  },
};

export default nextConfig;
