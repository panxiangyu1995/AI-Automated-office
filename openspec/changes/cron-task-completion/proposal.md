# Proposal: 定时任务系统完善

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前定时任务系统已具备基础 (`src-tauri/src/agent/tools/automation/`)：
- `cron_schedule.rs` - 定时任务调度
- 前端 `ScheduledTaskCenter.tsx` - 任务中心 UI

**缺失部分**：cron_cancel 取消、cron_list 列表、Skill 触发。

## 目标

完善定时任务系统 (FR15, FR1127-FR1129)：
1. cron_cancel 取消任务
2. cron_list 任务列表
3. Skill 触发定时任务
4. 任务执行结果通知
5. cron 表达式验证

## 影响范围

### 前端
- `src/features/agent/components/ScheduledTaskCenter.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/agent/tools/automation/` - 扩展现有模块
- `src-tauri/src/agent/tools/automation/cron_cancel.rs` - 新增
- `src-tauri/src/agent/tools/automation/cron_list.rs` - 新增

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 任务取消后仍执行 | 低 | 中 | 使用唯一任务 ID |
| 表达式解析错误 | 中 | 低 | 提供验证工具 |

## 依赖

- **前置依赖**: Task 171 (心跳机制后端完善)
- **后置依赖**: Task 204 (Webhook与自动化触发)

## 验收标准

1. 定时任务能够被取消
2. 任务列表能够正确展示
3. Skill 能够被定时触发
4. 执行结果能够通知用户
