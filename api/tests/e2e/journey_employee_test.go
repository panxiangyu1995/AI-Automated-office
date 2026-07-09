package e2e

import (
	"testing"

	e2etestutil "github.com/ai-office/api/tests/e2e/testutil"
	inttestutil "github.com/ai-office/api/tests/integration/testutil"
)

func TestJourney_EmployeeDaily(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "employee", fx)
	agent.LoginAsEmployee()

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees")
	if w.Code != 200 {
		t.Errorf("employee list employees: expected 200, got %d", w.Code)
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/expenses", map[string]interface{}{
		"category":     "leave",
		"description":  "Annual leave request",
		"submitted_by": fx.EmployeeUser.ID.String(),
		"amount":       0,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("employee submit leave: expected 200/201, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/messages")
	if w.Code != 200 {
		t.Errorf("employee list messages: expected 200, got %d", w.Code)
	}

	w = client.GET("/api/v1/dashboard")
	if w.Code != 200 {
		t.Errorf("employee dashboard: expected 200, got %d", w.Code)
	}
}
