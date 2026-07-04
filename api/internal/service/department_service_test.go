package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type mockDepartmentRepo struct {
	departments map[string]*model.Department
}

func newMockDepartmentRepo() *mockDepartmentRepo {
	return &mockDepartmentRepo{departments: make(map[string]*model.Department)}
}

func (m *mockDepartmentRepo) Create(dept *model.Department) error {
	if dept.ID == uuid.Nil {
		dept.ID = uuid.New()
	}
	m.departments[dept.ID.String()] = dept
	return nil
}

func (m *mockDepartmentRepo) Update(dept *model.Department) error {
	m.departments[dept.ID.String()] = dept
	return nil
}

func (m *mockDepartmentRepo) Delete(id uuid.UUID) error {
	delete(m.departments, id.String())
	return nil
}

func (m *mockDepartmentRepo) FindByID(id uuid.UUID) (*model.Department, error) {
	d, ok := m.departments[id.String()]
	if !ok {
		return nil, nil
	}
	return d, nil
}

func (m *mockDepartmentRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Department, error) {
	var result []model.Department
	for _, d := range m.departments {
		if d.EnterpriseID == enterpriseID {
			result = append(result, *d)
		}
	}
	return result, nil
}

func (m *mockDepartmentRepo) CountByParent(parentID uuid.UUID) (int64, error) {
	var count int64
	for _, d := range m.departments {
		if d.ParentID != nil && *d.ParentID == parentID {
			count++
		}
	}
	return count, nil
}

func setupDepartmentService() (*DepartmentService, *mockDepartmentRepo) {
	repo := newMockDepartmentRepo()
	svc := NewDepartmentService(repo)
	return svc, repo
}

func TestDepartmentService_Create_Success(t *testing.T) {
	svc, repo := setupDepartmentService()
	eid := uuid.New().String()

	dept, err := svc.Create(eid, "Engineering", "")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if dept.Name != "Engineering" {
		t.Errorf("expected 'Engineering', got %s", dept.Name)
	}
	if len(repo.departments) != 1 {
		t.Errorf("expected 1 department, got %d", len(repo.departments))
	}
}

func TestDepartmentService_Create_WithParent(t *testing.T) {
	svc, _ := setupDepartmentService()
	eid := uuid.New().String()

	parent, _ := svc.Create(eid, "Parent", "")
	child, err := svc.Create(eid, "Child", parent.ID.String())
	if err != nil {
		t.Fatalf("Create with parent failed: %v", err)
	}
	if child.ParentID == nil || *child.ParentID != parent.ID {
		t.Errorf("expected parent_id %s, got %v", parent.ID, child.ParentID)
	}
}

func TestDepartmentService_Create_EmptyName(t *testing.T) {
	svc, _ := setupDepartmentService()
	_, err := svc.Create(uuid.New().String(), "", "")
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestDepartmentService_Create_InvalidParent(t *testing.T) {
	svc, _ := setupDepartmentService()
	_, err := svc.Create(uuid.New().String(), "Test", uuid.New().String())
	if err == nil {
		t.Fatal("expected error for invalid parent")
	}
}

func TestDepartmentService_Update_Success(t *testing.T) {
	svc, _ := setupDepartmentService()
	eid := uuid.New().String()
	created, _ := svc.Create(eid, "Old Name", "")

	updated, err := svc.Update(created.ID.String(), "New Name", "")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Name != "New Name" {
		t.Errorf("expected 'New Name', got %s", updated.Name)
	}
}

func TestDepartmentService_Update_NotFound(t *testing.T) {
	svc, _ := setupDepartmentService()
	_, err := svc.Update(uuid.New().String(), "Name", "")
	if err == nil {
		t.Fatal("expected error for nonexistent department")
	}
}

func TestDepartmentService_Delete_Success(t *testing.T) {
	svc, repo := setupDepartmentService()
	eid := uuid.New().String()
	created, _ := svc.Create(eid, "To Delete", "")

	err := svc.Delete(created.ID.String())
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	if len(repo.departments) != 0 {
		t.Errorf("expected 0 departments after delete, got %d", len(repo.departments))
	}
}

func TestDepartmentService_Delete_WithChildren(t *testing.T) {
	svc, _ := setupDepartmentService()
	eid := uuid.New().String()
	parent, _ := svc.Create(eid, "Parent", "")
	svc.Create(eid, "Child", parent.ID.String())

	err := svc.Delete(parent.ID.String())
	if err == nil {
		t.Fatal("expected error when deleting department with children")
	}
}

func TestDepartmentService_Delete_NotFound(t *testing.T) {
	svc, _ := setupDepartmentService()
	err := svc.Delete(uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent department")
	}
}

func TestDepartmentService_GetTree(t *testing.T) {
	svc, _ := setupDepartmentService()
	eid := uuid.New().String()

	parent, _ := svc.Create(eid, "Parent", "")
	child1, _ := svc.Create(eid, "Child1", parent.ID.String())
	child2, _ := svc.Create(eid, "Child2", parent.ID.String())
	svc.Create(eid, "Grandchild", child1.ID.String())

	tree, err := svc.GetTree(eid)
	if err != nil {
		t.Fatalf("GetTree failed: %v", err)
	}

	if len(tree.Children) != 1 {
		t.Errorf("expected 1 root department, got %d", len(tree.Children))
	}
	if len(tree.Children) > 0 {
		root := tree.Children[0]
		if root.Name != "Parent" {
			t.Errorf("expected root 'Parent', got %s", root.Name)
		}
		if len(root.Children) != 2 {
			t.Errorf("expected 2 children, got %d", len(root.Children))
		}

		var c1Found, c2Found bool
		for _, c := range root.Children {
			if c.Name == "Child1" {
				c1Found = true
				if len(c.Children) != 1 {
					t.Errorf("expected 1 grandchild, got %d", len(c.Children))
				}
			}
			if c.Name == "Child2" {
				c2Found = true
			}
		}
		if !c1Found || !c2Found {
			t.Errorf("expected both Child1 and Child2 under parent")
		}

		_ = child2
	}
}

func TestDepartmentService_GetTree_Empty(t *testing.T) {
	svc, _ := setupDepartmentService()
	tree, err := svc.GetTree(uuid.New().String())
	if err != nil {
		t.Fatalf("GetTree failed: %v", err)
	}
	if len(tree.Children) != 0 {
		t.Errorf("expected empty tree, got %d children", len(tree.Children))
	}
}
