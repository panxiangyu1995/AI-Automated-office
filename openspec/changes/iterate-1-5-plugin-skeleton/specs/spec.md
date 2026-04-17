# 规格文档 - 插件骨架代码

## Plugin接口

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  entry: string;
  permissions: string[];
  dependencies: string[];
  components?: {
    main?: React.ComponentType;
    [key: string]: React.ComponentType | undefined;
  };
  hooks?: PluginLifecycleHooks;
}
```

## manifest.json格式

```json
{
  "id": "string (required)",
  "name": "string (required)",
  "version": "string (semver)",
  "description": "string",
  "entry": "string (入口文件路径)",
  "permissions": ["string"],
  "dependencies": ["string"],
  "author": "string",
  "homepage": "string"
}
```

## 验收标准

1. manifest.json符合格式规范
2. Plugin接口类型完整
3. 插件可被正确加载
4. 组件可被正确渲染
