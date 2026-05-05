import { Router } from 'express'

import requireAuth from '../middleware/requireAuth.js'
import { getConnection } from '../salesforce.js'

const router = Router()

const LIST_SOQL = `
  SELECT Id, ValidationName, Active, Description, ErrorMessage,
         EntityDefinition.DeveloperName
  FROM ValidationRule
  WHERE EntityDefinition.DeveloperName = 'Account'
  ORDER BY ValidationName
`.trim()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const conn = getConnection(req)
    const result = await conn.tooling.query(LIST_SOQL)

    const rules = result.records.map((r) => ({
      id: r.Id,
      name: r.ValidationName,
      description: r.Description ?? '',
      active: !!r.Active,
      errorMessage: r.ErrorMessage ?? '',
    }))

    res.json({ rules })
  } catch (err) {
    next(err)
  }
})

async function setRuleActive(conn, id, active) {
  const rule = await conn.tooling.sobject('ValidationRule').retrieve(id)
  if (!rule || !rule.Metadata) {
    const err = new Error(`Validation rule ${id} not found`)
    err.status = 404
    throw err
  }
  rule.Metadata.active = active
  await conn.tooling
    .sobject('ValidationRule')
    .update({ Id: id, Metadata: rule.Metadata })
  return { id, active }
}

router.post('/deploy', async (req, res, next) => {
  try {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : null
    if (!changes) {
      return res
        .status(400)
        .json({ error: { message: '`changes` must be an array' } })
    }
    for (const c of changes) {
      if (!c?.id || typeof c.active !== 'boolean') {
        return res.status(400).json({
          error: {
            message: 'Each change must be `{ id: string, active: boolean }`',
          },
        })
      }
    }

    if (changes.length === 0) {
      return res.json({ status: 'success', deployed: 0, total: 0, failed: [] })
    }

    const conn = getConnection(req)
    const failed = []
    for (const { id, active } of changes) {
      try {
        await setRuleActive(conn, id, active)
      } catch (err) {
        failed.push({ id, message: err.message })
      }
    }

    res.json({
      status: failed.length === 0 ? 'success' : 'partial',
      deployed: changes.length - failed.length,
      total: changes.length,
      failed,
    })
  } catch (err) {
    next(err)
  }
})

export default router
