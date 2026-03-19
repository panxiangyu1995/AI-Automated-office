package persistence

import (
	"context"
	"database/sql/driver"
	"strings"
	"testing"
	"time"

	"cloud-server/internal/model"
)

func TestUserRepositoryFindByEmail(t *testing.T) {
	t.Parallel()

	now := time.Now()
	state := &stubState{
		query: func(query string, args []driver.NamedValue) (driver.Rows, error) {
			if !strings.Contains(query, "FROM users") || !strings.Contains(query, "email = $2") {
				t.Fatalf("unexpected query: %s", query)
			}
			if len(args) != 2 || args[0].Value != "tenant-a" || args[1].Value != "demo@corp.com" {
				t.Fatalf("unexpected args: %+v", args)
			}

			return &stubRows{
				cols: []string{
					"id", "tenant_id", "email", "password_hash", "name", "avatar_url", "employee_id",
					"phone", "status", "email_verified", "last_login_at", "preferences", "created_at", "updated_at",
				},
				vals: [][]driver.Value{{
					"user-1", "tenant-a", "demo@corp.com", "hashed", "Demo", "", "", "", "active", true, now, []byte("{}"), now, now,
				}},
			}, nil
		},
	}

	db, err := openStubDB(state)
	if err != nil {
		t.Fatalf("openStubDB failed: %v", err)
	}
	defer db.Close()

	repo := NewUserRepository(db)
	user, err := repo.FindByEmail(context.Background(), "tenant-a", "demo@corp.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}
	if user == nil || user.ID != "user-1" || user.Email != "demo@corp.com" {
		t.Fatalf("unexpected user result: %+v", user)
	}
}

func TestUserRepositoryCreate(t *testing.T) {
	t.Parallel()

	state := &stubState{
		exec: func(query string, args []driver.NamedValue) (driver.Result, error) {
			if !strings.Contains(query, "INSERT INTO users") {
				t.Fatalf("unexpected query: %s", query)
			}
			if len(args) != 13 {
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

	repo := NewUserRepository(db)
	err = repo.Create(context.Background(), &model.User{
		TenantID:      "tenant-a",
		Email:         "demo@corp.com",
		PasswordHash:  "hashed",
		Name:          "Demo",
		Status:        "active",
		EmailVerified: true,
		Preferences:   []byte("{}"),
	})
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
}
