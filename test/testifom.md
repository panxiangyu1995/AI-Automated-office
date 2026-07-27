# AI-Automated-Office 模拟用户测试指南

## 环境信息

| 项目 | 值 |
|------|-----|
| API 地址 | http://localhost:8080 |
| PostgreSQL | localhost:5432 (ai_office / ai_office_pass / ai_office) |
| Redis | localhost:6379 |
| 测试企业A | 模拟测试企业 (ID: b0000000-0000-0000-0000-000000000001) |
| 测试企业B | 模拟测试企业B (ID: f2802128-705b-4201-a261-bfe05ffffb61) |
| 测试集团 | 模拟测试集团 (ID: a0000000-0000-0000-0000-000000000001) |
| Tenant Schema A | tenant_b0000000_0000_0000_0000_000000000001 |
| Tenant Schema B | tenant_f2802128_705b_4201_a261_bfe05ffffb61 |
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
| 采购经理(manager) | zheng@moni-test.com | test123 | 郑采购 | 采购部 | 采购经理 | 采购管理+供应商读写 |
| 售后专员(employee) | feng@moni-test.com | test123 | 冯售后 | 售后部 | 售后专员 | 售后工单处理 |
| 普通员工(employee) | employee@moni-test.com | employee123 | 吴员工 | 销售部 | 销售专员 | 客户/物料/订单读取+订单创建 |
| 跨企业销售(manager) | sales@moni-test.com | sales123 | 周销售 | 销售部 | 销售经理 | 企业A客户/合同读写 + 企业B只读(跨企业权限) |

### 企业B 测试账号

| 角色 | 邮箱 | 密码 | 姓名 | 部门 | 职位 | 备注 |
|------|------|------|------|------|------|------|
| 老板(owner) | boss@moni-test.com | boss123 | 王老板 | 总经办 | 总经理 | 跨企业共享账号 |
| 员工(employee) | qian@moni-test.com | test123 | 钱研发 | 研发部 | 研发工程师 | 仅企业B |
| 员工(employee) | sun@moni-test.com | test123 | 孙市场 | 市场部 | 市场专员 | 仅企业B |

## 测试数据概览

### 组织架构 - 企业A（模拟测试企业）
- 总经办（王老板、李管理）
- 财务部（赵财务）
- 仓储部（孙仓管）
- 销售部（周销售、吴员工）
- 采购部（郑采购）
- 售后部（冯售后）

### 组织架构 - 企业B（模拟测试企业B）
- 总经办（王老板）
- 研发部（钱研发）
- 市场部（孙市场）

### 跨企业权限
- 周销售：企业A → 企业B（customer:read, contract:read）

### 精细化权限
- 吴员工：contract:create=deny, contract:read=allow（只能查看合同，不能创建）

### 客户
- 上海科技有限公司（VIP，信息技术）— 标签：战略合作、续约客户
- 北京贸易集团（重要，贸易）— 标签：价格敏感、大客户
- 广州制造有限公司（普通，制造业）
- 审计测试客户（普通，测试）

### 客户分级
- VIP（年采购额>=100万，#FFD700）
- 重要（年采购额>=50万，#C0C0C0）
- 普通（年采购额<50万，#CD7F32）
- 潜在（潜在客户，#808080）

### 联系人
- 陈总（CEO，决策人，首要）→ 上海科技
- 张助理（行政助理，日常对接）→ 上海科技
- 王财务（财务总监，影响人）→ 上海科技
- 刘采购（采购经理，影响人，首要）→ 北京贸易
- 赵经理（业务经理，日常对接）→ 北京贸易
- 黄工（技术总监，技术，首要）→ 广州制造

### 商机
- 2026年度办公设备采购 ¥500,000（跟进中）→ 上海科技
- 耗材大批量采购 ¥200,000（报价中）→ 北京贸易
- 设备升级改造 ¥800,000（跟进中）→ 广州制造

### 物料
- A4打印纸 (SKU-PAPER-A4) ¥25/包 — 耗材
- 笔记本电脑 (SKU-PC-LAPTOP) ¥5999/台 — 设备
- 办公桌 (SKU-DESK-01) ¥899/张 — 家具
- 墨盒(黑色) (SKU-INK-BK) ¥89/个 — 耗材
- 人体工学椅 (SKU-CHAIR-01) ¥1299/把 — 家具
- 无线鼠标 (SKU-MOUSE-01) ¥79/个 — 办公用品
- USB-C扩展坞 (SKU-HUB-01) ¥199/个 — 办公用品
- 碳粉盒(黑色) (SKU-TONER-BK) ¥259/个 — 耗材
- 文件柜 (SKU-CABINET-01) ¥1599/个 — 家具

