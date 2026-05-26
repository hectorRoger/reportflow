import { progressColor } from '@/lib/utils'

interface Props {
  value: number
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ProgressBar({ value, size = 'md', showLabel = true }: Props) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-500 ${progressColor(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-9 text-right">{value}%</span>}
    </div>
  )
}
