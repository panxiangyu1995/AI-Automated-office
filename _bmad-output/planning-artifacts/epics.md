---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics'
project_name: 'AI-Automated-office'
user_name: 'PAN'
date: '2026-07-04'
lastEdited: '2026-07-08'
---

# AI-Automated-office - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AI-Automated-office, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-AUTH-001: 系统支持 OAuth 2.0 认证，包括登录、刷新令牌、登出
FR-AUTH-002: 系统支持 Refresh Token（默认 30 天，可配置）
FR-AUTH-003: 系统支持 RBAC 角色权限控制（Operator/Owner/Admin/Manager/Employee）
FR-AUTH-004: 系统支持跨企业权限管理（Operator 开通 + Admin 分配）
FR-AUTH-005: 所有 API 调用必须验证权限，无权限返回 403
FR-AUTH-006: 系统支持操作审计日志（谁、什么时间、做了什么）
FR-AUTH-007: 系统支持日志查询（按时间、用户、操作类型查询）
FR-AUTH-008: 系统支持自动定时备份（仅 Admin/Operator 可配置）
FR-AUTH-009: 管理员/老板可以自定义员工的权限（精细化权限分配）
FR-AUTH-010: 系统支持结构化错误码体系，便于 Agent 和用户理解错误并恢复
FR-AUTH-011: CLI 支持 Windows/macOS/Linux 多平台运行，满足不同用户环境
FR-AUTH-012: 系统支持 Schema 级别数据隔离，确保企业间数据完全隔离
FR-AUTH-013: 系统支持企业级独立备份与恢复，不影响其他企业
FR-AUTH-014: CLI 支持开机自启作为后台服务，确保消息实时到达
FR-AUTH-015: 系统支持 API 配额管理（日配额/月配额），避免滥用但不误杀正常业务
FR-AUTH-016: 系统支持功能开关，控制企业可用的功能模块
FR-AUTH-017: 系统支持可观测性架构（Prometheus/Grafana/OpenTelemetry）

FR-ORG-001: 运营商可以创建、编辑、删除集团账号
FR-ORG-002: 集团老板可以创建一个或多个企业
FR-ORG-003: 企业管理员可以创建、编辑、删除部门
FR-ORG-004: 企业管理员可以设置部门经理
FR-ORG-005: 部门经理可以编辑本部门信息
FR-ORG-006: 企业管理员可以创建、编辑、删除员工档案
FR-ORG-007: 员工必须归属某个部门，一个部门可有多个员工
FR-ORG-008: 老板可以在不同企业之间切换视角
FR-ORG-009: 系统支持查询组织架构树形结构
FR-ORG-010: 系统记录员工入职日期、离职日期、岗位信息
FR-ORG-011: 系统支持按角色查询员工列表
FR-ORG-012: 系统支持按姓名模糊查询员工信息
FR-ORG-013: 系统支持岗位定义与管理

FR-HRM-001: 企业管理员可以创建员工档案（入职）
FR-HRM-002: 企业管理员可以编辑员工档案信息
FR-HRM-003: 企业管理员可以标记员工离职
FR-HRM-004: 企业管理员可以查看所有员工列表
FR-HRM-005: 员工可以查看自己的档案信息
FR-HRM-006: 系统支持批量导入员工（Excel/CSV）
FR-HRM-007: 系统支持调岗操作（原部门移除 → 新部门添加）
FR-HRM-008: Admin/部门经理可以按时间范围查询员工销售业绩

FR-CRM-001: 系统支持创建、编辑、删除客户档案，客户以公司名称为唯一标识
FR-CRM-002: 客户档案包含：公司名称（唯一）、行业分类、统一社会信用代码、地址、备注
FR-CRM-003: 系统支持客户分级管理：预置分级（VIP/重要/普通/潜在），企业管理员可自定义分级名称和规则
FR-CRM-004: 系统支持客户自由标签：可为客户添加多个自定义标签，支持按标签筛选客户列表
FR-CRM-005: 系统支持客户全景视图 API：按客户 ID 一次性返回该客户的所有关联数据
FR-CRM-006: 系统支持客户与合同关联查询
FR-CRM-007: 系统支持客户与售后工单关联查询
FR-CRM-008: 系统支持客户往来款汇总查询
FR-CRM-009: 系统支持联系人完整 CRUD
FR-CRM-010: 联系人包含：姓名、职位、手机号、邮箱、角色标记、是否首要联系人
FR-CRM-011: 系统支持按客户 ID 查询该客户下的联系人列表，支持按角色标记筛选
FR-CRM-012: 系统支持创建、编辑、删除商机
FR-CRM-013: 商机必须归属某个客户，状态包括：跟进中、报价中、成交、失败

FR-IMS-001: 系统支持创建、编辑、删除物料（SKU），物料类型包括：成品、原材料、零部件、办公用品、耗材
FR-IMS-002: 物料包含：名称、类型、规格参数（JSON）、单位、单价；库存数量按仓库维度管理
FR-IMS-003: 系统支持创建、编辑、删除供应商
FR-IMS-004: 供应商包含：名称、联系人、联系方式、地址
FR-IMS-005: 系统支持采购订单管理（创建、审批、入库），采购订单明细关联物料 SKU
FR-IMS-006: 采购入库时可以选择触发质检流程
FR-IMS-007: 质检通过后才能正式入库，不合格触发退换货流程
FR-IMS-008: 采购入库后自动增加对应仓库的库存（生成入库流水）
FR-IMS-009: 系统支持销售订单管理（创建、审批、出库）
FR-IMS-010: 销售出库后自动扣减对应仓库的库存，库存不足禁止出库
FR-IMS-011: 系统支持库存查询（当前库存、在途库存）
FR-IMS-012: 系统支持库存预警（低于安全库存提醒）
FR-IMS-013: 系统支持按物料查询历史报价
FR-IMS-014: 系统支持差异化报价策略（不同客户级别不同价格）
FR-IMS-015: 系统支持多仓库管理：创建、编辑、停用仓库
FR-IMS-016: 库存按仓库维度管理：同一物料在不同仓库有独立库存数量、安全库存、在途数量
FR-IMS-017: 系统支持仓库间调拨：创建调拨单、审批、源仓库出库、目标仓库入库
FR-IMS-018: 调拨支持实收数量：到货时填写实收数量，与调拨数量不一致时记录差异
FR-IMS-019: 系统支持统一出入库流水记录
FR-IMS-020: 出入库流水记录包含：批次号、效期、序列号、规格参数（JSON）
FR-IMS-021: 系统支持领用申请：员工发起领用，可配置审批流，审批通过后仓库确认出库
FR-IMS-022: 领用支持实发数量：仓库确认时填写实发数量，可少于申请数量
FR-IMS-023: 库存查询支持按仓库维度查看
FR-IMS-024: 系统支持盘库（库存盘点）
FR-IMS-025: 盘库完成后自动生成盘盈盘亏明细
FR-IMS-026: 盘盈盘亏经审批后自动生成盘点调整出入库流水
FR-IMS-027: 盘库支持按批次号/效期维度盘点

FR-CON-001: 系统支持创建、编辑、删除合同
FR-CON-002: 合同包含：合同编号、客户、签订日期、有效期、金额、状态
FR-CON-003: 合同必须关联客户，可绑定一个或多个销售订单
FR-CON-004: 系统支持上传合同附件（扫描件、补充协议等）
FR-CON-005: 系统支持合同审批流
FR-CON-006: 合同状态：草稿、审批中、已生效、已履行、已终止
FR-CON-007: 合同可关联采购订单
FR-CON-008: 合同可绑定出库记录
FR-CON-009: Agent 支持自然语言修改合同字段

FR-SALES-001: 系统支持创建、编辑、删除销售订单
FR-SALES-002: 销售订单包含：订单编号、客户、产品明细、数量、单价、金额
FR-SALES-003: 销售订单必须关联客户
FR-SALES-004: 销售订单可绑定合同
FR-SALES-005: 销售订单可绑定出库记录
FR-SALES-006: 出库记录包含：产品、配件、仪器、数量
FR-SALES-007: 出库配件/产品必须与合同关联
FR-SALES-008: 系统支持销售订单审批流
FR-SALES-009: 销售订单状态：草稿、审批中、已确认、已出库、已完成

FR-SVC-001: 系统支持创建、编辑、删除售后工单
FR-SVC-002: 售后工单包含：工单编号、客户、设备信息、问题描述、状态
FR-SVC-003: 工单类型分为：收费、免费
FR-SVC-004: 收费工单需要上传报价单附件
FR-SVC-005: 报价单附件作为工单附件保存
FR-SVC-006: 客户确认报价后进入维修处理
FR-SVC-007: 系统支持生成维修工单
FR-SVC-008: 维修工单包含：故障点、维修内容、基本信息
FR-SVC-009: 维修完成后需要客户签字确认
FR-SVC-010: 签字确认件作为附件上传
FR-SVC-011: 工单状态：创建、报价中、确认、维修中、待签字、已完成
FR-SVC-012: 系统支持上传工单相关附件

FR-FIN-001: 系统支持应收款管理
FR-FIN-002: 应收款关联销售订单或合同
FR-FIN-003: 系统支持应付款管理
FR-FIN-004: 应付款关联采购订单
FR-FIN-005: 系统支持创建、编辑、删除请款申请
FR-FIN-006: 请款申请必须关联合同或销售订单
FR-FIN-007: 请款申请支持上传附件（发票、凭证等）
FR-FIN-008: 系统支持请款审批流
FR-FIN-009: 系统支持回款登记
FR-FIN-010: 回款登记关联应收款，支持部分回款和全额回款
FR-FIN-011: 回款后自动更新关联合同/销售单的已回款金额
FR-FIN-012: 系统支持发票管理（开具、收到）
FR-FIN-013: 发票关联业务单据（销售、采购、合同）
FR-FIN-014: 系统支持按时间范围查询应收款汇总
FR-FIN-015: 系统支持逾期未回款提醒
FR-FIN-016: 系统支持合同维度回款追踪
FR-FIN-017: 合同支持记录回款计划（回款周期）
FR-FIN-018: 系统支持回款计划到期自动提醒
FR-FIN-019: 系统支持往来款凭证管理
FR-FIN-020: 系统支持往来款对账 API
FR-FIN-021: 系统支持现金流预测 API

FR-WF-001: 企业管理员可以配置审批工作流
FR-WF-002: 工作流包含：名称、适用业务、节点列表
FR-WF-003: 节点包含：审批人/角色/部门经理、条件、顺序
FR-WF-004: 支持串行审批（逐级审批）
FR-WF-005: 支持并行审批（多节点同时审批）
FR-WF-006: 支持条件路由（金额 > X → 额外审批节点）
FR-WF-007: 审批人可查看附件
FR-WF-008: 审批人可填写审批意见
FR-WF-009: 审批结果：通过、拒绝、转交
FR-WF-010: 拒绝后可返回申请人修改
FR-WF-011: 系统支持待审批列表查询
FR-WF-012: 系统支持已审批历史查询

FR-FILE-001: 系统支持上传附件到业务单据
FR-FILE-002: 附件存储路径：/storage/{enterprise_id}/{module}/{record_id}/
FR-FILE-003: 支持的文件类型：PDF、图片、Excel、Word
FR-FILE-004: 单文件大小限制：100MB（可配置）
FR-FILE-005: 系统支持下载附件
FR-FILE-006: 系统支持生成附件预览链接（有效期可配置）
FR-FILE-007: 预览链接通过 Agent 传递给管理员查看
FR-FILE-008: 附件可被删除（软删除，保留历史）
FR-FILE-009: 导出 PDF 时支持附件跳转链接

FR-KB-001: 系统支持上传文档到企业知识库
FR-KB-002: 系统支持文档内容的向量化存储
FR-KB-003: 系统支持语义检索（根据自然语言查询相关文档）
FR-KB-004: 知识库内容按企业隔离
FR-KB-005: 系统支持知识库的增删改查管理

FR-MSG-001: 系统支持消息发送和接收
FR-MSG-002: CLI 支持轮询机制获取未读消息（默认 30 秒间隔）
FR-MSG-003: CLI 支持本地缓存未读消息
FR-MSG-004: Agent 支持调用 Skill 触发消息通知
FR-MSG-005: 用户可以标记消息为已读
FR-MSG-006: 系统支持发送全员公告通知
FR-MSG-007: 老板/管理员可查看公告的已读/未读员工列表

FR-GROUP-001: 运营商可以创建集团账号
FR-GROUP-002: 集团老板可以创建多个企业
FR-GROUP-003: 老板可以在企业间切换视角
FR-GROUP-004: 集团老板可以开通员工跨企业权限
FR-GROUP-005: 跨企业权限需要指定可访问的企业和数据范围
FR-GROUP-006: 各企业管理员分配跨企业员工的访问范围
FR-GROUP-007: 系统支持老板查看跨企业经营汇总
FR-GROUP-008: 员工跨企业访问时，记录操作审计日志

FR-CUST-001: 企业管理员可以添加自定义字段到员工、客户等实体
FR-CUST-002: 自定义字段支持类型：string、number、date、enum、file、relation、boolean
FR-CUST-003: 每个自定义字段可独立启用/禁用
FR-CUST-004: 每个实体可配置是否需要附件支持
FR-CUST-005: 系统支持实体关联关系配置
FR-CUST-006: Operator 可以通过 Agent 对话帮客户配置上述内容

FR-SKILL-001: 系统提供标准化的 Skill 定义供 Agent 调用
FR-SKILL-002: Skill 支持开场白，告知用户可用的功能
FR-SKILL-003: Skill 支持选项菜单，展示具体操作选项
FR-SKILL-004: Agent 支持理解用户自然语言意图并调用对应 Skill
FR-SKILL-005: Skill 支持所有 CRUD 操作
FR-SKILL-006: Skill 调用具备幂等性，重复调用不产生副作用
FR-SKILL-007: Skill 支持基于角色的差异化开场白
FR-SKILL-008: Skill 支持字段说明（字段名、类型、是否必填、示例值）

FR-OP-001: 运营商可以通过 Agent 查看所有租用企业的列表和使用情况
FR-OP-002: 运营商可以激活、暂停、恢复企业服务
FR-OP-003: 运营商可以冻结、解冻企业（风控场景）
FR-OP-004: 运营商可以标记企业过期、续费
FR-OP-005: 运营商可以取消、永久删除企业
FR-OP-006: 系统记录企业所有状态变更日志
FR-OP-007: 不同状态的企业有不同的 API 访问权限

FR-BILL-001: 系统支持订阅计划管理（Free/Pro/Enterprise）
FR-BILL-002: 系统支持企业订阅周期管理（月付/年付）
FR-BILL-003: 系统支持在线支付接入（支付宝/微信支付）
FR-BILL-004: 系统支持自动续费扣款
FR-BILL-005: 系统支持账单自动生成
FR-BILL-006: 运营商/企业管理员可以查看历史账单
FR-BILL-007: 系统支持欠费自动处理
FR-BILL-008: 系统支持退款处理
FR-BILL-009: 运营商可以查看收入汇总
FR-BILL-010: 系统支持企业升级/降级订阅计划

FR-REPORT-001: 系统提供销售统计 API
FR-REPORT-002: 系统提供财务统计 API
FR-REPORT-003: 系统提供库存统计 API
FR-REPORT-004: 系统提供人事统计 API
FR-REPORT-005: 系统支持多维度交叉查询
FR-REPORT-006: 系统支持跨企业经营汇总 API
FR-REPORT-007: 系统支持定时报表生成与推送
FR-REPORT-008: 运营商可以查看全局运营统计

FR-AUDIT-001: 系统记录业务数据变更的前后值（before/after diff）
FR-AUDIT-002: 系统支持数据版本链查询
FR-AUDIT-003: 系统支持事件流查询
FR-AUDIT-004: 敏感操作自动告警
FR-AUDIT-005: 系统支持数据历史版本查看
FR-AUDIT-006: 审计日志支持导出

FR-IMPORT-001: 系统支持通用数据导入框架
FR-IMPORT-002: 系统提供导入模板下载
FR-IMPORT-003: 系统支持导入验证与错误报告
FR-IMPORT-004: 系统支持重复检测与合并策略
FR-IMPORT-005: 系统支持数据导出
FR-IMPORT-006: 系统支持导出模板与导入模板一致

FR-EXPORT-001: 系统支持 Agent 对话式数据导出
FR-EXPORT-002: 系统支持单实体导出
FR-EXPORT-003: 系统支持跨实体关联导出（客户锚点）
FR-EXPORT-004: 系统支持以员工为锚点的业务记录导出
FR-EXPORT-005: 系统支持员工操作日志导出
FR-EXPORT-006: 导出权限与 RBAC 绑定
FR-EXPORT-007: 导出格式支持 .xlsx 和 .csv
FR-EXPORT-008: 系统支持导出任务异步执行
FR-EXPORT-009: 系统支持导出字段选择
FR-EXPORT-010: 系统支持导出数据脱敏

FR-WEBHOOK-001: 系统支持 Webhook 注册与管理
FR-WEBHOOK-002: 系统支持事件订阅
FR-WEBHOOK-003: 系统支持 Webhook 投递与重试
FR-WEBHOOK-004: 系统记录 Webhook 投递日志
FR-WEBHOOK-005: Webhook 请求包含签名验证（HMAC-SHA256）
FR-WEBHOOK-006: 系统支持自定义事件过滤

FR-CS-001: 系统计算企业活跃度评分
FR-CS-002: 系统追踪功能采纳率
FR-CS-003: 系统支持流失预警
FR-CS-004: 运营商可以查看客户健康度看板
FR-CS-005: 系统记录企业关键行为里程碑

