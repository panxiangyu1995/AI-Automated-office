# Design: 部门模块基础框架

## 技术方案

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    部门模块架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │ HR部门      │     │ 销售部门   │     │ 财务部门   │  │
│  │ (hr)       │     │ (sales)    │     │ (finance)  │  │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘  │
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             │                             │
│                    ┌────────▼────────┐                    │
│                    │ DepartmentLoader│                    │
│                    │  部门加载器    │                    │
│                    └────────┬────────┘                    │
│                             │                             │
│                    ┌────────▼────────┐                    │
│                    │DepartmentRegistry│                   │
│                    │  部门注册表    │                    │
│                    └─────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据模型

```typescript
// 部门能力包
interface DepartmentPackage {
  id: string;                    // 唯一标识 (UUID)
  code: DepartmentCode;           // 部门代码
  name: string;                  // 部门名称
  version: string;                // 版本号 (SemVer)
  description: string;            // 描述
  capabilities: Capability[];      // 能力列表
  dependencies: string[];         // 依赖的其他部门
  permissions: Permission[];       // 权限配置
  tools: ToolDescriptor[];        // 工具列表
  skills: SkillDescriptor[];       // 技能列表
  mcpServices: McpService[];      // MCP 服务
  routes: RouteConfig[];           // 路由配置
  entryPoints: EntryPoint[];       // 入口点
  status: 'active' | 'inactive'; // 状态
}

// 部门加载器
interface DepartmentLoader {
  load(departmentId: string): Promise<DepartmentPackage>;
  unload(departmentId: string): Promise<void>;
  getLoaded(): DepartmentPackage[];
  getAvailable(): DepartmentPackage[];
}
```

### API 设计

```typescript
// 部门管理 API
POST   /api/departments                    // 创建部门
GET    /api/departments                   // 列表部门
GET    /api/departments/:id              // 获取部门详情
PUT    /api/departments/:id              // 更新部门
DELETE /api/departments/:id              // 删除部门
GET    /api/departments/:id/capabilities // 获取部门能力
POST   /api/departments/:id/enable       // 启用部门
POST   /api/departments/:id/disable      // 禁用部门
```

### 部门间通信

```typescript
// 部门消息
interface DepartmentMessage {
  from: DepartmentCode;           // 来源部门
  to: DepartmentCode;             // 目标部门
  type: MessageType;              // 消息类型
  payload: unknown;                // 消息内容
  correlationId?: string;         // 关联 ID
  timestamp: number;               // 时间戳
}

// 消息类型
type MessageType = 
  | 'data_request'      // 数据请求
  | 'data_response'     // 数据响应
  | 'event'            // 事件通知
  | 'delegate';         // 委派请求
```

## 实现细节

### 前端结构

```
src/features/department/
├── types/
│   └── department.ts       # 类型定义
├── api/
│   └── departmentApi.ts     # API 封装
├── stores/
│   └── departmentStore.ts  # Zustand Store
├── hooks/
│   └── useDepartment.ts    # Hooks
├── components/
│   ├── DepartmentList.tsx   # 部门列表
│   ├── DepartmentCard.tsx   # 部门卡片
│   └── DepartmentDetail.tsx # 部门详情
└── index.ts
```

### 后端结构

```
src-tauri/src/department/
├── mod.rs                  # 模块导出
├── registry.rs             # 部门注册表
├── loader.rs                # 部门加载器
├── manager.rs              # 部门管理器
├── message.rs              # 部门通信
└── commands.rs             # Tauri 命令
```

## 验收标准

1. 部门注册表可以注册和查询部门
2. 部门加载器可以加载和卸载部门
3. 部门间可以发送和接收消息
4. 部门管理 UI 可以查看部门列表
5. 部门启用/禁用功能正常工作
