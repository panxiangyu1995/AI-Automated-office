# 第7章：生命周期规范 (Lifecycle Specification)

> 定义插件的安装、运行、更新、卸载全过程管理规范。

---

## 7.1 生命周期概览

```
┌─────────────────────────────────────────────────────────────┐
│                    插件生命周期                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ 安装阶段 │──▶│ 运行阶段 │──▶│ 更新阶段 │──▶│ 卸载阶段 │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│       │             │             │             │          │
│       ▼             ▼             ▼             ▼          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ 权限确认 │   │ 工具调用 │   │ 版本检查 │   │ 数据备份 │    │
│  │ 依赖检查 │   │ 事件监听 │   │ 数据迁移 │   │ 依赖清理 │    │
│  │ 数据迁移 │   │ 数据同步 │   │ 热重载   │   │ 数据删除 │    │
│  │ 注册加载 │   │ 状态监控 │   │         │   │         │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.2 安装阶段

### 7.2.1 安装流程

```
用户点击安装
      │
      ▼
┌─────────────┐
│ 1. 解析清单 │ ──▶ 读取 plugin.json，验证格式
└─────────────┘
      │
      ▼
┌─────────────┐
│ 2. 权限确认 │ ──▶ 显示所需权限，用户同意
└─────────────┘
      │
      ▼
┌─────────────┐
│ 3. 依赖检查 │ ──▶ 检查依赖插件是否已安装
└─────────────┘
      │
      ▼
┌─────────────┐
│ 4. CLI 检查 │ ──▶ 检查 CLI 工具依赖（如有）
└─────────────┘
      │
      ▼
┌─────────────┐
│ 5. MCP 配置 │ ──▶ 配置 MCP 服务连接（如有）
└─────────────┘
      │
      ▼
┌─────────────┐
│ 6. 数据迁移 │ ──▶ 执行数据库迁移脚本
└─────────────┘
      │
      ▼
┌─────────────┐
│ 7. 注册组件 │ ──▶ 注册路由、工具、事件等
└─────────────┘
      │
      ▼
┌─────────────┐
│ 8. 初始化   │ ──▶ 执行插件初始化钩子
└─────────────┘
      │
      ▼
   安装完成
```

### 7.2.2 CLI 工具安装检查

当插件声明了 CLI 工具时，安装流程会检查 CLI 工具是否可用：

```typescript
// CLI 工具安装检查
async function checkCLIDependencies(plugin: Plugin): Promise<CLICheckResult> {
  const cliTools = plugin.manifest.cli?.tools || [];
  const results: CLIToolStatus[] = [];
  
  for (const tool of cliTools) {
    const status = await checkCLITool(tool);
    results.push(status);
  }
  
  return {
    allAvailable: results.every(r => r.available),
    tools: results
  };
}

