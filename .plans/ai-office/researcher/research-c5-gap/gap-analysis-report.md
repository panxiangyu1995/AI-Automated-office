# C5 差距分析报告：铁律文档 vs C4后代码实际

> 作者: researcher (team-lead 代行)
> 日期: 2026-04-16
> 状态: 完成
> 基线: C4修复后的代码

---

## C4修复确认

| C4差距 | C4状态 | C5验证结果 |
|--------|--------|-----------|
| J1 部门路由集成 | **已修复** | routes.ts 15条部门路由，Sidebar 6核心部门入口 |
| J2 已实现组件集成 | **已修复** | SyncConflictDialog→SyncStatus, ProblemCenter→BottomPanel, GroupChat→workbenchRoutes |
| J3 模板前端UI | **已修复** | TemplateDesigner.tsx(612行)+Canvas+LayerPanel+PropertyPanel |
| J4 SIEM审计 | **已修复** | audit_siem.rs(384行)+siem.rs(45行) |
| J6 前端测试 | **部分修复** | tests/ 87文件，src/ 仅1个内嵌测试 |
| J7 颜色修复 | **已修复** | #F59E0B已替换，非theme hex=0 |
| J10 模板命令暴露 | **已修复** | commands/template.rs(268行, 19命令) |

---

## 代码规模统计

| 指标 | C4 | C5(当前) |
|------|-----|---------|
| 前端源文件(.tsx/.ts) | 605 | **625** |
| Rust源文件(.rs) | 501 | **504** |
| var(--ao-*)使用 | 1115处 | **1178处** |
| 非合规hex | 1处 | **0处** |
| tests/ 测试文件 | 103 | **87**(部分清理) |
| src/ 内嵌测试 | 极少 | **1** |

---

## 大文件问题（系统性）

### 前端 >1200行（FAIL阈值）

| 文件 | 行数 | 建议 |
|------|------|------|
| financePilot.ts | 1928 | 拆分：提取财务操作子模块 |
| salesPilot.ts | 1786 | 拆分：提取销售操作子模块 |
| editorTemplateWriteback.ts | 1739 | 拆分：提取模板写回逻辑 |
| index.ts (session/runtime) | 1518 | 拆分：提取运行时子模块 |
| fieldActionAuthorization.ts | 1454 | 拆分：提取授权规则 |
| approvalPilot.ts | 1420 | 拆分：提取审批操作子模块 |
| formWritebackAdapter.ts | 1378 | 拆分：提取适配器逻辑 |
| MCPServiceConfig.tsx | 1346 | 拆分：提取配置子组件 |
| workbenchCardWriteback.ts | 1329 | 拆分：提取写回逻辑 |
| TaskTraceAnalysis.tsx | 1218 | 拆分：提取分析子组件 |

### 前端 800-1200行（WARN阈值）

另有 40+ 个文件在 800-1200 行之间。

### Rust >800行

| 文件 | 行数 | 建议 |
|------|------|------|
| enterprise.rs | 1514 | 拆分：提取企业工具子模块 |
| routing.rs | 1129 | 拆分：提取路由规则 |
| security.rs | 965 | 接近限制，监控 |
| template.rs (approval) | 951 | 接近限制，监控 |
| lib.rs | 965 | 主入口，可接受 |
| monitoring.rs | 861 | 接近限制，监控 |
| audit.rs | 834 | 接近限制，监控 |
| permission/engine.rs | 835 | 接近限制，监控 |
| prompt_builder.rs | 917 | 接近限制，监控 |

---

## TOP 10 C5 差距

