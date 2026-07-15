package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/handler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/ratelimit"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
	"gorm.io/gorm"
)

func SetupTestRouter(db *gorm.DB, jwtManager *auth.JWTManager) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(nil))
	r.Use(middleware.Tenant())

	api := r.Group("/api/v1")
	{
		healthHandler := handler.NewHealthHandler()
		api.GET("/health", healthHandler.Health)
		api.GET("/ready", healthHandler.Ready)
	}

	if db == nil {
		return r
	}

	userRepo := repository.NewUserRepository(db)
	groupRepo := repository.NewGroupRepository(db)
	groupService := service.NewGroupService(groupRepo, userRepo, jwtManager)
	groupHandler := handler.NewGroupHandler(groupService)

	enterpriseRepo := repository.NewEnterpriseRepository(db)
	schemaManager := repository.NewSchemaManager(db)
	enterpriseService := service.NewEnterpriseService(enterpriseRepo, schemaManager)
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

	authService := service.NewAuthServiceFull(userRepo, enterpriseRepo, crossEnterpriseRepo, jwtManager, nil)
	authHandler := handler.NewAuthHandlerFull(authService, empService, nil, jwtManager)

	customerRepo := repository.NewCustomerRepository(db)
	customerService := service.NewCustomerService(customerRepo)
	contactRepo := repository.NewContactRepository(db)
	oppRepo := repository.NewOpportunityRepository(db)
	panoramaService := service.NewCustomerPanoramaService(customerRepo, contactRepo, oppRepo, repository.NewContractRepository(db), repository.NewServiceOrderRepository(db))
	customerHandler := handler.NewCustomerHandler(customerService, panoramaService)

	customerLevelRepo := repository.NewCustomerLevelRepository(db)
	customerLevelService := service.NewCustomerLevelService(customerLevelRepo)
	customerLevelHandler := handler.NewCustomerLevelHandler(customerLevelService)

	customerTagRepo := repository.NewCustomerTagRepository(db)
	customerTagService := service.NewCustomerTagService(customerTagRepo, customerRepo)
	customerTagHandler := handler.NewCustomerTagHandler(customerTagService)

	contactService := service.NewContactService(contactRepo, customerRepo)
	contactHandler := handler.NewContactHandler(contactService)

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

	contractRepo := repository.NewContractRepository(db)
	contractSvc := service.NewContractService(contractRepo)
	contractHandler := handler.NewContractHandler(contractSvc, nil)

	qiRepo := repository.NewQualityInspectionRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	orderSvc := service.NewOrderService(orderRepo, invRepo, matRepo, whRepo, supRepo, customerRepo, qiRepo)
	orderHandler := handler.NewOrderHandler(orderSvc, contractSvc, nil)

	financeRepo := repository.NewFinanceRepository(db)
	financeSvc := service.NewFinanceService(financeRepo)
	financeHandler := handler.NewFinanceHandler(financeSvc)

	knowledgeRepo := repository.NewKnowledgeRepository(db)
	knowledgeSvc := service.NewKnowledgeService(knowledgeRepo)
	knowledgeVersionSvc := service.NewKnowledgeVersionService(knowledgeRepo)
	knowledgeHandler := handler.NewKnowledgeHandler(knowledgeSvc, knowledgeVersionSvc)

	platformRepo := repository.NewPlatformRepository(db)
	platformSvc := service.NewPlatformService(platformRepo)
	opsRepo := repository.NewOperationsRepository(db)
	opsSvc := service.NewOperationsService(opsRepo)
	opsHandler := handler.NewOperationsHandler(opsSvc, platformSvc)

	serviceOrderRepo := repository.NewServiceOrderRepository(db)
	svcOrderSvc := service.NewServiceOrderService(serviceOrderRepo)
	svcOrderHandler := handler.NewServiceOrderHandler(svcOrderSvc)

	aiRepo := repository.NewAIRepository(db)
	aiSvc := service.NewAIService(aiRepo)
	aiHandler := handler.NewAIHandler(aiSvc)

	auditLogRepo := repository.NewAuditLogRepository(db)
	auditLogService := service.NewAuditLogService(auditLogRepo)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService)

	auditMiddleware := middleware.NewAuditMiddleware(auditLogService)

	rateLimiter := ratelimit.NewRateLimiter()
	rateLimitMiddleware := middleware.NewRateLimitMiddleware(rateLimiter)

	apiQuotaRepo := repository.NewApiQuotaRepository(db)
	featureFlagRepo := repository.NewFeatureFlagRepository(db)
	quotaService := service.NewQuotaService(apiQuotaRepo, featureFlagRepo)
	quotaMiddleware := middleware.NewQuotaMiddleware(quotaService)
	featureFlagMiddleware := middleware.NewFeatureFlagMiddleware(quotaService)

	backupConfigRepo := repository.NewBackupConfigRepository(db)
	backupRecordRepo := repository.NewBackupRecordRepository(db)
	backupService := service.NewBackupService(
		backupConfigRepo, backupRecordRepo,
		"localhost", "5432", "ai_office", "ai_office_pass", "ai_office",
		"/tmp/test-backups",
	)
	backupHandler := handler.NewBackupHandler(backupService)

	quotaHandler := handler.NewQuotaHandler(quotaService)

	auth := api.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
	}

	operatorOnly := middleware.RequirePermission(rbac.PermSystemConfig)
	financeAccess := middleware.RequirePermission(rbac.PermFinanceRead)

	protected := api.Group("")
	protected.Use(middleware.AuthRequired(jwtManager, nil), auditMiddleware.Record(), quotaMiddleware.Check(), rateLimitMiddleware.Check())
	{
		protected.POST("/auth/switch-enterprise", authHandler.SwitchEnterprise)
		protected.GET("/me", authHandler.Me)
		protected.GET("/me/profile", authHandler.MeProfile)
		protected.GET("/audit-logs", auditLogHandler.List)
		protected.POST("/cross-enterprise/permissions", crossEnterpriseHandler.Grant)
		protected.DELETE("/cross-enterprise/permissions/:id", crossEnterpriseHandler.Revoke)
		protected.GET("/cross-enterprise/permissions", crossEnterpriseHandler.ListByUser)
		protected.GET("/groups/summary/:id", summaryHandler.GroupSummary)

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
			enterprises.PUT("/:enterprise_id", enterpriseHandler.Update)
			enterprises.GET("", enterpriseHandler.List)
			enterprises.GET("/:enterprise_id", enterpriseHandler.Get)
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
		enterprise.POST("/service-orders", svcOrderHandler.Create)
		enterprise.GET("/service-orders", svcOrderHandler.List)
		enterprise.POST("/contracts", contractHandler.Create)
		enterprise.GET("/contracts", contractHandler.List)
		f := enterprise.Group("")
		f.Use(financeAccess)
		{
			f.POST("/payments", financeHandler.CreatePayment)
			f.GET("/payments", financeHandler.ListPayments)
			f.POST("/expenses", financeHandler.CreateExpense)
			f.GET("/expenses", financeHandler.ListExpenses)
			f.POST("/invoices", financeHandler.CreateInvoice)
			f.GET("/invoices", financeHandler.ListInvoices)
		}
		enterprise.POST("/files", knowledgeHandler.UploadFile)
		enterprise.GET("/files", knowledgeHandler.ListFiles)
		enterprise.POST("/messages", knowledgeHandler.SendMessage)
		enterprise.GET("/messages", knowledgeHandler.ListMessages)
		enterprise.POST("/kb/docs", knowledgeHandler.CreateDoc)
		enterprise.GET("/kb/docs", knowledgeHandler.ListDocs)
		protected.GET("/dashboard", opsHandler.Dashboard)
		protected.GET("/subscription-plans", opsHandler.ListPlans)
		protected.POST("/subscription-plans", opsHandler.CreatePlan)
		protected.GET("/enterprise-subscriptions", opsHandler.ListSubscriptions)
		protected.POST("/enterprise-subscriptions", opsHandler.CreateSubscription)
		protected.GET("/webhooks", opsHandler.ListWebhooks)
		protected.POST("/webhooks", opsHandler.CreateWebhook)
		protected.POST("/expenses/:id/approve", financeHandler.ApproveExpense)
		protected.GET("/audit-log-entries", opsHandler.ListAuditLogs)
		protected.GET("/skills", opsHandler.ListSkills)
		protected.POST("/skills", opsHandler.CreateSkill)
		protected.GET("/reports/:type", opsHandler.GetReport)
		protected.POST("/service-tickets", opsHandler.CreateServiceTicket)
		protected.GET("/service-tickets", opsHandler.ListServiceTickets)
		protected.POST("/announcements", opsHandler.CreateAnnouncement)
		protected.GET("/announcements", opsHandler.ListAnnouncements)
		protected.POST("/bills", opsHandler.CreateBill)
		protected.GET("/bills", opsHandler.ListBills)
		protected.GET("/sla-metrics", opsHandler.GetSLAMetrics)
		protected.POST("/service-config", opsHandler.CreateServiceConfig)
		protected.GET("/service-config/:key", opsHandler.GetServiceConfig)
		protected.GET("/data-export", opsHandler.ExportData)
		protected.POST("/data-import", opsHandler.ImportData)
		protected.POST("/ai/sessions", aiHandler.CreateSession)
		protected.GET("/ai/sessions", aiHandler.ListSessions)
		protected.POST("/ai/sessions/:session_id/messages", aiHandler.SendMessage)
		protected.GET("/ai/sessions/:session_id/messages", aiHandler.GetMessages)
		protected.PUT("/ai/preferences", aiHandler.UpdatePreference)
		protected.GET("/service-orders/:id", svcOrderHandler.Get)
		protected.PUT("/service-orders/:id", svcOrderHandler.Quote)
		protected.DELETE("/service-orders/:id", svcOrderHandler.Delete)
		protected.PATCH("/service-orders/:id/status", svcOrderHandler.ChangeStatus)
		enterprise.POST("/kb/categories", knowledgeHandler.CreateCategory)
		enterprise.GET("/kb/categories", knowledgeHandler.ListCategories)
		enterprise.GET("/kb/semantic-search", knowledgeHandler.SemanticSearch)
		protected.POST("/kb/docs/:id/chunk", knowledgeHandler.ChunkDocument)
		protected.GET("/kb/docs/:id/chunks", knowledgeHandler.GetChunks)
		enterprise.GET("/customers/:customer_id/tags", customerTagHandler.ListByCustomer)
		enterprise.GET("/customer-tags", customerTagHandler.ListByEnterprise)
		enterprise.POST("/positions", positionHandler.Create)
		enterprise.GET("/positions", positionHandler.List)
		protected.GET("/customers/:id", customerHandler.Get)
		protected.PUT("/customers/:id", customerHandler.Update)
		protected.DELETE("/customers/:id", customerHandler.Delete)
		protected.DELETE("/customers/:id/tags", customerTagHandler.RemoveTag)
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
		protected.POST("/sales-orders/:id/contract", orderHandler.BindContract)
		protected.POST("/sales-orders/:id/delivery", orderHandler.Delivery)
		protected.PATCH("/sales-orders/:id/status", orderHandler.ChangeSalesOrderStatus)
		protected.POST("/transfers/:id/execute", orderHandler.ExecuteTransfer)
		protected.POST("/requisitions/:id/issue", orderHandler.IssueRequisition)
		protected.GET("/contracts/:id", contractHandler.Get)
		protected.PUT("/contracts/:id", contractHandler.Update)
		protected.DELETE("/contracts/:id", contractHandler.Delete)
		protected.PATCH("/contracts/:id", contractHandler.PatchFields)
		protected.PATCH("/contracts/:id/status", contractHandler.ChangeStatus)
		protected.POST("/contracts/:id/submit-approval", contractHandler.SubmitApproval)
		protected.POST("/contracts/:id/approve", contractHandler.Approve)
		protected.POST("/contracts/:id/attachments", contractHandler.UploadAttachment)
		protected.POST("/contracts/:id/documents", contractHandler.LinkDocument)
		protected.GET("/contracts/:id/documents", contractHandler.ListDocuments)
		protected.PUT("/customer-levels/:id", customerLevelHandler.Update)
		protected.DELETE("/customer-levels/:id", customerLevelHandler.Delete)
		protected.PUT("/positions/:id", positionHandler.Update)
		protected.PUT("/employees/:id", empHandler.Update)
		protected.DELETE("/employees/:id", empHandler.Delete)
		protected.GET("/employees/:id", empHandler.Get)
		protected.PUT("/employees/:id/transfer", empHandler.Transfer)
		protected.POST("/employees/:id/permissions", empPermHandler.Set)
		protected.DELETE("/employees/:id/permissions", empPermHandler.Revoke)
		protected.GET("/employees/:id/permissions", empPermHandler.List)

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

	return r
}

