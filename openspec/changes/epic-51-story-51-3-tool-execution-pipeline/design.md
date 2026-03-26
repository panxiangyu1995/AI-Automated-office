# Design: 工具执行管道 - 完整执行链

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成
- **实现方式**: 后端为主，前端适配

### 管道架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ToolExecutionPipeline                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 工具查找 ──→ 2. 权限检查 ──→ 3. 安全验证                  │
│       │              │              │                         │
│       ▼              ▼              ▼                         │
│  toolRegistry    permission    sensitive_action             │
│                   checker        detection                    │
│       │              │              │                         │
│       ▼              ▼              ▼                         │
│  4. 参数验证 ──→ 5. 执行调用 ──→ 6. 结果归一化               │
│       │              │              │                         │
│       ▼              ▼              ▼                         │
│  validation     executor        normalizer                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 后端实现 (Rust)

#### 1. 模块结构

```
src-tauri/src/agent/tool/
├── mod.rs                    # 模块入口
├── pipeline.rs               # 主管道
├── registry.rs               # 工具注册表
├── executor.rs               # 执行器
├── security.rs               # 安全检查
├── validation.rs             # 参数验证
├── normalizer.rs             # 结果归一化
└── fallback.rs               # 降级处理
```

#### 2. 核心接口

```rust
// pipeline.rs
pub struct ToolExecutionPipeline {
    registry: ToolRegistry,
    permission_checker: PermissionChecker,
    security_checker: SecurityChecker,
    executor: ToolExecutor,
    normalizer: ResultNormalizer,
}

impl ToolExecutionPipeline {
    /// 执行工具
    pub async fn execute(
        &self,
        context: &ExecutionContext,
        tool_call: ToolCall,
    ) -> Result<ToolResult, ToolError> {
        // 1. 查找工具
        let tool = self.registry.find(&tool_call.name)?;

        // 2. 权限检查
        self.permission_checker.check(context, tool)?;

        // 3. 安全验证
        self.security_checker.validate(tool_call)?;

        // 4. 参数验证
        let validated_args = self.validation.validate(tool, tool_call.args)?;

        // 5. 执行
        let raw_result = self.executor.execute(tool, validated_args).await?;

        // 6. 归一化
        self.normalizer.normalize(raw_result)
    }
}
```

#### 3. 工具描述符绑定

```rust
// registry.rs
pub struct ToolDescriptor {
    pub name: String,
    pub description: String,
    pub params: Vec<ParamDescriptor>,
    pub result_type: TypeDescriptor,
    pub permission: Permission,
    pub security_level: SecurityLevel,
    pub fallback: Option<FallbackConfig>,
}

impl ToolRegistry {
    /// 注册后端工具
    pub fn register(&mut self, descriptor: ToolDescriptor, handler: ToolHandler);

    /// 查找工具
    pub fn find(&self, name: &str) -> Result<&ToolDescriptor, ToolError>;
}
```

#### 4. 安全检查

```rust
// security.rs
pub struct SecurityChecker {
    sensitive_patterns: Vec<SensitivePattern>,
    path_validator: PathValidator,
    sandbox: SandBox,
}

impl SecurityChecker {
    pub fn validate(&self, tool_call: &ToolCall) -> Result<(), SecurityError> {
        // 敏感操作检测
        self.check_sensitive_action(tool_call)?;

        // 路径安全检查
        self.check_path_safety(tool_call)?;

        // 沙箱执行验证
        self.check_sandbox_config(tool_call)?;

        Ok(())
    }
}
```

### 前端对接

#### 1. 工具注册表扩展

```typescript
// src/features/session/tools/toolRegistry.ts
interface BackendToolAdapter {
  // 调用后端工具
  execute(toolName: string, args: object): Promise<ToolResult>;

  // 获取工具列表
  listTools(): Promise<ToolDescriptor[]>;
}
```

#### 2. 执行器改造

```typescript
// src/features/session/tools/toolExecutor.ts
class ToolExecutor {
  constructor(private backendAdapter: BackendToolAdapter) {}

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    // 对于后端工具，调用后端适配器
    if (isBackendTool(toolCall.name)) {
      return this.backendAdapter.execute(toolCall.name, toolCall.args);
    }
    // 本地工具保持原有逻辑
    return this.executeLocal(toolCall);
  }
}
```

## 组件设计

### 新增组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `pipeline.rs` | Rust模块 | 工具执行管道 |
| `registry.rs` | Rust模块 | 后端工具注册表 |
| `executor.rs` | Rust模块 | 工具执行器 |
| `security.rs` | Rust模块 | 安全检查 |

### 修改组件

| 组件 | 修改内容 |
|------|----------|
| `toolRegistry.ts` | 添加后端工具适配 |
| `toolExecutor.ts` | 路由到后端执行 |

## 状态管理

工具执行状态通过事件系统管理，无需额外状态存储。

## 安全考虑

- **多层防护**: 权限检查 → 敏感检测 → 路径验证 → 沙箱执行
- **输入验证**: 所有参数必须经过验证
- **降级策略**: 执行失败时自动尝试降级方案
- **审计日志**: 记录所有工具执行

## 性能考虑

- **并行执行**: 支持同一工具的多个调用并行执行
- **超时控制**: 单次执行超时限制 30s
- **缓存**: 工具描述符缓存避免重复解析
