/**
 * Remotion ProductStory - PositioningWorkbench
 */
import {
  Users, ArrowRight, Building2, Sparkles,
} from 'lucide-react'
import { palette, baseCardStyle } from '../styles'
import { fade, slideUp } from '../animations'
import { ToolPill } from '../components/ChatBubble'
import { useCurrentFrame, useVideoConfig } from 'remotion'

export const PositioningWorkbench = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 18,
        }}
      >
        <div
          style={{
            ...baseCardStyle(1),
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: palette.navy, fontWeight: 800 }}>
            <Sparkles size={20} />
            产品定位
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.3 }}>
            不是给企业一堆工具，
            <br />
            而是给企业一个 AI 办公系统。
          </div>
          <div style={{ fontSize: 20, color: palette.slate600, lineHeight: 1.65 }}>
            看企业有哪些部门，就开通哪些部门模块。每个部门都有专属 AI 助手，跨部门数据自动联动。
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ToolPill icon={<Users size={18} />} text="每部门专属 AI" active />
            <ToolPill icon={<ArrowRight size={18} />} text="跨部门联动" active />
            <ToolPill icon={<Building2 size={18} />} text="统一数据中台" active />
          </div>
        </div>

        <div
          style={{
            ...baseCardStyle(1),
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ color: palette.slate500, fontWeight: 800, fontSize: 18 }}>价值对比</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['钉钉 / 飞书', '工具集合'],
              ['AI-Automated-office', 'AI 办公系统'],
              ['部门各自运作', '统一数据流'],
              ['人工拼流程', 'AI 自动联动'],
            ].map(([left, right], index) => (
              <div
                key={left}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  background: index % 2 === 0 ? palette.slate100 : 'rgba(30,58,95,0.07)',
                }}
              >
                <div style={{ color: palette.slate500, fontSize: 16, fontWeight: 700 }}>{left}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 24,
                    fontWeight: 800,
                    color: index % 2 === 0 ? palette.slate900 : palette.navy,
                  }}
                >
                  {right}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 18,
        }}
      >
        {[
          { label: '人事', icon: Users, color: palette.teal },
          { label: '审批', icon: 'ShieldCheck' as const, color: palette.navySoft },
          { label: '销售', icon: 'Briefcase' as const, color: palette.amber },
          { label: '财务', icon: 'CreditCard' as const, color: palette.green },
        ].map(({ label, icon: Icon, color }, index) => {
          const opacity = fade(frame, fps, 28 + index * 5)
          const translateY = slideUp(frame, fps, 28 + index * 5)
          const IconComp = Icon as React.FC<{ size: number }>
          return (
            <div
              key={label}
              style={{
                ...baseCardStyle(1),
                opacity,
                transform: `translateY(${translateY}px)`,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: `${color}1A`,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComp size={24} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: 18, lineHeight: 1.55, color: palette.slate600 }}>
                AI 助手进入该部门场景，自动接住本部门流程与数据权限。
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
