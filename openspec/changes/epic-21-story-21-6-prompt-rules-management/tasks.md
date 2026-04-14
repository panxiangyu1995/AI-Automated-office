# Tasks: 系统提示词与Rules规则管理

## Implementation Tasks

### Phase 1: 后端
- [x] 实现提示词版本模型
- [x] 实现版本管理和回滚（PromptBuilder已有）
- [x] 实现模板管理
- [x] 实现Rules规则扩展（Ruleset已有）
- [x] 实现调试模式
- [x] 注册命令

### Phase 2: 前端
- [ ] 创建提示词编辑器
- [ ] 创建版本列表
- [ ] 创建Rules管理UI
- [ ] 创建调试面板
- [ ] 集成到设置页面

### Phase 3: 集成测试
- [ ] 版本回滚测试
- [ ] Rules规则测试
- [ ] 调试模式测试

## Verification
- [ ] cargo build 成功
- [ ] npm run lint 成功
- [ ] npm run build 成功
- [ ] 功能测试通过

## Dependencies
- Story 21.3: Agent配置基础
- 已有 PromptBuilder 后端

## Notes
- 需要支持AB测试对比
- Token统计需要调用LLM API
