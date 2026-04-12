# README: bottom-panel-content

## 概述

实现 L4 Bottom Panel 的内容类型，包括属性面板、日志面板、诊断面板、预览面板等。

## 规范依据

依据 UX 设计规范 **"工作台层级导航体系 (L1–L4)"** 中 L4 Bottom Panel 定义：

> L4 - Bottom Panel（底部面板）
> - 展示 L3 工作区内容的更详细信息
> - 日志/诊断/属性详情/预览等

## 核心变更

1. 实现 BottomPanel 内容管理器
2. 实现多种内容类型（属性、日志、诊断、预览）
3. 与 Tab 系统集成，根据当前 Tab 显示相关内容

## 依赖

- 前置依赖: `workbench-tab-system`（需先实现 Tab 基础功能）
- 并行: `workbench-tab-integration`
