package model

import (
	"testing"

	"github.com/google/uuid"
)

func TestBaseModel_BeforeCreate_SetsUUID(t *testing.T) {
	m := &BaseModel{}
	if err := m.BeforeCreate(nil); err != nil {
		t.Fatalf("BeforeCreate failed: %v", err)
	}
	if m.ID == uuid.Nil {
		t.Error("expected non-nil UUID after BeforeCreate")
	}
}

func TestBaseModel_BeforeCreate_KeepsExistingUUID(t *testing.T) {
	existingID := uuid.New()
	m := &BaseModel{ID: existingID}
	if err := m.BeforeCreate(nil); err != nil {
		t.Fatalf("BeforeCreate failed: %v", err)
	}
	if m.ID != existingID {
		t.Errorf("expected UUID %s, got %s", existingID, m.ID)
	}
}

func TestTenantModel_HasEnterpriseID(t *testing.T) {
	enterpriseID := uuid.New()
	tm := &TenantModel{
		EnterpriseID: enterpriseID,
	}
	if tm.EnterpriseID != enterpriseID {
		t.Errorf("expected enterprise_id %s, got %s", enterpriseID, tm.EnterpriseID)
	}
}
