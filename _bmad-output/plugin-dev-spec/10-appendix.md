# 第10章：附录 (Appendix)

> 提供JSON Schema、类型定义、事件类型、错误码等参考文档。

---

## 附录A：plugin.json JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ai-automated-office.com/schemas/plugin.json",
  "title": "Plugin Manifest",
  "description": "AI-Automated-office 插件清单配置",
  "type": "object",
  
  "required": ["id", "name", "version", "description"],
  
  "properties": {
    "$schema": {
      "type": "string",
      "description": "JSON Schema 引用"
    },
    
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "插件唯一标识（小写字母、数字、中划线）",
      "examples": ["sales", "hr", "approval"]
    },
    
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "description": "插件显示名称"
    },
    
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$",
      "description": "版本号（语义化版本）",
      "examples": ["1.0.0", "1.0.0-beta.1"]
    },
    
    "description": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500,
      "description": "插件描述"
    },
    
    "author": {
      "type": "string",
      "description": "作者信息"
    },
    
    "license": {
      "type": "string",
      "default": "MIT",
      "description": "许可证"
    },
    
    "type": {
      "type": "string",
      "enum": ["core", "standard", "extension"],
      "default": "standard",
      "description": "插件类型：核心/标准/扩展"
    },
    
    "icon": {
      "type": "string",
      "description": "插件图标（Lucide图标名）",
      "examples": ["briefcase", "users", "file-text"]
    },
    
    "compatibility": {
      "type": "object",
      "properties": {
        "platformVersion": {
          "type": "string",
          "description": "平台版本要求"
        },
        "runtime": {
          "type": "string",
          "enum": ["tauri", "web"],
          "default": "tauri"
        }
      }
    },
    
    "dependencies": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "description": "依赖插件版本范围"
      }
    },
    
    "permissions": {
      "type": "object",
      "properties": {
        "required": {
          "type": "array",
          "items": { "type": "string" },
          "description": "必需权限"
        },
        "optional": {
          "type": "array",
          "items": { "type": "string" },
          "description": "可选权限"
        },
        "groups": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "description": { "type": "string" },
              "permissions": {
                "type": "array",
                "items": { "type": "string" }
              },
              "requiresApproval": { "type": "boolean" }
            }
          }
        }
      }
    },
    
    "dataAccess": {
      "type": "object",
      "properties": {
        "models": {
          "type": "array",
          "items": { "type": "string" },
          "description": "本插件的数据模型"
        },
        "externalModels": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "plugin": { "type": "string" },
              "models": {
                "type": "array",
                "items": { "type": "string" }
              },
              "access": {
                "type": "string",
                "enum": ["read", "write"]
              }
            },
            "required": ["plugin", "models", "access"]
          }
        },
        "storage": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["sqlite", "indexeddb"],
              "default": "sqlite"
            },
            "migration": {
              "type": "string",
              "enum": ["auto", "manual"],
              "default": "auto"
            }
          }
        }
      }
    },
    
    "ui": {
      "type": "object",
      "properties": {
        "entry": {
          "type": "string",
          "description": "UI入口文件路径"
        },
        "routes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "path": { "type": "string" },
              "component": { "type": "string" },
              "title": { "type": "string" },
              "auth": {
                "type": "array",
                "items": { "type": "string" }
              }
            },
            "required": ["path", "component", "title"]
          }
        },
        "sidebar": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "icon": { "type": "string" },
            "order": { "type": "number" },
            "items": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/sidebarItem"
              }
            }
          },
          "required": ["title", "items"]
        }
      }
    },
    
    "tools": {
      "type": "object",
      "properties": {
        "register": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["query", "aggregate", "mutate", "action", "export"]
          }
        },
        "public": {
          "type": "array",
          "items": { "type": "string" }
        },
        "descriptions": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "trigger": {
            "type": "string",
            "enum": ["natural-language", "intent", "keyword"]
          },
          "examples": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["id", "name", "description"]
      }
    },
    
    "mcp": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "protocol": { "type": "string", "const": "mcp" },
          "config": { "type": "object" }
        },
        "required": ["id", "name", "protocol"]
      }
    },
    
    "events": {
      "type": "object",
      "properties": {
        "subscribes": {
          "type": "array",
          "items": { "type": "string" }
        },
        "publishes": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    
    "exports": {
      "type": "object",
      "properties": {
        "models": {
          "type": "array",
          "items": { "type": "string" }
        },
        "services": {
          "type": "array",
          "items": { "type": "string" }
        },
        "tools": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    
    "roles": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "extends": { "type": "string" },
          "permissions": {
            "type": "array",
            "items": { "type": "string" }
          },
          "dataScope": {
            "type": "string",
            "enum": ["self", "department", "department_and_sub", "company", "custom"]
          }
        },
        "required": ["name", "permissions"]
      }
    }
  },
  
  "definitions": {
    "sidebarItem": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "path": { "type": "string" },
        "icon": { "type": "string" },
        "auth": {
          "type": "array",
          "items": { "type": "string" }
        },
        "children": {
          "type": "array",
          "items": { "$ref": "#/definitions/sidebarItem" }
        }
      },
      "required": ["title", "path"]
    }
  }
}
```

---

## 附录B：工具接口类型定义

```typescript
// 通用查询参数
interface UniversalQueryParams {
  entity: string;
  filters?: Record<string, any>;
  fields?: string[];
  page?: number;
  pageSize?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

// 通用查询结果
interface UniversalQueryResult<T = Record<string, any>> {
  entity: string;
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

// 通用聚合参数
interface UniversalAggregateParams {
  entity: string;
  filters?: Record<string, any>;
  aggregations: Array<{
    metric: 'sum' | 'count' | 'avg' | 'max' | 'min';
    field: string;
    alias?: string;
  }>;
  groupBy?: string | string[];
}

// 通用聚合结果
interface UniversalAggregateResult {
  entity: string;
  groups?: Array<{
    key: string | Record<string, any>;
    metrics: Record<string, number>;
  }>;
  total?: Record<string, number>;
}

// 通用变更参数
interface UniversalMutateParams<T = Record<string, any>> {
  action: 'create' | 'update' | 'delete';
  entity: string;
  data?: T;
  id?: string;
  ids?: string[];
}

// 通用变更结果
interface UniversalMutateResult<T = Record<string, any>> {
  success: boolean;
  action: string;
  entity: string;
  affected: number;
  data?: T;
}

// 业务操作参数
interface ActionParams {
  action: string;
  entity: string;
  targetId: string;
  params?: Record<string, any>;
}

// 业务操作结果
interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

// 导出参数
interface ExportParams {
  entity: string;
  filters?: Record<string, any>;
  format: 'excel' | 'csv' | 'pdf';
  fields?: string[];
  fileName?: string;
}

// 导出结果
interface ExportResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
}
```

---

## 附录C：事件类型定义

### C.1 系统级事件

```typescript
// 用户事件
interface UserEvent {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string; timestamp: Date };
  'user:created': { userId: string; createdBy: string };
  'user:updated': { userId: string; updatedBy: string };
}

