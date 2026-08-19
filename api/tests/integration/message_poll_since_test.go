package integration

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
)

func TestMessage_PollSince_MicrosecondPrecision(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)

	createdAt := time.Date(2026, 8, 19, 6, 58, 52, 682928000, time.UTC)
	msg := &model.Message{
		TenantModel: model.TenantModel{
			EnterpriseID: uuid.MustParse(fx.EnterpriseID),
		},
		SenderID:   fx.Operator.ID.String(),
		ReceiverID: fx.EmployeeUser.ID.String(),
		Title:      "precision probe",
		Content:    "since boundary probe",
		MsgType:    "system",
	}
	if err := db.Create(msg).Error; err != nil {
		t.Fatalf("failed to create message: %v", err)
	}
	defer db.Unscoped().Where("id = ?", msg.ID).Delete(&model.Message{})
	if err := db.Model(msg).Update("created_at", createdAt).Error; err != nil {
		t.Fatalf("failed to set created_at: %v", err)
	}
	var stored model.Message
	if err := db.First(&stored, "id = ?", msg.ID).Error; err != nil {
		t.Fatalf("failed to reload message: %v", err)
	}
	if stored.CreatedAt.UnixNano() != createdAt.UnixNano() {
		t.Fatalf("created_at precision lost on write: got %v want %v", stored.CreatedAt, createdAt)
	}

	repo := repository.NewMessageRepository(db)
	entID := uuid.MustParse(fx.EnterpriseID)
	receiver := fx.EmployeeUser.ID.String()

	msgsAtSince, err := repo.ListUnreadByReceiver(entID, receiver, createdAt, 10)
	if err != nil {
		t.Fatalf("ListUnreadByReceiver(since=createdAt) error: %v", err)
	}
	if len(msgsAtSince) != 0 {
		t.Fatalf("expected 0 msgs with since=createdAt, got %d (duplicate redelivery bug)", len(msgsAtSince))
	}

	msgsBeforeSince, err := repo.ListUnreadByReceiver(entID, receiver, createdAt.Add(-time.Microsecond), 10)
	if err != nil {
		t.Fatalf("ListUnreadByReceiver(since-1us) error: %v", err)
	}
	if len(msgsBeforeSince) != 1 {
		t.Fatalf("expected 1 msg with since-1us, got %d", len(msgsBeforeSince))
	}
	if msgsBeforeSince[0].ID != msg.ID {
		t.Fatalf("expected message %s, got %s", msg.ID, msgsBeforeSince[0].ID)
	}
}