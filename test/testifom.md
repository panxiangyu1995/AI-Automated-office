# AI-Automated-Office 模拟用户测试指南

## 环境信息

| 项目 | 值 |
|------|-----|
| API 地址 | http://localhost:8080 |
| PostgreSQL | localhost:5432 (ai_office / ai_office_pass / ai_office) |
| Redis | localhost:6379 |
| 测试企业A | 模拟测试企业 (ID: b0000000-0000-0000-0000-000000000001) |
| 测试企业B | 模拟测试企业B (ID: b0000000-0000-0000-0000-000000000002) |
| 测试集团 | 模拟测试集团 (ID: a0000000-0000-0000-0000-000000000001) |
| Tenant Schema A | tenant_b0000000_0000_0000_0000_000000000001 |
| Tenant Schema B | tenant_b0000000_0000_0000_0000_000000000002 |
| CLI 命令 | `ao-cli skill execute <skill_name> --action <action> --params '<json>'` |
| HMAC Secret | change-me-in-production (需在 ~/.ai-office-cli/config.yaml 中设置 hmac_secret) |
| CLI 二进制 | /Users/pxy1995/code/myrepo/AI-Automated-office/cli/bin/ao-cli |

## 测试账号

| 角色 | 邮箱 | 密码 | 姓名 | 部门 | 职位 | 权限范围 |
|------|------|------|------|------|------|----------|
| 运营商(operator) | admin@test.com | test123 | 测试管理员 | - | - | 全平台管理，可切换任意企业 |
| 老板(owner) | boss@moni-test.com | boss123 | 王老板 | 总经办 | 总经理 | 企业全部权限+跨企业访问 |
| 管理员(admin) | admin@moni-test.com | test123 | 李管理 | 总经办 | 行政总监 | 企业管理（除系统配置外） |
| 财务经理(manager) | finance@moni-test.com | finance123 | 赵财务 | 财务部 | 财务经理 | 财务读写+员工/客户/合同/订单读取 |
| 仓库经理(manager) | warehouse@moni-test.com | warehouse123 | 孙仓管 | 仓储部 | 仓储经理 | 库存管理+物料/供应商读写+订单读写 |
| 销售经理(manager) | sales@moni-test.com | sales123 | 周销售 | 销售部 | 销售经理 | 客户/合同/订单读写+财务读取 |
| 普通员工(employee) | employee@moni-test.com | employee123 | 吴员工 | 销售部 | 销售专员 | 客户/物料/订单读取+订单创建 |
| 跨企业销售(manager) | sales@moni-test.com | sales123 | 周销售 | 销售部 | 销售经理 | 企业A客户/合同读写 + 企业B只读(跨企业权限) |

## 测试数据概览

### 组织架构 - 企业A（模拟测试企业）
- 总经办（王老板、李管理）
- 财务部（赵财务）
- 仓储部（孙仓管）
- 销售部（周销售、吴员工）
- 采购部
- 售后部

### 组织架构 - 企业B（模拟测试企业B）
- 总经办（王老板）
- 研发部（钱研发）
- 市场部（孙市场）

### 跨企业权限
- 周销售：企业A → 企业B（customer:read, contract:read）

### 精细化权限
- 吴员工：contract:create=deny, contract:read=allow（只能查看合同，不能创建）

### 客户
- 上海科技有限公司（VIP，信息技术）
- 北京贸易集团（重要，贸易）
- 广州制造有限公司（普通，制造业）

### 物料
- A4打印纸 (SKU-PAPER-A4) ¥25/包
- 笔记本电脑 (SKU-PC-LAPTOP) ¥5999/台
- 办公桌 (SKU-DESK-01) ¥899/张
- 墨盒(黑色) (SKU-INK-BK) ¥89/个
- 人体工学椅 (SKU-CHAIR-01) ¥1299/把

### 仓库
- 上海主仓 (WH-SH-001)
- 北京分仓 (WH-BJ-001)

### 供应商
- 华东材料供应商
- 深圳电子元件厂

