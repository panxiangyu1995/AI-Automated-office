package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/service"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
)

type EmployeeHandler struct {
	empService *service.EmployeeService
}

func NewEmployeeHandler(empService *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{empService: empService}
}

type createEmployeeRequest struct {
	DepartmentID string `json:"department_id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Position     string `json:"position"`
	EmployeeNo   string `json:"employee_no"`
	Role         string `json:"role"`
	HireDate     string `json:"hire_date"`
}

type updateEmployeeRequest struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Position   string `json:"position"`
	EmployeeNo string `json:"employee_no"`
	Role       string `json:"role"`
	Status     string `json:"status"`
}

type transferRequest struct {
	DepartmentID string `json:"department_id"`
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	var req createEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	var hireDate *time.Time
	if req.HireDate != "" {
		t, err := time.Parse("2006-01-02", req.HireDate)
		if err == nil {
			hireDate = &t
		}
	}

	emp, appErr := h.empService.Create(enterpriseID, req.DepartmentID, req.Name, req.Email, req.Phone, req.Position, req.EmployeeNo, req.Role, hireDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, emp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	var req updateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	emp, appErr := h.empService.Update(employeeID, req.Name, req.Email, req.Phone, req.Position, req.EmployeeNo, req.Role, req.Status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}

func (h *EmployeeHandler) Delete(c *gin.Context) {
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	appErr := h.empService.Delete(employeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *EmployeeHandler) Get(c *gin.Context) {
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	emp, appErr := h.empService.Get(employeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}

func (h *EmployeeHandler) List(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	query := model.EmployeeQuery{
		EnterpriseID: enterpriseID,
		DepartmentID: c.Query("department_id"),
		Role:         c.Query("role"),
		Status:       c.Query("status"),
		Search:       c.Query("search"),
		Page:         page,
		PageSize:     pageSize,
	}

	employees, total, appErr := h.empService.List(query)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.SuccessWithMeta(c, employees, &response.MetaInfo{
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	})
}

func (h *EmployeeHandler) BatchImport(c *gin.Context) {
	enterpriseID := c.Param("enterprise_id")
	if enterpriseID == "" {
		response.ValidationError(c, "enterprise_id", "企业ID不能为空")
		return
	}

	var req struct {
		Employees []service.BatchEmployee `json:"employees"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	result := h.empService.BatchImport(enterpriseID, req.Employees)
	response.Success(c, result)
}

func (h *EmployeeHandler) Transfer(c *gin.Context) {
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	var req transferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, "body", "请求体格式错误")
		return
	}

	emp, appErr := h.empService.Transfer(employeeID, req.DepartmentID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}
