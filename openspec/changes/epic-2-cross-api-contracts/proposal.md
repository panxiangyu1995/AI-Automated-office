# Proposal: API Contracts

## 变更类型
- [x] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

Epic 2 涉及认证、用户、组织、权限、审计、导入导出等多个 API 模块，需要统一请求/响应结构与错误契约，确保前后端接口一致。

## 目标

1. 定义 Epic 2 核心 API 请求/响应 DTO
2. 定义统一错误码与 403 响应契约
3. 定义分页与筛选契约
4. 补充个人信息（FR105）查看与编辑 API 契约
5. 同步 TypeScript 类型定义

## 范围

### 包含
- Auth API 定义
- Profile API 定义（个人信息查看与编辑）
- User API 定义
- Role API 定义
- Department API 定义
- Audit API 定义
- 统一错误码定义
- TypeScript 类型生成

### 不包含
- API 实现代码

## 依赖关系

### 前置依赖
- 无（可并行准备）

### 后置依赖
- Epic 2 中所有依赖 API 契约的 Story
