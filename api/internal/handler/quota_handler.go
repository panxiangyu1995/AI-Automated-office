package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type QuotaHandler struct {
	quotaService *service.QuotaService
}

func NewQuotaHandler(quotaService *service.QuotaService) *QuotaHandler {
	return &QuotaHandler{quotaService: quotaService}
}

// svcFor returns a QuotaService bound to the request's tenant database.
func (h *QuotaHandler) svcFor(c *gin.Context) *service.QuotaService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewQuotaService(repository.NewApiQuotaRepository(db), repository.NewFeatureFlagRepository(db))
	}
	return h.quotaService
}

type updateQuotaRequest struct {
	DailyLimit   int `json:"daily_limit"`
	MonthlyLimit int `json:"monthly_limit"`
}

func (h *QuotaHandler) GetQuota(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "企业ID无效")
		return
	}

	quota, appErr := h.svcFor(c).GetQuota(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, quota)
}

func (h *QuotaHandler) UpdateQuota(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "企业ID无效")
		return
	}

	var req updateQuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	quota, appErr := h.svcFor(c).UpdateQuota(eid, req.DailyLimit, req.MonthlyLimit)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, quota)
}

func (h *QuotaHandler) ListFeatures(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "企业ID无效")
		return
	}

	flags, appErr := h.svcFor(c).GetFeatureFlags(eid)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, flags)
}

type updateFeatureRequest struct {
	Enabled bool `json:"enabled"`
}

func (h *QuotaHandler) UpdateFeature(c *gin.Context) {
	enterpriseID := c.GetString(middleware.ContextKeyEnterpriseID)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	featureKey := c.Param("key")
	if featureKey == "" {
		response.ValidationError(c, "key", "功能模块名称不能为空")
		return
	}

	var req updateFeatureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	flag, appErr := h.svcFor(c).UpdateFeatureFlag(enterpriseID, featureKey, req.Enabled)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, flag)
}
