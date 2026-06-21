import { cn } from '../../lib/cn'

// A small pill. Pass `color` as Tailwind classes (bg/text/ring) from the enum maps.
export default function Badge({ color, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        color || 'bg-slate-100 text-slate-700 ring-slate-600/20',
        className,
      )}
    >
      {children}
    </span>
  )
}
