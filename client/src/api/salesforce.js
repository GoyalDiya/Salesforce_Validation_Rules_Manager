import apiClient from './client'

// Set to true to bypass the backend and return seeded fake data — useful when
// iterating on the UI without a Salesforce session.
const USE_MOCKS = false

const MOCK_DELAY_MS = 400

let mockRules = [
  {
    id: '03d000000000001',
    name: 'Phone_Required',
    description: 'Phone number must be provided on every Account.',
    active: true,
    errorMessage: 'Phone number is required.',
  },
  {
    id: '03d000000000002',
    name: 'Account_Name_Min_Length',
    description: 'Account Name must be at least 3 characters.',
    active: true,
    errorMessage: 'Account Name must be at least 3 characters long.',
  },
  {
    id: '03d000000000003',
    name: 'Phone_Length_Check',
    description: 'Phone number must be exactly 10 digits.',
    active: false,
    errorMessage: 'Phone number must be exactly 10 digits.',
  },
  {
    id: '03d000000000004',
    name: 'Annual_Revenue_Positive',
    description: 'Annual Revenue cannot be a negative number.',
    active: true,
    errorMessage: 'Annual Revenue cannot be negative.',
  },
  {
    id: '03d000000000005',
    name: 'Industry_Required',
    description: 'Industry picklist must be selected.',
    active: false,
    errorMessage: 'Please select an Industry.',
  },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getValidationRules() {
  if (USE_MOCKS) {
    await sleep(MOCK_DELAY_MS)
    return mockRules.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get('/api/validation-rules')
  return data.rules
}

export async function deployChanges(changes) {
  if (USE_MOCKS) {
    await sleep(MOCK_DELAY_MS * 2)
    for (const c of changes) {
      mockRules = mockRules.map((r) =>
        r.id === c.id ? { ...r, active: c.active } : r
      )
    }
    return {
      status: 'success',
      deployed: changes.length,
      total: changes.length,
      failed: [],
    }
  }
  const { data } = await apiClient.post('/api/validation-rules/deploy', {
    changes,
  })
  return data
}