### 仓库
- 上海主仓 (WH-SH-001) — ID: a048f3ab-a174-4a35-a56f-8b48608fa4e5
- 北京分仓 (WH-BJ-001) — ID: aad7835f-05db-4135-a966-c421d1d1be4c
- 广州分仓 (WH-GZ-001) — ID: 9c0da4fa-ff94-5630-9d38-9ad192453ed0

### 供应商
- 华东材料供应商 — ID: f6d51059-b0ee-4ae6-b93f-7c705a74cf30 — 联系人: 张供应
- 深圳电子元件厂 — ID: 1c291535-5c4d-40a2-8eea-d9e8e46e9a1a — 联系人: 李元件
- 广州办公用品批发 — ID: b4d4b0e9-6b75-57fe-b8b3-23048c534755 — 联系人: 陈批发
- 北京IT设备总代 — ID: ebe0847a-90cb-5f65-b2f3-fcb2d42c7997 — 联系人: 刘总代

### 库存概览

| 仓库 | 物料 | 数量 | 安全库存 | 在途 |
|------|------|------|----------|------|
| 上海主仓 | A4打印纸 | 500 | 100 | 0 |
| 上海主仓 | 笔记本电脑 | 20 | 5 | 0 |
| 上海主仓 | 办公桌 | 50 | 10 | 0 |
| 上海主仓 | 墨盒(黑色) | 200 | 30 | 0 |
| 上海主仓 | 人体工学椅 | 15 | 3 | 0 |
| 上海主仓 | 无线鼠标 | **2** | 20 | 0 | ← **低库存！** |
| 上海主仓 | USB-C扩展坞 | 50 | 10 | 0 |
| 上海主仓 | 碳粉盒(黑色) | 30 | 10 | 0 |
| 上海主仓 | 文件柜 | 8 | 2 | 0 |
| 北京分仓 | A4打印纸 | 200 | 50 | 0 |
| 北京分仓 | 笔记本电脑 | 10 | 2 | 0 |
| 北京分仓 | 无线鼠标 | 40 | 10 | 0 |
| 北京分仓 | USB-C扩展坞 | 20 | 5 | 0 |
| 北京分仓 | 人体工学椅 | 5 | 2 | 0 |
| 北京分仓 | 办公桌 | 20 | 5 | 0 |
| 北京分仓 | 墨盒(黑色) | 100 | 20 | 0 |
| 广州分仓 | A4打印纸 | 300 | 50 | 0 |
| 广州分仓 | 笔记本电脑 | 5 | 2 | 0 |
| 广州分仓 | 办公桌 | 15 | 3 | 0 |
| 广州分仓 | 人体工学椅 | 10 | 2 | 0 |

### 合同 (7条)
- CON-2024-001: 上海科技办公设备采购合同 ¥150,000（active，已付¥50,000）— ID: eaf58723-7ad6-4bc4-912b-4efb51a4290f
- CON-2024-002: 北京贸易耗材供应合同 ¥80,000（pending_approval）— ID: df7e71f8-6cef-41cc-b3bd-5476eef55c06
- CON-2024-003: 广州制造设备维护合同 ¥45,000（fulfilled）— ID: bcb60da6-99ef-481e-956a-e370abdfd2b9
- CON-2024-004: 上海科技IT基础设施升级合同 ¥280,000（draft）— ID: c6a1e001-0000-0000-0000-000000000001
- CON-2024-005: 北京贸易年度办公用品供应框架合同 ¥120,000（draft）— ID: c6a1e001-0000-0000-0000-000000000002
- CON-2024-006: 广州制造旧设备采购合同(已终止) ¥35,000（terminated）— ID: c6a1e001-0000-0000-0000-000000000003
- CON-2024-007: 上海科技网络安全服务合同 ¥95,000（pending_approval）— ID: c6a1e001-0000-0000-0000-000000000004

### 合同关联单据
- CON-2024-001 → SO-2024-001, SO-2024-002 (销售订单)
- CON-2024-003 → PO-2024-001 (采购订单)

### 售后工单 (5条)
- SVC-2024-001: 广州制造 办公桌桌面开裂 (warranty/pending, ¥0) — ID: 266e196f-91ef-5c48-8660-26f4eded5ef6
- SVC-2024-002: 上海科技 笔记本屏幕故障 (chargeable/in_progress, ¥4,500) — ID: 81bf548e-def5-54ed-9af2-fbd408537ae4
- SVC-2024-003: 北京贸易 打印机卡纸 (chargeable/waiting_approval, ¥2,800) — ID: 84e12dd6-bb94-5f3b-8424-7cca5b4f1434
- SVC-2024-004: 上海科技 无线鼠标失灵 (warranty/completed, ¥0) — ID: f2716390-eaaa-56f6-a6be-0cd624e258cf
- SVC-2024-005: 广州制造 椅子气杆故障 (chargeable/signed, ¥650) — ID: 6e834298-19e0-58e3-b392-5d35fbe35c12

