package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type ContextInjectionService struct {
	knowledgeRepo repository.KnowledgeRepository
	contractRepo  repository.ContractRepository
	orderRepo     repository.OrderRepository
	employeeRepo  repository.EmployeeRepository
}

func NewContextInjectionService(
	knowledgeRepo repository.KnowledgeRepository,
	contractRepo repository.ContractRepository,
	orderRepo repository.OrderRepository,
	employeeRepo repository.EmployeeRepository,
) *ContextInjectionService {
	return &ContextInjectionService{
		knowledgeRepo: knowledgeRepo,
		contractRepo:  contractRepo,
		orderRepo:     orderRepo,
		employeeRepo:  employeeRepo,
	}
}

func (s *ContextInjectionService) InjectContext(businessType, businessID, enterpriseID string) ([]model.DocChunk, error) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, err
	}

	query := s.buildContextQuery(businessType, businessID)
	if query == "" {
		return nil, nil
	}

	chunks, err := s.knowledgeRepo.SearchChunksByEnterprise(query, eid, 5)
	if err != nil {
		return nil, err
	}
	return chunks, nil
}

func (s *ContextInjectionService) buildContextQuery(businessType, businessID string) string {
	switch businessType {
	case "contract":
		contract, err := s.contractRepo.FindByIDNoEnterprise(businessID)
		if err != nil || contract == nil {
			return ""
		}
		return contract.Name + " " + contract.Content
	case "sales_order":
		order, err := s.orderRepo.FindSalesOrderByIDNoEnterprise(businessID)
		if err != nil || order == nil {
			return ""
		}
		return order.OrderNo + " " + order.Notes
	case "employee":
		emp, err := s.employeeRepo.FindByIDNoEnterprise(businessID)
		if err != nil || emp == nil {
			return ""
		}
		return emp.Name + " " + emp.Position
	default:
		return ""
	}
}
