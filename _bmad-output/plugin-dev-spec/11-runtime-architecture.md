# 插件运行时架构设计

> **版本：** 1.0.0  
> **最后更新：** 2026-03-21  
> **状态：** 设计方案

---

## 文档概述

本文档定义了 AI-Automated-office 平台插件运行时的三大核心架构：

1. **插件安装架构** - 软件如何安装和管理插件
2. **AI调用架构** - AI Agent 如何发现和调用插件工具
3. **用户UI操作架构** - 用户如何在插件UI界面进行操作

---

## 一、插件安装架构

### 1.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    插件安装架构                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │  插件市场     │     │  本地插件     │     │  开发模式     │        │
│  │  (Marketplace)│     │  (Local)     │     │  (Dev)       │        │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘        │
│         │                    │                    │                │
│         └────────────────────┼────────────────────┘                │
│                              ▼                                      │
│                    ┌──────────────────┐                             │
│                    │  Plugin Manager  │                             │
│                    │  (插件管理器)     │                             │
│                    └────────┬─────────┘                             │
│                             │                                       │
│         ┌───────────────────┼───────────────────┐                  │
│         ▼                   ▼                   ▼                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│  │ Manifest    │     │ Dependency  │     │ Permission  │          │
│  │ Validator   │     │ Resolver    │     │ Manager     │          │
│  └─────────────┘     └─────────────┘     └─────────────┘          │
│                                                                     │
│         ┌───────────────────┼───────────────────┐                  │
│         ▼                   ▼                   ▼                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│  │ CLI Checker │     │ MCP Config  │     │ DB Migrator │          │
│  └─────────────┘     └─────────────┘     └─────────────┘          │
│                                                                     │
│                             │                                       │
│                             ▼                                       │
│                    ┌──────────────────┐                             │
│                    │  Plugin Registry │                             │
│                    │  (插件注册表)     │                             │
│                    └──────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 插件来源

| 来源 | 说明 | 安装方式 |
|------|------|---------|
| **插件市场** | 官方/社区发布的插件 | 点击安装，自动下载 |
| **本地插件** | 本地打包的插件文件 | 选择文件安装 |
| **开发模式** | 开发中的插件目录 | 链接目录，热重载 |

### 1.3 安装流程详细设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                        插件安装流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  用户触发安装                                                        │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 1: 下载与验证                                          │   │
│  │  ├── 下载插件包（如来自市场）                                │   │
│  │  ├── 解压到临时目录                                          │   │
│  │  ├── 验证数字签名（可选）                                    │   │
│  │  └── 解析 plugin.json                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 2: 兼容性检查                                          │   │
│  │  ├── 检查平台版本兼容性                                      │   │
│  │  ├── 检查依赖插件是否已安装                                  │   │
│  │  ├── 检查 CLI 工具依赖（如有）                               │   │
│  │  └── 生成兼容性报告                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼ (不兼容则终止)                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 3: 权限确认                                            │   │
│  │  ├── 展示所需权限列表                                        │   │
│  │  ├── 展示数据访问范围                                        │   │
│  │  ├── 展示外部服务连接（MCP）                                 │   │
│  │  └── 用户确认授权                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼ (用户拒绝则终止)                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 4: 环境配置                                            │   │
│  │  ├── 配置 MCP 服务连接                                       │   │
│  │  │   ├── OAuth 认证流程                                      │   │
│  │  │   └── API Key 配置                                        │   │
│  │  ├── 检查 CLI 工具可用性                                     │   │
│  │  │   └── 提供安装指引                                        │   │
│  │  └── 配置环境变量                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 5: 数据库迁移                                          │   │
│  │  ├── 创建插件专属 Schema                                     │   │
│  │  ├── 执行迁移脚本                                            │   │
│  │  ├── 插入初始数据                                            │   │
│  │  └── 创建索引                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 6: 组件注册                                            │   │
│  │  ├── 注册 UI 路由                                            │   │
│  │  ├── 注册 Native Tools                                       │   │
│  │  ├── 注册 CLI Wrappers                                       │   │
│  │  ├── 注册 MCP Adapters                                       │   │
│  │  ├── 注册 Skills                                             │   │
│  │  ├── 注册事件监听                                            │   │
│  │  └── 注册定时任务                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Phase 7: 初始化执行                                          │   │
│  │  ├── 执行 afterInstall 钩子                                  │   │
│  │  ├── 创建默认配置                                            │   │
│  │  ├── 发送安装通知                                            │   │
│  │  └── 更新插件注册表                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  安装完成                                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.4 插件注册表设计

