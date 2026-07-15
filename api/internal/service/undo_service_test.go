package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

func TestUndoService_RecordOperation_InvalidUserID(t *testing.T) {
	svc := NewUndoService(nil, nil, nil)
	_, appErr := svc.RecordOperation("invalid-uuid", "customers", "res-1", "update", "{}")
	assert.NotNil(t, appErr)
	assert.Equal(t, "VAL_INVALID_PARAMS", appErr.Code)
}

func TestUndoService_UndoOperation_InvalidOperationID(t *testing.T) {
	svc := NewUndoService(nil, nil, nil)
	appErr := svc.UndoOperation("invalid-uuid")
	assert.NotNil(t, appErr)
	assert.Equal(t, "VAL_INVALID_PARAMS", appErr.Code)
}

func TestUndoService_UndoOperation_EmptyOperationID(t *testing.T) {
	svc := NewUndoService(nil, nil, nil)
	appErr := svc.UndoOperation("")
	assert.NotNil(t, appErr)
}

func TestUndoOperationModel_UndoableWithin24Hours(t *testing.T) {
	now := time.Now()
	undoableUntil := now.Add(24 * time.Hour)
	op := model.UndoOperation{
		UserID:        uuid.New().String(),
		ResourceType:  "customers",
		ResourceID:    uuid.New().String(),
		Action:        "update",
		BeforeState:   `{"name":"old"}`,
		UndoableUntil: &undoableUntil,
		Undone:        false,
	}
	assert.False(t, op.Undone)
	assert.True(t, now.Before(*op.UndoableUntil))
}

func TestUndoOperationModel_ExpiredUndo(t *testing.T) {
	past := time.Now().Add(-25 * time.Hour)
	op := model.UndoOperation{
		UndoableUntil: &past,
		Undone:        false,
	}
	assert.True(t, time.Now().After(*op.UndoableUntil))
}

func TestUndoOperationModel_AlreadyUndone(t *testing.T) {
	op := model.UndoOperation{
		Undone: true,
	}
	assert.True(t, op.Undone)
}

func TestUndoService_UndoOperation_NilRepo(t *testing.T) {
	svc := NewUndoService(nil, nil, nil)
	validID := uuid.New().String()
	appErr := svc.UndoOperation(validID)
	assert.NotNil(t, appErr)
	assert.Equal(t, apperrors.ErrInternal.Code, appErr.Code)
}
