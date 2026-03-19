package entity

import (
	"reflect"
	"testing"
)

func TestUserEntityHasRequiredFieldsWithGormTags(t *testing.T) {
	t.Parallel()

	userType := reflect.TypeOf(User{})
	required := []string{"ID", "Username", "PasswordHash", "Email", "Status"}
	for _, field := range required {
		f, ok := userType.FieldByName(field)
		if !ok {
			t.Fatalf("missing User.%s", field)
		}
		if f.Tag.Get("gorm") == "" {
			t.Fatalf("User.%s must define gorm tag", field)
		}
	}
}

func TestSessionEntityHasRequiredFieldsWithGormTags(t *testing.T) {
	t.Parallel()

	sessionType := reflect.TypeOf(Session{})
	required := []string{"ID", "UserID", "TenantID", "ExpiresAt", "RevokedAt"}
	for _, field := range required {
		f, ok := sessionType.FieldByName(field)
		if !ok {
			t.Fatalf("missing Session.%s", field)
		}
		if f.Tag.Get("gorm") == "" {
			t.Fatalf("Session.%s must define gorm tag", field)
		}
	}
}

func TestTokenEntityHasRequiredFieldsWithGormTags(t *testing.T) {
	t.Parallel()

	tokenType := reflect.TypeOf(Token{})
	required := []string{"AccessToken", "RefreshToken", "ExpiresIn"}
	for _, field := range required {
		f, ok := tokenType.FieldByName(field)
		if !ok {
			t.Fatalf("missing Token.%s", field)
		}
		if f.Tag.Get("gorm") == "" {
			t.Fatalf("Token.%s must define gorm tag", field)
		}
	}
}
