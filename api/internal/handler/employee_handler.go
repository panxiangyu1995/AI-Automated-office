package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type EmployeeHandler struct {
	empService *service.EmployeeService
}

func NewEmployeeHandler(empService *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{empService: empService}
}

// svcFor returns a EmployeeService bound to the request's tenant database.
func (h *EmployeeHandler) svcFor(c *gin.Context) *service.EmployeeService {
	if db := middleware.GetTenantDB(c); db != nil {
		return service.NewEmployeeServiceWithUser(
			repository.NewEmployeeRepository(db),
			repository.NewDepartmentRepository(db),
			repository.NewUserRepository(db),
		)
	}
	return h.empService
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
	enterpriseID := middleware.GetEnterpriseID(c)
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

	emp, appErr := h.svcFor(c).Create(enterpriseID, req.DepartmentID, req.Name, req.Email, req.Phone, req.Position, req.EmployeeNo, req.Role, hireDate)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Created(c, emp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
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

	emp, appErr := h.svcFor(c).Update(enterpriseID, employeeID, req.Name, req.Email, req.Phone, req.Position, req.EmployeeNo, req.Role, req.Status)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}

func (h *EmployeeHandler) Delete(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	appErr := h.svcFor(c).Delete(enterpriseID, employeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.NoContent(c)
}

func (h *EmployeeHandler) Get(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
	employeeID := c.Param("id")
	if employeeID == "" {
		response.ValidationError(c, "id", "员工ID不能为空")
		return
	}

	emp, appErr := h.svcFor(c).Get(enterpriseID, employeeID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}

func (h *EmployeeHandler) List(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
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

	employees, total, appErr := h.svcFor(c).List(query)
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

func (h *EmployeeHandler) SalesPerformance(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}

	employeeID := c.Query("employee_id")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	results, appErr := h.svcFor(c).GetSalesPerformance(enterpriseID, employeeID, startTime, endTime)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, results)
}

func (h *EmployeeHandler) BatchImport(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
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

	result := h.svcFor(c).BatchImport(enterpriseID, req.Employees)
	response.Success(c, result)
}

func (h *EmployeeHandler) Transfer(c *gin.Context) {
	enterpriseID := middleware.GetEnterpriseID(c)
	if enterpriseID == "" {
		response.Error(c, errors.ErrTenantRequired)
		return
	}
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

	emp, appErr := h.svcFor(c).Transfer(enterpriseID, employeeID, req.DepartmentID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, emp)
}
