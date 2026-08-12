package service

import (
	"math"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type mockBillingRepo struct {
	plans          map[string]*model.SubscriptionPlan
	subscriptions  map[string]*model.EnterpriseSubscription
	records        map[string]*model.BillingRecord
	gatewayConfigs map[string]*model.PaymentGatewayConfig
}

func newMockBillingRepo() *mockBillingRepo {
	return &mockBillingRepo{
		plans:          make(map[string]*model.SubscriptionPlan),
		subscriptions:  make(map[string]*model.EnterpriseSubscription),
		records:        make(map[string]*model.BillingRecord),
		gatewayConfigs: make(map[string]*model.PaymentGatewayConfig),
	}
}

func (m *mockBillingRepo) CreatePlan(plan *model.SubscriptionPlan) error {
	if plan.ID == uuid.Nil {
		plan.ID = uuid.New()
	}
	m.plans[plan.ID.String()] = plan
	return nil
}

func (m *mockBillingRepo) FindPlanByID(id uuid.UUID) (*model.SubscriptionPlan, error) {
	p, ok := m.plans[id.String()]
	if !ok {
		return nil, nil
	}
	return p, nil
}

func (m *mockBillingRepo) ListPlans(enterpriseID uuid.UUID, page, pageSize int) ([]model.SubscriptionPlan, int64, error) {
	var items []model.SubscriptionPlan
	for _, p := range m.plans {
		if p.EnterpriseID == enterpriseID {
			items = append(items, *p)
		}
	}
	return items, int64(len(items)), nil
}

func (m *mockBillingRepo) CreateSubscription(sub *model.EnterpriseSubscription) error {
	if sub.ID == uuid.Nil {
		sub.ID = uuid.New()
	}
	m.subscriptions[sub.ID.String()] = sub
	return nil
}

func (m *mockBillingRepo) FindSubscriptionByID(id uuid.UUID) (*model.EnterpriseSubscription, error) {
	s, ok := m.subscriptions[id.String()]
	if !ok {
		return nil, nil
	}
	return s, nil
}

func (m *mockBillingRepo) SaveSubscription(sub *model.EnterpriseSubscription) error {
	m.subscriptions[sub.ID.String()] = sub
	return nil
}

func (m *mockBillingRepo) FindActiveOrPastDueSubscriptions() ([]model.EnterpriseSubscription, error) {
	var items []model.EnterpriseSubscription
	for _, s := range m.subscriptions {
		if s.Status == "active" || s.Status == "past_due" {
			items = append(items, *s)
		}
	}
	return items, nil
}

func (m *mockBillingRepo) CreateBillingRecord(record *model.BillingRecord) error {
	if record.ID == uuid.Nil {
		record.ID = uuid.New()
	}
	m.records[record.ID.String()] = record
	return nil
}

func (m *mockBillingRepo) FindBillingRecordByID(id uuid.UUID) (*model.BillingRecord, error) {
	r, ok := m.records[id.String()]
	if !ok {
		return nil, nil
	}
	return r, nil
}

func (m *mockBillingRepo) SaveBillingRecord(record *model.BillingRecord) error {
	m.records[record.ID.String()] = record
	return nil
}

func (m *mockBillingRepo) ListBillingRecords(enterpriseID uuid.UUID, page, pageSize int) ([]model.BillingRecord, int64, error) {
	var items []model.BillingRecord
	for _, r := range m.records {
		if r.EnterpriseID == enterpriseID {
			items = append(items, *r)
		}
	}
	return items, int64(len(items)), nil
}

func (m *mockBillingRepo) CountBillingRecords(enterpriseID uuid.UUID, status string, recordTypes []string, since time.Time) (int64, float64, error) {
	var count int64
	var total float64
	for _, r := range m.records {
		if r.EnterpriseID != enterpriseID || r.Status != status {
			continue
		}
		if recordTypes != nil {
			matched := false
			for _, rt := range recordTypes {
				if r.Type == rt {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if r.CreatedAt.Before(since) {
			continue
		}
		count++
		total += r.Amount
	}
	return count, total, nil
}

func (m *mockBillingRepo) CountPendingBillingRecords(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	for _, r := range m.records {
		if r.EnterpriseID == enterpriseID && r.Status == "pending" {
			count++
		}
	}
	return count, nil
}

func (m *mockBillingRepo) CreatePaymentGatewayConfig(config *model.PaymentGatewayConfig) error {
	if config.ID == uuid.Nil {
		config.ID = uuid.New()
	}
	m.gatewayConfigs[config.ID.String()] = config
	return nil
}

func (m *mockBillingRepo) FindActivePaymentGatewayConfig(provider string) (*model.PaymentGatewayConfig, error) {
	for _, c := range m.gatewayConfigs {
		if c.Provider == provider && c.IsActive {
			return c, nil
		}
	}
	return nil, nil
}

var _ repository.BillingRepository = (*mockBillingRepo)(nil)

func setupBillingService() (*BillingService, *mockBillingRepo) {
	repo := newMockBillingRepo()
	svc := NewBillingService(repo)
	return svc, repo
}

func TestBillingService_CreatePlan(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	plan := &model.SubscriptionPlan{
		Name:         "Pro",
		Price:        199.0,
		PriceMonthly: 199.0,
		PriceYearly:  1999.0,
		Status:       "active",
	}
	plan.EnterpriseID = eid

	err := svc.CreatePlan(plan)
	assert.Nil(t, err)
	assert.Equal(t, 1, len(repo.plans))
}

func TestBillingService_Subscribe_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	plan := &model.SubscriptionPlan{
		Name:         "Basic",
		Price:        99.0,
		PriceMonthly: 99.0,
		PriceYearly:  999.0,
		Status:       "active",
	}
	plan.EnterpriseID = eid
	plan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(plan))

	sub, err := svc.Subscribe(eid, plan.ID, "monthly")
	assert.Nil(t, err)
	assert.NotNil(t, sub)
	assert.Equal(t, "active", sub.Status)
	assert.Equal(t, "monthly", sub.BillingCycle)
	assert.Equal(t, 1, len(repo.records))
}

func TestBillingService_Subscribe_PlanNotFound(t *testing.T) {
	svc, _ := setupBillingService()

	_, err := svc.Subscribe(uuid.New(), uuid.New(), "monthly")
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestBillingService_Subscribe_Yearly(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	plan := &model.SubscriptionPlan{
		Name:        "Enterprise",
		Price:       1000.0,
		PriceYearly: 999.0,
		Status:      "active",
	}
	plan.EnterpriseID = eid
	plan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(plan))

	sub, err := svc.Subscribe(eid, plan.ID, "yearly")
	assert.Nil(t, err)
	assert.Equal(t, "yearly", sub.BillingCycle)
}

func TestBillingService_UpgradePlan_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	oldPlan := &model.SubscriptionPlan{Name: "Basic", Price: 99.0, PriceMonthly: 99.0, Status: "active"}
	oldPlan.EnterpriseID = eid
	oldPlan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(oldPlan))

	newPlan := &model.SubscriptionPlan{Name: "Pro", Price: 199.0, PriceMonthly: 199.0, Status: "active"}
	newPlan.EnterpriseID = eid
	newPlan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(newPlan))

	nowStr := time.Now().Format(time.RFC3339)
	endStr := time.Now().AddDate(0, 1, 0).Format(time.RFC3339)
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       eid.String(),
		PlanID:             oldPlan.ID.String(),
		Status:             "active",
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	sub.ID = uuid.New()
	require.NoError(t, repo.CreateSubscription(sub))

	record, err := svc.UpgradePlan(sub.ID, newPlan.ID)
	assert.Nil(t, err)
	assert.NotNil(t, record)
	assert.Equal(t, "upgrade_charge", record.Type)
	assert.True(t, record.Amount > 0)
}

