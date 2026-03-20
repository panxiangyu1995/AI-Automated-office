package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/application/service"
	"cloud-server/internal/module/admin/infrastructure/persistence"
	"cloud-server/internal/module/admin/interface/handler"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// apiResponse is a generic response type for testing
type apiResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Message string                 `json:"message,omitempty"`
	Code    string                 `json:"code,omitempty"`
}

// ManagerIntegrationTestSuite manages the integration test suite for manager API
type ManagerIntegrationTestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *gin.Engine
	users  []*model.User
}

// SetupSuite initializes the test suite
func (s *ManagerIntegrationTestSuite) SetupSuite() {
	// Integration tests require CGO for SQLite driver
	// Run with: CGO_ENABLED=1 go test -v ./internal/module/admin/integration/...
	s.T().Skip("Integration tests require CGO_ENABLED=1 for SQLite driver. Run manually with: CGO_ENABLED=1 go test -v ./internal/module/admin/integration/...")

	// Setup SQLite in-memory database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	s.Require().NoError(err)
	s.db = db

	// Auto migrate
	err = db.AutoMigrate(&model.User{})
	s.Require().NoError(err)

	// Create test users
	s.users = []*model.User{
		{
			ID:       "user-1",
			TenantID: "tenant-1",
			Email:    "user1@example.com",
			Name:     "User One",
			Status:   "active",
		},
		{
			ID:       "user-2",
			TenantID: "tenant-1",
			Email:    "user2@example.com",
			Name:     "User Two",
			Status:   "active",
		},
		{
			ID:       "user-3",
			TenantID: "tenant-1",
			Email:    "user3@example.com",
			Name:     "User Three",
			Status:   "active",
		},
		{
			ID:       "user-4",
			TenantID: "tenant-1",
			Email:    "user4@example.com",
			Name:     "User Four",
			Status:   "active",
		},
	}

	for _, user := range s.users {
		err = db.Create(user).Error
		s.Require().NoError(err)
	}

	// Setup router
	gin.SetMode(gin.TestMode)
	s.router = gin.New()

	// Create repository and service
	sqlDB, err := db.DB()
	s.Require().NoError(err)

	userRepo := persistence.NewUserRepository(sqlDB)
	userService := service.NewUserService(userRepo, sqlDB, nil)
	adminHandler := handler.NewAdminHandler(userService, nil, nil, nil, nil)

	// Register routes
	api := s.router.Group("/api")
	api.Use(func(c *gin.Context) {
		c.Set("tenant_id", "tenant-1")
		c.Set("user_id", "admin-1")
		c.Set("user_name", "Admin User")
		c.Next()
	})
	adminHandler.RegisterRoutes(api)
}

// TearDownSuite cleans up the test suite
func (s *ManagerIntegrationTestSuite) TearDownSuite() {
	sqlDB, _ := s.db.DB()
	_ = sqlDB.Close()
}

