# Epic 56, Story 56.2: 类型定义统一

## 概述

统一代码库中重复的类型定义，如ToolCategory、StepStatus等在不同模块的定义。

## 实现类型
- **类型**: polish
- **优先级**: low
- **阶段**: 技术债务与优化

## 铁律映射

### PRD 需求
- **FRs**: 无
- **NFRs**: NFR22

### 架构需求
- **ARCH**: 无

### UX 需求
- **UX**: 无

## 验收标准

1. 梳理代码库中的重复类型定义
2. 创建统一的types目录和共享类型定义
3. 统一ToolCategory类型定义
4. 统一StepStatus/TaskStatus类型定义
5. 更新所有引用到统一类型

## 依赖

无前置依赖

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic文档: `_bmad-output/planning-artifacts/epics.md`
