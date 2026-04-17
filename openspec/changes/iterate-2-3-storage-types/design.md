# 设计文档 - 存储模块类型完善

## 涉及文件

### 新增
- `src/types/storage.ts` - 存储类型定义

## 修改方案

### 1. 创建存储类型定义

```typescript
export interface StorageItem<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiresIn?: number; // 秒
}
```
