package repository

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func setupUndoTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE undo_operations (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, user_id TEXT NOT NULL,
		resource_type VARCHAR(50) NOT NULL, resource_id VARCHAR(100) NOT NULL,
		action VARCHAR(50) NOT NULL, before_state TEXT,
		undoable_until DATETIME, undone BOOLEAN DEFAULT FALSE)`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE test_resources (
		id TEXT PRIMARY KEY, name TEXT, value TEXT, created_at DATETIME, updated_at DATETIME)`).Error)
	return db
}

func TestUndoRepo_Create_FindByID(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)
	eid := uuid.New()

	undoableUntil := time.Now().Add(5 * time.Minute)
	op := &model.UndoOperation{
		UserID:        uuid.New().String(),
		ResourceType:  "contract",
		ResourceID:    uuid.New().String(),
		Action:        "create",
		BeforeState:   `{"name":"old"}`,
		UndoableUntil: &undoableUntil,
		Undone:        false,
	}
	op.EnterpriseID = eid
	op.ID = uuid.New()

	err := repo.Create(op)
	assert.NoError(t, err)

	found, err := repo.FindByID(op.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "create", found.Action)
	assert.Equal(t, "contract", found.ResourceType)
	assert.Equal(t, `{"name":"old"}`, found.BeforeState)
	assert.False(t, found.Undone)
}

func TestUndoRepo_FindByID_NotFound(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)

	found, err := repo.FindByID(uuid.New())
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestUndoRepo_MarkUndone(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)
	eid := uuid.New()

	op := &model.UndoOperation{
		UserID:       uuid.New().String(),
		ResourceType: "order",
		ResourceID:   uuid.New().String(),
		Action:       "update",
		BeforeState:  `{"status":"draft"}`,
		Undone:       false,
	}
	op.EnterpriseID = eid
	op.ID = uuid.New()
	require.NoError(t, repo.Create(op))

	err := repo.MarkUndone(op.ID)
	assert.NoError(t, err)

	found, err := repo.FindByID(op.ID)
	assert.NoError(t, err)
	assert.True(t, found.Undone)
}

func TestUndoRepo_FindBeforeState(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)

	resourceID := uuid.New().String()
	require.NoError(t, db.Exec(`INSERT INTO test_resources (id, name, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
		resourceID, "test-resource", "original-value", time.Now(), time.Now()).Error)

	result, err := repo.FindBeforeState("test_resources", resourceID)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, resourceID, result["id"])
	assert.Equal(t, "test-resource", result["name"])
}

func TestUndoRepo_FindBeforeState_NotFound(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)

	result, err := repo.FindBeforeState("test_resources", "nonexistent-id")
	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestUndoRepo_MarkUndone_NonExistentID(t *testing.T) {
	db := setupUndoTestDB(t)
	repo := NewUndoRepository(db)

	err := repo.MarkUndone(uuid.New())
	assert.NoError(t, err)
}
