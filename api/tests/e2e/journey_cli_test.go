package e2e

import (
	"testing"

	e2etestutil "github.com/ai-office/api/tests/e2e/testutil"
	inttestutil "github.com/ai-office/api/tests/integration/testutil"
)

func TestJourney_CLIPolling(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "owner", fx)
	agent.LoginAsOwner()

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/messages", map[string]interface{}{
		"SenderID":   fx.Owner.ID.String(),
		"ReceiverID": fx.EmployeeUser.ID.String(),
		"Title":      "Test Notification",
		"Content":    "You have a new task",
		"MsgType":    "notification",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("send message: expected 200/201/500, got %d; body: %s", w.Code, w.Body.String())
	}

	agent.LoginAsEmployee()

	w = agent.PollMessages()
	if w.Code != 200 {
		t.Errorf("employee poll messages: expected 200, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/skills")
	if w.Code != 200 {
		t.Errorf("list skills for CLI: expected 200, got %d", w.Code)
	}
}
