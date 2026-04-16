# C3 差距分析报告：铁律文档 vs C2后代码实际

> 作者: researcher
> 日期: 2026-04-16
> 状态: 完成
> 基线: C2修复后的代码

---

## C2修复确认

| C2差距 | C2状态 | C3验证结果 |
|--------|--------|-----------|
| H1 Feature/ui颜色硬编码 | **已修复** | features/ hex=0, ui/ hex=0, common/ hex=0。仅theme/(625处合规)和remotion/(23处非关键)有hex。var(--ao-*)达1375处 |
| H2 模板系统不完整 | **未修复** | 仍缺TemplateSchema/CanvasRender/设计器。template_store.rs已创建(H7)但前端未接入 |
| H3 群聊Agent协作 | **未修复** | GroupChat.tsx仍仅FR613-FR619，FR631-FR649未实现 |
| H4 部门组件测试 | **部分修复** | departmentComponents.test.ts(29断言)新增。单元46文件/3228断言 |
| H5 问题中心 | **已修复** | ProblemCenter.tsx已创建，集成panel/index.ts |
| H6 自定义字段 | **未修复** | 无CustomField/AI字段感知代码 |
| H7 模板存储SQLite | **部分修复** | template_store.rs已创建(Rust后端)，但前端templateVersionStore.ts仍用localStorage |
| H8 消息状态追踪 | **未修复** | MessageStatus类型在message.types.ts中存在，但无专门UI组件 |
| H9 工作场景恢复 | **未修复** | layoutPresetStore存在但不完整 |
| H10 审计SIEM导出 | **未修复** | 基础已具备，缺SIEM |

---

## 颜色系统进展（C1→C2→C3）

| 指标 | C1前 | C1后 | C2后 | C3(当前) |
|------|------|------|------|---------|
| var(--ao-*) 使用 | 9文件/156处 | 56文件/847处 | 98文件/848处 | **1375处** |
| 硬编码hex | 135文件/1350处 | 98文件/848处 | 56文件/847处 | **649处(全合规)** |
| features/ hex | 86处 | 86处 | 0 | **0** |
| ui/ hex | 170处 | 170处 | 0 | **0** |
| common/ hex | ~200处 | 0 | 0 | **0** |

**结论：** 颜色硬编码问题已**实质解决**。剩余649处hex全部在theme/定义文件(625合规)和remotion/(23非关键)中。

---

## TOP 10 C3 差距

| # | 维度 | 严重度 | 差距描述 | 铁律来源 | 代码现状 | 修复建议 |
|---|------|--------|---------|---------|---------|---------|
| I1 | 模板系统 | **HIGH** | 缺TemplateSchema+Canvas渲染+设计器+数据绑定。PRD FR1200-FR1302(90条)大部分未实现 | PRD FR1200-FR1302; 架构ADR-035/036/037 | editorRegistry+templateVersionStore(localStorage)+template_store.rs(后端) | 实现Schema→数据绑定→Canvas→设计器 |
| I2 | 群聊Agent协作 | **HIGH** | FR631-FR649(19条)全部未实现。Agent入群/静默/@提及/任务通知/数据卡片 | PRD FR631-FR649 | GroupChat.tsx仅FR613-FR619 | 实现FR634→639→641→640→642-645 |
| I3 | 模板前端接SQLite | **HIGH** | Rust template_store.rs已创建但前端仍用localStorage | 架构ADR-003本地优先 | templateVersionStore.ts用localStorage | 接入Tauri IPC调用template_store |
| I4 | 自定义字段系统 | **MEDIUM** | PRD定义"自定义字段与AI字段感知"能力，代码无实现 | PRD补充章节 | workspace/types有CustomFieldHint但无实现 | 实现字段Schema+AI感知+动态表单 |
| I5 | 消息状态追踪UI | **MEDIUM** | MessageStatus类型存在但无专门UI组件(已发送/已送达/已读) | PRD FR622-FR630 | message.types.ts有类型定义，无组件 | 实现MessageStatusIndicator+ReadReceipt |
| I6 | 部门组件测试完善 | **MEDIUM** | departmentComponents.test.ts(29断言)新增但覆盖不足。核心业务组件(render/交互)测试仍缺 | 测试规范>=80% | 46文件/3228断言，部门组件测试不足 | 补充EmployeeList/SalesPilot/ApprovalFlow等测试 |
| I7 | 工作场景恢复 | **MEDIUM** | 布局预设store存在但场景恢复(对话上下文+部门入口+最近工作区)不完整 | PRD工作台体验增强 | layoutPresetStore.ts部分布局持久化 | 完善场景保存/恢复逻辑 |
| I8 | SOUL.md解析增强 | **LOW** | SoulMdParsing.tsx存在但SOUL.md解析能力待增强(YAML frontmatter→Agent配置) | 架构ADR-038/039/040 | SoulMdParsing.tsx基础实现 | 增强YAML frontmatter解析和Agent配置映射 |
| I9 | 审计SIEM导出 | **LOW** | 基础已具备，缺外部SIEM导出和全局策略配置UI | PRD FR1500+ | audit/模块完整 | 实现SIEM webhook导出 |
| I10 | Rust cargo check | **LOW** | 需验证Rust后端编译无错误(C1/C2新增模块可能有编译问题) | 工程质量 | 未知(cargo check未执行) | 执行cargo check验证 |