// 租户事件
interface TenantEvent {
  'tenant:created': { tenantId: string; name: string };
  'tenant:updated': { tenantId: string };
  'tenant:deleted': { tenantId: string };
}

// 插件事件
interface PluginEvent {
  'plugin:installed': { pluginId: string; version: string };
  'plugin:activated': { pluginId: string };
  'plugin:deactivated': { pluginId: string };
  'plugin:updated': { pluginId: string; fromVersion: string; toVersion: string };
  'plugin:uninstalled': { pluginId: string };
}
```

### C.2 业务事件

```typescript
// 审批事件
interface ApprovalEvent {
  'approval:request:created': {
    requestId: string;
    type: string;
    entityId: string;
    requesterId: string;
  };
  'approval:request:approved': {
    requestId: string;
    type: string;
    entityId: string;
    approverId: string;
  };
  'approval:request:rejected': {
    requestId: string;
    type: string;
    entityId: string;
    approverId: string;
    reason: string;
  };
}

// 销售事件
interface SalesEvent {
  'sales:contract:created': { contractId: string; salesId: string };
  'sales:contract:submitted': { contractId: string; approvalId: string };
  'sales:contract:signed': { contractId: string; signedAt: Date };
  'sales:contract:completed': { contractId: string };
  'sales:order:created': { orderId: string; contractId: string };
  'sales:customer:added': { customerId: string; salesId: string };
}
```

---

## 附录D：错误码定义

### D.1 通用错误码

| 错误码 | 说明 | HTTP状态码 |
|--------|------|-----------|
| `SUCCESS` | 成功 | 200 |
| `BAD_REQUEST` | 请求参数错误 | 400 |
| `UNAUTHORIZED` | 未授权 | 401 |
| `FORBIDDEN` | 权限不足 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `CONFLICT` | 资源冲突 | 409 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

### D.2 业务错误码

```typescript
// 插件相关
enum PluginError {
  PLUGIN_NOT_FOUND = 'PLUGIN_001',
  PLUGIN_ALREADY_INSTALLED = 'PLUGIN_002',
  PLUGIN_DEPENDENCY_MISSING = 'PLUGIN_003',
  PLUGIN_VERSION_INCOMPATIBLE = 'PLUGIN_004',
  PLUGIN_INSTALLATION_FAILED = 'PLUGIN_005',
}

