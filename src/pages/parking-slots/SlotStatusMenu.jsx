import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleDot, Check } from 'lucide-react'
import { SLOT_STATUS_OPTIONS, SLOT_STATUS } from '../../lib/enums'
import { cn } from '../../lib/cn'

// Menu nhỏ đổi nhanh trạng thái một chỗ đỗ. Không cho đổi sang "Đang đỗ" (2)
// vì trạng thái đó do hệ thống quản lý qua phiên gửi xe.
const SELECTABLE = SLOT_STATUS_OPTIONS.filter((o) => o.value !== 2)

export default function SlotStatusMenu({ slot, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
        title="Đổi trạng thái"
      >
        <CircleDot className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Đổi trạng thái
            </p>
            {SELECTABLE.map((opt) => {
              const active = slot.status === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setOpen(false)
                    if (!active) onChange(opt.value)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50',
                    active ? 'font-semibold text-brand-700' : 'text-slate-600',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', SLOT_STATUS[opt.value]?.dot)} />
                    {opt.label}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-brand-600" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
