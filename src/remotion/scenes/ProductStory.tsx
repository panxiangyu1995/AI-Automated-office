import type { CSSProperties, ReactNode } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  FileSearch,
  FileText,
  MessageSquare,
  Package,
  PanelLeft,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react'
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const palette = {
  navy: '#1E3A5F',
  navySoft: '#315983',
  cyan: '#7DD3FC',
  teal: '#2DD4BF',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  white: '#FFFFFF',
}

const pageStyle: CSSProperties = {
  fontFamily: '"IBM Plex Sans","Microsoft YaHei UI","PingFang SC",sans-serif',
  color: palette.slate900,
}

const activityItems = [
  { label: '管理层', icon: Building2 },
  { label: '人事', icon: Users },
  { label: '审批', icon: ShieldCheck },
  { label: '销售', icon: Briefcase },
  { label: '财务', icon: CreditCard },
  { label: '仓储', icon: Warehouse },
]

const sidebarItems = [
  '今日工作台',
  '部门 AI 助手',
  '动态卡片看板',
  '审批与待办',
  '数据与模板',
  '企业消息中心',
]

const baseCardStyle = (opacity = 1): CSSProperties => ({
  background: `rgba(255,255,255,${opacity})`,
  border: `1px solid ${palette.slate200}`,
  borderRadius: 22,
  boxShadow: '0 25px 80px rgba(15,23,42,0.10)',
})

const appear = (frame: number, fps: number, delayFrames = 0, durationInFrames = 22) =>
  spring({
    frame: frame - delayFrames,
    fps,
    durationInFrames,
    config: { damping: 200 },
  })

const slideUp = (frame: number, fps: number, delayFrames = 0) =>
  interpolate(appear(frame, fps, delayFrames), [0, 1], [48, 0])

