import {
  Bot,
  Brain,
  Database,
  Home,
  Package,
  PlugZap,
  type LucideIcon,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  Building2,
} from 'lucide-react'

export type SettingsCategoryKey =
  | 'home'
  | 'workspace'
  | 'ai'
  | 'sub-agents'
  | 'knowledge'
  | 'integrations'
  | 'plugins'
  | 'security'
  | 'system'
  | 'departments'

export type SettingsSectionKey =
  | 'general'
  | 'shortcuts'
  | 'agent'
  | 'updates'
  | 'prompt-debug'
  | 'sub-agent'
  | 'sub-agent-persona'
  | 'sub-agent-tool'
  | 'sub-agent-permission'
  | 'sub-agent-model'
  | 'sub-agent-routing'
  | 'sub-agent-execution'
  | 'knowledge'
  | 'knowledge-qa'
  | 'knowledge-generation'
  | 'knowledge-entry'
  | 'knowledge-access'
  | 'knowledge-quality'
  | 'skill-parsing'
  | 'soul-parsing'
  | 'plugin-adaptation'
  | 'clawhub-market'
  | 'private-market'
  | 'department-list'
  | 'resource-security'
  | 'resource-execution-audit'
  | 'connector-framework'
  | 'connector-health'

export type SettingsSectionKind = 'config' | 'monitor' | 'audit'
export type SettingsRiskLevel = 'low' | 'medium' | 'high'
export type SettingsSaveMode = 'instant' | 'manual' | 'managed' | 'readonly'

export interface SettingsCategoryDescriptor {
  key: SettingsCategoryKey
  title: string
  description: string
  icon: LucideIcon
}

export interface SettingsSectionDescriptor {
  key: SettingsSectionKey
  category: Exclude<SettingsCategoryKey, 'home'>
  title: string
  description: string
  kind: SettingsSectionKind
  keywords: string[]
}

export interface SettingsSectionGovernanceDescriptor {
  audience: string
  riskLevel: SettingsRiskLevel
  saveMode: SettingsSaveMode
  governanceNote: string
  changeImpact: string
  auditTrail: string
}

export const SETTINGS_CATEGORIES: SettingsCategoryDescriptor[] = [
  {
    key: 'home',
    title: '设置中心',
    description: '集中管理工作台偏好、AI 配置、平台治理、安全审计与系统运行状态。',
    icon: Home,
  },
  {
    key: 'workspace',
    title: '工作台与个人偏好',
    description: '管理固定 Workbench 壳层的显示方式、快捷键与个人使用偏好。',
    icon: SlidersHorizontal,
  },
  {
    key: 'ai',
    title: 'AI 与模型',
    description: '配置模型能力入口，统一管理 Agent 的核心模型相关设置。',
    icon: Brain,
  },
  {
    key: 'sub-agents',
    title: 'Sub-Agent 与 Skills',
    description: '管理子代理角色、能力绑定、权限策略与调用路由。',
    icon: Bot,
  },
  {
    key: 'departments',
    title: '部门管理',
    description: '管理企业部门模块，启用/禁用部门能力包，配置部门间通信。',
    icon: Building2,
  },
  {
    key: 'knowledge',
    title: '知识库与内容',
    description: '治理知识资产的接入、检索、生成、权限与质量。',
    icon: Database,
  },
  {
    key: 'integrations',
    title: '集成与连接器',
    description: '集中配置连接器框架与运行健康，作为集成入口的固定治理面板。',
    icon: PlugZap,
  },
  {
    key: 'plugins',
    title: '插件与资源市场',
    description: '管理插件适配、公共市场与私有市场相关能力。',
    icon: Package,
  },
  {
    key: 'security',
    title: '安全、权限与审计',
    description: '承载高风险治理能力，包括资源安全、权限边界和执行审计。',
    icon: ShieldCheck,
  },
  {
    key: 'system',
    title: '系统、更新与诊断',
    description: '承载更新、调试、执行监控与系统级诊断能力。',
    icon: Wrench,
  },
]

