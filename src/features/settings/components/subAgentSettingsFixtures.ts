export type SharedSubAgentTemplate =
  | 'general'
  | 'specialist'
  | 'analyst'
  | 'coordinator'

export interface SharedSubAgentOption {
  id: string
  name: string
  template: SharedSubAgentTemplate
  enabled: boolean
  description: string
  defaultRole: string
  suggestedSkills: string[]
  suggestedTools: string[]
  suggestedMcpTools: string[]
  suggestedPermissions: string[]
  createdAt: string
  updatedAt: string
  lastUsed?: string
  usageCount: number
}

export interface SharedMcpToolOption {
  id: string
  name: string
  description: string
  category: 'resource' | 'knowledge' | 'workspace' | 'message'
}

export interface SharedSkillOption {
  id: string
  name: string
  description: string
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  source: 'platform_builtin' | 'department_builtin' | 'user_installed'
}

export type SharedSkillSource = SharedSkillOption['source']

export interface SharedDepartmentOption {
  id: string
  name: string
}

export interface SharedKnowledgeBaseOption {
  id: string
  name: string
  description: string
}

export const SHARED_SKILL_SOURCE_META: Record<
  SharedSkillSource,
  { label: string; shortLabel: string; className: string; description: string }
> = {
  platform_builtin: {
    label: '平台内置 Skills',
    shortLabel: '平台内置',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: '平台默认提供，跨部门复用。',
  },
  department_builtin: {
    label: '部门内置 Skills',
    shortLabel: '部门内置',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    description: '随部门能力包交付，受部门边界约束。',
  },
  user_installed: {
    label: '用户安装 Skills',
    shortLabel: '用户安装',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    description: '由当前用户在权限范围内安装或启用。',
  },
}

export const SHARED_SKILL_SOURCE_ORDER: SharedSkillSource[] = [
  'platform_builtin',
  'department_builtin',
  'user_installed',
]

