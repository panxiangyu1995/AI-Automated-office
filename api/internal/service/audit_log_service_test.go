package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type mockAuditLogRepo struct {
	logs []model.AuditLog
}

func (m *mockAuditLogRepo) Create(log *model.AuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	m.logs = append(m.logs, *log)
	return nil
}

func (m *mockAuditLogRepo) FindByID(id uuid.UUID) (*model.AuditLog, error) {
	for _, l := range m.logs {
		if l.ID == id {
			return &l, nil
		}
	}
	return nil, nil
}

func (m *mockAuditLogRepo) List(query model.AuditLogQuery) ([]model.AuditLog, int64, error) {
	var filtered []model.AuditLog
	for _, l := range m.logs {
		if query.EnterpriseID != "" && l.EnterpriseID.String() != query.EnterpriseID {
			continue
		}
		if query.Action != "" && l.Action != query.Action {
			continue
		}
		if query.ResourceType != "" && l.ResourceType != query.ResourceType {
			continue
		}
		filtered = append(filtered, l)
	}

	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	total := int64(len(filtered))
	start := (page - 1) * pageSize
	if start >= len(filtered) {
		return nil, total, nil
	}
	end := start + pageSize
	if end > len(filtered) {
		end = len(filtered)
	}

	return filtered[start:end], total, nil
}

func setupAuditLogService() *AuditLogService {
	return NewAuditLogService(&mockAuditLogRepo{})
}

func setupAuditLogServiceWithRepo() (*AuditLogService, *mockAuditLogRepo) {
	repo := &mockAuditLogRepo{}
	return NewAuditLogService(repo), repo
}

func TestAuditLogService_Get_NotFound(t *testing.T) {
	svc := setupAuditLogService()
	_, err := svc.Get(uuid.New())
	if err == nil {
		t.Fatal("expected error for nonexistent audit log")
	}
}

func TestAuditLogService_Get_Found(t *testing.T) {
	svc, repo := setupAuditLogServiceWithRepo()
	eid := uuid.New()
	uid := uuid.New()
	repo.logs = append(repo.logs, model.AuditLog{
		TenantModel:  model.TenantModel{EnterpriseID: eid},
		UserID:       uid,
		Action:       "create",
		ResourceType: "user",
	})

	logs, _, _ := repo.List(model.AuditLogQuery{EnterpriseID: eid.String(), Action: "create"})
	if len(logs) != 1 {
		t.Fatalf("expected 1 log, got %d", len(logs))
	}

	got, err := svc.Get(logs[0].ID)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got.Action != "create" {
		t.Errorf("expected action 'create', got %s", got.Action)
	}
}

func TestAuditLogService_Create_EmptyAction(t *testing.T) {
	svc := setupAuditLogService()
	err := svc.Create(uuid.New().String(), uuid.New().String(), "", "user", "", "", "", "")
	if err == nil {
		t.Fatal("expected error for empty action")
	}
	if err.Code != "COMMON_VALIDATION_ERROR" {
		t.Errorf("expected validation error, got %s", err.Code)
	}
}

func TestAuditLogService_Create_EmptyResourceType(t *testing.T) {
	svc := setupAuditLogService()
	err := svc.Create(uuid.New().String(), uuid.New().String(), "create", "", "", "", "", "")
	if err == nil {
		t.Fatal("expected error for empty resource type")
	}
	if err.Code != "COMMON_VALIDATION_ERROR" {
		t.Errorf("expected validation error, got %s", err.Code)
	}
}

func TestAuditLogService_Create_InvalidEnterpriseID(t *testing.T) {
	svc := setupAuditLogService()
	err := svc.Create("not-a-uuid", uuid.New().String(), "create", "user", "", "", "", "")
	if err == nil {
		t.Fatal("expected error for invalid enterprise id")
	}
}

func TestAuditLogService_Create_InvalidUserID(t *testing.T) {
	svc := setupAuditLogService()
	err := svc.Create(uuid.New().String(), "not-a-uuid", "create", "user", "", "", "", "")
	if err == nil {
		t.Fatal("expected error for invalid user id")
	}
}

func TestAuditLogService_Create_Success(t *testing.T) {
	svc, repo := setupAuditLogServiceWithRepo()
	eid := uuid.New().String()
	uid := uuid.New().String()

	err := svc.Create(eid, uid, "create", "user", "123", "created user", "127.0.0.1", "test-agent")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	if len(repo.logs) != 1 {
		t.Fatalf("expected 1 log, got %d", len(repo.logs))
	}
	if repo.logs[0].Action != "create" {
		t.Errorf("expected action 'create', got %s", repo.logs[0].Action)
	}
	if repo.logs[0].ResourceType != "user" {
		t.Errorf("expected resource type 'user', got %s", repo.logs[0].ResourceType)
	}
}

func TestAuditLogService_Query_Success(t *testing.T) {
	svc, repo := setupAuditLogServiceWithRepo()
	eid := uuid.New()
	uid := uuid.New()

	repo.logs = append(repo.logs,
		model.AuditLog{TenantModel: model.TenantModel{EnterpriseID: eid}, UserID: uid, Action: "create", ResourceType: "user"},
		model.AuditLog{TenantModel: model.TenantModel{EnterpriseID: eid}, UserID: uid, Action: "update", ResourceType: "user"},
		model.AuditLog{TenantModel: model.TenantModel{EnterpriseID: eid}, UserID: uid, Action: "delete", ResourceType: "order"},
	)

	tests := []struct {
		name  string
		query model.AuditLogQuery
		want  int
	}{
		{"all", model.AuditLogQuery{EnterpriseID: eid.String()}, 3},
		{"filter by action", model.AuditLogQuery{EnterpriseID: eid.String(), Action: "create"}, 1},
		{"filter by resource", model.AuditLogQuery{EnterpriseID: eid.String(), ResourceType: "user"}, 2},
		{"filter by both", model.AuditLogQuery{EnterpriseID: eid.String(), Action: "delete", ResourceType: "order"}, 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logs, total, err := svc.Query(tt.query)
			if err != nil {
				t.Fatalf("Query failed: %v", err)
			}
			if total != int64(tt.want) {
				t.Errorf("expected total %d, got %d", tt.want, total)
			}
			if len(logs) != tt.want {
				t.Errorf("expected %d logs, got %d", tt.want, len(logs))
			}
		})
	}
}

func TestAuditLogService_Query_DefaultPagination(t *testing.T) {
	svc, repo := setupAuditLogServiceWithRepo()
	eid := uuid.New().String()

	for i := 0; i < 30; i++ {
		repo.logs = append(repo.logs, model.AuditLog{
			TenantModel:  model.TenantModel{EnterpriseID: uuid.MustParse(eid)},
			UserID:       uuid.New(),
			Action:       "create",
			ResourceType: "user",
		})
	}

	query := model.AuditLogQuery{EnterpriseID: eid, Page: 0, PageSize: 0}
	logs, total, err := svc.Query(query)
	if err != nil {
		t.Fatalf("Query failed: %v", err)
	}
	if total != 30 {
		t.Errorf("expected total 30, got %d", total)
	}
	if len(logs) != 20 {
		t.Errorf("expected default page size 20, got %d", len(logs))
	}
}