### 维修工单 (1条)
- RO-001: 笔记本屏幕维修 (in_progress) → SVC-2024-002 — ID: 926c7f85-ebca-5cbb-a296-b7d21aab9590

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

## Epic 3: HRM 员工管理 - 对话测试用例

> FRs 覆盖: FR-HRM-001~008, FR-ORG-010, FR-ASSIST-003
> 测试数据: test-flie/epic3-test-data.sql
> 已知实现差距（测试时需注意）:
> - 离职用 DELETE 而非 POST /resign，自动设置 resign_date=now()，不支持自定义离职日期
> - 调岗不支持 position_id 参数，仅更新 department_id
> - 调岗不记录历史
> - 销售业绩查询返回全零（stub实现）
> - 批量导入接受 JSON 数组而非 Excel/CSV 文件

### Story 3.1: 员工入职（创建档案）

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 1 | admin | "帮我创建一个新员工，姓名'林新人'，邮箱'lin@test.com'，手机'13800001111'，归属采购部，岗位采购专员" | 调用 `hrm_employee_create` 创建员工，返回员工ID、姓名、状态=active | 响应包含 `"name":"林新人"`, `"status":"active"` |
| 2 | admin | "再创建一个员工，姓名'陈助理'，邮箱'chen@test.com'，归属总经办" | 创建成功，自动生成登录凭证 | 响应包含员工数据 |
| 3 | admin | "创建员工时只提供姓名'测试'和邮箱'test@test.com'，不指定部门" | 返回参数校验错误，department_id 是必填 | 错误码 VAL_INVALID_PARAMS |
| 4 | admin | "创建员工时用吴员工已有的邮箱 employee@moni-test.com" | 返回重复错误，同一企业内邮箱唯一 | 错误码 BIZ_DUPLICATE_ENTRY 或 SYS_INTERNAL_ERROR |
| 5 | employee | "帮我创建一个员工" | 返回权限拒绝 PERM_DENIED | employee 无员工创建权限 |

### Story 3.2: 员工档案编辑

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 6 | admin | "把林新人的手机号改成13900002222" | 调用 `hrm_employee_update` 更新手机号 | 响应包含 `"phone":"13900002222"` |
| 7 | admin | "把林新人的岗位改成'高级采购专员'" | 更新 position 字段 | 响应包含 `"position":"高级采购专员"` |
| 8 | admin | "更新一个不存在的员工ID" | 返回资源不存在 RES_NOT_FOUND | 错误码 RES_NOT_FOUND |
| 9 | employee | "修改林新人的手机号" | 返回权限拒绝 PERM_DENIED | employee 无员工编辑权限 |

### Story 3.3: 员工离职

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 10 | admin | "把林新人标记为离职" | 调用 `hrm_employee_delete`，员工状态变为 resigned，记录离职日期 | 响应成功（204 NoContent 或 no_content）|
| 11 | admin | "查看林新人的信息" | 返回 status=resigned，resign_date 有值 | GET 返回 `"status":"resigned"` |
| 12 | admin | "删除一个不存在的员工" | 返回资源不存在 RES_NOT_FOUND | 错误码 RES_NOT_FOUND |
| 13 | employee | "把冯售后标记为离职" | 返回权限拒绝 PERM_DENIED | employee 无员工删除权限 |
| 14 | admin | "重新创建林新人（同名同邮箱）作为返聘" | 创建成功（之前离职员工邮箱仍唯一，可能需要新邮箱） | 如邮箱冲突返回错误，否则创建成功 |

### Story 3.4: 员工列表与详情查询

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 15 | admin | "查看我们企业所有员工列表" | 调用 `hrm_employee_list`，返回9-10个员工（含新建/离职的） | 响应包含 total_count 和员工数组 |
| 16 | admin | "只查看销售部的员工" | 传入 department_id 过滤 | 只返回周销售和吴员工 |
| 17 | admin | "搜索姓名包含'郑'的员工" | 传入 keyword=郑 | 返回郑采购 |
| 18 | admin | "查看王老板的员工详情" | 调用 `hrm_employee_get` | 返回完整信息含部门/岗位/入职日期/状态 |
| 19 | admin | "查看所有在职员工" | 传入 status=active 过滤 | 不包含已离职的林新人 |
| 20 | employee | "查看员工列表" | 返回员工列表（employee 有列表读取权限） | GET 成功 |

### Story 3.5: 员工自助查看个人信息

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 21 | employee(吴员工) | "查看我自己的个人信息" | 调用 `GET /me/profile` | 返回吴员工的姓名、部门、岗位、入职日期、联系方式 |
| 22 | employee(吴员工) | "我的员工编号是什么？" | 从 profile 中获取 employee_no | 返回 EMP-006 |
| 23 | owner(王老板) | "查看我的个人信息" | 返回王老板的完整信息 | 包含 owner 角色 |

