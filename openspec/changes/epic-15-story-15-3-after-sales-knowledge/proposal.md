# Epic 15 Story 15.3: After-sales 知识库集成

## Why

维修经验是企业宝贵的知识资产。通过将维修经验自动保存到知识库，可以：
- 实现经验复用，减少重复问题处理时间
- 培训新员工，快速上手
- 形成最佳实践库

## What Changes

实现售后维修经验自动保存到知识库功能：
- 维修完成后自动提取经验摘要
- 提交知识审核流程
- 与知识库模块集成

## Capabilities

### New Capabilities
- `after-sales-knowledge`: 维修经验自动保存到知识库

### Modified Capabilities
- 无

## Impact
- 前端：新增知识贡献面板
- 后端：扩展service模块知识提交逻辑
- 依赖：knowledge模块已完成
