package service

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockApiQuotaRepo struct {
	quotas map[string]*model.ApiQuota
}

func newMockApiQuotaRepo() *mockApiQuotaRepo {
	return &mockApiQuotaRepo{quotas: make(map[string]*model.ApiQuota)}
}

func (m *mockApiQuotaRepo) FindByEnterprise(enterpriseID uuid.UUID) (*model.ApiQuota, error) {
	q, ok := m.quotas[enterpriseID.String()]
	if !ok {
		return nil, nil
	}
	return q, nil
}

func (m *mockApiQuotaRepo) Create(quota *model.ApiQuota) error {
	key := quota.EnterpriseID.String()
	m.quotas[key] = quota
	return nil
}

func (m *mockApiQuotaRepo) Update(quota *model.ApiQuota) error {
	key := quota.EnterpriseID.String()
	m.quotas[key] = quota
	return nil
}

func (m *mockApiQuotaRepo) Upsert(quota *model.ApiQuota) error {
	return m.Update(quota)
}

type mockFeatureFlagRepo struct {
	flags map[string]*model.FeatureFlag
}

func newMockFeatureFlagRepo() *mockFeatureFlagRepo {
	return &mockFeatureFlagRepo{flags: make(map[string]*model.FeatureFlag)}
}

func (m *mockFeatureFlagRepo) FindByEnterprise(enterpriseID uuid.UUID) ([]model.FeatureFlag, error) {
	var result []model.FeatureFlag
	for _, f := range m.flags {
		if f.EnterpriseID == enterpriseID {
			result = append(result, *f)
		}
	}
	return result, nil
}

func (m *mockFeatureFlagRepo) Find(enterpriseID uuid.UUID, featureKey string) (*model.FeatureFlag, error) {
	key := enterpriseID.String() + ":" + featureKey
	f, ok := m.flags[key]
	if !ok {
		return nil, nil
	}
	return f, nil
}

func (m *mockFeatureFlagRepo) Create(flag *model.FeatureFlag) error {
	key := flag.EnterpriseID.String() + ":" + flag.FeatureKey
	m.flags[key] = flag
	return nil
}

func (m *mockFeatureFlagRepo) Update(flag *model.FeatureFlag) error {
	key := flag.EnterpriseID.String() + ":" + flag.FeatureKey
	m.flags[key] = flag
	return nil
}

func (m *mockFeatureFlagRepo) Delete(id uuid.UUID) error {
	for k, f := range m.flags {
		if f.ID == id {
			delete(m.flags, k)
			break
		}
	}
	return nil
}

func (m *mockFeatureFlagRepo) InitDefaults(enterpriseID uuid.UUID) error {
	return nil
}

func setupQuotaService() (*QuotaService, *mockApiQuotaRepo, *mockFeatureFlagRepo) {
	quotaRepo := newMockApiQuotaRepo()
	featureRepo := newMockFeatureFlagRepo()
	svc := NewQuotaService(quotaRepo, featureRepo)
	return svc, quotaRepo, featureRepo
}

func TestCheckAndIncrement_CreatesNewQuota(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()

	err := svc.CheckAndIncrement(eid)
	if err != nil {
		t.Fatalf("CheckAndIncrement failed: %v", err)
	}

	q, ok := quotaRepo.quotas[eid.String()]
	if !ok {
		t.Fatal("expected quota to be created")
	}
	if q.DailyUsed != 1 {
		t.Errorf("expected daily_used 1, got %d", q.DailyUsed)
	}
	if q.MonthlyUsed != 1 {
		t.Errorf("expected monthly_used 1, got %d", q.MonthlyUsed)
	}
}

func TestCheckAndIncrement_IncrementsExisting(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	now := time.Now().UTC()

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     10000,
		MonthlyLimit:   300000,
		DailyUsed:      5,
		MonthlyUsed:    50,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}

	err := svc.CheckAndIncrement(eid)
	if err != nil {
		t.Fatalf("CheckAndIncrement failed: %v", err)
	}

	q := quotaRepo.quotas[eid.String()]
	if q.DailyUsed != 6 {
		t.Errorf("expected daily_used 6, got %d", q.DailyUsed)
	}
	if q.MonthlyUsed != 51 {
		t.Errorf("expected monthly_used 51, got %d", q.MonthlyUsed)
	}
}

func TestCheckAndIncrement_ExceedsDaily(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	now := time.Now().UTC()

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     10,
		MonthlyLimit:   300,
		DailyUsed:      10,
		MonthlyUsed:    50,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}

	err := svc.CheckAndIncrement(eid)
	if err == nil {
		t.Fatal("expected error for exceeded daily quota")
	}
	if err.Code != "PERM_QUOTA_EXCEEDED" {
		t.Errorf("expected PERM_QUOTA_EXCEEDED, got %s", err.Code)
	}
}

func TestCheckAndIncrement_ExceedsMonthly(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	now := time.Now().UTC()

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     100,
		MonthlyLimit:   300,
		DailyUsed:      5,
		MonthlyUsed:    300,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}

	err := svc.CheckAndIncrement(eid)
	if err == nil {
		t.Fatal("expected error for exceeded monthly quota")
	}
}

