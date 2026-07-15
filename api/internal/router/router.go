package router

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/handler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/scheduler"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/auth"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/config"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/notification"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/observability"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/ratelimit"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(cfg *config.Config, logger *zap.Logger, db *gorm.DB, redisClient *rc.Client) *gin.Engine {
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

	var deps RouterDeps
	var backupService *service.BackupService
	var reminderScheduler *scheduler.ReminderScheduler
	var exportWorker *service.ExportWorker

	var tokenBlacklist *rc.TokenBlacklist
	if redisClient != nil {
		tokenBlacklist = rc.NewTokenBlacklist(redisClient)
		middleware.SetMFACache(rc.NewCache(redisClient))
	}
	deps.TokenBlacklist = tokenBlacklist

	if db != nil {
		deps = initDeps(db, cfg, jwtManager, tokenBlacklist, redisClient, logger)

		backupService = deps.BackupService
		exportWorker = deps.ExportWorker

		registerAuthRoutes(api, &deps)

		protected := api.Group("")
		protected.Use(
			middleware.AuthRequired(jwtManager, tokenBlacklist),
			middleware.ResolveEnterpriseContext(),
			middleware.CLISourceOnly(cfg, logger),
			deps.AuditMiddleware.Record(),
			deps.QuotaMiddleware.Check(),
			deps.RateLimitMiddleware.Check(),
		)

		enterprise := protected.Group("/enterprises/:enterprise_id")

		registerOrgRoutes(protected, enterprise, &deps)
		registerCRMRoutes(protected, enterprise, &deps)
		registerIMSRoutes(protected, enterprise, &deps)
		registerContractRoutes(protected, enterprise, &deps)
		registerFinanceRoutes(protected, enterprise, &deps)
		registerServiceRoutes(protected, enterprise, &deps)
		registerInfraRoutes(protected, enterprise, &deps)
		registerOpsRoutes(protected, &deps)
		registerBillingRoutes(protected, &deps)
		registerExportRoutes(protected, &deps)
		registerSecurityRoutes(protected, &deps)
		registerTemplateRoutes(protected, &deps)

		go func() {
			reminderScheduler = scheduler.NewReminderScheduler(deps.ReminderPaymentPlanSvc, logger)
			reminderScheduler.Start()
		}()

		if deps.BillingService != nil {
			go func() {
				billingScheduler := scheduler.NewBillingScheduler(deps.BillingService, logger)
				billingScheduler.Start()
			}()
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

	if exportWorker != nil {
		exportWorker.Start(context.Background())
	}

	return r
}

func initDeps(db *gorm.DB, cfg *config.Config, jwtManager *auth.JWTManager, tokenBlacklist *rc.TokenBlacklist, redisClient *rc.Client, logger *zap.Logger) RouterDeps {
	var deps RouterDeps

	userRepo := repository.NewUserRepository(db)

	groupRepo := repository.NewGroupRepository(db)
	groupService := service.NewGroupService(groupRepo, userRepo, jwtManager)
	deps.GroupHandler = handler.NewGroupHandler(groupService)

	enterpriseRepo := repository.NewEnterpriseRepository(db)
	schemaManager := repository.NewSchemaManager(db)
	enterpriseService := service.NewEnterpriseService(enterpriseRepo, schemaManager)
	deps.EnterpriseHandler = handler.NewEnterpriseHandler(enterpriseService)
	deptRepo := repository.NewDepartmentRepository(db)

	deptService := service.NewDepartmentService(deptRepo)
	deps.DeptHandler = handler.NewDepartmentHandler(deptService)

	empRepo := repository.NewEmployeeRepository(db)
	empService := service.NewEmployeeServiceWithUser(empRepo, deptRepo, userRepo)
	deps.EmpHandler = handler.NewEmployeeHandler(empService)

	positionRepo := repository.NewPositionRepository(db)
	positionService := service.NewPositionService(positionRepo)
	deps.PositionHandler = handler.NewPositionHandler(positionService)

	crossEnterpriseRepo := repository.NewCrossEnterpriseRepository(db)
	crossEnterpriseService := service.NewCrossEnterpriseService(crossEnterpriseRepo)
	deps.CrossEnterpriseHandler = handler.NewCrossEnterpriseHandler(crossEnterpriseService)
	deps.CrossEnterpriseRepo = crossEnterpriseRepo

	empPermRepo := repository.NewEmployeePermissionRepository(db)
	empPermService := service.NewEmployeePermissionService(empPermRepo)
	deps.EmpPermHandler = handler.NewEmployeePermissionHandler(empPermService)

	permRepo := repository.NewPermissionRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	empPermABACRepo := repository.NewEmployeePermissionABACRepository(db)
	customRuleRepo := repository.NewCustomRuleRepository(db)

	permFacade := rbac.NewPermissionFacade()
	permFacade.RegisterEvaluator(rbac.NewRBACEvaluator())
	permFacade.RegisterEvaluator(rbac.NewABACEvaluator())
	permFacade.RegisterEvaluator(rbac.NewAttributeEvaluator())
	permFacade.RegisterEvaluator(rbac.NewCustomRuleEvaluator())

	permService := service.NewPermissionService(permRepo, roleRepo, empPermABACRepo, customRuleRepo, permFacade)
	deps.PermHandler = handler.NewPermissionHandler(permService)
	deps.RoleHandler = handler.NewRoleHandler(permService)

	summaryService := service.NewSummaryService(enterpriseRepo, empRepo, deptRepo)
	deps.SummaryHandler = handler.NewSummaryHandler(summaryService)

	authService := service.NewAuthServiceFull(userRepo, enterpriseRepo, crossEnterpriseRepo, jwtManager, tokenBlacklist)
	deps.AuthHandler = handler.NewAuthHandlerFull(authService, empService, tokenBlacklist, jwtManager)

	customerRepo := repository.NewCustomerRepository(db)
	customerService := service.NewCustomerService(customerRepo)
	contactRepo := repository.NewContactRepository(db)
	oppRepo := repository.NewOpportunityRepository(db)
	deps.CustomerHandler = handler.NewCustomerHandler(customerService, nil)

	customerLevelRepo := repository.NewCustomerLevelRepository(db)
	customerLevelService := service.NewCustomerLevelService(customerLevelRepo)
	deps.CustomerLevelHandler = handler.NewCustomerLevelHandler(customerLevelService)

	customerTagRepo := repository.NewCustomerTagRepository(db)
	customerTagService := service.NewCustomerTagService(customerTagRepo, customerRepo)
	deps.CustomerTagHandler = handler.NewCustomerTagHandler(customerTagService)

	contactService := service.NewContactService(contactRepo, customerRepo)
	deps.ContactHandler = handler.NewContactHandler(contactService)

	oppService := service.NewOpportunityService(oppRepo, customerRepo)
	deps.OppHandler = handler.NewOpportunityHandler(oppService)

	matRepo := repository.NewMaterialRepository(db)
	matService := service.NewMaterialService(matRepo)
	deps.MatHandler = handler.NewMaterialHandler(matService)

	supRepo := repository.NewSupplierRepository(db)
	supService := service.NewSupplierService(supRepo)
	deps.SupHandler = handler.NewSupplierHandler(supService)

	whRepo := repository.NewWarehouseRepository(db)
	whService := service.NewWarehouseService(whRepo)
	deps.WhHandler = handler.NewWarehouseHandler(whService)

	invRepo := repository.NewInventoryRepository(db)
	invService := service.NewInventoryService(invRepo, matRepo, whRepo)
	deps.InvHandler = handler.NewInventoryHandler(invService)

	qiRepo := repository.NewQualityInspectionRepository(db)

	knowledgeRepo := repository.NewKnowledgeRepository(db)
	knowledgeSvc := service.NewKnowledgeService(knowledgeRepo)
	knowledgeVersionSvc := service.NewKnowledgeVersionService(knowledgeRepo)

	contractRepo := repository.NewContractRepository(db)
	contractSvc := service.NewContractService(contractRepo)

	orderRepo := repository.NewOrderRepository(db)
	orderSvc := service.NewOrderService(orderRepo, invRepo, matRepo, whRepo, supRepo, customerRepo, qiRepo)

	autoArchiveSvc := service.NewAutoArchiveService(knowledgeSvc, contractRepo, orderRepo, empRepo)
	deps.AutoArchiveService = autoArchiveSvc
	contextInjectionSvc := service.NewContextInjectionService(knowledgeRepo, contractRepo, orderRepo, empRepo)
	deps.ContextInjectionService = contextInjectionSvc

	deps.ContractHandler = handler.NewContractHandler(contractSvc, autoArchiveSvc)
	deps.OrderHandler = handler.NewOrderHandler(orderSvc, contractSvc, autoArchiveSvc)

	financeRepo := repository.NewFinanceRepository(db)
	financeSvc := service.NewFinanceService(financeRepo)
	deps.FinanceHandler = handler.NewFinanceHandler(financeSvc)

	prRepo := repository.NewPaymentRequestRepository(db)
	prSvc := service.NewPaymentRequestService(prRepo)
	deps.PaymentRequestHandler = handler.NewPaymentRequestHandler(prSvc)

	colRepo := repository.NewCollectionRepository(db)
	colSvc := service.NewCollectionService(colRepo)
	deps.CollectionHandler = handler.NewCollectionHandler(colSvc)

	ppRepo := repository.NewPaymentPlanRepository(db)
	ppSvc := service.NewPaymentPlanService(ppRepo)
	deps.PaymentPlanHandler = handler.NewPaymentPlanHandler(ppSvc)
	deps.ReminderPaymentPlanSvc = ppSvc

	cashflowRepo := repository.NewCashFlowRepository(db)
	cashflowSvc := service.NewCashFlowService(cashflowRepo)
	deps.CashFlowHandler = handler.NewCashFlowHandler(cashflowSvc)

	reconciliationRepo := repository.NewReconciliationRepository(db)
	recSvc := service.NewReconciliationService(reconciliationRepo)
	deps.ReconciliationHandler = handler.NewReconciliationHandler(recSvc)

	repairOrderRepo := repository.NewRepairOrderRepository(db)
	roSvc := service.NewRepairOrderService(repairOrderRepo)
	deps.RepairOrderHandler = handler.NewRepairOrderHandler(roSvc)

	ownerRepo := repository.NewOwnerRepository(db)
	ownerSvc := service.NewOwnerService(ownerRepo)
	deps.OwnerHandler = handler.NewOwnerHandler(ownerSvc)

	healthRepo := repository.NewHealthRepository(db)
	entHealthSvc := service.NewHealthService(healthRepo)
	deps.HealthDashboardHandler = handler.NewHealthDashboardHandler(entHealthSvc)

	restoreRepo := repository.NewRestoreRepository(db)
	restoreSvc := service.NewRestoreService(restoreRepo)
	deps.RestoreHandler = handler.NewRestoreHandler(restoreSvc)

	deps.KnowledgeHandler = handler.NewKnowledgeHandler(knowledgeSvc, knowledgeVersionSvc)

	msgRepo := repository.NewMessageRepository(db)
	annRepo := repository.NewAnnouncementRepository(db)
	var unreadCounter *rc.UnreadCounter
	if redisClient != nil {
		unreadCounter = rc.NewUnreadCounter(redisClient)
	}
	msgService := service.NewMessageService(msgRepo, annRepo, unreadCounter)
	deps.MsgHandler = handler.NewMessageHandler(msgService)

	wfRepo := repository.NewWorkflowRepository(db)
	wfService := service.NewWorkflowService(wfRepo)
	deps.WfHandler = handler.NewWorkflowHandler(wfService)

	fileRepo := repository.NewFileMetadataRepository(db)
	fileService := service.NewFileService(fileRepo, cfg.Server.BackupDir)
	deps.FileHandler = handler.NewFileHandler(fileService)

	skillRepo := repository.NewSkillRepository(db)
	skillService := service.NewSkillService(skillRepo)
	deps.SkillHandler = handler.NewSkillHandler(skillService)

	cfFieldRepo := repository.NewCustomFieldRepository(db)
	cfRelRepo := repository.NewRelationRepository(db)
	cfService := service.NewCustomFieldService(cfFieldRepo, cfRelRepo)
	deps.CustomFieldHandler = handler.NewCustomFieldHandler(cfService)

	var smsClient *notification.AliyunSMSClient
	if cfg.Notification.SMS.AccessKeyID != "" {
		smsClient = notification.NewAliyunSMSClient(notification.AliyunSMSConfig{
			AccessKeyID:     cfg.Notification.SMS.AccessKeyID,
			AccessKeySecret: cfg.Notification.SMS.AccessKeySecret,
			SignName:        cfg.Notification.SMS.SignName,
			TemplateCode:    cfg.Notification.SMS.TemplateCode,
			RegionID:        cfg.Notification.SMS.RegionID,
		})
	}
	var emailClient *notification.EmailClient
	if cfg.Notification.Email.Host != "" {
		emailClient = notification.NewEmailClient(notification.EmailConfig{
			Host:     cfg.Notification.Email.Host,
			Port:     cfg.Notification.Email.Port,
			Username: cfg.Notification.Email.Username,
			Password: cfg.Notification.Email.Password,
			From:     cfg.Notification.Email.From,
			UseTLS:   cfg.Notification.Email.UseTLS,
		})
	}
	notifService := notification.NewNotificationService(smsClient, emailClient)
	deps.NotificationHandler = handler.NewNotificationHandler(notifService)
	platformRepo := repository.NewPlatformRepository(db)
	platformSvc := service.NewPlatformService(platformRepo)
	opsRepo := repository.NewOperationsRepository(db)
	opsSvc := service.NewOperationsService(opsRepo)
	deps.OperationsHandler = handler.NewOperationsHandler(opsSvc, platformSvc)
	serviceOrderRepo := repository.NewServiceOrderRepository(db)
	svcOrderSvc := service.NewServiceOrderService(serviceOrderRepo)
	deps.ServiceOrderHandler = handler.NewServiceOrderHandler(svcOrderSvc)

	panoramaService := service.NewCustomerPanoramaService(customerRepo, contactRepo, oppRepo, contractRepo, serviceOrderRepo)
	deps.CustomerHandler = handler.NewCustomerHandler(customerService, panoramaService)

	aiRepo := repository.NewAIRepository(db)
	aiSvc := service.NewAIServiceWithContext(aiRepo, contextInjectionSvc)
	deps.AIHandler = handler.NewAIHandler(aiSvc)

	auditLogRepo := repository.NewAuditLogRepository(db)
	auditLogService := service.NewAuditLogService(auditLogRepo)
	deps.AuditLogHandler = handler.NewAuditLogHandler(auditLogService)

	assistService := service.NewAssistService(wfRepo, msgRepo, auditLogRepo)
	deps.AssistHandler = handler.NewAssistHandler(assistService)

	exportRepo := repository.NewExportRepository(db)
	exportService := service.NewExportService(exportRepo, cfg.Server.BackupDir)
	deps.ExportWorker = service.NewExportWorker(exportService, exportRepo, logger)
	deps.ExportHandler = handler.NewExportHandler(exportService, deps.ExportWorker)

	backupConfigRepo := repository.NewBackupConfigRepository(db)
	backupRecordRepo := repository.NewBackupRecordRepository(db)
	deps.BackupService = service.NewBackupService(
		backupConfigRepo, backupRecordRepo,
		cfg.Database.Host, fmt.Sprintf("%d", cfg.Database.Port), cfg.Database.User, cfg.Database.Password, cfg.Database.DBName,
		cfg.Server.BackupDir,
	)
	deps.BackupHandler = handler.NewBackupHandler(deps.BackupService)

	apiQuotaRepo := repository.NewApiQuotaRepository(db)
	featureFlagRepo := repository.NewFeatureFlagRepository(db)
	quotaService := service.NewQuotaService(apiQuotaRepo, featureFlagRepo)
	deps.QuotaHandler = handler.NewQuotaHandler(quotaService)
	deps.QuotaMiddleware = middleware.NewQuotaMiddleware(quotaService)
	deps.FeatureFlagMiddleware = middleware.NewFeatureFlagMiddleware(quotaService)

	rateLimiter := ratelimit.NewRateLimiter()
	deps.RateLimitMiddleware = middleware.NewRateLimitMiddleware(rateLimiter)

	deviceAuthRepo := repository.NewDeviceAuthRepository(db)
	deviceAuthService := service.NewDeviceAuthService(deviceAuthRepo, userRepo, jwtManager)
	deps.DeviceAuthHandler = handler.NewDeviceAuthHandler(deviceAuthService)

	qiService := service.NewQualityInspectionService(qiRepo, invRepo, orderRepo)
	deps.QualityInspectionHandler = handler.NewQualityInspectionHandler(qiService)

	billingRepo := repository.NewBillingRepository(db)
	billingSvc := service.NewBillingService(billingRepo)
	deps.BillingService = billingSvc
	deps.BillingHandler = handler.NewBillingHandler(billingSvc)

	mfaRepo := repository.NewMFARepository(db)
	mfaService := service.NewMFAService(mfaRepo, userRepo)
	deps.MFAHandler = handler.NewMFAHandler(mfaService)

	serviceConfigRepo := repository.NewServiceConfigRepository(db)
	maskingService := service.NewMaskingService(serviceConfigRepo)
	deps.MaskingHandler = handler.NewMaskingHandler(maskingService)

	undoRepo := repository.NewUndoRepository(db)
	undoTargetRepos := map[string]service.UndoTargetRepo{
		"departments": deptRepo,
		"employees":   empRepo,
		"customers":   customerRepo,
		"contracts":   contractRepo,
	}
	undoService := service.NewUndoService(undoRepo, userRepo, undoTargetRepos)
	deps.UndoService = undoService
	deps.UndoHandler = handler.NewUndoHandler(undoService)

	deleteRepos := map[string]service.BatchTargetDeleter{
		"customers":  customerRepo,
		"suppliers":  supRepo,
		"contacts":   contactRepo,
		"contracts":  contractRepo,
		"materials":  matRepo,
	}
	statusRepos := map[string]service.BatchStatusChanger{
		"customers":       customerRepo,
		"contracts":       contractRepo,
		"service_orders":  serviceOrderRepo,
		"purchase_orders": &service.PurchaseOrderStatusAdapter{Repo: orderRepo},
		"sales_orders":    &service.SalesOrderStatusAdapter{Repo: orderRepo},
	}
	batchService := service.NewBatchService(wfService, deleteRepos, statusRepos)
	deps.BatchHandler = handler.NewBatchHandler(batchService)

	industryTemplateRepo := repository.NewIndustryTemplateRepository(db)
	templateService := service.NewTemplateService(industryTemplateRepo, skillRepo)
	claudeMDRepo := repository.NewClaudeMDTemplateRepository(db)
	renderService := service.NewTemplateRenderService(claudeMDRepo)
	deps.TemplateHandler = handler.NewTemplateHandler(templateService, renderService)
	deps.TemplateRenderHandler = handler.NewTemplateRenderHandler(renderService)

	enterpriseSkillMatrixRepo := repository.NewEnterpriseSkillMatrixRepository(db)
	enterpriseSkillService := service.NewEnterpriseSkillService(enterpriseSkillMatrixRepo)
	deps.EnterpriseSkillHandler = handler.NewEnterpriseSkillHandler(enterpriseSkillService)

	operatorAuditService := service.NewOperatorAuditService(auditLogRepo)
	deps.OperatorAuditHandler = handler.NewOperatorAuditHandler(operatorAuditService)

	deps.AuditMiddleware = middleware.NewAuditMiddlewareWithUndo(auditLogService, undoService, undoRepo)

	middleware.GlobalAuthDB = db
	middleware.GlobalTenantDB = db

	return deps
}
