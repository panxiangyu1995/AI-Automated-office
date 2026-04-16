/**
 * Remotion ProductStory - Main compositions
 * Refactored: sub-components extracted to components/ and workbenches/
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bot, Briefcase, Building2, CreditCard,
  MessageSquare, PanelLeft, ShieldCheck, Warehouse,
} from 'lucide-react'
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { palette, baseCardStyle, pageStyle, activityItems, sidebarItems } from './styles'
import { Background } from './components/Background'
import { SceneTitle } from './components/SceneTitle'
import { MetricChip, ChatBubble, ToolPill } from './components'
import { PositioningWorkbench } from './workbenches/PositioningWorkbench'
import { SalesWorkbench } from './workbenches/SalesWorkbench'
import { FinanceWorkbench } from './workbenches/FinanceWorkbench'
import { ExecutiveWorkbench } from './workbenches/ExecutiveWorkbench'
import { fade, slideUp } from './animations'

// ==================== ShellLayout (kept inline — core layout) ====================

const activityIconMap: Record<string, LucideIcon> = {
  '管理层': Building2,
  '人事': Bot,
  '审批': ShieldCheck,
  '销售': Briefcase,
  '财务': CreditCard,
  '仓储': Warehouse,
}

const ShellLayout = ({
  activityActive,
  sidebarTitle,
  workbenchTitle,
  children,
}: {
  activityActive: string
  sidebarTitle: string
  workbenchTitle: string
  children: ReactNode
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 72,
        top: 300,
        bottom: 72,
        display: 'grid',
        gridTemplateColumns: '88px 300px 1fr 390px',
        ...baseCardStyle(0.8),
        overflow: 'hidden',
      }}
    >
      {/* Activity Bar */}
      <div
        style={{
          background: `linear-gradient(180deg, ${palette.navyDark} 0%, ${palette.navy} 100%)`,
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: palette.white, marginBottom: 8,
          }}
        >
          <PanelLeft size={24} />
        </div>
        {activityItems.map(({ label }) => {
          const active = label === activityActive
          const Icon = activityIconMap[label] || Building2
          return (
            <div
              key={label}
              style={{
                width: 58, height: 58, borderRadius: 18,
                background: active ? palette.white : 'rgba(255,255,255,0.08)',
                color: active ? palette.navy : palette.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 10px 30px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <Icon size={24} />
            </div>
          )
        })}
      </div>

      {/* Sidebar */}
      <div
        style={{
          background: 'rgba(248,250,252,0.96)',
          borderRight: `1px solid ${palette.slate200}`,
          padding: '26px 22px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ color: palette.slate500, fontSize: 16, fontWeight: 700, letterSpacing: 1.2 }}>SIDEBAR</div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: palette.slate900 }}>{sidebarTitle}</div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sidebarItems.map((item, index) => (
            <div
              key={item}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 16,
                background: index === 1 ? 'rgba(30,58,95,0.08)' : palette.white,
                color: index === 1 ? palette.navy : palette.slate600,
                border: `1px solid ${index === 1 ? 'rgba(30,58,95,0.14)' : palette.slate200}`,
                fontSize: 18, fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 10, height: 10, borderRadius: 999,
                  background: index < 3 ? palette.teal : palette.slate300,
                }}
              />
              {item}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 'auto', borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(30,58,95,0.08), rgba(125,211,252,0.14))',
            padding: 18,
          }}
        >
          <div style={{ color: palette.navy, fontSize: 18, fontWeight: 800 }}>AI 即入口</div>
          <div style={{ color: palette.slate600, fontSize: 16, lineHeight: 1.5, marginTop: 8 }}>
            先说需求，再让系统自动联动部门流程，而不是手动找菜单。
          </div>
        </div>
      </div>

      {/* Workbench */}
      <div
        style={{
          background: 'rgba(255,255,255,0.90)',
          padding: '26px 28px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: palette.slate500, fontSize: 16, fontWeight: 700, letterSpacing: 1.2 }}>WORKBENCH</div>
            <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>{workbenchTitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <MetricChip label="AI 响应" value="< 3s" tone="navy" />
            <MetricChip label="跨部门联动" value="实时" tone="green" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>{children}</div>
      </div>

      {/* AI Chat Panel */}
      <div
        style={{
          background: 'rgba(255,255,255,0.96)',
          borderLeft: `1px solid ${palette.slate200}`,
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 70,
            borderBottom: `1px solid ${palette.slate200}`,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 22px', fontSize: 24, fontWeight: 800,
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: palette.navy, color: palette.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bot size={20} />
          </div>
          AI 助手
        </div>
        <div
          style={{
            padding: 18,
            display: 'flex', flexDirection: 'column', gap: 16, flex: 1,
            background: 'linear-gradient(180deg, rgba(248,250,252,0.96), rgba(255,255,255,0.96))',
          }}
        >
          <ChatBubble
            role="user"
            text="把需求说出来，让系统自己拆解部门动作。"
            width={300}
            delayFrames={8}
          />
          <ChatBubble
            role="ai"
            text="我会调用销售、财务、审批、仓储等能力，并把过程透明展示给你。"
            width={300}
            delayFrames={20}
            toolRow={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <ToolPill icon={<Briefcase size={18} />} text="销售" active />
                <ToolPill icon={<CreditCard size={18} />} text="财务" active />
                <ToolPill icon={<ShieldCheck size={18} />} text="审批" />
                <ToolPill icon={<Warehouse size={18} />} text="仓储" />
              </div>
            }
          />
          <div style={{ marginTop: 'auto' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 14, borderRadius: 18,
                border: `1px solid ${palette.slate200}`,
                background: palette.white,
              }}
            >
              <MessageSquare size={20} color={palette.slate500} />
              <div style={{ color: palette.slate500, fontSize: 18 }}>继续输入业务目标...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Scene & Composition helpers ====================

const ProductScene = ({
  eyebrow,
  title,
  subtitle,
  activityActive,
  sidebarTitle,
  workbenchTitle,
  workbench,
}: {
  eyebrow: string
  title: string
  subtitle: string
  activityActive: string
  sidebarTitle: string
  workbenchTitle: string
  workbench: ReactNode
}) => {
  return (
    <AbsoluteFill style={pageStyle}>
      <Background />
      <SceneTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <ShellLayout
        activityActive={activityActive}
        sidebarTitle={sidebarTitle}
        workbenchTitle={workbenchTitle}
      >
        {workbench}
      </ShellLayout>
    </AbsoluteFill>
  )
}

const ShowreelTransition = ({ children }: { children: ReactNode }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = Math.min(fadeIn, fadeOut)
  const scale = interpolate(opacity, [0, 1], [1.02, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  )
}

const ShowreelIntro = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = fade(frame, fps, 0)
  const translateY = slideUp(frame, fps, 0)

  return (
    <AbsoluteFill style={pageStyle}>
      <Background />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 120px',
        }}
      >
        <div
          style={{
            ...baseCardStyle(0.92),
            width: 1320,
            padding: '54px 64px',
            opacity,
            transform: `translateY(${translateY}px)`,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))',
          }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              borderRadius: 999, padding: '12px 18px',
              background: 'rgba(30,58,95,0.08)',
              color: palette.navy, fontSize: 22, fontWeight: 800,
            }}
          >
            <Bot size={22} />
            AI-Automated-office
          </div>
          <div
            style={{
              marginTop: 28, fontSize: 76, lineHeight: 1.04,
              letterSpacing: -2.2, fontWeight: 900, color: palette.slate900,
            }}
          >
            面向企业的 AI 办公系统
          </div>
          <div
            style={{
              marginTop: 22, fontSize: 30, lineHeight: 1.5,
              color: palette.slate600, maxWidth: 1020, fontWeight: 500,
            }}
          >
            不只是把工具堆给企业，而是让 AI 直接进入部门工作流，自动联动销售、财务、审批、仓储和管理层视角。
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <ToolPill icon={<Bot size={18} />} text="AI 对话即入口" active />
            <ToolPill icon={<Briefcase size={18} />} text="跨部门自动联动" active />
            <ToolPill icon={<PanelLeft size={18} />} text="四栏桌面端界面" active />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const ShowreelOutro = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = fade(frame, fps, 0)
  const translateY = slideUp(frame, fps, 0)

  return (
    <AbsoluteFill style={pageStyle}>
      <Background />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 120px',
        }}
      >
        <div
          style={{
            ...baseCardStyle(0.94),
            width: 1220,
            padding: '52px 58px',
            opacity,
            transform: `translateY(${translateY}px)`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 62, lineHeight: 1.08, fontWeight: 900, letterSpacing: -1.6 }}>
            让企业先拥有一个能干活的 AI 办公系统，
            <br />
            再拥有真正被串起来的办公效率。
          </div>
          <div
            style={{
              marginTop: 22, fontSize: 28, lineHeight: 1.55,
              color: palette.slate600, fontWeight: 500,
            }}
          >
            适合向老板、部门负责人和关键客户同时展示产品定位、界面特色与业务价值。
          </div>
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <ToolPill icon={<Briefcase size={18} />} text="销售联动" active />
            <ToolPill icon={<CreditCard size={18} />} text="财务自动化" active />
            <ToolPill icon={<Building2 size={18} />} text="管理层驾驶舱" active />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ==================== Public Compositions ====================

export const ProductPositioningComposition = () => {
  return (
    <ProductScene
      eyebrow="产品定位篇"
      title="让客户第一眼就明白，这不是工具堆砌，而是一套 AI 办公系统。"
      subtitle="它能按企业部门结构快速落位，让 AI 直接进入日常办公流程，而不是停留在聊天框里。"
      activityActive="销售"
      sidebarTitle="部门化企业入口"
      workbenchTitle="AI-Automated-office"
      workbench={<PositioningWorkbench />}
    />
  )
}

export const SalesDepartmentFlowComposition = () => {
  return (
    <ProductScene
      eyebrow="销售联动篇"
      title="销售只说一句话，订单、仓储、看板就会自动接力。"
      subtitle="这段最适合对外展示我们的核心卖点：AI 不只是回答问题，而是真的把部门流程带起来。"
      activityActive="销售"
      sidebarTitle="销售部 / 自动化流程"
      workbenchTitle="订单联动工作台"
      workbench={<SalesWorkbench />}
    />
  )
}

export const FinanceAutomationComposition = () => {
  return (
    <ProductScene
      eyebrow="财务自动化篇"
      title="最容易让客户感知价值的，是把财务从重复录入里直接解放出来。"
      subtitle="发票识别、字段核对、确认后写入，一条链路让客户立刻看到时间成本和错误率一起下降。"
      activityActive="财务"
      sidebarTitle="财务部 / OCR 与台账"
      workbenchTitle="发票识别与确认中心"
      workbench={<FinanceWorkbench />}
    />
  )
}

export const ExecutiveCockpitComposition = () => {
  return (
    <ProductScene
      eyebrow="老板驾驶舱篇"
      title="老板打开系统，不是追报表，而是直接看见整家公司正在怎么运转。"
      subtitle="这段负责打动最终决策者，把跨部门数据联动、经营洞察和桌面端界面特色一次讲清。"
      activityActive="管理层"
      sidebarTitle="管理层 / 经营洞察"
      workbenchTitle="经营驾驶舱"
      workbench={<ExecutiveWorkbench />}
    />
  )
}

export const ProductShowreelComposition = () => {
  return (
    <AbsoluteFill style={pageStyle}>
      <Sequence from={0} durationInFrames={90}>
        <ShowreelTransition>
          <ShowreelIntro />
        </ShowreelTransition>
      </Sequence>
      <Sequence from={90} durationInFrames={240}>
        <ShowreelTransition>
          <ProductPositioningComposition />
        </ShowreelTransition>
      </Sequence>
      <Sequence from={330} durationInFrames={240}>
        <ShowreelTransition>
          <SalesDepartmentFlowComposition />
        </ShowreelTransition>
      </Sequence>
      <Sequence from={570} durationInFrames={240}>
        <ShowreelTransition>
          <FinanceAutomationComposition />
        </ShowreelTransition>
      </Sequence>
      <Sequence from={810} durationInFrames={240}>
        <ShowreelTransition>
          <ExecutiveCockpitComposition />
        </ShowreelTransition>
      </Sequence>
      <Sequence from={1050} durationInFrames={90}>
        <ShowreelTransition>
          <ShowreelOutro />
        </ShowreelTransition>
      </Sequence>
    </AbsoluteFill>
  )
}
