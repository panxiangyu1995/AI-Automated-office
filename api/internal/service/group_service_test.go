package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type mockGroupRepo struct {
	groups map[string]*model.Group
}

func newMockGroupRepo() *mockGroupRepo {
	return &mockGroupRepo{groups: make(map[string]*model.Group)}
}

func (m *mockGroupRepo) Create(group *model.Group) error {
	if group.ID == uuid.Nil {
		group.ID = uuid.New()
	}
	m.groups[group.ID.String()] = group
	return nil
}

func (m *mockGroupRepo) Update(group *model.Group) error {
	m.groups[group.ID.String()] = group
	return nil
}

func (m *mockGroupRepo) Delete(id uuid.UUID) error {
	delete(m.groups, id.String())
	return nil
}

func (m *mockGroupRepo) FindByID(id uuid.UUID) (*model.Group, error) {
	g, ok := m.groups[id.String()]
	if !ok {
		return nil, nil
	}
	return g, nil
}

func (m *mockGroupRepo) FindByCode(code string) (*model.Group, error) {
	for _, g := range m.groups {
		if g.Code == code {
			return g, nil
		}
	}
	return nil, nil
}

func (m *mockGroupRepo) List(page, pageSize int) ([]model.Group, int64, error) {
	var result []model.Group
	for _, g := range m.groups {
		result = append(result, *g)
	}
	return result, int64(len(result)), nil
}

func setupGroupService() (*GroupService, *mockGroupRepo) {
	groupRepo := newMockGroupRepo()
	userRepo := newMockUserRepo()
	svc := NewGroupService(groupRepo, userRepo, nil)
	return svc, groupRepo
}

func TestGroupService_Create_Success(t *testing.T) {
	svc, repo := setupGroupService()

	group, err := svc.Create(CreateGroupRequest{
		Name: "Test Group",
		Code: "TEST001",
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if group.Name != "Test Group" {
		t.Errorf("expected name 'Test Group', got %s", group.Name)
	}
	if group.Code != "TEST001" {
		t.Errorf("expected code 'TEST001', got %s", group.Code)
	}
	if len(repo.groups) != 1 {
		t.Errorf("expected 1 group, got %d", len(repo.groups))
	}
}

func TestGroupService_Create_EmptyName(t *testing.T) {
	svc, _ := setupGroupService()
	_, err := svc.Create(CreateGroupRequest{Name: "", Code: "T001"})
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestGroupService_Create_EmptyCode(t *testing.T) {
	svc, _ := setupGroupService()
	_, err := svc.Create(CreateGroupRequest{Name: "Test", Code: ""})
	if err == nil {
		t.Fatal("expected error for empty code")
	}
}

func TestGroupService_Create_DuplicateCode(t *testing.T) {
	svc, _ := setupGroupService()
	svc.Create(CreateGroupRequest{Name: "First", Code: "DUP"})
	_, err := svc.Create(CreateGroupRequest{Name: "Second", Code: "DUP"})
	if err == nil {
		t.Fatal("expected error for duplicate code")
	}
	if err.Code != "DB_DUPLICATE_ENTRY" {
		t.Errorf("expected DB_DUPLICATE_ENTRY, got %s", err.Code)
	}
}

func TestGroupService_Get_Found(t *testing.T) {
	svc, _ := setupGroupService()
	created, _ := svc.Create(CreateGroupRequest{Name: "Test Group", Code: "T001"})

	got, err := svc.Get(created.ID.String())
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got.Name != "Test Group" {
		t.Errorf("expected 'Test Group', got %s", got.Name)
	}
}

func TestGroupService_Get_NotFound(t *testing.T) {
	svc, _ := setupGroupService()
	_, err := svc.Get(uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent group")
	}
}

func TestGroupService_Update_Success(t *testing.T) {
	svc, _ := setupGroupService()
	created, _ := svc.Create(CreateGroupRequest{Name: "Old Name", Code: "T001"})

	updated, err := svc.Update(created.ID.String(), "New Name", "new@test.com", "", "")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Name != "New Name" {
		t.Errorf("expected 'New Name', got %s", updated.Name)
	}
	if updated.ContactEmail != "new@test.com" {
		t.Errorf("expected 'new@test.com', got %s", updated.ContactEmail)
	}
}

func TestGroupService_Update_NotFound(t *testing.T) {
	svc, _ := setupGroupService()
	_, err := svc.Update(uuid.New().String(), "Name", "", "", "")
	if err == nil {
		t.Fatal("expected error for nonexistent group")
	}
}

func TestGroupService_Delete_Success(t *testing.T) {
	svc, repo := setupGroupService()
	created, _ := svc.Create(CreateGroupRequest{Name: "To Delete", Code: "DEL"})

	err := svc.Delete(created.ID.String())
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	if len(repo.groups) != 0 {
		t.Errorf("expected 0 groups after delete, got %d", len(repo.groups))
	}
}

func TestGroupService_Delete_NotFound(t *testing.T) {
	svc, _ := setupGroupService()
	err := svc.Delete(uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent group")
	}
}

func TestGroupService_List(t *testing.T) {
	svc, repo := setupGroupService()
	repo.groups[uuid.New().String()] = &model.Group{Name: "G1", Code: "G1"}
	repo.groups[uuid.New().String()] = &model.Group{Name: "G2", Code: "G2"}
	repo.groups[uuid.New().String()] = &model.Group{Name: "G3", Code: "G3"}

	groups, total, err := svc.List(1, 20)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if total != 3 {
		t.Errorf("expected total 3, got %d", total)
	}
	if len(groups) != 3 {
		t.Errorf("expected 3 groups, got %d", len(groups))
	}
}

func TestGroupService_List_InvalidID(t *testing.T) {
	svc, _ := setupGroupService()
	_, err := svc.Get("not-a-uuid")
	if err == nil {
		t.Fatal("expected error for invalid UUID")
	}
}