### Story 3.6: 批量导入员工

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 24 | admin | "批量导入3个员工：张批量(zhang@test.com,销售部)、李批量(li@test.com,财务部)、王批量(wang@test.com,仓储部)" | 调用 `hrm_employee_batch_import`，传入JSON数组 | 返回 `{total:3, created:3, failed:0}` |
| 25 | admin | "批量导入时包含一个无效数据（无姓名）" | 正常行导入，无效行跳过并返回错误原因 | 返回 failed>0 和 errors 数组 |
| 26 | employee | "批量导入员工" | 返回权限拒绝 PERM_DENIED | employee 无此权限 |

### Story 3.7: 调岗操作

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 27 | admin | "把吴员工从销售部调到采购部" | 调用 `hrm_employee_transfer`，更新 department_id | 吴员工的 department_id 变为采购部 |
| 28 | admin | "查看吴员工调岗后的信息" | 调用 `hrm_employee_get`，确认部门已变更 | department_id 为采购部ID |
| 29 | admin | "把吴员工调回销售部" | 再次调用 transfer，恢复原部门 | 吴员工回到销售部 |
| 30 | admin | "调岗到一个不存在的部门ID" | 返回参数校验错误或资源不存在 | 错误码 |
| 31 | employee | "帮吴员工调岗" | 返回权限拒绝 PERM_DENIED | employee 无调岗权限 |

### Story 3.8: 员工销售业绩查询

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 32 | admin | "查看周销售今年的销售业绩" | 调用 `hrm_employee_sales_performance`，传入 employee_id 和时间范围 | 返回业绩数据（当前为stub，total_orders=0, total_amount=0） |
| 33 | admin | "查看吴员工的销售业绩" | 同上，传入吴员工ID | 返回吴员工业绩（stub数据） |
| 34 | admin | "查看2026年1月到6月的销售业绩" | 传入 start_time 和 end_time | 返回指定时间段数据 |

### 补充测试：边界条件与权限

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 35 | admin | "查看已离职员工林新人的详情" | 返回 status=resigned 的员工信息 | 离职员工数据仍可查看 |
| 36 | admin | "列出所有经理角色的员工" | 传入 role=manager 过滤 | 返回赵财务、孙仓管、周销售、郑采购 |
| 37 | owner | "查看员工列表" | owner 有全部权限，返回完整列表 | GET 成功 |
| 38 | owner | "创建员工" | owner 有 PermAll，可以创建 | 创建成功 |

---

## Epic 4: CRM 客户关系管理 - 对话测试用例

> FRs 覆盖: FR-CRM-001~013
> 测试数据: test-flie/epic4-test-data.sql
> 已知实现差距:
> - 客户 Level 是自由文本字段，非 customer_levels 表 FK
> - 客户列表不支持 keyword 模糊搜索
> - 商机状态 CLI 用英文(status=following)，API 验证中文(跟进中)
> - 无 crm_customer_panorama CLI skill（API端点存在但无skill）
> - 标签删除需 query param `?tag=xxx`（非 body）
> - 商机无 PATCH /status 专用端点，用 PUT 更新 status 字段
> - 客户列表不支持按标签筛选（?tags=xxx）

### Story 4.1: 客户档案 CRUD

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 1 | admin | "创建一个新客户，公司名称'深圳创新科技'，行业'互联网'，统一社会信用代码'91440300MA5EXXXX0X'，地址'深圳市南山区'" | 调用 `crm_customer_create` 创建客户 | 响应包含 `"name":"深圳创新科技"`, level 默认 "普通" |
| 2 | admin | "查看我们企业的客户列表" | 返回客户列表，含5+个客户 | total_count >= 5 |
| 3 | admin | "查看上海科技的客户详情" | 返回完整客户信息 | 包含 name/industry/level/status |
| 4 | admin | "把深圳创新科技的等级改成VIP" | 更新客户等级 | 响应包含 `"level":"VIP"` |
| 5 | admin | "创建一个叫'上海科技有限公司'的客户" | 返回重复错误，同企业名称唯一 | 错误码含 duplicate/已存在/23505 |
| 6 | admin | "删除审计测试客户" | 软删除成功 | no_content 或成功响应 |
| 7 | employee | "创建一个客户" | 返回权限拒绝 | employee 无 customer:create |

### Story 4.2: 客户分级管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 8 | admin | "查看所有客户分级" | 返回4个分级（VIP/重要/普通/潜在） | 列表含4条 |
| 9 | admin | "创建一个新客户分级叫'战略'，最低金额300万" | 创建分级 | 响应含 `"name":"战略"`, min_amount=3000000 |
| 10 | admin | "把'战略'分级的描述改成'战略合作伙伴'" | 更新分级描述 | 响应含描述 |
| 11 | admin | "删除'战略'分级" | 删除成功 | no_content 或成功 |
| 12 | employee | "创建客户分级" | 返回权限拒绝 | employee 无此权限 |

