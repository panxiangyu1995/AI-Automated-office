package module

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAuthFoundationStructure(t *testing.T) {
	t.Parallel()

	requiredPaths := []string{
		"domain/entity/user.go",
		"domain/entity/session.go",
		"domain/entity/token.go",
		"domain/valueobject/password.go",
		"domain/valueobject/permission_summary.go",
		"domain/repository/user_repository.go",
		"domain/repository/session_repository.go",
		"domain/service/session_manager.go",
		"application/service/auth_service.go",
		"application/dto/login_request.go",
		"application/dto/login_response.go",
		"application/dto/refresh_request.go",
		"application/dto/refresh_response.go",
		"infrastructure/crypto/bcrypt_hasher.go",
		"infrastructure/crypto/jwt_manager.go",
		"infrastructure/persistence/user_repository.go",
		"infrastructure/persistence/session_repository.go",
		"infrastructure/logging/auth_logger.go",
		"interface/handler/auth_handler.go",
	}

	for _, rel := range requiredPaths {
		abs := filepath.Join(rel)
		if _, err := os.Stat(abs); err != nil {
			t.Fatalf("missing required auth foundation file: %s (%v)", rel, err)
		}
	}
}
