import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getValidationRules, deployChanges } from '../api/salesforce'
import RulesTable from '../components/RulesTable'
import BulkActions from '../components/BulkActions'
import TableSkeleton from '../components/TableSkeleton'

const NOTICE_DISMISS_MS = 4000

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [originalRules, setOriginalRules] = useState([])
  const [pendingRules, setPendingRules] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
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

  const loadRules = useCallback(async ({ initial = false } = {}) => {
    if (initial) setInitialLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const data = await getValidationRules()
      setOriginalRules(data)
      setPendingRules(data.map((r) => ({ ...r })))
    } catch (err) {
      setError(err.message)
    } finally {
      if (initial) setInitialLoading(false)
      else setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadRules({ initial: true })
  }, [loadRules])

  const pendingChanges = useMemo(() => {
    const originalById = new Map(originalRules.map((r) => [r.id, r]))
    return pendingRules
      .filter((p) => {
        const o = originalById.get(p.id)
        return o && o.active !== p.active
      })
      .map(({ id, active }) => ({ id, active }))
  }, [originalRules, pendingRules])

  const pendingIds = useMemo(
    () => new Set(pendingChanges.map((c) => c.id)),
    [pendingChanges]
  )

  const handleToggle = (id, active) => {
    setPendingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active } : r))
    )
  }

  const handleSetAll = (active) => {
    setPendingRules((prev) => prev.map((r) => ({ ...r, active })))
  }

  const handleDiscard = () => {
    setPendingRules(originalRules.map((r) => ({ ...r })))
    setError(null)
  }

  const handleDeploy = async () => {
    if (pendingChanges.length === 0) return
    setActiveAction('deploy')
    setError(null)
    try {
      const result = await deployChanges(pendingChanges)
      if (result.failed?.length) {
        setError(
          `${result.failed.length} of ${result.total} rule(s) failed to deploy. Refresh and try again.`
        )
      } else {
        showNotice(
          `Deployed ${result.deployed} change${
            result.deployed === 1 ? '' : 's'
          } to Salesforce.`
        )
      }
      // Always refetch so the UI reflects what's actually in the org.
      await loadRules({ initial: false })
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

  const hasPending = pendingChanges.length > 0
  const busy = initialLoading || refreshing || activeAction !== null
  const activeCount = pendingRules.filter((r) => r.active).length

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
              {user?.displayName && (
                <span className="ml-2 text-slate-600">
                  Signed in as {user.displayName}
                </span>
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
            {initialLoading ? (
              'Loading rules…'
            ) : (
              <>
                {pendingRules.length} rule
                {pendingRules.length === 1 ? '' : 's'} • {activeCount} active
                {hasPending && (
                  <span className="ml-2 text-amber-700">
                    • {pendingChanges.length} unsaved change
                    {pendingChanges.length === 1 ? '' : 's'}
                  </span>
                )}
              </>
            )}
          </p>
          <BulkActions
            onRefresh={handleRefresh}
            onActivateAll={() => handleSetAll(true)}
            onDeactivateAll={() => handleSetAll(false)}
            onDiscard={handleDiscard}
            onDeploy={handleDeploy}
            busy={busy}
            hasPending={hasPending}
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
              refreshing || activeAction === 'deploy' ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <RulesTable
              rules={pendingRules}
              onToggle={handleToggle}
              pendingIds={pendingIds}
              disabled={activeAction === 'deploy'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
