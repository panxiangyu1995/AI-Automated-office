package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type QualityInspectionHandler struct {
	svc          *service.QualityInspectionService
	lockProvider *rc.LockProvider
}

func NewQualityInspectionHandler(svc *service.QualityInspectionService, lockProvider *rc.LockProvider) *QualityInspectionHandler {
	return &QualityInspectionHandler{svc: svc, lockProvider: lockProvider}
}

// svcFor returns a QualityInspectionService bound to the request's tenant database.
func (h *QualityInspectionHandler) svcFor(c *gin.Context) *service.QualityInspectionService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewQualityInspectionService(
			repository.NewQualityInspectionRepository(db),
			repository.NewInventoryRepository(db),
			repository.NewOrderRepository(db),
			h.lockProvider,
		)
	}
	return h.svc
}

type createInspectionReq struct {
	PurchaseOrderID string `json:"purchase_order_id"`
	Notes           string `json:"notes"`
}

func (h *QualityInspectionHandler) Create(c *gin.Context) {
	eid := middleware.GetEnterpriseID(c)
	if eid == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	var req createInspectionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	if req.PurchaseOrderID == "" {
		response.ValidationError(c, "purchase_order_id", "不能为空")
		return
	}
	entID, err := uuid.Parse(eid)
	if err != nil {
		response.ValidationError(c, "enterprise_id", "无效")
		return
	}
	qi := &model.QualityInspection{
		PurchaseOrderID: req.PurchaseOrderID,
		Notes:           req.Notes,
	}
	qi.EnterpriseID = entID
	if appErr := h.svcFor(c).CreateInspection(qi); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, qi)
}

func (h *QualityInspectionHandler) Get(c *gin.Context) {
	entIDStr := middleware.GetEnterpriseID(c)
	entID, _ := uuid.Parse(entIDStr)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	qi, appErr := h.svcFor(c).GetInspection(id, entID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, qi)
}

type addItemReq struct {
	MaterialID string `json:"material_id"`
	CheckItem  string `json:"check_item"`
	Standard   string `json:"standard"`
}

func (h *QualityInspectionHandler) AddItem(c *gin.Context) {
	inspID := c.Param("id")
	if inspID == "" {
		response.ValidationError(c, "id", "不能为空")
		return
	}
	var req addItemReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "格式错误")
		return
	}
	if req.MaterialID == "" || req.CheckItem == "" {
		response.ValidationError(c, "material_id/check_item", "不能为空")
		return
	}
	item := &model.QualityInspectionItem{
		InspectionID: inspID,
		MaterialID:   req.MaterialID,
		CheckItem:    req.CheckItem,
		Standard:     req.Standard,
		Result:       "pending",
	}
	if appErr := h.svcFor(c).AddInspectionItem(item); appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, item)
}

type completeInspectionReq struct {
	InspectorID string `json:"inspector_id"`
}

func (h *QualityInspectionHandler) Complete(c *gin.Context) {
	entIDStr := middleware.GetEnterpriseID(c)
	entID, _ := uuid.Parse(entIDStr)
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.ValidationError(c, "id", "无效")
		return
	}
	var req completeInspectionReq
	_ = c.ShouldBindJSON(&req)
	qi, appErr := h.svcFor(c).CompleteInspection(id, entID, req.InspectorID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, qi)
}

func (h *QualityInspectionHandler) ListByPurchaseOrder(c *gin.Context) {
	poID, err := uuid.Parse(c.Param("po_id"))
	if err != nil {
		response.ValidationError(c, "po_id", "无效")
		return
	}
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	qis, total, appErr := h.svcFor(c).ListByPurchaseOrder(poID, p, ps)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.SuccessWithMeta(c, qis, &response.MetaInfo{TotalCount: total, Page: p, PageSize: ps})
}
