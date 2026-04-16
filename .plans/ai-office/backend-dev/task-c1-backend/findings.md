# C1 后端开发 - 发现记录

## 差距分析关键发现

### G3: DashScope 适配器
- 现有 llm_provider/ 缺少 dashscope.rs
- failover.rs 中有 dashscope 引用，但仅为故障转移配置
- DashScope 兼容 OpenAI 格式，可复用 openai_compatible 基座

### G2: 部门工具注册
- Finance 已完整实现: tools/ 下 query/aggregate/mutate/ocr/export_report + register.rs
- HR/Sales/Approval/Warehouse/Service 仅有 commands.rs，无 tools/ 子目录
- 需要为每个部门创建5个工具+register.rs

### G4: 通用数据同步
- sync/ 仅含 message_sync.rs + offline_queue.rs + mod.rs
- ConflictResolution 枚举已有4种策略，但仅用于消息
- 缺少通用 SyncEngine trait 和业务数据同步支持