### 合同
- CON-2024-001: 上海科技办公设备采购合同 ¥150,000（active，已付¥50,000）
- CON-2024-002: 北京贸易耗材供应合同 ¥80,000（pending_approval）
- CON-2024-003: 广州制造设备维护合同 ¥45,000（fulfilled）

### 销售订单
- SO-2024-001: 10台笔记本电脑 ¥59,990（confirmed，已付¥20,000）
- SO-2024-002: 500包A4纸 ¥12,500（shipped，已付清）

### 采购订单
- PO-2024-001: 1000包A4纸 ¥25,000（received）
- PO-2024-002: 10台笔记本电脑 ¥59,990（pending）

### 发票
- INV-2024-001: ¥59,990 + 税¥7,798.70（issued）

### 报销
- EXP-2024-001: 差旅费 ¥3,500（approved）
- EXP-2024-002: 办公用品 ¥1,200（pending）

## 测试流程

### 1. 启动服务
```bash
# 确保 Colima 运行
colima status || colima start --cpu 2 --memory 4

# 启动 PostgreSQL + Redis
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres redis

# 启动 API（后台，约3分钟启动因198个租户schema）
cd api && AO_JWT_SECRET=change-me-in-production nohup ./bin/api > /tmp/ao-api.log 2>&1 & disown

# 等待 API 就绪
curl http://localhost:8080/api/v1/health
```

### 2. CLI 登录
```bash
# 交互式登录（输入邮箱和密码）
cli/bin/ao-cli auth login -s http://localhost:8080

# 登录后必须手动设置 HMAC secret（登录会覆盖配置）
sed -i '' 's/^hmac_secret: ""$/hmac_secret: "change-me-in-production"/' ~/.ai-office-cli/config.yaml

# 验证登录状态
cli/bin/ao-cli auth status -s http://localhost:8080
```

### 3. 模块测试对话模板

测试时，用对应角色的账号登录后，向 agent 发送对话内容，验证 agent 返回是否符合预期。

## Epic 1: 平台基础与认证授权 - 对话测试用例

> 自动化测试结果: **50/50 PASS** (详见 test-flie/epic1-test-results.txt)
> FRs 覆盖: FR-AUTH-001~003, FR-AUTH-005~008, FR-AUTH-010~017

### Story 1.1-1.3: 基础设施 (API/CLI/Docker)

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 1 | "检查 API 服务是否正常运行" | 执行 health check，返回 status=ok | agent 调用 `curl localhost:8080/api/v1/health` 返回 ok |
| 2 | "检查数据库和 Redis 连接" | 验证 PostgreSQL + Redis 可连接 | agent 执行 docker exec pg_isready / redis-cli ping |
| 3 | "列出所有可用的 CLI 命令" | 显示 auth/skill/poll/init/service/log 命令 | agent 执行 `ao-cli --help` |

### Story 1.4: 多租户 Schema 隔离

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 4 | "查看我们企业的客户列表" (用 boss 登录) | 返回3个客户（上海科技/北京贸易/广州制造） | 数据只属于本企业 |
| 5 | "我担心数据隔离，能确认其他企业看不到我的数据吗？" | agent 解释 Schema 级隔离机制 | 不同企业登录查不到对方数据 |

### Story 1.5: 统一响应格式与错误码

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 6 | "故意用一个不存在的客户ID查询" | 返回结构化错误，包含 code/message/recoverable | 错误码格式 `MODULE_TYPE_SEQ` |
| 7 | "我用错了密码登录会怎样？" | 返回 AUTH_UNAUTHORIZED + recoverable=true + recovery_action | agent 能理解错误并建议重试 |

### Story 1.6: OAuth 2.0 认证

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 8 | "帮我登录系统，邮箱 boss@moni-test.com" | 提示输入密码，登录成功显示角色和企业 | `ao-cli auth login` 成功 |
| 9 | "我的 token 快过期了，帮我刷新" | 使用 refresh token 获取新 access token | `ao-cli auth refresh` 成功 |
| 10 | "我要登出系统" | 清除本地凭证，token 失效 | `ao-cli auth logout` 后无法访问 API |
| 11 | "我不登录直接访问 API 会怎样？" | 返回 401 AUTH_UNAUTHORIZED | agent 解释需要先登录 |

