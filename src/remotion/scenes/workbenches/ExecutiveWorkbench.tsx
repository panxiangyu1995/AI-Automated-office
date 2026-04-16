/**
 * Remotion ProductStory - ExecutiveWorkbench
 */
import { CheckCircle2 } from 'lucide-react'
import { palette, baseCardStyle } from '../styles'
import { fade, reveal, slideUp } from '../animations'
import { MetricChip } from '../components/MetricChip'
import { useCurrentFrame } from 'remotion'

export const ExecutiveWorkbench = () => {
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
          { title: '回款风险', text: '华南客户回款延迟 9 天，建议销售跟进。', color: palette.red },
          { title: '审批瓶颈', text: '3 个采购审批停留超 24 小时，影响交付。', color: palette.amber },
          { title: '库存联动', text: '2 个热销 SKU 库存偏低，建议仓储补货。', color: palette.green },
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
