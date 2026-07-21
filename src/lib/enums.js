// Maps backend integer enums to Vietnamese labels + badge color tokens.

export const ROLES = {
  Admin: 'Admin',
  FacilityManager: 'FacilityManager',
  ParkingStaff: 'ParkingStaff',
  Driver: 'Driver',
}

export const ROLE_LABELS = {
  Admin: 'Quản trị viên',
  FacilityManager: 'Quản lý cơ sở',
  ParkingStaff: 'Nhân viên bãi',
  Driver: 'Tài xế',
}

export const ROLE_BADGE = {
  Admin: 'bg-purple-100 text-purple-700 ring-purple-600/20',
  FacilityManager: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  ParkingStaff: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  Driver: 'bg-slate-100 text-slate-700 ring-slate-600/20',
}

// PaymentMethod: Cash=1, Card=2, EWallet=3, Mock=4
export const PAYMENT_METHOD = {
  1: { label: 'Tiền mặt', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  2: { label: 'Thẻ', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  3: { label: 'Ví điện tử', color: 'bg-violet-100 text-violet-700 ring-violet-600/20' },
  4: { label: 'Thử nghiệm', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: 1, label: 'Tiền mặt' },
  { value: 2, label: 'Thẻ' },
  { value: 3, label: 'Ví điện tử' },
  { value: 4, label: 'Thử nghiệm' },
]

// PaymentStatus: Pending=1, Paid=2, Failed=3, Refunded=4, Cancelled=5
export const PAYMENT_STATUS = {
  1: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  2: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  3: { label: 'Thất bại', color: 'bg-red-100 text-red-700 ring-red-600/20' },
  4: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  5: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
}

export const PAYMENT_STATUS_OPTIONS = [
  { value: 1, label: 'Chờ thanh toán' },
  { value: 2, label: 'Đã thanh toán' },
  { value: 3, label: 'Thất bại' },
  { value: 4, label: 'Đã hoàn tiền' },
  { value: 5, label: 'Đã hủy' },
]

// PricingType: PerTurn=1, Hourly=2, Daily=3, Monthly=4
export const PRICING_TYPE = {
  1: { label: 'Theo lượt' },
  2: { label: 'Theo giờ' },
  3: { label: 'Theo ngày' },
  4: { label: 'Theo tháng' },
}

export const PRICING_TYPE_OPTIONS = [
  { value: 1, label: 'Theo lượt' },
  { value: 2, label: 'Theo giờ' },
  { value: 3, label: 'Theo ngày' },
  { value: 4, label: 'Theo tháng' },
]

// SubscriptionStatus: Active=1, Expired=2, Suspended=3, Cancelled=4, PendingApproval=5
export const SUBSCRIPTION_STATUS = {
  1: { label: 'Đang hiệu lực', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  2: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
  3: { label: 'Tạm ngưng', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  4: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 ring-red-600/20' },
  5: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20' },
}

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 1, label: 'Đang hiệu lực' },
  { value: 2, label: 'Hết hạn' },
  { value: 3, label: 'Tạm ngưng' },
  { value: 4, label: 'Đã hủy' },
  { value: 5, label: 'Chờ duyệt' },
]

// ===== Parking service enums =====

// SlotStatus: Available=1, Occupied=2, Reserved=3, Maintenance=4, Locked=5
export const SLOT_STATUS = {
  1: {
    label: 'Còn trống',
    color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    // màu nền cho ô trên sơ đồ bãi
    map: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  2: {
    label: 'Đang đỗ',
    color: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    map: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
    dot: 'bg-blue-500',
  },
  3: {
    label: 'Đã đặt',
    color: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    map: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100',
    dot: 'bg-amber-500',
  },
  4: {
    label: 'Bảo trì',
    color: 'bg-red-100 text-red-700 ring-red-600/20',
    map: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100',
    dot: 'bg-red-500',
  },
  5: {
    label: 'Đã khóa',
    color: 'bg-slate-200 text-slate-700 ring-slate-600/20',
    map: 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200',
    dot: 'bg-slate-500',
  },
}

export const SLOT_STATUS_OPTIONS = [
  { value: 1, label: 'Còn trống' },
  { value: 2, label: 'Đang đỗ' },
  { value: 3, label: 'Đã đặt' },
  { value: 4, label: 'Bảo trì' },
  { value: 5, label: 'Đã khóa' },
]

// ParkingSessionStatus: Active=1, Completed=2, Cancelled=3, LostTicket=4, Exception=5
export const SESSION_STATUS = {
  1: { label: 'Đang gửi', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  2: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  3: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
  4: { label: 'Mất vé', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  5: { label: 'Ngoại lệ', color: 'bg-red-100 text-red-700 ring-red-600/20' },
}

export const SESSION_STATUS_OPTIONS = [
  { value: 1, label: 'Đang gửi' },
  { value: 2, label: 'Hoàn tất' },
  { value: 3, label: 'Đã hủy' },
  { value: 4, label: 'Mất vé' },
  { value: 5, label: 'Ngoại lệ' },
]

// ReservationStatus: Pending=1, Confirmed=2, CheckedIn=3, Cancelled=4, Expired=5, Completed=6
export const RESERVATION_STATUS = {
  1: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  2: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  3: { label: 'Đã vào bãi', color: 'bg-violet-100 text-violet-700 ring-violet-600/20' },
  4: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
  5: { label: 'Hết hạn', color: 'bg-red-100 text-red-700 ring-red-600/20' },
  6: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
}

export const RESERVATION_STATUS_OPTIONS = [
  { value: 1, label: 'Chờ xác nhận' },
  { value: 2, label: 'Đã xác nhận' },
  { value: 3, label: 'Đã vào bãi' },
  { value: 4, label: 'Đã hủy' },
  { value: 5, label: 'Hết hạn' },
  { value: 6, label: 'Hoàn tất' },
]

// GateType: Entry=1, Exit=2, Both=3
export const GATE_TYPE = {
  1: { label: 'Cổng vào', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  2: { label: 'Cổng ra', color: 'bg-rose-100 text-rose-700 ring-rose-600/20' },
  3: { label: 'Hai chiều', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
}

export const GATE_TYPE_OPTIONS = [
  { value: 1, label: 'Cổng vào' },
  { value: 2, label: 'Cổng ra' },
  { value: 3, label: 'Hai chiều' },
]

// FeedbackStatus: New=1, Reviewed=2, Resolved=3, Closed=4
export const FEEDBACK_STATUS = {
  1: { label: 'Mới', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  2: { label: 'Đã xem', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  3: { label: 'Đã xử lý', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  4: { label: 'Đã đóng', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
}

// FeedbackType: LostTicket=1, WrongFee=2, HardToFind=3, SlotOccupied=4, Other=5
export const FEEDBACK_TYPE = {
  1: 'Mất thẻ xe',
  2: 'Sai phí',
  3: 'Khó tìm xe',
  4: 'Slot bị chiếm',
  5: 'Vấn đề khác',
}

export const FEEDBACK_TYPE_OPTIONS = [
  { value: 1, label: 'Mất thẻ xe' },
  { value: 2, label: 'Sai phí' },
  { value: 3, label: 'Khó tìm xe' },
  { value: 4, label: 'Slot bị chiếm' },
  { value: 5, label: 'Vấn đề khác' },
]
