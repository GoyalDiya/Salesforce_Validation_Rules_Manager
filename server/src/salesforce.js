import jsforce from 'jsforce'

import config from './config.js'

function buildOAuth2() {
  return new jsforce.OAuth2({
    loginUrl: config.salesforce.loginUrl,
    clientId: config.salesforce.clientId,
    clientSecret: config.salesforce.clientSecret,
    redirectUri: config.salesforce.callbackUrl,
  })
}

export function getConnection(req) {
  const tokens = req.session?.tokens
  if (!tokens?.accessToken || !tokens?.instanceUrl) {
    const err = new Error('No active Salesforce session')
    err.status = 401
    err.code = 'UNAUTHENTICATED'
    throw err
  }

  const conn = new jsforce.Connection({
    oauth2: buildOAuth2(),
    instanceUrl: tokens.instanceUrl,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    version: '60.0',
  })

  conn.on('refresh', (newAccessToken) => {
    if (req.session?.tokens) {
      req.session.tokens.accessToken = newAccessToken
      req.session.save((err) => {
        if (err) console.warn('[salesforce] session.save after refresh failed:', err.message)
      })
    }
  })

  return conn
}
