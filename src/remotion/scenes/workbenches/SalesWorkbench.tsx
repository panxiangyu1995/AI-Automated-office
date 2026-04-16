/**
 * Remotion ProductStory - SalesWorkbench
 */
import {
  ArrowRight, Briefcase, Package, TrendingUp,
  FileText, Warehouse, Activity,
} from 'lucide-react'
import { palette, baseCardStyle } from '../styles'
import { reveal } from '../animations'
import { ToolPill, StatBar } from '../components/ChatBubble'
import { useCurrentFrame } from 'remotion'

export const SalesWorkbench = () => {
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
            "客户确认买 3 台设备，生成订单并通知仓库发货，同时更新本月销售数据。"
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
            AI 先拆解部门动作，再透明展示工具调用与结果，符合"透明可控"的 UX 铁律。
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
          { title: '销售订单', text: '订单已创建，客户 A，金额 126,000 元', icon: FileText, accent: palette.navy },
          { title: '仓储任务', text: '仓库已收到发货指令，状态：待拣货', icon: Warehouse, accent: palette.amber },
          { title: '经营看板', text: '本月销售额 +126,000，自动写回工作台卡片', icon: Activity, accent: palette.green },
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
                  width: 48, height: 48, borderRadius: 14,
                  background: `${accent}16`, color: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 800 }}>{title}</div>
              <div style={{ marginTop: 10, fontSize: 18, lineHeight: 1.55, color: palette.slate600 }}>{text}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
