/**
 * Remotion ProductStory - ChatBubble and ToolPill components
 */
import type { ReactNode } from 'react'
import { Bot } from 'lucide-react'
import { palette, baseCardStyle } from '../styles'
import { fade, slideUp, reveal } from '../animations'
import { useCurrentFrame, useVideoConfig } from 'remotion'

export const ToolPill = ({
  icon,
  text,
  active,
}: {
  icon: ReactNode
  text: string
  active?: boolean
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 999,
      border: `1px solid ${active ? 'rgba(30,58,95,0.28)' : palette.slate200}`,
      background: active ? 'rgba(30,58,95,0.08)' : palette.white,
      color: active ? palette.navy : palette.slate600,
      fontSize: 18,
      fontWeight: 700,
      boxShadow: active ? '0 12px 30px rgba(30,58,95,0.12)' : 'none',
    }}
  >
    {icon}
    {text}
  </div>
)

export const ChatBubble = ({
  role,
  text,
  width,
  delayFrames,
  toolRow,
}: {
  role: 'user' | 'ai'
  text: string
  width: number
  delayFrames: number
  toolRow?: ReactNode
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = fade(frame, fps, delayFrames)
  const translateY = slideUp(frame, fps, delayFrames)
  const isUser = role === 'user'

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: width,
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {!isUser ? (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: palette.navy,
              color: palette.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bot size={22} />
          </div>
        ) : null}
        <div
          style={{
            ...baseCardStyle(1),
            background: isUser ? palette.navy : palette.white,
            color: isUser ? palette.white : palette.slate800,
            padding: '18px 22px',
            borderRadius: isUser ? '24px 24px 8px 24px' : '24px 24px 24px 8px',
            boxShadow: isUser
              ? '0 18px 40px rgba(30,58,95,0.20)'
              : '0 20px 50px rgba(15,23,42,0.08)',
          }}
        >
          <div style={{ fontSize: 22, lineHeight: 1.5, fontWeight: 600 }}>{text}</div>
          {toolRow ? <div style={{ marginTop: 16 }}>{toolRow}</div> : null}
        </div>
      </div>
    </div>
  )
}

export const StatBar = ({
  label,
  value,
  color,
  delayFrames,
}: {
  label: string
  value: number
  color: string
  delayFrames: number
}) => {
  const frame = useCurrentFrame()
  const progress = reveal(frame, delayFrames, delayFrames + 28)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        <span style={{ color: palette.slate600 }}>{label}</span>
        <span style={{ color: palette.slate900 }}>{value}%</span>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 999,
          background: palette.slate100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value * progress}%`,
            height: '100%',
            borderRadius: 999,
            background: color,
          }}
        />
      </div>
    </div>
  )
}
