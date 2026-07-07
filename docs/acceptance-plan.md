# AI-Automated-office 验收测试体系规划

**Author:** PAN
**Date:** 2026-07-06
**Status:** Approved

---

## 一、总体架构

```
tests/
├── integration/              # L1: API集成测试（httptest + 真实DB）
│   ├── testutil/             #   测试基础设施
│   │   ├── setup.go          #   DB连接、Schema创建、数据清理
│   │   ├── fixture.go        #   测试数据工厂（Group/Enterprise/Department/Employee/User）
│   │   └── client.go         #   API测试客户端（封装httptest + 认证）
│   ├── epic1_auth_test.go    #   Epic 1: 认证授权
│   ├── epic2_org_test.go     #   Epic 2: 组织架构
│   ├── epic3_hrm_test.go     #   Epic 3: HRM
│   ├── epic4_crm_test.go     #   Epic 4: CRM
│   ├── epic5_ims_test.go     #   Epic 5: 进销存
│   ├── epic6_contract_test.go#   Epic 6: 合同/销售/售后
│   ├── epic7_finance_test.go #   Epic 7: 财务/审批
│   ├── epic8_infra_test.go   #   Epic 8: 附件/消息/知识库/Skill
│   ├── epic9_ops_test.go     #   Epic 9: 运营平台
│   └── epic10_data_test.go   #   Epic 10: 数据智能/部署
├── e2e/                      # L2: Agent对话模拟E2E测试
│   ├── testutil/
│   │   ├── server.go         #   真实API服务启动/停止
│   │   └── agent.go          #   Agent模拟器（角色+Skill调用链）
│   ├── journey_operator_test.go  # Journey 1: Operator初始化平台
│   ├── journey_owner_test.go     # Journey 2: Group Owner多企业管理
│   ├── journey_admin_test.go     # Journey 3: Enterprise Admin企业初始化
│   ├── journey_manager_test.go   # Journey 4: Department Manager部门管理
│   ├── journey_employee_test.go  # Journey 5: Employee日常使用
│   ├── journey_agent_test.go     # Journey 6: Agent处理业务流程
│   └── journey_cli_test.go       # Journey 7: CLI消息轮询机制
└── acceptance/               # L3: FR验收清单（Go测试+报告生成）
    ├── fr_coverage_test.go   #   FR覆盖率检查（286条FR逐条映射）
    └── nfr_check_test.go     #   NFR验证（性能/安全/可靠性）
```

---

## 二、测试基础设施设计

### 2.1 集成测试基础设施 (`tests/integration/testutil/`)

**setup.go** - 数据库生命周期管理：
- `SetupTestDB()` → 连接Docker PostgreSQL，创建测试专用Schema
- `TeardownTestDB()` → 清理测试Schema，断开连接
- `RunMigrations(db)` → 执行所有迁移到测试Schema
- `TruncateAll(db)` → 清空所有表数据（测试间隔离）

**fixture.go** - 测试数据工厂：
- `CreateTestGroup(db)` → 创建集团 + Owner用户
- `CreateTestEnterprise(db, groupID)` → 创建企业 + 自动Schema
- `CreateTestDepartment(db, enterpriseID, parentID)` → 创建部门
- `CreateTestEmployee(db, enterpriseID, deptID, role)` → 创建员工+用户
- `CreateTestUser(db, email, password, role)` → 创建用户+返回token
- `CreateFullOrgChain(db)` → 一次性创建完整组织链（Group→Enterprise→Dept→Employee）

**client.go** - API测试客户端：
- `NewTestClient(serverURL)` → 创建HTTP客户端
- `Login(email, password)` → 认证并保存token
- `SetEnterprise(enterpriseID)` → 设置X-Enterprise-ID头
- `GET/POST/PUT/PATCH/DELETE(path, body)` → 带认证的HTTP方法
- `AssertStatus(t, expected)` → 断言HTTP状态码
- `AssertErrorCode(t, expected)` → 断言业务错误码
- `AssertDataField(t, field, expected)` → 断言响应data字段

### 2.2 E2E测试基础设施 (`tests/e2e/testutil/`)

**server.go** - 真实服务管理：
- `StartAPIServer()` → 启动真实Gin服务（随机端口）
- `StopAPIServer()` → 优雅停止
- `WaitForReady(timeout)` → 等待/health返回200

**agent.go** - Agent模拟器：
- `NewAgentSimulator(serverURL, role)` → 按角色创建Agent
- `LoginAsOperator()/LoginAsOwner()/LoginAsAdmin()/LoginAsManager()/LoginAsEmployee()` → 角色登录
- `CallSkill(skillName, params)` → 模拟Skill调用（映射到API请求）
- `PollMessages()` → 模拟CLI轮询消息
- `ExecuteBusinessFlow(steps)` → 执行业务流程步骤链

---

## 三、实施方法清单

