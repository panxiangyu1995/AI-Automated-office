package persistence

import (
	"context"
	"database/sql/driver"
	"strings"
	"testing"
	"time"

	"cloud-server/internal/model"
)

func TestSessionRepositoryCreate(t *testing.T) {
	t.Parallel()

	state := &stubState{
		exec: func(query string, args []driver.NamedValue) (driver.Result, error) {
			if !strings.Contains(query, "INSERT INTO sessions") {
				t.Fatalf("unexpected query: %s", query)
			}
			if len(args) != 12 {
				t.Fatalf("unexpected args length: %d", len(args))
			}
			return driver.RowsAffected(1), nil
		},
	}

	db, err := openStubDB(state)
	if err != nil {
		t.Fatalf("openStubDB failed: %v", err)
	}
	defer db.Close()

	repo := NewSessionRepository(db)
	err = repo.Create(context.Background(), &model.Session{
		UserID:           "user-1",
		TenantID:         "tenant-a",
		TokenHash:        "token-hash",
		RefreshTokenHash: "refresh-hash",
		DeviceInfo:       []byte(`{"os":"windows"}`),
		ExpiresAt:        time.Now().Add(30 * time.Minute),
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
}

func TestSessionRepositoryFindByTokenHash(t *testing.T) {
	t.Parallel()

	now := time.Now()
	state := &stubState{
		query: func(query string, args []driver.NamedValue) (driver.Rows, error) {
			if !strings.Contains(query, "FROM sessions") || !strings.Contains(query, "token_hash = $1") {
				t.Fatalf("unexpected query: %s", query)
			}
			if len(args) != 1 || args[0].Value != "token-hash" {
				t.Fatalf("unexpected args: %+v", args)
			}
			return &stubRows{
				cols: []string{
					"id", "user_id", "tenant_id", "token_hash", "refresh_token_hash", "device_info",
					"ip_address", "user_agent", "status", "revoked_at", "revoked_reason",
					"expires_at", "created_at", "last_activity_at", "deleted_at",
				},
				vals: [][]driver.Value{{
					"session-1", "user-1", "tenant-a", "token-hash", "refresh-hash", []byte(`{}`),
					"", "", "active", nil, "", now.Add(30 * time.Minute), now, now, nil,
				}},
			}, nil
		},
	}

	db, err := openStubDB(state)
	if err != nil {
		t.Fatalf("openStubDB failed: %v", err)
	}
	defer db.Close()

	repo := NewSessionRepository(db)
	session, err := repo.FindByTokenHash(context.Background(), "token-hash")
	if err != nil {
		t.Fatalf("FindByTokenHash failed: %v", err)
	}
	if session == nil || session.ID != "session-1" || session.UserID != "user-1" {
		t.Fatalf("unexpected session: %+v", session)
	}
}
