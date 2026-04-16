# 团队快照

> 生成时间: 2026-04-16
> 项目: ai-office
> 语言: 中文
>
> Skill 源文件时间戳（用于陈旧检测）:
> - SKILL.md: 1776270653
> - onboarding.md: (同目录)
> - roles.md: (同目录)
> - templates.md: (同目录)

## 花名册

| 名称 | 角色 | 模型 | subagent_type |
|------|------|------|---------------|
| backend-dev | 后端开发 | sonnet | general-purpose |
| frontend-dev | 前端开发 | sonnet | general-purpose |
| researcher | 探索/研究 | sonnet | general-purpose |
| e2e-tester | 联调测试 | sonnet | general-purpose |
| reviewer | 代码审查 | sonnet | general-purpose |
| custodian | 管家 | sonnet | general-purpose |

## 入职 Prompts

（入职 prompts 已在生成时完整发送给各 Agent()，恢复时从各智能体的 .plans/ 文件重建上下文即可）

## 迭代节奏

6 循环 × 5 轮 = 30 轮
每循环：差距分析(R1) → 开发(R2-R3) → 测试(R4) → 审查(R4) → 清理(R5)

## 当前状态

循环 1 (C1) — 差距分析阶段