### 方法1: 集成测试编写（Go httptest + 真实PostgreSQL）

**步骤：**
1. 创建 `tests/integration/testutil/` 基础设施包
2. 编写 `setup.go`：连接Docker PostgreSQL（读取环境变量 `AO_TEST_DB_DSN`），创建测试Schema，运行迁移
3. 编写 `fixture.go`：测试数据工厂，每个工厂方法返回创建的实体+清理函数
4. 编写 `client.go`：基于 `net/http` 的测试客户端，封装认证+租户头+断言方法
5. 按Epic顺序编写集成测试文件，每个测试函数对应一条验收用例
6. 使用 `t.Parallel()` 并行加速，每个测试用例独立Schema隔离

**执行命令：**
```bash
# 启动测试DB
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis

# 运行集成测试
AO_TEST_DB_DSN="postgresql://ai_office:ai_office_pass@localhost:5432/ai_office_test?sslmode=disable" \
  go test ./tests/integration/... -v -count=1 -timeout 300s
```

### 方法2: E2E测试编写（真实API服务 + CLI api_client）

**步骤：**
1. 创建 `tests/e2e/testutil/server.go`：启动真实Gin服务（随机端口），等待/health就绪
2. 创建 `tests/e2e/testutil/agent.go`：Agent模拟器，封装角色登录+Skill调用链+消息轮询
3. 按Journey编写E2E测试，每个Journey是一个完整的业务流程
4. 测试内启动API服务→执行Journey→断言最终状态→停止服务

**执行命令：**
```bash
go test ./tests/e2e/... -v -count=1 -timeout 600s
```

### 方法3: FR覆盖率检查（自动化映射+报告生成）

**步骤：**
1. 编写 `tests/acceptance/fr_coverage_test.go`：定义286条FR到测试函数的映射表
2. 每条FR标记：`automated`（已有测试覆盖）/ `manual`（需手工验证）/ `not_applicable`（MVP不适用）
3. 运行时检查所有 `automated` FR是否有对应测试通过
4. 生成覆盖率报告：已自动化/总数/覆盖率%

**执行命令：**
```bash
go test ./tests/acceptance/... -v -count=1
```

### 方法4: NFR性能/安全验证

**步骤：**
1. 性能测试：使用Go的 `-bench` 基准测试，或编写并发压测循环
2. 安全测试：注入SQL/XSS payload，验证参数化查询安全
3. 多租户隔离：企业A的token访问企业B数据→返回空/403

**执行命令：**
```bash
go test ./tests/acceptance/... -v -run TestNFR -bench . -benchtime 10s
```

### 方法5: CLI端到端验证

**步骤：**
1. 编译CLI二进制
2. 使用 `os/exec` 调用CLI命令
3. 验证输出格式（JSON/table/text）
4. 验证消息轮询机制

**执行命令：**
```bash
go test ./tests/e2e/... -v -run TestJourney_CLI
```

---

## 四、验收执行顺序

```
Phase A: 基础设施搭建
  1. 创建 tests/ 目录结构
  2. 编写 testutil 基础设施（setup/fixture/client）
  3. 验证基础设施可运行

Phase B: Epic 1-2 集成测试（依赖链底部）
  4. 编写 epic1_auth_test.go（29个用例）
  5. 编写 epic2_org_test.go（27个用例）
  6. 运行并通过

Phase C: Epic 3-5 集成测试（业务模块）
  7. 编写 epic3_hrm_test.go（9个用例）
  8. 编写 epic4_crm_test.go（14个用例）
  9. 编写 epic5_ims_test.go（27个用例）
  10. 运行并通过

Phase D: Epic 6-8 集成测试（高级业务+基础设施）
  11. 编写 epic6_contract_test.go（27个用例）
  12. 编写 epic7_finance_test.go（33个用例）
  13. 编写 epic8_infra_test.go（35个用例）
  14. 运行并通过

Phase E: Epic 9-10 集成测试（运营+数据智能）
  15. 编写 epic9_ops_test.go（39个用例）
  16. 编写 epic10_data_test.go（62个用例）
  17. 运行并通过

Phase F: E2E Journey测试
  18. 编写 E2E基础设施（server.go/agent.go）
  19. 编写8个Journey测试
  20. 运行并通过

Phase G: NFR验证 + FR覆盖率报告
  21. 编写NFR验证测试
  22. 编写FR覆盖率检查
  23. 生成验收报告
```

---

## 五、测试统计

| 层级 | 测试文件数 | 测试用例数 | 覆盖FR数 |
|------|-----------|-----------|---------|
| L1 集成测试 | 10 | 273 | 286 |
| L2 E2E测试 | 8 | 8 | 8个Journey |
| L3 NFR验证 | 2 | 13 | 全部NFR |
| **合计** | **20** | **294** | **286 FR + 全部NFR** |