```typescript
interface PluginRegistry {
  plugins: Map<string, PluginEntry>;
  
  // 插件条目
  interface PluginEntry {
    id: string;
    manifest: PluginManifest;
    status: PluginStatus;
    installedAt: Date;
    updatedAt: Date;
    
    // 运行时信息
    runtime: {
      nativeTools: Map<string, ToolHandler>;
      cliTools: Map<string, CLIToolConfig>;
      mcpServices: Map<string, MCPConnection>;
      routes: RouteConfig[];
      eventHandlers: EventHandler[];
    };
    
    // 统计信息
    stats: {
      toolCalls: number;
      lastActiveAt: Date;
      errorCount: number;
    };
  }
}

enum PluginStatus {
  INSTALLED = 'installed',    // 已安装，未激活
  ACTIVE = 'active',          // 运行中
  INACTIVE = 'inactive',      // 已停用
  ERROR = 'error',            // 错误状态
  UPDATING = 'updating'       // 更新中
}
```

### 1.5 CLI 工具安装检查界面

```
┌─────────────────────────────────────────────────────────────┐
│  📦 安装图像处理插件                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  该插件需要以下 CLI 工具：                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ cli-anything-gimp                                 │   │
│  │    状态：已安装 (v2.10.0)                            │   │
│  │    用途：图像处理核心工具                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ❌ cli-anything-ffmpeg                               │   │
│  │    状态：未安装                                      │   │
│  │    用途：视频处理（可选）                            │   │
│  │    [安装指引] [跳过]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 提示：未安装的工具将无法使用对应功能                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [取消]                          [继续安装]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、AI调用插件架构

### 2.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI调用插件架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      AI Agent (LLM)                          │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 上下文窗口 (Context Window)                            │  │  │
│  │  │  ├── 系统提示词                                        │  │  │
│  │  │  ├── 对话历史                                          │  │  │
│  │  │  ├── 工具定义 (Tool Definitions) ◀─────┐              │  │  │
│  │  │  └── Token 预算管理                    │              │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Tool Discovery Layer                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Tool Index  │  │ Skill Index │  │ MCP Index   │          │  │
│  │  │ (工具索引)   │  │ (技能索引)   │  │ (MCP索引)   │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Tool Execution Layer                        │  │
│  │                                                              │  │
│  │         ┌─────────────────┬─────────────────┐               │  │
│  │         ▼                 ▼                 ▼               │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │  │
│  │  │ Native      │   │ CLI         │   │ MCP         │       │  │
│  │  │ Executor    │   │ Executor    │   │ Executor    │       │  │
│  │  │             │   │             │   │             │       │  │
│  │  │ 直接调用    │   │ 子进程执行  │   │ HTTP/RPC    │       │  │
│  │  │ TypeScript  │   │ CLI命令     │   │ 调用        │       │  │
│  │  └─────────────┘   └─────────────┘   └─────────────┘       │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Result Processing Layer                     │  │
│  │  ├── 结果格式化                                              │  │
│  │  ├── 错误处理                                                │  │
│  │  ├── 审计日志                                                │  │
│  │  └── Token 优化（CLI结果压缩）                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 工具发现机制

#### 2.2.1 工具注册与索引

```typescript
// 工具索引服务
class ToolIndexService {
  private tools: Map<string, ToolDefinition> = new Map();
  private toolsByPlugin: Map<string, Set<string>> = new Map();
  
  // 注册工具
  registerTool(pluginId: string, tool: ToolDefinition): void {
    const fullName = `${pluginId}_${tool.name}`;
    this.tools.set(fullName, {
      ...tool,
      pluginId,
      fullName,
      type: tool.type || 'native'
    });
    
    if (!this.toolsByPlugin.has(pluginId)) {
      this.toolsByPlugin.set(pluginId, new Set());
    }
    this.toolsByPlugin.get(pluginId)!.add(fullName);
  }
  
