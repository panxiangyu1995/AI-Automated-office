# Tasks: MCP工具Approve策略系统

## Implementation Tasks

### Phase 1: 后端
- [x] 扩展 McpApprovePolicy 模型
- [x] 实现策略检查流程（Ruleset已有基础）
- [x] 实现批量配置
- [x] 实现AI推荐（框架已实现）
- [x] 实现临时批准
- [x] 实现决策日志
- [x] 注册命令

### Phase 2: 前端
- [ ] 创建策略配置UI
- [ ] 创建批量配置向导
- [ ] 创建审批对话框
- [ ] 集成到设置页面

### Phase 3: 集成测试
- [ ] 策略检查测试
- [ ] 批量配置测试
- [ ] 决策日志测试

## Verification
- [ ] cargo build 成功
- [ ] npm run lint 成功
- [ ] npm run build 成功
- [ ] 功能测试通过

## Dependencies
- Story 21.4: MCP协议基础
- 已有 Ruleset 后端

## Notes
- AI推荐需要调用LLM
- 需要与Ruleset系统集成
