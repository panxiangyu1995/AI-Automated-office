# AI-Automated-office 验收测试清单

**Author:** PAN
**Date:** 2026-07-06
**Status:** Approved

---

## L1: 集成测试清单（按Epic维度）

### Epic 1: 平台基础与认证授权 (17 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 1.1 | `TestHealthEndpoint` | - | GET /health 返回200 |
| 1.2 | `TestOAuth2Login_Success` | FR-AUTH-001 | 正确凭证→access_token+refresh_token |
| 1.3 | `TestOAuth2Login_InvalidCredentials` | FR-AUTH-001 | 错误凭证→401 AUTH_INVALID_CREDENTIALS |
| 1.4 | `TestRefreshToken` | FR-AUTH-002 | refresh_token→新access_token，旧refresh失效 |
| 1.5 | `TestRefreshToken_Expired` | FR-AUTH-002 | 过期refresh_token→401 |
| 1.6 | `TestLogout` | FR-AUTH-001 | 登出→token失效→后续请求401 |
| 1.7 | `TestRBAC_OperatorCanAccessAll` | FR-AUTH-003 | Operator角色可访问所有端点 |
| 1.8 | `TestRBAC_EmployeeCannotAccessAdmin` | FR-AUTH-003 | Employee角色访问admin端点→403 |
| 1.9 | `TestRBAC_ManagerCanAccessDepartment` | FR-AUTH-003 | Manager角色可访问本部门端点 |
| 1.10 | `TestPermissionDenied_NoToken` | FR-AUTH-005 | 无token→401 |
| 1.11 | `TestPermissionDenied_WrongRole` | FR-AUTH-005 | 错误角色→403 AUTH_PERMISSION_DENIED |
| 1.12 | `TestAuditLog_RecordedOnCreate` | FR-AUTH-006 | 创建操作→审计日志记录 |
| 1.13 | `TestAuditLog_QueryByTimeRange` | FR-AUTH-007 | 按时间范围查询审计日志 |
| 1.14 | `TestAutoBackup_CreateConfig` | FR-AUTH-008 | 创建备份配置 |
| 1.15 | `TestAutoBackup_TriggerAndRestore` | FR-AUTH-008,FR-AUTH-013 | 触发备份→恢复→数据一致 |
| 1.16 | `TestStructuredErrorCode_Format` | FR-AUTH-010 | 错误响应包含code/message/details/level/recoverable |
| 1.17 | `TestStructuredErrorCode_AgentRecoverable` | FR-AUTH-010 | AUTH_TOKEN_EXPIRED→recoverable=true+recovery_action |
| 1.18 | `TestSchemaIsolation_CreateEnterprise` | FR-AUTH-012 | 创建企业→自动创建独立Schema |
| 1.19 | `TestSchemaIsolation_CrossTenantBlocked` | FR-AUTH-012 | 企业A无法访问企业B数据 |
| 1.20 | `TestEnterpriseBackup_Independent` | FR-AUTH-013 | 企业A备份恢复不影响企业B |
| 1.21 | `TestAPIQuota_Exceeded` | FR-AUTH-015 | 配额耗尽→429 AUTH_QUOTA_EXCEEDED |
| 1.22 | `TestAPIQuota_AutoReset` | FR-AUTH-015 | 配额周期重置 |
| 1.23 | `TestFeatureFlag_Disabled` | FR-AUTH-016 | 功能关闭→403 AUTH_FEATURE_DISABLED |
| 1.24 | `TestRateLimiting_PerEnterprise` | NFR-PERF-003 | 超1000QPS→429 |
| 1.25 | `TestRateLimiting_PerIP` | NFR-PERF-003 | 超100QPS→429 |
| 1.26 | `TestRateLimiting_ResponseHeaders` | NFR-PERF-003 | X-RateLimit-Limit/Remaining/Reset头 |
| 1.27 | `TestObservability_JSONLog` | FR-AUTH-017 | 日志输出结构化JSON |
| 1.28 | `TestObservability_MetricsEndpoint` | FR-AUTH-017 | GET /metrics返回Prometheus指标 |
| 1.29 | `TestObservability_RequestID` | FR-AUTH-017 | X-Request-ID传递 |

