package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type PaymentSummary struct {
	TotalContractAmount float64 `json:"total_contract_amount"`
	TotalPaidAmount     float64 `json:"total_paid_amount"`
	PendingAmount       float64 `json:"pending_amount"`
}

type CustomerPanorama struct {
	Customer       *model.Customer      `json:"customer"`
	Contacts       []model.Contact      `json:"contacts"`
	Opportunities  []model.Opportunity  `json:"opportunities"`
	Contracts      []model.Contract     `json:"contracts"`
	ServiceOrders  []model.ServiceOrder `json:"service_orders"`
	PaymentSummary PaymentSummary       `json:"payment_summary"`
}

type CustomerPanoramaService struct {
	customerRepo     repository.CustomerRepository
	contactRepo      repository.ContactRepository
	oppRepo          repository.OpportunityRepository
	contractRepo     repository.ContractRepository
	serviceOrderRepo repository.ServiceOrderRepository
}

func NewCustomerPanoramaService(
	customerRepo repository.CustomerRepository,
	contactRepo repository.ContactRepository,
	oppRepo repository.OpportunityRepository,
	contractRepo repository.ContractRepository,
	serviceOrderRepo repository.ServiceOrderRepository,
) *CustomerPanoramaService {
	return &CustomerPanoramaService{
		customerRepo:     customerRepo,
		contactRepo:      contactRepo,
		oppRepo:          oppRepo,
		contractRepo:     contractRepo,
		serviceOrderRepo: serviceOrderRepo,
	}
}

func (s *CustomerPanoramaService) GetPanorama(customerID, enterpriseID uuid.UUID) (*CustomerPanorama, error) {
	customer, err := s.customerRepo.FindByID(customerID, enterpriseID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, nil
	}

	contacts, _ := s.contactRepo.ListByCustomer(customerID)

	opps, _, _ := s.oppRepo.ListByCustomer(customerID)

	contracts, _ := s.contractRepo.ListByCustomer(customerID, enterpriseID)

	serviceOrders, _ := s.serviceOrderRepo.ListByCustomer(customerID, enterpriseID)

	var totalContractAmount, totalPaidAmount float64
	for _, c := range contracts {
		totalContractAmount += c.Amount
		totalPaidAmount += c.PaidAmount
	}

	return &CustomerPanorama{
		Customer:      customer,
		Contacts:      contacts,
		Opportunities: opps,
		Contracts:     contracts,
		ServiceOrders: serviceOrders,
		PaymentSummary: PaymentSummary{
			TotalContractAmount: totalContractAmount,
			TotalPaidAmount:     totalPaidAmount,
			PendingAmount:       totalContractAmount - totalPaidAmount,
		},
	}, nil
}
