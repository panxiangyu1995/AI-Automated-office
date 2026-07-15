package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockBackupConfigRepo struct {
	configs []model.BackupConfig
}

type mockBackupRecordRepo struct {
	records []model.BackupRecord
}

func (m *mockBackupConfigRepo) Create(config *model.BackupConfig) error {
	if config.ID == uuid.Nil {
		config.ID = uuid.New()
	}
	m.configs = append(m.configs, *config)
	return nil
}

func (m *mockBackupConfigRepo) Update(config *model.BackupConfig) error {
	for i, c := range m.configs {
		if c.ID == config.ID {
			m.configs[i] = *config
			return nil
		}
	}
	return nil
}

func (m *mockBackupConfigRepo) Delete(id, enterpriseID uuid.UUID) error {
	for i, c := range m.configs {
		if c.ID == id {
			m.configs = append(m.configs[:i], m.configs[i+1:]...)
			return nil
		}
	}
	return nil
}

func (m *mockBackupConfigRepo) FindByID(id, enterpriseID uuid.UUID) (*model.BackupConfig, error) {
	for _, c := range m.configs {
		if c.ID == id {
			return &c, nil
		}
	}
	return nil, nil
}

func (m *mockBackupConfigRepo) ListByEnterprise(enterpriseID string) ([]model.BackupConfig, error) {
	var result []model.BackupConfig
	eid, _ := uuid.Parse(enterpriseID)
	for _, c := range m.configs {
		if c.EnterpriseID == eid {
			result = append(result, c)
		}
	}
	return result, nil
}

func (m *mockBackupConfigRepo) ListEnabled() ([]model.BackupConfig, error) {
	var result []model.BackupConfig
	for _, c := range m.configs {
		if c.Enabled {
			result = append(result, c)
		}
	}
	return result, nil
}

func (m *mockBackupRecordRepo) Create(record *model.BackupRecord) error {
	if record.ID == uuid.Nil {
		record.ID = uuid.New()
	}
	m.records = append(m.records, *record)
	return nil
}

func (m *mockBackupRecordRepo) Update(record *model.BackupRecord) error {
	for i, r := range m.records {
		if r.ID == record.ID {
			m.records[i] = *record
			return nil
		}
	}
	return nil
}

func (m *mockBackupRecordRepo) FindByID(id, enterpriseID uuid.UUID) (*model.BackupRecord, error) {
	for _, r := range m.records {
		if r.ID == id {
			return &r, nil
		}
	}
	return nil, nil
}

func (m *mockBackupRecordRepo) ListByEnterprise(enterpriseID string, offset, limit int) ([]model.BackupRecord, int64, error) {
	var result []model.BackupRecord
	eid, _ := uuid.Parse(enterpriseID)
	for _, r := range m.records {
		if r.EnterpriseID == eid {
			result = append(result, r)
		}
	}
	total := int64(len(result))

	start := offset
	if start >= len(result) {
		return nil, total, nil
	}
	end := start + limit
	if end > len(result) {
		end = len(result)
	}
	return result[start:end], total, nil
}

func setupBackupService() (*BackupService, *mockBackupConfigRepo, *mockBackupRecordRepo) {
	configRepo := &mockBackupConfigRepo{}
	recordRepo := &mockBackupRecordRepo{}
	svc := NewBackupService(configRepo, recordRepo, "localhost", "5432", "user", "pass", "db", "/tmp/backups")
	return svc, configRepo, recordRepo
}

func TestBackupService_CreateConfig_Success(t *testing.T) {
	svc, configRepo, _ := setupBackupService()
	eid := uuid.New().String()

	config, err := svc.CreateConfig(eid, "02:00", "/backups", 30, true)
	if err != nil {
		t.Fatalf("CreateConfig failed: %v", err)
	}
	if config.BackupTime != "02:00" {
		t.Errorf("expected backup_time 02:00, got %s", config.BackupTime)
	}
	if !config.Enabled {
		t.Error("expected enabled true")
	}
	if len(configRepo.configs) != 1 {
		t.Errorf("expected 1 config, got %d", len(configRepo.configs))
	}
}

func TestBackupService_CreateConfig_EmptyTime(t *testing.T) {
	svc, _, _ := setupBackupService()
	_, err := svc.CreateConfig(uuid.New().String(), "", "/backups", 30, true)
	if err == nil {
		t.Fatal("expected error for empty backup_time")
	}
}

func TestBackupService_CreateConfig_InvalidTimeFormat(t *testing.T) {
	svc, _, _ := setupBackupService()
	_, err := svc.CreateConfig(uuid.New().String(), "25:00", "/backups", 30, true)
	if err == nil {
		t.Fatal("expected error for invalid time format")
	}
}

