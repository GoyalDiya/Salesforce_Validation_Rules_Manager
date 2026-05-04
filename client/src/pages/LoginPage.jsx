import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { isLoggedIn, loading, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const err = params.get('auth_error')
    if (err) {
      setAuthError(err)
      navigate(location.pathname, { replace: true })
    }
  }, [location, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Loading…
      </div>
    )
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md text-center p-8 rounded-xl shadow bg-white border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Salesforce Validation Rules Manager
        </h1>
        <p className="text-slate-500 mb-6">
          Connect your Salesforce org to view and manage Account validation rules.
        </p>

        {authError && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 text-left">
            <strong className="block">Login failed</strong>
            <span>{authError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
        >
          Connect to Salesforce
        </button>
      </div>
    </div>
  )
}

export default LoginPage
