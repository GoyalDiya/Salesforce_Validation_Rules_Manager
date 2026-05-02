import apiClient from './client'

// Flip to false once the backend is wired up.
// While true, all API calls return fake data so the UI can be built/tested in isolation.
const USE_MOCKS = true

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

export async function toggleRule(id, active) {
  if (USE_MOCKS) {
    await sleep(MOCK_DELAY_MS)
    mockRules = mockRules.map((r) => (r.id === id ? { ...r, active } : r))
    return { id, active }
  }
  const { data } = await apiClient.patch(`/api/validation-rules/${id}`, {
    active,
  })
  return data
}

export async function bulkToggle(active) {
  if (USE_MOCKS) {
    await sleep(MOCK_DELAY_MS)
    mockRules = mockRules.map((r) => ({ ...r, active }))
    return { count: mockRules.length, active }
  }
  const { data } = await apiClient.post('/api/validation-rules/bulk-toggle', {
    active,
  })
  return data
}

export async function deploy() {
  if (USE_MOCKS) {
    await sleep(MOCK_DELAY_MS * 2)
    return { status: 'success', deployed: mockRules.length }
  }
  const { data } = await apiClient.post('/api/validation-rules/deploy')
  return data
}
