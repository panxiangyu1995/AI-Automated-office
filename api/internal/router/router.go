package router

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/handler"
	"github.com/ai-office/api/internal/middleware"
	"github.com/ai-office/api/internal/repository"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/auth"
	"github.com/ai-office/api/pkg/config"
	"github.com/ai-office/api/pkg/observability"
	"github.com/ai-office/api/pkg/ratelimit"
	"github.com/ai-office/api/pkg/rbac"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(cfg *config.Config, logger *zap.Logger, db *gorm.DB) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	observability.InitTracing("ai-office-api", "")

	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Metrics())
	r.Use(middleware.Tracing())
	r.Use(middleware.CORS(cfg.Server.CORSOrigins))
	r.Use(middleware.Tenant())

	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/v1")
	{
		healthHandler := handler.NewHealthHandler()
		api.GET("/health", healthHandler.Health)
		api.GET("/ready", healthHandler.Ready)
	}

	var backupService *service.BackupService
	var quotaService *service.QuotaService
	if db != nil {
		userRepo := repository.NewUserRepository(db)

		groupRepo := repository.NewGroupRepository(db)
		groupService := service.NewGroupService(groupRepo, userRepo, jwtManager)
		groupHandler := handler.NewGroupHandler(groupService)

		enterpriseRepo := repository.NewEnterpriseRepository(db)
		enterpriseService := service.NewEnterpriseService(enterpriseRepo, db)
		enterpriseHandler := handler.NewEnterpriseHandler(enterpriseService)
		deptRepo := repository.NewDepartmentRepository(db)

		deptService := service.NewDepartmentService(deptRepo)
		deptHandler := handler.NewDepartmentHandler(deptService)

		empRepo := repository.NewEmployeeRepository(db)
		empService := service.NewEmployeeServiceWithUser(empRepo, deptRepo, userRepo)
		empHandler := handler.NewEmployeeHandler(empService)

		positionRepo := repository.NewPositionRepository(db)
		positionService := service.NewPositionService(positionRepo)
		positionHandler := handler.NewPositionHandler(positionService)

		crossEnterpriseRepo := repository.NewCrossEnterpriseRepository(db)
		crossEnterpriseService := service.NewCrossEnterpriseService(crossEnterpriseRepo)
		crossEnterpriseHandler := handler.NewCrossEnterpriseHandler(crossEnterpriseService)

		empPermRepo := repository.NewEmployeePermissionRepository(db)
		empPermService := service.NewEmployeePermissionService(empPermRepo)
		empPermHandler := handler.NewEmployeePermissionHandler(empPermService)

		summaryService := service.NewSummaryService(enterpriseRepo, empRepo, deptRepo)
		summaryHandler := handler.NewSummaryHandler(summaryService)

		authService := service.NewAuthServiceFull(userRepo, enterpriseRepo, crossEnterpriseRepo, jwtManager)
		authHandler := handler.NewAuthHandlerWithEmployee(authService, empService)

		customerRepo := repository.NewCustomerRepository(db)
		customerService := service.NewCustomerService(customerRepo)
		customerHandler := handler.NewCustomerHandler(customerService)

		customerLevelRepo := repository.NewCustomerLevelRepository(db)
		customerLevelService := service.NewCustomerLevelService(customerLevelRepo)
		customerLevelHandler := handler.NewCustomerLevelHandler(customerLevelService)

		customerTagRepo := repository.NewCustomerTagRepository(db)
		customerTagService := service.NewCustomerTagService(customerTagRepo, customerRepo)
		customerTagHandler := handler.NewCustomerTagHandler(customerTagService)

		contactRepo := repository.NewContactRepository(db)
		contactService := service.NewContactService(contactRepo, customerRepo)
		contactHandler := handler.NewContactHandler(contactService)

		oppRepo := repository.NewOpportunityRepository(db)
		oppService := service.NewOpportunityService(oppRepo, customerRepo)
		oppHandler := handler.NewOpportunityHandler(oppService)

		matRepo := repository.NewMaterialRepository(db)
		matService := service.NewMaterialService(matRepo)
		matHandler := handler.NewMaterialHandler(matService)

		supRepo := repository.NewSupplierRepository(db)
		supService := service.NewSupplierService(supRepo)
		supHandler := handler.NewSupplierHandler(supService)

		whRepo := repository.NewWarehouseRepository(db)
		whService := service.NewWarehouseService(whRepo)
		whHandler := handler.NewWarehouseHandler(whService)

		invRepo := repository.NewInventoryRepository(db)
		invService := service.NewInventoryService(invRepo, matRepo, whRepo)
		invHandler := handler.NewInventoryHandler(invService)

		orderSvc := service.NewOrderService(db, invRepo, matRepo, whRepo, supRepo, customerRepo)
		orderHandler := handler.NewOrderHandler(orderSvc)

		contractSvc := service.NewContractService(db)
		contractHandler := handler.NewContractHandler(contractSvc)

		financeHandler := handler.NewFinanceHandler(db)
		knowledgeHandler := handler.NewKnowledgeHandler(db)
		opsHandler := handler.NewOperationsHandler(db)

		auditLogRepo := repository.NewAuditLogRepository(db)
		auditLogService := service.NewAuditLogService(auditLogRepo)
		auditLogHandler := handler.NewAuditLogHandler(auditLogService)

		auditMiddleware := middleware.NewAuditMiddleware(auditLogService)

		backupConfigRepo := repository.NewBackupConfigRepository(db)
		backupRecordRepo := repository.NewBackupRecordRepository(db)
		backupService = service.NewBackupService(
			backupConfigRepo, backupRecordRepo,
			cfg.Database.Host, fmt.Sprintf("%d", cfg.Database.Port), cfg.Database.User, cfg.Database.Password, cfg.Database.DBName,
			cfg.Server.BackupDir,
		)
		backupHandler := handler.NewBackupHandler(backupService)

		apiQuotaRepo := repository.NewApiQuotaRepository(db)
		featureFlagRepo := repository.NewFeatureFlagRepository(db)
		quotaService = service.NewQuotaService(apiQuotaRepo, featureFlagRepo)
		quotaHandler := handler.NewQuotaHandler(quotaService)
		quotaMiddleware := middleware.NewQuotaMiddleware(quotaService)
		featureFlagMiddleware := middleware.NewFeatureFlagMiddleware(quotaService)

		rateLimiter := ratelimit.NewRateLimiter()
		rateLimitMiddleware := middleware.NewRateLimitMiddleware(rateLimiter)

		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		operatorOnly := middleware.RequirePermission(rbac.PermSystemConfig)

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtManager), auditMiddleware.Record(), quotaMiddleware.Check(), rateLimitMiddleware.Check())
		{
			protected.POST("/auth/switch-enterprise", authHandler.SwitchEnterprise)
			protected.GET("/me", authHandler.Me)
			protected.GET("/me/profile", authHandler.MeProfile)
			protected.GET("/audit-logs", auditLogHandler.List)
			protected.POST("/cross-enterprise/permissions", crossEnterpriseHandler.Grant)
			protected.DELETE("/cross-enterprise/permissions/:id", crossEnterpriseHandler.Revoke)
			protected.GET("/cross-enterprise/permissions", crossEnterpriseHandler.ListByUser)
			protected.GET("/groups/:group_id/summary", summaryHandler.GroupSummary)

			groups := protected.Group("/groups")
			groups.Use(operatorOnly)
			{
				groups.POST("", groupHandler.Create)
				groups.PUT("/:id", groupHandler.Update)
				groups.DELETE("/:id", groupHandler.Delete)
				groups.GET("", groupHandler.List)
				groups.GET("/:id", groupHandler.Get)
			}

			enterprises := protected.Group("/enterprises")
			enterprises.Use(operatorOnly)
			{
				enterprises.POST("", enterpriseHandler.Create)
				enterprises.PUT("/:id", enterpriseHandler.Update)
				enterprises.GET("", enterpriseHandler.List)
				enterprises.GET("/:id", enterpriseHandler.Get)
			}
			protected.GET("/quota", quotaHandler.GetQuota)
			protected.PUT("/quota", quotaHandler.UpdateQuota)
			protected.GET("/features", quotaHandler.ListFeatures)
			protected.PUT("/features/:key", quotaHandler.UpdateFeature)

			enterprise := protected.Group("/enterprises/:enterprise_id")
			{
				enterprise.GET("/departments/tree", deptHandler.GetTree)
				enterprise.POST("/departments", deptHandler.Create)
			}
			enterprise.POST("/employees", empHandler.Create)
			enterprise.POST("/employees/batch-import", empHandler.BatchImport)
			enterprise.GET("/employees", empHandler.List)
			enterprise.GET("/employees/sales-performance", empHandler.SalesPerformance)
			enterprise.POST("/customers", customerHandler.Create)
			enterprise.GET("/customers", customerHandler.List)
			enterprise.POST("/customer-levels", customerLevelHandler.Create)
			enterprise.GET("/customer-levels", customerLevelHandler.List)
			enterprise.POST("/customers/:customer_id/tags", customerTagHandler.AddTag)
			enterprise.POST("/customers/:customer_id/contacts", contactHandler.Create)
			enterprise.GET("/customers/:customer_id/contacts", contactHandler.ListByCustomer)
			enterprise.GET("/customers/:customer_id/opportunities", oppHandler.ListByCustomer)
			enterprise.POST("/opportunities", oppHandler.Create)
			enterprise.POST("/materials", matHandler.Create)
			enterprise.GET("/materials", matHandler.List)
			enterprise.POST("/suppliers", supHandler.Create)
			enterprise.GET("/suppliers", supHandler.List)
			enterprise.POST("/warehouses", whHandler.Create)
			enterprise.GET("/warehouses", whHandler.List)
			enterprise.GET("/inventory/low-stock", invHandler.LowStock)
			enterprise.POST("/inventory", invHandler.Set)
			enterprise.GET("/inventory/warehouses/:warehouse_id", invHandler.ByWarehouse)
			enterprise.GET("/inventory/materials/:material_id", invHandler.ByMaterial)
			enterprise.POST("/purchase-orders", orderHandler.CreatePurchaseOrder)
			enterprise.POST("/sales-orders", orderHandler.CreateSalesOrder)
			enterprise.POST("/transfers", orderHandler.CreateTransfer)
			enterprise.POST("/requisitions", orderHandler.CreateRequisition)
			enterprise.GET("/orders", orderHandler.ListOrders)
			enterprise.GET("/stock-flows", orderHandler.ListStockFlows)
			enterprise.POST("/contracts", contractHandler.Create)
			enterprise.GET("/contracts", contractHandler.List)
			enterprise.POST("/payments", financeHandler.CreatePayment)
			enterprise.GET("/payments", financeHandler.ListPayments)
			enterprise.POST("/expenses", financeHandler.CreateExpense)
			enterprise.GET("/expenses", financeHandler.ListExpenses)
			enterprise.POST("/invoices", financeHandler.CreateInvoice)
			enterprise.GET("/invoices", financeHandler.ListInvoices)
			enterprise.POST("/files", knowledgeHandler.UploadFile)
			enterprise.GET("/files", knowledgeHandler.ListFiles)
			enterprise.POST("/messages", knowledgeHandler.SendMessage)
			enterprise.GET("/messages", knowledgeHandler.ListMessages)
			enterprise.POST("/kb/docs", knowledgeHandler.CreateDoc)
			enterprise.GET("/kb/docs", knowledgeHandler.ListDocs)
			protected.GET("/dashboard", opsHandler.Dashboard)
			protected.GET("/subscription-plans", opsHandler.ListPlans)
			protected.POST("/subscription-plans", opsHandler.CreatePlan)
			protected.GET("/enterprise-subscriptions", opsHandler.ListSubs)
			protected.POST("/enterprise-subscriptions", opsHandler.CreateSub)
			protected.GET("/webhooks", opsHandler.ListWebhooks)
			protected.POST("/webhooks", opsHandler.CreateWebhook)
			protected.GET("/audit-log-entries", opsHandler.ListAuditLogs)
			enterprise.POST("/kb/categories", knowledgeHandler.CreateCategory)
			enterprise.GET("/kb/categories", knowledgeHandler.ListCategories)
			enterprise.GET("/customers/:customer_id/tags", customerTagHandler.ListByCustomer)
			enterprise.GET("/customer-tags", customerTagHandler.ListByEnterprise)
			enterprise.POST("/positions", positionHandler.Create)
			enterprise.GET("/positions", positionHandler.List)
			protected.GET("/customers/:id", customerHandler.Get)
			protected.PUT("/customers/:id", customerHandler.Update)
			protected.DELETE("/customers/:id", customerHandler.Delete)
			protected.DELETE("/customers/:customer_id/tags", customerTagHandler.RemoveTag)
			protected.PUT("/contacts/:id", contactHandler.Update)
			protected.DELETE("/contacts/:id", contactHandler.Delete)
			protected.PUT("/opportunities/:id", oppHandler.Update)
			protected.DELETE("/opportunities/:id", oppHandler.Delete)
			protected.GET("/materials/:id", matHandler.Get)
			protected.PUT("/materials/:id", matHandler.Update)
			protected.DELETE("/materials/:id", matHandler.Delete)
			protected.GET("/suppliers/:id", supHandler.Get)
			protected.PUT("/suppliers/:id", supHandler.Update)
			protected.DELETE("/suppliers/:id", supHandler.Delete)
			protected.GET("/warehouses/:id", whHandler.Get)
			protected.PUT("/warehouses/:id", whHandler.Update)
			protected.DELETE("/warehouses/:id", whHandler.Delete)
			protected.POST("/purchase-orders/:id/receive", orderHandler.ReceivePurchase)
			protected.POST("/sales-orders/:id/ship", orderHandler.ShipSalesOrder)
			protected.POST("/transfers/:id/execute", orderHandler.ExecuteTransfer)
			protected.POST("/requisitions/:id/issue", orderHandler.IssueRequisition)
			protected.GET("/contracts/:id", contractHandler.Get)
			protected.PUT("/contracts/:id", contractHandler.Update)
			protected.DELETE("/contracts/:id", contractHandler.Delete)
			protected.PATCH("/contracts/:id/status", contractHandler.ChangeStatus)
			protected.PUT("/materials/:id", matHandler.Update)
			protected.DELETE("/materials/:id", matHandler.Delete)
			protected.PUT("/customer-levels/:id", customerLevelHandler.Update)
			protected.DELETE("/customer-levels/:id", customerLevelHandler.Delete)
			protected.PUT("/positions/:id", positionHandler.Update)
			protected.PUT("/employees/:id", empHandler.Update)
			protected.DELETE("/employees/:id", empHandler.Delete)
			protected.GET("/employees/:id", empHandler.Get)
			protected.PUT("/employees/:id/transfer", empHandler.Transfer)
			protected.POST("/employees/:employee_id/permissions", empPermHandler.Set)
			protected.DELETE("/employees/:employee_id/permissions", empPermHandler.Revoke)
			protected.GET("/employees/:employee_id/permissions", empPermHandler.List)

			protected.PUT("/departments/:id", deptHandler.Update)
			protected.PUT("/departments/:id/manager", deptHandler.SetManager)
			protected.DELETE("/departments/:id", deptHandler.Delete)

			backup := protected.Group("/backup")
			backup.Use(featureFlagMiddleware.Require("backup"))
			{
				backup.POST("/configs", backupHandler.CreateConfig)
				backup.PUT("/configs/:id", backupHandler.UpdateConfig)
				backup.DELETE("/configs/:id", backupHandler.DeleteConfig)
				backup.GET("/configs", backupHandler.ListConfigs)
				backup.GET("/configs/:id", backupHandler.GetConfig)
				backup.GET("/records", backupHandler.ListRecords)
				backup.POST("/trigger", backupHandler.TriggerBackup)
				backup.POST("/restore/:record_id", backupHandler.Restore)
			}
		}
	}

	if backupService != nil {
		go func() {
			ticker := time.NewTicker(1 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				backupService.CheckAndRunScheduled()
			}
		}()
	}

	return r
}