  // 获取工具定义（用于 LLM）
  getToolDefinitionsForLLM(options: {
    pluginIds?: string[];
    types?: ('native' | 'cli' | 'mcp')[];
    includeDescriptions?: boolean;
  }): ToolDefinition[] {
    let tools = Array.from(this.tools.values());
    
    // 按插件过滤
    if (options.pluginIds) {
      tools = tools.filter(t => options.pluginIds!.includes(t.pluginId));
    }
    
    // 按类型过滤
    if (options.types) {
      tools = tools.filter(t => options.types!.includes(t.type));
    }
    
    // Token 优化：简化描述
    return tools.map(t => ({
      name: t.fullName,
      description: options.includeDescriptions 
        ? t.description 
        : t.briefDescription || t.description.split('\n')[0],
      parameters: t.parameters
    }));
  }
}
```

#### 2.2.2 按需加载策略

```typescript
// 智能工具加载器
class SmartToolLoader {
  private loadedTools: Set<string> = new Set();
  private tokenBudget: number;
  
  // 根据用户意图预测需要的工具
  async predictRequiredTools(userIntent: string): Promise<string[]> {
    // 1. 关键词匹配
    const keywords = this.extractKeywords(userIntent);
    
    // 2. 查找相关插件
    const relevantPlugins = await this.findRelevantPlugins(keywords);
    
    // 3. 返回这些插件的核心工具
    const tools: string[] = [];
    for (const pluginId of relevantPlugins) {
      // 核心工具（始终加载）
      tools.push(`${pluginId}_query`);
      tools.push(`${pluginId}_aggregate`);
      
      // 可选工具（按需加载）
      if (this.tokenBudget > THRESHOLD) {
        tools.push(`${pluginId}_action`);
        tools.push(`${pluginId}_export`);
      }
    }
    
    return tools;
  }
  
  // 动态加载工具
  async loadToolsOnDemand(toolNames: string[]): Promise<void> {
    for (const name of toolNames) {
      if (!this.loadedTools.has(name)) {
        const tool = await this.toolIndex.getTool(name);
        if (tool) {
          this.addToContext(tool);
          this.loadedTools.add(name);
        }
      }
    }
  }
}
```

### 2.3 工具执行流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        工具执行流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AI Agent 发起工具调用                                              │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. 解析工具调用请求                                          │   │
│  │    ├── 工具名称解析                                          │   │
│  │    ├── 参数验证                                              │   │
│  │    └── 权限检查                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. 确定执行类型                                              │   │
│  │    ├── Native Tool → 直接调用                                │   │
│  │    ├── CLI Tool → 子进程执行                                 │   │
│  │    └── MCP Tool → 远程调用                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ├──────────────────────┬──────────────────────┐              │
│       ▼                      ▼                      ▼              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐      │
│  │ Native      │       │ CLI         │       │ MCP         │      │
│  │ Execution   │       │ Execution   │       │ Execution   │      │
│  │             │       │             │       │             │      │
│  │ • 加载模块  │       │ • 构建命令  │       │ • 序列化    │      │
│  │ • 执行函数  │       │ • 启动进程  │       │ • 发送请求  │      │
│  │ • 返回结果  │       │ • 等待输出  │       │ • 等待响应  │      │
│  │             │       │ • 解析JSON  │       │ • 解析结果  │      │
│  └─────────────┘       └─────────────┘       └─────────────┘      │
│       │                      │                      │              │
│       └──────────────────────┴──────────────────────┘              │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. 结果处理                                                  │   │
│  │    ├── 错误处理与重试                                        │   │
│  │    ├── 结果格式化                                            │   │
│  │    ├── Token 优化（CLI结果压缩）                             │   │
│  │    └── 审计日志记录                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ▼                                                             │
│  返回结果给 AI Agent                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 CLI 工具调用详细流程

```typescript
// CLI 工具执行器
class CLIExecutor {
  async execute(config: CLIToolConfig, params: any): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // 1. 构建命令
      const command = this.buildCommand(config, params);
      
      // 2. 执行命令
      const result = await this.runCommand(command, {
        timeout: config.timeout || 30000,
        cwd: this.getWorkDir(config)
      });
      
      // 3. 解析输出
      const output = this.parseOutput(result.stdout, config.jsonOutput);
      
      // 4. Token 优化
      const optimizedOutput = this.optimizeOutput(output);
      
      // 5. 记录日志
      await this.logExecution({
        tool: config.name,
        command: command.command,
        params,
        duration: Date.now() - startTime,
        success: true
      });
      
