/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";
const isLocalPackage = process.env.KAIZEN_LOCAL_PACKAGE === "1";
const contentSecurityPolicy = [
  "default-src 'self'",
  // React/Turbopack uses eval only for development diagnostics and source maps.
  // Production remains eval-free.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(!isDev && !isLocalPackage ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()" },
];

const packageVersion = require("./package.json").version;
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_KAIZEN_VERSION: packageVersion,
    NEXT_PUBLIC_KAIZEN_UPDATE_CHANNEL: process.env.KAIZEN_UPDATE_CHANNEL ?? "disabled",
    NEXT_PUBLIC_KAIZEN_DESKTOP: process.env.KAIZEN_DESKTOP ?? "0",
  },
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
