/**
 * AgentTemplateSelector - Agent 模板选择组件
 *
 * Story: Subagent Template System
 *
 * 功能：
 * - 显示模板选择网格
 * - 模板预览
 * - 选择后自动填充配置
 *
 * 铁律合规：
 * - UX-01: 使用 Shadcn/ui 风格设计
 * - UX-02: 使用品牌色 var(--ao-button.background)
 */

import { useState } from 'react'
import { Bot, Users, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ==================== Types ====================

export type AgentTemplate = 'general' | 'specialist'

export interface AgentTemplateInfo {
  type: AgentTemplate
  name: string
  description: string
  icon: React.ReactNode
  mode: 'primary' | 'subagent'
  defaultRole: string
  suggestedSkills: string[]
  suggestedTools: string[]
  suggestedPermissions: Record<string, string>
}

// ==================== Template Configuration ====================

export const TEMPLATE_CONFIG: Record<AgentTemplate, AgentTemplateInfo> = {
  general: {
    type: 'general',
    name: '通用助手',
    description: '适用于日常办公咨询和跨部门协调',
    icon: <Bot size={24} />,
    mode: 'primary',
    defaultRole: '通用办公 AI 助手，负责日常对话、信息查询和跨部门协调',
    suggestedSkills: ['对话', '搜索', '总结', '协作'],
    suggestedTools: ['department_query', 'document_read'],
    suggestedPermissions: {
      department: 'ask',
      document: 'allow',
    },
  },
  specialist: {
    type: 'specialist',
    name: '领域专家',
    description: '专注特定业务领域的高级 Agent',
    icon: <Users size={24} />,
    mode: 'subagent',
    defaultRole: '业务领域专家，提供专业知识和深度分析',
    suggestedSkills: ['专业知识', '领域分析', '报告生成'],
    suggestedTools: ['full_department_access', 'approval_submit'],
    suggestedPermissions: {
      department: 'allow',
      approval: 'allow',
      document: 'allow',
      employee: 'allow',
      finance: 'allow',
      warehouse: 'allow',
    },
  },
}

// ==================== Template Card Component ====================

interface TemplateCardProps {
  template: AgentTemplateInfo
  selected: boolean
  onSelect: () => void
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all relative',
        'hover:border-brand-300 hover:shadow-md',
        selected && 'border-brand-500 ring-2 ring-brand-100'
      )}
      onClick={onSelect}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              template.type === 'general' ? 'bg-brand-100' : 'bg-purple-100'
            )}
          >
            <div
              className={cn(
                template.type === 'general' ? 'text-brand-600' : 'text-purple-600'
              )}
            >
              {template.icon}
            </div>
          </div>
          {selected && (
            <Badge className="absolute top-2 right-2 bg-brand-500">已选择</Badge>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 mt-3">{template.name}</h3>
        <p className="text-sm text-slate-500 mt-1">{template.description}</p>
        <div className="mt-3">
          <Badge variant="outline" className="text-xs">
            {template.mode === 'primary' ? '主 Agent' : '子 Agent'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Template Selector Component ====================

interface AgentTemplateSelectorProps {
  value: AgentTemplate | null
  onChange: (template: AgentTemplate) => void
  className?: string
}

export function AgentTemplateSelector({
  value,
  onChange,
  className,
}: AgentTemplateSelectorProps) {
  const [hoveredTemplate] = useState<AgentTemplate | null>(null)
  const displayTemplate = hoveredTemplate ? TEMPLATE_CONFIG[hoveredTemplate] : null

  return (
    <div className={cn('space-y-4', className)}>
      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Object.values(TEMPLATE_CONFIG).map(template => (
          <TemplateCard
            key={template.type}
            template={template}
            selected={value === template.type}
            onSelect={() => onChange(template.type)}
          />
        ))}
      </div>

      {/* Template Preview */}
      {displayTemplate && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-600" />
              <span className="text-sm font-medium text-slate-700">
                {displayTemplate.name} 推荐配置
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">角色：</span>
                <span className="text-slate-700">{displayTemplate.defaultRole}</span>
              </div>
              <div>
                <span className="text-slate-500">技能：</span>
                <span className="text-slate-700">
                  {displayTemplate.suggestedSkills.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">工具：</span>
                <span className="text-slate-700">
                  {displayTemplate.suggestedTools.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">权限：</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(displayTemplate.suggestedPermissions).map(
                    ([op, action]) => (
                      <Badge
                        key={op}
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          action === 'allow' && 'bg-green-100 text-green-700',
                          action === 'ask' && 'bg-yellow-100 text-yellow-700',
                          action === 'deny' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {op}: {action}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
