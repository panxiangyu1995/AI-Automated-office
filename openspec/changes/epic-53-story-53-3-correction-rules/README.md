# Epic 53, Story 53.3: 错题集规则自动应用

## 概述

实现错题集规则在Agent执行过程中的自动检索和应用，基于场景匹配相关规则。

## 实现类型
- **类型**: new
- **优先级**: medium
- **阶段**: Phase 3 - 记忆层与提示词集成

## 铁律映射

### PRD 需求
- **FRs**: FR446, FR447
- **NFRs**: NFR1, NFR16

### 架构需求
- **ARCH**: ADR-043

### UX 需求
- **UX**: UX-01

## 验收标准

1. 创建CorrectionRuleMatcher规则匹配器
2. 实现基于当前任务场景的错题集检索
3. 实现匹配规则的提示词注入
4. 添加规则应用的审计记录
5. 实现规则效果的反馈收集

## 依赖

- Story 53.1
- Story 6.6

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic文档: `_bmad-output/planning-artifacts/epics.md`
