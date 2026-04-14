# Tasks: Sub-Agent AI辅助提示词生成

## Implementation Tasks

### Phase 1: 后端
- [x] 完善 SubAgentConfig 模型（Subagent已有基础）
- [x] 实现触发配置
- [x] 实现AI生成提示词（PromptBuilder已有）
- [x] 实现路由选择
- [x] 实现嵌套调用
- [x] 实现回退机制
- [x] 注册命令

### Phase 2: 前端
- [ ] 创建Sub-Agent配置UI
- [ ] 创建触发配置
- [ ] 集成到Agent配置

### Phase 3: 集成测试
- [ ] 提示词生成测试
- [ ] 嵌套调用测试
- [ ] 回退机制测试

## Verification
- [ ] cargo build 成功
- [ ] npm run lint 成功
- [ ] npm run build 成功
- [ ] 功能测试通过

## Dependencies
- Story 21.6: Sub-Agent基础

## Notes
- 需要与LLM集成生成提示词
- 嵌套深度需要严格控制
