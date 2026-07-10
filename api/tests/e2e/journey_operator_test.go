package e2e

import (
	"testing"

	e2etestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/e2e/testutil"
	inttestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func TestJourney_OperatorInitPlatform(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "operator", fx)

	agent.LoginAsOperator()

	w := client.POST("/api/v1/groups", map[string]string{
		"name": "New Group", "code": "GRP-" + uuid.New().String()[:8],
	})
	if w.Code != 200 && w.Code != 201 {
		t.Errorf("operator create group: expected 200/201, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/groups")
	if w.Code != 200 {
		t.Errorf("operator list groups: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/dashboard")
	if w.Code != 200 {
		t.Errorf("operator dashboard: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/enterprises")
	if w.Code != 200 {
		t.Errorf("operator list enterprises: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/subscription-plans")
	if w.Code != 200 {
		t.Errorf("operator list plans: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/audit-log-entries")
	if w.Code != 200 {
		t.Errorf("operator audit logs: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}
}
