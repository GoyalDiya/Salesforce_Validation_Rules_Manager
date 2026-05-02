import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  const user = req.session.user || {}
  const tokens = req.session.tokens || {}

  res.json({
    user: {
      id: user.id,
      organizationId: user.organizationId,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      instanceUrl: tokens.instanceUrl,
    },
  })
})

export default router
