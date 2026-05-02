import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getValidationRules,
  toggleRule,
  bulkToggle,
  deploy,
} from '../api/salesforce'
import RulesTable from '../components/RulesTable'
import BulkActions from '../components/BulkActions'

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingIds, setTogglingIds] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  const loadRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getValidationRules()
      setRules(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleToggle = async (id, active) => {
    setTogglingIds((prev) => new Set(prev).add(id))
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)))
    try {
      await toggleRule(id, active)
    } catch (err) {
      setError(err.message)
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: !active } : r))
      )
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkToggle = async (active) => {
    setBulkBusy(true)
    setError(null)
    try {
      await bulkToggle(active)
      await loadRules()
      setNotice(
        `${active ? 'Activated' : 'Deactivated'} all validation rules.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleDeploy = async () => {
    setBulkBusy(true)
    setError(null)
    try {
      const result = await deploy()
      setNotice(
        `Deploy succeeded. ${result.deployed ?? ''} rule(s) synced to Salesforce.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Validation Rules
            </h1>
            <p className="text-slate-500 text-sm">
              Manage Account validation rules in your Salesforce org.
              {user?.mocked && (
                <span className="ml-2 text-amber-600">(mock session)</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
          >
            Logout
          </button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500">
            {loading
              ? 'Loading rules…'
              : `${rules.length} rule${rules.length === 1 ? '' : 's'} • ${
                  rules.filter((r) => r.active).length
                } active`}
          </p>
          <BulkActions
            onRefresh={loadRules}
            onActivateAll={() => handleBulkToggle(true)}
            onDeactivateAll={() => handleBulkToggle(false)}
            onDeploy={handleDeploy}
            busy={loading || bulkBusy}
          />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 flex items-start justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 flex items-start justify-between gap-4">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
            Loading rules…
          </div>
        ) : (
          <RulesTable
            rules={rules}
            onToggle={handleToggle}
            togglingIds={togglingIds}
          />
        )}
      </div>
    </div>
  )
}

export default DashboardPage
