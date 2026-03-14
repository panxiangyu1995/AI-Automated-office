# Design: Tauri桌面应用初始化

## 技术方案

### 项目结构

```
ai-automated-office/
├── package.json                    # 前端依赖配置
├── pnpm-lock.yaml                  # pnpm 锁定文件
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 构建配置
├── tailwind.config.js              # Tailwind 配置
├── postcss.config.js               # PostCSS 配置
├── .env.example                    # 环境变量示例
├── .gitignore                      # Git 忽略配置
├── components.json                 # Shadcn/ui 配置
├── init.sh                         # 初始化脚本
│
├── src/                            # 前端源码
│   ├── main.tsx                    # 应用入口
│   ├── App.tsx                     # 根组件
│   ├── vite-env.d.ts               # Vite 类型声明
│   ├── components/                 # UI 组件
│   ├── features/                   # 功能模块
│   ├── hooks/                      # 全局 Hooks
│   ├── stores/                     # Zustand 状态
│   ├── lib/                        # 工具和服务
│   ├── types/                      # 全局类型
│   └── styles/                     # 全局样式
│
├── src-tauri/                      # Tauri/Rust 后端
│   ├── Cargo.toml                  # Rust 依赖配置
│   ├── tauri.conf.json             # Tauri 配置
│   ├── build.rs                    # 构建脚本
│   └── src/
│       ├── main.rs                 # Rust 入口
│       ├── lib.rs                  # 库入口
│       ├── agent/                  # Agent 核心
│       ├── plugins/                # 插件系统
│       ├── storage/                # 本地存储
│       ├── auth/                   # 认证授权
│       ├── commands/               # Tauri 命令
│       └── utils/                  # 工具函数
│
└── tests/                          # 测试目录
```

### 前端实现

#### 核心依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^2.0.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

#### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

### 后端实现（Rust）

#### Cargo.toml 核心依赖

```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon"] }
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
sqlx = { version = "0.7", features = ["runtime-tokio", "sqlite"] }
```

#### Tauri 配置

```json
{
  "productName": "AI-Automated-office",
  "version": "0.1.0",
  "identifier": "com.ai-automated-office.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "AI-Automated-office",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

## API 设计

### Tauri 命令

```rust
// src-tauri/src/commands/system.rs
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn check_updates() -> Result<UpdateInfo, String> {
    // 更新检查逻辑
}
```

## 组件设计

### 新增组件
- `App.tsx`: 根组件，包含路由和全局状态
- `main.tsx`: 应用入口，初始化 React 和 Tauri

## 状态管理

使用 Zustand 进行状态管理：

```typescript
// src/stores/appStore.ts
import { create } from 'zustand'

interface AppState {
  initialized: boolean
  setInitialized: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  initialized: false,
  setInitialized: (value) => set({ initialized: value }),
}))
```

## 安全考虑

1. **CSP 配置**: 生产环境启用严格的内容安全策略
2. **依赖审计**: 使用 `pnpm audit` 检查依赖安全
3. **API Key 存储**: 本地加密存储，不明文传输

## 性能考虑

1. **启动优化**: 延迟加载非关键组件
2. **内存管理**: 避免内存泄漏，定期清理缓存
3. **包体积**: 使用 Vite 的 tree-shaking 优化