func TestCheckAndIncrement_ResetsDaily(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	yesterday := time.Now().UTC().AddDate(0, 0, -1)

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     100,
		MonthlyLimit:   300,
		DailyUsed:      100,
		MonthlyUsed:    50,
		DailyResetAt:   yesterday,
		MonthlyResetAt: time.Now().UTC(),
	}

	err := svc.CheckAndIncrement(eid)
	if err != nil {
		t.Fatalf("CheckAndIncrement failed: %v", err)
	}

	q := quotaRepo.quotas[eid.String()]
	if q.DailyUsed != 1 {
		t.Errorf("expected daily_used 1 after reset, got %d", q.DailyUsed)
	}
}

func TestGetQuota_Found(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	now := time.Now().UTC()

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     100,
		MonthlyLimit:   300,
		DailyUsed:      5,
		MonthlyUsed:    50,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}

	q, err := svc.GetQuota(eid)
	if err != nil {
		t.Fatalf("GetQuota failed: %v", err)
	}
	if q.DailyLimit != 100 {
		t.Errorf("expected daily_limit 100, got %d", q.DailyLimit)
	}
}

func TestGetQuota_NotFound(t *testing.T) {
	svc, _, _ := setupQuotaService()
	_, err := svc.GetQuota(uuid.New())
	if err == nil {
		t.Fatal("expected error for nonexistent quota")
	}
}

func TestUpdateQuota_Success(t *testing.T) {
	svc, quotaRepo, _ := setupQuotaService()
	eid := uuid.New()
	now := time.Now().UTC()

	quotaRepo.quotas[eid.String()] = &model.ApiQuota{
		TenantModel:    model.TenantModel{EnterpriseID: eid},
		DailyLimit:     100,
		MonthlyLimit:   300,
		DailyUsed:      5,
		MonthlyUsed:    50,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}

	q, err := svc.UpdateQuota(eid, 200, 600)
	if err != nil {
		t.Fatalf("UpdateQuota failed: %v", err)
	}
	if q.DailyLimit != 200 {
		t.Errorf("expected daily_limit 200, got %d", q.DailyLimit)
	}
	if q.MonthlyLimit != 600 {
		t.Errorf("expected monthly_limit 600, got %d", q.MonthlyLimit)
	}
}

func TestCheckFeature_NotExists(t *testing.T) {
	svc, _, _ := setupQuotaService()
	err := svc.CheckFeature(uuid.New(), "crm")
	if err != nil {
		t.Fatal("expected no error for missing feature flag")
	}
}

func TestCheckFeature_Enabled(t *testing.T) {
	svc, _, featureRepo := setupQuotaService()
	eid := uuid.New()

	featureRepo.Create(&model.FeatureFlag{
		TenantModel: model.TenantModel{EnterpriseID: eid},
		FeatureKey:  "crm",
		Enabled:     true,
	})

	err := svc.CheckFeature(eid, "crm")
	if err != nil {
		t.Fatal("expected no error for enabled feature")
	}
}

func TestCheckFeature_Disabled(t *testing.T) {
	svc, _, featureRepo := setupQuotaService()
	eid := uuid.New()

	featureRepo.Create(&model.FeatureFlag{
		TenantModel: model.TenantModel{EnterpriseID: eid},
		FeatureKey:  "crm",
		Enabled:     false,
	})

	err := svc.CheckFeature(eid, "crm")
	if err == nil {
		t.Fatal("expected error for disabled feature")
	}
	if err.Code != "PERM_FEATURE_DISABLED" {
		t.Errorf("expected PERM_FEATURE_DISABLED, got %s", err.Code)
	}
}

func TestGetFeatureFlags(t *testing.T) {
	svc, _, featureRepo := setupQuotaService()
	eid := uuid.New()

	featureRepo.Create(&model.FeatureFlag{
		TenantModel: model.TenantModel{EnterpriseID: eid},
		FeatureKey:  "crm",
		Enabled:     true,
	})
	featureRepo.Create(&model.FeatureFlag{
		TenantModel: model.TenantModel{EnterpriseID: eid},
		FeatureKey:  "hrm",
		Enabled:     false,
	})

	flags, err := svc.GetFeatureFlags(eid)
	if err != nil {
		t.Fatalf("GetFeatureFlags failed: %v", err)
	}
	if len(flags) != 2 {
		t.Errorf("expected 2 flags, got %d", len(flags))
	}
}

func TestUpdateFeatureFlag_Create(t *testing.T) {
	svc, _, _ := setupQuotaService()
	eid := uuid.New().String()

	flag, err := svc.UpdateFeatureFlag(eid, "crm", true)
	if err != nil {
		t.Fatalf("UpdateFeatureFlag failed: %v", err)
	}
	if flag.FeatureKey != "crm" {
		t.Errorf("expected feature_key crm, got %s", flag.FeatureKey)
	}
	if !flag.Enabled {
		t.Error("expected enabled true")
	}
}

func TestUpdateFeatureFlag_Update(t *testing.T) {
	svc, _, featureRepo := setupQuotaService()
	eid := uuid.New()
	featureRepo.Create(&model.FeatureFlag{
		TenantModel: model.TenantModel{EnterpriseID: eid},
		FeatureKey:  "crm",
		Enabled:     true,
	})

	flag, err := svc.UpdateFeatureFlag(eid.String(), "crm", false)
	if err != nil {
		t.Fatalf("UpdateFeatureFlag failed: %v", err)
	}
	if flag.Enabled {
		t.Error("expected enabled false after update")
	}
}
