# Proposal: Personal Agent本地存储

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/settings/components/PersonalAgentManager.tsx`
后端模块已存在：`src-tauri/src/agent/subagent/personal_loader.rs`

**缺失部分**：与主 Agent 集成、权限继承上限。

## 目标

实现 Personal Agent (ADR-059)：
1. 实现 Personal Agent 创建
2. 实现本地存储隔离
3. 实现权限继承上限
4. 实现与主 Agent 切换
5. 完善 Personal Agent UI

## 影响范围

### 前端
- `src/features/settings/components/PersonalAgentManager.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/agent/subagent/personal_loader.rs` - 扩展现有模块

## 依赖

- **前置依赖**: Task 174 (SubAgent主Agent集成)

## 验收标准

1. Personal Agent 能够创建
2. 本地存储能够隔离
3. 与主 Agent 能够切换
