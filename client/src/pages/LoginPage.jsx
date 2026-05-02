import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { isLoggedIn, loading, login, devMockLogin } = useAuth()
  const navigate = useNavigate()

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

  const handleMockLogin = () => {
    devMockLogin()
    navigate('/dashboard')
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

        <button
          type="button"
          onClick={login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
        >
          Connect to Salesforce
        </button>

        <button
          type="button"
          onClick={handleMockLogin}
          className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition text-sm"
        >
          Mock login (dev only)
        </button>

        <p className="mt-6 text-xs text-slate-400">
          The mock button bypasses OAuth so the UI is testable before the backend is ready.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