### Story 4.3: 客户自由标签

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 13 | admin | "给深圳创新科技添加标签'新客户'" | 添加标签 | 成功响应 |
| 14 | admin | "查看深圳创新科技的标签" | 返回标签列表含'新客户' | 包含 "新客户" |
| 15 | admin | "查看我们企业所有的客户标签" | 返回去重后的标签列表 | 包含 战略合作/续约客户/价格敏感/大客户/新客户 |
| 16 | admin | "删除深圳创新科技的'新客户'标签" | 移除标签 | 成功或 no_content |
| 17 | employee | "给客户添加标签" | 返回权限拒绝 | employee 无此权限 |

### Story 4.4: 客户全景视图 API

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 18 | admin | "查看上海科技的全景画像" | 聚合客户+联系人+商机+合同+售后+往来款 | 响应含 customer/contacts/opportunities |
| 19 | admin | "查看一个不存在客户的全景" | 返回资源不存在 | 错误码 RES_NOT_FOUND |

### Story 4.5: 客户关联查询（全景视图包含）

> 注：独立的合同/售后/往来款查询端点尚未实现，全景视图 API 已聚合这些数据

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 20 | admin | "查看北京贸易的全景数据，包含合同和往来款" | 通过全景视图获取关联数据 | 响应含 contracts/payment_summary |

### Story 4.6: 联系人 CRUD

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 21 | admin | "给广州制造添加联系人，姓名'李副总'，职位'副总裁'，电话'13800000017'，角色决策人" | 创建联系人 | 响应含 `"name":"李副总"` |
| 22 | admin | "查看上海科技的联系人列表" | 返回3个联系人（陈总/张助理/王财务） | 列表含3条 |
| 23 | admin | "把陈总的电话改成13900001111" | 更新联系人信息 | 响应含新电话 |
| 24 | admin | "删除李副总" | 软删除成功 | no_content 或成功 |
| 25 | employee | "给客户添加联系人" | 返回权限拒绝 | employee 无此权限 |

### Story 4.7: 联系人按角色筛选查询

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 26 | admin | "查看上海科技的决策人联系人" | 按角色筛选，只返回陈总（decision_maker） | 列表仅含陈总 |
| 27 | admin | "查看上海科技的影响人" | 返回王财务（influencer） | 列表含王财务 |
| 28 | admin | "查看上海科技的日常对接人" | 返回张助理（daily_contact） | 列表含张助理 |

### Story 4.8: 商机 CRUD

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 29 | admin | "给深圳创新科技创建一个商机，名称'云服务合作'，预计金额30万" | 创建商机，状态默认"跟进中" | 响应含 `"name":"云服务合作"`, status="跟进中" |
| 30 | admin | "查看上海科技的商机列表" | 返回1个商机（2026年度办公设备采购） | 列表含该商机 |
| 31 | admin | "把'耗材大批量采购'商机的状态改成'成交'" | 更新商机状态 | 响应含 `"status":"成交"` |
| 32 | admin | "把'云服务合作'商机状态改成'失败'" | 更新状态，有效值为跟进中/报价中/成交/失败 | 响应含 `"status":"失败"` |
| 33 | admin | "删除'云服务合作'商机" | 删除成功 | no_content |
| 34 | employee | "创建商机" | 返回权限拒绝 | employee 无此权限 |

---

## Epic 5: 进销存管理 - 对话测试用例

> FRs 覆盖: FR-IMS-001~015, FR-IMS-017~023
> 测试数据: test-flie/epic5-test-data.sql
> 已知实现差距:
> - InventoryCheck（盘库）无 handler/service/route，仅 repo 存在
> - StockFlow 无写入逻辑，库存变动不产生流水记录
> - MaterialPrice 无 handler/service/route
> - QualityInspection `QualifiedAutoReceive` 未从 handler 调用
> - PurchaseOrderItem/SalesOrderItem 缺 enterprise_id（无多租户隔离）
> - 采购入库 `receive` 需传 `warehouse_id` 但 PO 本身未绑定仓库
> - 调拨单 `execute` 同时完成源出+目标入，无分步确认
> - 领用 `issue` 用 query param `issued_qty` 而非 body JSON
> - 销售订单发货 `ship` 用 `/ship` 端点，状态变更为 `shipped`
> - RBAC: product:*=物料/仓库/供应商, order:*=采购/销售/调拨/领用/质检

