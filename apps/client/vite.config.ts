import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

export default defineConfig({
  plugins: [react()],
  preview: {
    host: "0.0.0.0",
    allowedHosts: railwayPublicDomain ? [railwayPublicDomain] : [],
  },
});