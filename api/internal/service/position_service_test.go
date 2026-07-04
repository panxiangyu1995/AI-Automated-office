package service

import (
	"testing"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type mockPositionRepo struct {
	positions map[string]*model.Position
}

func newMockPositionRepo() *mockPositionRepo {
	return &mockPositionRepo{positions: make(map[string]*model.Position)}
}

func (m *mockPositionRepo) Create(p *model.Position) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	m.positions[p.ID.String()] = p
	return nil
}

func (m *mockPositionRepo) Update(p *model.Position) error {
	m.positions[p.ID.String()] = p
	return nil
}

func (m *mockPositionRepo) FindByID(id uuid.UUID) (*model.Position, error) {
	p, ok := m.positions[id.String()]
	if !ok {
		return nil, nil
	}
	return p, nil
}

func (m *mockPositionRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Position, error) {
	var result []model.Position
	for _, p := range m.positions {
		if p.EnterpriseID == enterpriseID {
			result = append(result, *p)
		}
	}
	return result, nil
}

func setupPositionService() (*PositionService, *mockPositionRepo) {
	repo := newMockPositionRepo()
	svc := NewPositionService(repo)
	return svc, repo
}

func TestPositionService_Create_Success(t *testing.T) {
	svc, repo := setupPositionService()
	eid := uuid.New().String()

	p, err := svc.Create(eid, "", "Engineer", "Software engineer")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if p.Name != "Engineer" {
		t.Errorf("expected 'Engineer', got %s", p.Name)
	}
	if len(repo.positions) != 1 {
		t.Errorf("expected 1 position, got %d", len(repo.positions))
	}
}

func TestPositionService_Create_EmptyName(t *testing.T) {
	svc, _ := setupPositionService()
	_, err := svc.Create(uuid.New().String(), "", "", "")
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestPositionService_Update_Success(t *testing.T) {
	svc, _ := setupPositionService()
	eid := uuid.New().String()
	created, _ := svc.Create(eid, "", "Old", "")

	updated, err := svc.Update(created.ID.String(), "New", "Updated desc")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Name != "New" {
		t.Errorf("expected 'New', got %s", updated.Name)
	}
	if updated.Description != "Updated desc" {
		t.Errorf("expected 'Updated desc', got %s", updated.Description)
	}
}

func TestPositionService_Update_NotFound(t *testing.T) {
	svc, _ := setupPositionService()
	_, err := svc.Update(uuid.New().String(), "Name", "")
	if err == nil {
		t.Fatal("expected error for nonexistent position")
	}
}

func TestPositionService_List(t *testing.T) {
	svc, repo := setupPositionService()
	eid := uuid.New().String()
	otherEID := uuid.New().String()
	repo.positions["1"] = &model.Position{Name: "P1"}
	repo.positions["1"].EnterpriseID = uuid.MustParse(eid)
	repo.positions["2"] = &model.Position{Name: "P2"}
	repo.positions["2"].EnterpriseID = uuid.MustParse(eid)
	repo.positions["3"] = &model.Position{Name: "P3"}
	repo.positions["3"].EnterpriseID = uuid.MustParse(otherEID)

	positions, err := svc.List(eid)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(positions) != 2 {
		t.Errorf("expected 2 positions, got %d", len(positions))
	}
}
