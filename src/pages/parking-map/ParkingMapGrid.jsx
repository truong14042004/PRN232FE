import { motion } from 'framer-motion'
import { Car } from 'lucide-react'
import { SLOT_STATUS } from '../../lib/enums'
import { cn } from '../../lib/cn'

/**
 * Vẽ sơ đồ bãi đỗ bằng CSS Grid.
 * @param {object} map - FloorMapDto: { gridRows, gridCols, slots: MapSlotDto[] }
 * @param {string|null} highlightSlotId - slot vừa đổi trạng thái (để nháy hiệu ứng)
 * @param {(slot) => void} onSlotClick - click vào một ô
 */
export default function ParkingMapGrid({ map, highlightSlotId, onSlotClick }) {
  if (!map) return null

  const { gridRows, gridCols, slots = [] } = map

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(64px, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(64px, auto))`,
          minWidth: gridCols * 72,
        }}
      >
        {slots.map((slot) => {
          const meta = SLOT_STATUS[slot.status] || {}
          const occupied = slot.status === 2
          const isHighlight = highlightSlotId === slot.slotId
          // Chỉ đặt vị trí tường minh khi có dữ liệu hợp lệ; thiếu thì để grid tự sắp,
          // tránh giá trị "undefined / span 1" làm các ô đè lên nhau.
          const gridStyle = {}
          if (slot.column != null) gridStyle.gridColumn = `${slot.column} / span ${slot.colSpan || 1}`
          if (slot.row != null) gridStyle.gridRow = `${slot.row} / span ${slot.rowSpan || 1}`
          return (
            <motion.button
              key={slot.slotId}
              type="button"
              onClick={() => onSlotClick?.(slot)}
              initial={false}
              animate={
                isHighlight
                  ? { scale: [1, 1.08, 1], transition: { duration: 0.6 } }
                  : { scale: 1 }
              }
              style={gridStyle}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 p-2 text-center transition-colors',
                meta.map || 'bg-slate-50 border-slate-200',
                isHighlight && 'ring-4 ring-brand-400/40',
              )}
              title={`${slot.code}${slot.label ? ` · ${slot.label}` : ''} — ${meta.label || ''}`}
            >
              <span className="w-full truncate text-xs font-bold leading-none">{slot.code}</span>
              {occupied && slot.vehicle ? (
                <span className="flex max-w-full items-center gap-0.5 text-[10px] font-medium leading-tight">
                  <Car className="h-3 w-3 shrink-0" />
                  <span className="truncate">{slot.vehicle.plateNumber}</span>
                </span>
              ) : (
                <span className="w-full truncate text-[10px] leading-none opacity-70">{meta.label}</span>
              )}
              {occupied && slot.vehicle?.isMonthly && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
