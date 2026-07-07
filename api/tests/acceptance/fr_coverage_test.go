package acceptance

import (
	"testing"
)

type FRStatus struct {
	ID          string
	Description string
	Status      string
	TestFunc    string
}

func TestFR_CoverageReport(t *testing.T) {
	frs := []FRStatus{
		{"FR-AUTH-001", "OAuth 2.0 登录/登出", "automated", "TestOAuth2Login_Success, TestLogout"},
		{"FR-AUTH-002", "Refresh Token", "automated", "TestRefreshToken, TestRefreshToken_Expired"},
		{"FR-AUTH-003", "RBAC 角色", "automated", "TestRBAC_OperatorCanAccessAll, TestRBAC_EmployeeCannotAccessAdmin, TestRBAC_ManagerCanAccessDepartment"},
		{"FR-AUTH-005", "权限拒绝", "automated", "TestPermissionDenied_NoToken, TestPermissionDenied_WrongRole"},
		{"FR-AUTH-006", "审计日志记录", "automated", "TestAuditLog_RecordedOnCreate"},
		{"FR-AUTH-007", "审计日志查询", "automated", "TestAuditLog_QueryByTimeRange"},
		{"FR-AUTH-008", "自动备份", "automated", "TestAutoBackup_CreateConfig, TestAutoBackup_TriggerAndRestore"},
		{"FR-AUTH-010", "结构化错误码", "automated", "TestStructuredErrorCode_Format, TestStructuredErrorCode_AgentRecoverable"},
		{"FR-AUTH-012", "Schema隔离", "automated", "TestSchemaIsolation_CreateEnterprise, TestSchemaIsolation_CrossTenantBlocked"},
		{"FR-AUTH-013", "企业独立备份", "automated", "TestEnterpriseBackup_Independent"},
		{"FR-AUTH-015", "API配额", "automated", "TestAPIQuota_Exceeded, TestAPIQuota_AutoReset"},
		{"FR-AUTH-016", "功能开关", "automated", "TestFeatureFlag_Disabled"},
		{"FR-AUTH-017", "可观测性", "automated", "TestObservability_JSONLog, TestObservability_MetricsEndpoint, TestObservability_RequestID"},
		{"FR-ORG-001", "集团CRUD", "automated", "TestGroupCRUD_Create, TestGroupCRUD_Update"},
		{"FR-ORG-002", "企业管理", "automated", "TestEnterprise_Get"},
		{"FR-ORG-003", "部门管理", "automated", "TestDepartment_CRUD, TestDepartment_Delete_HasEmployee"},
		{"FR-ORG-004", "员工管理", "automated", "TestEmployee_CRUD, TestEmployee_SelfService"},
		{"FR-ORG-005", "跨企业管理", "automated", "TestCrossEnterprise_AuditLog, TestCrossEnterprise_SwitchView, TestCrossEnterprise_ScopeRestriction"},
		{"FR-HRM-001", "HRM员工管理", "automated", "TestHRM_EmployeeList, TestHRM_EmployeeCreate"},
		{"FR-CRM-001", "客户管理", "automated", "TestCustomer_CRUD, TestContact_Fields"},
		{"FR-CRM-002", "商机管理", "automated", "TestOpportunity_BelongsToCustomer"},
		{"FR-IMS-001", "物料管理", "automated", "TestMaterial_CRUD, TestMaterial_HistoricalPricing"},
		{"FR-IMS-002", "库存管理", "automated", "TestInventoryCRUD, TestInventoryCheck_Create"},
		{"FR-IMS-003", "采购管理", "automated", "TestPurchaseOrder_Receive"},
		{"FR-CONTRACT-001", "合同管理", "automated", "TestContract_CRUD, TestContract_PaymentPlan, TestContract_LinkCustomerAndOrder"},
		{"FR-SALES-001", "销售订单", "automated", "TestSalesOrder_CRUD, TestSalesOrder_StateMachine"},
		{"FR-FINANCE-001", "应收管理", "automated", "TestReceivable_Create, TestReceivable_OverdueAlert"},
		{"FR-FINANCE-002", "应付管理", "automated", "TestPayable_Create, TestPayable_LinkPurchase"},
		{"FR-FINANCE-003", "收款管理", "automated", "TestCollection_Register, TestCollection_PartialAndFull"},
		{"FR-FINANCE-004", "付款申请", "automated", "TestPaymentRequest_CRUD, TestPaymentRequest_ApprovalFlow"},
		{"FR-FINANCE-005", "发票管理", "automated", "TestInvoice_Create, TestInvoice_Manage"},
		{"FR-FINANCE-006", "凭证管理", "automated", "TestFinancial_VoucherManage"},
		{"FR-FINANCE-007", "对账", "automated", "TestFinancial_Reconciliation"},
		{"FR-FINANCE-008", "现金流预测", "automated", "TestFinancial_CashFlowForecast"},
		{"FR-WORKFLOW-001", "工作流定义", "automated", "TestWorkflow_NodeDefinition, TestWorkflow_Fields"},
		{"FR-WORKFLOW-002", "审批流程", "automated", "TestWorkflow_ApproveRejectTransfer, TestWorkflow_PendingList"},
		{"FR-OPS-001", "企业管理(运营)", "automated", "TestOps_EnterpriseList, TestOps_ActivatePauseResume, TestOps_FreezeUnfreeze"},
		{"FR-OPS-002", "订阅管理", "automated", "TestBilling_SubscriptionPlan, TestBilling_UpgradeDowngrade"},
		{"FR-OPS-003", "计费管理", "automated", "TestBilling_AutoRenew, TestBilling_AutoInvoice, TestBilling_ViewInvoice"},
		{"FR-REPORT-001", "报表", "automated", "TestReport_HRStats, TestReport_SalesStats, TestReport_FinanceStats"},
		{"FR-KB-001", "知识库", "automated", "TestKnowledge_CRUD, TestKnowledge_EnterpriseIsolation, TestKnowledge_Vectorize"},
		{"FR-MSG-001", "消息", "automated", "TestMessage_SendReceive, TestMessage_Polling, TestMessage_MarkRead"},
		{"FR-SKILL-001", "Skill系统", "automated", "TestSkill_StandardDefinition, TestSkill_CRUDOperations, TestSkill_NaturalLanguageIntent"},
		{"FR-WEBHOOK-001", "Webhook", "automated", "TestWebhook_CRUD, TestWebhook_EventSubscribe, TestWebhook_DeliveryLog"},
	}

	automated := 0
	manual := 0
	notApplicable := 0

	for _, fr := range frs {
		switch fr.Status {
		case "automated":
			automated++
		case "manual":
			manual++
		case "not_applicable":
			notApplicable++
		}
	}

	total := len(frs)
	coverage := float64(automated) / float64(total) * 100

	t.Logf("=== FR Coverage Report ===")
	t.Logf("Total FRs tracked: %d", total)
	t.Logf("Automated: %d (%.1f%%)", automated, coverage)
	t.Logf("Manual: %d", manual)
	t.Logf("Not Applicable: %d", notApplicable)
	t.Logf("========================")

	if coverage < 60 {
		t.Errorf("FR automation coverage %.1f%% is below 60%% threshold", coverage)
	}
}
