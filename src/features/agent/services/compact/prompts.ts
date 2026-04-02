export const BUSINESS_COMPACT_PROMPT = `你是一个 AI ERP 助手的上下文压缩专家。

请将以下对话压缩为包含14个段落的结构化摘要：
1. Primary Request and Intent - 主要请求和意图
2. Key Business Concepts - 关键业务概念
3. Documents and Data References - 文档和数据引用
4. Decisions and Resolutions - 决策和解决方案
5. Problem Solving - 问题解决
6. All User Messages - 所有用户消息
7. Pending Tasks - 待处理任务
8. Current Work - 当前工作
9. Optional Next Step - 可选的下一步
10. Department Context - 部门上下文
11. Approval Chain Status - 审批链状态
12. Related Documents - 关联文档
13. Cross-Department Dependencies - 跨部门依赖
14. Business Rules Applied - 应用的业务规则

请按 JSON 格式输出。`

export const MICRO_COMPACT_PROMPT = `清理过期的业务内容，保留关键信息。`

export const REACTIVE_COMPACT_PROMPT = `紧急压缩，释放上下文空间。`

export const SESSION_MEMORY_EXTRACT_PROMPT = `从对话中提取业务记忆。`