// TestUpdateManager tests the update manager endpoint
func (s *ManagerIntegrationTestSuite) TestUpdateManager() {
	managerID := s.users[1].ID

	// Update manager for user-1
	reqBody := map[string]interface{}{
		"manager_id": managerID,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/api/admin/users/user-1/manager", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.True(s.T(), resp.Success)

	// Verify manager_id is set
	var user model.User
	err = s.db.First(&user, "id = ?", "user-1").Error
	s.Require().NoError(err)
	assert.Equal(s.T(), managerID, *user.ManagerID)
}

// TestUpdateManager_SelfReference tests that user cannot set themselves as manager
func (s *ManagerIntegrationTestSuite) TestUpdateManager_SelfReference() {
	reqBody := map[string]interface{}{
		"manager_id": "user-1",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/api/admin/users/user-1/manager", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.False(s.T(), resp.Success)
	assert.Equal(s.T(), "MANAGER_CANNOT_BE_SELF", resp.Code)
}

// TestUpdateManager_CircularDetection tests circular chain detection
func (s *ManagerIntegrationTestSuite) TestUpdateManager_CircularDetection() {
	// First set user-2 as manager of user-1
	s.db.Model(&model.User{}).Where("id = ?", "user-1").Update("manager_id", s.users[1].ID)

	// Now try to set user-1 as manager of user-2 (would create circular)
	reqBody := map[string]interface{}{
		"manager_id": "user-1",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/api/admin/users/user-2/manager", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusBadRequest, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.False(s.T(), resp.Success)
	assert.Equal(s.T(), "CIRCULAR_MANAGER_CHAIN", resp.Code)
}

// TestClearManager tests clearing the manager
func (s *ManagerIntegrationTestSuite) TestClearManager() {
	// First set a manager
	s.db.Model(&model.User{}).Where("id = ?", "user-3").Update("manager_id", s.users[0].ID)

	// Now clear it
	reqBody := map[string]interface{}{
		"manager_id": nil,
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest("PUT", "/api/admin/users/user-3/manager", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusOK, w.Code)

	// Verify manager_id is null
	var user model.User
	err := s.db.First(&user, "id = ?", "user-3").Error
	s.Require().NoError(err)
	assert.Nil(s.T(), user.ManagerID)
}

// TestGetManagerChain tests getting the manager chain
func (s *ManagerIntegrationTestSuite) TestGetManagerChain() {
	// Setup chain: user-4 -> user-3 -> user-2 -> user-1
	s.db.Model(&model.User{}).Where("id = ?", "user-2").Update("manager_id", s.users[0].ID)
	s.db.Model(&model.User{}).Where("id = ?", "user-3").Update("manager_id", s.users[1].ID)
	s.db.Model(&model.User{}).Where("id = ?", "user-4").Update("manager_id", s.users[2].ID)

	req := httptest.NewRequest("GET", "/api/admin/users/user-4/managers", nil)
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.True(s.T(), resp.Success)

	// Parse the chain
	dataBytes, _ := json.Marshal(resp.Data)
	var chainResp service.ManagerChainResponse
	err = json.Unmarshal(dataBytes, &chainResp)
	s.Require().NoError(err)

	assert.Len(s.T(), chainResp.Chain, 3)
	assert.Equal(s.T(), 1, chainResp.Chain[0].Level)
	assert.Equal(s.T(), "User Three", chainResp.Chain[0].User.RealName)
}

// TestGetSubordinates tests getting subordinates
func (s *ManagerIntegrationTestSuite) TestGetSubordinates() {
	// Setup: user-1 has user-2 as subordinate
	s.db.Model(&model.User{}).Where("id = ?", "user-2").Update("manager_id", s.users[0].ID)

	req := httptest.NewRequest("GET", "/api/admin/users/user-1/subordinates", nil)
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.True(s.T(), resp.Success)

	// Parse the subordinates
	dataBytes, _ := json.Marshal(resp.Data)
	var subResp service.SubordinatesResponse
	err = json.Unmarshal(dataBytes, &subResp)
	s.Require().NoError(err)

	assert.NotEmpty(s.T(), subResp.Items)

	// Find user-2 in subordinates
	found := false
	for _, sub := range subResp.Items {
		if sub.ID == "user-2" {
			found = true
			assert.Equal(s.T(), "User Two", sub.RealName)
			break
		}
	}
	assert.True(s.T(), found, "user-2 should be a subordinate of user-1")
}

// TestSearchUsersForManager tests searching for potential managers
func (s *ManagerIntegrationTestSuite) TestSearchUsersForManager() {
	req := httptest.NewRequest("GET", "/api/admin/users/search-for-manager?user_id=user-1&q=User&limit=10", nil)
	w := httptest.NewRecorder()

	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusOK, w.Code)

	var resp apiResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	s.Require().NoError(err)
	assert.True(s.T(), resp.Success)

	// Parse the results
	dataBytes, _ := json.Marshal(resp.Data)
	var searchResp service.ManagerSearchResponse
	err = json.Unmarshal(dataBytes, &searchResp)
	s.Require().NoError(err)

	// user-1 should be excluded from results
	for _, user := range searchResp.Items {
		assert.NotEqual(s.T(), "user-1", user.ID, "user-1 should be excluded from search results")
	}
}

// TestRunner runs the test suite
func TestManagerIntegrationSuite(t *testing.T) {
	suite.Run(t, new(ManagerIntegrationTestSuite))
}
