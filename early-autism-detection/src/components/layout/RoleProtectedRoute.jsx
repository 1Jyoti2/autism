import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../lib/constants'
import { normalizeRole, getRoleDashboardRoute } from '../../lib/roles'

export default function RoleProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }

  const userRole = normalizeRole(user?.role)
  const normAllowed = allowedRoles.map(normalizeRole)

  if (normAllowed.length > 0 && !normAllowed.includes(userRole)) {
    // User role is not permitted for this route, redirect to their role dashboard
    const redirectPath = getRoleDashboardRoute(userRole)
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