### Story 1.7: JWT 认证中间件与 RBAC

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 12 | (用 employee 登录) "帮我查看财务报销列表" | 返回权限拒绝 PERM_DENIED | employee 无 finance 权限 |
| 13 | (用 employee 登录) "帮我查看客户列表" | 返回3个客户数据 | employee 有 customer:read 权限 |
| 14 | (用 operator 登录) "切换到模拟测试企业" | 切换企业上下文成功 | operator 可访问任意企业 |
| 15 | "系统有哪些角色？每个角色能做什么？" | 列出5种角色及权限矩阵 | operator>owner>admin>manager>employee |

### Story 1.8: 审计日志

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 16 | "查看最近的操作审计日志" | 返回审计记录列表（操作者/时间/类型/实体） | audit_logs 表有记录 |
| 17 | "我刚才创建了一个客户，审计日志有记录吗？" | 查到对应的 CREATE 操作记录 | 包含 user_id/action/resource |

### Story 1.9: 自动定时备份

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 18 | "配置每日凌晨2点自动备份" | 创建备份配置（backup_time=02:00） | POST /api/v1/backup/configs 成功 |
| 19 | "手动触发一次备份" | 执行 pg_dump 并记录备份文件 | POST /api/v1/backup/trigger 成功 |

### Story 1.10: API 配额与功能开关

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 20 | "查看我们企业的 API 配额" | 返回日配额/月配额及已用情况 | GET /api/v1/quota 返回数据 |
| 21 | "查看哪些功能模块已启用" | 返回 hrm/crm/ims/contract/sales/service/finance/workflow/kb 9个模块 | GET /api/v1/features 返回 enabled=true |
| 22 | "禁用知识库模块" | 设置 kb feature flag = false | 后续 kb API 返回 AUTH_FEATURE_DISABLED |

### Story 1.11: Rate Limiting

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 23 | "正常请求会被限流吗？" | 不会，正常请求返回200 | 响应头可能包含 X-RateLimit-* |
| 24 | "我们企业的 QPS 限制是多少？" | 返回 enterprise_qps=1000, ip_qps=100 | rate_limit_configs 表有记录 |

### Story 1.12: 可观测性

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 25 | "查看 Prometheus 监控指标" | 返回 /metrics 端点数据 | curl /metrics 返回 200 |
| 26 | "最近的 API 请求日志" | 显示结构化 JSON 日志（request_id/trace_id/status/latency） | 日志包含请求追踪信息 |

### Story 1.13: CLI 多平台与服务

| # | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|-------------|----------------|---------|
| 27 | "CLI 支持哪些平台？" | Windows/macOS/Linux | Go 交叉编译支持 |
| 28 | "启动消息轮询服务" | `ao-cli poll` 开始轮询 | 每60秒检查未读消息 |
| 29 | "安装 CLI 为后台服务" | `ao-cli service install` 注册开机自启 | service 命令可用 |

---

## Epic 2: 组织架构与多企业管理 - 对话测试用例

> FRs 覆盖: FR-ORG-001~009, FR-ORG-011~013, FR-GROUP-001~008, FR-AUTH-004, FR-AUTH-009
> 测试数据: test-flie/epic2-test-data.sql

### Story 2.1: 集团管理（创建/编辑/删除）

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 1 | operator | "帮我创建一个集团，名称叫'华南科技集团'" | 调用 `ao-cli skill execute` 创建集团，返回集团ID和名称 | POST /api/v1/groups 成功，返回201 |
| 2 | operator | "列出所有集团" | 返回集团列表，包含模拟测试集团和新建的华南科技集团 | GET /api/v1/groups 返回≥2条 |
| 3 | operator | "查看模拟测试集团的详情" | 返回集团ID、名称、联系方式、状态 | GET /api/v1/groups/:id 返回完整信息 |
| 4 | operator | "把模拟测试集团的联系电话改成13900000001" | 更新集团联系信息 | PUT /api/v1/groups/:id 成功 |
| 5 | owner | "帮我创建一个集团" | 返回权限拒绝 PERM_DENIED | owner 无 system:config 权限 |
| 6 | operator | "删除华南科技集团" | 确认后执行删除（集团下无活跃企业时允许） | DELETE /api/v1/groups/:id 成功或返回有企业不可删除 |

