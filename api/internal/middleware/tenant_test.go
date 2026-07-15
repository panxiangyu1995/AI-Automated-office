package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/rbac"
)

func TestTenant_Header(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		schema := GetSchema(c)
		c.JSON(http.StatusOK, gin.H{
			"enterprise_id": eid,
			"schema":        schema,
		})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", "550e8400-e29b-41d4-a716-446655440000")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_NoHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "" {
			t.Errorf("expected empty enterprise_id, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_QueryParam(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "test-enterprise" {
			t.Errorf("expected test-enterprise, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test?enterprise_id=test-enterprise", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_HeaderPriority(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		eid := GetEnterpriseID(c)
		if eid != "from-header" {
			t.Errorf("expected from-header, got %s", eid)
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test?enterprise_id=from-query", nil)
	req.Header.Set("X-Enterprise-ID", "from-header")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestTenant_SameEnterprise_Passes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	eid := uuid.New().String()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, eid)
		c.Set(ContextKeyRole, "employee")
		c.Set(ContextKeyUserID, uuid.New().String())
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", eid)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenant_DifferentEnterprise_Blocked(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tokenEID := uuid.New().String()
	requestEID := uuid.New().String()

	originalDB := GlobalTenantDB
	GlobalTenantDB = nil
	defer func() { GlobalTenantDB = originalDB }()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, tokenEID)
		c.Set(ContextKeyRole, "employee")
		c.Set(ContextKeyUserID, uuid.New().String())
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		t.Error("handler should not be called for different enterprise")
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", requestEID)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestTenant_OperatorBypassesCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tokenEID := uuid.New().String()
	requestEID := uuid.New().String()

	originalDB := GlobalTenantDB
	GlobalTenantDB = nil
	defer func() { GlobalTenantDB = originalDB }()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, tokenEID)
		c.Set(ContextKeyRole, string(rbac.RoleOperator))
		c.Set(ContextKeyUserID, uuid.New().String())
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", requestEID)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenant_OwnerBypassesCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tokenEID := uuid.New().String()
	requestEID := uuid.New().String()

	originalDB := GlobalTenantDB
	GlobalTenantDB = nil
	defer func() { GlobalTenantDB = originalDB }()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, tokenEID)
		c.Set(ContextKeyRole, string(rbac.RoleOwner))
		c.Set(ContextKeyUserID, uuid.New().String())
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", requestEID)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenant_GlobalTenantDBNil_UserBelongsToEnterprise(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tokenEID := uuid.New().String()
	requestEID := uuid.New().String()
	userID := uuid.New().String()

	originalDB := GlobalTenantDB
	GlobalTenantDB = nil
	defer func() { GlobalTenantDB = originalDB }()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, tokenEID)
		c.Set(ContextKeyRole, "employee")
		c.Set(ContextKeyUserID, userID)
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		t.Error("should not reach handler when GlobalTenantDB is nil and enterprises differ")
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", requestEID)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestTenant_UserBelongsToEnterprise_WithDB(t *testing.T) {
	db := setupTenantTestDB(t)
	originalDB := GlobalTenantDB
	GlobalTenantDB = db
	defer func() { GlobalTenantDB = originalDB }()

	eid := uuid.New().String()
	userID := uuid.New().String()
	db.Exec(`INSERT INTO users (id, enterprise_id, email, password_hash, name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, eid, "user@tenant-test.com", "hash", "User", "employee", "active", time.Now(), time.Now())

	gin.SetMode(gin.TestMode)
	tokenEID := uuid.New().String()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ContextKeyEnterpriseIDFromToken, tokenEID)
		c.Set(ContextKeyRole, "employee")
		c.Set(ContextKeyUserID, userID)
		c.Next()
	})
	r.Use(Tenant())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Enterprise-ID", eid)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetTenantDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	assert.Nil(t, GetTenantDB(c))

	c.Set(ContextKeyTenantDB, nil)
	assert.Nil(t, GetTenantDB(c))
}

func setupTenantTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE users (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, employee_id TEXT,
		email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL,
		name VARCHAR(100) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'employee',
		status VARCHAR(20) NOT NULL DEFAULT 'active', last_login_at DATETIME)`).Error)
	return db
}