### Epic 2: 组织架构与多企业管理 (21 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 2.1 | `TestGroupCRUD_Create` | FR-ORG-001 | POST /groups→创建集团 |
| 2.2 | `TestGroupCRUD_Update` | FR-ORG-001 | PUT /groups/:id→更新集团 |
| 2.3 | `TestGroupCRUD_Delete_HasNoEnterprise` | FR-ORG-001 | 无活跃企业→可删除 |
| 2.4 | `TestGroupCRUD_Delete_HasEnterprise` | FR-ORG-001 | 有活跃企业→拒绝删除 |
| 2.5 | `TestEnterprise_Create` | FR-ORG-002 | 创建企业→自动创建Schema+管理员 |
| 2.6 | `TestEnterprise_List` | FR-ORG-002,FR-OP-001 | 运营商查看所有企业列表 |
| 2.7 | `TestDepartment_Create` | FR-ORG-003 | 创建部门→支持多级树形 |
| 2.8 | `TestDepartment_Update` | FR-ORG-003 | 更新部门信息 |
| 2.9 | `TestDepartment_Delete_NoEmployee` | FR-ORG-003 | 无员工→可删除 |
| 2.10 | `TestDepartment_Delete_HasEmployee` | FR-ORG-003 | 有员工→拒绝删除 |
| 2.11 | `TestDepartment_Tree` | FR-ORG-009 | 返回树形组织架构 |
| 2.12 | `TestDepartment_SetManager` | FR-ORG-004 | 设置部门经理→获得Manager角色 |
| 2.13 | `TestDepartment_ManagerEditOwn` | FR-ORG-005 | 部门经理可编辑本部门 |
| 2.14 | `TestDepartment_ManagerCannotEditOther` | FR-ORG-005 | 部门经理不可编辑其他部门 |
| 2.15 | `TestEmployee_Create` | FR-ORG-006 | 创建员工→归属部门 |
| 2.16 | `TestEmployee_MustBelongToDepartment` | FR-ORG-007 | 无部门→创建失败 |
| 2.17 | `TestCrossEnterprise_SwitchView` | FR-ORG-008 | 老板切换企业视角 |
| 2.18 | `TestEmployee_SearchByRole` | FR-ORG-011 | 按角色查询员工列表 |
| 2.19 | `TestEmployee_SearchByName` | FR-ORG-012 | 按姓名模糊搜索 |
| 2.20 | `TestPosition_CRUD` | FR-ORG-013 | 岗位定义与管理 |
| 2.21 | `TestCrossEnterprise_GrantPermission` | FR-AUTH-004,FR-GROUP-004 | 集团老板开通跨企业权限 |
| 2.22 | `TestCrossEnterprise_ScopeRestriction` | FR-GROUP-005 | 跨企业权限限定数据范围 |
| 2.23 | `TestCrossEnterprise_AdminAssignScope` | FR-GROUP-006 | 企业管理员分配访问范围 |
| 2.24 | `TestCrossEnterprise_Summary` | FR-GROUP-007 | 跨企业经营汇总 |
| 2.25 | `TestCrossEnterprise_AuditLog` | FR-GROUP-008 | 跨企业操作记录审计日志 |
| 2.26 | `TestFineGrainedPermission_Set` | FR-AUTH-009 | 自定义员工权限 |
| 2.27 | `TestFineGrainedPermission_AllowDeny` | FR-AUTH-009 | allow/deny效果验证 |

### Epic 3: HRM员工管理 (8 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 3.1 | `TestEmployeeOnboard_CreateWithUser` | FR-HRM-001 | 入职→创建档案+自动创建登录账号 |
| 3.2 | `TestEmployee_EditProfile` | FR-HRM-002 | 编辑员工档案信息 |
| 3.3 | `TestEmployee_Resign` | FR-HRM-003 | 标记离职→status=resigned→无法登录 |
| 3.4 | `TestEmployee_ListAll` | FR-HRM-004 | 查看所有员工列表（分页） |
| 3.5 | `TestEmployee_SelfView` | FR-HRM-005 | 员工查看自己档案 |
| 3.6 | `TestEmployee_BatchImport` | FR-HRM-006 | Excel/CSV批量导入+错误收集 |
| 3.7 | `TestEmployee_Transfer` | FR-HRM-007 | 调岗→原部门移除+新部门添加 |
| 3.8 | `TestEmployee_SalesPerformance` | FR-HRM-008 | 按时间范围查询销售业绩 |
| 3.9 | `TestEmployee_SelfService` | FR-ASSIST-003 | 员工自助查询个人信息API |

### Epic 4: CRM客户关系管理 (13 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 4.1 | `TestCustomer_CRUD` | FR-CRM-001 | 客户创建/编辑/删除 |
| 4.2 | `TestCustomer_UniqueName` | FR-CRM-001 | 公司名称唯一约束 |
| 4.3 | `TestCustomer_Fields` | FR-CRM-002 | 客户档案字段完整性 |
| 4.4 | `TestCustomerLevel_CRUD` | FR-CRM-003 | 客户分级管理+自定义规则 |
| 4.5 | `TestCustomerTag_AddRemove` | FR-CRM-004 | 自由标签添加/删除/按标签筛选 |
| 4.6 | `TestCustomer_PanoramaView` | FR-CRM-005 | 全景视图API→联系人+商机+合同+售后+往来款 |
| 4.7 | `TestCustomer_RelatedContracts` | FR-CRM-006 | 客户关联合同查询 |
| 4.8 | `TestCustomer_RelatedServiceOrders` | FR-CRM-007 | 客户关联售后工单查询 |
| 4.9 | `TestCustomer_FinancialSummary` | FR-CRM-008 | 客户往来款汇总 |
| 4.10 | `TestContact_CRUD` | FR-CRM-009 | 联系人CRUD |
| 4.11 | `TestContact_Fields` | FR-CRM-010 | 联系人字段完整性（角色标记/首要联系人） |
| 4.12 | `TestContact_FilterByRole` | FR-CRM-011 | 按角色标记筛选联系人 |
| 4.13 | `TestOpportunity_CRUD` | FR-CRM-012 | 商机CRUD |
| 4.14 | `TestOpportunity_BelongsToCustomer` | FR-CRM-013 | 商机必须归属客户+状态流转 |

