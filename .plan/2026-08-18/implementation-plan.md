# 实施计划：CLI 消息轮询修复

- 创建日期：2026-08-18
- 阶段：PLAN（规划）
- 前置：`research-findings.md`（Gap-1..9）、`innovation-solutions.md`（方案 + PA-1..5）

---

## 一、目的与效果

**目的**：修复消息轮询链路 9 项偏差，使"轮询 → 未读 → 通知 → 标记已读"完全符合 PRD/Epic/架构铁律，并具备：
- 只对**新**未读消息送达一次（去重）；
- 间隔可配置、可优雅停止；
- CLI 与 skill hook 共用同一判定。

**效果（验收基线）**：
1. `poll start` 可配置间隔后台轮询；有新消息→终端输出 +（按配置）OS 通知；无新增不重复输出。
2. `poll stop`/Ctrl+C 优雅停止并清理 pid。
3. `/messages/poll` 只返回该接收者未读、且晚于 `since` 的增量消息。
4. `ao-cli message mark-read`（单/批量）可将消息标记已读；标记后不再出现。
5. skill 前置 hook 不再把已读/已通知消息重复口头通知。

---

## 二、变更清单

### 后端（API）

**B1. `api/internal/repository/message_repo.go`**
- 接口新增：
  `ListUnreadByReceiver(enterpriseID uuid.UUID, receiverID string, since time.Time, limit int) ([]model.Message, error)`
- 实现：`WHERE enterprise_id=? AND receiver_id=? AND is_read=false`；`since` 非零追加 `AND created_at > ?`；`ORDER BY created_at ASC`；`LIMIT ?`。

**B2. `api/internal/service/message_service.go`**
- `Poll` 签名改为：
  `func (s *MessageService) Poll(enterpriseID, receiverID, since string, limit int) ([]model.Message, *apperrors.AppError)`
- 解析 `since`（RFC3339；空串→零值不过滤，非法→ValidationError）；`limit` 默认 50、上限 100。

**B3. `api/internal/handler/message_handler.go`**
- `Poll` 读取查询参数 `since`、`limit` 并透传。

> 现有 `TestMessage_Poll`（断言 200/404）与 `e2e/journey_cli_test.go` 不受影响。

### CLI

**C1. `cli/internal/poller/unread_check.go`（核心重构）**
- 游标持久化（FR-MSG-003 本地缓存）：
  - `cursorPath(cfg) string`：`cfg.Poll.CursorFile` 或默认 `$HOME/.ai-office-cli/messages.cursor`
  - `loadCursor(path) (time.Time, error)`、`saveCursor(path, t time.Time) error`
- 新增：
  - `FetchNewUnread(cfg *config.Config, since time.Time) ([]UnreadMessage, time.Time, error)`：`GET /api/v1/enterprises/{eid}/messages/poll?since=<RFC3339>&limit=100`；返回消息 + 最新一条 `created_at`（推进游标用）。
  - `CheckAndNotify(cfg *config.Config, cursorPath string) (int, error)`：加载游标→拉新未读→无则 0→**无条件打印**→`Notify.Enable` 真时 `SendNotification`（真实 `cfg.Notify`，去硬编码）→推进游标→返回条数。
- 重写 `UnreadCheckOnConversationStart(cfg)`：改为调用 `CheckAndNotify`（游标同源）；移除 `msg_type` 排除分支。
- `UnreadMessage` 保留 `id/title/content/msg_type/sender_id/created_at`；`fetchUnreadMessages`、`RefreshTokenIfNeeded` 是否保留由执行时确认死代码状态。

**C2. `cli/cmd/poll.go`**
- `start`：读 `cfg.Poll.Interval`（缺省 30s）与 min/max（5s/300s）；写 pid；`signal.Notify`(SIGINT/SIGTERM)→优雅 `Stop`→清 pid→正常退出（替换 `select{}`）；callback 改调 `CheckAndNotify`；新增 `--interval`。
- `stop`：读 pid→发 SIGINT→删 pid；pid 不存在则提示"无运行中的轮询"。

**C3. `cli/cmd/message.go`（新）**
- `newMessageCmd()` + `mark-read`：`--id <uuid>`（单条→`MarkAsRead`）、`--ids a,b`（批量→`BatchMarkAsReadResult`）。

**C4. `cli/cmd/root.go`**
- `rootCmd.AddCommand(newMessageCmd())`。

**C5. `cli/internal/config/config.go`**
- `PollConfig` 增加 `CursorFile string \`yaml:"cursor_file"\``。

### 测试

**T1. 单元测试**
- `message_service_test.go`：`Poll` 的 `since` 过滤、非法 since、limit 上限。
- `poller` 包：`CheckAndNotify`（有/无新消息、通知开关）、`loadCursor/saveCursor`。

### 文档同步（Doc-Code Sync）

**D1.** `.plans/ai-office/docs/api-contracts.md`：统一轮询端点口径 `/api/v1/enterprises/{eid}/messages/poll`（`since`/`limit`），已读为 `/read`。
**D2.** `docs/api/openapi.yaml` 若含 poll/read 定义则同步更新。

---

## 三、实施清单（原子操作）

1. B1 `message_repo.go` 新增 `ListUnreadByReceiver`（接口 + 实现）
2. B2 `message_service.go` 修改 `Poll` 签名，改查未读 + since
3. B3 `message_handler.go` 修改 `Poll` 透传 `since`、`limit`
4. C5 `config.go` 为 `PollConfig` 增加 `CursorFile`
5. C1 `unread_check.go` 新增游标/`FetchNewUnread`/`CheckAndNotify`，重写 `UnreadCheckOnConversationStart`，移除 type 排除
6. C2 `poll.go` 重写 `start`（pid/信号/可配置间隔/`CheckAndNotify`），新增 `stop`
7. C3 新建 `message.go` 实现 `mark-read`
8. C4 `root.go` 注册 `newMessageCmd`
9. T1 补充单元测试
10. D1/D2 文档同步
11. 运行 `go vet` / `go build` / `go test ./...`（api、cli 各目录）
12. 更新 `progress.txt` 与 `task.json`（视执行时确认对应任务条目口径）
13. 一处 commit 提交全部变更 + 更新 `task.json`

---

## 四、执行前需确认的开放项

- 是否批准 PA-1..5 默认取值（见 `innovation-solutions.md`）。
- C1 vs C2 数据源策略（本计划按 C1 展开）。
- 若 VIP：需在 EXECUTE 前批准本清单；允许中途在遇到与预期不符时返回 PLAN 模式对齐。