FR-KB2-001: 知识库支持文档版本管理
FR-KB2-002: 知识库支持文档权限控制
FR-KB2-003: 知识库支持文档分类与标签体系
FR-KB2-004: 知识库支持混合检索模式
FR-KB2-005: 知识库支持自动入档
FR-KB2-006: 知识库支持 Agent 上下文注入

FR-SEC2-001: 系统支持多因素认证（MFA）
FR-SEC2-002: 系统支持数据脱敏
FR-SEC2-003: 系统支持操作撤销
FR-SEC2-004: 系统支持批量操作 API

FR-ASSIST-001: 系统提供统一待办聚合 API
FR-ASSIST-002: 系统支持流程指引查询
FR-ASSIST-003: 系统支持员工自助查询个人信息 API
FR-ASSIST-004: 系统支持员工快捷操作 Skill
FR-ASSIST-005: 系统支持员工一键生成工作报告 Skill

FR-CLI-001: CLI 提供 ao-cli init 初始化命令
FR-CLI-002: CLI 初始化时自动下载企业专属 Skill 定义文件
FR-CLI-003: CLI 初始化时自动生成 CLAUDE.md 文件
FR-CLI-004: CLI 初始化时自动生成 agent.md 文件
FR-CLI-005: CLI 支持 ao-cli init --update 更新命令
FR-CLI-006: CLAUDE.md 和 agent.md 内容由运营商客制化
FR-CLI-007: CLI 初始化时自动生成 README.md 客制化使用指南
FR-CLI-008: README.md 由服务端模板渲染生成
FR-CLI-009: CLI 自动记录所有 Skill 执行操作日志
FR-CLI-010: CLI 操作日志按日期归档保存

FR-DEPLOY-001: 系统提供跨平台 Docker Compose 部署方案
FR-DEPLOY-002: 系统提供原生二进制部署方案
FR-DEPLOY-003: 系统支持指定端口部署
FR-DEPLOY-004: 系统支持指定数据目录
FR-DEPLOY-005: 系统提供 ao-cli deploy 部署引导命令
FR-DEPLOY-006: 系统支持局域网内 TLS 自签名证书部署
FR-DEPLOY-007: 系统支持私有化部署的在线升级
FR-DEPLOY-008: 系统提供私有化部署健康检查 API

FR-OWNER-001: 系统提供经营者信号灯 API
FR-OWNER-002: 系统支持经营者预警订阅
FR-OWNER-003: 系统提供关键业务指标 API
FR-OWNER-004: 系统支持归因分析 API
FR-OWNER-005: 系统支持预警阈值配置
FR-OWNER-006: 系统支持 Group Owner 跨企业汇总 API

FR-OPSVC-001: 系统支持行业模板管理
FR-OPSVC-002: 运营商可通过 Skill 调用 operator_template_apply 将行业模板应用到指定企业
FR-OPSVC-003: 运营商可创建和管理自定义行业模板
FR-OPSVC-004: 系统提供运营商专属配置 Skill 集
FR-OPSVC-005: 运营商配置 Skill 支持预览模式
FR-OPSVC-006: 运营商每次配置操作均记录审计日志
FR-OPSVC-007: 系统支持企业专属 Skill 矩阵
FR-OPSVC-008: 行业模板包含预设 Skill 矩阵
FR-OPSVC-009: 企业 Skill 矩阵变更时自动通知该企业的 CLI
FR-OPSVC-010: 运营商配置的预警规则和信号灯指标自动与业务事件联动
FR-OPSVC-011: 运营商可查看企业配置全景图

FR-I18N-001: 系统支持语言偏好设置
FR-I18N-002: Skill 定义支持多语言
FR-I18N-003: API 错误码支持多语言
FR-I18N-004: CLAUDE.md / agent.md / README.md 生成时支持多语言
FR-I18N-005: 系统消息和通知支持多语言
FR-I18N-006: 运营商可通过 operator_skill_configure Skill 管理多语言内容

### NonFunctional Requirements

NFR-PERF-001: API 平均响应时间 < 200ms（P95 < 500ms）
NFR-PERF-002: 支持并发 Agent 请求：每企业 ≥ 100 并发
NFR-PERF-003: Rate Limiting：每企业 1000 QPS，每 IP 100 QPS
NFR-PERF-004: 文件上传：支持分片上传，单文件最大 100MB
NFR-PERF-005: CLI 轮询间隔：默认 30 秒，可配置

NFR-SEC-001: 所有 API 必须 HTTPS 访问
NFR-SEC-002: 密码存储：bcrypt/argon2 加密，不可逆
NFR-SEC-003: 多租户数据隔离：100% 隔离，无数据泄露
NFR-SEC-004: RBAC 权限：每个 API 必须验证权限
NFR-SEC-005: SQL 注入防护：参数化查询
NFR-SEC-006: 文件上传安全：类型校验、大小限制

NFR-REL-001: 系统可用性 ≥ 99.5%
NFR-REL-002: 自动定时备份：每日备份（可配置时间）
NFR-REL-003: 故障恢复：RTO < 1 小时
NFR-REL-004: 事务一致性：库存、金额等强一致性
NFR-REL-005: 操作日志：所有业务操作记录，保留至少 3 年

NFR-EXT-001: 模块化架构，支持独立部署/升级
NFR-EXT-002: 数据库支持水平分表（按企业分表）
NFR-EXT-003: 文件存储支持 OSS/S3 迁移

NFR-INT-001: API 文档：OpenAPI 3.0，100% 覆盖
NFR-INT-002: CLI 多平台：macOS/Linux/Windows
NFR-INT-003: 认证方式：OAuth 2.0 + Refresh Token

NFR-OBS-001: 日志记录：结构化 JSON 日志，输出到 stdout
NFR-OBS-002: 监控告警：Prometheus + Grafana
NFR-OBS-003: 链路追踪：OpenTelemetry

NFR-DEP-001: 支持 Docker 容器化部署
NFR-DEP-002: 支持 Kubernetes 部署
NFR-DEP-003: 提供 docker-compose 一键部署
NFR-DEP-004: 支持局域网内网部署
NFR-DEP-005: 开源许可证：AGPL v3
NFR-DEP-006: 私有化部署支持 Windows Server / macOS / Linux 三平台
NFR-DEP-007: 私有化部署提供原生二进制方案
NFR-DEP-008: 私有化部署支持自定义端口和数据目录

### Additional Requirements

- **Starter Template**: Go + Gin + GORM + Cobra 技术栈，Epic 1 Story 1 基于此创建项目脚手架
- **项目结构**: api/（Go Backend）+ cli/（Cobra CLI）+ deploy/（Docker Compose）
- **多租户策略**: PostgreSQL Schema 级隔离 + Row-Level Security
- **认证授权**: OAuth 2.0 + JWT + Refresh Token，RBAC + ABAC 混合权限模型
- **消息轮询**: CLI 每 30-60 秒轮询未读消息
- **错误码体系**: 结构化错误码 + Agent 可恢复策略
- **统一响应格式**: { "data": ..., "error": ..., "meta": ... }
- **部署架构**: Docker Compose 一键部署 + 局域网部署 + 原生二进制方案
- **API 规范**: HTTPS REST JSON，URL 路径版本 /api/v1/，Cursor-based + Offset 分页

### FR Coverage Map

