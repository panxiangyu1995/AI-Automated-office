# README: workbench-tab-shortcuts

## 概述

实现 Tab 键盘快捷键支持，包括切换、关闭、新建等操作。

## 规范依据

依据 UX 设计规范 **"工作台层级导航体系 (L1–L4)"** 中 L3 多标签页规范：

> **标签页行为：**
> - 切换标签：点击 Tab 或使用 `Ctrl+Tab` / `Ctrl+Shift+Tab` 快捷键
> - 关闭标签：点击 `×` 关闭当前 Tab，支持 `Ctrl+W` 关闭

## 核心变更

1. 注册全局键盘快捷键
2. 实现 Tab 快捷键处理逻辑
3. 添加快捷键覆盖检测

## 依赖

- 前置依赖: `workbench-tab-system`（需先实现 Tab 基础功能）
