import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Validation Rules</h1>
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

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center text-slate-400">
          Rules table will appear here.
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
