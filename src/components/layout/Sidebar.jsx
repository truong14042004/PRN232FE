import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ScrollText,
  CalendarClock,
  BarChart3,
  Sparkles,
  Car,
  X,
  Map,
  LogIn,
  CalendarCheck,
  Building2,
  Tags,
  Layers,
  Grid3x3,
  DoorOpen,
  SquareParking,
  Ticket,
  Info,
  MessageSquare,
  Wallet,
  AlertOctagon,
  Shield,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'

// Điều hướng được chia thành các nhóm. Mỗi mục khai báo role được phép xem.
const ALL = ['Admin', 'FacilityManager', 'ParkingStaff', 'Driver']
const STAFF = ['Admin', 'FacilityManager', 'ParkingStaff']
const MANAGER = ['Admin', 'FacilityManager']
const DRIVER = ['Driver']

const NAV_GROUPS = [
  {
    items: [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: MANAGER, end: true },
    ],
  },
  {
    title: 'Cá nhân',
    items: [
      { to: '/my-sessions', label: 'Lượt gửi của tôi', icon: Ticket, roles: DRIVER },
      { to: '/my-subscriptions', label: 'Vé tháng của tôi', icon: CalendarClock, roles: DRIVER },
      { to: '/my-payments', label: 'Thanh toán của tôi', icon: Wallet, roles: DRIVER },
      { to: '/my-vehicles', label: 'Xe của tôi', icon: Car, roles: DRIVER },
      { to: '/lot-info', label: 'Thông tin bãi', icon: Info, roles: DRIVER },
      { to: '/feedback', label: 'Phản hồi', icon: MessageSquare, roles: DRIVER },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { to: '/parking-map', label: 'Sơ đồ bãi', icon: Map, roles: ALL },
      { to: '/sessions', label: 'Phiên gửi xe', icon: LogIn, roles: STAFF },
      { to: '/reservations', label: 'Đặt chỗ', icon: CalendarCheck, roles: ALL },
      { to: '/payments', label: 'Thanh toán', icon: CreditCard, roles: STAFF },
      { to: '/incidents', label: 'Sự cố', icon: AlertOctagon, roles: STAFF },
      { to: '/feedback-management', label: 'Quản lý phản hồi', icon: MessageSquare, roles: STAFF },
    ],
  },
  {
    title: 'Khách hàng',
    items: [
      { to: '/vehicles', label: 'Phương tiện', icon: Car, roles: STAFF },
      { to: '/subscriptions', label: 'Vé tháng', icon: CalendarClock, roles: STAFF },
    ],
  },
  {
    title: 'Cấu hình',
    items: [
      { to: '/buildings', label: 'Tòa nhà', icon: Building2, roles: MANAGER },
      { to: '/vehicle-types', label: 'Loại xe', icon: Tags, roles: MANAGER },
      { to: '/floors', label: 'Tầng', icon: Layers, roles: MANAGER },
      { to: '/zones', label: 'Khu vực', icon: Grid3x3, roles: MANAGER },
      { to: '/gates', label: 'Cổng', icon: DoorOpen, roles: MANAGER },
      { to: '/parking-slots', label: 'Chỗ đỗ', icon: SquareParking, roles: MANAGER },
      { to: '/fee-policies', label: 'Chính sách phí', icon: ScrollText, roles: MANAGER },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { to: '/reports', label: 'Báo cáo', icon: BarChart3, roles: MANAGER },
      { to: '/optimization', label: 'Tối ưu bãi xe', icon: Sparkles, roles: MANAGER },
      { to: '/users', label: 'Người dùng', icon: Users, roles: ['Admin'] },
      { to: '/roles', label: 'Vai trò', icon: Shield, roles: ['Admin'] },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { hasRole } = useAuth()

  // Lọc mục theo quyền, bỏ nhóm rỗng.
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => hasRole(...item.roles)),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      {/* Lớp phủ trên mobile */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/70 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
              <Car className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-slate-900">Parking</p>
              <p className="text-xs font-medium text-slate-400">Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => (
            <div key={group.title || gi}>
              {group.title && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
                          />
                        )}
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors',
                            isActive
                              ? 'text-brand-600'
                              : 'text-slate-400 group-hover:text-slate-600',
                          )}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200/70 p-4">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Parking Manager
          </p>
        </div>
      </aside>
    </>
  )
}
