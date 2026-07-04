package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type ContactHandler struct {
	contactService *service.ContactService
}

func NewContactHandler(contactService *service.ContactService) *ContactHandler {
	return &ContactHandler{contactService: contactService}
}

type createContactRequest struct {
	Name      string `json:"name"`
	Position  string `json:"position"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	IsPrimary bool   `json:"is_primary"`
}

type updateContactRequest struct {
	Name      string `json:"name"`
	Position  string `json:"position"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	IsPrimary bool   `json:"is_primary"`
}

func (h *ContactHandler) Create(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	customerID := c.Param("customer_id")
	if customerID == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}

	var req createContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	contact, appErr := h.contactService.Create(enterpriseID, customerID, req.Name, req.Position, req.Phone, req.Email, req.Role, req.IsPrimary, false)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Created(c, contact)
}

func (h *ContactHandler) Update(c *gin.Context) {
	contactID := c.Param("id")
	if contactID == "" {
		response.ValidationError(c, "id", "联系人ID不能为空")
		return
	}

	var req updateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	contact, appErr := h.contactService.Update(contactID, req.Name, req.Position, req.Phone, req.Email, req.Role, req.IsPrimary)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contact)
}

func (h *ContactHandler) Delete(c *gin.Context) {
	contactID := c.Param("id")
	if contactID == "" {
		response.ValidationError(c, "id", "联系人ID不能为空")
		return
	}
	appErr := h.contactService.Delete(contactID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.NoContent(c)
}

func (h *ContactHandler) ListByCustomer(c *gin.Context) {
	customerID := c.Param("customer_id")
	if customerID == "" {
		response.ValidationError(c, "customer_id", "客户ID不能为空")
		return
	}
	role := c.Query("role")

	contacts, appErr := h.contactService.ListByCustomer(customerID, role)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, contacts)
}
