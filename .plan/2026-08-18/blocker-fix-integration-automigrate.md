# 既有阻塞修复记录：集成/E2E 测试 AutoMigrate"挂起"

- 日期：2026-08-18（实施尾期跟进）
- 关联：`.plan/2026-08-18/`（CLI 消息轮询修复进行中发现的既有阻塞）

## 现象
`tests/integration` / `tests/e2e` 的 `SetupTestDB → AutoMigrateSystem` 对所有用例（含与消息改动无关的 `TestMessage_SendReceive`）复现挂起，超过 90s/320s 仍未完成。

## 根因（确定性确认）
- 数据库累积 **209 个 `tenant_<uuid>` 孤儿 schema**（每个含 ~91 张表，全库约 **1.9 万张表**）。
- 来源：测试进程被 timeout 强杀时 `defer` 清理（`DropTestSchema`）不执行 → 每次泄漏 1 个 tenant schema；累积后 DB 持续膨胀。
- gorm AutoMigrate 靠 `information_schema` 目录自省，其 `SELECT ... FROM information_schema.table_constraints/columns ...` 会**跨全库所有 schema 扫描**，成本随 schema 数线性爆炸 → 病态变慢（表现为"挂起"）。

## 修复
1. **环境清理**：删除全部 209 个残留 `tenant_%` schema，DB 回到仅 `public`。
2. **复发预防**：`api/tests/integration/testutil/setup.go` 新增 `DropLeftoverTenantSchemas`，在 `SetupTestDB` 首次执行 `AutoMigrateSystem` 前自动删除残留 `tenant_%` schema，封堵"超时被杀 → 泄漏 → DB 膨胀 → 更易超时"的恶性循环。

## 回归结果（阻塞完全修复）
| 套件 | 结果 |
|------|------|
| TestMessage_*（8 项） | 全部 PASS（含修复前稳定挂起的 TestMessage_SendReceive，现 8.5s） |
| 完整 integration | **370 PASS / 0 FAIL / 0 SKIP**（完整跑完） |
| 完整 e2e | **PASS**（90s） |
| 修复前 AutoMigrate 单用例 | >320s 挂起 |
| 修复后单用例 | 5–9s 通过 |

## 附注
- 仅针对测试 harness；生产库建议另行建立孤儿 schema 清理巡检。
- 本次修复不改动被测业务逻辑与断言。