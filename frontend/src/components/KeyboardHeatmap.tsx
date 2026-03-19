import type { KeymapStat } from '@/types/api'

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

const KEY_W = 44
const KEY_H = 44
const GAP = 4
const RADIUS = 8

// Cool → warm spectrum: blue → indigo → violet → rose
const COLORS = [
  { threshold: 0, color: '#e0e7ff' },    // indigo-100 — no errors
  { threshold: 0.02, color: '#a5b4fc' },  // indigo-300
  { threshold: 0.05, color: '#818cf8' },  // indigo-400
  { threshold: 0.1, color: '#8b5cf6' },   // violet-500
  { threshold: 0.2, color: '#ec4899' },   // pink-500
  { threshold: 0.35, color: '#f43f5e' },  // rose-500
]

const COLORS_DARK = [
  { threshold: 0, color: '#312e81' },     // indigo-900
  { threshold: 0.02, color: '#3730a3' },  // indigo-800
  { threshold: 0.05, color: '#4f46e5' },  // indigo-600
  { threshold: 0.1, color: '#7c3aed' },   // violet-600
  { threshold: 0.2, color: '#db2777' },   // pink-600
  { threshold: 0.35, color: '#e11d48' },  // rose-600
]

function getColor(rate: number, dark: boolean) {
  const palette = dark ? COLORS_DARK : COLORS
  let c = palette[0].color
  for (const step of palette) {
    if (rate >= step.threshold) c = step.color
  }
  return c
}

interface Props {
  data: KeymapStat[]
  dark?: boolean
}

export default function KeyboardHeatmap({ data, dark = false }: Props) {
  const lookup = new Map(data.map((d) => [d.key_char.toLowerCase(), d]))

  const rowOffsets = [0, 0.5, 1] // stagger in key units

  const totalW = 10 * KEY_W + 9 * GAP
  const totalH = 3 * KEY_H + 2 * GAP

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="w-full"
        role="img"
        aria-label="键位热力图"
      >
        {ROWS.map((row, ri) => {
          const offsetX = rowOffsets[ri] * (KEY_W + GAP)
          return row.map((key, ki) => {
            const stat = lookup.get(key)
            const errorRate = stat ? stat.error_rate : 0
            const fill = stat ? getColor(errorRate, dark) : (dark ? '#1e293b' : '#f1f5f9')
            const x = offsetX + ki * (KEY_W + GAP)
            const y = ri * (KEY_H + GAP)
            const textColor = dark ? '#e2e8f0' : '#334155'

            return (
              <g key={key}>
                <rect
                  x={x}
                  y={y}
                  width={KEY_W}
                  height={KEY_H}
                  rx={RADIUS}
                  fill={fill}
                  className="transition-colors duration-200"
                />
                <text
                  x={x + KEY_W / 2}
                  y={y + KEY_H / 2 - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize="14"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {key.toUpperCase()}
                </text>
                {stat && stat.total_hits > 0 && (
                  <text
                    x={x + KEY_W / 2}
                    y={y + KEY_H / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    fontSize="9"
                    opacity={0.6}
                    fontFamily="system-ui, sans-serif"
                  >
                    {(errorRate * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            )
          })
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>低错误率</span>
        <div className="flex gap-0.5">
          {(dark ? COLORS_DARK : COLORS).map((step, i) => (
            <div
              key={i}
              className="h-3 w-6 first:rounded-l last:rounded-r"
              style={{ backgroundColor: step.color }}
            />
          ))}
        </div>
        <span>高错误率</span>
      </div>
    </div>
  )
}
