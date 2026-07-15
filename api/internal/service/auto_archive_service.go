package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type AutoArchiveService struct {
	knowledgeSvc  *KnowledgeService
	contractRepo  repository.ContractRepository
	orderRepo     repository.OrderRepository
	employeeRepo  repository.EmployeeRepository
}

func NewAutoArchiveService(
	knowledgeSvc *KnowledgeService,
	contractRepo repository.ContractRepository,
	orderRepo repository.OrderRepository,
	employeeRepo repository.EmployeeRepository,
) *AutoArchiveService {
	return &AutoArchiveService{
		knowledgeSvc: knowledgeSvc,
		contractRepo: contractRepo,
		orderRepo:    orderRepo,
		employeeRepo: employeeRepo,
	}
}

func (s *AutoArchiveService) OnBusinessEvent(eventType, businessID, enterpriseID string) error {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return err
	}

	var title, content, category string

	switch eventType {
	case "contract_signed":
		title, content, category = s.buildContractArchive(businessID, eid)
	case "sales_completed":
		title, content, category = s.buildSalesArchive(businessID, eid)
	case "employee_resigned":
		title, content, category = s.buildEmployeeArchive(businessID, eid)
	default:
		return nil
	}

	if title == "" {
		return nil
	}

	_, appErr := s.knowledgeSvc.CreateDoc(enterpriseID, title, "", content, "", category)
	if appErr != nil {
		return fmt.Errorf("auto archive failed: %s", appErr.Message)
	}
	return nil
}

func (s *AutoArchiveService) buildContractArchive(contractID string, enterpriseID uuid.UUID) (string, string, string) {
	contract, err := s.contractRepo.FindByIDNoEnterprise(contractID)
	if err != nil || contract == nil {
		return "", "", ""
	}
	title := fmt.Sprintf("合同归档: %s", contract.Name)
	content := fmt.Sprintf("合同编号: %s\n合同名称: %s\n金额: %.2f\n状态: %s\n备注: %s",
		contract.ContractNo, contract.Name, contract.Amount, contract.Status, contract.Notes)
	return title, content, "contract"
}

func (s *AutoArchiveService) buildSalesArchive(orderID string, enterpriseID uuid.UUID) (string, string, string) {
	order, err := s.orderRepo.FindSalesOrderByIDNoEnterprise(orderID)
	if err != nil || order == nil {
		return "", "", ""
	}
	title := fmt.Sprintf("销售订单归档: %s", order.OrderNo)
	content := fmt.Sprintf("订单编号: %s\n客户ID: %s\n总金额: %.2f\n状态: %s\n备注: %s",
		order.OrderNo, order.CustomerID, order.TotalAmount, order.Status, order.Notes)
	return title, content, "sales"
}

func (s *AutoArchiveService) buildEmployeeArchive(employeeID string, enterpriseID uuid.UUID) (string, string, string) {
	emp, err := s.employeeRepo.FindByIDNoEnterprise(employeeID)
	if err != nil || emp == nil {
		return "", "", ""
	}
	title := fmt.Sprintf("员工离职归档: %s", emp.Name)
	content := fmt.Sprintf("员工姓名: %s\n工号: %s\n职位: %s\n邮箱: %s\n状态: %s",
		emp.Name, emp.EmployeeNo, emp.Position, emp.Email, emp.Status)
	return title, content, "hr"
}
