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

router.patch('/:id', async (req, res, next) => {
  try {
    if (typeof req.body?.active !== 'boolean') {
      return res
        .status(400)
        .json({ error: { message: '`active` must be a boolean' } })
    }
    const conn = getConnection(req)
    const result = await setRuleActive(conn, req.params.id, req.body.active)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/bulk-toggle', async (req, res, next) => {
  try {
    if (typeof req.body?.active !== 'boolean') {
      return res
        .status(400)
        .json({ error: { message: '`active` must be a boolean' } })
    }
    const { active } = req.body

    const conn = getConnection(req)
    const list = await conn.tooling.query(
      `SELECT Id FROM ValidationRule WHERE EntityDefinition.DeveloperName = 'Account'`
    )
    const ids = list.records.map((r) => r.Id)

    const failed = []
    for (const id of ids) {
      try {
        await setRuleActive(conn, id, active)
      } catch (err) {
        failed.push({ id, message: err.message })
      }
    }

    res.json({
      count: ids.length - failed.length,
      total: ids.length,
      active,
      failed,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/deploy', async (req, res, next) => {
  try {
    const conn = getConnection(req)
    const list = await conn.tooling.query(
      `SELECT Id, Active FROM ValidationRule WHERE EntityDefinition.DeveloperName = 'Account'`
    )
    const records = list.records.map((r) => ({ id: r.Id, active: !!r.Active }))

    const failed = []
    for (const { id, active } of records) {
      try {
        await setRuleActive(conn, id, active)
      } catch (err) {
        failed.push({ id, message: err.message })
      }
    }

    res.json({
      status: failed.length === 0 ? 'success' : 'partial',
      deployed: records.length - failed.length,
      total: records.length,
      failed,
    })
  } catch (err) {
    next(err)
  }
})

export default router
export { setRuleActive }