### Story 5.1: 物料（SKU）管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 1 | admin | "帮我创建一个新物料，名称'蓝牙键盘'，SKU代码'SKU-KB-BT'，类型'办公用品'，规格'蓝牙5.0/静音'，单位'个'，单价299" | 调用 `ims_material_create`，创建成功 | 响应含 `"name":"蓝牙键盘"`, sku_code, unit_price=299 |
| 2 | admin | "查看我们企业所有物料列表" | 调用 `ims_material_list`，返回10个物料 | total_count=10 |
| 3 | admin | "把蓝牙键盘的单价改成249" | 调用 `ims_material_update` | 响应含 `"unit_price":249` |
| 4 | admin | "查看A4打印纸的物料详情" | 调用 `ims_material_get` | 响应含 name/sku_code/material_type/unit_price |
| 5 | admin | "删除蓝牙键盘物料" | 调用 `ims_material_delete`，软删除 | no_content 或成功 |
| 6 | employee | "帮我创建一个物料" | 返回权限拒绝 PERM_DENIED | employee 无 product:create |
| 7 | warehouse | "查看物料列表" | 返回物料列表 | warehouse 有 product:list 权限 |

### Story 5.2: 供应商管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 8 | admin | "帮我创建一个供应商，名称'成都文具厂'，联系人'王文具'，电话'13800003003'，邮箱'wang@cd-stationery.com'，地址'成都市武侯区'" | 调用 `ims_supplier_create` | 响应含 `"name":"成都文具厂"` |
| 9 | admin | "查看所有供应商列表" | 调用 `ims_supplier_list`，返回5个供应商 | total_count=5 |
| 10 | admin | "把成都文具厂的联系人改成'赵文具'" | 调用 `ims_supplier_update` | 响应含 `"contact_name":"赵文具"` |
| 11 | admin | "查看华东材料供应商的详情" | 调用 `ims_supplier_get` | 响应含完整信息 |
| 12 | admin | "删除成都文具厂" | 调用 `ims_supplier_delete` | no_content 或成功 |
| 13 | employee | "帮我创建一个供应商" | 返回权限拒绝 PERM_DENIED | employee 无 product:create |

### Story 5.3: 多仓库管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 14 | admin | "帮我创建一个仓库，名称'成都分仓'，编码'WH-CD-001'，地址'成都市高新区'" | 调用 `ims_warehouse_create` | 响应含 `"name":"成都分仓"`, code |
| 15 | admin | "查看所有仓库列表" | 调用 `ims_warehouse_list`，返回4个仓库 | total_count=4 |
| 16 | admin | "查看上海主仓的详情" | 调用 `ims_warehouse_get` | 响应含 name/code/address/status |
| 17 | admin | "把成都分仓的地址改成'成都市锦江区春熙路'" | 调用 `ims_warehouse_update` | 响应含新地址 |
| 18 | admin | "删除成都分仓" | 调用 `ims_warehouse_delete` | no_content 或成功 |
| 19 | employee | "帮我创建一个仓库" | 返回权限拒绝 PERM_DENIED | employee 无 product:create |

### Story 5.4: 库存查询与预警

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 20 | admin | "查看上海主仓的库存" | 调用 `ims_inventory_query_by_warehouse`，返回9条库存记录 | 含A4打印纸/笔记本电脑/办公桌等 |
| 21 | admin | "查看A4打印纸在各仓库的库存分布" | 调用 `ims_inventory_query_by_material`，返回3条（上海/北京/广州） | 3个仓库各有库存 |
| 22 | admin | "查看低库存预警" | 调用 `ims_inventory_low_stock`，返回无线鼠标在上海主仓低于安全库存 | 含无线鼠标 qty=2 < safety=20 |
| 23 | admin | "把上海主仓的无线鼠标安全库存设为5" | 调用 `ims_inventory_set`，更新安全库存 | 响应含 safety_stock=5 |
| 24 | employee | "查看库存" | 调用 `ims_inventory_query_by_warehouse`，允许读取 | employee 有 product:read |

### Story 5.5: 采购订单与入库

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 25 | zheng(采购) | "帮我创建一个采购订单，供应商'华东材料供应商'，采购1000包A4打印纸单价25元" | 调用 `ims_purchase_order_create` | 响应含 order_no, status=draft, total=25000 |
| 26 | zheng(采购) | "查看采购订单列表" | 调用 `ims_order_list --params '{"type":"purchase"}'` | 列表含5条采购订单 |
| 27 | zheng(采购) | "对PO-2026-001执行入库，入到上海主仓" | 调用 `ims_purchase_order_receive`，传入订单ID和仓库ID | 库存增加，状态变received |
| 28 | employee | "帮我创建采购订单" | 返回权限拒绝 PERM_DENIED | employee 无 order:create |

### Story 5.6: 采购质检流程

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 29 | zheng(采购) | "对PO-2026-002创建质检任务" | 调用质检创建端点（POST /purchase-orders/:id/inspections） | 响应含 inspection_no, status=pending |
| 30 | admin | "给质检任务添加检查项，检查'外观'，标准'无破损'" | 调用 POST /inspections/:id/items | 成功 |
| 31 | admin | "完成质检，结果合格" | 调用 POST /inspections/:id/complete | status=qualified |

