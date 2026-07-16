package acceptance

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/middleware"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
)

func connectEnterpriseDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := "host=localhost user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err)
	return db
}

func setupEnterpriseStatusTables(t *testing.T, db *gorm.DB) {
	t.Helper()
	db.Exec(`CREATE TABLE IF NOT EXISTS enterprises (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		group_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		code VARCHAR(100) NOT NULL UNIQUE,
		contact_email VARCHAR(255),
		contact_phone VARCHAR(50),
		address TEXT,
		status VARCHAR(20) NOT NULL DEFAULT 'trial',
		status_reason TEXT,
		status_changed_at TIMESTAMP,
		status_changed_by UUID,
		suspended_at TIMESTAMP,
		frozen_at TIMESTAMP,
		subscribed_at TIMESTAMP,
		expires_at TIMESTAMP,
		schema_name VARCHAR(100)
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS enterprise_status_logs (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		operator_id UUID NOT NULL,
		from_status VARCHAR(20),
		to_status VARCHAR(20) NOT NULL,
		reason TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS groups (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		name VARCHAR(255) NOT NULL,
		code VARCHAR(100) NOT NULL UNIQUE,
		contact_email VARCHAR(255),
		contact_phone VARCHAR(50),
		address TEXT,
		status VARCHAR(20) NOT NULL DEFAULT 'active')
	`)
}

func insertTestEnterprise(t *testing.T, db *gorm.DB, gid uuid.UUID, name, code, status string) uuid.UUID {
	t.Helper()
	eid := uuid.New()
	now := time.Now()
	var statusChangedAt *time.Time
	var suspendedAt *time.Time
	var frozenAt *time.Time
	var subscribedAt *time.Time
	if status != "trial" {
		statusChangedAt = &now
	}
	if status == "suspended" {
		suspendedAt = &now
	}
	if status == "frozen" {
		frozenAt = &now
	}
	if status == "active" {
		subscribedAt = &now
	}
	err := db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status, status_changed_at, suspended_at, frozen_at, subscribed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, eid, gid, name, code, status, statusChangedAt, suspendedAt, frozenAt, subscribedAt).Error
	require.NoError(t, err, "direct insert enterprise should succeed")
	return eid
}

func TestAcceptance_EnterpriseState_FullLifecycle(t *testing.T) {
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	entRepo := repository.NewEnterpriseRepository(db)
	statusLogRepo := repository.NewEnterpriseStatusLogRepository(db)
	svc := service.NewEnterpriseService(entRepo, statusLogRepo, nil)

	gid := uuid.New()
	db.Exec(`INSERT INTO groups (id, name, code) VALUES (?, 'Test Group', ?) ON CONFLICT (code) DO NOTHING`, gid, "GRP-"+gid.String()[:8])

	eid := insertTestEnterprise(t, db, gid, "Lifecycle Test Corp", "LIFECYCLE-"+uuid.New().String()[:8], "trial")
	ent, appErr := svc.Get(eid.String())
	require.Nil(t, appErr, "Get should succeed")
	assert.Equal(t, "trial", ent.Status, "new enterprise should default to trial")
	t.Logf("Step 1: Created enterprise %s, status=trial", eid)

	ent, appErr = svc.ChangeStatus(eid.String(), "active", "trial period passed", uuid.New().String())
	require.Nil(t, appErr, "trial→active should succeed")
	assert.Equal(t, "active", ent.Status)
	assert.NotNil(t, ent.SubscribedAt, "subscribed_at should be set on activation")
	t.Logf("Step 2: Activated enterprise, subscribed_at=%v", ent.SubscribedAt)

	ent, appErr = svc.ChangeStatus(eid.String(), "suspended", "payment overdue", uuid.New().String())
	require.Nil(t, appErr, "active→suspended should succeed")
	assert.Equal(t, "suspended", ent.Status)
	assert.NotNil(t, ent.SuspendedAt, "suspended_at should be set")
	t.Log("Step 3: Suspended enterprise for overdue")

	ent, appErr = svc.ChangeStatus(eid.String(), "active", "payment settled", uuid.New().String())
	require.Nil(t, appErr, "suspended→active should succeed")
	assert.Equal(t, "active", ent.Status)
	t.Log("Step 4: Reactivated enterprise after payment")

	ent, appErr = svc.ChangeStatus(eid.String(), "frozen", "risk control", uuid.New().String())
	require.Nil(t, appErr, "active→frozen should succeed")
	assert.NotNil(t, ent.FrozenAt, "frozen_at should be set")
	t.Log("Step 5: Frozen enterprise for risk control")

	ent, appErr = svc.ChangeStatus(eid.String(), "cancelled", "voluntary cancellation", uuid.New().String())
	require.Nil(t, appErr, "frozen→cancelled should succeed")
	assert.Equal(t, "cancelled", ent.Status)
	t.Log("Step 6: Cancelled enterprise")

	logs, appErr := svc.GetStatusLog(eid.String())
	require.Nil(t, appErr)
	assert.Len(t, logs, 5, "should have 5 status log entries")
	t.Logf("Step 7: Status log has %d entries as expected", len(logs))
}

