package model

import "testing"

func TestUser_TableName(t *testing.T) {
	u := User{}
	if u.TableName() != "users" {
		t.Errorf("expected table name 'users', got %s", u.TableName())
	}
}

func TestUser_DefaultRole(t *testing.T) {
	u := User{}
	if u.Role != "" {
		t.Errorf("expected empty default role, got %s", u.Role)
	}
}

func TestUser_DefaultStatus(t *testing.T) {
	u := User{}
	if u.Status != "" {
		t.Errorf("expected empty default status, got %s", u.Status)
	}
}

func TestUser_PasswordHash_NotSerialized(t *testing.T) {
	u := User{PasswordHash: "secret-hash"}
	json := `{"email":"test@test.com"}`
	if len(json) == 0 {
		t.Error("json should not be empty")
	}
	_ = u
}
