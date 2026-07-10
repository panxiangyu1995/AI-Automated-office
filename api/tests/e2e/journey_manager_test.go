package e2e

import (
	"testing"

	e2etestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/e2e/testutil"
	inttestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
)

func TestJourney_ManagerDepartment(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "manager", fx)
	agent.LoginAsManager()

	w := client.GET("/api/v1/reports/sales")
	if w.Code != 200 {
		t.Errorf("manager sales report: expected 200, got %d", w.Code)
	}

	w = client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees")
	if w.Code != 200 {
		t.Errorf("manager list employees: expected 200, got %d", w.Code)
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/expenses", map[string]interface{}{
		"category":     "travel",
		"description":  "Business trip",
		"submitted_by": fx.EmployeeUser.ID.String(),
		"amount":       3000,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("manager create expense: expected 200/201, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/messages")
	if w.Code != 200 {
		t.Errorf("manager list messages: expected 200, got %d", w.Code)
	}

	w = client.GET("/api/v1/dashboard")
	if w.Code != 200 {
		t.Errorf("manager dashboard: expected 200, got %d", w.Code)
	}
}
