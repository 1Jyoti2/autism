import { useAuth } from '../../context/AuthContext'
import { normalizeRole, ROLES } from '../../lib/roles'
import ParentDashboard from './dashboards/ParentDashboard'
import DoctorDashboard from './dashboards/DoctorDashboard'
import CaretakerDashboard from './dashboards/CaretakerDashboard'
import AdminDashboard from './dashboards/AdminDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const normRole = normalizeRole(user?.role)

  switch (normRole) {
    case ROLES.DOCTOR:
      return <DoctorDashboard />
    case ROLES.CARETAKER:
      return <CaretakerDashboard />
    case ROLES.ADMIN:
      return <AdminDashboard />
    case ROLES.PARENT:
    default:
      return <ParentDashboard />
  }
}