# Tasks: 平台级审批对象模型

## Implementation Tasks

### Phase 1: 后端
- [x] 创建 ApprovalObject 模型
- [x] 实现审批状态机（Approval基础已有）
- [x] 实现审批对象关联
- [x] 实现 Resume Gate
- [x] 实现人类审阅边界
- [x] 创建审批命令

### Phase 2: 前端
- [ ] 创建审批配置UI
- [ ] 创建审批详情页
- [ ] 集成到业务模块

### Phase 3: 集成测试
- [ ] 状态机转换测试
- [ ] Resume Gate测试
- [ ] 边界控制测试

## Verification
- [ ] cargo build 成功
- [ ] npm run lint 成功
- [ ] npm run build 成功
- [ ] 功能测试通过

## Dependencies
- Epic 46: 审批基础

## Notes
- 需要与任务系统集成
- 审批边界需要明确定义
