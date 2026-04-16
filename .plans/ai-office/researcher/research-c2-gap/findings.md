# R1.5b 差距验证报告（2026-04-16 重新验证）

> 从代码实际出发重新验证，不依赖之前分析。

---

## G2: Knowledge Tauri命令是否仍被注释 — 未修复

**证据**: `src-tauri/src/lib.rs:401-405`
```rust
// Knowledge commands - commands not yet implemented, only service layer available
// knowledge::knowledge_upload_document,
// knowledge::knowledge_search,
// knowledge::knowledge_document_status,
// knowledge::knowledge_delete_document,
// knowledge::knowledge_rebuild_index,
```
5个knowledge命令全部仍被注释。服务层存在，但Tauri命令层未暴露给前端。

---

## G3: RBAC是否已接入业务模块 — 部分修复

**已接入（5/8）**:
| 模块 | 文件 | 行号 | 证据 |
|------|------|------|------|
| hr | `hr/commands.rs` | :5, :21 | `use crate::auth::{AuthService, check_permission, Permission}` + `check_permission(&user, permission)?` |
| finance | `finance/commands.rs` | :3, :23 | 同上 |
| sales | `sales/commands.rs` | :3, :23 | 同上 |
| warehouse | `warehouse/commands.rs` | :3, :23 | 同上 |
| approval | `approval/commands.rs` | :3, :37 | 同上 |

**未接入（3/8）**:
| 模块 | 文件 | 状态 |
|------|------|------|
| service | `service/commands.rs` | 无 check_permission 引用 |
| tender | `tender/commands.rs` | 无 check_permission 引用 |
| marketing | `marketing/commands.rs` | 无 check_permission 引用 |

---

## G9: Updater配置是否已移除 — 部分修复

**证据**:
- `tauri.conf.json` — 无 updater/pubkey/endpoint 配置（已移除）
- `Cargo.toml` — 仍有 `tauri-plugin-updater = "2"` 依赖（未清理）
- `plugins` section 仅有 shell 和 websocket，无 updater

**结论**: 配置已移除，但 Rust 依赖残留。运行时不会生效（无配置），但增加编译体积。

---

## G10: Marketplace后端是否仍为Mock — 未修复

**证据**: `src-tauri/src/marketplace/commands.rs`
- 第7-8行: `MarketplaceState { pub plugins: Mutex<Vec<MarketplacePlugin>> }` — 内存存储
- 第13-19行: `MarketplacePlugin { id: "after-sales"... }` 等5个硬编码插件
- 第28行: `state.plugins.lock().unwrap().clone()` — 直接读内存
- 第33-37行: 安装仅设置 `p.installed = true`，无持久化
- 无任何 SQLite/文件系统 读写

**结论**: 完全Mock，零持久化，重启后状态丢失。

---

## G11: plugins/目录是否仍为空 — 基本未变

**证据**:
```
plugins/
  finance/
    agent/
      config.yaml
```
仅1个文件 `plugins/finance/agent/config.yaml`。缺少:
- manifest.json（插件清单）
- index.ts（插件入口）
- components/（UI组件）
- hooks/（业务逻辑）
- types/（类型定义）
- backend/（后端逻辑）

---

## G16: network/模块是否仍为空壳 — 基本修复

**证据**: `src-tauri/src/network/status.rs`（45行）
- `NetworkStatus` 结构体（is_online, connection_type, last_checked）
- `check_network_status()` — TCP连接 8.8.8.8:53 检测在线状态
- `get_network_status()` — 获取完整网络状态
- `start_monitor(app)` — 5秒轮询 + `app.emit("network-status-changed", status)` 事件发射

**缺少**: 重连逻辑、connection_type 检测（始终为 "unknown"）、离线队列

---

## G19: data_sync.rs:288 的unwrap是否已修复 — 未修复

**证据**: `src-tauri/src/sync/data_sync.rs:288-289`
```rust
let mut arr = l.as_array().unwrap().clone();
for item in r.as_array().unwrap() {
```
两处 `.as_array().unwrap()` 仍在。逻辑上前面有 `if l.is_array() && r.is_array()` 保护，但 unwrap 在生产代码中不符合安全规范，应改为 `if let` 模式匹配。

---

## 额外发现: G20 CSP unsafe-inline 仍在

**证据**: `tauri.conf.json:27`
```
"csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ..."
```
`style-src 'self' 'unsafe-inline'` 仍存在。
