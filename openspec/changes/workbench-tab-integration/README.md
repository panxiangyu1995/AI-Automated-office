# README: workbench-tab-integration

## 概述

将 Tab 系统与路由系统集成，实现通过路由打开 Tab、AI 导航打开 Tab 等功能。

## 规范依据

依据 UX 设计规范 **"工作台层级导航体系 (L1–L4)"** 中 L3 工作区与路由系统的集成要求。

## 核心变更

1. 实现路由到 Tab 的映射
2. 实现 AI 导航打开 Tab
3. 实现 Tab 与路由同步

## 依赖

- 前置依赖: `workbench-tab-system`（需先实现 Tab 基础功能）
- 并行: `workbench-tab-shortcuts`
