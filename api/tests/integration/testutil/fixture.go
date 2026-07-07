package testutil

import (
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/pkg/auth"
	"github.com/ai-office/api/pkg/tenant"
	"gorm.io/gorm"
)

type TestFixtures struct {
	Group        *model.Group
	Enterprise   *model.Enterprise
	EnterpriseID string
	Schema       string
	Department   *model.Department
	Employee     *model.Employee
	Operator     *model.User
	Owner        *model.User
	Admin        *model.User
	Manager      *model.User
	EmployeeUser *model.User
	JWTManager   *auth.JWTManager
	db           *gorm.DB
}

func CreateTestGroup(t *testing.T, db *gorm.DB) *model.Group {
	t.Helper()
	g := &model.Group{
		Name:         "Test Group " + uuid.New().String()[:8],
		Code:         "GRP-" + uuid.New().String()[:8],
		ContactEmail: "group@test.com",
		Status:       "active",
	}
	if err := db.Create(g).Error; err != nil {
		t.Fatalf("failed to create test group: %v", err)
	}
	return g
}

func CreateTestEnterprise(t *testing.T, db *gorm.DB, groupID string) *model.Enterprise {
	t.Helper()
	enterpriseUUID := uuid.New()
	enterpriseID := enterpriseUUID.String()
	schemaName := tenant.SchemaName(enterpriseID)

	e := &model.Enterprise{
		BaseModel: model.BaseModel{
			ID: enterpriseUUID,
		},
		GroupID:      groupID,
		Name:         "Test Enterprise " + uuid.New().String()[:8],
		Code:         "ENT-" + uuid.New().String()[:8],
		ContactEmail: "enterprise@test.com",
		Status:       "active",
		SchemaName:   schemaName,
	}
	if err := db.Create(e).Error; err != nil {
		t.Fatalf("failed to create test enterprise: %v", err)
	}

	if err := tenant.CreateSchema(db, enterpriseID); err != nil {
		t.Fatalf("failed to create enterprise schema: %v", err)
	}
	if err := tenant.RunMigrations(db, enterpriseID); err != nil {
		t.Fatalf("failed to run tenant migrations: %v", err)
	}
	db.Exec("SET search_path TO public")

	return e
}

func CreateTestUser(t *testing.T, db *gorm.DB, enterpriseID, role string) *model.User {
	t.Helper()
	email := role + "-" + uuid.New().String()[:8] + "@test.com"
	passwordHash, err := auth.HashPassword("test123")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	u := &model.User{
		EnterpriseID: enterpriseID,
		Email:        email,
		PasswordHash: passwordHash,
		Name:         role + " User",
		Role:         role,
		Status:       "active",
	}
	if err := db.Create(u).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}
	return u
}

func CreateTestDepartment(t *testing.T, db *gorm.DB, enterpriseID string, parentID *uuid.UUID) *model.Department {
	t.Helper()
	schema := tenant.SchemaName(enterpriseID)
	d := &model.Department{
		TenantModel: model.TenantModel{
			BaseModel: model.BaseModel{
				ID: uuid.New(),
			},
			EnterpriseID: uuid.MustParse(enterpriseID),
		},
		Name:     "Test Dept " + uuid.New().String()[:8],
		ParentID: parentID,
	}
	sql := fmt.Sprintf(
		`INSERT INTO "%s".departments (id, enterprise_id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
		schema,
	)
	if err := db.Exec(sql, d.ID, d.EnterpriseID, d.Name, d.ParentID).Error; err != nil {
		t.Fatalf("failed to create test department: %v", err)
	}
	return d
}

func CreateTestEmployee(t *testing.T, db *gorm.DB, enterpriseID string, deptID uuid.UUID, role string) *model.Employee {
	t.Helper()
	schema := tenant.SchemaName(enterpriseID)
	now := time.Now()
	e := &model.Employee{
		TenantModel: model.TenantModel{
			BaseModel: model.BaseModel{
				ID: uuid.New(),
			},
			EnterpriseID: uuid.MustParse(enterpriseID),
		},
		DepartmentID: deptID,
		Name:         role + " Employee " + uuid.New().String()[:8],
		Email:        role + "-emp-" + uuid.New().String()[:8] + "@test.com",
		Phone:        "13800000000",
		Position:     role,
		EmployeeNo:   "EMP-" + uuid.New().String()[:8],
		Status:       "active",
		HireDate:     &now,
	}
	sql := fmt.Sprintf(
		`INSERT INTO "%s".employees (id, enterprise_id, department_id, name, email, phone, position, employee_no, status, hire_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
		schema,
	)
	if err := db.Exec(sql, e.ID, e.EnterpriseID, e.DepartmentID, e.Name, e.Email, e.Phone, e.Position, e.EmployeeNo, e.Status, e.HireDate).Error; err != nil {
		t.Fatalf("failed to create test employee: %v", err)
	}
	return e
}

func CreateFullOrgChain(t *testing.T, db *gorm.DB) *TestFixtures {
	t.Helper()
	fx := &TestFixtures{db: db}

	fx.Group = CreateTestGroup(t, db)
	fx.Enterprise = CreateTestEnterprise(t, db, fx.Group.ID.String())
	fx.EnterpriseID = fx.Enterprise.ID.String()
	fx.Schema = tenant.SchemaName(fx.EnterpriseID)

	fx.Department = CreateTestDepartment(t, db, fx.EnterpriseID, nil)
	fx.Employee = CreateTestEmployee(t, db, fx.EnterpriseID, fx.Department.ID, "employee")

	fx.Operator = CreateTestUser(t, db, fx.EnterpriseID, "operator")
	fx.Owner = CreateTestUser(t, db, fx.EnterpriseID, "owner")
	fx.Admin = CreateTestUser(t, db, fx.EnterpriseID, "admin")
	fx.Manager = CreateTestUser(t, db, fx.EnterpriseID, "manager")
	fx.EmployeeUser = CreateTestUser(t, db, fx.EnterpriseID, "employee")

	fx.JWTManager = auth.NewJWTManager("change-me-in-production", 3600, 2592000, "ai-office")

	return fx
}

func (fx *TestFixtures) GenerateToken(t *testing.T, user *model.User) string {
	t.Helper()
	token, err := fx.JWTManager.GenerateAccessToken(
		user.ID,
		uuid.MustParse(fx.EnterpriseID),
		user.Role,
		user.Email,
	)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	return token
}

func (fx *TestFixtures) OperatorToken(t *testing.T) string {
	return fx.GenerateToken(t, fx.Operator)
}

func (fx *TestFixtures) OwnerToken(t *testing.T) string {
	return fx.GenerateToken(t, fx.Owner)
}

func (fx *TestFixtures) AdminToken(t *testing.T) string {
	return fx.GenerateToken(t, fx.Admin)
}

func (fx *TestFixtures) ManagerToken(t *testing.T) string {
	return fx.GenerateToken(t, fx.Manager)
}

func (fx *TestFixtures) EmployeeToken(t *testing.T) string {
	return fx.GenerateToken(t, fx.EmployeeUser)
}

func (fx *TestFixtures) Cleanup(t *testing.T, db *gorm.DB) {
	t.Helper()
	DropTestSchema(t, db, fx.EnterpriseID)
	db.Exec("DELETE FROM users WHERE enterprise_id = ?", fx.EnterpriseID)
	db.Exec("DELETE FROM enterprises WHERE id = ?", fx.EnterpriseID)
	db.Exec("DELETE FROM groups WHERE id = ?", fx.Group.ID)
}
