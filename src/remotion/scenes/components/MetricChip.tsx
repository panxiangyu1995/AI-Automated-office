/**
 * Remotion ProductStory - MetricChip component
 */
import { palette, baseCardStyle } from '../styles'

export const MetricChip = ({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'navy' | 'green' | 'amber'
}) => {
  const color =
    tone === 'green' ? palette.green : tone === 'amber' ? palette.amber : palette.navy

  return (
    <div
      style={{
        ...baseCardStyle(0.82),
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '18px 22px',
        minWidth: 184,
      }}
    >
      <div style={{ fontSize: 18, color: palette.slate500, fontWeight: 600 }}>{label}</div>
      <div style={{ color, fontSize: 34, fontWeight: 800, letterSpacing: -0.8 }}>{value}</div>
    </div>
  )
}