async function checkCLITool(tool: CLIToolConfig): Promise<CLIToolStatus> {
  try {
    // 检查命令是否存在
    const result = await exec(`${tool.command} --version`);
    return {
      name: tool.name,
      command: tool.command,
      available: true,
      version: result.stdout.trim(),
      skillFile: tool.skillFile
    };
  } catch (error) {
    return {
      name: tool.name,
      command: tool.command,
      available: false,
      installHint: getInstallHint(tool.command)
    };
  }
}
```

### 7.2.3 MCP 服务配置

当插件声明了 MCP 服务时，需要配置连接：

```typescript
// MCP 服务配置
async function configureMCServices(plugin: Plugin, context: InstallContext): Promise<void> {
  const mcpServices = plugin.manifest.mcp || [];
  
  for (const service of mcpServices) {
    // 检查环境变量
    const missingEnvVars = service.envVars?.filter(v => !process.env[v]);
    
    if (missingEnvVars && missingEnvVars.length > 0) {
      // 提示用户配置环境变量
      await context.promptEnvVars({
        serviceId: service.id,
        serviceName: service.name,
        requiredVars: missingEnvVars,
        authType: service.config?.authType
      });
    }
    
    // 测试连接
    if (service.config?.authType === 'oauth2') {
      await context.initiateOAuth(service);
    }
  }
}
```

### 7.2.4 安装钩子

```typescript
// 插件可以定义安装时执行的逻辑
export const installHooks = {
  /**
   * 安装前检查
   * 返回 false 可以阻止安装
   */
  async beforeInstall(context: InstallContext): Promise<boolean> {
    // 检查环境配置
    if (!context.getConfig('sales.enabled')) {
      context.showWarning('销售模块未启用，插件功能可能受限');
    }
    return true;
  },
  
  /**
   * 安装后初始化
   */
  async afterInstall(context: InstallContext): Promise<void> {
    // 创建默认数据
    await context.db.insert('sales_settings', {
      companyId: context.companyId,
      autoApproveThreshold: 10000,
      defaultContractTemplate: 'standard'
    });
    
    // 发送通知
    context.notify({
      type: 'plugin_installed',
      title: '销售模块已安装',
      content: '您现在可以使用销售管理功能了'
    });
  }
};
```

### 7.2.3 权限确认界面

```
┌─────────────────────────────────────────────────────────────┐
│  📦 安装销售管理模块                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  该插件需要以下权限：                                        │
│                                                             │
│  基础权限                                                   │
│  ├── ✅ 查看员工信息 (hr:employee:read)                     │
│  └── ✅ 查看部门信息 (hr:department:read)                   │
│                                                             │
│  敏感权限                                                   │
│  └── ⚠️ 创建发票 (finance:invoice:write)                    │
│      用于自动生成合同对应发票                                │
│                                                             │
│  依赖插件                                                   │
│  ├── ✅ 人事管理模块 (已安装)                               │
│  └── ✅ 审批中心 (已安装)                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [取消]                          [确认安装]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.3 运行阶段

### 7.3.1 运行时管理

```typescript
// 插件运行时状态
interface PluginRuntime {
  // 状态
  status: 'active' | 'inactive' | 'error';
  activatedAt: Date;
  
  // 统计
  stats: {
    toolCalls: number;
    eventProcessed: number;
    errors: number;
    lastActiveAt: Date;
  };
  
  // 健康检查
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheckAt: Date;
    issues: string[];
  };
}
```

### 7.3.2 工具调用记录

```typescript
// 每次工具调用自动记录
interface ToolCallRecord {
  id: string;
  pluginId: string;
  toolName: string;
  params: any;
  result: any;
  duration: number;
  userId: string;
  companyId: string;
  calledAt: Date;
  success: boolean;
  errorMessage?: string;
}
```

### 7.3.3 健康检查

```typescript
// 插件健康检查
@Schedule()
export class PluginHealthCheck {
  @Cron('*/5 * * * *')  // 每5分钟
  async checkHealth(context: TaskContext) {
    const plugins = await context.pluginManager.getAllActive();
    
    for (const plugin of plugins) {
      const health = await this.checkPluginHealth(plugin);
      
      if (health.status !== 'healthy') {
        context.alert({
          type: 'plugin_unhealthy',
          pluginId: plugin.id,
          issues: health.issues
        });
      }
    }
  }
  
  private async checkPluginHealth(plugin: Plugin): Promise<HealthStatus> {
    const issues: string[] = [];
    
    // 检查数据库连接
    try {
      await plugin.db.ping();
    } catch (e) {
      issues.push('数据库连接异常');
    }
    
    // 检查工具注册
    const tools = plugin.getRegisteredTools();
    if (tools.length === 0) {
      issues.push('无已注册工具');
    }
    
    // 检查错误率
    const errorRate = await plugin.getErrorRate('1h');
    if (errorRate > 0.1) {
      issues.push(`错误率过高: ${(errorRate * 100).toFixed(1)}%`);
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues
    };
  }
}
```

---

## 7.4 更新阶段

### 7.4.1 更新流程

