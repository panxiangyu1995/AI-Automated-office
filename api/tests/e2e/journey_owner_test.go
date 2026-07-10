package e2e

import (
	"testing"

	e2etestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/e2e/testutil"
	inttestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
)

func TestJourney_OwnerMultiEnterprise(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)

	fx2 := inttestutil.CreateFullOrgChain(t, db)
	defer fx2.Cleanup(t, db)

	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "owner", fx)

	agent.LoginAsOwner()

	w := client.GET("/api/v1/enterprises")
	if w.Code != 200 {
		t.Errorf("owner list enterprises: expected 200, got %d", w.Code)
	}

	client.SetEnterprise(fx.EnterpriseID)
	w = client.GET("/api/v1/dashboard")
	if w.Code != 200 {
		t.Errorf("owner dashboard enterprise A: expected 200, got %d", w.Code)
	}

	w = client.GET("/api/v1/reports/sales")
	if w.Code != 200 {
		t.Errorf("owner sales report A: expected 200, got %d", w.Code)
	}

	w = agent.SwitchEnterprise(fx2.EnterpriseID)
	if w.Code != 200 && w.Code != 404 && w.Code != 403 {
		t.Errorf("owner switch to B: expected 200/403/404, got %d", w.Code)
	}

	client.SetEnterprise(fx2.EnterpriseID)
	w = client.GET("/api/v1/dashboard")
	if w.Code != 200 {
		t.Errorf("owner dashboard enterprise B: expected 200, got %d", w.Code)
	}

	w = client.GET("/api/v1/reports/sales")
	if w.Code != 200 {
		t.Errorf("owner sales report B: expected 200, got %d", w.Code)
	}
}
