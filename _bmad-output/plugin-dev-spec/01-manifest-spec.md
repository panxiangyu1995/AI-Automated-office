# 第1章：插件清单规范 (Manifest Specification)

> **plugin.json** 是插件的核心配置文件，定义了插件的基本信息、依赖、权限、入口等元数据。

---

## 1.1 概述

每个插件必须在根目录下包含一个 `plugin.json` 文件。系统通过此文件识别和加载插件。

---

## 1.2 基本信息字段

```json
{
  "$schema": "https://ai-automated-office.com/schemas/plugin.json",
  
  "id": "sales",
  "name": "销售部",
  "version": "1.0.0",
  "description": "销售管理模块，支持客户管理、合同管理、订单管理、销售自动化",
  "author": "AI-Automated-office Team",
  "license": "MIT",
  "type": "core",
  "icon": "briefcase",
  
  "compatibility": {
    "platformVersion": ">=1.0.0",
    "runtime": "tauri"
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `$schema` | string | 否 | JSON Schema 引用，用于IDE校验 |
| `id` | string | ✅ | 插件唯一标识，小写字母+连字符，如 `sales`, `hr` |
| `name` | string | ✅ | 插件显示名称，支持中文 |
| `version` | string | ✅ | 语义化版本号，格式：`major.minor.patch` |
| `description` | string | ✅ | 插件功能描述 |
| `author` | string | 否 | 作者信息 |
| `license` | string | 否 | 开源协议 |
| `type` | enum | ✅ | 插件类型：`core` / `standard` / `extension` |
| `icon` | string | 否 | 图标名称（Lucide图标） |
| `compatibility` | object | 否 | 兼容性声明 |

### ID命名规范

- 只能包含小写字母、数字、连字符
- 必须以字母开头
- 长度限制：2-32字符
- 全局唯一，不可重复

```
✅ 正确示例：
- sales
- hr
- after-sales
- warehouse-management

