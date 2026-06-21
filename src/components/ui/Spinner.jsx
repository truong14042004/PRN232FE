import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Spinner({ className, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <Loader2 className={cn('h-8 w-8 animate-spin text-brand-500', className)} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

export default Spinner
