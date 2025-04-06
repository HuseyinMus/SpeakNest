import type { NextConfig } from "next";
import { nextI18NextConfig } from './next-i18next.config';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  
  // i18n konfigürasyonunu dahil et
  ...nextI18NextConfig
};

export default nextConfig;
