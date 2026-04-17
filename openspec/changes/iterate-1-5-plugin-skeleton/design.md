# 设计文档 - 插件骨架代码

## 涉及文件

### 新增插件
- `plugins/approval/index.ts` - 审批插件入口
- `plugins/approval/manifest.json` - 审批插件清单
- `plugins/approval/package.json` - npm配置
- `plugins/approval/types.ts` - 类型定义

### 更新
- `src-tauri/src/plugins/loader.rs` - 插件加载器

## 修改方案

### 1. 插件目录结构

```
plugins/
└── approval/                 # 审批插件(示例)
    ├── index.ts             # 插件入口
    ├── manifest.json        # 插件清单
    ├── package.json         # npm配置
    ├── types.ts             # 类型定义
    ├── components/          # React组件
    │   └── ApprovalPanel.tsx
    ├── hooks/               # 插件hooks
    │   └── useApproval.ts
    └── backend/             # 后端逻辑(如需要)
        └── commands.ts
```

### 2. manifest.json格式

```json
{
  "id": "approval",
  "name": "审批中心",
  "version": "1.0.0",
  "description": "企业审批流程管理",
  "entry": "index.ts",
  "permissions": ["approval:read", "approval:write"],
  "dependencies": []
}
```

### 3. 插件入口格式

```typescript
// plugins/approval/index.ts
import type { Plugin } from '@/types/plugin';

export const approvalPlugin: Plugin = {
  id: 'approval',
  name: '审批中心',
  version: '1.0.0',
  components: {
    main: ApprovalPanel,
  },
  hooks: {
    onInit: async () => {
      // 初始化逻辑
    },
  },
};
```

## 数据流

```
Tauri启动
    ↓
PluginLoader 扫描 plugins/ 目录
    ↓
加载每个插件的 manifest.json
    ↓
验证依赖
    ↓
执行插件 onInit hook
    ↓
注册插件UI组件
    ↓
插件激活
```