---

## C2遗留验证（补充）

| C2遗留项 | 验证方法 | 验证结果 | 结论 |
|----------|---------|---------|------|
| group_agent.rs 拆分 | 文件行数统计 | `group_agent.rs`=417行 + `group_agent_types.rs`=278行 | **已拆分类型到独立文件**，主文件417行可接受，暂不需进一步拆分 |
| template_store tempfile | grep "tempfile" storage/ | `template_store.rs`使用tempfile用于测试临时数据库 | **合规**，tempfile仅用于单元测试环境，生产使用Tauri app_dir |
| baseColors.ts 注释占位 | grep "// TODO\|// FIXME\|// HACK\|// XXX" theme/colors/baseColors.ts | 0处 | **已清理**，无占位注释残留 |
| archived JSON .gitignore | grep "archived" .gitignore | 无archived相关条目 | **未处理**，但验证无archived JSON文件存在于仓库中，风险低 |
| Tailwind硬编码色(bg-[#xxx]等) | grep -r "bg-\[#\|text-\[#\|border-\[#" src/ | **0文件/0处** | **已完全修复**，团队报告的20文件/103处已清除 |
| SyncConflictDialog text-yellow-500 | grep "text-yellow" features/sync/ | 0处 | **已修复**(C2已确认) |

---

## C3 轮优先修复排序

| 序号 | 差距ID | 严重度 | 修复内容 | 预估工作量 | 涉及层 |
|------|--------|--------|---------|-----------|--------|
| 1 | I3 | HIGH | 前端模板接入SQLite(替换localStorage) | 小 | 前端+Tauri IPC |
| 2 | I1 | HIGH | 模板Schema+数据绑定层 | 大 | 前端 |
| 3 | I2 | HIGH | 群聊Agent协作(FR634→639→641) | 中 | 前端+Rust |
| 4 | I6 | MEDIUM | 部门组件测试补充 | 中 | 测试 |
| 5 | I5 | MEDIUM | 消息状态追踪UI | 中 | 前端 |
| 6 | I4 | MEDIUM | 自定义字段+AI感知 | 大 | 前端+Rust |
| 7 | I7 | MEDIUM | 工作场景恢复完善 | 中 | 前端 |
| 8 | I10 | LOW | Rust cargo check验证 | 小 | Rust |
| 9 | I8 | LOW | SOUL.md解析增强 | 小 | 前端 |
| 10 | I9 | LOW | 审计SIEM导出 | 小 | Rust |

---

## 正面发现（C2修复后新增合规项）

1. **颜色系统全面修复**：features/ hex=0, ui/ hex=0, common/ hex=0。var(--ao-*)达1375处
2. **ProblemCenter**：ProblemCenter.tsx已创建，集成panel
3. **部门组件测试**：departmentComponents.test.ts(29断言)新增
4. **C1修复E2E验证**：c1-gap-fix.spec.ts(48断言)验证C1修复项
5. **template_store.rs**：Rust后端模板存储已创建

---

## 标签

[RESEARCH] [ARCHITECTURE] [GAP-ANALYSIS] [C3]