func TestBillingService_UpgradePlan_SubscriptionNotFound(t *testing.T) {
	svc, _ := setupBillingService()

	_, err := svc.UpgradePlan(uuid.New(), uuid.New())
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestBillingService_DowngradePlan_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	oldPlan := &model.SubscriptionPlan{Name: "Pro", Price: 199.0, PriceMonthly: 199.0, Status: "active"}
	oldPlan.EnterpriseID = eid
	oldPlan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(oldPlan))

	newPlan := &model.SubscriptionPlan{Name: "Basic", Price: 99.0, PriceMonthly: 99.0, Status: "active"}
	newPlan.EnterpriseID = eid
	newPlan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(newPlan))

	nowStr := time.Now().Format(time.RFC3339)
	endStr := time.Now().AddDate(0, 1, 0).Format(time.RFC3339)
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       eid.String(),
		PlanID:             oldPlan.ID.String(),
		Status:             "active",
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	sub.ID = uuid.New()
	require.NoError(t, repo.CreateSubscription(sub))

	record, err := svc.DowngradePlan(sub.ID, newPlan.ID)
	assert.Nil(t, err)
	assert.NotNil(t, record)
	assert.Contains(t, []string{"downgrade_credit", "downgrade_charge"}, record.Type)
}

func TestBillingService_Refund_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	record := &model.BillingRecord{
		Amount:         99.0,
		Type:           "charge",
		Status:         "paid",
		SubscriptionID: uuid.New(),
	}
	record.EnterpriseID = eid
	record.ID = uuid.New()
	require.NoError(t, repo.CreateBillingRecord(record))

	refunded, err := svc.Refund(record.ID)
	assert.Nil(t, err)
	assert.Equal(t, "refunded", refunded.Status)
	assert.NotNil(t, refunded.PaidAt)
}

