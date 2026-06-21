// Nhãn tiếng Việt + màu badge cho enum sự cố (Incident) khớp BE.
// IncidentType: Other=0, LostTicket=1, WrongPlateNumber=2, Overstay=3,
//               WrongZone=4, UnpaidVehicle=5, Damage=6
// IncidentStatus: Open=1, InProgress=2, Resolved=3, Cancelled=4

export const INCIDENT_TYPE = {
  0: { label: 'Khác', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
  1: { label: 'Mất vé', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  2: { label: 'Sai biển số', color: 'bg-orange-100 text-orange-700 ring-orange-600/20' },
  3: { label: 'Quá giờ', color: 'bg-rose-100 text-rose-700 ring-rose-600/20' },
  4: { label: 'Gửi sai khu vực', color: 'bg-violet-100 text-violet-700 ring-violet-600/20' },
  5: { label: 'Xe chưa thanh toán', color: 'bg-red-100 text-red-700 ring-red-600/20' },
  6: { label: 'Hư hỏng', color: 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-600/20' },
}

export const INCIDENT_TYPE_OPTIONS = [
  { value: 0, label: 'Khác' },
  { value: 1, label: 'Mất vé' },
  { value: 2, label: 'Sai biển số' },
  { value: 3, label: 'Quá giờ' },
  { value: 4, label: 'Gửi sai khu vực' },
  { value: 5, label: 'Xe chưa thanh toán' },
  { value: 6, label: 'Hư hỏng' },
]

export const INCIDENT_STATUS = {
  1: { label: 'Mới mở', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' },
  2: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700 ring-amber-600/20' },
  3: { label: 'Đã xử lý', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' },
  4: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 ring-slate-600/20' },
}

export const INCIDENT_STATUS_OPTIONS = [
  { value: 1, label: 'Mới mở' },
  { value: 2, label: 'Đang xử lý' },
  { value: 3, label: 'Đã xử lý' },
  { value: 4, label: 'Đã hủy' },
]
