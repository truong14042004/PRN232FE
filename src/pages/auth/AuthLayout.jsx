import { motion } from 'framer-motion'
import { Car, ShieldCheck, BarChart3, CreditCard } from 'lucide-react'

const FEATURES = [
  { icon: Car, text: 'Quản lý ra/vào và vị trí đỗ xe theo thời gian thực' },
  { icon: CreditCard, text: 'Thanh toán linh hoạt, đối soát ca trực rõ ràng' },
  { icon: BarChart3, text: 'Báo cáo doanh thu và công suất bãi trực quan' },
]

// Khung nền chung cho các trang đăng nhập / đăng ký.
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Cột thương hiệu (ẩn trên mobile) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex">
        {/* Các khối sáng nền động */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-24 -right-10 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Car className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Parking Manager</p>
              <p className="text-sm text-brand-100">Hệ thống quản lý bãi đỗ xe</p>
            </div>
          </div>

          <div className="space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-md text-4xl font-bold leading-tight tracking-tight text-balance"
            >
              Vận hành bãi đỗ xe thông minh, mượt mà từ cổng vào tới thanh toán.
            </motion.h1>

            <div className="space-y-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-brand-50">{f.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-100">
            <ShieldCheck className="h-4 w-4" />
            Bảo mật với JWT &amp; phân quyền theo vai trò
          </div>
        </div>
      </div>

      {/* Cột form */}
      <div className="flex w-full items-center justify-center px-4 py-12 sm:px-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