### Epic 5: 进销存管理 (27 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 5.1 | `TestMaterial_CRUD` | FR-IMS-001 | 物料SKU CRUD（5种类型） |
| 5.2 | `TestMaterial_Fields` | FR-IMS-002 | 物料字段（规格JSON/单位/单价） |
| 5.3 | `TestSupplier_CRUD` | FR-IMS-003 | 供应商CRUD |
| 5.4 | `TestSupplier_Fields` | FR-IMS-004 | 供应商字段完整性 |
| 5.5 | `TestPurchaseOrder_Create` | FR-IMS-005 | 采购订单创建 |
| 5.6 | `TestPurchaseOrder_Receive` | FR-IMS-005,FR-IMS-008 | 采购入库→库存增加 |
| 5.7 | `TestQualityInspection_Flow` | FR-IMS-006,FR-IMS-007 | 质检流程→不合格退换货 |
| 5.8 | `TestSalesOrder_Create` | FR-IMS-009 | 销售订单创建 |
| 5.9 | `TestSalesOrder_Ship` | FR-IMS-009,FR-IMS-010 | 销售出库→库存扣减 |
| 5.10 | `TestSalesOrder_StockInsufficient` | FR-IMS-010 | 库存不足→禁止出库 |
| 5.11 | `TestInventory_Query` | FR-IMS-011 | 库存查询（当前/在途） |
| 5.12 | `TestInventory_LowStockAlert` | FR-IMS-012 | 低于安全库存→预警 |
| 5.13 | `TestMaterial_HistoricalPricing` | FR-IMS-013 | 物料历史报价查询 |
| 5.14 | `TestMaterial_DifferentialPricing` | FR-IMS-014 | 差异化报价策略 |
| 5.15 | `TestWarehouse_CRUD` | FR-IMS-015 | 多仓库管理 |
| 5.16 | `TestInventory_ByWarehouse` | FR-IMS-016,FR-IMS-023 | 按仓库维度库存管理 |
| 5.17 | `TestStockTransfer_Create` | FR-IMS-017 | 仓库间调拨创建 |
| 5.18 | `TestStockTransfer_Execute` | FR-IMS-017 | 调拨执行→源仓库出库+目标仓库入库 |
| 5.19 | `TestStockTransfer_ActualQuantity` | FR-IMS-018 | 调拨实收数量+差异记录 |
| 5.20 | `TestStockFlow_UnifiedRecord` | FR-IMS-019 | 统一出入库流水（8种类型） |
| 5.21 | `TestStockFlow_BatchExpirySerial` | FR-IMS-020 | 流水含批次号/效期/序列号/规格JSON |
| 5.22 | `TestRequisition_Create` | FR-IMS-021 | 领用申请创建 |
| 5.23 | `TestRequisition_Issue` | FR-IMS-021,FR-IMS-022 | 领用出库+实发数量 |
| 5.24 | `TestInventoryCheck_Create` | FR-IMS-024 | 盘库任务创建（全盘/抽盘） |
| 5.25 | `TestInventoryCheck_DiffCalculation` | FR-IMS-025 | 盘盈盘亏明细自动生成 |
| 5.26 | `TestInventoryCheck_ApproveAdjust` | FR-IMS-026 | 审批后自动生成调整流水 |
| 5.27 | `TestInventoryCheck_ByBatch` | FR-IMS-027 | 按批次号/效期维度盘点 |

