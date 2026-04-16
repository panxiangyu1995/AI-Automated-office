# ai-office - 主计划

> 状态: PLANNING
> 创建: 2026-04-16
> 更新: 2026-04-16
> 团队: ai-office (backend-dev, frontend-dev, researcher, e2e-tester, reviewer, custodian)
> 决策记录: .plans/ai-office/decisions.md

---

## 1. 项目概述

AI-Automated-office 是一款 AI 赋能的 ERP 系统。本迭代计划根据代码实际与铁律文档（PRD+架构+UX+Epic+测试规范）之间的差距，进行 30 轮系统性迭代，采用 6 循环模式（每 5 轮一个循环：差距分析→开发→测试→审查→清理）。

---

## 2. 文档索引

| 文档 | 位置 | 内容 |
|------|------|------|
| 架构 | docs/architecture.md | 系统组件、数据流、关键设计决策 |
| API 契约 | docs/api-contracts.md | 前后端接口定义 |
| 不变量 | docs/invariants.md | 不可违反的系统边界 |

---

## 3. 阶段概览

任务调度通过原生 TaskCreate/TaskList 管理（依赖自动解锁）。

### 切片原则

将任务分解为**垂直切片**（追踪子弹），而不是按技术层横向切片。
每个切片提供一条贯穿所有层的窄而完整的路径（schema → API → UI → 测试）。

### 6 循环 × 5 轮 = 30 轮

| 循环 | 轮次 | 差距分析 | 开发 | 测试 | 审查 | 清理 |
|------|------|---------|------|------|------|------|
| C1 | 1-5 | R1 | R2-R3 | R4 | R4 | R5 |
| C2 | 6-10 | R6 | R7-R8 | R9 | R9 | R10 |
| C3 | 11-15 | R11 | R12-R13 | R14 | R14 | R15 |
| C4 | 16-20 | R16 | R17-R18 | R19 | R19 | R20 |
| C5 | 21-25 | R21 | R22-R23 | R24 | R24 | R25 |
| C6 | 26-30 | R26 | R27-R28 | R29 | R29 | R30 |

每轮说明：
- **差距分析轮**：researcher 对比铁律文档与代码实际，识别本轮优先修复的差距
- **开发轮**：backend-dev + frontend-dev 并行实现，TDD 驱动
- **测试轮**：e2e-tester 执行浏览器测试 + 回归测试
- **审查轮**：reviewer 审查代码质量/安全/铁律合规
- **清理轮**：custodian 合规巡检 + 文档治理 + 代码清理

---

## 4. 任务汇总

| # | 任务 | 负责人 | 状态 | 计划文件 |
|---|------|--------|------|----------|
| T1 | C1 差距分析 | researcher | pending | .plans/ai-office/researcher/research-c1-gap/ |
| T2 | C1 后端开发 | backend-dev | pending | .plans/ai-office/backend-dev/task-c1-backend/ |
| T3 | C1 前端开发 | frontend-dev | pending | .plans/ai-office/frontend-dev/task-c1-frontend/ |
| T4 | C1 E2E 测试 | e2e-tester | pending | .plans/ai-office/e2e-tester/test-c1-e2e/ |
| T5 | C1 代码审查 | reviewer | pending | .plans/ai-office/reviewer/review-c1/ |
| T6 | C1 合规清理 | custodian | pending | .plans/ai-office/custodian/audit-c1/ |

---

## 5. 当前阶段

循环 1 (C1) — 差距分析阶段。researcher 正在对比铁律文档与代码实际，识别优先修复的差距。
