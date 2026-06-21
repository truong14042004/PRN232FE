// Các hàm định dạng dùng chung trên toàn ứng dụng.

const currencyFmt = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFmt = new Intl.NumberFormat('vi-VN')

export const formatCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return currencyFmt.format(Number(value))
}

export const formatNumber = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return numberFmt.format(Number(value))
}

export const formatPercent = (value, digits = 1) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(digits)}%`
}

// Định dạng ngày giờ kiểu Việt Nam. Trả về '—' nếu không hợp lệ.
export const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Chuyển một Date/chuỗi ISO sang giá trị dùng cho <input type="datetime-local">.
export const toDateTimeLocal = (value) => {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Chuyển một Date/chuỗi ISO sang giá trị dùng cho <input type="date">.
export const toDateInput = (value) => {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Rút gọn id Mongo dài cho dễ đọc trong bảng.
export const shortId = (id) => {
  if (!id) return '—'
  const s = String(id)
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}