### Epic 6: 合同/销售/售后 (30 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 6.1 | `TestContract_CRUD` | FR-CON-001 | 合同CRUD |
| 6.2 | `TestContract_Fields` | FR-CON-002 | 合同字段完整性 |
| 6.3 | `TestContract_LinkCustomerAndOrder` | FR-CON-003 | 合同关联客户+销售订单 |
| 6.4 | `TestContract_UploadAttachment` | FR-CON-004 | 上传合同附件 |
| 6.5 | `TestContract_ApprovalFlow` | FR-CON-005 | 合同审批流 |
| 6.6 | `TestContract_StateMachine` | FR-CON-006 | 状态流转：草稿→审批中→已生效→已履行→已终止 |
| 6.7 | `TestContract_LinkPurchaseOrder` | FR-CON-007 | 合同关联采购订单 |
| 6.8 | `TestContract_BindDelivery` | FR-CON-008 | 合同绑定出库记录 |
| 6.9 | `TestContract_AgentNaturalLanguage` | FR-CON-009 | Agent自然语言修改合同字段 |
| 6.10 | `TestSalesOrder_CRUD` | FR-SALES-001 | 销售订单CRUD |
| 6.11 | `TestSalesOrder_Fields` | FR-SALES-002 | 销售订单字段完整性 |
| 6.12 | `TestSalesOrder_LinkCustomer` | FR-SALES-003 | 销售订单关联客户 |
| 6.13 | `TestSalesOrder_BindContract` | FR-SALES-004 | 销售订单绑定合同 |
| 6.14 | `TestSalesOrder_BindDelivery` | FR-SALES-005 | 销售订单绑定出库记录 |
| 6.15 | `TestSalesOrder_DeliveryFields` | FR-SALES-006 | 出库记录字段 |
| 6.16 | `TestSalesOrder_DeliveryContractLink` | FR-SALES-007 | 出库必须关联合同 |
| 6.17 | `TestSalesOrder_ApprovalFlow` | FR-SALES-008 | 销售订单审批流 |
| 6.18 | `TestSalesOrder_StateMachine` | FR-SALES-009 | 状态流转：草稿→审批中→已确认→已出库→已完成 |
| 6.19 | `TestServiceOrder_CRUD` | FR-SVC-001 | 售后工单CRUD |
| 6.20 | `TestServiceOrder_Fields` | FR-SVC-002 | 工单字段完整性 |
| 6.21 | `TestServiceOrder_TypeFreePaid` | FR-SVC-003 | 工单类型（收费/免费） |
| 6.22 | `TestServiceOrder_QuoteAttachment` | FR-SVC-004,FR-SVC-005 | 收费工单报价单附件 |
| 6.23 | `TestServiceOrder_ConfirmQuote` | FR-SVC-006 | 客户确认报价→进入维修 |
| 6.24 | `TestServiceOrder_RepairOrder` | FR-SVC-007,FR-SVC-008 | 生成维修工单 |
| 6.25 | `TestServiceOrder_CustomerSign` | FR-SVC-009,FR-SVC-010 | 客户签字确认+附件上传 |
| 6.26 | `TestServiceOrder_StateMachine` | FR-SVC-011 | 状态流转：创建→报价中→确认→维修中→待签字→已完成 |
| 6.27 | `TestServiceOrder_UploadAttachment` | FR-SVC-012 | 上传工单附件 |

### Epic 7: 财务管理与审批工作流 (33 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 7.1 | `TestReceivable_Create` | FR-FIN-001 | 应收款创建 |
| 7.2 | `TestReceivable_LinkOrder` | FR-FIN-002 | 应收款关联销售订单/合同 |
| 7.3 | `TestPayable_Create` | FR-FIN-003 | 应付款创建 |
| 7.4 | `TestPayable_LinkPurchase` | FR-FIN-004 | 应付款关联采购订单 |
| 7.5 | `TestPaymentRequest_CRUD` | FR-FIN-005 | 请款申请CRUD |
| 7.6 | `TestPaymentRequest_LinkBusiness` | FR-FIN-006 | 请款关联合同/销售订单 |
| 7.7 | `TestPaymentRequest_UploadAttachment` | FR-FIN-007 | 请款上传附件 |
| 7.8 | `TestPaymentRequest_ApprovalFlow` | FR-FIN-008 | 请款审批流 |
| 7.9 | `TestCollection_Register` | FR-FIN-009 | 回款登记 |
| 7.10 | `TestCollection_PartialAndFull` | FR-FIN-010 | 部分回款+全额回款 |
| 7.11 | `TestCollection_AutoUpdateAmount` | FR-FIN-011 | 回款后自动更新已回款金额 |
| 7.12 | `TestInvoice_Manage` | FR-FIN-012 | 发票管理 |
| 7.13 | `TestInvoice_LinkBusiness` | FR-FIN-013 | 发票关联业务单据 |
| 7.14 | `TestReceivable_Summary` | FR-FIN-014 | 按时间范围应收款汇总 |
| 7.15 | `TestReceivable_OverdueAlert` | FR-FIN-015 | 逾期未回款提醒 |
| 7.16 | `TestContract_PaymentTracking` | FR-FIN-016 | 合同维度回款追踪 |
| 7.17 | `TestContract_PaymentPlan` | FR-FIN-017 | 回款计划（回款周期） |
| 7.18 | `TestContract_PaymentPlanAutoRemind` | FR-FIN-018 | 回款计划到期自动提醒 |
| 7.19 | `TestFinancial_VoucherManage` | FR-FIN-019 | 往来款凭证管理 |
| 7.20 | `TestFinancial_Reconciliation` | FR-FIN-020 | 往来款对账API |
| 7.21 | `TestFinancial_CashFlowForecast` | FR-FIN-021 | 现金流预测API |
| 7.22 | `TestWorkflow_Config` | FR-WF-001 | 配置审批工作流 |
| 7.23 | `TestWorkflow_Fields` | FR-WF-002 | 工作流字段定义 |
| 7.24 | `TestWorkflow_NodeDefinition` | FR-WF-003 | 节点字段定义 |
| 7.25 | `TestWorkflow_SerialApproval` | FR-WF-004 | 串行审批 |
| 7.26 | `TestWorkflow_ParallelApproval` | FR-WF-005 | 并行审批 |
| 7.27 | `TestWorkflow_ConditionalRouting` | FR-WF-006 | 条件路由 |
| 7.28 | `TestWorkflow_ApproverViewAttachment` | FR-WF-007 | 审批人查看附件 |
| 7.29 | `TestWorkflow_ApproverComment` | FR-WF-008 | 审批人填写意见 |
| 7.30 | `TestWorkflow_ApproveRejectTransfer` | FR-WF-009 | 审批结果：通过/拒绝/转交 |
| 7.31 | `TestWorkflow_RejectReturnModify` | FR-WF-010 | 拒绝→返回申请人修改 |
| 7.32 | `TestWorkflow_PendingList` | FR-WF-011 | 待审批列表查询 |
| 7.33 | `TestWorkflow_ApprovalHistory` | FR-WF-012 | 已审批历史查询 |

