# 任务清单 - Agent前端集成完善

## 前置条件

- [ ] 认证模块可用

## 任务步骤

### 步骤1: 检查认证模块

- [ ] 查看 `src/features/auth/` 认证模块
- [ ] 确定用户上下文获取方式

### 步骤2: 修改AgentChatPanel

- [ ] 添加用户上下文获取
- [ ] 使用真实tenantId和userId
- [ ] 移除硬编码

### 步骤3: 完善错误处理

- [ ] 添加错误分类
- [ ] 实现友好错误提示

### 步骤4: 验证

- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功

## 验收标准

1. Agent使用真实用户信息
2. 无硬编码的tenantId/userId
3. 错误处理完善
