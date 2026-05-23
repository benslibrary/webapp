import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Naver profile images (used on /me when Naver gives a profile_image URL)
      { protocol: "https", hostname: "phinf.pstatic.net" },
      { protocol: "https", hostname: "ssl.pstatic.net" },
      // National Library of Korea cover images (TITLE_URL from SearchApi.do)
      { protocol: "https", hostname: "www.nl.go.kr" },
      { protocol: "https", hostname: "image.nl.go.kr" },
      // Aladin book cover CDN (sometimes returned by NL TITLE_URL)
      { protocol: "https", hostname: "image.aladin.co.kr" },
      // Naver Shopping book covers (alternative cover source)
      { protocol: "https", hostname: "shopping-phinf.pstatic.net" },
      // legacy template hosts — kept just in case
      { protocol: "https", hostname: "avatar.vercel.sh" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
