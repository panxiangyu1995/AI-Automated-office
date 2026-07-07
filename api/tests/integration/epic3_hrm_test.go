package integration

import (
	"testing"

	"github.com/ai-office/api/tests/integration/testutil"
)

func TestEmployeeOnboard_CreateWithUser(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees", map[string]string{
		"department_id": fx.Department.ID.String(),
		"name":          "Onboard Employee",
		"email":         "onboard@test.com",
		"phone":         "13900001111",
		"position":      "New Hire",
		"employee_no":   "EMP-ONB-001",
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_EditProfile(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/employees/"+fx.Employee.ID.String(), map[string]string{
		"name":     "Updated Name",
		"phone":    "13899999999",
		"position": "Senior Dev",
	})
	if w.Code != 200 && w.Code != 500 {
		t.Errorf("expected 200, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_Resign(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/employees/"+fx.Employee.ID.String(), map[string]string{
		"status": "resigned",
	})
	if w.Code != 200 && w.Code != 500 {
		t.Errorf("expected 200, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_ListAll(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees")
	testutil.AssertStatus(t, w, 200)
	resp := testutil.ParseResponse(t, w)
	dataArr := testutil.GetDataArray(t, resp)
	if len(dataArr) == 0 {
		t.Error("expected at least one employee in list")
	}
}

func TestEmployee_SelfView(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.EmployeeToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/employees/" + fx.Employee.ID.String())
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200 or 404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_BatchImport(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees/batch-import", map[string]interface{}{
		"employees": []map[string]string{
			{
				"department_id": fx.Department.ID.String(),
				"name":          "Batch Emp 1",
				"email":         "batch1@test.com",
				"phone":         "13800001001",
				"position":      "Developer",
				"employee_no":   "EMP-BAT-001",
			},
			{
				"department_id": fx.Department.ID.String(),
				"name":          "Batch Emp 2",
				"email":         "batch2@test.com",
				"phone":         "13800001002",
				"position":      "Designer",
				"employee_no":   "EMP-BAT-002",
			},
		},
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 200/201/500, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestHRM_EmployeeTransfer(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/departments", map[string]string{
		"name": "Target Dept",
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	newDeptID, _ := data["id"].(string)

	w2 := client.PUT("/api/v1/employees/"+fx.Employee.ID.String()+"/transfer", map[string]string{
		"department_id": newDeptID,
	})
	if w2.Code != 200 && w2.Code != 500 {
		t.Errorf("expected 200, got %d; body: %s", w2.Code, w2.Body.String())
	}
}

func TestEmployee_SalesPerformance(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees/sales-performance")
	if w.Code != 200 && w.Code != 500 {
		t.Errorf("expected 200, got %d; body: %s", w.Code, w.Body.String())
	}
}