type TestClient struct {
	t            *testing.T
	router       *gin.Engine
	token        string
	enterpriseID string
	db           *gorm.DB
}

func NewTestClient(t *testing.T, router *gin.Engine, db *gorm.DB) *TestClient {
	t.Helper()
	return &TestClient{t: t, router: router, db: db}
}

func (c *TestClient) SetToken(token string) {
	c.token = token
}

func (c *TestClient) SetEnterprise(enterpriseID string) {
	c.enterpriseID = enterpriseID
}

func (c *TestClient) doRequest(method, path string, body interface{}) *httptest.ResponseRecorder {
	c.t.Helper()
	if c.db != nil {
		c.db.Exec("SET search_path TO public")
	}
	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			c.t.Fatalf("failed to marshal request body: %v", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")

	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	if c.enterpriseID != "" {
		req.Header.Set("X-Enterprise-ID", c.enterpriseID)
	}

	w := httptest.NewRecorder()
	c.router.ServeHTTP(w, req)
	return w
}

func (c *TestClient) GET(path string) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodGet, path, nil)
}

func (c *TestClient) POST(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPost, path, body)
}

func (c *TestClient) PUT(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPut, path, body)
}

func (c *TestClient) PATCH(path string, body interface{}) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodPatch, path, body)
}

func (c *TestClient) DELETE(path string) *httptest.ResponseRecorder {
	return c.doRequest(http.MethodDelete, path, nil)
}

