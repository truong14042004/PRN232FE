import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomeRoute from './components/layout/HomeRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage'
import FeePoliciesPage from './pages/fee-policies/FeePoliciesPage'
import ReportsPage from './pages/reports/ReportsPage'
import OptimizationPage from './pages/optimization/OptimizationPage'
import UsersPage from './pages/users/UsersPage'
import BuildingsPage from './pages/buildings/BuildingsPage'
import VehicleTypesPage from './pages/vehicle-types/VehicleTypesPage'
import FloorsPage from './pages/floors/FloorsPage'
import ZonesPage from './pages/zones/ZonesPage'
import GatesPage from './pages/gates/GatesPage'
import VehiclesPage from './pages/vehicles/VehiclesPage'
import ReservationsPage from './pages/reservations/ReservationsPage'
import ParkingSessionsPage from './pages/sessions/ParkingSessionsPage'
import ParkingSlotsPage from './pages/parking-slots/ParkingSlotsPage'
import ParkingMapPage from './pages/parking-map/ParkingMapPage'
import MySessionsPage from './pages/driver/MySessionsPage'
import MyVehiclesPage from './pages/driver/MyVehiclesPage'
import LotInfoPage from './pages/driver/LotInfoPage'
import FeedbackPage from './pages/driver/FeedbackPage'
import FeedbackManagementPage from './pages/feedback/FeedbackManagementPage'
import ForbiddenPage from './pages/ForbiddenPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Trang công khai */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Khu vực cần đăng nhập */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <ProtectedRoute>
              <HomeRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parking-map"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <ParkingMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parking-slots"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <ParkingSlotsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff']}>
              <SubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-policies"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <FeePoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buildings"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <BuildingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-types"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <VehicleTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/floors"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <FloorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zones"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <ZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gates"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <GatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff']}>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <ReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff']}>
              <ParkingSessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-sessions"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <MySessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-vehicles"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <MyVehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lot-info"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <LotInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/optimization"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager']}>
              <OptimizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback-management"
          element={
            <ProtectedRoute roles={['Admin', 'FacilityManager', 'ParkingStaff']}>
              <FeedbackManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['Admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Bắt mọi đường dẫn còn lại */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
