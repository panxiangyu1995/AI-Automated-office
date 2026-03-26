# Epic 51, Story 51.2: 主Agent协调器 - 流式事件总线集成

## 概述

实现前后端流式事件总线，支持思考过程、工具调用状态、执行进度的实时推送与前端展示。

## 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成

## 铁律映射

### PRD 需求
- **FRs**: FR405, FR406, FR407
- **NFRs**: NFR3, NFR16

### 架构需求
- **ARCH**: ADR-001, ADR-037

### UX 需求
- **UX**: UX-01, UX-04, UX-05

## 验收标准

1. 扩展RuntimeEventEmitter支持细粒度事件类型（thinking、tool_calling、tool_result、confirmation_needed）
2. 实现前端StreamingHostContext与后端事件流的完整对接
3. 添加思考过程的实时展示组件
4. 实现工具调用状态的实时更新与可视化
5. 添加执行进度的流式反馈

## 依赖

- Story 51.1
- Story 43.3

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic文档: `_bmad-output/planning-artifacts/epics.md`