❌ 错误示例：
- Sales        (大写)
- 销售部        (中文)
- 1sales       (数字开头)
- sales_dept   (下划线)
```

---

## 1.3 依赖声明

### 1.3.1 平台依赖

```json
{
  "compatibility": {
    "platformVersion": ">=1.0.0 <2.0.0",
    "runtime": "tauri",
    "minTauriVersion": "2.0.0"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `platformVersion` | string | 支持的平台版本范围（语义化版本） |
| `runtime` | string | 运行时环境：`tauri` / `web` |
| `minTauriVersion` | string | 最低Tauri版本要求 |

### 1.3.2 插件依赖

```json
{
  "dependencies": {
    "hr": ">=1.0.0",
    "warehouse": ">=1.0.0 <2.0.0"
  },
  
  "peerDependencies": {
    "approval": ">=1.0.0"
  },
  
  "optionalDependencies": {
    "finance": ">=1.0.0"
  }
}
```

| 类型 | 说明 |
|------|------|
| `dependencies` | 强制依赖，安装时必须存在 |
| `peerDependencies` | 对等依赖，依赖方提供 |
| `optionalDependencies` | 可选依赖，增强功能 |

### 版本范围语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `1.0.0` | 精确版本 | 只兼容 1.0.0 |
| `>=1.0.0` | 最低版本 | 1.0.0 及以上 |
| `<2.0.0` | 最高版本 | 低于 2.0.0 |
| `>=1.0.0 <2.0.0` | 范围 | 1.x 版本 |
| `~1.0.0` | 补丁级别兼容 | 1.0.x |
| `^1.0.0` | 次版本兼容 | 1.x |

---

## 1.4 权限声明

### 1.4.1 权限字段结构

```json
{
  "permissions": {
    "required": [
      "hr:employee:read",
      "hr:department:read"
    ],
    "optional": [
      "finance:invoice:write"
    ]
  }
}
```

### 1.4.2 权限命名规范

格式：`{plugin}:{entity}:{action}`

```
示例：
- hr:employee:read       # 人事_员工_读取
- hr:employee:write      # 人事_员工_写入
- finance:invoice:read   # 财务_发票_读取
- finance:invoice:delete # 财务_发票_删除
- sales:contract:*       # 销售_合同_全部权限
```

### 1.4.3 权限级别

| 级别 | 说明 | 用户可见性 |
|------|------|-----------|
| `required` | 必需权限，无此权限插件无法运行 | 安装时必须确认 |
| `optional` | 可选权限，增强功能 | 安装时可选确认 |

### 1.4.4 权限分组

```json
{
  "permissions": {
    "groups": {
      "basic": {
        "description": "基础功能权限",
        "permissions": ["hr:employee:read"]
      },
      "sensitive": {
        "description": "敏感数据权限",
        "permissions": ["finance:invoice:write"],
        "requiresApproval": true
      },
      "admin": {
        "description": "管理权限",
        "permissions": ["hr:employee:delete"],
        "requiresAdmin": true
      }
    }
  }
}
```

---

## 1.5 数据访问声明

```json
{
  "dataAccess": {
    "models": ["contract", "order", "customer", "quote"],
    
    "externalModels": [
      {
        "plugin": "hr",
        "models": ["employee", "department"],
        "access": "read"
      },
      {
        "plugin": "warehouse",
        "models": ["inventory"],
        "access": "read"
      }
    ],
    
    "storage": {
      "type": "sqlite",
      "migration": "auto"
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `models` | 本插件定义的数据模型 |
| `externalModels` | 需要访问的其他插件数据 |
| `storage.type` | 存储类型：`sqlite` / `memory` |
| `storage.migration` | 迁移策略：`auto` / `manual` |

---

## 1.6 入口声明

### 1.6.1 主入口

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### 1.6.2 UI入口

```json
{
  "ui": {
    "entry": "./ui/index.tsx",
    
    "routes": [
      { "path": "/sales", "component": "Dashboard", "title": "销售概览" },
      { "path": "/sales/contracts", "component": "Contracts", "title": "合同管理" },
      { "path": "/sales/orders", "component": "Orders", "title": "订单管理" }
    ],
    
    "sidebar": {
      "title": "销售管理",
      "icon": "briefcase",
      "order": 2,
      "items": [
        { "title": "销售概览", "path": "/sales", "icon": "layout-dashboard" },
        { "title": "合同管理", "path": "/sales/contracts", "icon": "file-text" },
        { "title": "订单管理", "path": "/sales/orders", "icon": "shopping-cart" }
      ]
    }
  }
}
```

### 1.6.3 工具入口（混合架构）

工具层支持三种类型：**Native**、**CLI**、**MCP**

```json
{
  "tools": {
    "native": {
      "register": ["query", "aggregate", "mutate", "action", "export"],
      "public": ["query", "aggregate"],
      "descriptions": {
        "query": "查询销售部数据（合同、订单、客户、报价单）",
        "aggregate": "统计聚合销售数据，支持按销售/客户/时间分组",
        "mutate": "创建、更新、删除销售数据",
        "action": "执行销售业务操作",
        "export": "导出销售报表（Excel/PDF）"
      }
    },
    
    "cli": {
      "tools": [
        {
          "name": "image_process",
          "command": "cli-anything-gimp",
          "skillFile": "./skills/gimp-skill.md",
          "description": "图像处理工具",
          "timeout": 30000
        }
      ]
    },
    
    "mcp": {
      "services": ["xianyu-adapter", "dingtalk-adapter"]
    }
  }
}
```

### 1.6.4 CLI 工具配置

```json
{
  "cli": {
    "tools": [
      {
        "name": "image_process",
        "command": "cli-anything-gimp",
        "skillFile": "./skills/gimp-skill.md",
        "description": "图像处理工具（模糊、锐化、裁剪等）",
        "timeout": 30000,
        "jsonOutput": true,
        "envVars": ["GIMP_PATH"]
      },
      {
        "name": "audio_process",
        "command": "cli-anything-audacity",
        "skillFile": "./skills/audacity-skill.md",
        "description": "音频处理工具",
        "timeout": 60000
      }
    ]
  }
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `name` | string | ✅ | 工具名称，用于 Agent 调用 |
| `command` | string | ✅ | CLI 命令名称 |
| `skillFile` | string | ✅ | SKILL.md 文件路径 |
| `description` | string | ✅ | 工具描述 |
| `timeout` | number | 否 | 超时时间（毫秒），默认 30000 |
| `jsonOutput` | boolean | 否 | 是否强制 JSON 输出，默认 true |
| `envVars` | string[] | 否 | 需要的环境变量 |

### 1.6.5 MCP 服务配置

```json
{
  "mcp": [
    {
      "id": "xianyu-adapter",
      "name": "闲鱼平台接入",
      "protocol": "mcp",
      "version": "1.0.0",
      "config": {
        "endpoints": ["message", "order"],
        "authType": "oauth2"
      },
      "envVars": ["XIANYU_APP_ID", "XIANYU_APP_SECRET"],
      "tools": [
        {
          "name": "xianyu_send_message",
          "description": "发送闲鱼消息"
        },
        {
          "name": "xianyu_get_orders",
          "description": "获取闲鱼订单列表"
        }
      ]
    }
  ]
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|:----:|------|
| `id` | string | ✅ | MCP 服务唯一标识 |
| `name` | string | ✅ | 服务显示名称 |
| `protocol` | string | ✅ | 协议类型，固定为 `mcp` |
| `version` | string | ✅ | 服务版本 |
| `config.endpoints` | string[] | 否 | 服务端点列表 |
| `config.authType` | string | 否 | 认证类型：`oauth2` / `api_key` / `none` |
| `envVars` | string[] | 否 | 需要的环境变量 |
| `tools` | array | 否 | 暴露的工具列表 |

---

## 1.7 Skills 声明

```json
{
  "skills": [
    {
      "id": "generate-contract",
      "name": "AI生成合同",
      "description": "根据客户信息和报价单自动生成合同初稿",
      "trigger": "natural-language",
      "tools": ["sales_query", "sales_mutate"],
      "examples": [
        "帮我给XX公司生成一份采购合同",
        "根据这个报价单生成合同"
      ]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | Skill唯一标识 |
| `name` | string | 显示名称 |
| `description` | string | 功能描述 |
| `trigger` | enum | 触发方式：`natural-language` / `command` / `event` |
| `tools` | string[] | 依赖的工具 |
| `examples` | string[] | 使用示例 |

---

## 1.8 MCP 声明

```json
{
  "mcp": [
    {
      "id": "xianyu-adapter",
      "name": "闲鱼平台接入",
      "protocol": "mcp",
      "version": "1.0.0",
      "config": {
        "endpoints": ["message", "order"],
        "authType": "oauth2"
      },
      "envVars": ["XIANYU_APP_ID", "XIANYU_APP_SECRET"]
    }
  ]
}
```

---

## 1.9 事件声明

```json
{
  "events": {
    "subscribes": [
      "approval:approved",
      "approval:rejected",
      "warehouse:inventory:low"
    ],
    "publishes": [
      "sales:contract:signed",
      "sales:order:created",
      "sales:customer:added"
    ]
  }
}
```

---

## 1.10 导出声明

```json
{
  "exports": {
    "models": ["contract", "order", "customer"],
    "services": ["contractService", "orderService"],
    "tools": ["query", "aggregate"],
    "types": ["Contract", "Order", "Customer"]
  }
}
```

---

## 1.11 完整示例

```json
{
  "$schema": "https://ai-automated-office.com/schemas/plugin.json",
  
  "id": "sales",
  "name": "销售部",
  "version": "1.0.0",
  "description": "销售管理模块，支持客户管理、合同管理、订单管理、销售自动化",
  "author": "AI-Automated-office Team",
  "license": "MIT",
  "type": "core",
  "icon": "briefcase",
  
  "compatibility": {
    "platformVersion": ">=1.0.0",
    "runtime": "tauri"
  },
  
  "dependencies": {
    "hr": ">=1.0.0",
    "warehouse": ">=1.0.0"
  },
  
  "permissions": {
    "required": [
      "hr:employee:read",
      "hr:department:read"
    ],
    "optional": [
      "finance:invoice:write"
    ]
  },
  
  "dataAccess": {
    "models": ["contract", "order", "customer", "quote"],
    "externalModels": [
      { "plugin": "hr", "models": ["employee", "department"], "access": "read" },
      { "plugin": "warehouse", "models": ["inventory"], "access": "read" }
    ]
  },
  
  "ui": {
    "entry": "./ui/index.tsx",
    "routes": [
      { "path": "/sales", "component": "Dashboard", "title": "销售概览" },
      { "path": "/sales/contracts", "component": "Contracts", "title": "合同管理" },
      { "path": "/sales/orders", "component": "Orders", "title": "订单管理" },
      { "path": "/sales/customers", "component": "Customers", "title": "客户管理" }
    ],
    "sidebar": {
      "title": "销售管理",
      "icon": "briefcase",
      "order": 2,
      "items": [
        { "title": "销售概览", "path": "/sales", "icon": "layout-dashboard" },
        { "title": "合同管理", "path": "/sales/contracts", "icon": "file-text" },
        { "title": "订单管理", "path": "/sales/orders", "icon": "shopping-cart" },
        { "title": "客户管理", "path": "/sales/customers", "icon": "users" }
      ]
    }
  },
  
  "tools": {
    "native": {
      "register": ["query", "aggregate", "mutate", "action", "export"],
      "public": ["query", "aggregate"],
      "descriptions": {
        "query": "查询销售部数据（合同、订单、客户、报价单）",
        "aggregate": "统计聚合销售数据",
        "mutate": "创建、更新、删除销售数据",
        "action": "执行销售业务操作",
        "export": "导出销售报表"
      }
    },
    "cli": {
      "tools": []
    },
    "mcp": {
      "services": []
    }
  },
  
  "skills": [
    {
      "id": "generate-contract",
      "name": "AI生成合同",
      "description": "根据客户信息和报价单自动生成合同初稿",
      "trigger": "natural-language"
    }
  ],
  
  "events": {
    "subscribes": ["approval:approved", "approval:rejected"],
    "publishes": ["sales:contract:signed", "sales:order:created"]
  },
  
  "exports": {
    "models": ["contract", "order", "customer"],
    "services": ["contractService"],
    "tools": ["query", "aggregate"]
  }
}
```

---

## 1.12 验证工具

### JSON Schema 验证

```bash
# 使用 ajv-cli 验证
npx ajv validate -s plugin.schema.json -d plugin.json
```

### 内置验证命令

```bash
# 验证插件清单
office plugin validate ./plugins/sales
```

---

## 下一步

- [第2章：UI层规范](./02-ui-spec.md)
- [第3章：工具层规范](./03-tools-spec.md)