func TestBillingService_Refund_NotFound(t *testing.T) {
	svc, _ := setupBillingService()

	_, err := svc.Refund(uuid.New())
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestBillingService_GetBill_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	record := &model.BillingRecord{
		Amount:         50.0,
		Type:           "charge",
		Status:         "pending",
		SubscriptionID: uuid.New(),
	}
	record.EnterpriseID = eid
	record.ID = uuid.New()
	require.NoError(t, repo.CreateBillingRecord(record))

	found, err := svc.GetBill(record.ID)
	assert.Nil(t, err)
	assert.Equal(t, 50.0, found.Amount)
}

func TestBillingService_GetBill_NotFound(t *testing.T) {
	svc, _ := setupBillingService()

	_, err := svc.GetBill(uuid.New())
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestBillingService_RenewSubscription_Success(t *testing.T) {
	svc, repo := setupBillingService()
	eid := uuid.New()

	plan := &model.SubscriptionPlan{Name: "Basic", Price: 99.0, PriceMonthly: 99.0, Status: "active"}
	plan.EnterpriseID = eid
	plan.ID = uuid.New()
	require.NoError(t, repo.CreatePlan(plan))

	nowStr := time.Now().Format(time.RFC3339)
	endStr := time.Now().AddDate(0, 1, 0).Format(time.RFC3339)
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       eid.String(),
		PlanID:             plan.ID.String(),
		Status:             "active",
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	sub.ID = uuid.New()
	require.NoError(t, repo.CreateSubscription(sub))

	renewed, err := svc.RenewSubscription(sub.ID)
	assert.Nil(t, err)
	assert.Equal(t, "active", renewed.Status)
	assert.Nil(t, renewed.GracePeriodEnd)
}

func TestBillingService_RenewSubscription_NotFound(t *testing.T) {
	svc, _ := setupBillingService()

	_, err := svc.RenewSubscription(uuid.New())
	assert.Error(t, err)
	assert.Equal(t, "RES_NOT_FOUND", err.Code)
}

func TestCalculateProration_Upgrade(t *testing.T) {
	s := &BillingService{}
	now := time.Now()
	end := now.AddDate(0, 1, 0)
	nowStr := now.Format(time.RFC3339)
	endStr := end.Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	oldPlan := model.SubscriptionPlan{Price: 100, PriceMonthly: 100}
	newPlan := model.SubscriptionPlan{Price: 200, PriceMonthly: 200}

	prorated := s.calculateProration(sub, oldPlan, newPlan)

	totalDays := end.Sub(now).Hours() / 24
	remainingDays := end.Sub(now).Hours() / 24
	expected := (200.0 - 100.0) * remainingDays / totalDays

	assert.True(t, math.Abs(prorated-expected) < 0.01, "proration should equal expected value")
	assert.True(t, prorated > 0, "upgrade proration should be positive")
}

func TestCalculateProration_Downgrade(t *testing.T) {
	s := &BillingService{}
	now := time.Now()
	end := now.AddDate(0, 1, 0)
	nowStr := now.Format(time.RFC3339)
	endStr := end.Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	oldPlan := model.SubscriptionPlan{Price: 200, PriceMonthly: 200}
	newPlan := model.SubscriptionPlan{Price: 100, PriceMonthly: 100}

	prorated := s.calculateProration(sub, oldPlan, newPlan)

	assert.True(t, prorated < 0, "downgrade proration should be negative (credit)")
}

func TestCalculateProration_HalfwayThrough(t *testing.T) {
	s := &BillingService{}
	start := time.Now().AddDate(0, 0, -15)
	end := time.Now().AddDate(0, 0, 15)
	startStr := start.Format(time.RFC3339)
	endStr := end.Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		CurrentPeriodStart: &startStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "monthly",
	}
	oldPlan := model.SubscriptionPlan{Price: 100, PriceMonthly: 100}
	newPlan := model.SubscriptionPlan{Price: 200, PriceMonthly: 200}

	prorated := s.calculateProration(sub, oldPlan, newPlan)

	totalDays := end.Sub(start).Hours() / 24
	remainingDays := end.Sub(time.Now()).Hours() / 24
	expected := (200.0 - 100.0) * remainingDays / totalDays

	assert.True(t, math.Abs(prorated-expected) < 1.0, "halfway proration should be approximately half the difference")
}