export const SETTINGS_SECTIONS: SettingsSectionDescriptor[] = [
  {
    key: 'general',
    category: 'workspace',
    title: '通用',
    description: '调整固定壳层中各区域的显示状态并恢复默认布局。',
    kind: 'config',
    keywords: ['通用', '布局', '菜单栏', '侧边栏', 'AI 面板', 'bottom panel'],
  },
  {
    key: 'shortcuts',
    category: 'workspace',
    title: '快捷键',
    description: '设置高频工作台动作的全局快捷键并即时生效。',
    kind: 'config',
    keywords: ['快捷键', 'hotkey', 'show app', 'open settings'],
  },
  {
    key: 'agent',
    category: 'ai',
    title: 'Agent 设置',
    description: '配置模型提供商与 Agent 核心运行能力。',
    kind: 'config',
    keywords: ['agent', '模型', 'provider', 'llm'],
  },
  {
    key: 'sub-agent',
    category: 'sub-agents',
    title: 'Sub-Agent 管理',
    description: '管理子代理的注册、启用状态与基础信息。',
    kind: 'config',
    keywords: ['sub-agent', '管理', 'registry'],
  },
  {
    key: 'sub-agent-persona',
    category: 'sub-agents',
    title: '角色配置',
    description: '维护子代理的人格、角色说明与提示词相关能力。',
    kind: 'config',
    keywords: ['persona', '角色', '提示词'],
  },
  {
    key: 'sub-agent-tool',
    category: 'sub-agents',
    title: '工具绑定',
    description: '限定子代理可使用的工具与能力绑定关系。',
    kind: 'config',
    keywords: ['工具', 'binding', 'skills', 'mcp'],
  },
  {
    key: 'sub-agent-permission',
    category: 'sub-agents',
    title: '权限配置',
    description: '控制子代理的数据范围、权限策略与访问边界。',
    kind: 'config',
    keywords: ['权限', 'permission', 'access'],
  },
  {
    key: 'sub-agent-model',
    category: 'sub-agents',
    title: '模型配置',
    description: '为不同子代理绑定独立的模型与生成参数。',
    kind: 'config',
    keywords: ['模型', 'model', 'llm'],
  },
  {
    key: 'sub-agent-routing',
    category: 'sub-agents',
    title: '调用路由',
    description: '配置主 Agent 到子代理的调用方式与路由规则。',
    kind: 'config',
    keywords: ['路由', 'routing', 'delegation'],
  },
  {
    key: 'skill-parsing',
    category: 'sub-agents',
    title: 'SKILL.md 解析',
    description: '查看 Skill 元数据解析与能力映射结果。',
    kind: 'config',
    keywords: ['skill', '解析', 'metadata'],
  },
  {
    key: 'soul-parsing',
    category: 'sub-agents',
    title: 'SOUL.md 解析',
    description: '查看 SOUL 模板解析与人格导入结果。',
    kind: 'config',
    keywords: ['soul', '人格', '解析'],
  },
  {
    key: 'knowledge',
    category: 'knowledge',
    title: '知识文档管理',
    description: '管理知识文档的接入、上传与组织结构。',
    kind: 'config',
    keywords: ['知识', '文档', 'upload'],
  },
  {
    key: 'knowledge-qa',
    category: 'knowledge',
    title: '知识问答检索',
    description: '配置问答检索的结果与检索策略。',
    kind: 'config',
    keywords: ['知识', 'qa', '检索'],
  },
  {
    key: 'knowledge-generation',
    category: 'knowledge',
    title: '知识自动生成',
    description: '管理知识自动生成能力与生成策略。',
    kind: 'config',
    keywords: ['知识', '生成', 'ticket'],
  },
  {
    key: 'knowledge-entry',
    category: 'knowledge',
    title: '知识条目管理',
    description: '维护知识条目内容及其生命周期。',
    kind: 'config',
    keywords: ['知识', 'entry', '条目'],
  },
  {
    key: 'knowledge-access',
    category: 'knowledge',
    title: '知识库权限控制',
    description: '为知识资产设置访问范围与权限边界。',
    kind: 'config',
    keywords: ['知识', '权限', 'access'],
  },
  {
    key: 'knowledge-quality',
    category: 'knowledge',
    title: '知识质量评估',
    description: '查看知识质量评估结果并治理低质量内容。',
    kind: 'monitor',
    keywords: ['知识', '质量', 'evaluation'],
  },
  {
    key: 'connector-framework',
    category: 'integrations',
    title: '连接器框架',
    description: '配置连接器认证框架与基础连接策略。',
    kind: 'config',
    keywords: ['连接器', 'connector', 'framework', 'auth'],
  },
  {
    key: 'connector-health',
    category: 'integrations',
    title: '连接器健康',
    description: '监控连接器运行状态与健康情况。',
    kind: 'monitor',
    keywords: ['连接器', '健康', 'health'],
  },
  {
    key: 'plugin-adaptation',
    category: 'plugins',
    title: 'Plugin 适配转换',
    description: '管理插件接入过程中的适配与转换能力。',
    kind: 'config',
    keywords: ['plugin', '适配', 'adaptation'],
  },
  {
    key: 'clawhub-market',
    category: 'plugins',
    title: 'ClawHub 市场',
    description: '管理公共资源市场中的插件与能力入口。',
    kind: 'config',
    keywords: ['plugin', 'market', 'clawhub'],
  },
  {
    key: 'private-market',
    category: 'plugins',
    title: '私有市场',
    description: '管理企业私有市场与资源分发能力。',
    kind: 'config',
    keywords: ['plugin', 'private', 'market'],
  },
  {
    key: 'resource-security',
    category: 'security',
    title: '资源安全',
    description: '管理资源权限、风险控制与安全策略。',
    kind: 'config',
    keywords: ['安全', 'security', 'resource'],
  },
  {
    key: 'resource-execution-audit',
    category: 'security',
    title: '执行审计',
    description: '查看资源执行链路与审计记录。',
    kind: 'audit',
    keywords: ['审计', 'audit', 'execution'],
  },
  {
    key: 'updates',
    category: 'system',
    title: '更新',
    description: '查看系统更新能力与后续版本策略入口。',
    kind: 'config',
    keywords: ['更新', 'update', 'release'],
  },
  {
    key: 'department-list',
    category: 'departments',
    title: '部门列表',
    description: '查看和管理企业所有部门模块。',
    kind: 'config',
    keywords: ['部门', 'department', '模块'],
  },
  {
    key: 'prompt-debug',
    category: 'system',
    title: '提示词调试',
    description: '承载调试态提示词分析与诊断能力。',
    kind: 'monitor',
    keywords: ['提示词', 'debug', 'prompt'],
  },
  {
    key: 'sub-agent-execution',
    category: 'system',
    title: 'Sub-Agent 执行监控',
    description: '用于查看子代理执行状态、任务轨迹与运行表现。',
    kind: 'monitor',
    keywords: ['sub-agent', '执行', 'monitor'],
  },
]

