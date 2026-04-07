# Proposal: 消息搜索与筛选增强

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：
- `src/features/agent/components/MessageSearchManager.tsx`
- `src-tauri/src/message/` - 消息后端

**缺失部分**：全文搜索索引、多维度筛选、置顶收藏、导出功能。

## 目标

实现消息搜索增强 (FR611-FR614)：
1. 实现全文搜索索引
2. 实现多维度筛选 API
3. 实现消息置顶收藏
4. 实现消息导出功能

## 影响范围

### 前端
- `src/features/agent/components/MessageSearchManager.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/message/` - 扩展现有模块

## 依赖

- **前置依赖**: Task 153 (统一消息通知系统)

## 验收标准

1. 消息能够被全文搜索
2. 多维度筛选能够工作
3. 消息能够被置顶收藏
