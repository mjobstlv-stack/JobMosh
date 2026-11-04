/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production"

// In dev, Turbopack + React require 'unsafe-eval' for HMR and call-stack reconstruction.
// In production, React never calls eval(), so we keep the policy strict.
// Google Analytics 4 (gtag.js) hosts, per Google's CSP guide for GA4.
const GA_SCRIPT = "https://*.googletagmanager.com"
// The *.google.com / doubleclick / google.co.il hosts are used when Google signals is on.
const GA_CONNECT =
  "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com https://*.google.co.il"

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GA_SCRIPT}`
  : `script-src 'self' 'unsafe-inline' ${GA_SCRIPT}`

const ContentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com https://*.google.co.il`,
  // Allow same-origin + Blob CDN (CV previews) + Vercel Analytics + Google Analytics
  `connect-src 'self' https://*.public.blob.vercel-storage.com https://vitals.vercel-insights.com ${GA_CONNECT}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
]

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jobmosh.co.il" }],
        destination: "https://www.jobmosh.co.il/:path*",
        permanent: true,
      },
      // Legacy sequential job IDs → SEO-friendly slugs
      { source: "/jobs/job-1", destination: "/jobs/fullstack-developer-nova-technologies-tel-aviv", permanent: true },
      { source: "/jobs/job-2", destination: "/jobs/ux-ui-designer-pixel-studio-herzliya", permanent: true },
      { source: "/jobs/job-3", destination: "/jobs/registered-nurse-hadassah-medical-center-haifa", permanent: true },
      { source: "/jobs/job-4", destination: "/jobs/account-manager-global-sale-ramat-gan", permanent: true },
      { source: "/jobs/job-5", destination: "/jobs/digital-marketing-expert-buzz-media-remote", permanent: true },
      { source: "/jobs/job-6", destination: "/jobs/accountant-finance-plus-jerusalem", permanent: true },
      { source: "/jobs/job-7", destination: "/jobs/student-tech-support-nova-technologies-beer-sheva", permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