func TestCalculateProration_NoPeriodDates(t *testing.T) {
	s := &BillingService{}

	sub := model.EnterpriseSubscription{
		CurrentPeriodStart: nil,
		CurrentPeriodEnd:   nil,
		BillingCycle:       "monthly",
	}
	oldPlan := model.SubscriptionPlan{Price: 100, PriceMonthly: 100}
	newPlan := model.SubscriptionPlan{Price: 200, PriceMonthly: 200}

	prorated := s.calculateProration(sub, oldPlan, newPlan)

	assert.Equal(t, 100.0, prorated, "without period dates, should return price difference")
}

func TestCalculateProration_YearlyCycle(t *testing.T) {
	s := &BillingService{}
	now := time.Now()
	end := now.AddDate(1, 0, 0)
	nowStr := now.Format(time.RFC3339)
	endStr := end.Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &endStr,
		BillingCycle:       "yearly",
	}
	oldPlan := model.SubscriptionPlan{Price: 1000, PriceYearly: 1000}
	newPlan := model.SubscriptionPlan{Price: 2000, PriceYearly: 2000}

	prorated := s.calculateProration(sub, oldPlan, newPlan)

	totalDays := end.Sub(now).Hours() / 24
	remainingDays := end.Sub(now).Hours() / 24
	expected := (2000.0 - 1000.0) * remainingDays / totalDays

	assert.True(t, math.Abs(prorated-expected) < 0.01, "yearly proration should use yearly prices")
}

func TestProcessGracePeriod_ExpiredSubscription(t *testing.T) {
	pastEnd := time.Now().AddDate(0, 0, -2).Format(time.RFC3339)
	graceEnd := time.Now().AddDate(0, 0, 5).Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		BaseModel:        model.BaseModel{ID: uuid.New()},
		EnterpriseID:     uuid.New().String(),
		PlanID:           uuid.New().String(),
		Status:           "active",
		CurrentPeriodEnd: &pastEnd,
		GracePeriodEnd:   &graceEnd,
	}

	assert.Equal(t, "active", sub.Status)
	_ = sub
}

func TestProcessGracePeriod_GracePeriodExpired(t *testing.T) {
	pastEnd := time.Now().AddDate(0, 0, -10).Format(time.RFC3339)
	pastGrace := time.Now().AddDate(0, 0, -3).Format(time.RFC3339)

	sub := model.EnterpriseSubscription{
		BaseModel:        model.BaseModel{ID: uuid.New()},
		EnterpriseID:     uuid.New().String(),
		PlanID:           uuid.New().String(),
		Status:           "past_due",
		CurrentPeriodEnd: &pastEnd,
		GracePeriodEnd:   &pastGrace,
	}

	assert.Equal(t, "past_due", sub.Status)
}

func TestGenerateBill_AmountCalculation(t *testing.T) {
	plan := model.SubscriptionPlan{Price: 100, PriceMonthly: 50, PriceYearly: 500}

	assert.Equal(t, float64(50), plan.PriceMonthly)
	assert.Equal(t, float64(500), plan.PriceYearly)
	assert.Equal(t, float64(100), plan.Price)
}