```
检测到新版本
      │
      ▼
┌─────────────┐
│ 1. 版本检查 │ ──▶ 比对当前版本和目标版本
└─────────────┘
      │
      ▼
┌─────────────┐
│ 2. 兼容检查 │ ──▶ 检查平台版本兼容性
└─────────────┘
      │
      ▼
┌─────────────┐
│ 3. 备份数据 │ ──▶ 备份当前数据库
└─────────────┘
      │
      ▼
┌─────────────┐
│ 4. 数据迁移 │ ──▶ 执行迁移脚本
└─────────────┘
      │
      ▼
┌─────────────┐
│ 5. 热重载   │ ──▶ 更新代码和配置
└─────────────┘
      │
      ▼
   更新完成
```

### 7.4.2 更新钩子

```typescript
export const updateHooks = {
  /**
   * 更新前检查
   */
  async beforeUpdate(context: UpdateContext): Promise<boolean> {
    const { fromVersion, toVersion } = context;
    
    // 检查是否有重大变更
    if (context.hasBreakingChanges) {
      const confirmed = await context.showConfirm({
        title: '重大版本更新',
        content: `从 ${fromVersion} 升级到 ${toVersion} 包含重大变更，可能影响现有功能`,
        confirmText: '确认更新'
      });
      return confirmed;
    }
    
    return true;
  },
  
  /**
   * 数据迁移
   */
  async migrate(context: MigrationContext): Promise<void> {
    const { fromVersion, toVersion } = context;
    
    // 版本区间迁移
    if (fromVersion < '1.1.0' && toVersion >= '1.1.0') {
      await context.executeMigration('002_add_contract_status');
    }
    
    if (fromVersion < '1.2.0' && toVersion >= '1.2.0') {
      await context.executeMigration('003_add_order_tracking');
    }
  },
  
  /**
   * 更新后处理
   */
  async afterUpdate(context: UpdateContext): Promise<void> {
    context.notify({
      type: 'plugin_updated',
      title: '销售模块已更新',
      content: `已更新到版本 ${context.toVersion}`
    });
  }
};
```

### 7.4.3 回滚机制

```typescript
// 更新失败时自动回滚
async update(plugin: Plugin, newVersion: string): Promise<void> {
  // 1. 创建备份点
  const backup = await createBackup(plugin);
  
  try {
    // 2. 执行更新
    await doUpdate(plugin, newVersion);
  } catch (error) {
    // 3. 更新失败，回滚
    await restoreBackup(backup);
    throw error;
  }
}
```

---

## 7.5 卸载阶段

### 7.5.1 卸载流程

```
用户请求卸载
      │
      ▼
┌─────────────┐
│ 1. 依赖检查 │ ──▶ 检查是否有其他插件依赖
└─────────────┘
      │
      ▼
┌─────────────┐
│ 2. 数据备份 │ ──▶ 可选备份插件数据
└─────────────┘
      │
      ▼
┌─────────────┐
│ 3. 清理资源 │ ──▶ 删除路由、工具、事件监听
└─────────────┘
      │
      ▼
┌─────────────┐
│ 4. CLI 清理 │ ──▶ 清理 CLI 工具相关资源
└─────────────┘
      │
      ▼
┌─────────────┐
│ 5. MCP 断开 │ ──▶ 断开 MCP 服务连接
└─────────────┘
      │
      ▼
┌─────────────┐
│ 6. 数据处理 │ ──▶ 根据用户选择处理数据
└─────────────┘
      │
      ▼
   卸载完成
```

### 7.5.2 CLI 清理

```typescript
// CLI 工具清理
async function cleanupCLITools(plugin: Plugin, context: UninstallContext): Promise<void> {
  const cliTools = plugin.manifest.cli?.tools || [];
  
  for (const tool of cliTools) {
    // 清理缓存文件
    await context.clearCache(`cli:${tool.name}`);
    
    // 清理临时文件
    await context.clearTempFiles(`cli-${tool.name}`);
    
    // 可选：清理 skill 文件
    if (context.options.removeSkillFiles) {
      await context.removeFile(tool.skillFile);
    }
  }
}
```