      return {
        success: true,
        data: optimizedOutput,
        metadata: {
          duration: Date.now() - startTime,
          type: 'cli'
        }
      };
      
    } catch (error) {
      // 错误处理
      return this.handleError(error, config, params);
    }
  }
  
  // Token 优化：压缩输出
  private optimizeOutput(output: any): any {
    if (!output || typeof output !== 'object') {
      return output;
    }
    
    // 策略1：只返回关键字段
    if (output.data && Array.isArray(output.data)) {
      return {
        count: output.data.length,
        items: output.data.slice(0, 10), // 只返回前10条
        hasMore: output.data.length > 10
      };
    }
    
    // 策略2：移除冗余字段
    const { debug, trace, logs, ...rest } = output;
    return rest;
  }
}
```

### 2.5 Token 预算管理

```typescript
// Token 预算管理器
class TokenBudgetManager {
  private readonly TOTAL_BUDGET = 128000;  // 总上下文窗口
  private readonly RESERVED_FOR_SYSTEM = 10000;
  private readonly RESERVED_FOR_HISTORY = 30000;
  private readonly MAX_FOR_TOOLS = 20000;
  
  private currentUsage = {
    system: 0,
    history: 0,
    tools: 0,
    response: 0
  };
  
  // 计算可用工具 Token 预算
  getAvailableToolBudget(): number {
    return this.MAX_FOR_TOOLS - this.currentUsage.tools;
  }
  
  // 智能选择工具定义
  selectToolDefinitions(
    allTools: ToolDefinition[],
    budget: number
  ): ToolDefinition[] {
    const selected: ToolDefinition[] = [];
    let usedTokens = 0;
    
    // 优先级排序
    const sorted = this.prioritizeTools(allTools);
    
    for (const tool of sorted) {
      const tokens = this.estimateTokens(tool);
      
      if (usedTokens + tokens <= budget) {
        selected.push(tool);
        usedTokens += tokens;
      }
    }
    
    return selected;
  }
  