export const SETTINGS_SUB_AGENT_OPTIONS: SharedSubAgentOption[] = [
  {
    id: 'subagent-001',
    name: '文档起草助手',
    template: 'specialist',
    enabled: true,
    description: '负责根据需求、历史资料和模板生成候选业务文档内容。',
    defaultRole: '负责把任务目标整理为候选文档结构、章节草稿和可审阅文本。',
    suggestedSkills: ['document-draft', 'structure-extract', 'template-abstract'],
    suggestedTools: ['file_read', 'document_parse', 'workspace_stage_change'],
    suggestedMcpTools: ['mcp_project_docs', 'mcp_bid_archive'],
    suggestedPermissions: ['resource.read', 'workspace.stage', 'template.read'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-24T10:30:00Z',
    lastUsed: '2026-03-26T09:40:00Z',
    usageCount: 1184,
  },
  {
    id: 'subagent-002',
    name: '资料整理助手',
    template: 'general',
    enabled: true,
    description: '负责接入本地与云端资料，做抽取、清洗、归档和引用准备。',
    defaultRole: '负责收集任务所需资料，整理输入资产并输出结构化上下文。',
    suggestedSkills: ['resource-intake', 'knowledge-summarize-submit', 'cross-department-brief'],
    suggestedTools: ['file_read', 'http_request', 'document_convert'],
    suggestedMcpTools: ['mcp_cloud_drive', 'mcp_message_hub'],
    suggestedPermissions: ['resource.read', 'resource.upload', 'knowledge.draft'],
    createdAt: '2026-01-28T09:20:00Z',
    updatedAt: '2026-03-25T15:10:00Z',
    lastUsed: '2026-03-26T08:55:00Z',
    usageCount: 907,
  },
  {
    id: 'subagent-003',
    name: '规则校验助手',
    template: 'analyst',
    enabled: true,
    description: '负责做格式、字段、合规项和风险提示校验。',
    defaultRole: '负责校验内容是否符合模板、权限边界和业务规则，并给出修正建议。',
    suggestedSkills: ['policy-check', 'structure-extract', 'knowledge-summarize-submit'],
    suggestedTools: ['knowledge_query', 'document_parse', 'workspace_stage_change'],
    suggestedMcpTools: ['mcp_policy_knowledge', 'mcp_workspace_docs'],
    suggestedPermissions: ['knowledge.read', 'workspace.stage', 'policy.read'],
    createdAt: '2026-02-11T14:30:00Z',
    updatedAt: '2026-03-25T11:20:00Z',
    lastUsed: '2026-03-25T18:10:00Z',
    usageCount: 643,
  },
  {
    id: 'subagent-004',
    name: '协作协调助手',
    template: 'coordinator',
    enabled: false,
    description: '负责跨部门消息协作、任务分派和摘要回传。',
    defaultRole: '负责协调跨部门信息收集、消息发送和协作摘要生成。',
    suggestedSkills: ['cross-department-brief', 'meeting-followup-summary', 'knowledge-summarize-submit'],
    suggestedTools: ['agent_delegate', 'message_send', 'workspace_stage_change'],
    suggestedMcpTools: ['mcp_message_hub', 'mcp_approval_feed'],
    suggestedPermissions: ['message.send', 'agent.delegate', 'workspace.stage'],
    createdAt: '2026-02-23T11:00:00Z',
    updatedAt: '2026-03-20T09:30:00Z',
    usageCount: 204,
  },
]

export const SETTINGS_MCP_TOOLS: SharedMcpToolOption[] = [
  {
    id: 'mcp_cloud_drive',
    name: '云端资料盘',
    description: '访问企业云盘中的项目资料与历史文档。',
    category: 'resource',
  },
  {
    id: 'mcp_bid_archive',
    name: '历史标书归档',
    description: '检索历史标书、投标要求和范本归档。',
    category: 'knowledge',
  },
  {
    id: 'mcp_project_docs',
    name: '项目文档中心',
    description: '读取项目工作区中的文档、模板和批注。',
    category: 'workspace',
  },
  {
    id: 'mcp_workspace_docs',
    name: '工作区文档上下文',
    description: '为当前页面或编辑器提供工作区上下文。',
    category: 'workspace',
  },
  {
    id: 'mcp_message_hub',
    name: '消息协作中心',
    description: '连接用户间与 Agent 间的统一消息通道。',
    category: 'message',
  },
  {
    id: 'mcp_policy_knowledge',
    name: '制度规则知识库',
    description: '检索制度、模板规范和敏感信息限制规则。',
    category: 'knowledge',
  },
  {
    id: 'mcp_approval_feed',
    name: '审批与回执通道',
    description: '同步审批状态、待确认事项和回执结果。',
    category: 'message',
  },
]

export const SETTINGS_SKILLS: SharedSkillOption[] = [
  {
    id: 'skill_resource_intake',
    name: '资料接入',
    description: '导入本地或云端资料并生成结构化上下文。',
    level: 'basic',
    source: 'platform_builtin',
  },
  {
    id: 'skill_document_draft',
    name: '文档起草',
    description: '根据要求、模板和知识生成候选文档内容。',
    level: 'advanced',
    source: 'platform_builtin',
  },
  {
    id: 'skill_structure_extract',
    name: '结构抽取',
    description: '抽取文档结构、章节模式和字段规则。',
    level: 'intermediate',
    source: 'platform_builtin',
  },
  {
    id: 'skill_policy_check',
    name: '规则校验',
    description: '校验合规项、敏感信息边界和格式要求。',
    level: 'advanced',
    source: 'department_builtin',
  },
  {
    id: 'skill_cross_department_brief',
    name: '跨部门摘要',
    description: '生成适合发给其他用户或 Agent 的协作摘要。',
    level: 'expert',
    source: 'user_installed',
  },
]

export const SETTINGS_DEPARTMENTS: SharedDepartmentOption[] = [
  { id: 'dept-tender', name: '招投标部' },
  { id: 'dept-finance', name: '财务部' },
  { id: 'dept-legal', name: '法务部' },
  { id: 'dept-sales', name: '销售部' },
  { id: 'dept-ops', name: '运营支持' },
  { id: 'dept-management', name: '管理层' },
]

export const SETTINGS_KNOWLEDGE_BASES: SharedKnowledgeBaseOption[] = [
  {
    id: 'kb-bid-archive',
    name: '历史标书知识库',
    description: '沉淀历史标书、投标要求和复用范本。',
  },
  {
    id: 'kb-policy',
    name: '制度与规则知识库',
    description: '存放制度规则、权限边界和敏感信息限制。',
  },
  {
    id: 'kb-template',
    name: '模板资产库',
    description: '管理可复用的模板、章节结构和变量规则。',
  },
  {
    id: 'kb-collaboration',
    name: '协作摘要知识库',
    description: '存放跨部门协作纪要、摘要和任务交接记录。',
  },
]