const fade = (frame: number, fps: number, delayFrames = 0) =>
  interpolate(appear(frame, fps, delayFrames), [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

const reveal = (
  frame: number,
  start: number,
  end: number,
  easing = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [start, end], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

const Background = () => {
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
          linear-gradient(135deg, #F8FBFF 0%, #EEF4FB 48%, #E8F0F8 100%)`,
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

const SceneTitle = ({
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

const MetricChip = ({
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

const ToolPill = ({
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

const ChatBubble = ({
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

const StatBar = ({
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
      <div
        style={{
          background: 'linear-gradient(180deg, #17314F 0%, #1E3A5F 100%)',
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.white,
            marginBottom: 8,
          }}
        >
          <PanelLeft size={24} />
        </div>
        {activityItems.map(({ label, icon: Icon }) => {
          const active = label === activityActive
          return (
            <div
              key={label}
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: active ? palette.white : 'rgba(255,255,255,0.08)',
                color: active ? palette.navy : palette.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 10px 30px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <Icon size={24} />
            </div>
          )
        })}
      </div>

      <div
        style={{
          background: 'rgba(248,250,252,0.96)',
          borderRight: `1px solid ${palette.slate200}`,
          padding: '26px 22px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ color: palette.slate500, fontSize: 16, fontWeight: 700, letterSpacing: 1.2 }}>
          SIDEBAR
        </div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: palette.slate900 }}>
          {sidebarTitle}
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sidebarItems.map((item, index) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 16,
                background: index === 1 ? 'rgba(30,58,95,0.08)' : palette.white,
                color: index === 1 ? palette.navy : palette.slate600,
                border: `1px solid ${index === 1 ? 'rgba(30,58,95,0.14)' : palette.slate200}`,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: index < 3 ? palette.teal : palette.slate300,
                }}
              />
              {item}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 'auto',
            borderRadius: 18,
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

      <div
        style={{
          background: 'rgba(255,255,255,0.90)',
          padding: '26px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: palette.slate500, fontSize: 16, fontWeight: 700, letterSpacing: 1.2 }}>
              WORKBENCH
            </div>
            <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>{workbenchTitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <MetricChip label="AI 响应" value="< 3s" tone="navy" />
            <MetricChip label="跨部门联动" value="实时" tone="green" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>{children}</div>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.96)',
          borderLeft: `1px solid ${palette.slate200}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 70,
            borderBottom: `1px solid ${palette.slate200}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 22px',
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: palette.navy,
              color: palette.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={20} />
          </div>
          AI 助手
        </div>
        <div
          style={{
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
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
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: 18,
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

const PositioningWorkbench = () => {
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
          { label: '审批', icon: ShieldCheck, color: palette.navySoft },
          { label: '销售', icon: Briefcase, color: palette.amber },
          { label: '财务', icon: CreditCard, color: palette.green },
        ].map(({ label, icon: Icon, color }, index) => {
          const opacity = fade(frame, fps, 28 + index * 5)
          const translateY = slideUp(frame, fps, 28 + index * 5)
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
                <Icon size={24} />
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

const SalesWorkbench = () => {
  const frame = useCurrentFrame()

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
        <div style={{ ...baseCardStyle(1), padding: 24 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>AI 对话驱动销售自动化</div>
          <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, lineHeight: 1.35 }}>
            问价、下单、通知仓库、同步经营数据，
            <br />
            不再靠销售手工串联。
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
            <ToolPill icon={<Briefcase size={18} />} text="生成订单" active />
            <ArrowRight size={20} color={palette.slate300} />
            <ToolPill icon={<Package size={18} />} text="通知仓储" active />
            <ArrowRight size={20} color={palette.slate300} />
            <ToolPill icon={<TrendingUp size={18} />} text="回写看板" active />
          </div>

          <div style={{ marginTop: 28, display: 'grid', gap: 18 }}>
            <StatBar label="自动处理率" value={92} color={palette.green} delayFrames={28} />
            <StatBar label="发货及时率" value={100} color={palette.navy} delayFrames={38} />
            <StatBar label="销售数据同步率" value={96} color={palette.teal} delayFrames={48} />
          </div>
        </div>

        <div style={{ ...baseCardStyle(1), padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>关键 AI 对话</div>
          <div
            style={{
              borderRadius: 20,
              padding: 18,
              background: 'rgba(30,58,95,0.07)',
              fontSize: 20,
              lineHeight: 1.6,
              fontWeight: 700,
              color: palette.slate800,
            }}
          >
            “客户确认买 3 台设备，生成订单并通知仓库发货，同时更新本月销售数据。”
          </div>
          <div
            style={{
              borderRadius: 20,
              padding: 18,
              background: palette.slate100,
              fontSize: 18,
              lineHeight: 1.7,
              color: palette.slate600,
            }}
          >
            AI 先拆解部门动作，再透明展示工具调用与结果，符合“透明可控”的 UX 铁律。
          </div>
        </div>
      </div>

      <div
        style={{
          ...baseCardStyle(1),
          padding: 22,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
          minHeight: 220,
        }}
      >
        {[
          {
            title: '销售订单',
            text: '订单已创建，客户 A，金额 126,000 元',
            icon: FileText,
            accent: palette.navy,
          },
          {
            title: '仓储任务',
            text: '仓库已收到发货指令，状态：待拣货',
            icon: Warehouse,
            accent: palette.amber,
          },
          {
            title: '经营看板',
            text: '本月销售额 +126,000，自动写回工作台卡片',
            icon: Activity,
            accent: palette.green,
          },
        ].map(({ title, text, icon: Icon, accent }, index) => {
          const progress = reveal(frame, 54 + index * 8, 84 + index * 8)
          return (
            <div
              key={title}
              style={{
                ...baseCardStyle(1),
                padding: 20,
                borderColor: `${accent}22`,
                transform: `scale(${0.96 + progress * 0.04})`,
                opacity: progress,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${accent}16`,
                  color: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: 10, fontSize: 18, lineHeight: 1.55, color: palette.slate600 }}>
                {text}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

const FinanceWorkbench = () => {
  const frame = useCurrentFrame()
  const scanProgress = reveal(frame, 36, 78)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.95fr', gap: 18 }}>
        <div style={{ ...baseCardStyle(1), padding: 24 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>财务 OCR + 台账自动化</div>
          <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, lineHeight: 1.35 }}>
            发票识别、台账生成、应收应付汇总，
            <br />
            让财务从重复录入中退出。
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <MetricChip label="识别准确率" value="98%" tone="green" />
            <MetricChip label="处理时长" value="30分钟" tone="amber" />
            <MetricChip label="原先耗时" value="2天" tone="navy" />
            <MetricChip label="台账生成" value="一键完成" tone="green" />
          </div>
        </div>

        <div style={{ ...baseCardStyle(1), padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>关键 AI 对话</div>
          <div
            style={{
              borderRadius: 20,
              padding: 18,
              background: 'rgba(30,58,95,0.07)',
              fontSize: 20,
              lineHeight: 1.6,
              fontWeight: 700,
              color: palette.slate800,
            }}
          >
            “帮我处理这个文件夹里的发票，自动生成台账，但所有金额写入前先给我确认。”
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <ToolPill icon={<ScanSearch size={18} />} text="OCR 识别" active />
            <ToolPill icon={<FileSearch size={18} />} text="字段核对" active />
            <ToolPill icon={<CheckCircle2 size={18} />} text="确认后写入" active />
          </div>
        </div>
      </div>

      <div style={{ ...baseCardStyle(1), padding: 24, display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 18 }}>
        <div
          style={{
            borderRadius: 22,
            border: `1px solid ${palette.slate200}`,
            background: 'linear-gradient(180deg, rgba(248,250,252,0.8), rgba(255,255,255,0.95))',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800 }}>
            <ScanSearch size={20} color={palette.navy} />
            OCR 批量识别进度
          </div>
          <div style={{ marginTop: 20, height: 16, borderRadius: 999, background: palette.slate100, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${scanProgress * 100}%`,
                background: 'linear-gradient(90deg, #1E3A5F 0%, #2DD4BF 100%)',
              }}
            />
          </div>
          <div style={{ marginTop: 16, color: palette.slate600, fontSize: 18 }}>
            已识别 {Math.round(15 * scanProgress)}/15 张发票，自动匹配抬头与科目。
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            ['供应商', '华东设备有限公司'],
            ['金额', '¥ 186,000'],
            ['状态', '待财务确认'],
            ['输出', '已生成台账草稿'],
          ].map(([label, value], index) => (
            <div
              key={label}
              style={{
                ...baseCardStyle(1),
                padding: 18,
                opacity: fade(frame, 30, 58 + index * 6),
                transform: `translateY(${slideUp(frame, 30, 58 + index * 6)}px)`,
              }}
            >
              <div style={{ fontSize: 17, color: palette.slate500, fontWeight: 700 }}>{label}</div>
              <div style={{ marginTop: 8, fontSize: 24, color: palette.slate900, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const ExecutiveWorkbench = () => {
  const frame = useCurrentFrame()
  const chartBars = [68, 84, 58, 92]

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricChip label="本月营收" value="¥ 326万" tone="navy" />
        <MetricChip label="待审批" value="12项" tone="amber" />
        <MetricChip label="库存预警" value="3项" tone="amber" />
        <MetricChip label="经营健康度" value="良好" tone="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 18 }}>
        <div style={{ ...baseCardStyle(1), padding: 24 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>跨部门经营驾驶舱</div>
          <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, lineHeight: 1.35 }}>
            老板不再追着人要报表，
            <br />
            而是在一个界面看全公司运行状态。
          </div>

          <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-end', gap: 18, height: 240 }}>
            {chartBars.map((value, index) => {
              const progress = reveal(frame, 28 + index * 6, 60 + index * 6)
              return (
                <div key={value} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '18px 18px 8px 8px',
                      background: index % 2 === 0 ? palette.navy : palette.teal,
                      height: `${value * progress * 2}px`,
                      minHeight: 12,
                    }}
                  />
                  <div style={{ fontSize: 16, color: palette.slate500, fontWeight: 700 }}>
                    {['销售', '财务', '仓储', '审批'][index]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ ...baseCardStyle(1), padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ color: palette.slate500, fontSize: 18, fontWeight: 800 }}>老板可以直接问 AI</div>
          {[
            '本月应收还有多少没有回款？',
            '哪些订单会影响库存预警？',
            '今天有哪些关键审批卡住了？',
          ].map((question, index) => (
            <div
              key={question}
              style={{
                borderRadius: 18,
                padding: '14px 16px',
                background: index === 0 ? 'rgba(30,58,95,0.07)' : palette.slate100,
                fontSize: 18,
                lineHeight: 1.55,
                color: palette.slate700,
                fontWeight: 700,
              }}
            >
              {question}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...baseCardStyle(1), padding: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          {
            title: '回款风险',
            text: '华南客户回款延迟 9 天，建议销售跟进。',
            color: palette.red,
          },
          {
            title: '审批瓶颈',
            text: '3 个采购审批停留超 24 小时，影响交付。',
            color: palette.amber,
          },
          {
            title: '库存联动',
            text: '2 个热销 SKU 库存偏低，建议仓储补货。',
            color: palette.green,
          },
        ].map(({ title, text, color }, index) => (
          <div
            key={title}
            style={{
              ...baseCardStyle(1),
              padding: 20,
              borderColor: `${color}22`,
              opacity: fade(frame, 30, 62 + index * 6),
              transform: `translateY(${slideUp(frame, 30, 62 + index * 6)}px)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color, fontWeight: 800, fontSize: 20 }}>
              <CheckCircle2 size={18} />
              {title}
            </div>
            <div style={{ marginTop: 12, color: palette.slate600, fontSize: 18, lineHeight: 1.6 }}>{text}</div>
          </div>
        ))}
      </div>
    </>
  )
}

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
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              padding: '12px 18px',
              background: 'rgba(30,58,95,0.08)',
              color: palette.navy,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            <Sparkles size={22} />
            AI-Automated-office
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 76,
              lineHeight: 1.04,
              letterSpacing: -2.2,
              fontWeight: 900,
              color: palette.slate900,
            }}
          >
            面向企业的 AI 办公系统
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 30,
              lineHeight: 1.5,
              color: palette.slate600,
              maxWidth: 1020,
              fontWeight: 500,
            }}
          >
            不只是把工具堆给企业，而是让 AI 直接进入部门工作流，自动联动销售、财务、审批、仓储和管理层视角。
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <ToolPill icon={<Bot size={18} />} text="AI 对话即入口" active />
            <ToolPill icon={<ArrowRight size={18} />} text="跨部门自动联动" active />
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
              marginTop: 22,
              fontSize: 28,
              lineHeight: 1.55,
              color: palette.slate600,
              fontWeight: 500,
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
