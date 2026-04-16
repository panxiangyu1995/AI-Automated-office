/**
 * Remotion ProductStory - Background component
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { palette, pageStyle } from '../styles'

export const Background = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const drift = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        ...pageStyle,
        background: `radial-gradient(circle at 15% 10%, rgba(125,211,252,0.35), transparent 28%),
          radial-gradient(circle at 80% 20%, rgba(45,212,191,0.22), transparent 24%),
          linear-gradient(135deg, ${palette.bgA} 0%, ${palette.bgB} 48%, ${palette.bgC} 100%)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: 999,
          left: -120 + drift * 60,
          top: 720 - drift * 40,
          background:
            'radial-gradient(circle, rgba(30,58,95,0.12), rgba(30,58,95,0.02) 62%, transparent 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 460,
          height: 460,
          borderRadius: 999,
          right: -40 - drift * 50,
          top: -60 + drift * 50,
          background:
            'radial-gradient(circle, rgba(34,197,94,0.14), rgba(34,197,94,0.03) 60%, transparent 72%)',
        }}
      />
    </AbsoluteFill>
  )
}
