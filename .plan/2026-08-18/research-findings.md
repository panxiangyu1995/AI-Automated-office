# 研究结论：CLI 消息轮询与通知能力「轮询 → 未读 → 通知」验收基线

- 创建日期：2026-08-18
- 阶段：RESEARCH（研究）
- 目标对象：`ao-cli poll` + Skill 前置未读 hook + 服务端消息 Poll

> 本文为**事实记录**。全部内容来自对源码的直接阅读，终端输出与判断不含猜测。信息可按引用定位到文件:行号复核。

---

## 一、验收要检验的目的与效果

消息轮询功能的设计意图（取自铁律文档 `_bmad-output/planning-artifacts/`）：

1. 本地 CLI 后台持续轮询，在不依赖 Agent 定时任务的前提下，把**未读/新增**消息及时送达用户。
2. 有新消息时：**CLI 通知 Agent → Agent 告知用户**，或直接输出到终端。
3. 处理完成后消息被**标记已读**，且不再重复通知。
4. 轮询间隔**可配置**，并具备去重缓存能力，避免重复打扰。

---

## 二、铁律定义（需求基线）

来源：`prd.md`、`architecture.md`、`epics.md`

| 来源 | 编号/段落 | 要求 |
|------|-----------|------|
| PRD | FR-MSG-002 | CLI 轮询获取**未读**消息，默认 30 秒间隔 |
| PRD | FR-MSG-003 | CLI 支持**本地缓存未读消息** |
| PRD | FR-MSG-005 | 用户可标记消息为已读 |
| PRD | Journey 7 | CLI 每 30 秒轮询 `/api/v1/messages/unread`；有新增→通知 Agent→告知用户→处理完标记已读 |
| PRD / NFR | NFR-PERF-005 | CLI 轮询间隔默认 30 秒，**可配置** |
| PRD | Journey 8 | 跨部门：消息通过 CLI 轮询送达接收者 |
| Epic | Story 8.4 | `GET /messages/poll` 返回**未读**；每 60 秒轮询返回**增量**（上次之后的新消息）；`POST /messages/{id}/ack` 标记已读 |
| Epic | Story 10.17 | `ao-cli poll start` 后台轮询（每 60 秒），**有新消息输出到终端**；`ao-cli poll stop` 停止 |
| 架构 | Message Polling System | Adaptive Polling（有新→缩短 5s / 无→延长至 300s）；增量 last_id/cursor；304 无变化；未读计数 Redis 缓存；Long Polling 30s |

**验收目标行为基线（据此判定"达标"）：**

- `poll start` 后台持续轮询，间隔可配置（默认 30s）。
- 只对「未读 → 已读 过渡」中的**新**消息通知/输出一次；重复轮询不重复通知。
- `poll stop` / Ctrl+C 能优雅停止。
- 有新消息时输出到终端并可交付 Agent，OS 通知按配置决定。
- skill 前置 hook 与轮询守护共用同一未读判定 + 本地去重缓存，避免双通道重复通知。
- 处理后可标记已读，标记后不再出现。

---

## 三、代码实际情况（逐环节事实）

完整链路构成：

| 环节 | 文件 | 现状事实 |
|------|------|---------|
| Skill 前置 hook | `cli/cmd/skill.go:165-169` | 每次 `executeSkill` 前调用 `poller.UnreadCheckOnConversationStart(cfg)`（排除 `message_unread_check`/`message_unread`） |
| 主动轮询命令 | `cli/cmd/poll.go:28-44` | `ao-cli poll start` 启动 `AdaptivePoller`（5s/300s/60s），循环调 `pollMessagesWithCount` |
| 轮询客户端 | `poll.go:55-99` | `GET /api/v1/enterprises/{eid}/messages/poll?timeout=60` |
| 未读检查 | `poller/unread_check.go:28-103` | `GET /api/v1/enterprises/{eid}/messages?page=1&page_size=50` |
| API Poll 端点 | `api/internal/handler/message_handler.go:161` → `service/message_service.go:182` | `Poll()` 仅调 `ListByReceiver(page1,50)` |
| API 列表查询 | `api/internal/repository/message_repo.go:49-56` | `ListByReceiver` 查**全部消息**（不分已读/未读） |
| 通知发送 | `poller/notification.go:18-110` | darwin=osascript / linux=notify-send / windows=PowerShell Toast / 其他=stdout；另支持 mark 文件、OpenClaw hook |
| 已读标记 | `poller/mark_read.go`、`unread_check.go:105` | `MarkAsRead`/`BatchMarkAsRead`/`BatchMarkAsReadResult` 已定义**但无调用方** |
| 自适应间隔 | `poller/poller.go:26-53` | 有消息→减半；无消息→×1.5，封顶 maxInterval |
| 消息模型 | `api/internal/model/knowledge.go:23-35` | `Message` 含 `ID`、`CreatedAt`、`IsRead`、`MsgType` 等；内嵌 `BaseModel`/`TenantModel`（`model/base.go:1-25`） |
| API client | `cli/pkg/api_client/client.go` | `Get(path)`/`Post(path,body)` 接受 path 含查询串；自动带 `X-Request-Source: ao-cli`、Bearer、`X-Enterprise-ID` |