| FR-ID | Epic | 简要描述 |
|-------|------|---------|
| FR-AUTH-001 | Epic 1 | OAuth 2.0 认证 |
| FR-AUTH-002 | Epic 1 | Refresh Token |
| FR-AUTH-003 | Epic 1 | RBAC 角色权限控制 |
| FR-AUTH-004 | Epic 2 | 跨企业权限管理 |
| FR-AUTH-005 | Epic 1 | API 权限验证 |
| FR-AUTH-006 | Epic 1 | 操作审计日志 |
| FR-AUTH-007 | Epic 1 | 日志查询 |
| FR-AUTH-008 | Epic 1 | 自动定时备份 |
| FR-AUTH-009 | Epic 2 | 精细化权限分配 |
| FR-AUTH-010 | Epic 1 | 结构化错误码体系 |
| FR-AUTH-011 | Epic 1 | CLI 多平台运行 |
| FR-AUTH-012 | Epic 1 | Schema 级数据隔离 |
| FR-AUTH-013 | Epic 1 | 企业级独立备份与恢复 |
| FR-AUTH-014 | Epic 1 | CLI 开机自启 |
| FR-AUTH-015 | Epic 1 | API 配额管理 |
| FR-AUTH-016 | Epic 1 | 功能开关 |
| FR-AUTH-017 | Epic 1 | 可观测性架构 |
| FR-ORG-001 | Epic 2 | 创建/编辑/删除集团 |
| FR-ORG-002 | Epic 2 | 老板创建企业 |
| FR-ORG-003 | Epic 2 | 创建/编辑/删除部门 |
| FR-ORG-004 | Epic 2 | 设置部门经理 |
| FR-ORG-005 | Epic 2 | 部门经理编辑部门信息 |
| FR-ORG-006 | Epic 2 | 创建/编辑/删除员工档案 |
| FR-ORG-007 | Epic 2 | 员工归属部门 |
| FR-ORG-008 | Epic 2 | 老板切换企业视角 |
| FR-ORG-009 | Epic 2 | 组织架构树形结构查询 |
| FR-ORG-010 | Epic 3 | 入职/离职/岗位信息记录 |
| FR-ORG-011 | Epic 2 | 按角色查询员工 |
| FR-ORG-012 | Epic 2 | 按姓名模糊查询员工 |
| FR-ORG-013 | Epic 2 | 岗位定义与管理 |
| FR-GROUP-001 | Epic 2 | 创建集团账号 |
| FR-GROUP-002 | Epic 2 | 老板创建多个企业 |
| FR-GROUP-003 | Epic 2 | 老板切换企业视角 |
| FR-GROUP-004 | Epic 2 | 开通员工跨企业权限 |
| FR-GROUP-005 | Epic 2 | 跨企业权限数据范围 |
| FR-GROUP-006 | Epic 2 | 管理员分配跨企业访问范围 |
| FR-GROUP-007 | Epic 2 | 跨企业经营汇总 |
| FR-GROUP-008 | Epic 2 | 跨企业操作审计日志 |
| FR-HRM-001 | Epic 3 | 创建员工档案（入职） |
| FR-HRM-002 | Epic 3 | 编辑员工档案 |
| FR-HRM-003 | Epic 3 | 标记员工离职 |
| FR-HRM-004 | Epic 3 | 查看所有员工列表 |
| FR-HRM-005 | Epic 3 | 员工查看自己档案 |
| FR-HRM-006 | Epic 3 | 批量导入员工 |
| FR-HRM-007 | Epic 3 | 调岗操作 |
| FR-HRM-008 | Epic 3 | 查询员工销售业绩 |
| FR-ASSIST-003 | Epic 3 | 员工自助查询个人信息 |
| FR-CRM-001 | Epic 4 | 客户档案 CRUD |
| FR-CRM-002 | Epic 4 | 客户档案字段定义 |
| FR-CRM-003 | Epic 4 | 客户分级管理 |
| FR-CRM-004 | Epic 4 | 客户自由标签 |
| FR-CRM-005 | Epic 4 | 客户全景视图 API |
| FR-CRM-006 | Epic 4 | 客户与合同关联查询 |
| FR-CRM-007 | Epic 4 | 客户与售后工单关联查询 |
| FR-CRM-008 | Epic 4 | 客户往来款汇总查询 |
| FR-CRM-009 | Epic 4 | 联系人 CRUD |
| FR-CRM-010 | Epic 4 | 联系人字段定义 |
| FR-CRM-011 | Epic 4 | 按客户查询联系人 |
| FR-CRM-012 | Epic 4 | 商机 CRUD |
| FR-CRM-013 | Epic 4 | 商机归属客户与状态 |
| FR-IMS-001 | Epic 5 | 物料 SKU CRUD |
| FR-IMS-002 | Epic 5 | 物料字段定义 |
| FR-IMS-003 | Epic 5 | 供应商 CRUD |
| FR-IMS-004 | Epic 5 | 供应商字段定义 |
| FR-IMS-005 | Epic 5 | 采购订单管理 |
| FR-IMS-006 | Epic 5 | 采购质检流程 |
| FR-IMS-007 | Epic 5 | 质检不合格退换货 |
| FR-IMS-008 | Epic 5 | 采购入库增加库存 |
| FR-IMS-009 | Epic 5 | 销售订单管理 |
| FR-IMS-010 | Epic 5 | 销售出库扣减库存 |
| FR-IMS-011 | Epic 5 | 库存查询 |
| FR-IMS-012 | Epic 5 | 库存预警 |
| FR-IMS-013 | Epic 5 | 物料历史报价查询 |
| FR-IMS-014 | Epic 5 | 差异化报价策略 |
| FR-IMS-015 | Epic 5 | 多仓库管理 |
| FR-IMS-016 | Epic 5 | 库存按仓库维度管理 |
| FR-IMS-017 | Epic 5 | 仓库间调拨 |
| FR-IMS-018 | Epic 5 | 调拨实收数量 |
| FR-IMS-019 | Epic 5 | 统一出入库流水 |
| FR-IMS-020 | Epic 5 | 出入库流水字段定义 |
| FR-IMS-021 | Epic 5 | 领用申请 |
| FR-IMS-022 | Epic 5 | 领用实发数量 |
| FR-IMS-023 | Epic 5 | 按仓库维度库存查询 |
| FR-IMS-024 | Epic 5 | 盘库（库存盘点） |
| FR-IMS-025 | Epic 5 | 盘盈盘亏明细 |
| FR-IMS-026 | Epic 5 | 盘点调整出入库流水 |
| FR-IMS-027 | Epic 5 | 按批次号/效期盘点 |
| FR-CON-001 | Epic 6 | 合同 CRUD |
| FR-CON-002 | Epic 6 | 合同字段定义 |
| FR-CON-003 | Epic 6 | 合同关联客户和销售订单 |
| FR-CON-004 | Epic 6 | 上传合同附件 |
| FR-CON-005 | Epic 6 | 合同审批流 |
| FR-CON-006 | Epic 6 | 合同状态机 |
| FR-CON-007 | Epic 6 | 合同关联采购订单 |
| FR-CON-008 | Epic 6 | 合同绑定出库记录 |
| FR-CON-009 | Epic 6 | Agent 自然语言修改合同 |
| FR-SALES-001 | Epic 6 | 销售订单 CRUD |
| FR-SALES-002 | Epic 6 | 销售订单字段定义 |
| FR-SALES-003 | Epic 6 | 销售订单关联客户 |
| FR-SALES-004 | Epic 6 | 销售订单绑定合同 |
| FR-SALES-005 | Epic 6 | 销售订单绑定出库记录 |
| FR-SALES-006 | Epic 6 | 出库记录字段定义 |
| FR-SALES-007 | Epic 6 | 出库与合同关联 |
| FR-SALES-008 | Epic 6 | 销售订单审批流 |
| FR-SALES-009 | Epic 6 | 销售订单状态机 |
| FR-SVC-001 | Epic 6 | 售后工单 CRUD |
| FR-SVC-002 | Epic 6 | 售后工单字段定义 |
| FR-SVC-003 | Epic 6 | 工单类型（收费/免费） |
| FR-SVC-004 | Epic 6 | 收费工单报价单附件 |
| FR-SVC-005 | Epic 6 | 报价单附件保存 |
| FR-SVC-006 | Epic 6 | 客户确认报价进入维修 |
| FR-SVC-007 | Epic 6 | 生成维修工单 |
| FR-SVC-008 | Epic 6 | 维修工单字段定义 |
| FR-SVC-009 | Epic 6 | 客户签字确认 |
| FR-SVC-010 | Epic 6 | 签字确认件上传 |
| FR-SVC-011 | Epic 6 | 工单状态机 |
| FR-SVC-012 | Epic 6 | 上传工单附件 |
| FR-FIN-001 | Epic 7 | 应收款管理 |
| FR-FIN-002 | Epic 7 | 应收款关联销售订单/合同 |
| FR-FIN-003 | Epic 7 | 应付款管理 |
| FR-FIN-004 | Epic 7 | 应付款关联采购订单 |
| FR-FIN-005 | Epic 7 | 请款申请 CRUD |
| FR-FIN-006 | Epic 7 | 请款关联合同/销售订单 |
| FR-FIN-007 | Epic 7 | 请款上传附件 |
| FR-FIN-008 | Epic 7 | 请款审批流 |
| FR-FIN-009 | Epic 7 | 回款登记 |
| FR-FIN-010 | Epic 7 | 部分回款和全额回款 |
| FR-FIN-011 | Epic 7 | 回款自动更新已回款金额 |
| FR-FIN-012 | Epic 7 | 发票管理 |
| FR-FIN-013 | Epic 7 | 发票关联业务单据 |
| FR-FIN-014 | Epic 7 | 应收款汇总查询 |
| FR-FIN-015 | Epic 7 | 逾期未回款提醒 |
| FR-FIN-016 | Epic 7 | 合同维度回款追踪 |
| FR-FIN-017 | Epic 7 | 回款计划（回款周期） |
| FR-FIN-018 | Epic 7 | 回款计划到期自动提醒 |
| FR-FIN-019 | Epic 7 | 往来款凭证管理 |
| FR-FIN-020 | Epic 7 | 往来款对账 API |
| FR-FIN-021 | Epic 7 | 现金流预测 API |
| FR-WF-001 | Epic 7 | 配置审批工作流 |
| FR-WF-002 | Epic 7 | 工作流字段定义 |
| FR-WF-003 | Epic 7 | 节点字段定义 |
| FR-WF-004 | Epic 7 | 串行审批 |
| FR-WF-005 | Epic 7 | 并行审批 |
| FR-WF-006 | Epic 7 | 条件路由 |
| FR-WF-007 | Epic 7 | 审批人查看附件 |
| FR-WF-008 | Epic 7 | 审批人填写意见 |
| FR-WF-009 | Epic 7 | 审批结果（通过/拒绝/转交） |
| FR-WF-010 | Epic 7 | 拒绝返回修改 |
| FR-WF-011 | Epic 7 | 待审批列表查询 |
| FR-WF-012 | Epic 7 | 已审批历史查询 |
| FR-FILE-001 | Epic 8 | 上传附件到业务单据 |
| FR-FILE-002 | Epic 8 | 附件存储路径 |
| FR-FILE-003 | Epic 8 | 支持的文件类型 |
| FR-FILE-004 | Epic 8 | 单文件大小限制 |
| FR-FILE-005 | Epic 8 | 下载附件 |
| FR-FILE-006 | Epic 8 | 生成预览链接 |
| FR-FILE-007 | Epic 8 | 预览链接通过 Agent 传递 |
| FR-FILE-008 | Epic 8 | 附件软删除 |
| FR-FILE-009 | Epic 8 | 导出 PDF 附件跳转 |
| FR-MSG-001 | Epic 8 | 消息发送和接收 |
| FR-MSG-002 | Epic 8 | CLI 轮询机制 |
| FR-MSG-003 | Epic 8 | CLI 本地缓存消息 |
| FR-MSG-004 | Epic 8 | Skill 触发消息通知 |
| FR-MSG-005 | Epic 8 | 标记消息已读 |
| FR-MSG-006 | Epic 8 | 全员公告通知 |
| FR-MSG-007 | Epic 8 | 公告已读/未读列表 |
| FR-KB-001 | Epic 8 | 上传文档到知识库 |
| FR-KB-002 | Epic 8 | 文档向量化存储 |
| FR-KB-003 | Epic 8 | 语义检索 |
| FR-KB-004 | Epic 8 | 知识库企业隔离 |
| FR-KB-005 | Epic 8 | 知识库增删改查 |
| FR-SKILL-001 | Epic 8 | 标准化 Skill 定义 |
| FR-SKILL-002 | Epic 8 | Skill 开场白 |
| FR-SKILL-003 | Epic 8 | Skill 选项菜单 |
| FR-SKILL-004 | Epic 8 | Agent 自然语言意图调用 |
| FR-SKILL-005 | Epic 8 | Skill CRUD 操作 |
| FR-SKILL-006 | Epic 8 | Skill 幂等性 |
| FR-SKILL-007 | Epic 8 | 基于角色的差异化开场白 |
| FR-SKILL-008 | Epic 8 | Skill 字段说明 |
| FR-KB2-001 | Epic 8 | 文档版本管理 |
| FR-KB2-002 | Epic 8 | 文档权限控制 |
| FR-KB2-003 | Epic 8 | 文档分类与标签体系 |
| FR-KB2-004 | Epic 8 | 混合检索模式 |
| FR-KB2-005 | Epic 8 | 自动入档 |
| FR-KB2-006 | Epic 8 | Agent 上下文注入 |
| FR-OP-001 | Epic 9 | 运营商查看企业列表和使用情况 |
| FR-OP-002 | Epic 9 | 运营商激活/暂停/恢复企业 |
| FR-OP-003 | Epic 9 | 运营商冻结/解冻企业 |
| FR-OP-004 | Epic 9 | 运营商标记企业过期/续费 |
| FR-OP-005 | Epic 9 | 运营商取消/删除企业 |
| FR-OP-006 | Epic 9 | 企业状态变更日志 |
| FR-OP-007 | Epic 9 | 不同状态企业 API 访问权限 |
| FR-BILL-001 | Epic 9 | 订阅计划管理 |
| FR-BILL-002 | Epic 9 | 订阅周期管理 |
| FR-BILL-003 | Epic 9 | 在线支付接入 |
| FR-BILL-004 | Epic 9 | 自动续费扣款 |
| FR-BILL-005 | Epic 9 | 账单自动生成 |
| FR-BILL-006 | Epic 9 | 查看历史账单 |
| FR-BILL-007 | Epic 9 | 欠费自动处理 |
| FR-BILL-008 | Epic 9 | 退款处理 |
| FR-BILL-009 | Epic 9 | 收入汇总 |
| FR-BILL-010 | Epic 9 | 升级/降级订阅计划 |
| FR-CS-001 | Epic 9 | 企业活跃度评分 |
| FR-CS-002 | Epic 9 | 功能采纳率追踪 |
| FR-CS-003 | Epic 9 | 流失预警 |
| FR-CS-004 | Epic 9 | 客户健康度看板 |
| FR-CS-005 | Epic 9 | 企业关键行为里程碑 |
| FR-OPSVC-001 | Epic 9 | 行业模板管理 |
| FR-OPSVC-002 | Epic 9 | 行业模板应用 |
| FR-OPSVC-003 | Epic 9 | 自定义行业模板 |
| FR-OPSVC-004 | Epic 9 | 运营商配置 Skill 集 |
| FR-OPSVC-005 | Epic 9 | 配置 Skill 预览模式 |
| FR-OPSVC-006 | Epic 9 | 配置操作审计日志 |
| FR-OPSVC-007 | Epic 9 | 企业专属 Skill 矩阵 |
| FR-OPSVC-008 | Epic 9 | 行业模板预设 Skill 矩阵 |
| FR-OPSVC-009 | Epic 9 | Skill 矩阵变更通知 CLI |
| FR-OPSVC-010 | Epic 9 | 配置与业务事件联动 |
| FR-OPSVC-011 | Epic 9 | 企业配置全景图 |
| FR-CUST-001 | Epic 9 | 自定义字段 |
| FR-CUST-002 | Epic 9 | 自定义字段类型 |
| FR-CUST-003 | Epic 9 | 自定义字段启用/禁用 |
| FR-CUST-004 | Epic 9 | 实体附件支持配置 |
| FR-CUST-005 | Epic 9 | 实体关联关系配置 |
| FR-CUST-006 | Epic 9 | Operator 通过 Agent 配置 |
| FR-REPORT-001 | Epic 10 | 销售统计 API |
| FR-REPORT-002 | Epic 10 | 财务统计 API |
| FR-REPORT-003 | Epic 10 | 库存统计 API |
| FR-REPORT-004 | Epic 10 | 人事统计 API |
| FR-REPORT-005 | Epic 10 | 多维度交叉查询 |
| FR-REPORT-006 | Epic 10 | 跨企业经营汇总 API |
| FR-REPORT-007 | Epic 10 | 定时报表生成与推送 |
| FR-REPORT-008 | Epic 10 | 全局运营统计 |
| FR-OWNER-001 | Epic 10 | 经营者信号灯 API |
| FR-OWNER-002 | Epic 10 | 经营者预警订阅 |
| FR-OWNER-003 | Epic 10 | 关键业务指标 API |
| FR-OWNER-004 | Epic 10 | 归因分析 API |
| FR-OWNER-005 | Epic 10 | 预警阈值配置 |
| FR-OWNER-006 | Epic 10 | Group Owner 跨企业汇总 |
| FR-AUDIT-001 | Epic 10 | 变更前后值记录 |
| FR-AUDIT-002 | Epic 10 | 数据版本链查询 |
| FR-AUDIT-003 | Epic 10 | 事件流查询 |
| FR-AUDIT-004 | Epic 10 | 敏感操作自动告警 |
| FR-AUDIT-005 | Epic 10 | 数据历史版本查看 |
| FR-AUDIT-006 | Epic 10 | 审计日志导出 |
| FR-IMPORT-001 | Epic 10 | 通用数据导入框架 |
| FR-IMPORT-002 | Epic 10 | 导入模板下载 |
| FR-IMPORT-003 | Epic 10 | 导入验证与错误报告 |
| FR-IMPORT-004 | Epic 10 | 重复检测与合并策略 |
| FR-IMPORT-005 | Epic 10 | 数据导出 |
| FR-IMPORT-006 | Epic 10 | 导出模板与导入模板一致 |
| FR-EXPORT-001 | Epic 10 | Agent 对话式数据导出 |
| FR-EXPORT-002 | Epic 10 | 单实体导出 |
| FR-EXPORT-003 | Epic 10 | 跨实体关联导出（客户锚点） |
| FR-EXPORT-004 | Epic 10 | 员工维度业务记录导出 |
| FR-EXPORT-005 | Epic 10 | 员工操作日志导出 |
| FR-EXPORT-006 | Epic 10 | 导出权限与 RBAC 绑定 |
| FR-EXPORT-007 | Epic 10 | 导出格式 .xlsx/.csv |
| FR-EXPORT-008 | Epic 10 | 导出任务异步执行 |
| FR-EXPORT-009 | Epic 10 | 导出字段选择 |
| FR-EXPORT-010 | Epic 10 | 导出数据脱敏 |
| FR-WEBHOOK-001 | Epic 10 | Webhook 注册与管理 |
| FR-WEBHOOK-002 | Epic 10 | 事件订阅 |
| FR-WEBHOOK-003 | Epic 10 | Webhook 投递与重试 |
| FR-WEBHOOK-004 | Epic 10 | Webhook 投递日志 |
| FR-WEBHOOK-005 | Epic 10 | Webhook 签名验证 |
| FR-WEBHOOK-006 | Epic 10 | 自定义事件过滤 |
| FR-I18N-001 | Epic 10 | 语言偏好设置 |
| FR-I18N-002 | Epic 10 | Skill 定义多语言 |
| FR-I18N-003 | Epic 10 | API 错误码多语言 |
| FR-I18N-004 | Epic 10 | 生成文件多语言 |
| FR-I18N-005 | Epic 10 | 消息通知多语言 |
| FR-I18N-006 | Epic 10 | 运营商管理多语言内容 |
| FR-SEC2-001 | Epic 10 | 多因素认证（MFA） |
| FR-SEC2-002 | Epic 10 | 数据脱敏 |
| FR-SEC2-003 | Epic 10 | 操作撤销 |
| FR-SEC2-004 | Epic 10 | 批量操作 API |
| FR-ASSIST-001 | Epic 10 | 统一待办聚合 API |
| FR-ASSIST-002 | Epic 10 | 流程指引查询 |
| FR-ASSIST-004 | Epic 10 | 员工快捷操作 Skill |
| FR-ASSIST-005 | Epic 10 | 一键生成工作报告 Skill |
| FR-CLI-001 | Epic 10 | ao-cli init 初始化命令 |
| FR-CLI-002 | Epic 10 | 下载企业专属 Skill 定义 |
| FR-CLI-003 | Epic 10 | 生成 CLAUDE.md |
| FR-CLI-004 | Epic 10 | 生成 agent.md |
| FR-CLI-005 | Epic 10 | ao-cli init --update |
| FR-CLI-006 | Epic 10 | CLAUDE.md/agent.md 运营商客制化 |
| FR-CLI-007 | Epic 10 | 生成 README.md 使用指南 |
| FR-CLI-008 | Epic 10 | README.md 服务端模板渲染 |
| FR-CLI-009 | Epic 10 | CLI 操作日志记录 |
| FR-CLI-010 | Epic 10 | CLI 操作日志按日期归档 |
| FR-DEPLOY-001 | Epic 10 | 跨平台 Docker Compose 部署 |
| FR-DEPLOY-002 | Epic 10 | 原生二进制部署方案 |
| FR-DEPLOY-003 | Epic 10 | 指定端口部署 |
| FR-DEPLOY-004 | Epic 10 | 指定数据目录 |
| FR-DEPLOY-005 | Epic 10 | ao-cli deploy 部署引导 |
| FR-DEPLOY-006 | Epic 10 | TLS 自签名证书部署 |
| FR-DEPLOY-007 | Epic 10 | 私有化部署在线升级 |
| FR-DEPLOY-008 | Epic 10 | 私有化部署健康检查 API |

## Epic List

### Epic 1: 平台基础与认证授权
运营商和企业用户可以通过 CLI/API 完成认证登录，系统具备完整的权限控制和多租户隔离能力。这是所有后续 Epic 的基石。
**FRs covered:** FR-AUTH-001~003, FR-AUTH-005~008, FR-AUTH-010~017
**NFRs covered:** NFR-PERF-001~003, NFR-SEC-001~005, NFR-REL-001~005, NFR-OBS-001~003
**Dependencies:** 无

### Epic 2: 组织架构与多企业管理
运营商和企业管理员可以构建完整的组织架构（集团→企业→部门→员工），支持跨企业权限和多企业视角切换。
**FRs covered:** FR-ORG-001~009, FR-ORG-011~013, FR-GROUP-001~008, FR-AUTH-004, FR-AUTH-009
**NFRs covered:** NFR-SEC-003~004
**Dependencies:** Epic 1

### Epic 3: HRM 员工管理
企业管理员可以管理员工全生命周期（入职、调岗、离职），员工可以自助查看个人信息。
**FRs covered:** FR-HRM-001~008, FR-ORG-010, FR-ASSIST-003
**NFRs covered:** NFR-SEC-004
**Dependencies:** Epic 2

### Epic 4: CRM 客户关系管理
销售团队可以管理客户档案、联系人、商机，Agent 可以通过全景视图 API 生成客户画像。
**FRs covered:** FR-CRM-001~013
**NFRs covered:** NFR-SEC-004
**Dependencies:** Epic 2

### Epic 5: 进销存管理
企业可以管理物料/供应商/仓库/采购/销售出库/调拨/领用/盘库的完整进销存链路。
**FRs covered:** FR-IMS-001~027
**NFRs covered:** NFR-REL-004(事务一致性), NFR-PERF-001
**Dependencies:** Epic 2

### Epic 6: 合同、销售与售后管理
企业可以管理合同全生命周期、销售订单流程和售后工单处理，三个模块天然关联形成业务闭环。
**FRs covered:** FR-CON-001~009, FR-SALES-001~009, FR-SVC-001~012
**NFRs covered:** NFR-SEC-004
**Dependencies:** Epic 4(CRM), Epic 5(出库)

### Epic 7: 财务管理与审批工作流
企业可以管理应收/应付/回款/发票/请款，并通过可配置的审批工作流驱动业务流程。
**FRs covered:** FR-FIN-001~021, FR-WF-001~012
**NFRs covered:** NFR-REL-004(事务一致性), NFR-PERF-001
**Dependencies:** Epic 6(合同/销售), Epic 8(审批流)

### Epic 8: 附件、消息、知识库与 Skill 系统
系统具备文件附件管理、消息轮询通知、知识库 RAG 检索和 Skill 自然语言交互四大基础服务能力。
**FRs covered:** FR-FILE-001~009, FR-MSG-001~007, FR-KB-001~005, FR-SKILL-001~008, FR-KB2-001~006
**NFRs covered:** NFR-PERF-004~005, NFR-SEC-006, NFR-OBS-001
**Dependencies:** Epic 1(认证)

### Epic 9: 运营平台与商业闭环
运营商可以管理企业生命周期、计费订阅、客户成功健康度，并通过客制化服务 Skill 为企业提供配置服务。
**FRs covered:** FR-OP-001~007, FR-BILL-001~010, FR-CS-001~005, FR-OPSVC-001~011, FR-CUST-001~006
**NFRs covered:** NFR-REL-004, NFR-SEC-004
**Dependencies:** Epic 2(企业管理), Epic 8(Skill)

### Epic 10: 数据智能与私有化部署
提供业务统计分析、经营者数据体系、审计增强、数据导入导出、Webhook、多语言支持，以及私有化部署能力。
**FRs covered:** FR-REPORT-001~008, FR-OWNER-001~006, FR-AUDIT-001~006, FR-IMPORT-001~006, FR-WEBHOOK-001~006, FR-I18N-001~006, FR-SEC2-001~004, FR-ASSIST-001~002, FR-ASSIST-004~005, FR-CLI-001~008, FR-DEPLOY-001~008
**NFRs covered:** NFR-DEP-001~008, NFR-EXT-001~003, NFR-INT-001
**Dependencies:** 所有前置 Epic

---

## Epic 1: 平台基础与认证授权

运营商和企业用户可以通过 CLI/API 完成认证登录，系统具备完整的权限控制和多租户隔离能力。这是所有后续 Epic 的基石。

### Story 1.1: Go API 项目初始化

As a 开发者,
I want 创建一个可运行的 Go API 项目脚手架（Go + Gin + GORM + PostgreSQL）,
So that 后续所有业务模块可以在标准化的项目结构上开发。

**Acceptance Criteria:**

**Given** 开发环境已安装 Go 1.21+
**When** 执行 `go run cmd/server/main.go`
**Then** API 服务启动并监听配置端口（默认 8080）
**And** 项目结构遵循 api/cmd/server、api/internal/handler/service/repository/model、api/pkg 分层
**And** go mod init github.com/ai-office/api 已完成
**And** Gin 框架和 GORM 已引入

**Requirements:** FR-AUTH-011, NFR-EXT-001

### Story 1.2: CLI 项目初始化（Cobra）

As a 开发者,
I want 创建一个可运行的 CLI 项目脚手架（Go + Cobra）,
So that Agent 可以通过 CLI 调用后端 API。

**Acceptance Criteria:**

**Given** 开发环境已安装 Go 1.21+
**When** 执行 `go run main.go`
**Then** CLI 工具启动，显示帮助信息
**And** 项目结构遵循 cli/cmd、cli/internal/skill、cli/internal/poller 分层
**And** go mod init github.com/ai-office/cli 已完成
**And** Cobra 框架已引入

**Requirements:** FR-AUTH-011, NFR-INT-002

### Story 1.3: Docker Compose 部署配置

