package service

import (
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	"github.com/ai-office/api/pkg/auth"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type mockUserRepo struct {
	users map[string]*model.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{users: make(map[string]*model.User)}
}

func (m *mockUserRepo) Create(user *model.User) error {
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	key := user.Email + ":" + user.EnterpriseID
	m.users[key] = user
	return nil
}

func (m *mockUserRepo) FindByID(id uuid.UUID) (*model.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepo) FindByEmail(email, enterpriseID string) (*model.User, error) {
	for key, u := range m.users {
		if key == email+":"+enterpriseID {
			return u, nil
		}
		// also match by email only
		if u.Email == email && (enterpriseID == "" || u.EnterpriseID == enterpriseID) {
			return u, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepo) Update(user *model.User) error {
	return nil
}

func (m *mockUserRepo) Delete(id uuid.UUID) error {
	return nil
}

func (m *mockUserRepo) List(enterpriseID string, offset, limit int) ([]model.User, int64, error) {
	return nil, 0, nil
}

func (m *mockUserRepo) UpdateLastLogin(id uuid.UUID) error {
	return nil
}

var _ repository.UserRepository = (*mockUserRepo)(nil)

func setupAuthService() (*AuthService, *mockUserRepo) {
	repo := newMockUserRepo()
	jwtMgr := auth.NewJWTManager("test-secret", 3600, 2592000, "test")
	svc := NewAuthService(repo, jwtMgr)

	return svc, repo
}

func seedUser(repo *mockUserRepo, email, password, name, enterpriseID string) *model.User {
	hash, _ := auth.HashPassword(password)
	eid, _ := uuid.Parse(enterpriseID)
	user := &model.User{
		Email:        email,
		PasswordHash: hash,
		Name:         name,
		Role:         "admin",
		Status:       "active",
		EnterpriseID: eid.String(),
	}
	repo.Create(user)
	return user
}

func TestLogin_Success(t *testing.T) {
	svc, repo := setupAuthService()
	eid := uuid.New().String()
	seedUser(repo, "admin@test.com", "password123", "Admin", eid)

	resp, err := svc.Login(LoginRequest{Email: "admin@test.com", Password: "password123"})
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected access token")
	}
	if resp.RefreshToken == "" {
		t.Fatal("expected refresh token")
	}
	if resp.TokenType != "Bearer" {
		t.Errorf("expected Bearer, got %s", resp.TokenType)
	}
	if resp.ExpiresIn <= 0 {
		t.Errorf("expected positive ExpiresIn, got %d", resp.ExpiresIn)
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	svc, repo := setupAuthService()
	eid := uuid.New().String()
	seedUser(repo, "admin@test.com", "correct-pass", "Admin", eid)

	_, err := svc.Login(LoginRequest{Email: "admin@test.com", Password: "wrong-pass"})
	if err == nil {
		t.Fatal("expected error for wrong password")
	}
	if err.Code != "AUTH_UNAUTHORIZED" {
		t.Errorf("expected AUTH_UNAUTHORIZED, got %s", err.Code)
	}
}

func TestLogin_UserNotFound(t *testing.T) {
	svc, _ := setupAuthService()

	_, err := svc.Login(LoginRequest{Email: "nonexistent@test.com", Password: "password"})
	if err == nil {
		t.Fatal("expected error for nonexistent user")
	}
}

func TestLogin_EmptyEmail(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Login(LoginRequest{Email: "", Password: "password"})
	if err == nil || err.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %v", err)
	}
}

func TestLogin_EmptyPassword(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Login(LoginRequest{Email: "a@b.com", Password: ""})
	if err == nil || err.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %v", err)
	}
}

func TestRegister_Success(t *testing.T) {
	svc, _ := setupAuthService()
	eid := uuid.New().String()

	user, err := svc.Register("new@test.com", "password123", "New User", eid)
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if user.Email != "new@test.com" {
		t.Errorf("expected email new@test.com, got %s", user.Email)
	}
	if user.Role != "employee" {
		t.Errorf("expected default role employee, got %s", user.Role)
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	svc, repo := setupAuthService()
	eid := uuid.New().String()
	seedUser(repo, "dup@test.com", "password", "Existing", eid)

	_, err := svc.Register("dup@test.com", "password", "New", eid)
	if err == nil || err.Code != "BIZ_DUPLICATE_ENTRY" {
		t.Errorf("expected BIZ_DUPLICATE_ENTRY, got %v", err)
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Register("", "password", "Name", uuid.New().String())
	if err == nil {
		t.Fatal("expected error for empty email")
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Register("a@b.com", "12345", "Name", uuid.New().String())
	if err == nil {
		t.Fatal("expected error for short password")
	}
}

func TestRegister_EmptyName(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Register("a@b.com", "password123", "", uuid.New().String())
	if err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestRefresh_ValidToken(t *testing.T) {
	svc, repo := setupAuthService()
	eid := uuid.New().String()
	user := seedUser(repo, "user@test.com", "password", "User", eid)

	refreshToken, _, _ := svc.jwtManager.GenerateRefreshToken(user.ID)
	resp, err := svc.Refresh(RefreshRequest{RefreshToken: refreshToken})
	if err != nil {
		t.Fatalf("Refresh failed: %v", err)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected new access token")
	}
}

func TestRefresh_InvalidToken(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Refresh(RefreshRequest{RefreshToken: "invalid-token"})
	if err == nil {
		t.Fatal("expected error for invalid refresh token")
	}
}

func TestRefresh_EmptyToken(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.Refresh(RefreshRequest{RefreshToken: ""})
	if err == nil {
		t.Fatal("expected error for empty refresh token")
	}
	if err.Code != "VAL_INVALID_PARAMS" {
		t.Errorf("expected VAL_INVALID_PARAMS, got %s", err.Code)
	}
}

func TestValidateToken_Valid(t *testing.T) {
	svc, repo := setupAuthService()
	eid := uuid.New().String()
	user := seedUser(repo, "u@t.com", "pass", "U", eid)

	token, _ := svc.jwtManager.GenerateAccessToken(user.ID, uuid.MustParse(eid), "admin", "u@t.com")
	claims, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.Role != "admin" {
		t.Errorf("expected role admin, got %s", claims.Role)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.ValidateToken("bad-token")
	if err == nil {
		t.Fatal("expected error for bad token")
	}
}

func TestGetUser_NotFound(t *testing.T) {
	svc, _ := setupAuthService()
	_, err := svc.GetUser(uuid.New())
	if err == nil {
		t.Fatal("expected error for nonexistent user")
	}
	if !errors.Is(err, apperrors.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
