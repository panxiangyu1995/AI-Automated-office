package e2e

import (
	"testing"

	e2etestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/e2e/testutil"
	inttestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
)

func TestJourney_AgentBusinessFlow(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "owner", fx)
	agent.LoginAsOwner()

	w := agent.CallSkill("dashboard", nil)
	if w.Code != 200 {
		t.Errorf("agent dashboard: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("crm_customer_list", nil)
	if w.Code != 200 {
		t.Errorf("agent customer list: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("contract_list", nil)
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("agent contract list: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("finance_payment_list", nil)
	if w.Code != 200 {
		t.Errorf("agent payment list: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("report_sales", nil)
	if w.Code != 200 {
		t.Errorf("agent sales report: expected 200, got %d", w.Code)
	}
}
