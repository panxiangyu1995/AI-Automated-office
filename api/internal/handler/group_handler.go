package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/response"
)

type GroupHandler struct {
	groupService *service.GroupService
}

func NewGroupHandler(groupService *service.GroupService) *GroupHandler {
	return &GroupHandler{groupService: groupService}
}

func (h *GroupHandler) Create(c *gin.Context) {
	var req service.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	group, appErr := h.groupService.Create(req)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, group)
}

func (h *GroupHandler) Update(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		response.ValidationError(c, "id", "集团ID不能为空")
		return
	}

	var req struct {
		Name         string `json:"name"`
		ContactEmail string `json:"contact_email"`
		ContactPhone string `json:"contact_phone"`
		Address      string `json:"address"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	group, appErr := h.groupService.Update(groupID, req.Name, req.ContactEmail, req.ContactPhone, req.Address)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, group)
}

func (h *GroupHandler) Delete(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		response.ValidationError(c, "id", "集团ID不能为空")
		return
	}

	appErr := h.groupService.Delete(groupID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *GroupHandler) Get(c *gin.Context) {
	groupID := c.Param("id")
	if groupID == "" {
		response.ValidationError(c, "id", "集团ID不能为空")
		return
	}

	group, appErr := h.groupService.Get(groupID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, group)
}

func (h *GroupHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	groups, total, appErr := h.groupService.List(page, pageSize)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, groups, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}
