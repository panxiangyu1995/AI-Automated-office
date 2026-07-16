package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type mockEnterpriseRepo struct {
	enterprises map[string]*model.Enterprise
}

func newMockEnterpriseRepo() *mockEnterpriseRepo {
	return &mockEnterpriseRepo{enterprises: make(map[string]*model.Enterprise)}
}

func (m *mockEnterpriseRepo) Create(ent *model.Enterprise) error {
	if ent.ID == uuid.Nil {
		ent.ID = uuid.New()
	}
	m.enterprises[ent.ID.String()] = ent
	return nil
}

func (m *mockEnterpriseRepo) Update(ent *model.Enterprise) error {
	m.enterprises[ent.ID.String()] = ent
	return nil
}

func (m *mockEnterpriseRepo) FindByID(id uuid.UUID) (*model.Enterprise, error) {
	e, ok := m.enterprises[id.String()]
	if !ok {
		return nil, nil
	}
	return e, nil
}

func (m *mockEnterpriseRepo) FindByCode(code string) (*model.Enterprise, error) {
	for _, e := range m.enterprises {
		if e.Code == code {
			return e, nil
		}
	}
	return nil, nil
}

func (m *mockEnterpriseRepo) List(page, pageSize int) ([]model.Enterprise, int64, error) {
	var result []model.Enterprise
	for _, e := range m.enterprises {
		result = append(result, *e)
	}
	return result, int64(len(result)), nil
}

func (m *mockEnterpriseRepo) ListByGroup(groupID string) ([]model.Enterprise, error) {
	var result []model.Enterprise
	for _, e := range m.enterprises {
		if e.GroupID == groupID {
			result = append(result, *e)
		}
	}
	return result, nil
}

func setupEnterpriseService() (*EnterpriseService, *mockEnterpriseRepo) {
	repo := newMockEnterpriseRepo()
	svc := NewEnterpriseService(repo, &mockEnterpriseStatusLogRepo{}, nil)
	return svc, repo
}

type mockEnterpriseStatusLogRepo struct {
	logs []model.EnterpriseStatusLog
}

func (m *mockEnterpriseStatusLogRepo) Create(log *model.EnterpriseStatusLog) error {
	m.logs = append(m.logs, *log)
	return nil
}

func (m *mockEnterpriseStatusLogRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.EnterpriseStatusLog, error) {
	return m.logs, nil
}

var _ repository.EnterpriseStatusLogRepository = (*mockEnterpriseStatusLogRepo)(nil)

func TestEnterpriseService_Create_Success(t *testing.T) {
	svc, repo := setupEnterpriseService()
	gid := uuid.New().String()

	ent, err := svc.Create(gid, "Test Enterprise", "ENT001", "", "", "")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if ent.Name != "Test Enterprise" {
		t.Errorf("expected 'Test Enterprise', got %s", ent.Name)
	}
	if ent.Code != "ENT001" {
		t.Errorf("expected 'ENT001', got %s", ent.Code)
	}
	if len(repo.enterprises) != 1 {
		t.Errorf("expected 1 enterprise, got %d", len(repo.enterprises))
	}
}

