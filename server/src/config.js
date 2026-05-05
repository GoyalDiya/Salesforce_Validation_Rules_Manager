import 'dotenv/config'

const REQUIRED_VARS = [
  'SF_CLIENT_ID',
  'SF_CLIENT_SECRET',
  'SF_LOGIN_URL',
  'SF_CALLBACK_URL',
  'SESSION_SECRET',
  'CLIENT_ORIGIN',
]

const PLACEHOLDER_TOKENS = [
  'PASTE_YOUR_',
  'your-consumer-',
  'replace-with-',
  'change-me',
  'dev-only-change-me',
]

const missing = REQUIRED_VARS.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(
    `\n[config] Missing required env vars: ${missing.join(', ')}\n` +
      `[config] Copy server/.env.example to server/.env and fill in the values.\n`
  )
  process.exit(1)
}

const placeholders = REQUIRED_VARS.filter((name) =>
  PLACEHOLDER_TOKENS.some((token) => process.env[name].includes(token))
)
if (placeholders.length > 0) {
  console.warn(
    `\n[config] WARNING: these env vars still contain placeholder values: ${placeholders.join(
      ', '
    )}`
  )
  console.warn(
    `[config] OAuth will fail until you replace them with real values.\n`
  )
}

const clientOrigins = process.env.CLIENT_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // When true, session cookie is set with sameSite=none + secure=true so
  // browsers will send it on cross-origin requests (Vercel ↔ tunnel/Render).
  crossSiteCookies: process.env.CROSS_SITE_COOKIES === 'true',

  sessionSecret: process.env.SESSION_SECRET,
  // Full list (used for CORS allowlist). First entry is the canonical
  // client origin used for post-OAuth redirects.
  clientOrigins,
  clientOrigin: clientOrigins[0],

  salesforce: {
    clientId: process.env.SF_CLIENT_ID,
    clientSecret: process.env.SF_CLIENT_SECRET,
    loginUrl: process.env.SF_LOGIN_URL,
    callbackUrl: process.env.SF_CALLBACK_URL,
  },
}

export default config