### Story 2.2: 企业管理（创建/编辑/查看）

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 7 | operator | "帮我创建一个企业，名称叫'华南科技深圳分公司'，归属模拟测试集团" | 创建企业+自动创建Schema，返回企业ID和初始管理员信息 | POST /api/v1/enterprises 成功，Schema自动创建 |
| 8 | operator | "列出所有企业" | 返回企业列表，包含模拟测试企业、模拟测试企业B、新企业 | GET /api/v1/enterprises 返回≥3条 |
| 9 | operator | "查看模拟测试企业的详情" | 返回企业ID、名称、集团、状态、Schema名 | GET /api/v1/enterprises/:id 返回完整信息 |
| 10 | operator | "把模拟测试企业的联系邮箱改成new@example.com" | 更新企业联系信息 | PUT /api/v1/enterprises/:id 成功 |
| 11 | admin | "帮我创建一个企业" | 返回权限拒绝 | admin 无 system:config 权限 |

### Story 2.3: 部门管理（创建/编辑/删除/树形结构）

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 12 | admin | "帮我创建一个部门叫'技术部'，上级是总经办" | 创建部门，支持多级树形 | POST /api/v1/enterprises/:eid/departments 成功 |
| 13 | admin | "查看我们企业的组织架构树" | 返回树形结构（总经办→财务部/仓储部/销售部/技术部...） | GET /api/v1/enterprises/:eid/departments/tree 返回嵌套结构 |
| 14 | admin | "把技术部改名为'研发技术部'" | 更新部门名称 | PUT /api/v1/departments/:id 成功 |
| 15 | admin | "删除技术部" | 部门下无员工时允许删除 | DELETE /api/v1/departments/:id 成功或返回有员工不可删除 |
| 16 | employee | "帮我创建一个部门" | 返回权限拒绝 | employee 无部门管理权限 |

### Story 2.4: 部门经理设置与权限

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 17 | admin | "把赵财务设为财务部的部门经理" | 设置部门经理，赵财务获得Manager角色 | PUT /api/v1/departments/:id/manager 成功 |
| 18 | manager(赵财务) | "修改财务部的名称" | 允许修改本部门信息 | PUT /api/v1/departments/:id 成功 |
| 19 | manager(赵财务) | "修改销售部的名称" | 返回权限拒绝，只能管理本部门 | PUT /api/v1/departments/:id 返回403 |
| 20 | employee | "设置部门经理" | 返回权限拒绝 | employee 无此权限 |

### Story 2.5: 员工档案基础 CRUD

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 21 | admin | "帮我创建一个员工，姓名'郑新人'，邮箱'zheng@test.com'，归属销售部" | 创建员工记录，生成登录凭证，员工必须归属部门 | POST /api/v1/enterprises/:eid/employees 成功 |
| 22 | admin | "把郑新人的手机号改成13800000099" | 更新员工信息 | PUT /api/v1/employees/:id 成功 |
| 23 | admin | "删除郑新人" | 软删除（标记离职，保留历史数据） | DELETE /api/v1/employees/:id 成功 |
| 24 | admin | "创建员工时不指定部门" | 返回参数校验错误 | 员工必须归属部门 |
| 25 | employee | "帮我创建一个员工" | 返回权限拒绝 | employee 无员工管理权限 |

### Story 2.6: 员工查询（按角色/姓名模糊搜索）

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 26 | admin | "列出所有经理角色的员工" | 返回赵财务、孙仓管、周销售 | GET /api/v1/enterprises/:eid/employees?role=manager |
| 27 | admin | "搜索姓名包含'王'的员工" | 返回王老板 | GET /api/v1/enterprises/:eid/employees?name=王 |
| 28 | admin | "查看岗位是'销售专员'的员工" | 返回吴员工 | GET /api/v1/enterprises/:eid/employees?position=销售专员 |
| 29 | employee | "查看员工列表" | 返回员工列表（employee有读取权限） | GET 成功 |

