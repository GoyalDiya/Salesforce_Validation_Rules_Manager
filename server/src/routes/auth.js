import { Router } from 'express'
import crypto from 'node:crypto'
import jsforce from 'jsforce'

import config from '../config.js'

const router = Router()

const OAUTH_SCOPES = ['api', 'refresh_token', 'offline_access']

function buildOAuth2() {
  return new jsforce.OAuth2({
    loginUrl: config.salesforce.loginUrl,
    clientId: config.salesforce.clientId,
    clientSecret: config.salesforce.clientSecret,
    redirectUri: config.salesforce.callbackUrl,
  })
}

router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  req.session.oauthState = state

  const oauth2 = buildOAuth2()
  const authUrl = oauth2.getAuthorizationUrl({
    scope: OAUTH_SCOPES.join(' '),
    state,
  })

  res.redirect(authUrl)
})

router.get('/callback', async (req, res, next) => {
  const { code, state, error, error_description: errorDescription } = req.query

  if (error) {
    return res.redirect(
      `${config.clientOrigin}/?auth_error=${encodeURIComponent(
        errorDescription || error
      )}`
    )
  }

  if (!code) {
    return res.redirect(
      `${config.clientOrigin}/?auth_error=${encodeURIComponent(
        'Missing authorization code'
      )}`
    )
  }

  if (!state || state !== req.session.oauthState) {
    return res.redirect(
      `${config.clientOrigin}/?auth_error=${encodeURIComponent(
        'Invalid OAuth state — possible CSRF'
      )}`
    )
  }
  delete req.session.oauthState

  try {
    const oauth2 = buildOAuth2()
    const conn = new jsforce.Connection({ oauth2 })
    const userInfo = await conn.authorize(code)

    let identity = null
    try {
      identity = await conn.identity()
    } catch (err) {
      console.warn('[auth] identity() failed:', err.message)
    }

    req.session.tokens = {
      accessToken: conn.accessToken,
      refreshToken: conn.refreshToken,
      instanceUrl: conn.instanceUrl,
    }
    req.session.user = {
      id: userInfo.id,
      organizationId: userInfo.organizationId,
      url: userInfo.url,
      displayName: identity?.display_name ?? null,
      username: identity?.username ?? null,
      email: identity?.email ?? null,
    }

    res.redirect(`${config.clientOrigin}/dashboard`)
  } catch (err) {
    next(err)
  }
})

router.post('/logout', async (req, res) => {
  const tokens = req.session.tokens

  if (tokens?.accessToken && tokens?.instanceUrl) {
    try {
      const conn = new jsforce.Connection({
        instanceUrl: tokens.instanceUrl,
        accessToken: tokens.accessToken,
      })
      await conn.logout()
    } catch (err) {
      console.warn('[auth] logout revoke failed:', err.message)
    }
  }

  req.session.destroy((err) => {
    if (err) {
      console.warn('[auth] session.destroy failed:', err.message)
      return res.status(500).json({ error: { message: 'Logout failed' } })
    }
    res.clearCookie('svrm.sid')
    res.json({ ok: true })
  })
})

export default router
