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

func setupAuditLogTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE audit_logs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, user_id TEXT NOT NULL,
		action VARCHAR(50) NOT NULL, resource_type VARCHAR(50) NOT NULL,
		resource_id VARCHAR(100), details TEXT,
		ip_address VARCHAR(45), user_agent VARCHAR(500),
		user_roles TEXT, old_values TEXT, new_values TEXT,
		location VARCHAR(200), status VARCHAR(20))`).Error)
	return db
}

func TestAuditLogRepo_Create_FindByID(t *testing.T) {
	db := setupAuditLogTestDB(t)
	repo := NewAuditLogRepository(db)
	eid := uuid.New()
	userID := uuid.New()

	log := &model.AuditLog{
		UserID:       userID,
		Action:       "create",
		ResourceType: "employee",
		ResourceID:   uuid.New().String(),
		Details:      "创建了员工记录",
		IPAddress:    "192.168.1.1",
		UserAgent:    "ao-cli/1.0",
		Status:       "success",
	}
	log.EnterpriseID = eid
	log.ID = uuid.New()

	err := repo.Create(log)
	assert.NoError(t, err)

	found, err := repo.FindByID(log.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "create", found.Action)
	assert.Equal(t, "employee", found.ResourceType)
	assert.Equal(t, "192.168.1.1", found.IPAddress)

	notFound, err := repo.FindByID(uuid.New(), eid)
	assert.NoError(t, err)
	assert.Nil(t, notFound)
}

func TestAuditLogRepo_List(t *testing.T) {
	db := setupAuditLogTestDB(t)
	repo := NewAuditLogRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		log := &model.AuditLog{
			UserID:       uuid.New(),
			Action:       "create",
			ResourceType: "employee",
			Status:       "success",
		}
		log.EnterpriseID = eid
		log.ID = uuid.New()
		require.NoError(t, repo.Create(log))
	}

	logs, total, err := repo.List(model.AuditLogQuery{EnterpriseID: eid.String(), Page: 1, PageSize: 10})
	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, logs, 3)
}

func TestAuditLogRepo_List_FilterByAction(t *testing.T) {
	db := setupAuditLogTestDB(t)
	repo := NewAuditLogRepository(db)
	eid := uuid.New()

	log1 := &model.AuditLog{UserID: uuid.New(), Action: "create", ResourceType: "employee", Status: "success"}
	log1.EnterpriseID = eid
	log1.ID = uuid.New()
	require.NoError(t, repo.Create(log1))

	log2 := &model.AuditLog{UserID: uuid.New(), Action: "delete", ResourceType: "employee", Status: "success"}
	log2.EnterpriseID = eid
	log2.ID = uuid.New()
	require.NoError(t, repo.Create(log2))

	logs, total, err := repo.List(model.AuditLogQuery{EnterpriseID: eid.String(), Action: "create", Page: 1, PageSize: 10})
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, logs, 1)
	assert.Equal(t, "create", logs[0].Action)
}