func ParseResponse(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response body: %v\nbody: %s", err, w.Body.String())
	}
	return resp
}

func AssertStatus(t *testing.T, w *httptest.ResponseRecorder, expected int) {
	t.Helper()
	if w.Code != expected {
		t.Errorf("expected status %d, got %d; body: %s", expected, w.Code, w.Body.String())
	}
}

func AssertDataField(t *testing.T, resp map[string]interface{}, field string, expected interface{}) {
	t.Helper()
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("response has no data object: %v", resp)
	}
	val, ok := data[field]
	if !ok {
		t.Fatalf("data.%s not found in response", field)
	}
	if val != expected {
		t.Errorf("expected data.%s = %v, got %v", field, expected, val)
	}
}

func AssertErrorCode(t *testing.T, resp map[string]interface{}, expectedCode string) {
	t.Helper()
	errInfo, ok := resp["error"].(map[string]interface{})
	if !ok {
		t.Fatalf("response has no error object: %v", resp)
	}
	code, ok := errInfo["code"].(string)
	if !ok {
		t.Fatalf("error.code is not a string: %v", errInfo)
	}
	if code != expectedCode {
		t.Errorf("expected error.code = %s, got %s", expectedCode, code)
	}
}

func GetData(t *testing.T, resp map[string]interface{}) map[string]interface{} {
	t.Helper()
	data, ok := resp["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("response has no data object: %v", resp)
	}
	return data
}

func GetDataArray(t *testing.T, resp map[string]interface{}) []interface{} {
	t.Helper()
	data, ok := resp["data"].([]interface{})
	if !ok {
		t.Fatalf("response data is not an array: %v", resp)
	}
	return data
}

func GetError(t *testing.T, resp map[string]interface{}) map[string]interface{} {
	t.Helper()
	errInfo, ok := resp["error"].(map[string]interface{})
	if !ok {
		t.Fatalf("response has no error object: %v", resp)
	}
	return errInfo
}

func GetMeta(t *testing.T, resp map[string]interface{}) map[string]interface{} {
	t.Helper()
	meta, ok := resp["meta"].(map[string]interface{})
	if !ok {
		t.Fatalf("response has no meta object: %v", resp)
	}
	return meta
}
