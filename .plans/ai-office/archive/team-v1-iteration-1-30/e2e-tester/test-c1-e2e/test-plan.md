# C1 E2E 测试计划

> 日期: 2026-04-16
> 状态: 进行中
> 负责人: e2e-tester

---

## 测试范围

C1 差距修复的开发成果，覆盖后端和前端两部分。

### 后端修复 (backend-dev)
1. **G3: DashScope LLM 适配器** — `src-tauri/src/agent/llm_provider/dashscope.rs`
2. **G2: 5部门工具注册集** — HR/Sales/Approval/Warehouse/Service 各5个工具
3. **G4: 通用数据同步引擎** — `src-tauri/src/sync/data_sync.rs`

### 前端修复 (frontend-dev)
1. **G6: 6核心布局组件颜色系统接入** — ActivityBar/StatusBar/AiChatPanel/Workbench/TabBar/BottomPanel
2. **G4: SyncConflictDialog 同步冲突解决UI** — `src/features/sync/components/SyncConflictDialog.tsx`

---

## 测试矩阵

| # | 测试项 | 类型 | 优先级 | 测试方法 | 对应差距 |
|---|--------|------|--------|---------|---------|
| T1 | 应用启动与主布局渲染 | Smoke | P0 | Playwright | G6 |
| T2 | 颜色CSS变量正确性验证 | Integration | P0 | Playwright+JS | G6 |
| T3 | 主题切换（深色/浅色/高对比度） | E2E | P0 | Playwright | G6 |
| T4 | SyncConflictDialog 组件渲染 | Integration | P1 | Playwright | G4-前端 |
| T5 | SyncConflictDialog 冲突解决交互 | E2E | P1 | Playwright | G4-前端 |
| T6 | 后端工具注册集验证 | Contract | P1 | Rust单元测试 | G2 |
| T7 | DashScope适配器验证 | Contract | P1 | Rust单元测试 | G3 |
| T8 | 数据同步引擎验证 | Contract | P1 | Rust单元测试 | G4-后端 |

---

## 执行策略

1. **P0 关键路径** — 先验证应用能启动、布局正确、颜色变量生效、主题切换正常
2. **P1 功能验证** — 验证新增组件交互、后端契约
3. **回归验证** — 确保现有功能未受影响

## 通过标准

- P0 测试 100% 通过
- 总通过率 >95%
- 无 CRITICAL 级别缺陷
