/**
 * Remotion ProductStory - SceneTitle component
 */
import { Sparkles } from 'lucide-react'
import { palette } from '../styles'
import { fade, slideUp } from '../animations'
import { useCurrentFrame, useVideoConfig } from 'remotion'

export const SceneTitle = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = fade(frame, fps, 0)
  const translateY = slideUp(frame, fps, 0)

  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        top: 64,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(30,58,95,0.10)',
          color: palette.navy,
          borderRadius: 999,
          padding: '10px 18px',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        <Sparkles size={22} />
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 64,
          lineHeight: 1.06,
          fontWeight: 800,
          marginTop: 22,
          maxWidth: 880,
          letterSpacing: -1.8,
          color: palette.slate900,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 18,
          maxWidth: 900,
          color: palette.slate600,
          fontSize: 28,
          lineHeight: 1.45,
          fontWeight: 500,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
