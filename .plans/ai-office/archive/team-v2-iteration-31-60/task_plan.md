# ai-office - 主计划（第2轮迭代）

> 状态: EXECUTING
> 创建: 2026-04-16
> 更新: 2026-04-16
> 团队: ai-office (backend-dev, frontend-dev, researcher, e2e-tester, reviewer, custodian)
> 决策记录: .plans/ai-office/decisions.md
> 迭代节奏: 6循环 × 5轮 = 30轮
> 第1轮归档: .plans/ai-office/archive/team-v1-iteration-1-30/

---

## 1. 项目概述

AI-Automated-office 是AI赋能的ERP系统。第1轮30轮迭代已完成并归档。
第2轮基于代码实际与铁律文档的差距分析，系统性补齐缺失功能。

**关键原则：task.json不是完整的所有tasks，所有差距分析以代码实际为准。**

---

## 2. 代码实际状态摘要

### 后端（Rust/Tauri）：504文件/12万行/170+命令
- agent/：完整实现（LLM×5、工具系统、记忆、会话）
- capability/：完整实现
- 业务模块：hr/finance/sales/warehouse/approval/service/tender/marketing 基本完成
- auth/：基本完成（JWT硬编码、无RBAC）
- sync/：部分实现（冲突合并占位）
- knowledge/：基本完成（初始化被注释掉）

### 前端（React/TS）：34个feature模块
- 重度：agent(78)、session(76)、settings(51)、admin(36)
- 中度：permission(21)、warehouse(20)、service(16)
- 轻度：dashboard(1)、schema(1)、scheduler(3)
- 大文件：10+个>1200行
- 测试：E2E 17、集成35、src/内嵌仅1

---

## 3. 差距分析（代码实际 vs 铁律文档）

### CRITICAL
| # | 差距 | 来源 | 现状 |
|---|------|------|------|
| G1 | JWT secret硬编码 | 架构:安全 | "secret_key_change_me" |
| G2 | CSP完全禁用 | 架构:安全 | tauri.conf.json CSP=null |
| G3 | 知识库RAG未初始化 | PRD:知识库 | lib.rs中注释掉 |
| G4 | RBAC权限未使用 | PRD:权限 | role字段存在未检查 |
| G5 | 前端单元测试极缺 | 测试规范 | src/仅1个.test |

### HIGH
| # | 差距 | 来源 | 现状 |
|---|------|------|------|
| G6 | 同步冲突合并占位 | 架构:同步 | 枚举有实现为空 |
| G7 | 10+前端大文件>1200行 | 代码规范 | financePilot(1928)等 |
| G8 | 部门路由缺失 | UX:导航 | 6核心部门无入口 |
| G9 | 颜色硬编码 | UX:var(--ao-*) | 多处hex |
| G10 | plugins/为空 | 架构:插件 | 仅config.yaml |
| G11 | marketplace空壳 | PRD:市场 | 前后端占位 |
| G12 | Updater未配置 | 架构:安全 | pubkey为空 |

### MEDIUM
| # | 差距 | 来源 | 现状 |
|---|------|------|------|
| G13 | L3图谱记忆未实现 | 架构:记忆 | Post-MVP |
| G14 | 862个Rust警告 | 代码质量 | warnings |
| G15 | network/空壳 | 架构:网络 | 46行 |
| G16 | dashboard仅1文件 | PRD:看板 | 1文件 |
| G17 | 自定义字段缺失 | PRD:字段 | Record<string,unknown> |
| G18 | schema仅1文件 | 架构:表单 | 1文件 |
| G19 | 无CI/CD | 测试规范 | 缺workflows |
| G20 | Webhook未接SIEM | 架构:审计 | 未接audit |

---

## 4. 迭代计划（6循环×5轮=30轮）

### 循环1（R1-R5）：安全与基础设施修复
- R1: researcher差距验证 + G1 JWT安全修复
- R2: G2 CSP + G12 Updater + G4 RBAC基础
- R3: G3 知识库初始化 + G6 同步冲突合并
- R4: G5 前端测试框架 + 核心测试
- R5: reviewer审查 + custodian巡检

### 循环2（R6-R10）：代码质量与大文件拆分
- R6: researcher质量扫描 + G7前端拆分(前5)
- R7: G7前端拆分(后5) + G14 Rust警告(前200)
- R8: G14 Rust警告(后续) + Rust大文件拆分
- R9: G9颜色修复 + G8部门路由
- R10: reviewer审查 + custodian巡检

### 循环3（R11-R15）：业务模块深度补齐
- R11: researcher业务差距分析
- R12: G16 dashboard + G18 schema
- R13: G17 自定义字段 + G10 插件骨架
- R14: G11 marketplace + G15 network
- R15: reviewer审查 + custodian巡检

### 循环4（R16-R20）：Agent能力与集成深化
- R16: researcher Agent差距分析
- R17: Agent工具前端集成深化
- R18: 记忆系统UI + G13 L3图谱基础
- R19: G20 Webhook→SIEM + 审计深化
- R20: reviewer审查 + custodian巡检

### 循环5（R21-R25）：E2E测试与质量保障
- R21: researcher测试覆盖分析
- R22: E2E测试补充
- R23: 集成测试补充
- R24: G19 CI/CD流水线
- R25: reviewer审查 + custodian巡检

### 循环6（R26-R30）：最终打磨与验收
- R26: researcher最终差距扫描
- R27: 剩余CRITICAL/HIGH修复
- R28: 性能+Bundle优化
- R29: 全量build+文档同步
- R30: 最终审查+验收报告

---

## 5. 当前阶段

循环1 R1：researcher差距验证 + JWT安全修复
