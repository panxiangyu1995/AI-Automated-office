# Epic 53, Story 53.1: 提示词构建器 - 分层提示词整合

## 概述

创建提示词构建器，整合系统提示词、角色提示词、记忆、错题集规则，实现分层提示词加载策略。

## 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 3 - 记忆层与提示词集成

## 铁律映射

### PRD 需求
- **FRs**: FR440, FR441, FR442
- **NFRs**: NFR1, NFR16

### 架构需求
- **ARCH**: ADR-038, ADR-039, ADR-043

### UX 需求
- **UX**: UX-01

## 验收标准

1. 创建PromptBuilder核心类
2. 实现系统提示词与角色提示词的合并
3. 集成个人记忆（L1）到提示词上下文
4. 集成企业知识库（L2）检索结果
5. 实现错题集规则的自动注入

## 依赖

- Story 21.1
- Story 21.2
- Story 6.1
- Story 6.2
- Story 6.6

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Epic文档: `_bmad-output/planning-artifacts/epics.md`