### Story 2.7: 岗位定义与管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 30 | admin | "创建一个岗位叫'高级工程师'，职责描述'负责核心系统开发'" | 创建岗位定义 | POST /api/v1/enterprises/:eid/positions 成功 |
| 31 | admin | "列出所有岗位" | 返回总经理/行政总监/财务经理/仓储经理/销售经理/销售专员/高级工程师 | GET /api/v1/enterprises/:eid/positions |
| 32 | admin | "把高级工程师的描述改成'负责核心系统架构设计与开发'" | 更新岗位信息 | PUT /api/v1/positions/:id 成功 |
| 33 | employee | "创建岗位" | 返回权限拒绝 | employee 无岗位管理权限 |

### Story 2.8: 老板跨企业视角切换

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 34 | owner | "切换到模拟测试企业B" | 切换企业上下文，返回新Token | POST /api/v1/auth/switch-enterprise 成功 |
| 35 | owner(切换到B后) | "查看员工列表" | 只返回企业B的员工（王老板/钱研发/孙市场） | 数据属于企业B |
| 36 | owner(切换到B后) | "切换回模拟测试企业" | 切换回企业A | POST /api/v1/auth/switch-enterprise 成功 |
| 37 | owner(切换回A后) | "查看员工列表" | 返回企业A的6个员工 | 数据属于企业A |
| 38 | employee | "切换到模拟测试企业B" | 返回权限拒绝 | employee 无跨企业切换权限 |

### Story 2.9: 跨企业权限管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 39 | owner | "给周销售开通企业B的只读权限" | 创建跨企业权限（customer:read, contract:read） | POST /api/v1/cross-enterprise/permissions 成功 |
| 40 | owner | "查看周销售的跨企业权限" | 返回企业A→企业B的权限记录 | GET /api/v1/cross-enterprise/permissions?user_id=xxx |
| 41 | owner | "撤销周销售的企业B访问权限" | 删除跨企业权限记录 | DELETE /api/v1/cross-enterprise/permissions/:id 成功 |
| 42 | owner | "重新给周销售开通企业B的只读权限"（恢复测试数据） | 重新创建跨企业权限 | POST /api/v1/cross-enterprise/permissions 成功 |
| 43 | employee | "给同事开通跨企业权限" | 返回权限拒绝 | employee 无此权限 |

### Story 2.10: 精细化权限分配

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 44 | admin | "设置吴员工只能查看合同，不能创建合同" | 设置精细化权限：contract:read=allow, contract:create=deny | POST /api/v1/employees/:id/permissions 成功 |
| 45 | employee(吴员工) | "帮我创建一个合同" | 返回权限拒绝（精细化权限deny优先） | contract:create 被deny |
| 46 | employee(吴员工) | "帮我查看合同列表" | 返回合同数据（contract:read=allow） | GET 成功 |
| 47 | admin | "查看吴员工的精细化权限" | 返回 contract:read=allow, contract:create=deny | GET /api/v1/employees/:id/permissions |
| 48 | admin | "撤销吴员工的精细化权限" | 清除精细化权限，恢复角色默认权限 | DELETE /api/v1/employees/:id/permissions 成功 |

### Story 2.11: 跨企业经营汇总

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 49 | owner | "查看模拟测试集团的跨企业经营汇总" | 返回集团下所有企业的核心指标（员工数/合同数/应收款等） | GET /api/v1/groups/summary/:id 返回多企业数据 |
| 50 | owner | "对比企业A和企业B的经营数据" | 返回两个企业的指标对比 | 汇总数据包含企业A和企业B |
| 51 | employee | "查看集团经营汇总" | 返回权限拒绝 | employee 无此权限 |

---

## 使用说明

1. 启动服务：确保 Docker 中 PostgreSQL + Redis 运行，API 在 localhost:8080
2. 选择要测试的角色，用对应账号登录 CLI
3. 告知 agent 你想测试的模块和功能
4. agent 会研究代码、准备测试数据、提供测试对话和预期反馈
5. 对上了 = 测试通过，对不上 = 排查问题
