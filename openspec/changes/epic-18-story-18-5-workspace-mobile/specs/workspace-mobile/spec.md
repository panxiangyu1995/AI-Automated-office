# Specifications: Workspace 工作台移动端适配

## workspace-mobile

### Description

工作台移动端适配。

### Schema

```typescript
interface MobileWorkspaceConfig {
  compact_mode: boolean;
  show_tabs: boolean;
  swipe_enabled: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/workspace/config/mobile` | 获取移动端配置 |
| PUT | `/api/workspace/config/mobile` | 更新移动端配置 |