### Story 5.7: 销售出库与库存扣减

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 32 | sales | "帮我创建一个销售订单，客户'广州制造有限公司'，明细：5台笔记本电脑单价5999，10包A4纸单价25" | 调用 `ims_sales_order_create` | 响应含 order_no, status=draft, total=30245 |
| 33 | sales | "查看销售订单列表" | 调用 `ims_order_list --params '{"type":"sales"}'` | 列表含5条销售订单 |
| 34 | admin | "对SO-2024-001确认出库，从上海主仓发货" | 调用 `ims_sales_order_ship`（需先改状态为confirmed） | 库存扣减，状态变shipped |
| 35 | employee | "创建销售订单" | 返回权限拒绝 PERM_DENIED | employee 无 order:create（实际employee有order:create，需注意） |

> 注：employee 有 `PermOrderCreate` 权限，所以测试5.7-35预期会**成功创建**而非拒绝。可改用无 order 权限的角色测试。

### Story 5.8: 仓库间调拨

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 36 | admin | "创建一个调拨单，从上海主仓调50包A4打印纸到广州分仓" | 调用 `ims_transfer_create` | 响应含 order_no, status=draft |
| 37 | admin | "执行调拨" | 调用 `ims_transfer_execute` | 上海主仓A4纸-50，广州分仓A4纸+50 |

### Story 5.9: 物料领用申请

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 38 | admin | "帮吴员工申请领用5包A4打印纸，从上海主仓领，用途'办公使用'" | 调用 `ims_requisition_create` | 响应含 requisition_no, status=pending |
| 39 | admin | "仓库确认发料，实发3包" | 调用 `ims_requisition_issue`，传 issued_quantity=3 | 上海主仓A4纸-3 |

### Story 5.10: 库存盘点（盘库）

> 注：盘库 API 端点未实现（仅 repo 存在），以下测试预期返回 404

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 40 | admin | "创建上海主仓的全盘任务" | 端点不存在，返回404 | 需后续实现 |

### Story 5.11: 物料报价管理

> 注：报价管理 API 端点未实现，以下测试预期返回 404

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 41 | admin | "查看笔记本电脑的历史报价" | 端点不存在，返回404 | 需后续实现 |

### Story 5.12: 统一出入库流水查询

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 42 | admin | "查看上海主仓的出入库流水" | 调用 `ims_stock_flow_list` | 返回流水列表（当前为空，因service未写入流水） |
| 43 | admin | "查看A4打印纸的出入库流水" | 调用 `ims_stock_flow_list`，传 material_id | 返回流水列表 |

### 补充：权限边界测试

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 44 | employee | "删除物料" | 返回权限拒绝 PERM_DENIED | employee 无 product:delete |
| 45 | employee | "更新仓库信息" | 返回权限拒绝 PERM_DENIED | employee 无 product:update |
| 46 | warehouse | "创建物料" | 返回权限拒绝 PERM_DENIED | warehouse(manager) 无 product:create |
| 47 | warehouse | "创建采购订单" | 调用 `ims_purchase_order_create`，允许 | manager 有 order:create |
| 48 | warehouse | "采购入库" | 调用 `ims_purchase_order_receive`，允许 | manager 有 order:update |

---

## Epic 6: 合同、销售与售后管理 - 对话测试用例

> 详见 `test-flie/epic6-test-dialogue.md` (完整版)
> FRs 覆盖: FR-CON-001~009, FR-SALES-001~009, FR-SVC-001~012

### Story 6.1: 合同 CRUD 与状态机

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 1 | sales | "帮我查看所有合同" | 调用 contract_list | total_count=7 |
| 2 | sales | "查看草稿状态的合同" | 调用 contract_list + status=draft | total_count=2 |
| 3 | sales | "创建一个新合同，客户上海科技，名称'云服务合同'，金额30万" | 调用 contract_create | status=draft, amount=300000 |
| 4 | sales | "查看合同CON-2024-001详情" | 调用 contract_get | contract_no=CON-2024-001, status=active |
| 5 | sales | "把合同CON-2024-004金额改成25万" | 调用 contract_update (草稿可编辑) | amount=250000 |
| 6 | sales | "提交合同CON-2024-004审批" | 调用 contract_submit_approval | status=pending_approval |
| 7 | sales | "再编辑合同CON-2024-004" | 调用 contract_update，审批中不可PUT编辑 | 错误: 仅草稿状态可编辑 |
| 8 | sales | "用自然语言改合同CON-2024-004备注为'需补充技术方案'" | 调用 contract_patch_fields，审批中允许PATCH | notes=需补充技术方案 |
| 9 | owner | "审批通过合同CON-2024-004" | 调用 contract_approve | status=active, effective_at非空 |
| 10 | owner | "把合同CON-2024-001状态改为已履行" | 调用 contract_change_status status=fulfilled | status=fulfilled |
| 11 | owner | "把合同CON-2024-001状态改为草稿" | 非法流转 | CON_INVALID_STATUS_TRANSITION |
| 12 | sales | "删除合同CON-2024-005" | 调用 contract_delete，草稿可删除 | 204/NoContent |
| 13 | sales | "删除合同CON-2024-001" | 调用 contract_delete，已履行不可删除 | 错误: 仅草稿状态可删除 |

