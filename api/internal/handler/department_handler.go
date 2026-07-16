package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type DepartmentHandler struct {
	deptService *service.DepartmentService
}

func NewDepartmentHandler(deptService *service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{deptService: deptService}
}

type createDepartmentRequest struct {
	Name     string `json:"name"`
	ParentID string `json:"parent_id"`
}

type updateDepartmentRequest struct {
	Name      string `json:"name"`
	ManagerID string `json:"manager_id"`
}

type setManagerRequest struct {
	EmployeeID string `json:"employee_id"`
}

func (h *DepartmentHandler) Get(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	departmentID := c.Param("id")
	if departmentID == "" {
		response.ValidationError(c, "id", "部门ID不能为空")
		return
	}
	dept, appErr := h.deptService.GetByID(enterpriseID, departmentID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}
	response.Success(c, dept)
}

func (h *DepartmentHandler) Create(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	var req createDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	dept, appErr := h.deptService.Create(enterpriseID, req.Name, req.ParentID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, dept)
}

func (h *DepartmentHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	departmentID := c.Param("id")
	if departmentID == "" {
		response.ValidationError(c, "id", "部门ID不能为空")
		return
	}

	var req updateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	dept, appErr := h.deptService.Update(enterpriseID, departmentID, req.Name, req.ManagerID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, dept)
}

func (h *DepartmentHandler) Delete(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	departmentID := c.Param("id")
	if departmentID == "" {
		response.ValidationError(c, "id", "部门ID不能为空")
		return
	}

	appErr := h.deptService.Delete(enterpriseID, departmentID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *DepartmentHandler) SetManager(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	departmentID := c.Param("id")
	if departmentID == "" {
		response.ValidationError(c, "id", "部门ID不能为空")
		return
	}

	var req setManagerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	dept, appErr := h.deptService.SetManager(enterpriseID, departmentID, req.EmployeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, dept)
}

func (h *DepartmentHandler) GetTree(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	tree, appErr := h.deptService.GetTree(enterpriseID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, tree.Children)
}
