# Specification: Agent记忆模块架构优化 - 阶段1

## 需求来源

- **架构约束**: ARCH-044 - SQLite + FTS5 + sqlite-vec MVP存储方案
- **ADR-043**: Hook无感摄入 + 认知状态重建模式
- **ADR-034**: 关键事实自动提取到L1个人记忆层持久保存

## 约束条件

### 功能不变性
- [x] API接口保持向后兼容
- [x] 数据类型定义不变
- [x] 权限边界不变（L1本人/L2租户）
- [x] Hook事件处理逻辑不变

### 技术约束
- [x] 使用SQLite作为本地存储（ADR-044）
- [x] 支持FTS5全文搜索
- [x] 支持向量检索（sqlite-vec）
- [x] 遵循Rust异步编程模式

## 验收标准

### 架构验收
- [ ] StorageBackend trait正确定义
- [ ] PersonalMemoryStore使用SQLite持久化
- [ ] EnterpriseKnowledgeStore使用SQLite持久化
- [ ] HybridRetrievalEngine正确集成

### 功能验收
- [ ] memory_add 命令正确持久化数据
- [ ] memory_search 命令返回混合检索结果
- [ ] Hook事件触发后数据持久化
- [ ] 重启后数据不丢失

### 质量验收
- [ ] cargo clippy 无警告
- [ ] cargo test 通过
- [ ] 功能回归测试通过