### Epic 8: 附件/消息/知识库/Skill (35 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 8.1 | `TestFile_Upload` | FR-FILE-001 | 上传附件到业务单据 |
| 8.2 | `TestFile_StoragePath` | FR-FILE-002 | 存储路径：/storage/{enterprise_id}/{module}/{record_id}/ |
| 8.3 | `TestFile_TypeRestriction` | FR-FILE-003 | 支持PDF/图片/Excel/Word |
| 8.4 | `TestFile_SizeLimit` | FR-FILE-004 | 单文件100MB限制 |
| 8.5 | `TestFile_Download` | FR-FILE-005 | 下载附件 |
| 8.6 | `TestFile_PreviewLink` | FR-FILE-006 | 生成预览链接+有效期 |
| 8.7 | `TestFile_PreviewViaAgent` | FR-FILE-007 | 预览链接通过Agent传递 |
| 8.8 | `TestFile_SoftDelete` | FR-FILE-008 | 附件软删除 |
| 8.9 | `TestFile_PdfExportLink` | FR-FILE-009 | 导出PDF附件跳转链接 |
| 8.10 | `TestMessage_SendReceive` | FR-MSG-001 | 消息发送和接收 |
| 8.11 | `TestMessage_Polling` | FR-MSG-002 | CLI轮询获取未读消息 |
| 8.12 | `TestMessage_LocalCache` | FR-MSG-003 | CLI本地缓存未读消息 |
| 8.13 | `TestMessage_SkillTrigger` | FR-MSG-004 | Skill触发消息通知 |
| 8.14 | `TestMessage_MarkRead` | FR-MSG-005 | 标记消息已读 |
| 8.15 | `TestMessage_Announcement` | FR-MSG-006 | 全员公告通知 |
| 8.16 | `TestMessage_AnnouncementReadList` | FR-MSG-007 | 公告已读/未读员工列表 |
| 8.17 | `TestKnowledge_UploadDoc` | FR-KB-001 | 上传文档到知识库 |
| 8.18 | `TestKnowledge_Vectorize` | FR-KB-002 | 文档向量化存储 |
| 8.19 | `TestKnowledge_SemanticSearch` | FR-KB-003 | 语义检索 |
| 8.20 | `TestKnowledge_EnterpriseIsolation` | FR-KB-004 | 知识库企业隔离 |
| 8.21 | `TestKnowledge_CRUD` | FR-KB-005 | 知识库增删改查 |
| 8.22 | `TestSkill_StandardDefinition` | FR-SKILL-001 | 标准化Skill定义 |
| 8.23 | `TestSkill_OpeningMessage` | FR-SKILL-002 | Skill开场白 |
| 8.24 | `TestSkill_OptionMenu` | FR-SKILL-003 | Skill选项菜单 |
| 8.25 | `TestSkill_NaturalLanguageIntent` | FR-SKILL-004 | Agent自然语言意图调用 |
| 8.26 | `TestSkill_CRUDOperations` | FR-SKILL-005 | Skill CRUD操作 |
| 8.27 | `TestSkill_Idempotency` | FR-SKILL-006 | Skill幂等性 |
| 8.28 | `TestSkill_RoleDiffOpening` | FR-SKILL-007 | 基于角色差异化开场白 |
| 8.29 | `TestSkill_FieldDescription` | FR-SKILL-008 | Skill字段说明 |
| 8.30 | `TestKB2_VersionManage` | FR-KB2-001 | 文档版本管理 |
| 8.31 | `TestKB2_DocPermission` | FR-KB2-002 | 文档权限控制 |
| 8.32 | `TestKB2_CategoryAndTag` | FR-KB2-003 | 文档分类与标签 |
| 8.33 | `TestKB2_HybridSearch` | FR-KB2-004 | 混合检索模式 |
| 8.34 | `TestKB2_AutoArchive` | FR-KB2-005 | 自动入档 |
| 8.35 | `TestKB2_AgentContextInject` | FR-KB2-006 | Agent上下文注入 |

