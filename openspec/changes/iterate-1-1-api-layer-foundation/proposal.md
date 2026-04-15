# Proposal: 前端API层与类型定义基础设施

## 背景

当前前端476处使用mock数据，没有统一的API调用层。所有模块直接在组件中硬编码假数据，导致：

1. 无法切换到真实后端数据
2. 类型定义分散在各组件中
3. 缺少请求状态管理（loading/error/success）

## 目标

建立统一的API基础设施，为后续所有模块的mock替换奠定基础。

## 变更内容

1. 创建 `src/lib/api/` 目录，建立统一的API客户端层
2. 创建 `src/types/api.types.ts` 统一API响应类型
3. 创建 `src/hooks/useApi.ts` 通用请求Hook（含loading/error/success状态管理）
4. 创建 `src/lib/api/endpoints.ts` API端点定义

## 预期效果

- 所有模块后续可以通过useApi Hook替代mock数据
- 统一类型的API响应处理（分页、错误、成功）
- 为后续轮次的mock替换提供基础设施

## 影响范围

- 新增文件（不修改现有文件）
- 不影响现有功能运行