func TestBackupService_CreateConfig_InvalidEnterpriseID(t *testing.T) {
	svc, _, _ := setupBackupService()
	_, err := svc.CreateConfig("not-a-uuid", "02:00", "/backups", 30, true)
	if err == nil {
		t.Fatal("expected error for invalid enterprise id")
	}
}

func TestBackupService_CreateConfig_DefaultDirectory(t *testing.T) {
	svc, _, _ := setupBackupService()
	eid := uuid.New().String()

	config, err := svc.CreateConfig(eid, "02:00", "", 30, true)
	if err != nil {
		t.Fatalf("CreateConfig failed: %v", err)
	}
	if config.BackupDirectory != "/tmp/backups" {
		t.Errorf("expected default dir /tmp/backups, got %s", config.BackupDirectory)
	}
}

func TestBackupService_GetConfig_Found(t *testing.T) {
	svc, configRepo, _ := setupBackupService()
	eid := uuid.New().String()
	configRepo.configs = append(configRepo.configs, model.BackupConfig{
		TenantModel: model.TenantModel{EnterpriseID: uuid.MustParse(eid)},
		BackupTime:  "03:00",
	})

	got, err := svc.GetConfig(eid, configRepo.configs[0].ID.String())
	if err != nil {
		t.Fatalf("GetConfig failed: %v", err)
	}
	if got.BackupTime != "03:00" {
		t.Errorf("expected 03:00, got %s", got.BackupTime)
	}
}

func TestBackupService_GetConfig_NotFound(t *testing.T) {
	svc, _, _ := setupBackupService()
	_, err := svc.GetConfig(uuid.New().String(), uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent config")
	}
}

func TestBackupService_DeleteConfig_Success(t *testing.T) {
	svc, configRepo, _ := setupBackupService()
	eid := uuid.New().String()
	configRepo.configs = append(configRepo.configs, model.BackupConfig{
		TenantModel: model.TenantModel{EnterpriseID: uuid.MustParse(eid)},
		BackupTime:  "04:00",
	})

	err := svc.DeleteConfig(configRepo.configs[0].ID.String(), eid)
	if err != nil {
		t.Fatalf("DeleteConfig failed: %v", err)
	}
	if len(configRepo.configs) != 0 {
		t.Errorf("expected 0 configs after delete, got %d", len(configRepo.configs))
	}
}

func TestBackupService_ListConfigs(t *testing.T) {
	svc, configRepo, _ := setupBackupService()
	eid := uuid.New().String()
	otherEID := uuid.New().String()

	configRepo.configs = append(configRepo.configs,
		model.BackupConfig{TenantModel: model.TenantModel{EnterpriseID: uuid.MustParse(eid)}, BackupTime: "01:00"},
		model.BackupConfig{TenantModel: model.TenantModel{EnterpriseID: uuid.MustParse(eid)}, BackupTime: "02:00"},
		model.BackupConfig{TenantModel: model.TenantModel{EnterpriseID: uuid.MustParse(otherEID)}, BackupTime: "03:00"},
	)

	configs, err := svc.ListConfigs(eid)
	if err != nil {
		t.Fatalf("ListConfigs failed: %v", err)
	}
	if len(configs) != 2 {
		t.Errorf("expected 2 configs, got %d", len(configs))
	}
}

func TestBackupService_ListRecords(t *testing.T) {
	svc, _, recordRepo := setupBackupService()
	eid := uuid.New()

	recordRepo.records = append(recordRepo.records,
		model.BackupRecord{TenantModel: model.TenantModel{EnterpriseID: eid}, Status: "success"},
		model.BackupRecord{TenantModel: model.TenantModel{EnterpriseID: eid}, Status: "failed"},
	)

	records, total, err := svc.ListRecords(eid.String(), 1, 20)
	if err != nil {
		t.Fatalf("ListRecords failed: %v", err)
	}
	if total != 2 {
		t.Errorf("expected total 2, got %d", total)
	}
	if len(records) != 2 {
		t.Errorf("expected 2 records, got %d", len(records))
	}
}

func TestBackupService_ListRecords_DefaultPagination(t *testing.T) {
	svc, _, recordRepo := setupBackupService()
	eid := uuid.New()

	for i := 0; i < 30; i++ {
		recordRepo.records = append(recordRepo.records, model.BackupRecord{
			TenantModel: model.TenantModel{EnterpriseID: eid},
			Status:      "success",
		})
	}

	records, total, err := svc.ListRecords(eid.String(), 0, 0)
	if err != nil {
		t.Fatalf("ListRecords failed: %v", err)
	}
	if total != 30 {
		t.Errorf("expected total 30, got %d", total)
	}
	if len(records) != 20 {
		t.Errorf("expected 20 records with default page size, got %d", len(records))
	}
}
