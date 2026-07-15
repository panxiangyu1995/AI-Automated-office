package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type PlatformRepository interface {
	CreateServiceTicket(t *model.ServiceTicket) error
	ListServiceTickets(enterpriseID uuid.UUID) ([]model.ServiceTicket, error)
	CreateAnnouncement(a *model.Announcement) error
	ListAnnouncements(enterpriseID uuid.UUID) ([]model.Announcement, error)
	CreateUsageBill(b *model.UsageBill) error
	ListBills(enterpriseID uuid.UUID) ([]model.UsageBill, error)
	CreateServiceConfig(sc *model.ServiceConfig) error
	FindServiceConfig(enterpriseID uuid.UUID, configKey string) (*model.ServiceConfig, error)
	ListEmployees(enterpriseID uuid.UUID) ([]model.Employee, error)
	CountEmployees(enterpriseID uuid.UUID) (int64, error)
	CountCustomers(enterpriseID uuid.UUID) (int64, error)
	CountContracts(enterpriseID uuid.UUID) (int64, error)
}