// 权限相关
enum PermissionError {
  PERMISSION_DENIED = 'PERM_001',
  DATA_SCOPE_DENIED = 'PERM_002',
  ROLE_NOT_FOUND = 'PERM_003',
}

// 数据相关
enum DataError {
  ENTITY_NOT_FOUND = 'DATA_001',
  ENTITY_ALREADY_EXISTS = 'DATA_002',
  DATA_VALIDATION_FAILED = 'DATA_003',
  DATA_INTEGRITY_VIOLATION = 'DATA_004',
}

// 工具相关
enum ToolError {
  TOOL_NOT_FOUND = 'TOOL_001',
  TOOL_EXECUTION_FAILED = 'TOOL_002',
  TOOL_TIMEOUT = 'TOOL_003',
  INVALID_PARAMS = 'TOOL_004',
}
```

### D.3 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string;  // 仅开发环境
  };
  timestamp: string;
  requestId: string;
}
```

---

## 附录E：数据库迁移模板

```sql
-- migrations/001_init.sql

-- 合同表
CREATE TABLE IF NOT EXISTS sales_contracts (
  id TEXT PRIMARY KEY,
  contract_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  sales_id TEXT NOT NULL,
  sales_name TEXT,
  department_id TEXT,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  signed_at DATETIME,
  terms TEXT,
  company_id TEXT NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_customer ON sales_contracts(customer_id);
CREATE INDEX idx_contracts_sales ON sales_contracts(sales_id);
CREATE INDEX idx_contracts_status ON sales_contracts(status);
CREATE INDEX idx_contracts_company ON sales_contracts(company_id);

-- 订单表
CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  contract_id TEXT,
  customer_id TEXT NOT NULL,
  sales_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  company_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES sales_contracts(id)
);

-- 回滚脚本
-- DROP TABLE IF EXISTS sales_orders;
-- DROP TABLE IF EXISTS sales_contracts;
```

---

## 附录F：常用正则表达式

| 用途 | 正则表达式 |
|------|-----------|
| 插件ID | `^[a-z][a-z0-9-]*$` |
| 版本号 | `^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$` |
| 权限标识 | `^[a-z]+:[a-z_]+:[a-z_]+$` |
| 手机号（中国） | `^1[3-9]\d{9}$` |
| 邮箱 | `^[\w.-]+@[\w.-]+\.\w+$` |
| 合同编号 | `^[A-Z]{2}\d{8}$` |

---

## 附录G：命名速查表

### G.1 插件ID命名

| 部门 | 插件ID | 中文名 |
|------|--------|--------|
| 人事部 | `hr` | 人事管理 |
| 财务部 | `finance` | 财务管理 |
| 销售部 | `sales` | 销售管理 |
| 仓储部 | `warehouse` | 仓储管理 |
| 审批中心 | `approval` | 审批中心 |
| 售后服务 | `after-sales` | 售后服务 |
| 招投标 | `bidding` | 招投标管理 |
| 市场宣传 | `marketing` | 市场管理 |

### G.2 工具命名

| 工具类型 | 命名格式 | 示例 |
|---------|---------|------|
| 查询 | `{plugin}_query` | `sales_query` |
| 聚合 | `{plugin}_aggregate` | `sales_aggregate` |
| 变更 | `{plugin}_mutate` | `sales_mutate` |
| 操作 | `{plugin}_action` | `sales_action` |
| 导出 | `{plugin}_export` | `sales_export` |

### G.3 事件命名

| 事件类型 | 命名格式 | 示例 |
|---------|---------|------|
| 实体创建 | `{plugin}:{entity}:created` | `sales:contract:created` |
| 实体更新 | `{plugin}:{entity}:updated` | `sales:contract:updated` |
| 实体删除 | `{plugin}:{entity}:deleted` | `sales:contract:deleted` |
| 状态变更 | `{plugin}:{entity}:{status}` | `sales:contract:signed` |
| 操作触发 | `{plugin}:{entity}:{action}` | `approval:request:approved` |

---

**文档版本：v1.0.0**
**最后更新：2024-03-13**