  // 工具优先级
  private prioritizeTools(tools: ToolDefinition[]): ToolDefinition[] {
    return tools.sort((a, b) => {
      // 1. Native Tools 优先（高频使用）
      if (a.type === 'native' && b.type !== 'native') return -1;
      if (a.type !== 'native' && b.type === 'native') return 1;
      
      // 2. 按使用频率排序
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
  }
}
```

---

## 三、用户UI操作架构

### 3.1 架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    用户UI操作架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     主应用 Shell                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ 顶部导航栏   │  │ 侧边栏菜单   │  │ 内容区域     │          │  │
│  │  │             │  │             │  │             │          │  │
│  │  │ • Logo     │  │ • 插件菜单  │  │ • 插件路由   │          │  │
│  │  │ • 搜索     │  │ • 快捷入口  │  │ • 插件组件   │          │  │
│  │  │ • 用户信息  │  │ • 收藏夹    │  │             │          │  │
│  │  │ • 通知     │  │             │  │             │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   插件 UI 运行时                              │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Route       │  │ Component   │  │ State       │          │  │
│  │  │ Manager     │  │ Loader      │  │ Manager     │          │  │
│  │  │             │  │             │  │             │          │  │
│  │  │ 路由注册    │  │ 懒加载      │  │ 状态隔离    │          │  │
│  │  │ 权限控制    │  │ 错误边界    │  │ 数据同步    │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   插件通信层                                  │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ API Bridge  │  │ Event Bus   │  │ AI Chat     │          │  │
│  │  │             │  │             │  │ Panel       │          │  │
│  │  │ 调用工具    │  │ 跨插件通信  │  │             │          │  │
│  │  │ 访问数据    │  │ 事件订阅    │  │ AI对话入口  │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 插件 UI 加载机制

#### 3.2.1 路由注册

```typescript
// 插件路由管理器
class PluginRouteManager {
  private routes: Map<string, PluginRoute[]> = new Map();
  
  // 注册插件路由
  registerRoutes(pluginId: string, routeConfigs: RouteConfig[]): void {
    const pluginRoutes: PluginRoute[] = routeConfigs.map(config => ({
      path: config.path,
      component: lazy(() => import(`../plugins/${pluginId}/ui/routes/${config.component}`)),
      title: config.title,
      pluginId,
      meta: {
        requiresAuth: true,
        permissions: config.permissions || []
      }
    }));
    
    this.routes.set(pluginId, pluginRoutes);
    
    // 添加到主路由表
    pluginRoutes.forEach(route => {
      mainRouter.addRoute({
        path: route.path,
        element: (
          <PluginRouteWrapper pluginId={pluginId} route={route}>
            <Suspense fallback={<Loading />}>
              <route.component />
            </Suspense>
          </PluginRouteWrapper>
        )
      });
    });
  }
}
```

#### 3.2.2 组件懒加载与错误边界

```typescript
// 插件组件包装器
function PluginRouteWrapper({ pluginId, route, children }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <PluginErrorFallback 
          pluginId={pluginId} 
          error={error}
          onRetry={() => window.location.reload()}
        />
      )}
      onError={(error) => {
        logPluginError(pluginId, error);
      }}
    >
      <PermissionGuard permissions={route.meta.permissions}>
        {children}
      </PermissionGuard>
    </ErrorBoundary>
  );
}
```

### 3.3 AI 对话面板集成

#### 3.3.1 对话面板架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 对话面板                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 对话区域                                             │   │
│  │                                                     │   │
│  │  用户：帮我查询本月的销售合同                        │   │
│  │                                                     │   │
│  │  AI：我来帮您查询本月的销售合同...                   │   │
│  │  [调用 sales_query 工具]                            │   │
│  │                                                     │   │
│  │  找到 15 份本月签订的合同：                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 合同编号 │ 客户名称   │ 金额    │ 状态     │   │   │
│  │  │ C-001   │ XX公司    │ ¥50,000 │ 已生效   │   │   │
│  │  │ C-002   │ YY公司    │ ¥30,000 │ 待审批   │   │   │
│  │  │ ...     │ ...       │ ...     │ ...      │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [查看详情] [导出Excel] [创建订单]                  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 输入区域                                             │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 请输入您的问题...                    [发送] 🎤 │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │ 快捷操作：                                          │   │
│  │ [📊 销售报表] [📝 新建合同] [👥 客户管理]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3.2 上下文感知

```typescript
// AI 对话面板组件
function AIChatPanel() {
  const [currentPlugin, setCurrentPlugin] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);
  
  // 监听路由变化，自动切换上下文
  useEffect(() => {
    const pluginId = getPluginIdFromPath(window.location.pathname);
    setCurrentPlugin(pluginId);
    setCurrentRoute(window.location.pathname);
  }, [window.location.pathname]);
  
  // 获取当前插件相关的快捷操作
  const quickActions = useMemo(() => {
    if (!currentPlugin) return [];
    return getPluginQuickActions(currentPlugin);
  }, [currentPlugin]);
  
  return (
    <div className="ai-chat-panel">
      <ChatHistory pluginContext={currentPlugin} />
      <ChatInput 
        pluginContext={currentPlugin}
        quickActions={quickActions}
      />
    </div>
  );
}
```

### 3.4 插件间通信

#### 3.4.1 事件总线

```typescript
// 插件事件总线
class PluginEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  
  // 订阅事件
  subscribe<T = any>(
    event: string, 
    handler: EventHandler<T>,
    options?: { pluginId: string }
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const wrappedHandler = {
      handler,
      pluginId: options?.pluginId
    };
    
    this.listeners.get(event)!.add(wrappedHandler);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(wrappedHandler);
    };
  }
  
  // 发布事件
  async publish<T = any>(event: string, data: T): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    
    for (const { handler } of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    }
  }
}

// 使用示例
// 销售插件发布事件
eventBus.publish('sales:contract:signed', {
  contractId: 'C-001',
  customerId: 'CU-001',
  amount: 50000
});

// 财务插件订阅事件
eventBus.subscribe('sales:contract:signed', async (data) => {
  // 自动创建应收账款记录
  await createReceivable({
    sourceId: data.contractId,
    amount: data.amount,
    customerId: data.customerId
  });
}, { pluginId: 'finance' });
```

#### 3.4.2 跨插件数据访问

```typescript
// 跨插件数据访问 API
class PluginDataAccess {
  // 请求访问其他插件的数据
  async requestAccess<T>(
    targetPlugin: string,
    model: string,
    options: {
      operation: 'read' | 'write';
      filter?: any;
      fields?: string[];
    }
  ): Promise<T> {
    // 1. 检查权限
    const hasPermission = await this.checkPermission(
      this.currentPlugin,
      targetPlugin,
      model,
      options.operation
    );
    
    if (!hasPermission) {
      throw new PermissionDeniedError(
        `Plugin ${this.currentPlugin} cannot access ${targetPlugin}.${model}`
      );
    }
    
    // 2. 调用目标插件的数据接口
    return await this.pluginRegistry
      .getPlugin(targetPlugin)
      .exports.models[model]
      [options.operation](options);
  }
}