As a 运维人员,
I want 通过 Docker Compose 一键启动 PostgreSQL + Redis + API 服务,
So that 开发和部署环境可以快速搭建。

**Acceptance Criteria:**

**Given** Docker 和 Docker Compose 已安装
**When** 执行 `docker-compose -f deploy/docker-compose/docker-compose.yml up -d`
**Then** PostgreSQL 15+、Redis 7、API 服务容器全部启动
**And** API 服务可以连接 PostgreSQL 和 Redis
**And** .env.example 包含所有必要环境变量模板

**Requirements:** FR-DEPLOY-001, NFR-DEP-001, NFR-DEP-003

### Story 1.4: 数据库连接与多租户 Schema 管理

As a 系统管理员,
I want 系统能够自动管理 PostgreSQL Schema 实现多租户数据隔离,
So that 不同企业的数据完全隔离，互不可见。

**Acceptance Criteria:**

**Given** PostgreSQL 服务已启动
**When** 创建新企业时
**Then** 系统自动创建该企业专属的 PostgreSQL Schema（如 `tenant_{uuid}`）
**And** Schema 包含所有业务表的初始结构
**And** Schema 创建失败时返回明确错误码

**Given** API 请求携带企业上下文
**When** 执行数据库查询
**Then** 所有 SQL 自动路由到对应企业的 Schema
**And** 任何查询无法跨越企业 Schema 边界

**Requirements:** FR-AUTH-012, NFR-SEC-003

### Story 1.5: 统一响应格式与结构化错误码体系

As a Agent 开发者,
I want 所有 API 返回统一格式的响应和结构化错误码,
So that Agent 可以理解错误并自动恢复。

**Acceptance Criteria:**

**Given** 任何 API 请求
**When** 请求成功
**Then** 返回 `{ "data": ..., "meta": { "page": ..., "page_size": ..., "total": ... } }` 格式

**Given** 任何 API 请求
**When** 请求失败
**Then** 返回 `{ "error": { "code": "MODULE_TYPE_SEQ", "message": "人类可读描述", "details": [...] } }` 格式
**And** 错误码格式为 `{模块}_{错误类型}_{序号}`（如 AUTH_TOKEN_EXPIRED）
**And** Agent 可根据 error.code 程序化处理错误

**Requirements:** FR-AUTH-010, NFR-INT-001

### Story 1.6: OAuth 2.0 认证（登录/刷新/登出）

As a 用户,
I want 通过 OAuth 2.0 流程登录系统、刷新令牌和登出,
So that 我可以安全地访问系统 API。

**Acceptance Criteria:**

**Given** 用户已注册并拥有 client_id 和 client_secret
**When** POST /api/v1/auth/login 携带正确的凭证
**Then** 返回 Access Token（JWT，1小时过期）和 Refresh Token（30天过期）
**And** Access Token 包含 user_id、enterprise_id、role 等声明

**Given** 用户持有有效的 Refresh Token
**When** POST /api/v1/auth/refresh
**Then** 返回新的 Access Token 和新的 Refresh Token
**And** 旧 Refresh Token 失效

**Given** 用户已登录
**When** POST /api/v1/auth/logout
**Then** 当前 Access Token 和 Refresh Token 均失效
**And** 后续使用该 Token 的请求返回 401

**Requirements:** FR-AUTH-001, FR-AUTH-002, NFR-SEC-001, NFR-INT-003

### Story 1.7: JWT 认证中间件与 RBAC 权限控制

As a 系统开发者,
I want 所有 API 请求经过 JWT 认证和 RBAC 权限验证,
So that 无权限的请求被拦截并返回 403。

**Acceptance Criteria:**

**Given** API 请求未携带 Authorization 头
**When** 访问受保护的 API 端点
**Then** 返回 401 Unauthorized

**Given** API 请求携带有效的 JWT Token
**When** Token 中的角色无权访问该端点
**Then** 返回 403 Forbidden，错误码 AUTH_PERMISSION_DENIED

**Given** 系统定义了 5 种角色：Operator、Owner、Admin、Manager、Employee
**When** 为角色分配 API 权限
**Then** 各角色只能访问其权限范围内的 API

**Requirements:** FR-AUTH-003, FR-AUTH-005, NFR-SEC-004

### Story 1.8: 审计日志（基础操作记录）

As a 管理员,
I want 系统自动记录所有业务操作的审计日志,
So that 我可以追溯谁在什么时间做了什么操作。

**Acceptance Criteria:**

**Given** 用户执行任何业务操作（创建/修改/删除）
**When** 操作完成
**Then** 系统自动记录操作者 ID、操作时间、操作类型、目标实体、变更内容

**Given** 管理员查询审计日志
**When** 按时间范围、用户、操作类型筛选
**Then** 返回匹配的日志列表，支持分页

**Requirements:** FR-AUTH-006, FR-AUTH-007, NFR-REL-005

### Story 1.9: 自动定时备份

As a 管理员,
I want 配置自动定时数据库备份,
So that 数据可以在故障时恢复。

**Acceptance Criteria:**

**Given** 管理员配置了备份策略（每日备份时间）
**When** 到达备份时间
**Then** 系统自动执行 pg_dump 备份指定企业 Schema
**And** 备份文件存储在配置的目录

**Given** 管理员触发手动恢复
**When** 选择备份文件并确认
**Then** 系统恢复该企业 Schema 到备份时状态
**And** 不影响其他企业数据

**Requirements:** FR-AUTH-008, FR-AUTH-013, NFR-REL-002, NFR-REL-003

### Story 1.10: API 配额管理与功能开关

As a 运营商,
I want 管理企业的 API 调用配额和功能模块开关,
So that 可以防止滥用并控制企业可用功能。

**Acceptance Criteria:**

**Given** 运营商为企业配置了日/月 API 配额
**When** 企业 API 调用量达到配额限制
**Then** 返回 429 Too Many Requests，错误码 AUTH_QUOTA_EXCEEDED
**And** 配额按周期自动重置

**Given** 运营商关闭了某企业的某个功能模块
**When** 该企业的用户访问该模块的 API
**Then** 返回 403，错误码 AUTH_FEATURE_DISABLED

**Requirements:** FR-AUTH-015, FR-AUTH-016

### Story 1.11: Rate Limiting 中间件

As a 系统开发者,
I want 实现 API 请求频率限制,
So that 单个企业或 IP 不会压垮系统。

**Acceptance Criteria:**

**Given** 系统配置了 Rate Limit 规则（每企业 1000 QPS，每 IP 100 QPS）
**When** 请求频率超过限制
**Then** 返回 429 Too Many Requests
**And** 响应头包含 X-RateLimit-Limit、X-RateLimit-Remaining、X-RateLimit-Reset

**Requirements:** NFR-PERF-003

### Story 1.12: 可观测性架构（日志/监控/链路追踪）

As a 运维人员,
I want 系统具备结构化日志、Prometheus 指标和 OpenTelemetry 链路追踪,
So that 我可以监控系统健康状态和排查问题。

**Acceptance Criteria:**

**Given** API 服务运行中
**When** 处理请求
**Then** 输出结构化 JSON 日志到 stdout，包含请求 ID、时间、方法、路径、状态码、耗时

**Given** Prometheus 已配置
**When** 访问 /metrics 端点
**Then** 返回 API 请求总数、响应时间分布、错误率等指标

**Given** OpenTelemetry 已配置
**When** 请求跨服务调用
**Then** 链路追踪 ID 在服务间传递，可在 Jaeger 等工具中查看完整调用链

**Requirements:** FR-AUTH-017, NFR-OBS-001, NFR-OBS-002, NFR-OBS-003

### Story 1.13: CLI 多平台构建与后台服务模式

As a 用户,
I want CLI 工具可以在 Windows/macOS/Linux 上运行，并支持开机自启为后台服务,
So that 我可以在不同操作系统上使用 CLI 并持续接收消息。

**Acceptance Criteria:**

**Given** CLI 代码库
**When** 执行交叉编译构建
**Then** 生成 Windows（.exe）、macOS、Linux 三个平台的可执行文件

**Given** CLI 以后台服务模式运行
**When** 系统启动时
**Then** CLI 自动启动并开始轮询消息
**And** 支持 `ao-cli service install/start/stop/uninstall` 命令管理后台服务

**Requirements:** FR-AUTH-011, FR-AUTH-014, NFR-INT-002

---

## Epic 2: 组织架构与多企业管理

运营商和企业管理员可以构建完整的组织架构（集团→企业→部门→员工），支持跨企业权限和多企业视角切换。

### Story 2.1: 集团管理（创建/编辑/删除）

As a 运营商,
I want 创建、编辑和删除集团账号,
So that 可以为拥有多个企业的老板建立集团管理入口。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** POST /api/v1/groups 携带集团名称
**Then** 创建集团记录，返回集团 ID 和名称
**And** 自动创建集团 Owner 用户账号

**Given** 运营商已登录
**When** PUT /api/v1/groups/{group_id} 携带修改字段
**Then** 更新集团信息

**Given** 运营商已登录
**When** DELETE /api/v1/groups/{group_id}
**Then** 软删除集团（集团下无活跃企业时才允许删除）

**Requirements:** FR-ORG-001, FR-GROUP-001

### Story 2.2: 企业管理（创建/编辑/查看）

As a 集团老板或运营商,
I want 创建和管理企业,
So that 可以在企业内搭建组织架构。

**Acceptance Criteria:**

**Given** 集团老板已登录
**When** POST /api/v1/enterprises 携带企业名称、行业等
**Then** 创建企业记录，同时自动创建企业专属 PostgreSQL Schema
**And** 返回企业 ID 和初始管理员账号信息

**Given** 运营商已登录
**When** GET /api/v1/enterprises
**Then** 返回所有企业列表及使用情况

**Given** 企业管理员已登录
**When** PUT /api/v1/enterprises/{enterprise_id} 携带修改字段
**Then** 更新企业基本信息

**Requirements:** FR-ORG-002, FR-GROUP-002, FR-OP-001

### Story 2.3: 部门管理（创建/编辑/删除/树形结构）

As a 企业管理员,
I want 创建、编辑、删除部门并查询组织架构树,
So that 可以建立符合企业实际的组织结构。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/enterprises/{enterprise_id}/departments 携带部门名称、上级部门 ID（可选）
**Then** 创建部门记录，支持多级树形结构

**Given** 企业管理员已登录
**When** PUT /api/v1/departments/{department_id}
**Then** 更新部门信息

**Given** 企业管理员已登录
**When** DELETE /api/v1/departments/{department_id}
**Then** 软删除部门（部门下无员工时才允许删除）

**Given** 任何企业用户已登录
**When** GET /api/v1/enterprises/{enterprise_id}/departments/tree
**Then** 返回树形结构的组织架构

**Requirements:** FR-ORG-003, FR-ORG-009

### Story 2.4: 部门经理设置与权限

As a 企业管理员,
I want 设置部门经理并赋予部门级管理权限,
So that 部门经理可以管理本部门员工和业务。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** PUT /api/v1/departments/{department_id}/manager 指定员工 ID
**Then** 该员工成为部门经理，获得 Manager 角色
**And** 部门经理可以编辑本部门信息

**Given** 部门经理已登录
**When** PUT /api/v1/departments/{department_id}
**Then** 允许修改本部门信息
**And** 禁止修改其他部门信息

**Requirements:** FR-ORG-004, FR-ORG-005

### Story 2.5: 员工档案基础 CRUD

As a 企业管理员,
I want 创建、编辑、删除员工档案,
So that 可以为企业员工建立账号和归属关系。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/enterprises/{enterprise_id}/employees 携带姓名、邮箱、部门 ID
**Then** 创建员工记录，生成登录凭证
**And** 员工必须归属某个部门

**Given** 企业管理员已登录
**When** PUT /api/v1/employees/{employee_id}
**Then** 更新员工信息

**Given** 企业管理员已登录
**When** DELETE /api/v1/employees/{employee_id}
**Then** 软删除员工（标记为离职，保留历史数据）

**Requirements:** FR-ORG-006, FR-ORG-007

### Story 2.6: 员工查询（按角色/姓名模糊搜索）

As a 企业用户,
I want 按角色或姓名模糊搜索员工,
So that 可以快速找到需要联系的同事。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** GET /api/v1/employees?role=manager
**Then** 返回所有 Manager 角色的员工列表

**Given** 企业用户已登录
**When** GET /api/v1/employees?name=张
**Then** 返回姓名包含"张"的员工列表

**Given** 企业用户已登录
**When** GET /api/v1/employees?position=仓库管理员
**Then** 返回岗位为"仓库管理员"的员工列表

**Requirements:** FR-ORG-011, FR-ORG-012

### Story 2.7: 岗位定义与管理

As a 企业管理员,
I want 定义和管理岗位（职位）,
So that 员工档案可以关联岗位，新员工可以通过 Agent 查询岗位职责。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/positions 携带岗位名称、职责描述
**Then** 创建岗位定义

**Given** 企业管理员已登录
**When** GET /api/v1/positions
**Then** 返回所有岗位列表

**Given** 企业管理员已登录
**When** PUT /api/v1/positions/{position_id}
**Then** 更新岗位信息

**Requirements:** FR-ORG-013

### Story 2.8: 老板跨企业视角切换

As a 集团老板,
I want 在不同企业之间切换视角,
So that 可以查看和管理不同企业的数据。

**Acceptance Criteria:**

**Given** 集团老板拥有多个企业
**When** POST /api/v1/auth/switch-enterprise 携带目标企业 ID
**Then** 返回该企业的新 Access Token
**And** 后续 API 请求使用新 Token 访问目标企业数据

**Given** 老板已切换到企业 A
**When** 查询员工列表
**Then** 只返回企业 A 的员工

**Requirements:** FR-ORG-008, FR-GROUP-003

### Story 2.9: 跨企业权限管理

As a 集团老板或企业管理员,
I want 为员工开通跨企业访问权限,
So that 核心员工可以访问多个企业的数据。

**Acceptance Criteria:**

**Given** 集团老板已登录
**When** POST /api/v1/cross-enterprise/permissions 携带员工 ID、目标企业列表、数据范围
**Then** 为该员工开通跨企业权限

**Given** 企业管理员已登录
**When** PUT /api/v1/cross-enterprise/permissions/{permission_id}
**Then** 调整跨企业员工的可访问数据范围

**Given** 拥有跨企业权限的员工已登录
**When** 访问目标企业数据
**Then** 只能访问被授权范围内的数据
**And** 所有操作记录审计日志

**Requirements:** FR-AUTH-004, FR-GROUP-004, FR-GROUP-005, FR-GROUP-006, FR-GROUP-008

### Story 2.10: 精细化权限分配

As a 企业管理员或老板,
I want 自定义员工的权限（精细化到具体操作）,
So that 可以按需授权，而非仅依赖角色粗粒度控制。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/employees/{employee_id}/permissions 携带权限列表
**Then** 为员工设置精细化权限（覆盖或补充角色默认权限）

**Given** 员工拥有精细化权限配置
**When** 访问 API
**Then** 系统优先检查精细化权限，再检查角色权限
**And** 精细化权限可限制到具体模块、具体操作（如"只能查看合同，不能创建"）

**Requirements:** FR-AUTH-009

### Story 2.11: 跨企业经营汇总

As a 集团老板,
I want 查看跨企业的经营汇总数据,
So that 可以一览集团下所有企业的经营状况。

**Acceptance Criteria:**

**Given** 集团老板已登录
**When** GET /api/v1/groups/{group_id}/summary
**Then** 返回集团下所有企业的核心经营指标（员工数、合同数、应收款总额等）
**And** 支持按企业对比

**Requirements:** FR-GROUP-007

---

## Epic 3: HRM 员工管理

企业管理员可以管理员工全生命周期（入职、调岗、离职），员工可以自助查看个人信息。

### Story 3.1: 员工入职（创建档案）

As a 企业管理员,
I want 创建员工档案并记录入职信息,
So that 新员工可以在系统中拥有账号和完整信息。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/employees 携带姓名、邮箱、手机号、部门 ID、岗位 ID、入职日期
**Then** 创建员工档案，自动生成登录凭证
**And** 记录入职日期
**And** 员工状态为"在职"

**Requirements:** FR-HRM-001, FR-ORG-010

### Story 3.2: 员工档案编辑

As a 企业管理员,
I want 编辑员工档案信息,
So that 员工信息变更时可以及时更新。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** PUT /api/v1/employees/{employee_id} 携带修改字段
**Then** 更新员工档案信息
**And** 变更记录写入审计日志

**Requirements:** FR-HRM-002

### Story 3.3: 员工离职

As a 企业管理员,
I want 标记员工离职,
So that 离职员工无法继续访问系统。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/employees/{employee_id}/resign 携带离职日期
**Then** 员工状态变为"离职"，记录离职日期
**And** 该员工的 Access Token 和 Refresh Token 立即失效
**And** 保留所有历史数据

**Requirements:** FR-HRM-003, FR-ORG-010

### Story 3.4: 员工列表与详情查询

As a 企业管理员,
I want 查看所有员工列表和单个员工详情,
So that 可以了解企业人员全貌。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** GET /api/v1/employees?page=1&page_size=20
**Then** 返回员工列表，支持分页、按部门/状态筛选

**Given** 企业管理员已登录
**When** GET /api/v1/employees/{employee_id}
**Then** 返回员工详细信息（含部门、岗位、入职日期、状态）

**Requirements:** FR-HRM-004

### Story 3.5: 员工自助查看个人信息

As a 员工,
I want 查看自己的档案和基本信息,
So that 不需要找管理员就能了解自己的信息。

**Acceptance Criteria:**

