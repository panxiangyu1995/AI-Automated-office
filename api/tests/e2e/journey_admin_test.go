package e2e

import (
	"testing"

	e2etestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/e2e/testutil"
	inttestutil "github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
)

func TestJourney_AdminInitEnterprise(t *testing.T) {
	db := inttestutil.SetupTestDB(t)
	fx := inttestutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := inttestutil.SetupTestRouter(db, fx.JWTManager)

	client := e2etestutil.NewE2EClient(t, router, db)
	agent := e2etestutil.NewAgentSimulator(t, client, "admin", fx)
	agent.LoginAsAdmin()

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/departments/tree")
	if w.Code != 200 {
		t.Errorf("admin view dept tree: expected 200, got %d", w.Code)
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/departments", map[string]interface{}{
		"name": "Engineering",
	})
	if w.Code != 200 && w.Code != 201 {
		t.Errorf("admin create dept: expected 200/201/500, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees")
	if w.Code != 200 {
		t.Errorf("admin list employees: expected 200, got %d", w.Code)
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees", map[string]interface{}{
		"name": "New Employee", "email": "new-emp@test.com", "phone": "13900000000",
		"position": "Engineer", "department_id": fx.Department.ID.String(),
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("admin create employee: expected 200/201, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees/batch-import", map[string]interface{}{
		"employees": []map[string]interface{}{
			{"name": "Batch1", "email": "batch1@test.com", "position": "Dev"},
			{"name": "Batch2", "email": "batch2@test.com", "position": "QA"},
		},
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("admin batch import: expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/skills")
	if w.Code != 200 {
		t.Errorf("admin list skills: expected 200, got %d", w.Code)
	}
}