### Epic 9: 运营平台与商业闭环 (42 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 9.1 | `TestOps_EnterpriseList` | FR-OP-001 | 运营商查看企业列表和使用情况 |
| 9.2 | `TestOps_ActivatePauseResume` | FR-OP-002 | 激活/暂停/恢复企业服务 |
| 9.3 | `TestOps_FreezeUnfreeze` | FR-OP-003 | 冻结/解冻企业 |
| 9.4 | `TestOps_ExpireRenew` | FR-OP-004 | 标记过期/续费 |
| 9.5 | `TestOps_CancelDelete` | FR-OP-005 | 取消/永久删除企业 |
| 9.6 | `TestOps_StateChangeLog` | FR-OP-006 | 企业状态变更日志 |
| 9.7 | `TestOps_StateBasedAccess` | FR-OP-007 | 不同状态企业API访问权限不同 |
| 9.8 | `TestBilling_SubscriptionPlan` | FR-BILL-001 | 订阅计划管理 |
| 9.9 | `TestBilling_SubscriptionCycle` | FR-BILL-002 | 订阅周期管理 |
| 9.10 | `TestBilling_OnlinePayment` | FR-BILL-003 | 在线支付接入 |
| 9.11 | `TestBilling_AutoRenew` | FR-BILL-004 | 自动续费扣款 |
| 9.12 | `TestBilling_AutoInvoice` | FR-BILL-005 | 账单自动生成 |
| 9.13 | `TestBilling_ViewInvoice` | FR-BILL-006 | 查看历史账单 |
| 9.14 | `TestBilling_OverdueAutoSuspend` | FR-BILL-007 | 欠费自动暂停服务 |
| 9.15 | `TestBilling_Refund` | FR-BILL-008 | 退款处理 |
| 9.16 | `TestBilling_RevenueSummary` | FR-BILL-009 | 收入汇总 |
| 9.17 | `TestBilling_UpgradeDowngrade` | FR-BILL-010 | 升级/降级订阅计划 |
| 9.18 | `TestCS_ActivityScore` | FR-CS-001 | 企业活跃度评分 |
| 9.19 | `TestCS_FeatureAdoption` | FR-CS-002 | 功能采纳率追踪 |
| 9.20 | `TestCS_ChurnWarning` | FR-CS-003 | 流失预警 |
| 9.21 | `TestCS_HealthDashboard` | FR-CS-004 | 客户健康度看板 |
| 9.22 | `TestCS_Milestone` | FR-CS-005 | 企业关键行为里程碑 |
| 9.23 | `TestOpsVC_TemplateManage` | FR-OPSVC-001 | 行业模板管理 |
| 9.24 | `TestOpsVC_TemplateApply` | FR-OPSVC-002 | 行业模板应用到企业 |
| 9.25 | `TestOpsVC_CustomTemplate` | FR-OPSVC-003 | 自定义行业模板 |
| 9.26 | `TestOpsVC_ConfigSkillSet` | FR-OPSVC-004 | 运营商配置Skill集 |
| 9.27 | `TestOpsVC_PreviewMode` | FR-OPSVC-005 | 配置Skill预览模式 |
| 9.28 | `TestOpsVC_ConfigAuditLog` | FR-OPSVC-006 | 配置操作审计日志 |
| 9.29 | `TestOpsVC_EnterpriseSkillMatrix` | FR-OPSVC-007 | 企业专属Skill矩阵 |
| 9.30 | `TestOpsVC_TemplatePresetSkill` | FR-OPSVC-008 | 行业模板预设Skill矩阵 |
| 9.31 | `TestOpsVC_SkillChangeNotify` | FR-OPSVC-009 | Skill矩阵变更通知CLI |
| 9.32 | `TestOpsVC_ConfigEventLink` | FR-OPSVC-010 | 配置与业务事件联动 |
| 9.33 | `TestOpsVC_EnterpriseConfigPanorama` | FR-OPSVC-011 | 企业配置全景图 |
| 9.34 | `TestCust_CustomField` | FR-CUST-001 | 自定义字段 |
| 9.35 | `TestCust_FieldTypes` | FR-CUST-002 | 自定义字段类型 |
| 9.36 | `TestCust_FieldToggle` | FR-CUST-003 | 自定义字段启用/禁用 |
| 9.37 | `TestCust_EntityAttachmentConfig` | FR-CUST-004 | 实体附件支持配置 |
| 9.38 | `TestCust_EntityRelationConfig` | FR-CUST-005 | 实体关联关系配置 |
| 9.39 | `TestCust_OperatorAgentConfig` | FR-CUST-006 | Operator通过Agent配置 |

### Epic 10: 数据智能与私有化部署 (88 FR)