export const DEFAULT_SECTION_BY_CATEGORY: Record<
  Exclude<SettingsCategoryKey, 'home'>,
  SettingsSectionKey
> = {
  workspace: 'general',
  ai: 'agent',
  'sub-agents': 'sub-agent',
  knowledge: 'knowledge',
  integrations: 'connector-framework',
  plugins: 'plugin-adaptation',
  security: 'resource-security',
  system: 'updates',
  departments: 'department-list',
}

export const SETTINGS_SECTION_GOVERNANCE: Record<
  SettingsSectionKey,
  SettingsSectionGovernanceDescriptor
> = {
  general: {
    audience: '所有用户',
    riskLevel: 'low',
    saveMode: 'instant',
    governanceNote: '保持 Workbench 固定壳层的结构稳定，优先保留可识别的导航区域。',
    changeImpact: '仅影响当前用户本地工作台布局与显示偏好。',
    auditTrail: '本页主要是本地偏好变更，不进入高风险治理审计链路。',
  },
  shortcuts: {
    audience: '所有用户',
    riskLevel: 'medium',
    saveMode: 'manual',
    governanceNote: '快捷键是高频入口，应避免与系统级或常用应用快捷键冲突。',
    changeImpact: '会改变全局快捷操作的触发方式，直接影响工作流效率。',
    auditTrail: '保存后即时生效，作为用户级偏好在本地持久化。',
  },
  agent: {
    audience: '平台管理员 / AI 管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '模型与提供商配置会影响 Agent 的默认能力，应先验证可用性再推广。',
    changeImpact: '会影响模型选择、连接能力与部分任务执行质量。',
    auditTrail: '模型、密钥与提供商调整应纳入平台配置审计链路。',
  },
  updates: {
    audience: '平台管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '更新策略应保持可回滚、可灰度、可追踪，避免直接影响业务连续性。',
    changeImpact: '会影响客户端版本、发布节奏与稳定性策略。',
    auditTrail: '更新策略与版本切换需要进入运维审计链路。',
  },
  'prompt-debug': {
    audience: '平台管理员 / 开发者',
    riskLevel: 'medium',
    saveMode: 'readonly',
    governanceNote: '调试能力属于诊断面，不应与正式配置入口混排。',
    changeImpact: '主要用于分析提示词与执行上下文，不直接改变业务数据。',
    auditTrail: '调试行为应与正式配置变更分流记录。',
  },
  'sub-agent': {
    audience: '平台管理员 / AI 管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: 'Sub-Agent 是能力编排中心，注册与启停需要保持稳定命名和职责边界。',
    changeImpact: '会影响任务分发方式、子代理可见性与平台能力编排。',
    auditTrail: '启停与注册变更需要记录到 Agent 治理审计链路。',
  },
  'sub-agent-persona': {
    audience: '平台管理员 / AI 管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '角色提示词会直接影响决策倾向，应通过模板化方式统一管理。',
    changeImpact: '会影响子代理行为风格、能力边界与解释方式。',
    auditTrail: '角色定义与模板调整需可追溯、可回滚。',
  },
  'sub-agent-tool': {
    audience: '平台管理员 / 安全管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '工具绑定是高风险能力授权，必须与权限边界保持一致。',
    changeImpact: '会直接改变子代理能调用的工具集合与执行范围。',
    auditTrail: '工具绑定与解除都应写入统一工具权限审计。',
  },
  'sub-agent-permission': {
    audience: '平台管理员 / 安全管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '子代理权限必须小于等于用户权限，不允许出现越权访问。',
    changeImpact: '会影响子代理可见数据范围和可执行动作边界。',
    auditTrail: '权限策略修改属于高风险治理行为，应保留完整审计。',
  },
  'sub-agent-model': {
    audience: '平台管理员 / AI 管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '子代理模型配置应考虑成本、稳定性和任务适配性。',
    changeImpact: '会影响子代理性能、质量与调用成本。',
    auditTrail: '模型切换与参数变更应进入 Agent 配置审计。',
  },
  'sub-agent-routing': {
    audience: '平台管理员 / AI 管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '调用路由决定任务流向，应优先保证可解释性和可回退。',
    changeImpact: '会影响主 Agent 的路由决策和任务执行路径。',
    auditTrail: '路由规则属于编排治理变更，应记录规则版本与调整时间。',
  },
  'sub-agent-execution': {
    audience: '平台管理员 / 运维人员',
    riskLevel: 'medium',
    saveMode: 'readonly',
    governanceNote: '执行监控用于观测任务状态，不应与配置修改行为混淆。',
    changeImpact: '本页主要用于状态观察和问题诊断。',
    auditTrail: '执行轨迹本身构成审计证据，不提供直接配置修改。',
  },
  knowledge: {
    audience: '平台管理员 / 知识管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '知识接入应优先确保来源可信、结构清晰与权限明确。',
    changeImpact: '会影响知识库内容结构与后续问答准确性。',
    auditTrail: '文档接入、归档和删除应进入知识治理审计链路。',
  },
  'knowledge-qa': {
    audience: '平台管理员 / 知识管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '检索策略应服务于准确召回，不宜过度追求结果数量。',
    changeImpact: '会影响问答召回质量与知识命中效果。',
    auditTrail: '检索阈值和策略调整应保留配置快照。',
  },
  'knowledge-generation': {
    audience: '平台管理员 / 知识管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '自动生成内容必须配合人工校验策略，不应直接替代正式知识资产。',
    changeImpact: '会影响知识生成质量、审核压力与内容生命周期。',
    auditTrail: '生成策略修改应保留版本和责任人信息。',
  },
  'knowledge-entry': {
    audience: '知识管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '知识条目应遵循统一结构，避免内容碎片化与重复录入。',
    changeImpact: '会影响知识条目质量、可维护性与检索结果稳定性。',
    auditTrail: '条目变更需可追踪，便于版本回溯。',
  },
  'knowledge-access': {
    audience: '平台管理员 / 安全管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '知识权限是数据治理边界，必须按部门、角色或范围精确控制。',
    changeImpact: '会影响谁能访问哪些知识资产及其可见范围。',
    auditTrail: '权限授予与回收属于高风险治理动作，应完整审计。',
  },
  'knowledge-quality': {
    audience: '知识管理员 / 平台管理员',
    riskLevel: 'medium',
    saveMode: 'readonly',
    governanceNote: '质量评估页承担治理洞察职责，重点是发现问题和推动修复。',
    changeImpact: '主要用于质量观测与治理决策，不直接修改数据。',
    auditTrail: '评估结果用于支持治理决策和整改过程留痕。',
  },
  'skill-parsing': {
    audience: '平台管理员 / 开发者',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: 'Skill 解析结果应服务于能力治理，不应成为独立业务入口。',
    changeImpact: '会影响 Skill 元数据可见性和能力识别准确度。',
    auditTrail: '解析导入与映射调整应保留处理记录。',
  },
  'soul-parsing': {
    audience: '平台管理员 / 开发者',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: 'SOUL 解析属于人格模板治理，应保持只读导入和版本追踪。',
    changeImpact: '会影响人格模板导入和角色表达方式。',
    auditTrail: '模板解析与版本变更应进入人格治理审计。',
  },
  'plugin-adaptation': {
    audience: '平台管理员 / 插件管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '插件适配应受统一 UI 与扩展边界约束，不允许侵蚀平台壳层。',
    changeImpact: '会影响插件接入效率、兼容性和工作台一致性。',
    auditTrail: '适配规则调整应保留兼容性记录与责任人。',
  },
  'clawhub-market': {
    audience: '平台管理员 / 插件管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '公共市场入口应优先保证安全扫描、权限声明和来源可信。',
    changeImpact: '会影响外部资源的安装入口和企业可选能力范围。',
    auditTrail: '安装、升级、卸载与审批动作应进入资源治理审计。',
  },
  'private-market': {
    audience: '平台管理员 / 插件管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '私有市场直接服务企业分发能力，应与企业治理策略绑定。',
    changeImpact: '会影响企业内资源分发、版本控制与安装范围。',
    auditTrail: '私有市场配置与分发规则必须完整审计。',
  },
  'resource-security': {
    audience: '安全管理员 / 平台管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '资源安全页负责高风险策略，不允许以便利性替代安全边界。',
    changeImpact: '会影响插件、技能、模板等资源的执行权限和安全策略。',
    auditTrail: '所有策略变更都属于高风险治理动作，应进入安全审计链路。',
  },
  'resource-execution-audit': {
    audience: '安全管理员 / 审计人员',
    riskLevel: 'high',
    saveMode: 'readonly',
    governanceNote: '审计页以证据完整性为先，结构应稳定、字段含义应清晰。',
    changeImpact: '主要用于追踪资源执行链路、异常模式和导出审计记录。',
    auditTrail: '本页本身就是审计证据承载区，重点在可查、可导、可追溯。',
  },
  'connector-framework': {
    audience: '平台管理员 / 集成管理员',
    riskLevel: 'high',
    saveMode: 'managed',
    governanceNote: '连接器框架配置会影响外部接入稳定性，应优先保证认证和隔离策略。',
    changeImpact: '会影响第三方平台接入方式、认证机制与调用边界。',
    auditTrail: '认证配置、接入变更与重连策略应保留集成审计记录。',
  },
  'connector-health': {
    audience: '平台管理员 / 运维人员',
    riskLevel: 'medium',
    saveMode: 'readonly',
    governanceNote: '健康监控主要用于发现问题与恢复判断，不应承担正式配置入口。',
    changeImpact: '本页主要影响运维判断与故障恢复路径。',
    auditTrail: '异常事件、重试和降级状态构成运维审计证据。',
  },
  'department-list': {
    audience: '平台管理员',
    riskLevel: 'medium',
    saveMode: 'managed',
    governanceNote: '部门模块是企业能力边界，启停和配置变更应保持一致性。',
    changeImpact: '会影响部门可用性、能力范围和跨部门协作路径。',
    auditTrail: '部门启停和配置变更应进入平台治理审计链路。',
  },
}

export function getSettingsCategory(key: SettingsCategoryKey) {
  return SETTINGS_CATEGORIES.find((category) => category.key === key)
}

export function getSettingsSections(category: Exclude<SettingsCategoryKey, 'home'>) {
  return SETTINGS_SECTIONS.filter((section) => section.category === category)
}

export function getSettingsSectionGovernance(key: SettingsSectionKey) {
  return SETTINGS_SECTION_GOVERNANCE[key]
}

export function getSettingsSection(key: SettingsSectionKey) {
  return SETTINGS_SECTIONS.find((section) => section.key === key)
}