### 7.5.3 MCP 断开

```typescript
// MCP 服务断开
async function disconnectMCPServices(plugin: Plugin, context: UninstallContext): Promise<void> {
  const mcpServices = plugin.manifest.mcp || [];
  
  for (const service of mcpServices) {
    // 断开连接
    await context.mcpManager.disconnect(service.id);
    
    // 撤销 OAuth 令牌（如果需要）
    if (context.options.revokeOAuth) {
      await context.oauthManager.revoke(service.id);
    }
    
    // 清理存储的凭据
    await context.clearCredentials(service.id);
  }
}
```

### 7.5.4 卸载钩子

```typescript
export const uninstallHooks = {
  /**
   * 卸载前检查
   */
  async beforeUninstall(context: UninstallContext): Promise<boolean> {
    // 检查是否有其他插件依赖
    const dependents = await context.getDependentPlugins();
    if (dependents.length > 0) {
      context.showError(`以下插件依赖本插件：${dependents.join(', ')}，请先卸载这些插件`);
      return false;
    }
    
    return true;
  },
  
  /**
   * 数据处理选项
   */
  async getUninstallOptions(context: UninstallContext): Promise<UninstallOptions> {
    return context.showOptions({
      title: '卸载销售管理模块',
      options: [
        {
          id: 'keep_data',
          label: '保留数据',
          description: '保留所有合同、订单等数据，卸载后可通过数据管理查看'
        },
        {
          id: 'export_data',
          label: '导出数据',
          description: '导出所有数据后删除'
        },
        {
          id: 'delete_data',
          label: '删除数据',
          description: '彻底删除所有数据（不可恢复）',
          danger: true
        }
      ]
    });
  },
  
  /**
   * 执行卸载
   */
  async uninstall(context: UninstallContext): Promise<void> {
    const { dataOption } = context;
    
    switch (dataOption) {
      case 'keep_data':
        // 保留数据，只删除插件文件
        await context.cleanupPluginFiles();
        break;
        
      case 'export_data':
        // 导出数据
        await context.exportData();
        await context.cleanupAll();
        break;
        
      case 'delete_data':
        // 删除所有数据
        await context.cleanupAll();
        break;
    }
  }
};
```

### 7.5.3 卸载确认界面

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 卸载销售管理模块                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  您确定要卸载销售管理模块吗？                                │
│                                                             │
│  当前数据：                                                 │
│  ├── 合同：128 份                                          │
│  ├── 订单：256 个                                          │
│  └── 客户：89 个                                           │
│                                                             │
│  数据处理选项：                                             │
│  ○ 保留数据（推荐）                                         │
│    保留所有数据，卸载后可通过数据管理查看                    │
│                                                             │
│  ○ 导出后删除                                              │
│    导出所有数据到Excel后删除                                │
│                                                             │
│  ○ 彻底删除                                                │
│    删除所有数据，此操作不可恢复！                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [取消]                          [确认卸载]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7.6 插件状态管理

### 7.6.1 状态定义

| 状态 | 说明 |
|------|------|
| `installed` | 已安装，未激活 |
| `active` | 运行中 |
| `inactive` | 已停用 |
| `updating` | 更新中 |
| `error` | 错误状态 |
| `uninstalling` | 卸载中 |

### 7.6.2 状态转换

```
                ┌─────────┐
                │installed│
                └────┬────┘
                     │ activate
                     ▼
              ┌──────────────┐
         ┌───▶│    active    │◀───┐
         │    └──────────────┘    │
         │           │            │
    deactivate      │ error    resolve
         │           ▼            │
         │    ┌──────────────┐    │
         └────│    error     │────┘
              └──────────────┘
                     │ uninstall
                     ▼
              ┌──────────────┐
              │ uninstalling │
              └──────────────┘
```

---

## 下一步

- [第8章：质量规范](./08-quality-spec.md)
- [第9章：示例插件](./09-examples.md)