| # | 测试用例 | 覆盖FR | 验证内容 |
|---|---------|--------|---------|
| 10.1 | `TestReport_SalesStats` | FR-REPORT-001 | 销售统计API |
| 10.2 | `TestReport_FinanceStats` | FR-REPORT-002 | 财务统计API |
| 10.3 | `TestReport_InventoryStats` | FR-REPORT-003 | 库存统计API |
| 10.4 | `TestReport_HRStats` | FR-REPORT-004 | 人事统计API |
| 10.5 | `TestReport_MultiDimension` | FR-REPORT-005 | 多维度交叉查询 |
| 10.6 | `TestReport_CrossEnterpriseSummary` | FR-REPORT-006 | 跨企业经营汇总API |
| 10.7 | `TestReport_ScheduledPush` | FR-REPORT-007 | 定时报表生成与推送 |
| 10.8 | `TestReport_GlobalOpsStats` | FR-REPORT-008 | 全局运营统计 |
| 10.9 | `TestOwner_SignalLamp` | FR-OWNER-001 | 经营者信号灯API |
| 10.10 | `TestOwner_AlertSubscribe` | FR-OWNER-002 | 经营者预警订阅 |
| 10.11 | `TestOwner_KeyMetrics` | FR-OWNER-003 | 关键业务指标API |
| 10.12 | `TestOwner_AttributionAnalysis` | FR-OWNER-004 | 归因分析API |
| 10.13 | `TestOwner_ThresholdConfig` | FR-OWNER-005 | 预警阈值配置 |
| 10.14 | `TestOwner_CrossEnterpriseSummary` | FR-OWNER-006 | Group Owner跨企业汇总 |
| 10.15 | `TestAudit_BeforeAfterDiff` | FR-AUDIT-001 | 变更前后值记录 |
| 10.16 | `TestAudit_VersionChain` | FR-AUDIT-002 | 数据版本链查询 |
| 10.17 | `TestAudit_EventStream` | FR-AUDIT-003 | 事件流查询 |
| 10.18 | `TestAudit_SensitiveAlert` | FR-AUDIT-004 | 敏感操作自动告警 |
| 10.19 | `TestAudit_HistoryVersion` | FR-AUDIT-005 | 数据历史版本查看 |
| 10.20 | `TestAudit_Export` | FR-AUDIT-006 | 审计日志导出 |
| 10.21 | `TestImport_Framework` | FR-IMPORT-001 | 通用数据导入框架 |
| 10.22 | `TestImport_TemplateDownload` | FR-IMPORT-002 | 导入模板下载 |
| 10.23 | `TestImport_ValidationReport` | FR-IMPORT-003 | 导入验证与错误报告 |
| 10.24 | `TestImport_DedupMerge` | FR-IMPORT-004 | 重复检测与合并策略 |
| 10.25 | `TestExport_Data` | FR-IMPORT-005 | 数据导出 |
| 10.26 | `TestExport_TemplateConsistency` | FR-IMPORT-006 | 导出模板与导入模板一致 |
| 10.27 | `TestWebhook_Register` | FR-WEBHOOK-001 | Webhook注册与管理 |
| 10.28 | `TestWebhook_EventSubscribe` | FR-WEBHOOK-002 | 事件订阅 |
| 10.29 | `TestWebhook_DeliveryRetry` | FR-WEBHOOK-003 | Webhook投递与重试 |
| 10.30 | `TestWebhook_DeliveryLog` | FR-WEBHOOK-004 | Webhook投递日志 |
| 10.31 | `TestWebhook_SignatureVerify` | FR-WEBHOOK-005 | HMAC-SHA256签名验证 |
| 10.32 | `TestWebhook_EventFilter` | FR-WEBHOOK-006 | 自定义事件过滤 |
| 10.33 | `TestI18N_LanguagePreference` | FR-I18N-001 | 语言偏好设置 |
| 10.34 | `TestI18N_SkillMultiLang` | FR-I18N-002 | Skill定义多语言 |
| 10.35 | `TestI18N_ErrorCodeMultiLang` | FR-I18N-003 | API错误码多语言 |
| 10.36 | `TestI18N_GeneratedFileMultiLang` | FR-I18N-004 | 生成文件多语言 |
| 10.37 | `TestI18N_MessageMultiLang` | FR-I18N-005 | 消息通知多语言 |
| 10.38 | `TestI18N_OperatorManage` | FR-I18N-006 | 运营商管理多语言内容 |
| 10.39 | `TestSec2_MFA` | FR-SEC2-001 | 多因素认证 |
| 10.40 | `TestSec2_DataMasking` | FR-SEC2-002 | 数据脱敏 |
| 10.41 | `TestSec2_OperationUndo` | FR-SEC2-003 | 操作撤销 |
| 10.42 | `TestSec2_BatchOperation` | FR-SEC2-004 | 批量操作API |
| 10.43 | `TestAssist_TodoAggregation` | FR-ASSIST-001 | 统一待办聚合API |
| 10.44 | `TestAssist_ProcessGuide` | FR-ASSIST-002 | 流程指引查询 |
| 10.45 | `TestAssist_QuickSkill` | FR-ASSIST-004 | 员工快捷操作Skill |
| 10.46 | `TestAssist_WorkReport` | FR-ASSIST-005 | 一键生成工作报告 |
| 10.47 | `TestCLI_InitCommand` | FR-CLI-001 | ao-cli init初始化命令 |
| 10.48 | `TestCLI_DownloadSkill` | FR-CLI-002 | 下载企业专属Skill定义 |
| 10.49 | `TestCLI_GenerateClaudeMD` | FR-CLI-003 | 生成CLAUDE.md |
| 10.50 | `TestCLI_GenerateAgentMD` | FR-CLI-004 | 生成agent.md |
| 10.51 | `TestCLI_UpdateCommand` | FR-CLI-005 | ao-cli init --update |
| 10.52 | `TestCLI_TemplateCustomize` | FR-CLI-006 | CLAUDE.md/agent.md客制化 |
| 10.53 | `TestCLI_GenerateReadme` | FR-CLI-007 | 生成README.md |
| 10.54 | `TestCLI_ServerRenderReadme` | FR-CLI-008 | README.md服务端模板渲染 |
| 10.55 | `TestDeploy_DockerCompose` | FR-DEPLOY-001 | 跨平台Docker Compose部署 |
| 10.56 | `TestDeploy_NativeBinary` | FR-DEPLOY-002 | 原生二进制部署 |
| 10.57 | `TestDeploy_CustomPort` | FR-DEPLOY-003 | 指定端口部署 |
| 10.58 | `TestDeploy_CustomDataDir` | FR-DEPLOY-004 | 指定数据目录 |
| 10.59 | `TestDeploy_DeployCommand` | FR-DEPLOY-005 | ao-cli deploy部署引导 |
| 10.60 | `TestDeploy_TLSSelfSigned` | FR-DEPLOY-006 | TLS自签名证书部署 |
| 10.61 | `TestDeploy_OnlineUpgrade` | FR-DEPLOY-007 | 私有化部署在线升级 |
| 10.62 | `TestDeploy_HealthCheckAPI` | FR-DEPLOY-008 | 私有化部署健康检查API |

