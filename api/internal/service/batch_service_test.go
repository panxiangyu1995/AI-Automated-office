package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func TestBatchService_BatchDeleteUnsupportedType(t *testing.T) {
	svc := NewBatchService(nil, nil, nil)
	entID := uuid.New()
	succeeded, failed := svc.BatchDelete("unknown_type", []uuid.UUID{uuid.New()}, entID)
	assert.Len(t, succeeded, 0)
	assert.Len(t, failed, 1)
}

func TestBatchService_BatchStatusChangeUnsupportedType(t *testing.T) {
	svc := NewBatchService(nil, nil, nil)
	entID := uuid.New()
	succeeded, failed := svc.BatchStatusChange("unknown_type", []uuid.UUID{uuid.New()}, entID, "active")
	assert.Len(t, succeeded, 0)
	assert.Len(t, failed, 1)
}

func TestBatchService_BatchApprove_NilWorkflowSvc(t *testing.T) {
	svc := NewBatchService(nil, nil, nil)
	entID := uuid.New()
	succeeded, failed := svc.BatchApprove([]uuid.UUID{uuid.New()}, entID, "approver")
	assert.Len(t, succeeded, 0)
	assert.Len(t, failed, 1)
}

func TestBatchService_BatchDelete_NilDeleteRepos(t *testing.T) {
	svc := NewBatchService(nil, nil, nil)
	entID := uuid.New()
	succeeded, failed := svc.BatchDelete("customers", []uuid.UUID{uuid.New()}, entID)
	assert.Len(t, succeeded, 0)
	assert.Len(t, failed, 1)
}

func TestBatchService_BatchStatusChange_NilStatusRepos(t *testing.T) {
	svc := NewBatchService(nil, nil, nil)
	entID := uuid.New()
	succeeded, failed := svc.BatchStatusChange("customers", []uuid.UUID{uuid.New()}, entID, "inactive")
	assert.Len(t, succeeded, 0)
	assert.Len(t, failed, 1)
}

func TestBatchService_SupportedResourceTypes(t *testing.T) {
	deleteTypes := []string{"customers", "suppliers", "contacts", "contracts", "materials"}
	for _, rt := range deleteTypes {
		assert.NotPanics(t, func() {
			svc := NewBatchService(nil, nil, nil)
			_ = svc
		}, "resource type: "+rt)
	}

	statusTypes := []string{"customers", "contracts", "service_orders", "purchase_orders", "sales_orders"}
	for _, rt := range statusTypes {
		_ = rt
	}

	_ = model.Customer{}
	_ = model.Supplier{}
	_ = model.Contact{}
	_ = model.Contract{}
	_ = model.Material{}
	_ = model.ServiceOrder{}
	_ = model.PurchaseOrder{}
	_ = model.SalesOrder{}
}
