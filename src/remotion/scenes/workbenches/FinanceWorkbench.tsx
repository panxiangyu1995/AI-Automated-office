/**
 * Remotion ProductStory - FinanceWorkbench
 */
import {
  ScanSearch, FileSearch, CheckCircle2,
} from 'lucide-react'
import { palette, baseCardStyle } from '../styles'
import { fade, reveal, slideUp } from '../animations'
import { MetricChip, ToolPill } from '../components'
import { useCurrentFrame } from 'remotion'

export const FinanceWorkbench = () => {
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
              borderRadius: 20, padding: 18,
              background: 'rgba(30,58,95,0.07)',
              fontSize: 20, lineHeight: 1.6, fontWeight: 700, color: palette.slate800,
            }}
          >
            "帮我处理这个文件夹里的发票，自动生成台账，但所有金额写入前先给我确认。"
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
                background: `linear-gradient(90deg, ${palette.navy} 0%, ${palette.teal} 100%)`,
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