**Given** 员工已登录
**When** GET /api/v1/me/profile
**Then** 返回当前员工的档案信息（姓名、部门、岗位、入职日期、联系方式）
**And** 不返回薪资等敏感字段

**Requirements:** FR-HRM-005, FR-ASSIST-003

### Story 3.6: 批量导入员工

As a 企业管理员,
I want 通过 Excel/CSV 批量导入员工,
So that 新企业初始化或大批量入职时不需要逐个创建。

**Acceptance Criteria:**

**Given** 企业管理员上传符合模板的 Excel/CSV 文件
**When** POST /api/v1/employees/import
**Then** 逐行解析并创建员工档案
**And** 返回导入结果（成功数、失败数、失败行明细）

**Given** 导入文件中部分数据格式错误
**When** 执行导入
**Then** 格式正确的行正常导入，错误的行跳过并返回错误原因

**Requirements:** FR-HRM-006

### Story 3.7: 调岗操作

As a 企业管理员,
I want 执行员工调岗（从原部门移到新部门）,
So that 组织调整时可以快速变更员工归属。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/employees/{employee_id}/transfer 携带新部门 ID、新岗位 ID
**Then** 员工从原部门移除，添加到新部门
**And** 记录调岗历史（原部门、新部门、调岗日期）
**And** 如果是部门经理调岗，原部门经理自动清空

**Requirements:** FR-HRM-007

### Story 3.8: 员工销售业绩查询

As a 管理员或部门经理,
I want 按时间范围查询员工的销售业绩,
So that 可以评估员工绩效。

**Acceptance Criteria:**

**Given** 管理员或部门经理已登录
**When** GET /api/v1/employees/{employee_id}/sales-performance?start_date=2026-01-01&end_date=2026-06-30
**Then** 返回该员工指定时间范围内的销售业绩（销售额、订单数、回款额）
**And** 部门经理只能查询本部门员工

**Requirements:** FR-HRM-008

---

## Epic 4: CRM 客户关系管理

销售团队可以管理客户档案、联系人、商机，Agent 可以通过全景视图 API 生成客户画像。

### Story 4.1: 客户档案 CRUD

As a 销售人员,
I want 创建、编辑、删除客户档案,
So that 可以管理企业的客户资源。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/customers 携带公司名称、行业分类、统一社会信用代码、地址、备注
**Then** 创建客户档案，客户以公司名称为企业内唯一标识
**And** 同一企业内不可创建公司名称重复的客户

**Given** 销售人员已登录
**When** PUT /api/v1/customers/{customer_id} 携带修改字段
**Then** 更新客户信息

**Given** 销售人员已登录
**When** DELETE /api/v1/customers/{customer_id}
**Then** 软删除客户（有关联合同/订单时禁止删除）

**Requirements:** FR-CRM-001, FR-CRM-002

### Story 4.2: 客户分级管理

As a 企业管理员,
I want 对客户进行分级（VIP/重要/普通/潜在）并自定义分级规则,
So that 可以差异化服务不同级别的客户。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/customer-levels 携带分级名称、规则（如年采购额 > 100万自动升级为 VIP）
**Then** 创建自定义客户分级

**Given** 系统配置了自动升级规则
**When** 客户年采购额达到升级阈值
**Then** 系统自动将客户升级到对应级别

**Given** 销售人员已登录
**When** PUT /api/v1/customers/{customer_id}/level 携带分级 ID
**Then** 手动调整客户分级

**Requirements:** FR-CRM-003

### Story 4.3: 客户自由标签

As a 销售人员,
I want 为客户添加多个自定义标签,
So that 可以灵活分类和筛选客户。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/customers/{customer_id}/tags 携带标签列表
**Then** 为客户添加标签（如"战略合作"、"价格敏感"、"续约客户"）

**Given** 销售人员已登录
**When** GET /api/v1/customers?tags=战略合作
**Then** 返回包含"战略合作"标签的客户列表

**Requirements:** FR-CRM-004

### Story 4.4: 客户全景视图 API

As a Agent,
I want 通过一个 API 获取客户的全景数据,
So that 可以为用户生成完整的客户画像。

**Acceptance Criteria:**

**Given** 用户已登录
**When** GET /api/v1/customers/{customer_id}/panorama
**Then** 一次性返回该客户的所有关联数据：联系人列表、商机列表、关联合同列表、关联售后工单列表、往来款汇总

**Requirements:** FR-CRM-005

### Story 4.5: 客户关联查询（合同/售后/往来款）

As a 销售人员,
I want 查询客户关联的合同、售后工单和往来款,
So that 可以全面了解客户业务状况。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** GET /api/v1/customers/{customer_id}/contracts?status=active
**Then** 返回该客户的合同列表，支持按状态筛选

**Given** 销售人员已登录
**When** GET /api/v1/customers/{customer_id}/service-orders?status=open
**Then** 返回该客户的售后工单列表，支持按状态筛选

**Given** 销售人员已登录
**When** GET /api/v1/customers/{customer_id}/financial-summary
**Then** 返回往来款汇总（应收总额、已回款总额、未回款总额、逾期金额）

**Requirements:** FR-CRM-006, FR-CRM-007, FR-CRM-008

### Story 4.6: 联系人 CRUD

As a 销售人员,
I want 管理客户下的联系人,
So that 可以记录和维护客户对接人信息。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/customers/{customer_id}/contacts 携带姓名、职位、手机号、邮箱、角色标记（决策人/影响人/日常对接人）、是否首要联系人
**Then** 创建联系人，必须归属某个客户

**Given** 销售人员已登录
**When** PUT /api/v1/contacts/{contact_id}
**Then** 更新联系人信息

**Given** 销售人员已登录
**When** DELETE /api/v1/contacts/{contact_id}
**Then** 软删除联系人

**Requirements:** FR-CRM-009, FR-CRM-010

### Story 4.7: 联系人按角色筛选查询

As a 销售人员,
I want 按客户和角色标记筛选联系人,
So that 可以快速找到关键决策人。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** GET /api/v1/customers/{customer_id}/contacts?role=decision_maker
**Then** 返回该客户下角色为"决策人"的联系人列表

**Requirements:** FR-CRM-011

### Story 4.8: 商机 CRUD

As a 销售人员,
I want 创建和管理商机,
So that 可以跟踪潜在的销售机会。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/opportunities 携带商机名称、客户 ID、预计金额、状态
**Then** 创建商机，必须归属某个客户

**Given** 销售人员已登录
**When** PUT /api/v1/opportunities/{opportunity_id}
**Then** 更新商机信息

**Given** 销售人员已登录
**When** PATCH /api/v1/opportunities/{opportunity_id}/status 携带新状态
**Then** 更新商机状态（跟进中→报价中→成交/失败）

**Requirements:** FR-CRM-012, FR-CRM-013

---

## Epic 5: 进销存管理

企业可以管理物料/供应商/仓库/采购/销售出库/调拨/领用/盘库的完整进销存链路。

### Story 5.1: 物料（SKU）管理

As a 仓库管理员,
I want 创建、编辑、删除物料（SKU）,
So that 可以管理企业的所有物料品类。

**Acceptance Criteria:**

**Given** 仓库管理员已登录
**When** POST /api/v1/materials 携带名称、类型（成品/原材料/零部件/办公用品/耗材）、规格参数（JSON）、单位、单价
**Then** 创建物料 SKU

**Given** 仓库管理员已登录
**When** PUT /api/v1/materials/{material_id}
**Then** 更新物料信息

**Given** 仓库管理员已登录
**When** GET /api/v1/materials?type=finished_product
**Then** 返回指定类型的物料列表

**Requirements:** FR-IMS-001, FR-IMS-002

### Story 5.2: 供应商管理

As a 采购人员,
I want 创建、编辑、删除供应商,
So that 可以管理物料采购来源。

**Acceptance Criteria:**

**Given** 采购人员已登录
**When** POST /api/v1/suppliers 携带名称、联系人、联系方式、地址
**Then** 创建供应商

**Given** 采购人员已登录
**When** PUT /api/v1/suppliers/{supplier_id}
**Then** 更新供应商信息

**Given** 采购人员已登录
**When** DELETE /api/v1/suppliers/{supplier_id}
**Then** 软删除供应商（有关联采购订单时禁止删除）

**Requirements:** FR-IMS-003, FR-IMS-004

### Story 5.3: 多仓库管理

As a 仓库管理员,
I want 创建、编辑、停用仓库,
So that 可以管理多个物理仓库。

**Acceptance Criteria:**

**Given** 仓库管理员已登录
**When** POST /api/v1/warehouses 携带名称、编码、地址、管理员 ID
**Then** 创建仓库

**Given** 仓库管理员已登录
**When** PATCH /api/v1/warehouses/{warehouse_id}/status 携带 inactive
**Then** 停用仓库（仓库下有库存时禁止停用）

**Requirements:** FR-IMS-015

### Story 5.4: 按仓库维度的库存查询与预警

As a 仓库管理员,
I want 按仓库维度查询库存并设置安全库存预警,
So that 可以及时发现库存不足。

**Acceptance Criteria:**

**Given** 仓库管理员已登录
**When** GET /api/v1/warehouses/{warehouse_id}/inventory
**Then** 返回该仓库所有物料的库存数量、安全库存、在途数量

**Given** 仓库管理员已登录
**When** GET /api/v1/materials/{material_id}/inventory
**Then** 返回该物料在各仓库的库存分布

**Given** 某物料在某仓库的数量低于安全库存
**When** 触发出库操作使库存低于阈值
**Then** 系统生成库存预警（通过消息系统推送）

**Requirements:** FR-IMS-011, FR-IMS-012, FR-IMS-016, FR-IMS-023

### Story 5.5: 采购订单与入库

As a 采购人员,
I want 创建采购订单、审批、入库,
So that 可以完成采购流程并增加库存。

**Acceptance Criteria:**

**Given** 采购人员已登录
**When** POST /api/v1/purchase-orders 携带供应商 ID、明细（物料 SKU、数量、单价）
**Then** 创建采购订单（草稿状态）

**Given** 采购订单审批通过
**When** POST /api/v1/purchase-orders/{order_id}/stock-in 携带入库仓库 ID、实收数量
**Then** 自动增加对应仓库的库存
**And** 生成入库流水记录（类型：purchase_in，含批次号、效期、序列号、规格参数）
**And** 在数据库事务中保证库存和流水的一致性

**Requirements:** FR-IMS-005, FR-IMS-008, FR-IMS-019, FR-IMS-020

### Story 5.6: 采购质检流程

As a 质检员,
I want 采购入库前触发质检流程,
So that 不合格物料不会进入库存。

**Acceptance Criteria:**

**Given** 采购订单配置了质检流程
**When** 货物到达后
**Then** 系统生成质检任务

**Given** 质检员执行质检
**When** 质检结果为合格
**Then** 允许正式入库

**Given** 质检员执行质检
**When** 质检结果为不合格
**Then** 触发退换货流程，禁止入库

**Requirements:** FR-IMS-006, FR-IMS-007

### Story 5.7: 销售出库与库存扣减

As a 销售人员,
I want 创建销售订单并执行出库,
So that 可以完成销售发货流程。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/sales-orders 携带客户 ID、明细（物料 SKU、数量、单价）
**Then** 创建销售订单

**Given** 销售订单确认出库
**When** POST /api/v1/sales-orders/{order_id}/stock-out 携带出库仓库 ID
**Then** 自动扣减对应仓库的库存
**And** 生成出库流水记录（类型：sale_out）
**And** 库存不足时禁止出库，返回错误码 IMS_INSUFFICIENT_STOCK

**Requirements:** FR-IMS-009, FR-IMS-010, FR-IMS-019, FR-IMS-020

### Story 5.8: 仓库间调拨

As a 仓库管理员,
I want 在仓库之间调拨物料,
So that 可以平衡各仓库库存。

**Acceptance Criteria:**

**Given** 仓库管理员已登录
**When** POST /api/v1/stock-transfers 携带源仓库、目标仓库、物料明细
**Then** 创建调拨单（草稿状态）

**Given** 调拨单审批通过
**When** 源仓库出库
**Then** 源仓库库存扣减，生成出库流水（transfer_out）

**Given** 调拨货物到达目标仓库
**When** 填写实收数量
**Then** 目标仓库库存增加，生成入库流水（transfer_in）
**And** 实收数量与调拨数量不一致时记录差异

**Requirements:** FR-IMS-017, FR-IMS-018, FR-IMS-019

### Story 5.9: 物料领用申请

As a 员工,
I want 申请领用物料,
So that 可以领用办公或业务所需物料。

**Acceptance Criteria:**

**Given** 员工已登录
**When** POST /api/v1/requisitions 携带物料明细、用途、申请仓库
**Then** 创建领用申请（草稿状态）

**Given** 领用申请审批通过
**When** 仓库确认出库并填写实发数量
**Then** 扣减对应仓库库存，生成出库流水（requisition_out）
**And** 实发数量可少于申请数量

**Requirements:** FR-IMS-021, FR-IMS-022, FR-IMS-019

### Story 5.10: 库存盘点（盘库）

As a 仓库管理员,
I want 执行库存盘点,
So that 可以核对系统库存与实际库存。

**Acceptance Criteria:**

**Given** 仓库管理员已登录
**When** POST /api/v1/inventory-checks 携带仓库 ID、范围（全盘/抽盘）、物料范围
**Then** 创建盘点任务

**Given** 盘点人录入实盘数量
**When** 提交盘点结果
**Then** 系统自动生成盘盈盘亏明细（实盘 vs 系统数量、差异数量、差异金额）
**And** 支持按批次号/效期维度分别盘点

**Given** 盘点结果审批通过
**When** 系统执行调整
**Then** 自动生成盘点调整出入库流水（type=adjustment），更新系统库存数量

**Requirements:** FR-IMS-024, FR-IMS-025, FR-IMS-026, FR-IMS-027, FR-IMS-019

### Story 5.11: 物料报价管理

As a 销售人员,
I want 查询物料历史报价并设置差异化报价策略,
So that 可以为不同客户级别制定不同价格。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** GET /api/v1/materials/{material_id}/price-history
**Then** 返回该物料的历史报价记录

**Given** 销售管理员已登录
**When** POST /api/v1/materials/{material_id}/pricing-strategies 携带客户级别、对应单价
**Then** 配置差异化报价策略

**Requirements:** FR-IMS-013, FR-IMS-014

### Story 5.12: 统一出入库流水查询

As a 企业用户,
I want 查询统一的出入库流水,
So that 可以追溯所有库存变动。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** GET /api/v1/inventory-transactions?type=purchase_in&warehouse_id={id}&start_date=2026-01-01
**Then** 返回匹配的出入库流水列表，支持按类型、仓库、时间、物料筛选

**Given** 企业用户已登录
**When** GET /api/v1/inventory-transactions/{transaction_id}
**Then** 返回流水详情（含批次号、效期、序列号、规格参数、源单据类型）

**Requirements:** FR-IMS-019, FR-IMS-020

## Epic 6: 合同、销售与售后管理

**目标：** 企业可以管理合同全生命周期、销售订单流程和售后工单处理，三个模块天然关联形成业务闭环。

**FRs covered:** FR-CON-001~009, FR-SALES-001~009, FR-SVC-001~012
**NFRs covered:** NFR-SEC-004
**Dependencies:** Epic 1, Epic 2, Epic 5

### Story 6.1: 合同 CRUD 与状态机

As a 销售人员,
I want 创建、编辑、删除合同并管理合同状态流转,
So that 可以管理合同全生命周期。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/contracts 携带合同编号、客户 ID、签订日期、有效期、金额
**Then** 创建合同（草稿状态）

**Given** 合同处于草稿状态
**When** PATCH /api/v1/contracts/{contract_id}/status 携带目标状态
**Then** 状态按规则流转：草稿→审批中→已生效→已履行→已终止
**And** 非法状态流转返回错误码 CON_INVALID_STATUS_TRANSITION

**Given** 销售人员已登录
**When** DELETE /api/v1/contracts/{contract_id}
**Then** 仅草稿状态可删除（软删除）

**Requirements:** FR-CON-001, FR-CON-002, FR-CON-006

### Story 6.2: 合同关联业务单据

As a 销售人员,
I want 合同关联客户、销售订单、采购订单和出库记录,
So that 可以追踪合同相关的所有业务数据。

**Acceptance Criteria:**

**Given** 合同已创建
**When** POST /api/v1/contracts/{contract_id}/sales-orders 携带销售订单 ID
**Then** 合同关联一个或多个销售订单

**Given** 合同已创建
**When** POST /api/v1/contracts/{contract_id}/purchase-orders 携带采购订单 ID
**Then** 合同关联采购订单（客户付款后关联）

**Given** 合同已创建
**When** POST /api/v1/contracts/{contract_id}/delivery-records 携带出库记录 ID
**Then** 合同绑定出库记录

**Requirements:** FR-CON-003, FR-CON-007, FR-CON-008

### Story 6.3: 合同附件与审批流

As a 销售人员,
I want 上传合同附件（扫描件、补充协议）并提交审批,
So that 合同可以走审批流程。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/contracts/{contract_id}/attachments 上传文件
**Then** 附件存储到 /storage/{enterprise_id}/contracts/{contract_id}/attachments/
**And** 附件关联到合同

**Given** 合同处于草稿状态
**When** POST /api/v1/contracts/{contract_id}/submit-approval
**Then** 合同状态变为"审批中"，触发审批工作流
**And** 审批通过后自动变为"已生效"

**Requirements:** FR-CON-004, FR-CON-005

### Story 6.4: Agent 自然语言修改合同字段

As a Agent,
I want 通过自然语言修改合同字段,
So that 用户可以说"把合同金额改成 50 万"来修改合同。

