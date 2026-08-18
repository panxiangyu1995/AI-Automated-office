# 创新/方案分析：CLI 消息轮询修复方案与备选

- 创建日期：2026-08-18
- 阶段：INNOVATE（方案）
- 前置：`research-findings.md`（Gap-1..9）

---

## 一、设计目标（修复后应达成的行为基线）

1. `poll start`：后台持续轮询，间隔可配置（默认 30s）。
2. 只对「未读 → 已读 过渡」中的**新**消息通知/输出一次；重复轮询不重复通知。
3. `poll stop` / Ctrl+C 优雅停止。
4. 有新消息时输出到终端并可交付 Agent；OS 通知按配置决定。
5. skill 前置 hook 与 poll 守护共用同一未读判定 + 本地去重缓存。
6. 处理后可标记已读，标记后不再出现。

---

## 二、分项方案与备选

### Gap-1：`poll stop` 缺失
- **方案 A（推荐）**：pid 文件 + 信号。`start` 写 `$HOME/.ai-office-cli/poll.pid`，`signal.Notify` 优雅退出并清理；`stop` 读 pid 发 SIGINT + 删 pid。
- **方案 B**：真正的守护进程 + `poll status`（对齐 Story 13 开机自启）。功能更强但侵入大、与现有前景式 `select{}` 差异大。
- **取舍**：选 A（YAGNI），守住 Story 10.17 的 start/stop；Story 13 开机自启不在本次验收范围。

### Gap-2 / Gap-6：poll 返回全量、非增量、非未读、无 long-poll/304/Redis
- **方案 A（推荐）**：后端 `Poll()` 加 `is_read=false` 过滤 + `since` 增量游标（RFC3339），返回未读增量；304/Long-Poll/Redis 作为后续压测类增强。
- **方案 B**：完整实现架构图的 Adaptive+304+Long-Poll+Redis PubSub 计数。工作量大，且 304 对「通知去重」非必需。
- **取舍**：本次验收核心是「未读/增量」，选 A；压测类优化（304/Long-Poll/Redis PubSub）列入**已知不验收项**。

### Gap-3 / Gap-9：未读检查不校验已读、无本地去重缓存
- **方案 A（推荐）**：CLI 维护本地游标文件（`$HOME/.ai-office-cli/messages.cursor`，存 last_seen 时间），通知后推进游标，实现去重；后端 `is_read` 过滤保证已读即消失。两者职责互补：本地缓存防"标记已读前重复口头通知"，后端过滤防"已读后再出现"。
- **方案 B**：仅靠后端增量游标，不落本地文件（但同一批未读在标记已读前可能被多次 hook 重复口头通知）。
- **取舍**：A（本地缓存）+ 后端未读过滤共存。

### Gap-4：`Notify.Enable` 配置未生效
- **取值（需确认）**：终端输出**无条件**（主送达通道，Story 10.17 要求）；**OS 通知按 `cfg.Notify.Enable` 门控**。`UnreadCheckOnConversationStart` 与 poll 共用该语义。

### Gap-5：轮询间隔不可配置
- **取值**：`poll start` 读 `cfg.Poll.Interval`（缺省 30s），支持 `--interval` 覆盖；AdaptivePoller min/max 纳入配置或默认 5s/300s。

### Gap-7：已读未接线
- **取值（需确认）**：保留已上线路由 `POST /messages/:id/read`、`POST /messages/read`（e2e/integration 已在测）；新增 `ao-cli message mark-read` 接线；**不新增 `/ack` 别名**，文档统一为 `/read`。已读为**显式操作**（Agent/用户处理完再标），不进"通知即已读"路径。

### Gap-8：端点路径不一致
- **取值（需确认）**：以现有企业作用域 `/api/v1/enterprises/{eid}/messages/...` 为准（多租户隔离更严谨且已上线），**只改文档、不迁移路径**。

---

## 三、规划假设（PA）

| # | 假设 | 取值 | 可否决 |
|---|------|------|--------|
| PA-1 | 后端只做未读 + `since` 增量；不做 304/Long-Poll/Redis PubSub | 是 | 可 |
| PA-2 | 终端输出无条件、OS 通知按 `Notify.Enable` 门控 | 是 | 可 |
| PA-3 | 不加 `/ack` 别名，文档统一 `/read`；新增 `message mark-read` | 是 | 可 |
| PA-4 | 端点以企业作用域为准，只改文档不迁移路径 | 是 | 可 |
| PA-5 | poll 改未读增量后，移除客户端按 msg_type 排除逻辑（announcement 为独立模型天然不在 messages；notification/reminder 属真实消息应送达） | 是 | 可 |

---

## 四、数据源策略（执行前需确认的开放项）

CLI 侧去重/增量数据源两种选择：
- **C1（已选）**：CLI 走 poll 端点 `/messages/poll?since=...`，后端未读+增量为唯一数据源；本地游标文件负责"打完即不再报"。
- **C2（备选）**：CLI 走 `/messages` 列表端点并自行在客户端按 `is_read` 过滤。

两方案在 `implementation-plan.md` 中按 C1 展开；如执行时确认需 C2，则 C1 去重逻辑相应简化。