func TestEnterpriseService_Create_EmptyName(t *testing.T) {
	svc, _ := setupEnterpriseService()
	_, err := svc.Create(uuid.New().String(), "", "ENT001", "", "", "")
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestEnterpriseService_Create_EmptyCode(t *testing.T) {
	svc, _ := setupEnterpriseService()
	_, err := svc.Create(uuid.New().String(), "Test", "", "", "", "")
	if err == nil {
		t.Fatal("expected error for empty code")
	}
}

func TestEnterpriseService_Create_DuplicateCode(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	svc.Create(gid, "First", "DUP", "", "", "")
	_, err := svc.Create(gid, "Second", "DUP", "", "", "")
	if err == nil {
		t.Fatal("expected error for duplicate code")
	}
}

func TestEnterpriseService_Get_Found(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	created, _ := svc.Create(gid, "Test", "T001", "", "", "")

	got, err := svc.Get(created.ID.String())
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got.Name != "Test" {
		t.Errorf("expected 'Test', got %s", got.Name)
	}
}

func TestEnterpriseService_Get_NotFound(t *testing.T) {
	svc, _ := setupEnterpriseService()
	_, err := svc.Get(uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent enterprise")
	}
}

func TestEnterpriseService_Update_Success(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	created, _ := svc.Create(gid, "Old", "U001", "", "", "")

	updated, err := svc.Update(created.ID.String(), "New", "new@test.com", "", "")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Name != "New" {
		t.Errorf("expected 'New', got %s", updated.Name)
	}
	if updated.ContactEmail != "new@test.com" {
		t.Errorf("expected 'new@test.com', got %s", updated.ContactEmail)
	}
}

func TestEnterpriseService_Update_NotFound(t *testing.T) {
	svc, _ := setupEnterpriseService()
	_, err := svc.Update(uuid.New().String(), "Name", "", "", "")
	if err == nil {
		t.Fatal("expected error for nonexistent enterprise")
	}
}

func TestEnterpriseService_List(t *testing.T) {
	svc, repo := setupEnterpriseService()
	gid := uuid.New().String()
	repo.enterprises[uuid.New().String()] = &model.Enterprise{Name: "E1", Code: "E1", GroupID: gid}
	repo.enterprises[uuid.New().String()] = &model.Enterprise{Name: "E2", Code: "E2", GroupID: gid}

	enterprises, total, err := svc.List(1, 20)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if total != 2 {
		t.Errorf("expected total 2, got %d", total)
	}
	if len(enterprises) != 2 {
		t.Errorf("expected 2 enterprises, got %d", len(enterprises))
	}
}

func TestEnterpriseService_Create_DefaultTrial(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	ent, err := svc.Create(gid, "Trial Ent", "TRIAL001", "", "", "")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if ent.Status != "trial" {
		t.Errorf("expected status 'trial', got %s", ent.Status)
	}
}

func TestEnterpriseService_ChangeStatus_ValidTransition(t *testing.T) {
	svc, repo := setupEnterpriseService()
	gid := uuid.New().String()
	ent, _ := svc.Create(gid, "Test", "CS001", "", "", "")
	opID := uuid.New().String()

	updated, err := svc.ChangeStatus(ent.ID.String(), "active", "trial passed", opID)
	if err != nil {
		t.Fatalf("ChangeStatus failed: %v", err)
	}
	if updated.Status != "active" {
		t.Errorf("expected status 'active', got %s", updated.Status)
	}
	if updated.SubscribedAt == nil {
		t.Error("expected subscribed_at to be set")
	}

	saved := repo.enterprises[ent.ID.String()]
	if saved.Status != "active" {
		t.Errorf("expected saved status 'active', got %s", saved.Status)
	}
}

func TestEnterpriseService_ChangeStatus_InvalidTransition(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	ent, _ := svc.Create(gid, "Test", "CS002", "", "", "")
	opID := uuid.New().String()

	_, err := svc.ChangeStatus(ent.ID.String(), "frozen", "skip", opID)
	if err == nil {
		t.Fatal("expected error for invalid transition trial->frozen")
	}
}

func TestEnterpriseService_ChangeStatus_SuspendSetsDate(t *testing.T) {
	svc, _ := setupEnterpriseService()
	gid := uuid.New().String()
	ent, _ := svc.Create(gid, "Test", "CS003", "", "", "")
	opID := uuid.New().String()

	svc.ChangeStatus(ent.ID.String(), "active", "activated", opID)
	updated, err := svc.ChangeStatus(ent.ID.String(), "suspended", "overdue", opID)
	if err != nil {
		t.Fatalf("ChangeStatus failed: %v", err)
	}
	if updated.SuspendedAt == nil {
		t.Error("expected suspended_at to be set")
	}
}

func TestValidEnterpriseTransition(t *testing.T) {
	tests := []struct {
		from, to string
		want     bool
	}{
		{"trial", "active", true},
		{"trial", "expired", true},
		{"trial", "cancelled", true},
		{"trial", "suspended", false},
		{"active", "suspended", true},
		{"active", "frozen", true},
		{"active", "expired", true},
		{"active", "cancelled", true},
		{"suspended", "active", true},
		{"suspended", "frozen", true},
		{"frozen", "active", true},
		{"frozen", "suspended", false},
		{"cancelled", "active", false},
	}
	for _, tt := range tests {
		got := model.ValidEnterpriseTransition(tt.from, tt.to)
		if got != tt.want {
			t.Errorf("ValidEnterpriseTransition(%s, %s) = %v, want %v", tt.from, tt.to, got, tt.want)
		}
	}
}