**Acceptance Criteria:**

**Given** 用户通过 Agent 请求修改合同
**When** Agent 解析自然语言为结构化字段修改请求
**Then** 调用 PATCH /api/v1/contracts/{contract_id} 更新指定字段
**And** 只允许修改草稿和审批中状态的合同
**And** 修改记录写入审计日志

**Requirements:** FR-CON-009

### Story 6.5: 销售订单 CRUD 与状态机

As a 销售人员,
I want 创建、编辑、删除销售订单并管理状态流转,
So that 可以管理销售流程。

**Acceptance Criteria:**

**Given** 销售人员已登录
**When** POST /api/v1/sales-orders 携带订单编号、客户 ID、产品明细（物料 SKU、数量、单价、金额）
**Then** 创建销售订单（草稿状态），必须关联客户

**Given** 销售订单状态流转
**When** 提交审批→审批通过→确认→出库→完成
**Then** 状态按规则流转：草稿→审批中→已确认→已出库→已完成

**Given** 销售人员已登录
**When** DELETE /api/v1/sales-orders/{order_id}
**Then** 仅草稿状态可删除（软删除）

**Requirements:** FR-SALES-001, FR-SALES-002, FR-SALES-003, FR-SALES-009

### Story 6.6: 销售订单关联合同与出库

As a 销售人员,
I want 销售订单绑定合同和出库记录,
So that 可以追踪订单关联的合同和发货情况。

**Acceptance Criteria:**

**Given** 销售订单已创建
**When** POST /api/v1/sales-orders/{order_id}/contract 携带合同 ID
**Then** 销售订单绑定合同

**Given** 销售订单已确认
**When** POST /api/v1/sales-orders/{order_id}/delivery 携带产品、配件、仪器、数量
**Then** 创建出库记录，出库配件/产品必须与关联合同一致

**Given** 销售订单关联合同
**When** 提交审批
**Then** 销售订单审批流与合同审批流可独立运行

**Requirements:** FR-SALES-004, FR-SALES-005, FR-SALES-006, FR-SALES-007, FR-SALES-008

### Story 6.7: 售后工单 CRUD 与状态机

As a 售后人员,
I want 创建、编辑、删除售后工单并管理状态流转,
So that 可以管理售后服务流程。

**Acceptance Criteria:**

**Given** 售后人员已登录
**When** POST /api/v1/service-orders 携带客户 ID、设备信息、问题描述
**Then** 创建售后工单（创建状态）

**Given** 工单状态流转
**When** 按流程推进
**Then** 状态流转：创建→报价中→确认→维修中→待签字→已完成

**Given** 售后人员已登录
**When** DELETE /api/v1/service-orders/{order_id}
**Then** 仅创建状态可删除（软删除）

**Requirements:** FR-SVC-001, FR-SVC-002, FR-SVC-011

### Story 6.8: 收费工单报价流程

As a 售后人员,
I want 为收费工单上传报价单并等待客户确认,
So that 收费售后需要客户确认后才进入维修。

**Acceptance Criteria:**

**Given** 工单类型为"收费"
**When** POST /api/v1/service-orders/{order_id}/quote 上传报价单附件
**Then** 报价单保存为工单附件，工单状态变为"报价中"

**Given** 客户确认报价
**When** POST /api/v1/service-orders/{order_id}/confirm-quote
**Then** 工单状态变为"确认"，可进入维修

**Requirements:** FR-SVC-003, FR-SVC-004, FR-SVC-005, FR-SVC-006

### Story 6.9: 维修工单与签字确认

As a 售后人员,
I want 生成维修工单并完成客户签字确认,
So that 维修过程和结果有据可查。

**Acceptance Criteria:**

**Given** 工单状态为"确认"或"维修中"
**When** POST /api/v1/service-orders/{order_id}/repair-order 携带故障点、维修内容
**Then** 生成维修工单

**Given** 维修完成
**When** POST /api/v1/service-orders/{order_id}/sign-off 上传客户签字确认件
**Then** 工单状态变为"待签字"，签字确认件作为附件保存

**Given** 签字确认完成
**When** POST /api/v1/service-orders/{order_id}/complete
**Then** 工单状态变为"已完成"

**Requirements:** FR-SVC-007, FR-SVC-008, FR-SVC-009, FR-SVC-010

### Story 6.10: 售后工单附件管理

As a 售后人员,
I want 上传工单相关附件（问题图片、处理凭证等）,
So that 售后过程有完整的证据链。

**Acceptance Criteria:**

**Given** 售后人员已登录
**When** POST /api/v1/service-orders/{order_id}/attachments 上传文件
**Then** 附件存储到 /storage/{enterprise_id}/service-orders/{order_id}/
**And** 支持图片、PDF 等文件类型

**Requirements:** FR-SVC-012

## Epic 7: 财务管理与审批工作流

**目标：** 企业可以管理收付款、发票、费用报销，以及通过审批工作流控制关键业务节点的合规性。

**FRs covered:** FR-FIN-001~021, FR-WF-001~012
**NFRs covered:** NFR-SEC-004
**Dependencies:** Epic 1, Epic 6

### Story 7.1: 收款记录管理

As a 财务人员,
I want 创建和管理收款记录,
So that 可以追踪客户付款情况。

**Acceptance Criteria:**

**Given** 财务人员已登录
**When** POST /api/v1/payment-receivables 携带客户 ID、合同 ID、金额、收款日期、收款方式
**Then** 创建收款记录

**Given** 财务人员已登录
**When** GET /api/v1/payment-receivables?contract_id={id}&status=pending
**Then** 返回匹配的收款记录列表，支持按合同、客户、状态筛选

**Given** 收款记录已创建
**When** PATCH /api/v1/payment-receivables/{id}/confirm
**Then** 确认收款，更新合同已收金额

**Requirements:** FR-FIN-001, FR-FIN-002, FR-FIN-003

### Story 7.2: 付款记录管理

As a 财务人员,
I want 创建和管理付款记录,
So that 可以追踪向供应商的付款情况。

**Acceptance Criteria:**

**Given** 财务人员已登录
**When** POST /api/v1/payment-payables 携带供应商 ID、采购订单 ID、金额、付款日期、付款方式
**Then** 创建付款记录

**Given** 财务人员已登录
**When** GET /api/v1/payment-payables?purchase_order_id={id}&status=pending
**Then** 返回匹配的付款记录列表

**Given** 付款记录已创建
**When** PATCH /api/v1/payment-payables/{id}/confirm
**Then** 确认付款，更新采购订单已付金额

**Requirements:** FR-FIN-004, FR-FIN-005, FR-FIN-006

### Story 7.3: 发票管理

As a 财务人员,
I want 开具和管理发票,
So that 可以管理开票和收票。

**Acceptance Criteria:**

**Given** 财务人员已登录
**When** POST /api/v1/invoices 携带客户 ID、合同 ID、发票类型（增值税普通/专用）、金额、税额
**Then** 创建发票记录

**Given** 发票已创建
**When** PATCH /api/v1/invoices/{id}/status 携带目标状态
**Then** 状态流转：待开票→已开票→已寄出→已签收

**Given** 财务人员已登录
**When** POST /api/v1/invoices/receipt 上传收到的供应商发票
**Then** 创建收票记录

**Requirements:** FR-FIN-007, FR-FIN-008, FR-FIN-009

### Story 7.4: 费用报销管理

As a 员工,
I want 提交费用报销申请,
So that 可以报销业务相关费用。

**Acceptance Criteria:**

**Given** 员工已登录
**When** POST /api/v1/expense-claims 携带费用类型、金额、说明、附件
**Then** 创建报销申请（待审批状态）

**Given** 报销申请已创建
**When** PATCH /api/v1/expense-claims/{id}/status
**Then** 状态流转：待审批→审批中→已批准→已打款→已拒绝

**Given** 部门经理已登录
**When** GET /api/v1/expense-claims?department_id={id}&status=pending
**Then** 查看本部门待审批报销列表

**Requirements:** FR-FIN-010, FR-FIN-011, FR-FIN-012

### Story 7.5: 财务对账与统计

As a 财务人员,
I want 查看财务对账和统计报表,
So that 可以掌握企业财务状况。

**Acceptance Criteria:**

**Given** 财务人员已登录
**When** GET /api/v1/financial-summary?period=2026-Q2
**Then** 返回指定期间收支汇总（收款总额、付款总额、应收余额、应付余额）

**Given** 财务人员已登录
**When** GET /api/v1/financial-reconciliation?contract_id={id}
**Then** 返回合同维度的对账明细（合同金额、已收金额、未收金额、关联发票）

**Given** 企业管理员已登录
**When** GET /api/v1/financial-statistics
**Then** 返回企业财务统计数据（月度收支趋势、费用分类占比）

**Requirements:** FR-FIN-013, FR-FIN-014, FR-FIN-015, FR-FIN-016

### Story 7.6: 财务审批关联

As a 财务人员,
I want 收付款和发票操作关联审批流,
So that 关键财务操作需要审批后才能执行。

**Acceptance Criteria:**

**Given** 收款确认需要审批
**When** PATCH /api/v1/payment-receivables/{id}/confirm
**Then** 触发审批工作流，审批通过后才确认收款

**Given** 付款操作需要审批
**When** PATCH /api/v1/payment-payables/{id}/confirm
**Then** 触发审批工作流，审批通过后才确认付款

**Given** 发票开具需要审批
**When** PATCH /api/v1/invoices/{id}/issue
**Then** 触发审批工作流，审批通过后才开具发票

**Requirements:** FR-FIN-017, FR-FIN-018, FR-FIN-019

### Story 7.7: 审批流程定义与管理

As a 企业管理员,
I want 定义和管理审批流程模板,
So that 不同业务场景可以配置不同的审批规则。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/workflow-definitions 携带名称、触发条件、审批节点列表
**Then** 创建审批流程定义

**Given** 管理员已登录
**When** PUT /api/v1/workflow-definitions/{id}
**Then** 更新审批流程定义（已生效的流程不可修改，需创建新版本）

**Given** 管理员已登录
**When** GET /api/v1/workflow-definitions?type=contract
**Then** 按业务类型查询审批流程定义列表

**Requirements:** FR-WF-001, FR-WF-002, FR-WF-003

### Story 7.8: 审批流程执行与通知

As a 审批人,
I want 接收审批通知并执行审批操作,
So that 可以及时处理待审批事项。

**Acceptance Criteria:**

**Given** 业务单据提交审批
**When** 审批流程被触发
**Then** 当前审批节点对应的审批人收到消息通知

**Given** 审批人已登录
**When** POST /api/v1/workflow-instances/{id}/approve 或 /reject
**Then** 审批通过则流转到下一节点，审批拒绝则退回给提交人

**Given** 审批人已登录
**When** GET /api/v1/workflow-instances/pending
**Then** 返回当前用户待审批的流程实例列表

**Requirements:** FR-WF-004, FR-WF-005, FR-WF-006

### Story 7.9: 多级审批与条件分支

As a 企业管理员,
I want 配置多级审批和条件分支,
So that 不同金额或类型的业务走不同的审批路径。

**Acceptance Criteria:**

**Given** 审批流程定义包含条件分支
**When** 业务单据提交审批
**Then** 根据条件（如金额>10万走总监审批，≤10万走经理审批）自动选择审批路径

**Given** 审批流程定义包含多级审批
**When** 当前节点审批通过
**Then** 自动流转到下一级审批节点

**Given** 条件分支判断失败
**When** 无法确定审批路径
**Then** 返回错误码 WF_CONDITION_EVALUATION_FAILED

**Requirements:** FR-WF-007, FR-WF-008, FR-WF-009

### Story 7.10: 审批历史与催办

As a 审批提交人,
I want 查看审批历史和催办审批人,
So that 可以追踪审批进度并加速流程。

**Acceptance Criteria:**

**Given** 提交人已登录
**When** GET /api/v1/workflow-instances/{id}/history
**Then** 返回审批历史（每个节点的审批人、时间、结果、备注）

**Given** 审批流程停滞
**When** POST /api/v1/workflow-instances/{id}/urge
**Then** 向当前审批人发送催办通知（消息推送）

**Given** 管理员已登录
**When** GET /api/v1/workflow-instances/statistics
**Then** 返回审批统计数据（平均审批时长、超时率、各审批人处理量）

**Requirements:** FR-WF-010, FR-WF-011, FR-WF-012

### Story 7.11: 财务数据权限与审计

As a 企业管理员,
I want 财务数据受权限控制且操作可审计,
So that 财务数据安全合规。

**Acceptance Criteria:**

**Given** 非财务角色用户
**When** 访问财务相关 API
**Then** 返回 403 权限不足

**Given** 财务人员执行收付款操作
**When** 操作完成
**Then** 操作记录写入审计日志（操作人、时间、金额、关联单据）

**Given** 企业管理员已登录
**When** GET /api/v1/financial-audit-log?operator_id={id}&start_date=2026-01-01
**Then** 返回财务审计日志，支持按操作人、时间、类型筛选

**Requirements:** FR-FIN-020, FR-FIN-021

## Epic 8: 附件、消息、知识库与 Skill 系统

**目标：** 提供文件存储、消息通知、知识库检索和 Agent Skill 定义四大平台能力，支撑所有业务模块的附件、通知和 Agent 交互需求。

**FRs covered:** FR-FILE-001~009, FR-MSG-001~007, FR-KB-001~005, FR-SKILL-001~008, FR-KB2-001~006
**NFRs covered:** NFR-PERF-003, NFR-SEC-004
**Dependencies:** Epic 1

### Story 8.1: 文件上传与存储

As a 企业用户,
I want 上传文件到系统并获取文件 URL,
So that 业务单据可以关联附件。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** POST /api/v1/files/upload 上传文件（multipart/form-data）
**Then** 文件存储到 /storage/{enterprise_id}/{module}/{entity_id}/
**And** 返回文件 ID 和访问 URL

**Given** 上传文件超过大小限制
**When** 文件大小 > 配置的最大值（默认 50MB）
**Then** 返回错误码 FILE_SIZE_EXCEEDED

**Given** 上传不支持的文件类型
**When** 文件 MIME 类型不在白名单中
**Then** 返回错误码 FILE_TYPE_NOT_ALLOWED

**Requirements:** FR-FILE-001, FR-FILE-002, FR-FILE-003

### Story 8.2: 文件下载与预览

As a 企业用户,
I want 下载和预览已上传的文件,
So that 可以查看业务单据关联的附件内容。

**Acceptance Criteria:**

**Given** 企业用户已登录且有文件访问权限
**When** GET /api/v1/files/{file_id}/download
**Then** 返回文件内容（Content-Disposition: attachment）

**Given** 企业用户已登录
**When** GET /api/v1/files/{file_id}/preview
**Then** 对于图片/PDF 返回预览内容，其他类型返回不支持预览错误

**Given** 用户无文件访问权限（跨企业）
**When** GET /api/v1/files/{file_id}/download
**Then** 返回 403 权限不足

**Requirements:** FR-FILE-004, FR-FILE-005

### Story 8.3: 文件版本与删除

As a 企业用户,
I want 管理文件版本和删除文件,
So that 可以更新附件并清理不需要的文件。

**Acceptance Criteria:**

**Given** 文件已上传
**When** POST /api/v1/files/{file_id}/versions 上传新版本
**Then** 创建文件新版本，保留历史版本

**Given** 企业用户已登录
**When** GET /api/v1/files/{file_id}/versions
**Then** 返回文件版本列表

**Given** 企业用户已登录
**When** DELETE /api/v1/files/{file_id}
**Then** 软删除文件（标记 deleted_at），已关联业务单据的文件不可删除

**Requirements:** FR-FILE-006, FR-FILE-007, FR-FILE-008, FR-FILE-009

### Story 8.4: 消息发送与轮询

As a Agent,
I want 通过消息轮询获取待处理消息,
So that Agent 可以实时接收系统通知和任务。

**Acceptance Criteria:**

**Given** Agent 已认证
**When** GET /api/v1/messages/poll
**Then** 返回未读消息列表（审批通知、任务分配、系统公告等）

**Given** Agent 已认证
**When** CLI 每 60 秒轮询一次
**Then** 返回增量消息（上次轮询后的新消息）

**Given** 消息已读取
**When** POST /api/v1/messages/{id}/ack
**Then** 标记消息为已读

**Requirements:** FR-MSG-001, FR-MSG-002, FR-MSG-003

### Story 8.5: 消息类型与推送

As a 系统管理员,
I want 配置消息类型和推送规则,
So that 不同业务事件触发不同类型的消息通知。

**Acceptance Criteria:**

**Given** 系统产生业务事件（审批待办、合同到期、库存预警等）
**When** 事件触发
**Then** 自动生成对应类型的消息并推送给相关用户

**Given** 管理员已登录
**When** GET /api/v1/messages?type=approval&status=unread
**Then** 按类型和状态筛选消息列表

**Given** 用户已登录
**When** GET /api/v1/messages/summary
**Then** 返回各类型未读消息数量汇总

**Requirements:** FR-MSG-004, FR-MSG-005, FR-MSG-006

### Story 8.6: 消息已读与归档

As a 企业用户,
I want 批量标记消息已读和归档消息,
So that 可以高效管理消息。

**Acceptance Criteria:**

**Given** 用户已登录
**When** POST /api/v1/messages/batch-ack 携带消息 ID 列表
**Then** 批量标记消息为已读

**Given** 用户已登录
**When** POST /api/v1/messages/{id}/archive
**Then** 归档消息（从收件箱移到归档箱）

**Given** 用户已登录
**When** GET /api/v1/messages/archived
**Then** 返回已归档消息列表

**Requirements:** FR-MSG-007

### Story 8.7: 知识库文档 CRUD

