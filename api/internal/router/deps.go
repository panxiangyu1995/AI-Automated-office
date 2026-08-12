package router

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/handler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
)

type RouterDeps struct {
	AuthHandler              *handler.AuthHandler
	DeviceAuthHandler        *handler.DeviceAuthHandler
	GroupHandler             *handler.GroupHandler
	EnterpriseHandler        *handler.EnterpriseHandler
	DeptHandler              *handler.DepartmentHandler
	EmpHandler               *handler.EmployeeHandler
	PositionHandler          *handler.PositionHandler
	CrossEnterpriseHandler   *handler.CrossEnterpriseHandler
	EmpPermHandler           *handler.EmployeePermissionHandler
	PermHandler              *handler.PermissionHandler
	RoleHandler              *handler.RoleHandler
	SummaryHandler           *handler.SummaryHandler
	CustomerHandler          *handler.CustomerHandler
	CustomerLevelHandler     *handler.CustomerLevelHandler
	CustomerTagHandler       *handler.CustomerTagHandler
	ContactHandler           *handler.ContactHandler
	OppHandler               *handler.OpportunityHandler
	MatHandler               *handler.MaterialHandler
	SupHandler               *handler.SupplierHandler
	WhHandler                *handler.WarehouseHandler
	InvHandler               *handler.InventoryHandler
	ContractHandler          *handler.ContractHandler
	OrderHandler             *handler.OrderHandler
	FinanceHandler           *handler.FinanceHandler
	PaymentRequestHandler    *handler.PaymentRequestHandler
	CollectionHandler        *handler.CollectionHandler
	PaymentPlanHandler       *handler.PaymentPlanHandler
	CashFlowHandler          *handler.CashFlowHandler
	ReconciliationHandler    *handler.ReconciliationHandler
	RepairOrderHandler       *handler.RepairOrderHandler
	OwnerHandler             *handler.OwnerHandler
	ServiceOrderHandler      *handler.ServiceOrderHandler
	HealthDashboardHandler   *handler.HealthDashboardHandler
	RestoreHandler           *handler.RestoreHandler
	KnowledgeHandler         *handler.KnowledgeHandler
	MsgHandler               *handler.MessageHandler
	WfHandler                *handler.WorkflowHandler
	FileHandler              *handler.FileHandler
	SkillHandler             *handler.SkillHandler
	CustomFieldHandler       *handler.CustomFieldHandler
	NotificationHandler      *handler.NotificationHandler
	OperationsHandler        *handler.OperationsHandler
	AIHandler                *handler.AIHandler
	AuditLogHandler          *handler.AuditLogHandler
	ExportHandler            *handler.ExportHandler
	BackupHandler            *handler.BackupHandler
	QuotaHandler             *handler.QuotaHandler
	QualityInspectionHandler *handler.QualityInspectionHandler
	AssistHandler            *handler.AssistHandler
	BillingHandler           *handler.BillingHandler
	MFAHandler               *handler.MFAHandler
	MaskingHandler           *handler.MaskingHandler
	BatchHandler             *handler.BatchHandler
	UndoHandler              *handler.UndoHandler
	TemplateHandler          *handler.TemplateHandler
	EnterpriseSkillHandler   *handler.EnterpriseSkillHandler
	OperatorAuditHandler     *handler.OperatorAuditHandler
	TemplateRenderHandler    *handler.TemplateRenderHandler
	OperatorLogHandler       *handler.OperatorLogHandler

	DebugHandler     *handler.DebugHandler
	DebugLogService  *service.DebugLogService
	DebugStubService *service.DebugStubService

	AuditMiddleware       *middleware.AuditMiddleware
	QuotaMiddleware       *middleware.QuotaMiddleware
	FeatureFlagMiddleware *middleware.FeatureFlagMiddleware
	RateLimitMiddleware   *middleware.RateLimitMiddleware

	CrossEnterpriseRepo repository.CrossEnterpriseRepository

	BackupService           *service.BackupService
	ReminderPaymentPlanSvc  *service.PaymentPlanService
	BillingService          *service.BillingService
	ExportWorker            *service.ExportWorker
	UndoService             *service.UndoService
	AutoArchiveService      *service.AutoArchiveService
	ContextInjectionService *service.ContextInjectionService
	TokenBlacklist          *rc.TokenBlacklist
}
