# Proposal: 工作卡片消息系统

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：`src/features/agent/components/WorkCardMessage.tsx`

**缺失部分**：后端卡片数据模型、生成 API、操作处理、模板系统。

## 目标

实现工作卡片消息 (FR607-FR614)：
1. 创建工作卡片数据模型
2. 实现卡片生成 API
3. 实现卡片操作处理
4. 实现操作结果反馈
5. 实现卡片模板系统

## 影响范围

### 前端
- `src/features/agent/components/WorkCardMessage.tsx` - 集成后端 API

### 后端
- 新增工作卡片模块

## 依赖

- **前置依赖**: Task 166 (Agent-to-Agent通信后端集成)

## 验收标准

1. 工作卡片能够正确生成
2. 卡片操作能够被处理
3. 操作结果能够反馈给用户
