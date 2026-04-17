# 规格文档 - 存储模块类型完善

## StorageItem接口

```typescript
interface StorageItem<T = unknown> {
  key: string;
  value: T;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

## StorageOptions接口

```typescript
interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiresIn?: number;
}
```

## 验收标准

1. 类型定义完整
2. 前后端类型一致
