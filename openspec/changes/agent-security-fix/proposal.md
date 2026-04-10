# Agent模块安全漏洞修复

## Overview

修复Agent模块中发现的安全漏洞，包括XSS风险、敏感数据存储问题和SQL拼接注入风险。

## Motivation

代码扫描发现以下安全漏洞需要立即修复：
1. **XSS漏洞**: `ChatMessage.tsx` 使用 `dangerouslySetInnerHTML` 可能导致XSS攻击
2. **敏感数据存储**: `useCheckpointStore.ts` 使用 localStorage 存储敏感数据
3. **SQL注入风险**: `personal_loader.rs` 使用字符串拼接SQL

## Specification

### 1. XSS漏洞修复

**问题位置**: `src/features/agent/components/ChatMessage.tsx:80`

**修复方案**:
- 添加 `sanitize-html` 依赖
- 在渲染markdown前进行XSS过滤
- 使用安全的markdown渲染库

**实现步骤**:
1. 添加依赖: `npm install sanitize-html`
2. 创建 `src/lib/sanitize.ts` 工具函数
3. 修改 `ChatMessage.tsx` 使用安全的渲染方式

### 2. 敏感数据存储修复

**问题位置**: `src/features/agent/hooks/useCheckpointStore.ts:980`

**修复方案**:
- 评估存储数据类型
- 将敏感数据移至内存或加密存储
- 使用 Tauri's secure storage 替代 localStorage

**实现步骤**:
1. 审查存储的checkpoint数据类型
2. 判断是否包含敏感信息
3. 如包含，使用 Tauri secure storage 或 sessionStorage
4. 添加数据过期机制

### 3. SQL注入风险修复

**问题位置**: `src-tauri/src/agent/subagent/personal_loader.rs`

**修复方案**:
- 使用参数化查询替代字符串拼接
- 添加SQL注入测试

**实现步骤**:
1. 识别所有使用format!拼接SQL的位置
2. 重构为 sqlx 参数化查询
3. 添加单元测试验证安全性

## Files to Modify

### Frontend
- `src/features/agent/components/ChatMessage.tsx` - 修复XSS
- `src/features/agent/hooks/useCheckpointStore.ts` - 修复敏感数据存储
- `src/lib/sanitize.ts` (new) - XSS过滤工具

### Backend
- `src-tauri/src/agent/subagent/personal_loader.rs` - SQL重构

## Dependencies

- Frontend: `sanitize-html` npm包

## Testing

1. XSS测试: 验证恶意脚本无法执行
2. SQL注入测试: 使用SQL注入payload验证
3. 回归测试: 确保markdown渲染正常
