package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type panoramaCustomerRepo struct {
	mock.Mock
}

func (m *panoramaCustomerRepo) Create(customer *model.Customer) error {
	args := m.Called(customer)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) Update(customer *model.Customer) error {
	args := m.Called(customer)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) Delete(id, enterpriseID uuid.UUID) error {
	args := m.Called(id, enterpriseID)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Customer, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Customer), args.Error(1)
}

func (m *panoramaCustomerRepo) FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error) {
	args := m.Called(enterpriseID, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Customer), args.Error(1)
}

func (m *panoramaCustomerRepo) List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.Customer), args.Get(1).(int64), args.Error(2)
}

func (m *panoramaCustomerRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) UpdateFieldsByID(id, enterpriseID string, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *panoramaCustomerRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	args := m.Called(id, enterpriseID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *panoramaCustomerRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

type panoramaContactRepo struct {
	mock.Mock
}

func (m *panoramaContactRepo) Create(contact *model.Contact) error {
	args := m.Called(contact)
	return args.Error(0)
}

func (m *panoramaContactRepo) Update(contact *model.Contact) error {
	args := m.Called(contact)
	return args.Error(0)
}

func (m *panoramaContactRepo) Delete(id, enterpriseID uuid.UUID) error {
	args := m.Called(id, enterpriseID)
	return args.Error(0)
}

func (m *panoramaContactRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Contact, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Contact), args.Error(1)
}

func (m *panoramaContactRepo) ListByCustomer(customerID uuid.UUID) ([]model.Contact, error) {
	args := m.Called(customerID)
	return args.Get(0).([]model.Contact), args.Error(1)
}

func (m *panoramaContactRepo) ListByCustomerAndRole(customerID uuid.UUID, role string) ([]model.Contact, error) {
	args := m.Called(customerID, role)
	return args.Get(0).([]model.Contact), args.Error(1)
}

func (m *panoramaContactRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	args := m.Called(id, enterpriseID)
	return args.Get(0).(int64), args.Error(1)
}

type panoramaOppRepo struct {
	mock.Mock
}

func (m *panoramaOppRepo) Create(op *model.Opportunity) error {
	args := m.Called(op)
	return args.Error(0)
}

func (m *panoramaOppRepo) Update(op *model.Opportunity) error {
	args := m.Called(op)
	return args.Error(0)
}

func (m *panoramaOppRepo) Delete(id, enterpriseID uuid.UUID) error {
	args := m.Called(id, enterpriseID)
	return args.Error(0)
}

func (m *panoramaOppRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Opportunity, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Opportunity), args.Error(1)
}

func (m *panoramaOppRepo) ListByCustomer(customerID uuid.UUID) ([]model.Opportunity, int64, error) {
	args := m.Called(customerID)
	return args.Get(0).([]model.Opportunity), args.Get(1).(int64), args.Error(2)
}

type panoramaContractRepo struct {
	mock.Mock
}

func (m *panoramaContractRepo) Create(c *model.Contract) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *panoramaContractRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Contract, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Contract), args.Error(1)
}

func (m *panoramaContractRepo) FindByIDNoEnterprise(id string) (*model.Contract, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Contract), args.Error(1)
}

func (m *panoramaContractRepo) List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.Contract, int64, error) {
	args := m.Called(enterpriseID, status, page, pageSize)
	return args.Get(0).([]model.Contract), args.Get(1).(int64), args.Error(2)
}

func (m *panoramaContractRepo) ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.Contract, error) {
	args := m.Called(customerID, enterpriseID)
	return args.Get(0).([]model.Contract), args.Error(1)
}

func (m *panoramaContractRepo) Update(c *model.Contract) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *panoramaContractRepo) Delete(c *model.Contract, enterpriseID uuid.UUID) error {
	args := m.Called(c, enterpriseID)
	return args.Error(0)
}

func (m *panoramaContractRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	args := m.Called(id, enterpriseID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *panoramaContractRepo) PatchFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.Contract, error) {
	args := m.Called(id, enterpriseID, fields)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Contract), args.Error(1)
}