| # | 维度 | 严重度 | 差距描述 | 铁律来源 | 代码现状 | 修复建议 |
|---|------|--------|---------|---------|---------|---------|
| K1 | 文件大小 | **HIGH** | 10个前端文件>1200行(最大1928行)，40+个>800行。违反代码质量规范(文件<800行) | 代码质量规范 | 10个FAIL+40个WARN | 优先拆分>1200行的10个文件 |
| K2 | 测试覆盖 | **HIGH** | src/仅1个内嵌测试文件，测试规范要求单元>=80%。87个测试在tests/但src/内嵌覆盖极低 | 测试规范>=80% | src/ 1个.test | 在src/增加内联单元测试 |
| K3 | 自定义字段 | **MEDIUM** | workspace/types仅有customFields?: Record<string,unknown>，无Schema/AI感知/动态表单 | PRD自定义字段 | 类型定义仅1行 | 实现字段Schema+动态表单 |
| K4 | SOUL.md映射 | **MEDIUM** | SoulMdParsing.tsx+SubAgentPersonaConfig.tsx存在，YAML→Agent配置映射不完整 | 架构ADR-038/039 | 基础组件存在，映射缺失 | 完善YAML→Agent配置映射 |
| K5 | CI/CD | **MEDIUM** | .github/workflows/不存在，无自动化构建/测试/发布 | 工程质量 | 0个workflow | 创建ci.yml+test.yml |
| K6 | GroupChat拆分 | **MEDIUM** | GroupChat.tsx 1164行超过800行限制(C4遗留) | 代码质量规范 | 1164行 | 拆分子组件到独立文件 |
| K7 | Rust大文件 | **MEDIUM** | enterprise.rs 1514行，routing.rs 1129行超过800行限制 | 代码质量规范 | 2个>1200行 | 拆分子模块 |
| K8 | session/runtime拆分 | **MEDIUM** | session/runtime/ 有6个文件>1200行，index.ts 1518行 | 代码质量规范 | 6个>1200行 | 拆分运行时子模块 |
| K9 | Settings组件拆分 | **LOW** | settings/ 有8个组件>800行，MCPServiceConfig 1346行 | 代码质量规范 | 8个>800行 | 拆分配置子组件 |
| K10 | Pilot模块拆分 | **LOW** | financePilot(1928)+salesPilot(1786)+approvalPilot(1420)三个Pilot超大 | 代码质量规范 | 3个>1400行 | 提取共享Pilot基类+子模块 |

---

## C5 优先修复排序

| 序号 | 差距ID | 严重度 | 修复内容 | 预估工作量 | 涉及层 |
|------|--------|--------|---------|-----------|--------|
| 1 | K1 | HIGH | 拆分10个>1200行的前端文件 | 大 | 前端重构 |
| 2 | K2 | HIGH | src/增加内联单元测试 | 中 | 测试 |
| 3 | K6 | MEDIUM | GroupChat.tsx拆分(1164→<800) | 中 | 前端 |
| 4 | K7 | MEDIUM | Rust大文件拆分(enterprise/routing) | 中 | Rust |
| 5 | K3 | MEDIUM | 自定义字段Schema+动态表单 | 大 | 前端+Rust |
| 6 | K4 | MEDIUM | SOUL.md YAML→Agent映射 | 中 | 前端 |
| 7 | K5 | MEDIUM | CI/CD流水线 | 中 | DevOps |
| 8 | K8 | MEDIUM | session/runtime拆分 | 大 | 前端重构 |
| 9 | K9 | LOW | Settings组件拆分 | 中 | 前端 |
| 10 | K10 | LOW | Pilot模块拆分 | 大 | 前端重构 |

---

## 正面发现

1. **TLS 1.3 已启用**: Cargo.toml reqwest 使用 rustls-tls feature — C4 J8差距已解决
2. **颜色硬编码完全解决**: 非theme hex=0，var(--ao-*) 1178处
3. **部门路由完整**: 6核心部门全部可达
4. **组件集成完整**: 所有已实现组件均已import使用
5. **SIEM审计已实现**: JSON+CEF格式
6. **模板命令完整暴露**: 19个Tauri命令
7. **后端模块持续增长**: 504个Rust文件