func TestAcceptance_EnterpriseState_InvalidTransitions(t *testing.T) {
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	entRepo := repository.NewEnterpriseRepository(db)
	statusLogRepo := repository.NewEnterpriseStatusLogRepository(db)
	svc := service.NewEnterpriseService(entRepo, statusLogRepo, nil)

	gid := uuid.New()
	db.Exec(`INSERT INTO groups (id, name, code) VALUES (?, 'Invalid Trans Group', ?) ON CONFLICT (code) DO NOTHING`, gid, "GRP-"+gid.String()[:8])

	eid := insertTestEnterprise(t, db, gid, "Invalid Transition Corp", "INVALID-"+uuid.New().String()[:8], "trial")
	opID := uuid.New().String()

	_, appErr := svc.ChangeStatus(eid.String(), "frozen", "skip", opID)
	assert.NotNil(t, appErr, "trial→frozen should be invalid")
	assert.Equal(t, "ENT_INVALID_STATUS_TRANSITION", appErr.Code)
	t.Log("Step 1: trial→frozen correctly rejected")

	_, appErr = svc.ChangeStatus(eid.String(), "suspended", "skip", opID)
	assert.NotNil(t, appErr, "trial→suspended should be invalid")
	t.Log("Step 2: trial→suspended correctly rejected")

	svc.ChangeStatus(eid.String(), "active", "activated", opID)

	_, appErr = svc.ChangeStatus(eid.String(), "trial", "back to trial", opID)
	assert.NotNil(t, appErr, "active→trial should be invalid")
	t.Log("Step 3: active→trial correctly rejected")

	svc.ChangeStatus(eid.String(), "cancelled", "done", opID)

	_, appErr = svc.ChangeStatus(eid.String(), "active", "revive", opID)
	assert.NotNil(t, appErr, "cancelled→active should be invalid")
	t.Log("Step 4: cancelled→active correctly rejected")
}

func TestAcceptance_EnterpriseState_MiddlewareBlocksFrozen(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "MIDDLE-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Middleware Test', ?, 'frozen')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/test-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/test-endpoint", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code, "frozen enterprise should be blocked")
	assert.Contains(t, w.Body.String(), "ENTERPRISE_FROZEN")
	t.Log("Step 1: Frozen enterprise correctly blocked by middleware")
}

func TestAcceptance_EnterpriseState_MiddlewareBlocksCancelled(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "CANCEL-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Cancelled Test', ?, 'cancelled')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/test-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/test-endpoint", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "ENTERPRISE_CANCELLED")
	t.Log("Step 2: Cancelled enterprise correctly blocked by middleware")
}

func TestAcceptance_EnterpriseState_MiddlewareAllowsActive(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "ACTIVE-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Active Test', ?, 'active')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/test-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/test-endpoint", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	t.Log("Step 3: Active enterprise allowed through middleware")
}

func TestAcceptance_EnterpriseState_MiddlewareAllowsTrial(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "TRIAL-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Trial Test', ?, 'trial')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/test-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/test-endpoint", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	t.Log("Step 4: Trial enterprise allowed through middleware")
}

func TestAcceptance_EnterpriseState_MiddlewareSuspendedAllowsAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "SUSP-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Suspended Test', ?, 'suspended')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/auth/login", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.GET("/api/v1/enterprises/123/status-log", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.GET("/api/v1/business-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/auth/login", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code, "auth endpoints should be allowed for suspended")
	t.Log("Step 5a: Suspended enterprise can access auth endpoints")

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/enterprises/123/status-log", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code, "status-log should be allowed for suspended")
	t.Log("Step 5b: Suspended enterprise can access status-log")

	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/business-endpoint", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code, "business endpoints should be blocked for suspended")
	assert.Contains(t, w.Body.String(), "ENTERPRISE_SUSPENDED")
	t.Log("Step 5c: Suspended enterprise blocked from business endpoints")
}

func TestAcceptance_EnterpriseState_MiddlewareExpired(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	middleware.GlobalEnterpriseDB = db
	t.Cleanup(func() { middleware.GlobalEnterpriseDB = nil })

	eid := uuid.New()
	code := "EXP-" + eid.String()[:8]
	db.Exec(`INSERT INTO enterprises (id, group_id, name, code, status) VALUES (?, ?, 'Expired Test', ?, 'expired')`, eid, uuid.New(), code)

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("enterprise_id", eid.String())
		c.Next()
	})
	r.Use(middleware.EnterpriseStatusMiddleware())
	r.GET("/api/v1/test-endpoint", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/test-endpoint", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "ENTERPRISE_EXPIRED")
	t.Log("Step 6: Expired enterprise correctly blocked")
}

func TestAcceptance_EnterpriseState_StatusLogRecordsAll(t *testing.T) {
	db := connectEnterpriseDB(t)
	setupEnterpriseStatusTables(t, db)

	entRepo := repository.NewEnterpriseRepository(db)
	statusLogRepo := repository.NewEnterpriseStatusLogRepository(db)
	svc := service.NewEnterpriseService(entRepo, statusLogRepo, nil)

	gid := uuid.New()
	db.Exec(`INSERT INTO groups (id, name, code) VALUES (?, 'Log Test Group', ?) ON CONFLICT (code) DO NOTHING`, gid, "GRP-"+gid.String()[:8])

	eid := insertTestEnterprise(t, db, gid, "Log Test Corp", "LOG-"+uuid.New().String()[:8], "trial")
	op1 := uuid.New()
	op2 := uuid.New()

	svc.ChangeStatus(eid.String(), "active", "trial completed", op1.String())
	svc.ChangeStatus(eid.String(), "suspended", "invoice overdue 30 days", op2.String())

	logs, _ := svc.GetStatusLog(eid.String())
	require.Len(t, logs, 2, "should have 2 log entries")

	assert.Equal(t, "trial", logs[1].FromStatus)
	assert.Equal(t, "active", logs[1].ToStatus)
	assert.Equal(t, op1, logs[1].OperatorID)
	assert.Equal(t, "trial completed", logs[1].Reason)

	assert.Equal(t, "active", logs[0].FromStatus)
	assert.Equal(t, "suspended", logs[0].ToStatus)
	assert.Equal(t, op2, logs[0].OperatorID)
	assert.Equal(t, "invoice overdue 30 days", logs[0].Reason)

	t.Log("Step 7: Status log correctly records all transitions with operators and reasons")
}
