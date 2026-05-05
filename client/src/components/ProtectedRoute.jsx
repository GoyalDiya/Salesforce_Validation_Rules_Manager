import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Loading…
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
