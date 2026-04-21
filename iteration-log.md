# 产品迭代日志

## 2026-04-20 迭代 v5.0 — 第5轮（Tech Debt 技术债务清理）

**目标：** 消除 pipeline.rs 开闭原则违规、大文件拆分、DualAgentProvider 集成
**方向：** 技术债务清理
**关键变更：**

- pipeline.rs 引入 TOOL_MODULES 注册表动态自注册 ✅
- filesystem.rs(793行) 拆分为 read/write/edit/dir 子模块 ✅（document.rs 837行待拆分）
- DualAgentProvider 集成到 RuntimeConfig 初始化流程 ✅

**差距变化：**

| 维度 | 前后 | 变化 |
|------|------|------|
| 技术健康度 | 4/5 → 4/5 | → 0（架构改进，分数不变） |
| 扩展准备度 | 3/5 → 4/5 | ↑+1（Round1语义路由） |

**下一轮建议：**

1. 修复 hr/commands.rs 编译错误（high priority）
2. pipeline.rs 引入 ToolModule trait 动态自注册（消除开闭原则违规）
3. document.rs 和 filesystem.rs 拆分（各 ~800 行 → 子模块）
4. DualAgentProvider 集成到 RuntimeConfig（启用 Plan/Act 双模式）
5. 完善 ProviderPool 模块（补充 failover 测试用例）

---

## 2026-04-19 迭代 v4.0 — 第4轮（记忆系统增强）

**目标：** 实现 Graph Memory Layer (L3)
**方向：** 记忆系统增强
**关键变更：**

- 实现 GraphMemoryService（实体/关系/路径查找）

**差距变化：**

| 维度 | 前后 | 变化 |
|------|------|------|
| 技术健康度 | 3/5 → 4/5 | ↑+1 |

---

## 2026-04-18 迭代 v3.0 — 第3轮（工具系统增强）

**目标：** 实现工具缓存
**方向：** 工具系统增强
**关键变更：**

- 实现 ToolCache 模块（文件/HTTP/执行结果缓存）

---

## 2026-04-17 迭代 v2.0 — 第2轮（LLM Provider 增强）

**目标：** 实现 Provider 故障转移和健康检查
**方向：** LLM Provider 增强
**关键变更：**

- 实现 ProviderPool 自动故障转移与健康检查

---

## 2026-04-16 迭代 v1.0 — 第1轮（路由系统增强）

**目标：** 实现语义路由和 LLM 引导路由
**方向：** 路由系统增强
**关键变更：**

- 实现语义路由（EmbeddingService 向量相似度）
- 实现 LLM 引导路由（RoutePromptTemplate）
- 完善意图分类器（KeywordIntentClassifier）