---

## L2: E2E测试清单（Agent对话模拟，按User Journey）

| # | 测试用例 | 覆盖Journey | 验证内容 |
|---|---------|------------|---------|
| E2E.1 | `TestJourney_OperatorInitPlatform` | Journey 1 | Operator: 创建集团→创建企业→配置管理员→监控运营 |
| E2E.2 | `TestJourney_OwnerMultiEnterprise` | Journey 2 | GroupOwner: 登录→查看企业列表→切换A公司→查看销售→切换B公司→跨企业汇总 |
| E2E.3 | `TestJourney_AdminInitEnterprise` | Journey 3 | Admin: 创建部门→设置经理→批量导入员工→配置审批流→测试功能 |
| E2E.4 | `TestJourney_ManagerDepartment` | Journey 4 | Manager: 查看本月订单→处理审批→查看业绩→收到通知 |
| E2E.5 | `TestJourney_EmployeeDaily` | Journey 5 | Employee: 查看个人信息→提交请假→经理审批→收到通知 |
| E2E.6 | `TestJourney_AgentBusinessFlow` | Journey 6 | Agent: 获取待审批→展示摘要→逐个审批→反馈结果 |
| E2E.7 | `TestJourney_CLIPolling` | Journey 7 | CLI: 启动轮询→检测新消息→通知Agent→标记已读 |
| E2E.8 | `TestJourney_CrossDepartment` | Journey 8 | 销售查库存→签合同→通知生产部→生产部收到消息 |

---

## L3: NFR验证清单

| # | 测试用例 | 覆盖NFR | 验证方法 |
|---|---------|---------|---------|
| NFR.1 | `TestPerformance_APIResponseTime` | NFR-PERF-001 | 并发100请求，P95 < 500ms |
| NFR.2 | `TestPerformance_ConcurrentAgent` | NFR-PERF-002 | 每企业100并发请求无错误 |
| NFR.3 | `TestSecurity_HTTPSOnly` | NFR-SEC-001 | HTTP请求→重定向/拒绝 |
| NFR.4 | `TestSecurity_BcryptPassword` | NFR-SEC-002 | 密码存储bcrypt不可逆 |
| NFR.5 | `TestSecurity_TenantIsolation` | NFR-SEC-003 | 跨租户数据查询→空结果 |
| NFR.6 | `TestSecurity_EveryAPIRBAC` | NFR-SEC-004 | 所有受保护端点→无权限返回403 |
| NFR.7 | `TestSecurity_SQLInjection` | NFR-SEC-005 | 注入payload→参数化查询安全 |
| NFR.8 | `TestSecurity_FileUploadSafety` | NFR-SEC-006 | 非法文件类型→拒绝 |
| NFR.9 | `TestReliability_TransactionConsistency` | NFR-REL-004 | 库存/金额操作→事务一致性 |
| NFR.10 | `TestExtensibility_ModularArchitecture` | NFR-EXT-001 | 模块独立部署验证 |
| NFR.11 | `TestIntegration_OpenAPI3Coverage` | NFR-INT-001 | API文档100%覆盖 |
| NFR.12 | `TestObservability_StructuredLog` | NFR-OBS-001 | 日志JSON格式+request_id |
| NFR.13 | `TestDeploy_DockerComposeUp` | NFR-DEP-003 | docker-compose up→所有服务启动 |

---

## 统计

| 层级 | 测试文件数 | 测试用例数 | 覆盖FR数 |
|------|-----------|-----------|---------|
| L1 集成测试 | 10 | 273 | 286 |
| L2 E2E测试 | 8 | 8 | 8个Journey |
| L3 NFR验证 | 2 | 13 | 全部NFR |
| **合计** | **20** | **294** | **286 FR + 全部NFR** |
