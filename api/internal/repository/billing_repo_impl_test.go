package repository

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func setupBillingTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE subscription_plans (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, name VARCHAR(100) NOT NULL, description TEXT,
		price REAL NOT NULL, max_users INTEGER DEFAULT 10, max_storage INTEGER DEFAULT 1073741824,
		features TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active', plan_type VARCHAR(20) DEFAULT 'monthly',
		quotas TEXT, price_monthly REAL DEFAULT 0, price_yearly REAL DEFAULT 0, trial_days INTEGER DEFAULT 0)`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE enterprise_subscriptions (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, plan_id TEXT NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'active',
		start_at TEXT, end_at TEXT, auto_renew BOOLEAN DEFAULT TRUE,
		current_period_start TEXT, current_period_end TEXT, grace_period_end TEXT,
		billing_cycle VARCHAR(20) DEFAULT 'monthly')`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE billing_records (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, subscription_id TEXT NOT NULL,
		amount REAL NOT NULL, type VARCHAR(20) NOT NULL DEFAULT 'charge',
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		period_start DATETIME, period_end DATETIME, due_date DATETIME, paid_at DATETIME)`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE payment_gateway_configs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, provider VARCHAR(30) NOT NULL,
		config TEXT, is_active BOOLEAN DEFAULT TRUE)`).Error)
	return db
}

func TestBillingRepo_CreatePlan_FindPlanByID(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()

	plan := &model.SubscriptionPlan{
		Name:         "Basic",
		Price:        99.0,
		PriceMonthly: 99.0,
		PriceYearly:  999.0,
		MaxUsers:     10,
		Status:       "active",
	}
	plan.EnterpriseID = eid
	plan.ID = uuid.New()

	err := repo.CreatePlan(plan)
	assert.NoError(t, err)

	found, err := repo.FindPlanByID(plan.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "Basic", found.Name)
	assert.Equal(t, 99.0, found.Price)
}

func TestBillingRepo_FindPlanByID_NotFound(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)

	found, err := repo.FindPlanByID(uuid.New())
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestBillingRepo_ListPlans(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()

	for i := 0; i < 5; i++ {
		plan := &model.SubscriptionPlan{
			Name:         "Plan" + string(rune('A'+i)),
			Price:        float64(i+1) * 10,
			PriceMonthly: float64(i+1) * 10,
			Status:       "active",
		}
		plan.EnterpriseID = eid
		plan.ID = uuid.New()
		require.NoError(t, repo.CreatePlan(plan))
	}

	items, total, err := repo.ListPlans(eid, 1, 3)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total)
	assert.Len(t, items, 3)

	items2, total2, err := repo.ListPlans(eid, 2, 3)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total2)
	assert.Len(t, items2, 2)
}

func TestBillingRepo_CreateSubscription_FindSubscriptionByID(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)

	nowStr := time.Now().Format(time.RFC3339)
	sub := &model.EnterpriseSubscription{
		EnterpriseID:       uuid.New().String(),
		PlanID:             uuid.New().String(),
		Status:             "active",
		CurrentPeriodStart: &nowStr,
		CurrentPeriodEnd:   &nowStr,
		BillingCycle:       "monthly",
		AutoRenew:          true,
	}
	sub.ID = uuid.New()

	err := repo.CreateSubscription(sub)
	assert.NoError(t, err)

	found, err := repo.FindSubscriptionByID(sub.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "active", found.Status)
	assert.Equal(t, "monthly", found.BillingCycle)
}

func TestBillingRepo_SaveSubscription(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)

	sub := &model.EnterpriseSubscription{
		EnterpriseID: uuid.New().String(),
		PlanID:       uuid.New().String(),
		Status:       "active",
		BillingCycle: "monthly",
	}
	sub.ID = uuid.New()
	require.NoError(t, repo.CreateSubscription(sub))

	sub.Status = "past_due"
	err := repo.SaveSubscription(sub)
	assert.NoError(t, err)

	found, err := repo.FindSubscriptionByID(sub.ID)
	assert.NoError(t, err)
	assert.Equal(t, "past_due", found.Status)
}

func TestBillingRepo_FindActiveOrPastDueSubscriptions(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)

	for _, status := range []string{"active", "past_due", "suspended", "cancelled"} {
		sub := &model.EnterpriseSubscription{
			EnterpriseID: uuid.New().String(),
			PlanID:       uuid.New().String(),
			Status:       status,
			BillingCycle: "monthly",
		}
		sub.ID = uuid.New()
		require.NoError(t, repo.CreateSubscription(sub))
	}

	subs, err := repo.FindActiveOrPastDueSubscriptions()
	assert.NoError(t, err)
	assert.Len(t, subs, 2)
	for _, s := range subs {
		assert.Contains(t, []string{"active", "past_due"}, s.Status)
	}
}

func TestBillingRepo_CreateBillingRecord_FindByID(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()
	sid := uuid.New()

	now := time.Now()
	record := &model.BillingRecord{
		Amount:         99.0,
		Type:           "charge",
		Status:         "pending",
		SubscriptionID: sid,
		PeriodStart:    &now,
	}
	record.EnterpriseID = eid
	record.ID = uuid.New()

	err := repo.CreateBillingRecord(record)
	assert.NoError(t, err)

	found, err := repo.FindBillingRecordByID(record.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, 99.0, found.Amount)
	assert.Equal(t, "charge", found.Type)
}

func TestBillingRepo_SaveBillingRecord(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
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

	record.Status = "paid"
	now := time.Now()
	record.PaidAt = &now
	err := repo.SaveBillingRecord(record)
	assert.NoError(t, err)

	found, err := repo.FindBillingRecordByID(record.ID)
	assert.NoError(t, err)
	assert.Equal(t, "paid", found.Status)
}

func TestBillingRepo_ListBillingRecords(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		record := &model.BillingRecord{
			Amount:         float64(i+1) * 10,
			Type:           "charge",
			Status:         "pending",
			SubscriptionID: uuid.New(),
		}
		record.EnterpriseID = eid
		record.ID = uuid.New()
		require.NoError(t, repo.CreateBillingRecord(record))
	}

	items, total, err := repo.ListBillingRecords(eid, 1, 10)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, items, 3)
}

func TestBillingRepo_CountPendingBillingRecords(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()

	for _, status := range []string{"pending", "pending", "paid"} {
		record := &model.BillingRecord{
			Amount:         10.0,
			Type:           "charge",
			Status:         status,
			SubscriptionID: uuid.New(),
		}
		record.EnterpriseID = eid
		record.ID = uuid.New()
		require.NoError(t, repo.CreateBillingRecord(record))
	}

	count, err := repo.CountPendingBillingRecords(eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestBillingRepo_CreatePaymentGatewayConfig_FindActive(t *testing.T) {
	db := setupBillingTestDB(t)
	repo := NewBillingRepository(db)
	eid := uuid.New()

	config := &model.PaymentGatewayConfig{
		Provider: "stripe",
		Config:   `{"api_key": "test"}`,
		IsActive: true,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()

	err := repo.CreatePaymentGatewayConfig(config)
	assert.NoError(t, err)

	found, err := repo.FindActivePaymentGatewayConfig("stripe")
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "stripe", found.Provider)
	assert.True(t, found.IsActive)

	notFound, err := repo.FindActivePaymentGatewayConfig("paypal")
	assert.NoError(t, err)
	assert.Nil(t, notFound)
}