As a 企业管理员,
I want 创建、编辑、删除知识库文档,
So that 可以积累和管理企业知识资产。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/knowledge-base/documents 携带标题、分类、内容（Markdown）
**Then** 创建知识库文档

**Given** 管理员已登录
**When** PUT /api/v1/knowledge-base/documents/{id}
**Then** 更新知识库文档（保留历史版本）

**Given** 管理员已登录
**When** DELETE /api/v1/knowledge-base/documents/{id}
**Then** 软删除知识库文档

**Requirements:** FR-KB-001, FR-KB-002, FR-KB-003

### Story 8.8: 知识库分类与搜索

As a 企业用户,
I want 按分类浏览和搜索知识库,
So that 可以快速找到需要的知识文档。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** GET /api/v1/knowledge-base/categories
**Then** 返回知识库分类树形结构

**Given** 企业用户已登录
**When** GET /api/v1/knowledge-base/search?keyword=合同模板&category=法务
**Then** 返回匹配的知识库文档列表，支持全文搜索

**Given** 企业用户已登录
**When** GET /api/v1/knowledge-base/documents/{id}
**Then** 返回知识库文档详情（含内容、版本历史、关联分类）

**Requirements:** FR-KB-004, FR-KB-005

### Story 8.9: Skill 注册与发现

As a Agent,
I want 发现和调用系统注册的 Skill,
So that Agent 可以通过 Skill 执行业务操作。

**Acceptance Criteria:**

**Given** Agent 已认证
**When** GET /api/v1/skills
**Then** 返回当前企业可用的 Skill 列表（名称、描述、参数定义、API 端点）

**Given** Agent 已认证
**When** GET /api/v1/skills/{skill_name}
**Then** 返回 Skill 详情（含参数 Schema、调用示例）

**Given** 系统管理员
**When** POST /api/v1/skills 注册新 Skill
**Then** 创建 Skill 定义（name、description、parameters、api_endpoint、module）

**Requirements:** FR-SKILL-001, FR-SKILL-002, FR-SKILL-003

### Story 8.10: Skill 执行与结果

As a Agent,
I want 调用 Skill 并获取执行结果,
So that 可以通过 Skill 完成业务操作。

**Acceptance Criteria:**

**Given** Agent 已认证且有 Skill 调用权限
**When** POST /api/v1/skills/{skill_name}/execute 携带参数
**Then** 执行 Skill 对应的 API 调用，返回执行结果

**Given** Skill 参数不合法
**When** 参数校验失败
**Then** 返回结构化错误码 SKILL_INVALID_PARAMETER

**Given** Agent 无 Skill 调用权限
**When** POST /api/v1/skills/{skill_name}/execute
**Then** 返回 403 权限不足

**Requirements:** FR-SKILL-004, FR-SKILL-005, FR-SKILL-006

### Story 8.11: Skill 权限与模块映射

As a 企业管理员,
I want 控制 Skill 的访问权限和模块映射,
So that 不同角色的 Agent 只能调用授权范围内的 Skill。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** POST /api/v1/skills/{skill_name}/permissions 携带角色列表
**Then** 配置 Skill 的可访问角色

**Given** Skill 按模块分组
**When** GET /api/v1/skills?module=hrm
**Then** 返回 HRM 模块下的所有 Skill

**Given** 功能开关关闭某模块
**When** Agent 尝试调用该模块的 Skill
**Then** 返回错误码 SKILL_MODULE_DISABLED

**Requirements:** FR-SKILL-007, FR-SKILL-008

### Story 8.12: 知识库向量化与语义检索

As a Agent,
I want 通过语义检索查找知识库文档,
So that 可以用自然语言查询找到最相关的知识。

**Acceptance Criteria:**

**Given** 知识库文档已创建/更新
**When** 文档保存后
**Then** 自动将文档内容向量化并存入 Qdrant

**Given** Agent 已认证
**When** POST /api/v1/knowledge-base/semantic-search 携带自然语言查询
**Then** 返回语义最相关的知识库文档列表（按相似度排序）

**Given** 向量化服务不可用
**When** 文档保存
**Then** 文档正常保存，向量化任务进入重试队列，不影响文档 CRUD

**Requirements:** FR-KB2-001, FR-KB2-002, FR-KB2-003

### Story 8.13: 知识库文档分块与引用

As a Agent,
I want 获取知识库文档的分块内容和来源引用,
So that Agent 回答用户问题时可以引用知识库的具体段落。

**Acceptance Criteria:**

**Given** 知识库文档已向量化
**When** 语义检索返回结果
**Then** 结果包含文档分块内容、来源文档 ID、分块位置

**Given** Agent 已认证
**When** GET /api/v1/knowledge-base/documents/{id}/chunks
**Then** 返回文档的分块列表（每块含内容、位置、向量 ID）

**Given** 文档更新
**When** 重新向量化
**Then** 旧分块向量删除，新分块向量生成

**Requirements:** FR-KB2-004, FR-KB2-005, FR-KB2-006

## Epic 9: 运营平台与商业闭环

**目标：** 云服务运营商可以管理平台租户、计费订阅和客户服务，实现平台商业闭环。

**FRs covered:** FR-OP-001~007, FR-BILL-001~010, FR-CS-001~005, FR-OPSVC-001~011, FR-CUST-001~006
**NFRs covered:** NFR-SEC-004, NFR-OPS-001
**Dependencies:** Epic 1, Epic 2

### Story 9.1: 运营仪表盘

As a 运营商,
I want 查看平台运营数据仪表盘,
So that 可以掌握平台整体运营状况。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** GET /api/v1/operator/dashboard
**Then** 返回平台核心指标（企业总数、活跃企业数、用户总数、本月新增、收入汇总）

**Given** 运营商已登录
**When** GET /api/v1/operator/dashboard/trends?period=30d
**Then** 返回趋势数据（日活企业、日活用户、日收入）

**Requirements:** FR-OP-001, FR-OP-002

### Story 9.2: 租户企业管理

As a 运营商,
I want 管理平台上的集团和企业租户,
So that 可以控制租户的开通、暂停和注销。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** POST /api/v1/operator/enterprises 携带集团名称、联系人、套餐类型
**Then** 创建企业租户，自动创建独立 Schema

**Given** 运营商已登录
**When** PATCH /api/v1/operator/enterprises/{id}/suspend
**Then** 暂停企业（冻结所有 API 访问），保留数据

**Given** 运营商已登录
**When** PATCH /api/v1/operator/enterprises/{id}/activate
**Then** 恢复企业访问

**Given** 运营商已登录
**When** DELETE /api/v1/operator/enterprises/{id}
**Then** 注销企业（30天保留期后彻底删除 Schema 和数据）

**Requirements:** FR-OP-003, FR-OP-004, FR-OP-005

### Story 9.3: 运营审计与日志

As a 运营商,
I want 查看平台级审计日志和操作记录,
So that 可以追踪平台上的所有管理操作。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** GET /api/v1/operator/audit-log?operator_id={id}&start_date=2026-01-01
**Then** 返回平台审计日志（租户创建/暂停/恢复/注销、套餐变更等）

**Given** 运营商已登录
**When** GET /api/v1/operator/enterprises/{id}/activity
**Then** 返回指定企业的活动日志（API 调用量、活跃用户数、存储用量）

**Requirements:** FR-OP-006, FR-OP-007

### Story 9.4: 订阅套餐定义

As a 运营商,
I want 定义和管理订阅套餐,
So that 企业可以选择不同的服务等级。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** POST /api/v1/operator/plans 携带套餐名称、价格、功能列表、用户数限制、存储配额
**Then** 创建订阅套餐

**Given** 运营商已登录
**When** PUT /api/v1/operator/plans/{id}
**Then** 更新套餐定义（已订阅的套餐不可删除，只能创建新版本）

**Given** 运营商已登录
**When** GET /api/v1/operator/plans
**Then** 返回所有套餐列表

**Requirements:** FR-BILL-001, FR-BILL-002, FR-BILL-003

### Story 9.5: 企业订阅与续费

As a 企业管理员,
I want 为企业订阅套餐和管理续费,
So that 可以使用平台服务。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** POST /api/v1/subscriptions 携带套餐 ID
**Then** 创建订阅，关联到当前企业

**Given** 订阅即将到期
**When** 距到期日 30 天内
**Then** 系统自动发送续费提醒消息

**Given** 企业管理员已登录
**When** POST /api/v1/subscriptions/{id}/renew 携带续费周期
**Then** 续费订阅，延长有效期

**Given** 订阅过期
**When** 过期后 7 天内
**Then** 降级为只读模式，超过 7 天暂停服务

**Requirements:** FR-BILL-004, FR-BILL-005, FR-BILL-006, FR-BILL-007

### Story 9.6: 用量计费与账单

As a 企业管理员,
I want 查看用量和账单,
So that 可以了解费用明细。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** GET /api/v1/billing/usage?period=2026-06
**Then** 返回当月用量明细（API 调用量、存储用量、用户数）

**Given** 企业管理员已登录
**When** GET /api/v1/billing/invoices
**Then** 返回账单列表（周期、金额、状态）

**Given** 企业管理员已登录
**When** GET /api/v1/billing/invoices/{id}
**Then** 返回账单详情（含用量明细和费用计算）

**Requirements:** FR-BILL-008, FR-BILL-009, FR-BILL-010

### Story 9.7: 客户服务工单

As a 运营商客服,
I want 创建和管理客户服务工单,
So that 可以处理企业客户的服务请求。

**Acceptance Criteria:**

**Given** 客服人员已登录
**When** POST /api/v1/operator/service-tickets 携带企业 ID、问题描述、优先级
**Then** 创建客服工单

**Given** 客服人员已登录
**When** PATCH /api/v1/operator/service-tickets/{id}/status
**Then** 状态流转：待处理→处理中→已解决→已关闭

**Given** 运营商已登录
**When** GET /api/v1/operator/service-tickets?status=open&priority=high
**Then** 按状态和优先级筛选工单列表

**Requirements:** FR-CS-001, FR-CS-002, FR-CS-003

### Story 9.8: 客户服务SLA与统计

As a 运营商,
I want 监控客户服务 SLA 和统计指标,
So that 可以保证服务质量。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** GET /api/v1/operator/service-metrics
**Then** 返回客服指标（平均响应时间、解决率、SLA 达标率）

**Given** 工单超时未响应
**When** 超过 SLA 配置的响应时间
**Then** 自动升级工单优先级并通知客服主管

**Requirements:** FR-CS-004, FR-CS-005

### Story 9.9: 运营服务管理

As a 运营商,
I want 管理平台级服务配置和运维操作,
So that 可以维护平台稳定运行。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** GET /api/v1/operator/services
**Then** 返回平台服务列表（API 服务、数据库、Redis、Qdrant 状态）

**Given** 运营商已登录
**When** POST /api/v1/operator/maintenance 携带维护窗口时间
**Then** 设置维护窗口，维护期间 API 返回 503

**Given** 运营商已登录
**When** GET /api/v1/operator/system-health
**Then** 返回系统健康状态（CPU、内存、磁盘、数据库连接池）

**Requirements:** FR-OPSVC-001, FR-OPSVC-002, FR-OPSVC-003, FR-OPSVC-004

### Story 9.10: 运营通知与公告

As a 运营商,
I want 发布平台公告和通知,
So that 企业用户可以了解平台动态和维护信息。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** POST /api/v1/operator/announcements 携带标题、内容、生效时间、目标企业列表
**Then** 发布平台公告

**Given** 企业用户已登录
**When** GET /api/v1/announcements
**Then** 返回当前生效的公告列表

**Given** 运营商已登录
**When** PATCH /api/v1/operator/announcements/{id}/revoke
**Then** 撤回公告

**Requirements:** FR-OPSVC-005, FR-OPSVC-006, FR-OPSVC-007

### Story 9.11: 运营数据导出与备份

As a 运营商,
I want 导出运营数据和执行企业级备份,
So that 可以满足合规要求和数据安全。

**Acceptance Criteria:**

**Given** 运营商已登录
**When** POST /api/v1/operator/data-export 携带导出范围和格式
**Then** 创建数据导出任务，异步执行

**Given** 运营商已登录
**When** POST /api/v1/operator/enterprises/{id}/backup
**Then** 触发企业 Schema 级备份

**Given** 运营商已登录
**When** POST /api/v1/operator/enterprises/{id}/restore 携带备份 ID
**Then** 从备份恢复企业数据

**Requirements:** FR-OPSVC-008, FR-OPSVC-009, FR-OPSVC-010, FR-OPSVC-011

### Story 9.12: 客户自助服务

As a 企业管理员,
I want 通过自助服务管理企业订阅和查看用量,
So that 不需要联系运营商就能完成常见操作。

**Acceptance Criteria:**

**Given** 企业管理员已登录
**When** GET /api/v1/customer/subscription
**Then** 返回当前企业订阅信息（套餐、到期日、用量）

**Given** 企业管理员已登录
**When** POST /api/v1/customer/subscription/upgrade 携带目标套餐 ID
**Then** 升级订阅（立即生效，差价按天计算）

**Given** 企业管理员已登录
**When** POST /api/v1/customer/support-tickets 携带问题描述
**Then** 创建客户支持工单

**Given** 企业管理员已登录
**When** GET /api/v1/customer/support-tickets
**Then** 返回本企业的支持工单列表

**Requirements:** FR-CUST-001, FR-CUST-002, FR-CUST-003, FR-CUST-004, FR-CUST-005, FR-CUST-006

## Epic 10: 数据智能与私有化部署

**目标：** 提供数据报表、审计追溯、数据导入导出、Agent 数据导出、Webhook 集成、国际化、安全增强、AI 助手、CLI 工具和私有化部署等横切能力，让平台可观测、可扩展、可本地化。

**FRs covered:** FR-REPORT-001~008, FR-OWNER-001~006, FR-AUDIT-001~006, FR-IMPORT-001~006, FR-EXPORT-001~010, FR-WEBHOOK-001~006, FR-I18N-001~006, FR-SEC2-001~004, FR-ASSIST-001~002, FR-ASSIST-004~005, FR-CLI-001~008, FR-DEPLOY-001~008
**NFRs covered:** NFR-SEC-001~005, NFR-PERF-001~004, NFR-OPS-001~003, NFR-I18N-001~002
**Dependencies:** Epic 1, Epic 8

### Story 10.1: 老板驾驶舱报表

As a 老板,
I want 查看企业经营数据驾驶舱,
So that 可以一目了然掌握企业核心经营指标。

**Acceptance Criteria:**

**Given** 老板已登录
**When** GET /api/v1/reports/owner-dashboard
**Then** 返回驾驶舱数据（营收趋势、合同金额、回款率、员工效率、客户增长）

**Given** 老板已登录
**When** GET /api/v1/reports/owner-dashboard?period=quarter
**Then** 按月/季/年维度切换报表数据

**Given** 老板拥有多个企业
**When** GET /api/v1/reports/owner-dashboard?enterprise_id=all
**Then** 返回跨企业汇总数据

**Requirements:** FR-OWNER-001, FR-OWNER-002, FR-OWNER-003

### Story 10.2: 老板数据穿透与对比

As a 老板,
I want 穿透查看报表背后的明细数据并进行跨期对比,
So that 可以从宏观到微观理解经营状况。

**Acceptance Criteria:**

**Given** 老板已登录
**When** GET /api/v1/reports/owner-drilldown?metric=revenue&period=2026-Q2
**Then** 返回指标穿透明细（从季度→月→周→单据）

**Given** 老板已登录
**When** GET /api/v1/reports/owner-compare?metric=revenue&periods=2026-Q1,2026-Q2
**Then** 返回跨期对比数据（环比、同比）

**Given** 老板已登录
**When** GET /api/v1/reports/owner-ranking?type=department&metric=revenue
**Then** 返回部门排名数据

**Requirements:** FR-OWNER-004, FR-OWNER-005, FR-OWNER-006

### Story 10.3: 通用数据报表

As a 企业用户,
I want 按模块查看业务数据报表,
So that 可以从数据维度分析业务状况。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** GET /api/v1/reports/sales?period=2026-06
**Then** 返回销售报表（订单量、金额、客户分布、产品排名）

**Given** 企业用户已登录
**When** GET /api/v1/reports/inventory?warehouse_id={id}
**Then** 返回库存报表（库存周转率、滞销品、预警物料）

**Given** 企业用户已登录
**When** GET /api/v1/reports/finance?period=2026-06
**Then** 返回财务报表（收支汇总、费用分类、应收应付）

**Given** 企业用户已登录
**When** GET /api/v1/reports/service?period=2026-06
**Then** 返回售后报表（工单量、平均处理时长、客户满意度）

**Requirements:** FR-REPORT-001, FR-REPORT-002, FR-REPORT-003, FR-REPORT-004

### Story 10.4: 自定义报表与导出

As a 企业管理员,
I want 创建自定义报表并导出数据,
So that 可以按需分析业务数据。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** POST /api/v1/reports/custom 携带数据源、维度、指标、筛选条件
**Then** 创建自定义报表定义

**Given** 自定义报表已创建
**When** GET /api/v1/reports/custom/{id}/run
**Then** 执行报表查询并返回结果

**Given** 管理员已登录
**When** GET /api/v1/reports/custom/{id}/export?format=csv
**Then** 导出报表数据为 CSV/Excel 格式

**Requirements:** FR-REPORT-005, FR-REPORT-006, FR-REPORT-007, FR-REPORT-008

### Story 10.5: 审计日志查询与导出

As a 企业管理员,
I want 查询和导出审计日志,
So that 可以追溯所有系统操作。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** GET /api/v1/audit-log?user_id={id}&action=update&start_date=2026-01-01
**Then** 返回审计日志列表，支持按用户、操作类型、时间、模块筛选

