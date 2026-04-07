# Proposal: 统一消息系统群聊功能

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前统一消息系统已完成基础消息API：
- `src-tauri/src/message/` - 基础消息模块
- `src-tauri/src/agent/intercom.rs` - Agent通信模块（Task 166）

**缺失部分**：群聊功能、Agent跟随入群、@提及响应。

## 目标

实现群聊功能（FR631-FR649）：
1. 群组CRUD管理
2. 成员邀请/移除
3. Agent跟随入群
4. @提及检测和响应
5. 群消息推送

## 范围

### 包含
- 群组数据模型
- 群组CRUD API
- 成员管理API
- Agent跟随入群逻辑
- @提及检测和响应
- 群消息推送

### 不包含
- 群聊UI实现（由前端负责）
- 群视频/音频通话

## 影响范围

### 后端
- `src-tauri/src/message/group.rs` - 群组模块
- `src-tauri/src/message/group_member.rs` - 成员管理
- `src-tauri/src/agent/intercom.rs` - Agent群聊响应

## 依赖

- **前置依赖**: Task 153 (统一消息通知系统), Task 166 (Agent-to-Agent通信)
- **后置依赖**: Task 167完成

## 验收标准

1. 用户可以创建群组并设置名称和公告
2. 群主可以邀请/移除群成员
3. 员工入群时，其Agent自动跟随入群
4. 被@提及时Agent代为回答
5. 群内Agent消息有明确标识
