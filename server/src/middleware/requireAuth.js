function requireAuth(req, res, next) {
  if (!req.session?.tokens?.accessToken) {
    return res
      .status(401)
      .json({ error: { message: 'Not authenticated', code: 'UNAUTHENTICATED' } })
  }
  next()
}

export default requireAuth
