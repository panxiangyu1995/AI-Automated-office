package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestEnterpriseOwnership_MatchingEnterprise(t *testing.T) {
	mw := EnterpriseOwnership(nil)

	enterpriseID := uuid.New().String()
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set(ContextKeyEnterpriseID, enterpriseID)
	c.Set(ContextKeyEnterpriseIDFromToken, enterpriseID)
	c.Set(ContextKeyUserID, uuid.New().String())
	c.Request = req

	mw(c)
	if c.IsAborted() {
		t.Error("should not abort when enterprise IDs match")
	}
}

func TestEnterpriseOwnership_NoEnterpriseInContext(t *testing.T) {
	mw := EnterpriseOwnership(nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	mw(c)
	if !c.IsAborted() {
		t.Error("should abort when no enterprise in context (fail-closed)")
	}
}

func TestEnterpriseOwnership_NoTokenEnterprise(t *testing.T) {
	mw := EnterpriseOwnership(nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set(ContextKeyEnterpriseID, uuid.New().String())
	c.Request = req

	mw(c)
	if !c.IsAborted() {
		t.Error("should abort when no token enterprise (fail-closed)")
	}
}

func TestEnterpriseOwnership_MismatchDenied(t *testing.T) {
	mw := EnterpriseOwnership(nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set(ContextKeyEnterpriseID, uuid.New().String())
	c.Set(ContextKeyEnterpriseIDFromToken, uuid.New().String())
	c.Set(ContextKeyUserID, uuid.New().String())
	c.Request = req

	mw(c)
	if !c.IsAborted() {
		t.Error("should abort when enterprise IDs mismatch and no cross-perm checker")
	}
}

func TestEnterpriseOwnership_CrossPermAllowed(t *testing.T) {
	checker := func(userID, targetEnterpriseID uuid.UUID) (bool, error) {
		return true, nil
	}
	mw := EnterpriseOwnership(checker)

	targetID := uuid.New()
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set(ContextKeyEnterpriseID, targetID.String())
	c.Set(ContextKeyEnterpriseIDFromToken, uuid.New().String())
	c.Set(ContextKeyUserID, uuid.New().String())
	c.Request = req

	mw(c)
	if c.IsAborted() {
		t.Error("should not abort when cross-enterprise permission is granted")
	}
}

func TestEnterpriseOwnership_CrossPermDenied(t *testing.T) {
	checker := func(userID, targetEnterpriseID uuid.UUID) (bool, error) {
		return false, nil
	}
	mw := EnterpriseOwnership(checker)

	targetID := uuid.New()
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Set(ContextKeyEnterpriseID, targetID.String())
	c.Set(ContextKeyEnterpriseIDFromToken, uuid.New().String())
	c.Set(ContextKeyUserID, uuid.New().String())
	c.Request = req

	mw(c)
	if !c.IsAborted() {
		t.Error("should abort when cross-enterprise permission is denied")
	}
}

func TestEnterpriseOwnership_IntegrationWithGin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	checker := func(userID, targetEnterpriseID uuid.UUID) (bool, error) {
		return false, nil
	}

	r.GET("/enterprises/:enterprise_id/data",
		func(c *gin.Context) {
			c.Set(ContextKeyEnterpriseID, c.Param("enterprise_id"))
			c.Set(ContextKeyEnterpriseIDFromToken, uuid.New().String())
			c.Set(ContextKeyUserID, uuid.New().String())
			c.Next()
		},
		EnterpriseOwnership(checker),
		func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"data": "ok"})
		},
	)

	req := httptest.NewRequest(http.MethodGet, "/enterprises/"+uuid.New().String()+"/data", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}
