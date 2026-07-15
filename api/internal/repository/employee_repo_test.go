package repository

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func setupEmployeeTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE employees (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, department_id TEXT NOT NULL,
		name VARCHAR(100) NOT NULL, email VARCHAR(255), phone VARCHAR(50),
		position VARCHAR(100), employee_no VARCHAR(100),
		role VARCHAR(50) DEFAULT 'employee', status VARCHAR(20) NOT NULL DEFAULT 'active',
		hire_date DATETIME, resign_date DATETIME)`).Error)
	return db
}

func TestEmployeeRepo_Create_FindByID_Update_Delete(t *testing.T) {
	db := setupEmployeeTestDB(t)
	repo := NewEmployeeRepository(db)
	eid := uuid.New()
	deptID := uuid.New()

	emp := &model.Employee{
		DepartmentID: deptID,
		Name:         "张三",
		Email:        "zhangsan@test.com",
		Phone:        "13800138000",
		Position:     "工程师",
		EmployeeNo:   "EMP001",
		Role:         "employee",
		Status:       "active",
	}
	emp.EnterpriseID = eid
	emp.ID = uuid.New()

	err := repo.Create(emp)
	assert.NoError(t, err)

	found, err := repo.FindByID(emp.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "张三", found.Name)
	assert.Equal(t, "zhangsan@test.com", found.Email)
	assert.Equal(t, "active", found.Status)

	found.Name = "李四"
	found.Status = "resigned"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(emp.ID, eid)
	assert.NoError(t, err)
	assert.Equal(t, "李四", updated.Name)
	assert.Equal(t, "resigned", updated.Status)

	err = repo.Delete(emp.ID, eid)
	assert.NoError(t, err)

	deleted, err := repo.FindByID(emp.ID, eid)
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestEmployeeRepo_FindByEmail(t *testing.T) {
	db := setupEmployeeTestDB(t)
	repo := NewEmployeeRepository(db)
	eid := uuid.New()

	emp := &model.Employee{
		DepartmentID: uuid.New(),
		Name:         "王五",
		Email:        "wangwu@test.com",
		Status:       "active",
	}
	emp.EnterpriseID = eid
	emp.ID = uuid.New()
	require.NoError(t, repo.Create(emp))

	found, err := repo.FindByEmail("wangwu@test.com", eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "王五", found.Name)

	notFound, err := repo.FindByEmail("nonexistent@test.com", eid)
	assert.NoError(t, err)
	assert.Nil(t, notFound)
}

func TestEmployeeRepo_List(t *testing.T) {
	db := setupEmployeeTestDB(t)
	repo := NewEmployeeRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		emp := &model.Employee{
			DepartmentID: uuid.New(),
			Name:         "员工" + string(rune('A'+i)),
			Status:       "active",
			Role:         "employee",
		}
		emp.EnterpriseID = eid
		emp.ID = uuid.New()
		require.NoError(t, repo.Create(emp))
	}

	employees, total, err := repo.List(model.EmployeeQuery{EnterpriseID: eid.String(), Page: 1, PageSize: 10})
	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, employees, 3)
}

func TestEmployeeRepo_CountByEnterprise(t *testing.T) {
	db := setupEmployeeTestDB(t)
	repo := NewEmployeeRepository(db)
	eid := uuid.New()

	emp1 := &model.Employee{DepartmentID: uuid.New(), Name: "A", Status: "active", Role: "employee"}
	emp1.EnterpriseID = eid
	emp1.ID = uuid.New()
	require.NoError(t, repo.Create(emp1))

	emp2 := &model.Employee{DepartmentID: uuid.New(), Name: "B", Status: "resigned", Role: "employee"}
	emp2.EnterpriseID = eid
	emp2.ID = uuid.New()
	require.NoError(t, repo.Create(emp2))

	count, err := repo.CountByEnterprise(eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)

	activeCount, err := repo.CountActiveByEnterprise(eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), activeCount)
}

func TestEmployeeRepo_CountByDepartment(t *testing.T) {
	db := setupEmployeeTestDB(t)
	repo := NewEmployeeRepository(db)
	eid := uuid.New()
	deptID := uuid.New()

	emp := &model.Employee{DepartmentID: deptID, Name: "A", Status: "active", Role: "employee"}
	emp.EnterpriseID = eid
	emp.ID = uuid.New()
	require.NoError(t, repo.Create(emp))

	count, err := repo.CountByDepartment(deptID)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}
