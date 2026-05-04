import config from '../config.js'

const SF_AUTH_ERROR_NAMES = new Set([
  'INVALID_SESSION_ID',
  'invalid_grant',
  'invalid_token',
  'expired_access_token',
  'expired_authorization',
])

function isSalesforceAuthError(err) {
  if (err.errorCode && SF_AUTH_ERROR_NAMES.has(err.errorCode)) return true
  if (err.name && SF_AUTH_ERROR_NAMES.has(err.name)) return true
  // jsforce token-refresh failures throw with these on the message
  if (typeof err.message === 'string') {
    if (err.message.includes('invalid_grant')) return true
    if (err.message.includes('Session expired or invalid')) return true
  }
  return false
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (isSalesforceAuthError(err)) {
    if (req.session) {
      req.session.tokens = null
      req.session.user = null
    }
    return res.status(401).json({
      error: {
        message: 'Salesforce session expired. Please log in again.',
        code: 'SF_SESSION_EXPIRED',
      },
    })
  }

  const status =
    err.status ||
    err.statusCode ||
    (err.errorCode === 'INSUFFICIENT_ACCESS' ? 403 : 500)

  if (status >= 500) {
    console.error('[error]', err)
  } else {
    console.warn(`[error] ${status} ${err.message}`)
  }

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || err.errorCode,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  })
}

export default errorHandler
