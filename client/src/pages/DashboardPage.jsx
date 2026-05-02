import { useEffect, useState, useCallback, useRef } from 'react'
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
import TableSkeleton from '../components/TableSkeleton'

const NOTICE_DISMISS_MS = 4000

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [rules, setRules] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [togglingIds, setTogglingIds] = useState(new Set())
  const [activeAction, setActiveAction] = useState(null)

  const noticeTimerRef = useRef(null)

  const showNotice = useCallback((msg) => {
    setNotice(msg)
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null)
      noticeTimerRef.current = null
    }, NOTICE_DISMISS_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    }
  }, [])

  const loadRules = useCallback(
    async ({ initial = false } = {}) => {
      if (initial) setInitialLoading(true)
      else setRefreshing(true)
      setError(null)
      try {
        const data = await getValidationRules()
        setRules(data)
      } catch (err) {
        setError(err.message)
      } finally {
        if (initial) setInitialLoading(false)
        else setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    loadRules({ initial: true })
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
    setActiveAction(active ? 'activate' : 'deactivate')
    setError(null)
    try {
      await bulkToggle(active)
      const data = await getValidationRules()
      setRules(data)
      showNotice(
        `${active ? 'Activated' : 'Deactivated'} all validation rules.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setActiveAction(null)
    }
  }

  const handleDeploy = async () => {
    setActiveAction('deploy')
    setError(null)
    try {
      const result = await deploy()
      showNotice(
        `Deploy succeeded. ${result.deployed ?? ''} rule(s) synced to Salesforce.`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setActiveAction(null)
    }
  }

  const handleRefresh = async () => {
    setActiveAction('refresh')
    try {
      await loadRules({ initial: false })
    } finally {
      setActiveAction(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const busy =
    initialLoading || refreshing || activeAction !== null || togglingIds.size > 0

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
            {initialLoading
              ? 'Loading rules…'
              : `${rules.length} rule${rules.length === 1 ? '' : 's'} • ${
                  rules.filter((r) => r.active).length
                } active`}
          </p>
          <BulkActions
            onRefresh={handleRefresh}
            onActivateAll={() => handleBulkToggle(true)}
            onDeactivateAll={() => handleBulkToggle(false)}
            onDeploy={handleDeploy}
            busy={busy}
            activeAction={activeAction}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 flex items-start justify-between gap-4"
          >
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
          <div
            role="status"
            className="mb-4 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 flex items-start justify-between gap-4"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => {
                if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
                setNotice(null)
              }}
              className="text-emerald-600 hover:text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {initialLoading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div
            className={`transition-opacity ${
              refreshing || activeAction === 'activate' || activeAction === 'deactivate'
                ? 'opacity-60'
                : 'opacity-100'
            }`}
          >
            <RulesTable
              rules={rules}
              onToggle={handleToggle}
              togglingIds={togglingIds}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