### Story 6.2: 合同关联业务单据

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 14 | sales | "查看合同CON-2024-001关联了哪些单据" | 调用 contract_list_documents | sales_order, SO-2024-001 |
| 15 | sales | "把采购订单关联到合同CON-2024-001" | 调用 contract_link_document | ref_type=purchase_order |

### Story 6.3: 合同附件与审批流

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 16 | sales | "给合同CON-2024-007上传扫描件" | 调用 contract_upload_attachment (multipart) | file_name非空 |
| 17 | sales | "提交合同CON-2024-005审批" | 调用 contract_submit_approval | status=pending_approval |
| 18 | owner | "审批通过合同CON-2024-005" | 调用 contract_approve | status=active |

### Story 6.4: Agent 自然语言修改合同

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 19 | sales | "把合同CON-2024-007金额改成10万" | 调用 contract_patch_fields | amount=100000 |
| 20 | sales | "把已生效合同金额改成5万" | 调用 contract_patch_fields，active不可修改 | 错误: 仅草稿和审批中可修改 |

### Story 6.5: 销售订单 CRUD 与状态机

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 21 | sales | "创建销售订单，客户上海科技，2台笔记本单价5999" | 调用 ims_sales_order_create | order_no, status=draft |
| 22 | sales | "确认销售订单SO-2024-001" | 调用 ims_sales_order_status_change | status=confirmed |
| 23 | owner | "销售订单SO-2024-001出库，从上海主仓发货" | 调用 ims_sales_order_ship | status=shipped |

### Story 6.7: 售后工单 CRUD 与状态机

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 24 | feng | "查看所有售后工单" | 调用 service_order_list | total_count=5 |
| 25 | feng | "查看待处理工单" | 调用 service_order_list + status=pending | total_count=1 |
| 26 | feng | "创建售后工单，客户广州制造，类型保修，描述'椅子扶手松动'" | 调用 service_order_create | order_no, status=pending |
| 27 | feng | "开始处理工单SVC-2024-001" | 调用 service_order_change_status status=in_progress | status=in_progress |
| 28 | feng | "工单SVC-2024-001报价0元" | 调用 service_order_quote | amount=0 |

### Story 6.8: 收费工单报价流程

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 29 | feng | "创建收费工单，客户北京贸易，描述'服务器宕机'，金额5000" | 调用 service_order_create order_type=chargeable | amount=5000 |
| 30 | feng | "给工单SVC-2024-002报价4500元" | 调用 service_order_quote | amount=4500 |

### Story 6.9: 维修工单与签字确认

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 31 | feng | "为工单SVC-2024-001创建维修工单，故障点'桌面开裂'，维修内容'更换桌面'" | POST /service-orders/:id/repair-order | fault_point=桌面开裂 |
| 32 | feng | "查看工单SVC-2024-002的维修记录" | GET /service-orders/:id/repair-order | fault_point, repair_content |
| 33 | owner | "工单SVC-2024-002完成维修" | 调用 service_order_change_status status=completed | status=completed |
| 34 | owner | "工单SVC-2024-002客户签字" | 调用 service_order_sign | status=signed |

### Story 6.10: 售后工单附件管理

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 35 | feng | "给工单SVC-2024-001上传问题图片" | 调用 service_order_upload_attachment | original_name非空 |
| 36 | feng | "查看工单SVC-2024-001的附件列表" | 调用 service_order_list_attachments | data数组 |

### 权限边界测试

| # | 登录角色 | 你对 agent 说 | 预期 agent 行为 | 验证方式 |
|---|---------|-------------|----------------|---------|
| 37 | employee | "查看所有合同" | 调用 contract_list，有contract:read | total_count |
| 38 | employee | "创建一个合同" | 无contract:create权限 | PERM_DENIED |
| 39 | employee | "删除合同" | 无contract:delete权限 | PERM_DENIED |
| 40 | finance | "查看所有合同" | 有contract:read权限 | total_count |
| 41 | finance | "查看所有售后工单" | 有order:read权限 | total_count |

---

## 使用说明

1. 启动服务：确保 Docker 中 PostgreSQL + Redis 运行，API 在 localhost:8080
2. 选择要测试的角色，用对应账号登录 CLI
3. 告知 agent 你想测试的模块和功能
4. agent 会研究代码、准备测试数据、提供测试对话和预期反馈
5. 对上了 = 测试通过，对不上 = 排查问题
