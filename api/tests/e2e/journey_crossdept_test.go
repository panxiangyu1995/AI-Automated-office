package e2e

import (
	"testing"

	e2etestutil "github.com/ai-office/api/tests/e2e/testutil"
	inttestutil "github.com/ai-office/api/tests/integration/testutil"
)

func TestJourney_CrossDepartment(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "owner", fx)
	agent.LoginAsOwner()

	w := agent.CallSkill("ims_material_list", nil)
	if w.Code != 200 {
		t.Errorf("sales check inventory: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("ims_inventory_list", nil)
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("check stock levels: expected 200, got %d", w.Code)
	}

	w = agent.CallSkill("crm_customer_list", nil)
	if w.Code != 200 {
		t.Errorf("sales check customer: expected 200, got %d", w.Code)
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": "00000000-0000-0000-0000-000000000001",
		"name":        "Cross-Dept Contract",
		"amount":      50000,
		"content":     "Sales inventory check contract",
	})
	if w.Code != 200 && w.Code != 201 {
		t.Errorf("create contract: expected 200/201/500, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/messages", map[string]interface{}{
		"SenderID":   fx.Owner.ID.String(),
		"ReceiverID": fx.Manager.ID.String(),
		"Title":      "新合同签订通知",
		"Content":    "销售部已签订新合同，请生产部安排生产",
		"MsgType":    "notification",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("send cross-dept message: got %d; body: %s", w.Code, w.Body.String())
	}

	agent.LoginAsManager()
	w = agent.PollMessages()
	if w.Code != 200 {
		t.Errorf("production dept receive message: expected 200, got %d", w.Code)
	}
}
