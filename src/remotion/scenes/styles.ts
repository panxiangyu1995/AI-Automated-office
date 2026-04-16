/**
 * Remotion ProductStory - Styles and palette constants
 */
import type { CSSProperties } from 'react'

export const palette = {
  navy: '#1E3A5F',
  navyDark: '#17314F',
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
  bgA: '#F8FBFF',
  bgB: '#EEF4FB',
  bgC: '#E8F0F8',
}

export const pageStyle: CSSProperties = {
  fontFamily: '"IBM Plex Sans","Microsoft YaHei UI","PingFang SC",sans-serif',
  color: palette.slate900,
}

export const baseCardStyle = (opacity = 1): CSSProperties => ({
  background: `rgba(255,255,255,${opacity})`,
  border: `1px solid ${palette.slate200}`,
  borderRadius: 22,
  boxShadow: '0 25px 80px rgba(15,23,42,0.10)',
})

export const activityItems = [
  { label: '管理层', icon: 'Building2' as const },
  { label: '人事', icon: 'Users' as const },
  { label: '审批', icon: 'ShieldCheck' as const },
  { label: '销售', icon: 'Briefcase' as const },
  { label: '财务', icon: 'CreditCard' as const },
  { label: '仓储', icon: 'Warehouse' as const },
]

export const sidebarItems = [
  '今日工作台',
  '部门 AI 助手',
  '动态卡片看板',
  '审批与待办',
  '数据与模板',
  '企业消息中心',
]