func (m *panoramaContractRepo) UpdateFields(id, enterpriseID string, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *panoramaContractRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *panoramaContractRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

func (m *panoramaContractRepo) CreateAttachment(att *model.ContractAttachment) error {
	args := m.Called(att)
	return args.Error(0)
}

func (m *panoramaContractRepo) CreateReference(cr *model.ContractReference) error {
	args := m.Called(cr)
	return args.Error(0)
}

func (m *panoramaContractRepo) ListReferences(contractID uuid.UUID) ([]model.ContractReference, error) {
	args := m.Called(contractID)
	return args.Get(0).([]model.ContractReference), args.Error(1)
}

type panoramaServiceOrderRepo struct {
	mock.Mock
}

func (m *panoramaServiceOrderRepo) Create(order *model.ServiceOrder) error {
	args := m.Called(order)
	return args.Error(0)
}

func (m *panoramaServiceOrderRepo) FindByID(id, enterpriseID uuid.UUID) (*model.ServiceOrder, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func (m *panoramaServiceOrderRepo) Save(order *model.ServiceOrder) error {
	args := m.Called(order)
	return args.Error(0)
}

func (m *panoramaServiceOrderRepo) Delete(order *model.ServiceOrder, enterpriseID uuid.UUID) error {
	args := m.Called(order, enterpriseID)
	return args.Error(0)
}

func (m *panoramaServiceOrderRepo) List(enterpriseID uuid.UUID, orderType, status string, page, pageSize int) ([]model.ServiceOrder, int64, error) {
	args := m.Called(enterpriseID, orderType, status, page, pageSize)
	return args.Get(0).([]model.ServiceOrder), args.Get(1).(int64), args.Error(2)
}

func (m *panoramaServiceOrderRepo) ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.ServiceOrder, error) {
	args := m.Called(customerID, enterpriseID)
	return args.Get(0).([]model.ServiceOrder), args.Error(1)
}

func (m *panoramaServiceOrderRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

func (m *panoramaServiceOrderRepo) CreateFileMetadata(meta *model.FileMetadata) error {
	args := m.Called(meta)
	return args.Error(0)
}

func (m *panoramaServiceOrderRepo) ListFileMetadata(refType, refID string) ([]model.FileMetadata, error) {
	args := m.Called(refType, refID)
	return args.Get(0).([]model.FileMetadata), args.Error(1)
}

func TestGetPanorama_CustomerNotFound(t *testing.T) {
	customerRepo := new(panoramaCustomerRepo)
	contactRepo := new(panoramaContactRepo)
	oppRepo := new(panoramaOppRepo)
	contractRepo := new(panoramaContractRepo)
	serviceOrderRepo := new(panoramaServiceOrderRepo)

	svc := NewCustomerPanoramaService(customerRepo, contactRepo, oppRepo, contractRepo, serviceOrderRepo)

	custID := uuid.New()
	entID := uuid.New()

	customerRepo.On("FindByID", custID, entID).Return(nil, nil)

	result, err := svc.GetPanorama(custID, entID)
	assert.Nil(t, err)
	assert.Nil(t, result)
}

func TestGetPanorama_CustomerFound_NoRelatedData(t *testing.T) {
	customerRepo := new(panoramaCustomerRepo)
	contactRepo := new(panoramaContactRepo)
	oppRepo := new(panoramaOppRepo)
	contractRepo := new(panoramaContractRepo)
	serviceOrderRepo := new(panoramaServiceOrderRepo)

	svc := NewCustomerPanoramaService(customerRepo, contactRepo, oppRepo, contractRepo, serviceOrderRepo)

	custID := uuid.New()
	entID := uuid.New()
	customer := &model.Customer{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: custID}, EnterpriseID: entID},
		Name:        "测试客户",
	}

	customerRepo.On("FindByID", custID, entID).Return(customer, nil)
	contactRepo.On("ListByCustomer", custID).Return([]model.Contact{}, nil)
	oppRepo.On("ListByCustomer", custID).Return([]model.Opportunity{}, int64(0), nil)
	contractRepo.On("ListByCustomer", custID, entID).Return([]model.Contract{}, nil)
	serviceOrderRepo.On("ListByCustomer", custID, entID).Return([]model.ServiceOrder{}, nil)

	result, err := svc.GetPanorama(custID, entID)
	assert.Nil(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "测试客户", result.Customer.Name)
	assert.Equal(t, 0, len(result.Contacts))
	assert.Equal(t, 0, len(result.Opportunities))
	assert.Equal(t, 0.0, result.PaymentSummary.TotalContractAmount)
}

func TestGetPanorama_WithContactsAndOpportunities(t *testing.T) {
	customerRepo := new(panoramaCustomerRepo)
	contactRepo := new(panoramaContactRepo)
	oppRepo := new(panoramaOppRepo)
	contractRepo := new(panoramaContractRepo)
	serviceOrderRepo := new(panoramaServiceOrderRepo)

	svc := NewCustomerPanoramaService(customerRepo, contactRepo, oppRepo, contractRepo, serviceOrderRepo)

	custID := uuid.New()
	entID := uuid.New()
	customer := &model.Customer{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: custID}, EnterpriseID: entID},
		Name:        "测试客户",
	}

	contacts := []model.Contact{
		{Name: "张三", Phone: "13800138000"},
	}
	opps := []model.Opportunity{
		{Name: "商机A", Amount: 10000},
	}

	customerRepo.On("FindByID", custID, entID).Return(customer, nil)
	contactRepo.On("ListByCustomer", custID).Return(contacts, nil)
	oppRepo.On("ListByCustomer", custID).Return(opps, int64(1), nil)
	contractRepo.On("ListByCustomer", custID, entID).Return([]model.Contract{}, nil)
	serviceOrderRepo.On("ListByCustomer", custID, entID).Return([]model.ServiceOrder{}, nil)

	result, err := svc.GetPanorama(custID, entID)
	assert.Nil(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 1, len(result.Contacts))
	assert.Equal(t, 1, len(result.Opportunities))
	assert.Equal(t, "张三", result.Contacts[0].Name)
}

var _ repository.CustomerRepository = (*panoramaCustomerRepo)(nil)
var _ repository.ContactRepository = (*panoramaContactRepo)(nil)
var _ repository.OpportunityRepository = (*panoramaOppRepo)(nil)
var _ repository.ContractRepository = (*panoramaContractRepo)(nil)
var _ repository.ServiceOrderRepository = (*panoramaServiceOrderRepo)(nil)
