import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ isAllowed, onUnauthorized, redirectPath = '/', children }) {
  useEffect(() => {
    if (!isAllowed && onUnauthorized) {
      onUnauthorized()
    }
  }, [isAllowed, onUnauthorized])

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute
