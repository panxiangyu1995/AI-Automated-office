package service

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type mockEmployeeRepo struct {
	employees map[string]*model.Employee
}

func newMockEmployeeRepo() *mockEmployeeRepo {
	return &mockEmployeeRepo{employees: make(map[string]*model.Employee)}
}

func (m *mockEmployeeRepo) Create(emp *model.Employee) error {
	if emp.ID == uuid.Nil {
		emp.ID = uuid.New()
	}
	m.employees[emp.ID.String()] = emp
	return nil
}

func (m *mockEmployeeRepo) Update(emp *model.Employee) error {
	m.employees[emp.ID.String()] = emp
	return nil
}

func (m *mockEmployeeRepo) Delete(id uuid.UUID) error {
	delete(m.employees, id.String())
	return nil
}

func (m *mockEmployeeRepo) FindByID(id uuid.UUID) (*model.Employee, error) {
	e, ok := m.employees[id.String()]
	if !ok {
		return nil, nil
	}
	return e, nil
}

func (m *mockEmployeeRepo) FindByEmail(email string, enterpriseID uuid.UUID) (*model.Employee, error) {
	for _, e := range m.employees {
		if e.Email == email && e.EnterpriseID == enterpriseID {
			return e, nil
		}
	}
	return nil, nil
}

func (m *mockEmployeeRepo) List(query model.EmployeeQuery) ([]model.Employee, int64, error) {
	var result []model.Employee
	for _, e := range m.employees {
		if query.EnterpriseID != "" && e.EnterpriseID.String() != query.EnterpriseID {
			continue
		}
		if query.Status != "" && e.Status != query.Status {
			continue
		}
		result = append(result, *e)
	}
	return result, int64(len(result)), nil
}

func (m *mockEmployeeRepo) CountByDepartment(deptID uuid.UUID) (int64, error) {
	var count int64
	for _, e := range m.employees {
		if e.DepartmentID == deptID && e.Status == "active" {
			count++
		}
	}
	return count, nil
}

func setupEmployeeService() (*EmployeeService, *mockEmployeeRepo, *mockDepartmentRepo) {
	empRepo := newMockEmployeeRepo()
	deptRepo := newMockDepartmentRepo()
	svc := NewEmployeeService(empRepo, deptRepo)
	return svc, empRepo, deptRepo
}

func seedDepartment(svc *EmployeeService, deptRepo *mockDepartmentRepo, eid string) string {
	d := &model.Department{Name: "Engineering"}
	d.EnterpriseID = uuid.MustParse(eid)
	deptRepo.Create(d)
	return d.ID.String()
}

func TestEmployeeService_Create_Success(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)

	emp, err := svc.Create(eid, did, "John Doe", "john@test.com", "123456", "Engineer", "EMP001", nil)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if emp.Name != "John Doe" {
		t.Errorf("expected 'John Doe', got %s", emp.Name)
	}
	if emp.Status != "active" {
		t.Errorf("expected status 'active', got %s", emp.Status)
	}
}

func TestEmployeeService_Create_EmptyName(t *testing.T) {
	svc, _, _ := setupEmployeeService()
	_, err := svc.Create(uuid.New().String(), uuid.New().String(), "", "", "", "", "", nil)
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestEmployeeService_Create_InvalidDepartment(t *testing.T) {
	svc, _, _ := setupEmployeeService()
	_, err := svc.Create(uuid.New().String(), uuid.New().String(), "John", "", "", "", "", nil)
	if err == nil {
		t.Fatal("expected error for nonexistent department")
	}
}

func TestEmployeeService_Get_Found(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did, "John", "", "", "", "", nil)

	got, err := svc.Get(created.ID.String())
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got.Name != "John" {
		t.Errorf("expected 'John', got %s", got.Name)
	}
}

func TestEmployeeService_Get_NotFound(t *testing.T) {
	svc, _, _ := setupEmployeeService()
	_, err := svc.Get(uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent employee")
	}
}

func TestEmployeeService_Update_Success(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did, "Old", "", "", "", "", nil)

	updated, err := svc.Update(created.ID.String(), "New", "new@test.com", "", "", "", "")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Name != "New" {
		t.Errorf("expected 'New', got %s", updated.Name)
	}
	if updated.Email != "new@test.com" {
		t.Errorf("expected 'new@test.com', got %s", updated.Email)
	}
}

func TestEmployeeService_Update_Resign(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did, "John", "", "", "", "", nil)

	updated, err := svc.Update(created.ID.String(), "", "", "", "", "", "resigned")
	if err != nil {
		t.Fatalf("Update to resigned failed: %v", err)
	}
	if updated.Status != "resigned" {
		t.Errorf("expected status 'resigned', got %s", updated.Status)
	}
	if updated.ResignDate == nil {
		t.Error("expected resign_date to be set")
	}
}

func TestEmployeeService_Delete_Resign(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did, "John", "", "", "", "", nil)

	err := svc.Delete(created.ID.String())
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	emp, _ := svc.Get(created.ID.String())
	if emp.Status != "resigned" {
		t.Errorf("expected status 'resigned' after delete, got %s", emp.Status)
	}
	if emp.ResignDate == nil {
		t.Error("expected resign_date to be set on delete")
	}
}

func TestEmployeeService_List(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	svc.Create(eid, did, "John", "", "", "", "", nil)
	svc.Create(eid, did, "Jane", "", "", "", "", nil)

	query := model.EmployeeQuery{EnterpriseID: eid}
	employees, total, err := svc.List(query)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if total != 2 {
		t.Errorf("expected total 2, got %d", total)
	}
	if len(employees) != 2 {
		t.Errorf("expected 2 employees, got %d", len(employees))
	}
}

func TestEmployeeService_Transfer_Success(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did1 := seedDepartment(svc, deptRepo, eid)
	did2 := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did1, "John", "", "", "", "", nil)

	transferred, err := svc.Transfer(created.ID.String(), did2)
	if err != nil {
		t.Fatalf("Transfer failed: %v", err)
	}
	if transferred.DepartmentID.String() != did2 {
		t.Errorf("expected department_id %s, got %s", did2, transferred.DepartmentID.String())
	}
}

func TestEmployeeService_Transfer_InvalidDept(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	created, _ := svc.Create(eid, did, "John", "", "", "", "", nil)

	_, err := svc.Transfer(created.ID.String(), uuid.New().String())
	if err == nil {
		t.Fatal("expected error for nonexistent target department")
	}
}

func TestEmployeeService_Create_DuplicateEmail(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	svc.Create(eid, did, "John", "dup@test.com", "", "", "", nil)

	_, err := svc.Create(eid, did, "Jane", "dup@test.com", "", "", "", nil)
	if err == nil {
		t.Fatal("expected error for duplicate email")
	}
}

func TestEmployeeService_Create_WithHireDate(t *testing.T) {
	svc, _, deptRepo := setupEmployeeService()
	eid := uuid.New().String()
	did := seedDepartment(svc, deptRepo, eid)
	hireDate := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)

	emp, err := svc.Create(eid, did, "John", "", "", "", "", &hireDate)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if emp.HireDate == nil || !emp.HireDate.Equal(hireDate) {
		t.Errorf("expected hire_date %v, got %v", hireDate, emp.HireDate)
	}
}