---

## 四、问题点（Gap）

1. **[Gap-1] 无 `poll stop`**：`poll start` 仅注册 `start` 子命令，用 `select{}` 永久阻塞，只能 Ctrl+C（违反 Story 10.17）。
2. **[Gap-2] 轮询返回全量、非增量、不区分未读**：`ListByReceiver` 只按 `enterprise_id + receiver_id` 返回**所有**消息（含已读）前 50 条，无 `is_read=false` 过滤、无 last_id/cursor；`pollMessagesWithCount` 返回 `len(messages)` 几乎恒定，AdaptivePoller 无法感知"新消息"（违反 Story 8.4、FR-MSG-002、Journey 7）。
3. **[Gap-3] 未读检查不校验已读状态**：`fetchUnreadMessages` 只按 `msg_type` 排除 announcement/notification/reminder，把剩余消息一律当未读计数（含已读）；无本地缓存/上次已通知标记，导致每次运 skill 重复通知同批消息（违反 FR-MSG-002/003）。
4. **[Gap-4] Notify Enable 配置未生效**：`UnreadCheckOnConversationStart` 硬编码 `NotifyConfig{Enable:true}`，不读 `cfg.Notify.Enable`；`SendNotification` 又依赖 Enable，两路径语义不一。
5. **[Gap-5] 轮询间隔不可配置**：`poll start` 硬编码 5s/300s/60s，不读 `cfg.Poll.Interval`（违反 NFR-PERF-005）。
6. **[Gap-6] timeout 被忽略、无 Long-Poll/304/Redis 计数**：API `Poll()` 解析 timeout 仅 clamp（5–30），实际走普通 `ListByReceiver`，阻塞/304/Redis 未读数均未落地。
7. **[Gap-7] 已读 CLI 未接线**：`mark_read.go`/`unread_check.go` 的已读函数无任何命令/调用方；API 端点为 `POST /messages/:id/read` 与 `/messages/read`，与 Epic 规定的 `/{id}/ack` 命名不一致。
8. **[Gap-8] 端点路径不一致**：实现走 `/api/v1/enterprises/{eid}/messages/...`，Epic/Journey 引用 `/api/v1/messages/poll`、`/api/v1/messages/unread`。
9. **[Gap-9] 测试覆盖不足**：CLI 仅 `poller_test.go`（测 `AdjustInterval`）；API `epic8_infra_test.go` 仅断言 poll 返回 200/404；`journey_cli_test.go` 仅断言 poll=200；均未验证「未读增量」「有新增才通知」「标记已读后不再通知」。

---

## 五、结论（确定性事实）

- 消息轮询链路**代码已存在且自成一套**，但与铁律定义存在 **9 项确定性偏差**。
- 直接冲击核心验收点的偏差：Gap-2 / Gap-3 / Gap-4 / Gap-5（未读、增量、通知配置、间隔配置）。
- 影响完整性/可测性的偏差：Gap-1（poll stop）、Gap-9（测试有效性）。

**决策：** 因偏差过多，暂不投入验收测试；先制定并实施修复方案（见 `innovation-solutions.md` 与 `implementation-plan.md`）。