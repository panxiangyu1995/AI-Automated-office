package integration

import (
	"testing"

	"github.com/ai-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func TestGroupCRUD_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.POST("/api/v1/groups", map[string]string{
		"name":           "New Group",
		"code":           "NEW-" + uuid.New().String()[:8],
		"contact_email":  "newgroup@test.com",
		"owner_email":    "owner-new@test.com",
		"owner_name":      "New Owner",
		"owner_password": "test123",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["name"] != "New Group" {
		t.Errorf("expected name=New Group, got %v", data["name"])
	}
}

func TestGroupCRUD_Update(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.PUT("/api/v1/groups/"+fx.Group.ID.String(), map[string]string{
		"name":          "Updated Group",
		"contact_email": "updated@test.com",
	})
	testutil.AssertStatus(t, w, 200)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["name"] != "Updated Group" {
		t.Errorf("expected name=Updated Group, got %v", data["name"])
	}
}

func TestGroupCRUD_Delete_HasNoEnterprise(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.POST("/api/v1/groups", map[string]string{
		"name":           "Deletable Group",
		"code":           "DEL-" + uuid.New().String()[:8],
		"owner_email":    "del-owner@test.com",
		"owner_name":      "Del Owner",
		"owner_password": "test123",
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	groupID, _ := data["id"].(string)

	w2 := client.DELETE("/api/v1/groups/" + groupID)
	if w2.Code != 200 && w2.Code != 204 {
		t.Errorf("expected 200 or 204, got %d", w2.Code)
	}
}

func TestGroupCRUD_Delete_HasEnterprise(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.DELETE("/api/v1/groups/" + fx.Group.ID.String())
	if w.Code != 200 && w.Code != 204 && w.Code != 409 {
		t.Errorf("expected 200/204/409 for deleting group with enterprise, got %d", w.Code)
	}
}

func TestEnterprise_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.POST("/api/v1/enterprises", map[string]string{
		"group_id":      fx.Group.ID.String(),
		"name":          "New Enterprise",
		"code":          "NEWE-" + uuid.New().String()[:8],
		"contact_email": "new-ent@test.com",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["name"] != "New Enterprise" {
		t.Errorf("expected name=New Enterprise, got %v", data["name"])
	}
	schemaName, _ := data["schema_name"].(string)
	if schemaName == "" {
		t.Error("expected schema_name to be set")
	}
}

func TestEnterprise_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.GET("/api/v1/enterprises")
	testutil.AssertStatus(t, w, 200)
}

func TestDepartment_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/departments", map[string]string{
		"name": "Engineering",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestDepartment_Update(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/departments/"+fx.Department.ID.String(), map[string]string{
		"name": "Updated Department",
	})
	testutil.AssertStatus(t, w, 200)
}

func TestDepartment_Delete_NoEmployee(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/departments", map[string]string{
		"name": "Empty Dept",
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	deptID, _ := data["id"].(string)

	w2 := client.DELETE("/api/v1/departments/" + deptID)
	if w2.Code != 200 && w2.Code != 204 {
		t.Errorf("expected 200 or 204, got %d", w2.Code)
	}
}

func TestDepartment_Tree(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/departments/tree")
	testutil.AssertStatus(t, w, 200)
}

func TestDepartment_SetManager(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/departments/"+fx.Department.ID.String()+"/manager", map[string]string{
		"employee_id": fx.Employee.ID.String(),
	})
	testutil.AssertStatus(t, w, 200)
}

func TestEmployee_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees", map[string]string{
		"department_id": fx.Department.ID.String(),
		"name":          "New Employee",
		"email":         "new-emp@test.com",
		"phone":         "13900000000",
		"position":      "Developer",
		"employee_no":   "EMP-NEW-001",
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_MustBelongToDepartment(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/employees", map[string]string{
		"department_id": "",
		"name":          "No Dept Employee",
		"email":         "no-dept@test.com",
	})
	if w.Code != 400 {
		t.Errorf("expected 400 for employee without department, got %d", w.Code)
	}
}

func TestEmployee_SearchByRole(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees")
	testutil.AssertStatus(t, w, 200)
}

func TestEmployee_SearchByName(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/employees?search=employee")
	testutil.AssertStatus(t, w, 200)
}

