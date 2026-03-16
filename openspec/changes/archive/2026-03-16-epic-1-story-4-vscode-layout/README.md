# Epic 1, Story 1.4: 类VSCode四栏布局

## 概述

实现类 VSCode 风格的四栏布局界面，包括活动栏、侧边栏、工作区和 AI 对话面板，为用户提供简洁专业、功能区域清晰的使用体验。

## 铁律映射

### PRD 需求
- **FRs**: FR2（用户可以自定义调整界面面板大小和布局）
- **NFRs**: NFR1（本地操作响应时间<100ms）

### 架构需求
- **ADR-001**: 采用分层微内核架构

### UX 需求
- **UX-01**: 核心框架 React + TypeScript
- **UX-02**: 透明可控原则
- **UX-03**: 零学习成本原则
- **UX-04**: 即时价值原则

## 验收标准

### AC1: 四栏布局显示
- **Given** 用户登录成功
- **When** 进入主界面
- **Then** 显示四栏布局：
  - 活动栏（最左侧，48px 固定）
  - 侧边栏（200-280px，可折叠）
  - 工作区（自适应）
  - AI 对话面板（右侧，300-500px，可折叠）
- **And** 每个面板可以拖拽调整大小
- **And** 面板折叠/展开动画流畅

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
