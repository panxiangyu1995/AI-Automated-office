## 1. 基础设施准备

- [x] 1.1 创建 `src/features/agent/services/compact/` 目录结构
- [x] 1.2 创建 `src/features/agent/services/compact/businessMemory.ts` - 业务记忆存储模块
- [x] 1.3 创建 `src/features/agent/types/compact.types.ts` - 业务压缩类型定义
- [x] 1.4 创建 `src/features/agent/services/compact/prompts.ts` - 9+X 段式压缩提示词模板
- [x] 1.5 创建 `src/features/agent/services/compact/constants.ts` - 压缩配置常量

## 2. 业务 Never Compress 规则实现

- [x] 2.1 实现 `NEVER_COMPRESS_TYPES` 定义
- [x] 2.2 实现 `COMPRESSIBLE_TYPES` 定义
- [x] 2.3 实现 `CompressibilityDecision` 接口和决策函数
- [x] 2.4 实现用户显式引用检测
- [x] 2.5 实现审批状态保留逻辑
- [x] 2.6 实现部门上下文保留逻辑
- [x] 2.7 编写 Never Compress 规则单元测试

## 3. 业务记忆压缩层实现

- [x] 3.1 实现 `BusinessSessionMemory` 数据结构
- [x] 3.2 实现 `BusinessSessionMemoryService` 服务类
- [x] 3.3 实现会话记忆提取和更新逻辑
- [x] 3.4 实现基于会话记忆的轻量级压缩
- [x] 3.5 编写业务记忆压缩层单元测试

## 4. 业务微压缩层实现

- [x] 4.1 实现 `BusinessMicroCompactService` 服务类
- [x] 4.2 实现清理规则引擎（过期时间判断）
- [x] 4.3 实现内容摘要生成
- [x] 4.4 实现最近结果保留逻辑
- [x] 4.5 实现微压缩执行流程
- [x] 4.6 编写微压缩层单元测试

## 5. 业务全量压缩层实现

- [x] 5.1 实现 `BusinessFullCompactService` 服务类
- [x] 5.2 实现 9+X 段式摘要生成
- [x] 5.3 实现部门上下文段格式化
- [x] 5.4 实现审批链状态段格式化
- [x] 5.5 实现关联文档段格式化
- [x] 5.6 实现跨部门依赖段格式化
- [x] 5.7 实现业务规则应用段格式化
- [x] 5.8 编写业务全量压缩层单元测试

## 6. 业务响应式压缩层实现

- [x] 6.1 实现 `BusinessReactiveCompactService` 服务类
- [x] 6.2 实现渐进式删除策略（4 个 Phase）
- [x] 6.3 实现 Never Compress 保护检查
- [x] 6.4 实现重试机制（最多 3 次）
- [x] 6.5 实现压缩历史记录
- [x] 6.6 编写响应式压缩层单元测试

## 7. 多维度触发器实现

- [x] 7.1 实现 `BusinessCompactTrigger` 类型定义
- [x] 7.2 实现 `TriggerState` 状态管理
- [x] 7.3 实现 Token 阈值检测
- [x] 7.4 实现部门切换监听
- [x] 7.5 实现审批状态变更监听
- [x] 7.6 实现时效触发检测
- [x] 7.7 实现手动触发入口
- [x] 7.8 实现触发去重逻辑
- [x] 7.9 编写触发器单元测试

## 8. 压缩恢复机制实现

- [x] 8.1 实现 `RecoveryService` 服务类
- [x] 8.2 实现自动恢复规则引擎
- [x] 8.3 实现手动恢复命令解析
- [x] 8.4 实现恢复优先级队列
- [x] 8.5 实现多数据源恢复（数据库、消息历史）
- [x] 8.6 实现恢复缓存（LRU，5 分钟有效期）
- [x] 8.7 实现恢复结果格式化展示
- [x] 8.8 实现恢复失败处理
- [x] 8.9 编写恢复机制单元测试

## 9. 前端集成

- [ ] 9.1 创建 `useBusinessCompression` Hook
- [ ] 9.2 创建 `CompressionStatus` 组件（状态指示器）
- [ ] 9.3 创建 `CompressionHistory` 组件（历史查看）
- [ ] 9.4 在 `AiChatPanel` 中集成压缩状态显示
- [ ] 9.5 添加"压缩上下文"按钮到工具栏
- [ ] 9.6 实现快捷键 `Ctrl+Shift+C` 触发
- [ ] 9.7 编写前端集成测试

## 10. 后端集成

- [ ] 10.1 在 Rust 端扩展 `context_compression.rs`
- [ ] 10.2 实现压缩配置同步（前端配置 -> Rust 配置）
- [ ] 10.3 实现压缩事件 emit 到前端
- [ ] 10.4 实现 Token 计算优化
- [ ] 10.5 编写后端集成测试

## 11. 端到端测试

- [ ] 11.1 编写业务记忆压缩 E2E 测试
- [ ] 11.2 编写微压缩 E2E 测试
- [ ] 11.3 编写业务全量压缩 E2E 测试
- [ ] 11.4 编写响应式压缩 E2E 测试
- [ ] 11.5 编写触发器 E2E 测试
- [ ] 11.6 编写恢复机制 E2E 测试

## 12. 性能测试和调优

- [ ] 12.1 执行压缩性能基准测试
- [ ] 12.2 优化压缩响应时间（目标 < 3s）
- [ ] 12.3 验证压缩比例（目标 >= 60%）
- [ ] 12.4 内存占用测试
- [ ] 12.5 根据测试结果调整阈值配置

## 13. 文档和发布

- [ ] 13.1 更新 README 文档（新增压缩机制说明）
- [ ] 13.2 编写用户指南（压缩功能使用说明）
- [ ] 13.3 更新 API 文档（如有）
- [ ] 13.4 提交所有变更