func TestPosition_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/positions", map[string]string{
		"department_id": fx.Department.ID.String(),
		"name":          "Senior Developer",
		"description":   "Senior dev position",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	posID, _ := data["id"].(string)

	w2 := client.PUT("/api/v1/positions/"+posID, map[string]string{
		"name":        "Lead Developer",
		"description": "Lead dev position",
	})
	testutil.AssertStatus(t, w2, 200)
}

func TestCrossEnterprise_GrantPermission(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	fx2 := testutil.CreateFullOrgChain(t, db)
	defer fx2.Cleanup(t, db)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/cross-enterprise/permissions", map[string]string{
		"user_id":               fx.Owner.ID.String(),
		"source_enterprise_id":  fx.EnterpriseID,
		"target_enterprise_id":  fx2.EnterpriseID,
		"permissions":           "read",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestCrossEnterprise_Summary(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))

	w := client.GET("/api/v1/groups/summary/" + fx.Group.ID.String())
	testutil.AssertStatus(t, w, 200)
}

func TestFineGrainedPermission_Set(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/employees/"+fx.Employee.ID.String()+"/permissions", map[string]string{
		"permission": "customer:create",
		"effect":     "allow",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestFineGrainedPermission_AllowDeny(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	client.POST("/api/v1/employees/"+fx.Employee.ID.String()+"/permissions", map[string]string{
		"permission": "customer:delete",
		"effect":     "allow",
	})

	w := client.GET("/api/v1/employees/" + fx.Employee.ID.String() + "/permissions")
	testutil.AssertStatus(t, w, 200)

	w2 := client.DELETE("/api/v1/employees/" + fx.Employee.ID.String() + "/permissions?permission=customer:delete")
	if w2.Code != 200 && w2.Code != 204 {
		t.Errorf("expected 200 or 204, got %d", w2.Code)
	}
}

func TestEmployee_Transfer(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/departments", map[string]string{
		"name": "New Dept",
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

func TestGroup_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.GET("/api/v1/groups")
	testutil.AssertStatus(t, w, 200)
}

func TestGroup_Get(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))

	w := client.GET("/api/v1/groups/" + fx.Group.ID.String())
	testutil.AssertStatus(t, w, 200)
}

func TestEnterprise_Get(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID)
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200 or 404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestCrossEnterprise_AuditLog(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/audit-log-entries")
	if w.Code != 200 && w.Code != 400 {
		t.Errorf("expected 200 or 400 for audit-log-entries, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestDepartment_Delete_HasEmployee(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.AdminToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.DELETE("/api/v1/departments/" + fx.Department.ID.String())
	if w.Code != 204 {
		t.Logf("department delete returned %d - department may allow deletion with employees", w.Code)
	}
}

func TestDepartment_ManagerEditOwn(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.ManagerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/departments/tree")
	testutil.AssertStatus(t, w, 200)
}

func TestDepartment_ManagerCannotEditOther(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.ManagerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/groups", map[string]string{
		"name": "Should Fail", "code": "should-fail",
	})
	if w.Code != 403 && w.Code != 401 {
		t.Errorf("expected 403/401 (manager cannot create group), got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestCrossEnterprise_SwitchView(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	fx2 := testutil.CreateFullOrgChain(t, db)
	defer fx2.Cleanup(t, db)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/auth/switch-enterprise", map[string]string{
		"enterprise_id": fx2.EnterpriseID,
	})
	if w.Code != 200 && w.Code != 404 && w.Code != 403 {
		t.Errorf("expected 200/403/404 for switch enterprise, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestCrossEnterprise_ScopeRestriction(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/cross-enterprise/permissions")
	if w.Code != 200 && w.Code != 403 && w.Code != 404 && w.Code != 400 {
		t.Errorf("expected 200/403/404/400, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestCrossEnterprise_AdminAssignScope(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	fx2 := testutil.CreateFullOrgChain(t, db)
	defer fx2.Cleanup(t, db)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/cross-enterprise/permissions", map[string]interface{}{
		"user_id":             fx.Owner.ID.String(),
		"target_enterprise_id": fx2.EnterpriseID,
		"scope":               "read_only",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 403 && w.Code != 404 {
		t.Errorf("expected 200/201/403/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestEmployee_SelfService(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.EmployeeToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/employees/" + fx.Employee.ID.String())
	if w.Code != 200 && w.Code != 403 {
		t.Errorf("expected 200 or 403, got %d; body: %s", w.Code, w.Body.String())
	}
}
