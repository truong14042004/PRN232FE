import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homePathForRoles } from '../../lib/navigation'
import DashboardPage from '../../pages/DashboardPage'

// Route index "/": Admin/FacilityManager xem Dashboard, các vai trò khác
// được điều hướng tới trang phù hợp với quyền của họ.
export default function HomeRoute() {
  const { user } = useAuth()
  const roles = user?.roles || []

  if (roles.includes('Admin') || roles.includes('FacilityManager')) {
    return <DashboardPage />
  }
  return <Navigate to={homePathForRoles(roles)} replace />
}
