# Spec: Browser Tool Full Playwright Integration

## Overview

重构 `browser_interact` 工具为完整的 Playwright 集成，参考 OpenClaw `pw-tools-core.*` 的 8 个子模块设计。

## Motivation

当前 `browser_interact` 仅为 CDP 框架占位，缺乏完整的浏览器自动化能力。OpenClaw 提供了成熟的 Playwright 集成方案，可直接借鉴。

## Design

### Action 分类

```
browser_interact
├── browser_control
│   ├── status          # 获取浏览器状态
│   ├── start          # 启动浏览器
│   ├── stop           # 停止浏览器
│   ├── profiles       # 列出可用 profile
│   ├── tabs          # 列出标签页
│   ├── open          # 打开新标签
│   ├── close         # 关闭标签页
│   └── focus         # 聚焦标签页
├── navigation
│   ├── navigate       # 导航到 URL
│   ├── back          # 后退
│   ├── forward       # 前进
│   └── refresh       # 刷新
├── snapshot
│   ├── aria_snapshot  # ARIA 树快照
│   ├── ai_snapshot   # AI 优化快照
│   └── role_snapshot # Role 引用快照
├── screenshot
│   ├── full_page     # 全页面截图
│   └── element       # 元素截图
├── interaction
│   ├── click         # 点击
│   ├── dblclick      # 双击
│   ├── rightclick    # 右键
│   ├── hover         # 悬停
│   ├── type          # 输入文本
│   ├── press         # 按键
│   ├── select        # 选择下拉
│   ├── fill          # 填充表单
│   ├── drag          # 拖拽
│   ├── submit        # 提交表单
│   └── batch         # 批量操作
├── file_upload
│   ├── arm_file_chooser     # 监听文件选择
│   └── disarm_file_chooser  # 取消监听
├── dialog
│   ├── arm_dialog    # 监听对话框
│   ├── accept       # 接受
│   └── dismiss       # 拒绝
├── download
│   ├── arm_download  # 监听下载
│   └── wait         # 等待下载完成
├── console
│   └── messages     # 获取控制台消息
├── network
│   ├── requests     # 获取网络请求
│   └── response_body # 获取响应体
├── state
│   ├── offline      # 离线模式
│   ├── extra_headers # 额外请求头
│   ├── credentials  # 认证信息
│   └── geolocation  # 地理位置
└── storage
    ├── cookies      # Cookie 管理
    ├── local_storage # LocalStorage
    └── session_storage # SessionStorage
```

### CDP 客户端封装

```rust
// browser/cdp_client.rs

pub struct CdpClient {
    endpoint: String,
    browser_id: Option<String>,
    context_id: Option<String>,
}

impl CdpClient {
    pub async fn new(endpoint: &str) -> Result<Self> {
        Ok(Self {
            endpoint: endpoint.to_string(),
            browser_id: None,
            context_id: None,
        })
    }
    
    pub async fn launch(&mut self, profile: &str) -> Result<String> {
        // 调用 Playwright CDP Server
        // POST /launch { profile }
        // 返回 browser_context_id
    }
    
    pub async fn send_cmd(&self, method: &str, params: Value) -> Result<Value> {
        // HTTP POST 到 CDP endpoint
    }
}
```

### 工具参数结构

```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum BrowserInteractParams {
    // 浏览器控制
    Status,
    Start { profile: Option<String> },
    Stop,
    Profiles,
    Tabs,
    Open { url: String },
    Close { page_id: Option<String> },
    Focus { page_id: String },
    
    // 导航
    Navigate { url: String },
    Back,
    Forward,
    Refresh,
    
    // 快照
    Snapshot { 
        format: SnapshotFormat,
        root: Option<String>,
    },
    
    // 截图
    Screenshot {
        full_page: Option<bool>,
        element: Option<String>,
        path: Option<String>,
    },
    
    // 交互
    Interact {
        selector: String,
        action: InteractionType,
        params: Option<InteractionParams>,
    },
    
    // ...
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SnapshotFormat {
    Aria,
    Ai,
    Role,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InteractionType {
    Click,
    DblClick,
    RightClick,
    Hover,
    Type { text: String },
    Press { key: String },
    Select { value: String },
    Fill { value: String },
    Drag { target: String },
    Submit,
}
```

## Playwright Server 集成

```rust
// 使用 Playwright HTTP Server 模式
// 启动命令: playwright launch-server --browser chromium

const DEFAULT_PLAYWRIGHT_ENDPOINT: &str = "http://localhost:9222";

pub struct PlaywrightServer {
    endpoint: String,
    process: Child,
}

impl PlaywrightServer {
    pub async fn start() -> Result<Self> {
        let mut child = Command::new("playwright")
            .args(["launch-server", "--browser", "chromium"])
            .spawn()?;
        
        // 等待服务启动
        tokio::time::sleep(Duration::from_secs(2)).await;
        
        Ok(Self {
            endpoint: DEFAULT_PLAYWRIGHT_ENDPOINT.to_string(),
            process: child,
        })
    }
}
```

## Acceptance Criteria

1. 所有 Action 可正常执行
2. 快照格式正确（aria/ai/role）
3. 交互操作与 OpenClaw 行为一致
4. 错误处理完善，返回清晰的错误信息
5. 支持多 profile 隔离

## Open Questions

1. Playwright Server 进程管理：内嵌还是独立？
2. 是否需要实现 trace 录制功能？