// 使用示例（在销售插件中访问人事数据）
const employees = await dataAccess.requestAccess('hr', 'employee', {
  operation: 'read',
  filter: { departmentId: salesDepartmentId },
  fields: ['id', 'name', 'title']
});
```

### 3.5 用户操作与 AI 协同

```
┌─────────────────────────────────────────────────────────────────────┐
│                    用户操作与 AI 协同模式                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  模式1：AI 主动辅助                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 用户在合同编辑页面填写信息                                    │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │ AI 检测到可能需要帮助，主动提供建议：                         │   │
│  │ "检测到您正在创建销售合同，是否需要我：                       │   │
│  │  • 根据客户历史自动填充条款                                   │   │
│  │  • 检查合同金额是否需要审批                                   │   │
│  │  • 推荐合适的付款方式"                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  模式2：用户触发 AI 操作                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 用户在列表页面点击 "AI 分析" 按钮                              │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │ AI 执行分析并展示结果：                                       │   │
│  │ "本月销售趋势分析：                                           │   │
│  │  • 总销售额较上月增长 15%                                     │   │
│  │  • 新客户占比 30%                                             │   │
│  │  • 建议关注：XX 客户有大额采购意向"                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  模式3：AI 执行后台任务                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ AI 在后台自动执行任务：                                       │   │
│  │  • 定期数据同步                                               │   │
│  │  • 异常检测与告警                                             │   │
│  │  • 自动生成报表                                               │   │
│  │       │                                                      │   │
│  │       ▼                                                      │   │
│  │ 通过通知中心提醒用户：                                        │   │
│  │ "📊 周报已生成，点击查看"                                     │   │
│  │ "⚠️ 检测到库存异常，请及时处理"                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、总结与建议

### 4.1 架构要点总结

| 架构领域 | 核心要点 |
|---------|---------|
| **插件安装** | 多来源支持、权限确认、CLI/MCP 配置、数据迁移、组件注册 |
| **AI调用** | 工具发现、按需加载、混合执行、Token 优化、审计日志 |
| **用户UI** | 路由隔离、懒加载、AI 对话集成、跨插件通信、协同模式 |

### 4.2 实施建议

1. **分阶段实施**
   - Phase 1：核心插件安装 + Native Tools 调用
   - Phase 2：CLI Wrapper 支持 + Token 优化
   - Phase 3：MCP 适配器 + 外部服务集成
   - Phase 4：AI 对话面板 + 协同模式

2. **安全优先**
   - 所有工具调用需要权限验证
   - CLI 命令执行需要沙箱隔离
   - MCP 连接需要 OAuth 认证

3. **可观测性**
   - 完整的工具调用日志
   - 性能监控与告警
   - 用户行为分析

### 4.3 后续工作

- [ ] 详细设计插件市场 UI
- [ ] 设计 CLI 工具沙箱隔离方案
- [ ] 设计 MCP 服务认证流程
- [ ] 设计 AI 对话面板交互细节
- [ ] 设计插件性能监控方案

---

## 附录：关键接口定义

```typescript
// 插件管理器接口
interface PluginManager {
  install(source: PluginSource): Promise<InstallResult>;
  uninstall(pluginId: string, options: UninstallOptions): Promise<void>;
  update(pluginId: string, version?: string): Promise<UpdateResult>;
  activate(pluginId: string): Promise<void>;
  deactivate(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): Plugin | null;
  getAllPlugins(): Plugin[];
}

// 工具执行器接口
interface ToolExecutor {
  execute(toolName: string, params: any, context: ExecutionContext): Promise<ToolResult>;
  getToolDefinition(toolName: string): ToolDefinition | null;
  getAllToolDefinitions(): ToolDefinition[];
}

// AI 对话接口
interface AIChatService {
  sendMessage(message: string, context: ChatContext): Promise<AIResponse>;
  streamMessage(message: string, context: ChatContext): AsyncIterable<AIResponseChunk>;
  getQuickActions(pluginId: string): QuickAction[];
}

// 事件总线接口
interface EventBus {
  subscribe<T>(event: string, handler: EventHandler<T>): () => void;
  publish<T>(event: string, data: T): Promise<void>;
}
```
