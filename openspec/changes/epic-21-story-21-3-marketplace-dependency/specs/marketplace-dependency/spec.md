# Specifications: Marketplace 插件依赖管理

## marketplace-dependency

### Schema

```typescript
interface DependencyResolution {
  can_install: boolean;
  to_install: string[];
  conflicts: DependencyConflict[];
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/marketplace/dependencies/resolve | 解析依赖 |
| GET | /api/marketplace/dependencies/conflicts | 检查冲突 |
