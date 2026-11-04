// Vercel Deployment Protection puts deployment URLs behind a login page. CI gets through
// with the project's "Protection Bypass for Automation" secret, sent only to Vercel hosts.
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

export const vercelBypassHeaders = url =>
  secret && new URL(url).hostname.endsWith('.vercel.app')
    ? { 'x-vercel-protection-bypass': secret }
    : {}