**Given** 管理员已登录
**When** GET /api/v1/audit-log/{id}
**Then** 返回审计日志详情（操作前后数据差异）

**Given** 管理员已登录
**When** GET /api/v1/audit-log/export?format=csv&start_date=2026-01-01
**Then** 导出审计日志为 CSV 格式

**Requirements:** FR-AUDIT-001, FR-AUDIT-002, FR-AUDIT-003

### Story 10.6: 数据备份与恢复审计

As a 企业管理员,
I want 查看数据备份记录和恢复操作日志,
So that 可以确保数据安全合规。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** GET /api/v1/audit-backup
**Then** 返回备份记录列表（备份时间、大小、状态）

**Given** 管理员已登录
**When** GET /api/v1/audit-restore
**Then** 返回恢复操作日志（恢复时间、操作人、恢复范围）

**Given** 备份自动执行
**When** 系统按配置策略自动备份
**Then** 备份记录写入审计日志

**Requirements:** FR-AUDIT-004, FR-AUDIT-005, FR-AUDIT-006

### Story 10.7: 数据导入

As a 企业管理员,
I want 批量导入业务数据,
So that 可以快速初始化系统或批量更新数据。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** POST /api/v1/data-import/upload 上传 CSV/Excel 文件
**Then** 解析文件并返回预览（字段映射建议、数据校验结果）

**Given** 管理员确认导入
**When** POST /api/v1/data-import/execute 携带映射规则
**Then** 执行导入，返回导入结果（成功数、失败数、错误明细）

**Given** 导入数据校验失败
**When** 存在不合法数据行
**Then** 返回错误明细（行号、字段、错误原因），允许部分导入或全部回滚

**Requirements:** FR-IMPORT-001, FR-IMPORT-002, FR-IMPORT-003

### Story 10.8: 数据导出

As a 企业用户,
I want 导出业务数据,
So that 可以在本地分析或备份。

**Acceptance Criteria:**

**Given** 企业用户已登录
**When** POST /api/v1/data-export 携带模块、筛选条件、格式
**Then** 创建异步导出任务

**Given** 导出任务完成
**When** GET /api/v1/data-export/{id}/download
**Then** 下载导出文件

**Given** 管理员已登录
**When** GET /api/v1/data-export/history
**Then** 返回导出历史列表

**Requirements:** FR-IMPORT-004, FR-IMPORT-005, FR-IMPORT-006

### Story 10.9: Webhook 注册与触发

As a 企业管理员,
I want 配置 Webhook 接收业务事件通知,
So that 可以与外部系统实时集成。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** POST /api/v1/webhooks 携带 URL、事件类型列表、密钥
**Then** 注册 Webhook

**Given** 业务事件触发
**When** 合同生效、订单完成等事件发生
**Then** 系统向已注册的 Webhook URL 发送 POST 请求（含事件数据和签名）

**Given** Webhook 调用失败
**When** 响应状态码非 2xx 或超时
**Then** 按重试策略重试（最多3次，指数退避），记录调用日志

**Requirements:** FR-WEBHOOK-001, FR-WEBHOOK-002, FR-WEBHOOK-003

### Story 10.10: Webhook 管理与日志

As a 企业管理员,
I want 管理 Webhook 配置和查看调用日志,
So that 可以监控和调试 Webhook 集成。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** GET /api/v1/webhooks
**Then** 返回 Webhook 列表

**Given** 管理员已登录
**When** PATCH /api/v1/webhooks/{id} 更新配置
**Then** 更新 Webhook 配置

**Given** 管理员已登录
**When** GET /api/v1/webhooks/{id}/logs
**Then** 返回 Webhook 调用日志（时间、状态、响应、耗时）

**Given** 管理员已登录
**When** POST /api/v1/webhooks/{id}/test
**Then** 发送测试事件到 Webhook URL

**Requirements:** FR-WEBHOOK-004, FR-WEBHOOK-005, FR-WEBHOOK-006

### Story 10.11: 国际化与多语言

As a 系统管理员,
I want 配置系统语言和翻译资源,
So that 不同地区用户可以使用母语操作系统。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** PATCH /api/v1/settings/language 携带语言代码
**Then** 更新企业默认语言

**Given** API 返回错误信息
**When** 用户偏好语言为英文
**Then** 错误码和错误消息以英文返回

**Given** 管理员已登录
**When** GET /api/v1/i18n/translations?locale=en
**Then** 返回指定语言的翻译资源

**Given** 管理员已登录
**When** POST /api/v1/i18n/translations 携带语言代码、键值对
**Then** 自定义翻译覆盖默认翻译

**Requirements:** FR-I18N-001, FR-I18N-002, FR-I18N-003, FR-I18N-004

### Story 10.12: 时区与格式本地化

As a 企业用户,
I want 系统支持时区和本地化格式,
So that 时间和数据显示符合本地习惯。

**Acceptance Criteria:**

**Given** 企业配置了时区
**When** API 返回时间字段
**Then** 时间按企业时区格式化返回

**Given** 管理员已登录
**When** PATCH /api/v1/settings/locale 携带日期格式、货币符号、数字格式
**Then** 更新企业本地化格式配置

**Given** 用户个人偏好语言与企业不同
**When** 用户设置个人语言
**Then** 个人语言优先级高于企业默认

**Requirements:** FR-I18N-005, FR-I18N-006

### Story 10.13: 安全增强与数据加密

As a 系统管理员,
I want 敏感数据加密存储和访问控制增强,
So that 系统安全性满足企业级要求。

**Acceptance Criteria:**

**Given** 敏感字段（密码、手机号、身份证号等）写入数据库
**When** 数据持久化
**Then** 使用 AES-256 加密存储

**Given** 管理员已登录
**When** GET /api/v1/security/settings
**Then** 返回安全配置（密码策略、会话超时、IP 白名单状态）

**Given** 管理员已登录
**When** PATCH /api/v1/security/settings 携带密码策略（最小长度、复杂度要求）、会话超时时间
**Then** 更新安全配置

**Given** IP 白名单启用
**When** 非白名单 IP 访问 API
**Then** 返回 403

**Requirements:** FR-SEC2-001, FR-SEC2-002, FR-SEC2-003, FR-SEC2-004

### Story 10.14: AI 助手对话

As a Agent,
I want 通过 AI 助手获取业务操作建议,
So that Agent 可以更智能地辅助用户完成业务操作。

**Acceptance Criteria:**

**Given** Agent 已认证
**When** POST /api/v1/assistant/chat 携带用户问题和上下文
**Then** AI 助手返回操作建议（基于企业数据和知识库）

**Given** AI 助手需要执行操作
**When** 建议包含可执行操作
**Then** 返回操作建议及对应 Skill 调用参数，用户确认后执行

**Given** AI 助手回答无法确定
**When** 知识库中没有相关信息
**Then** 返回免责声明并建议咨询人工

**Requirements:** FR-ASSIST-001, FR-ASSIST-002

### Story 10.15: AI 助手上下文与偏好

As a Agent,
I want AI 助手记住对话上下文和用户偏好,
So that 多轮对话可以连贯进行。

**Acceptance Criteria:**

**Given** 用户有多轮对话
**When** 新消息到达
**Then** AI 助手结合历史上下文生成回复

**Given** 管理员已登录
**When** PATCH /api/v1/assistant/preferences 携带默认行为偏好
**Then** 更新企业级 AI 助手偏好设置

**Given** 用户删除对话历史
**When** DELETE /api/v1/assistant/sessions/{id}
**Then** 清除指定会话的上下文数据

**Requirements:** FR-ASSIST-004, FR-ASSIST-005

### Story 10.16: CLI 认证与配置

As a Agent 运维人员,
I want 通过 CLI 工具完成认证和系统配置,
So that 可以通过命令行管理系统。

**Acceptance Criteria:**

**Given** 用户执行 ao-cli auth login
**When** 输入用户名和密码
**Then** CLI 通过 OAuth 2.0 认证，保存 Access Token 和 Refresh Token 到本地配置

**Given** 用户执行 ao-cli auth logout
**When** 命令执行
**Then** 清除本地 Token，调用 API 撤销 Token

**Given** 用户执行 ao-cli config set api_url https://api.example.com
**When** 命令执行
**Then** 更新 CLI 配置文件中的 API 地址

**Requirements:** FR-CLI-001, FR-CLI-002, FR-CLI-003

### Story 10.17: CLI 消息轮询与 Skill 执行

As a Agent,
I want 通过 CLI 轮询消息和执行 Skill,
So that Agent 可以自动化业务操作。

**Acceptance Criteria:**

**Given** 用户执行 ao-cli poll start
**When** 命令执行
**Then** CLI 后台启动消息轮询（每60秒），收到新消息时输出到终端

**Given** 用户执行 ao-cli poll stop
**When** 命令执行
**Then** 停止消息轮询

**Given** 用户执行 ao-cli skill execute hrm_employee_create --name="张三"
**When** 命令执行
**Then** CLI 调用对应 Skill API 并返回执行结果

**Given** 用户执行 ao-cli skill list
**When** 命令执行
**Then** 列出当前企业所有可用 Skill

**Requirements:** FR-CLI-004, FR-CLI-005, FR-CLI-006, FR-CLI-007, FR-CLI-008

### Story 10.18: CLI 操作日志记录与归档

As a Agent,
I want 查看 CLI 记录的操作日志来回忆已执行的操作,
So that 可以在对话中保持上下文连续性，知道之前做过什么操作。

**Acceptance Criteria:**

**Given** 用户通过 Agent 执行 `ao-cli skill execute contract create --title="销售合同"`
**When** Skill 执行完成
**Then** CLI 自动将操作记录追加写入 `~/.ai-office-cli/logs/YYYY-MM-DD.jsonl`，记录包含：时间戳、Skill 名称、action、参数摘要、执行结果状态、响应摘要

**Given** Agent 需要回忆今天的操作历史
**When** Agent 读取 `~/.ai-office-cli/logs/2026-07-08.jsonl`
**Then** 返回 JSONL 格式的操作日志，每行一条记录，Agent 可直接解析

**Given** 跨日执行操作
**When** 从 2026-07-08 23:59 执行到 2026-07-09 00:01
**Then** 自动创建新日志文件 `2026-07-09.jsonl`，新操作写入新文件

**Given** 用户执行 `ao-cli skill help contract`
**When** 命令输出帮助信息
**Then** 帮助信息中包含"操作日志位置: ~/.ai-office-cli/logs/，格式: JSONL 按日期归档"

**Given** Agent 读取历史日志
**When** 读取 `~/.ai-office-cli/logs/2026-07-01.jsonl`
**Then** 返回该日期的所有操作记录

**Requirements:** FR-CLI-009, FR-CLI-010

### Story 10.19: Docker 私有化部署

As a 运维人员,
I want 通过 Docker Compose 一键部署私有化环境,
So that 企业可以在局域网内运行完整平台。

**Acceptance Criteria:**

**Given** 服务器已安装 Docker 和 Docker Compose
**When** 执行 docker-compose up -d
**Then** 启动 API 服务、PostgreSQL、Redis、Qdrant 全部组件

**Given** 部署配置文件
**When** 修改 .env 文件中的数据库密码、JWT 密钥等
**Then** 首次启动自动初始化数据库 Schema

**Given** 运维人员已登录
**When** GET /api/v1/health
**Then** 返回服务健康状态（所有组件就绪）

**Requirements:** FR-DEPLOY-001, FR-DEPLOY-002, FR-DEPLOY-003

### Story 10.20: 私有化部署配置与升级

As a 运维人员,
I want 配置私有化部署参数和执行版本升级,
So that 可以定制部署和保持系统更新。

**Acceptance Criteria:**

**Given** 运维人员修改配置
**When** 更新 docker-compose.yml 中的环境变量
**Then** 重启服务后配置生效

**Given** 新版本发布
**When** 拉取新镜像并执行升级脚本
**Then** 自动执行数据库迁移，保留现有数据

**Given** 运维人员已登录
**When** GET /api/v1/system/info
**Then** 返回系统版本、部署模式、运行时间

**Requirements:** FR-DEPLOY-004, FR-DEPLOY-005, FR-DEPLOY-006

### Story 10.21: 私有化备份恢复与监控

As a 运维人员,
I want 执行私有化环境的数据备份恢复和系统监控,
So that 可以保障私有化环境的数据安全和稳定运行。

**Acceptance Criteria:**

**Given** 运维人员执行备份脚本
**When** ./scripts/backup.sh
**Then** 备份 PostgreSQL 数据、Redis RDB、Qdrant 快照到指定目录

**Given** 运维人员执行恢复脚本
**When** ./scripts/restore.sh --backup-dir=/backups/2026-07-04
**Then** 从备份恢复所有数据

**Given** 运维人员已登录
**When** GET /api/v1/system/metrics
**Then** 返回 Prometheus 兼容的系统指标（API 请求量、延迟、错误率、资源使用）

**Requirements:** FR-DEPLOY-007, FR-DEPLOY-008

### Story 10.22: Agent 对话式数据导出

As a 企业用户,
I want 通过与 Agent 对话导出业务数据为 Excel/CSV,
So that 可以用自然语言描述导出需求，Agent 帮我生成文件，无需手动操作界面。

**Acceptance Criteria:**

**Given** 用户已登录并与 Agent 对话
**When** 用户说"帮我导出2026年6月所有合同清单"
**Then** Agent 解析意图，调用 `ao-cli skill execute data_export --entity contract --filters '{"date_range":{"start":"2026-06-01","end":"2026-06-30"}}' --format xlsx`
**And** CLI 发送 POST /api/v1/data-export 携带 {entity_type: "contract", filters: {...}, format: "xlsx"}
**And** 创建异步导出任务，返回 task_id

**Given** 导出任务完成
**When** CLI 轮询收到导出完成消息
**Then** Agent 告知用户"导出完成"，提供下载链接

**Given** 用户说"帮我导出所有客户清单"
**When** Agent 调用 `ao-cli skill execute data_export --entity customer --format xlsx`
**Then** 导出客户数据为 Excel 文件

**Given** 普通员工（非 Admin）说"帮我导出所有合同"
**When** Agent 调用导出 API
**Then** 仅导出该员工创建/负责/参与的合同，无权导出他人合同

**Requirements:** FR-EXPORT-001, FR-EXPORT-002, FR-EXPORT-006, FR-EXPORT-007, FR-EXPORT-008

### Story 10.23: 跨实体关联导出（客户维度）

As a 企业用户,
I want 以客户为锚点导出该客户的所有关联业务数据,
So that 可以一次性获得某客户的完整业务画像数据。

**Acceptance Criteria:**

**Given** 用户已登录并与 Agent 对话
**When** 用户说"帮我导出客户A的所有往来合同、售后清单、工单和报价单"
**Then** Agent 解析意图，调用 `ao-cli skill execute data_export --anchor customer --anchor_id {customer_a_id} --entities contract,service_order,quote --format xlsx`
**And** CLI 发送 POST /api/v1/data-export 携带 {anchor_type: "customer", anchor_id: "...", entity_types: ["contract", "service_order", "quote"], format: "xlsx"}
**And** 生成单个 Excel 文件，包含多个 Sheet（合同 Sheet、售后工单 Sheet、报价单 Sheet）

**Given** 用户是普通员工
**When** 用户说"帮我导出客户A的所有往来数据"
**Then** 仅导出该员工有权限查看的客户A的关联数据

**Requirements:** FR-EXPORT-003, FR-EXPORT-006, FR-EXPORT-007

### Story 10.24: 员工维度业务记录导出

As a 企业管理员,
I want 导出指定员工创建/负责的所有业务单据和操作日志,
So that 可以全面了解某员工的工作产出和操作行为。

**Acceptance Criteria:**

**Given** 企业管理员已登录并与 Agent 对话
**When** 用户说"帮我导出员工张三的所有业务单据"
**Then** Agent 调用 `ao-cli skill execute data_export --anchor employee --anchor_id {employee_id} --entities contract,service_order,quote,purchase_order,sales_order --format xlsx`
**And** 生成单个 Excel 文件，每个实体一个 Sheet

**Given** 企业管理员已登录
**When** 用户说"帮我导出员工张三的操作日志"
**Then** Agent 调用 `ao-cli skill execute data_export --anchor employee --anchor_id {employee_id} --entity audit_log --format xlsx`
**And** 导出该员工的操作日志（操作时间、操作类型、操作对象、变更前后值）

**Given** 普通员工尝试导出他人的业务记录
**When** 调用导出 API
**Then** 返回 403 权限不足

**Requirements:** FR-EXPORT-004, FR-EXPORT-005, FR-EXPORT-006

### Story 10.25: 导出字段选择与脱敏

As a 企业用户,
I want 选择导出字段子集并确保敏感数据脱敏,
So that 导出的数据只包含需要的字段且敏感信息已脱敏处理。

**Acceptance Criteria:**

**Given** 用户已登录并与 Agent 对话
**When** 用户说"只导出合同的编号、名称和金额"
**Then** Agent 调用 `ao-cli skill execute data_export --entity contract --fields contract_no,title,amount --format xlsx`
**And** 导出的 Excel 仅包含指定字段列

**Given** 用户导出包含手机号、身份证号的数据
**When** 导出 API 执行
**Then** 敏感字段按企业脱敏规则（FR-SEC2-002）处理后再写入文件

**Given** 用户指定导出格式为 CSV
**When** Agent 调用 `ao-cli skill execute data_export --entity customer --format csv`
**Then** 生成 CSV 文件

**Requirements:** FR-EXPORT-009, FR-EXPORT-010, FR-EXPORT-007
