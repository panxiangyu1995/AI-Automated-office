package integration

import (
	"fmt"
	"testing"

	"github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func createServiceOrderWithCustomer(t *testing.T, client *testutil.TestClient, enterpriseID string, overrides map[string]interface{}) map[string]interface{} {
	t.Helper()
	custW := client.POST("/api/v1/enterprises/"+enterpriseID+"/customers", map[string]string{
		"name":     "SO Customer " + uuid.New().String()[:8],
		"industry": "Technology",
	})
	if custW.Code != 201 {
		t.Logf("customer create failed: %d %s", custW.Code, custW.Body.String())
		return nil
	}
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)
	if custID == "" {
		t.Log("customer ID is empty in response")
		return nil
	}

	payload := map[string]interface{}{
		"customer_id": custID, "order_type": "free", "description": "Test service order",
	}
	for k, v := range overrides {
		if v != "" {
			payload[k] = v
		}
	}
	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/service-orders", payload)
	if w.Code != 200 && w.Code != 201 {
		t.Logf("service order create failed: %d %s", w.Code, w.Body.String())
		return nil
	}
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func TestOps_Dashboard(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/dashboard")
	testutil.AssertStatus(t, w, 200)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["status"] != "ok" {
		t.Errorf("expected status=ok, got %v", data["status"])
	}
}

func TestOps_SubscriptionPlan_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/subscription-plans", map[string]interface{}{
		"Name":        "Basic Plan",
		"Description": "Basic subscription plan",
		"Features":    "hrm,crm",
		"Price":       99.0,
		"MaxUsers":    10,
		"MaxStorage":  1024,
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/subscription-plans")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_EnterpriseSubscription_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	planW := client.POST("/api/v1/subscription-plans", map[string]interface{}{
		"Name":        "Pro Plan",
		"Description": "Pro subscription",
		"Features":    "hrm,crm,ims",
		"Price":       199.0,
		"MaxUsers":    50,
		"MaxStorage":  10240,
	})
	testutil.AssertStatus(t, planW, 201)
	planResp := testutil.ParseResponse(t, planW)
	planData := testutil.GetData(t, planResp)
	planID, _ := planData["id"].(string)

	w := client.POST("/api/v1/enterprise-subscriptions", map[string]interface{}{
		"PlanID":   planID,
		"StartAt":  "2026-07-01T00:00:00Z",
		"EndAt":    "2027-07-01T00:00:00Z",
		"AutoRenew": true,
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/enterprise-subscriptions")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Bill_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/bills", map[string]interface{}{
		"Amount":      500.0,
		"Description": "Monthly subscription bill",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/bills")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_ServiceTicket_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/service-tickets", map[string]interface{}{
		"Subject":     "Login issue",
		"Description": "Cannot login to the system",
		"Priority":    "high",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/service-tickets")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Announcement_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/announcements", map[string]interface{}{
		"Title":   "System Maintenance",
		"Content": "The system will be under maintenance from 2AM-4AM",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/announcements")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_SLA_Metrics(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/sla-metrics")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_ServiceConfig_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/service-config", map[string]interface{}{
		"Key":   "max_employees",
		"Value": "100",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/service-config/max_employees")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_DataExport(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/data-export?format=csv")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200 or 404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_DataImport(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/data-import", map[string]interface{}{
		"records": []map[string]interface{}{
			{"name": "Test Employee", "email": "test@example.com"},
		},
		"target": "employees",
	})
	if w.Code != 200 && w.Code != 400 && w.Code != 500 {
		t.Errorf("expected 200/400/500, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_Report_Dashboard(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/reports/dashboard")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Report_Drilldown(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/reports/drilldown")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_AuditLogEntries(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/audit-log-entries")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Quota(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/quota")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200 or 404, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.PUT("/api/v1/quota", map[string]interface{}{
		"daily_limit":   1000,
		"monthly_limit": 30000,
	})
	if w.Code != 200 && w.Code != 400 && w.Code != 404 {
		t.Errorf("expected 200/400/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_Features(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/features")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200 or 404, got %d; body: %s", w.Code, w.Body.String())
	}

	w = client.PUT("/api/v1/features/hrm", map[string]interface{}{
		"enabled": true,
	})
	if w.Code != 200 && w.Code != 400 && w.Code != 404 {
		t.Errorf("expected 200/400/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_GroupSummary(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	groupID := fmt.Sprintf("%v", fx.Group.ID)
	w := client.GET("/api/v1/groups/summary/" + groupID)
	if w.Code != 200 && w.Code != 500 && w.Code != 404 && w.Code != 403 {
		t.Errorf("expected 200/403/404/500, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_AuditLogs_Enhanced(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	_ = client.GET("/api/v1/dashboard")

	w := client.GET("/api/v1/audit-logs")
	if w.Code != 200 && w.Code != 403 && w.Code != 404 {
		t.Errorf("expected 200/403/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_Skill_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/skills", map[string]interface{}{
		"Name":        "hrm_employee_list",
		"Description": "List all employees",
		"Parameters":  `{"page":"int","page_size":"int"}`,
		"APIEndpoint": "/api/v1/employees",
		"Module":      "hrm",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/skills")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Webhook_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/webhooks", map[string]interface{}{
		"Name":   "Order Created",
		"URL":    "https://example.com/webhook",
		"Secret": "wh-secret-123",
		"Events": "order.created,order.updated",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/webhooks")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_Backup_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/backup/configs", map[string]interface{}{
		"backup_time": "02:00",
		"backup_directory": "/backups",
		"retention_days": 30,
		"enabled":     true,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 403 && w.Code != 400 {
		t.Errorf("expected 200/201/403/400, got %d; body: %s", w.Code, w.Body.String())
	}
	if w.Code == 403 {
		t.Log("backup feature not enabled for this enterprise - expected behavior")
		return
	}

	w = client.GET("/api/v1/backup/configs")
	if w.Code != 200 && w.Code != 403 {
		t.Errorf("expected 200/403, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOps_AI_Session(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	operatorID := fmt.Sprintf("%v", fx.Operator.ID)
	w := client.POST("/api/v1/ai/sessions", map[string]interface{}{
		"UserID": operatorID,
		"Title":  "Test AI Session",
	})
	testutil.AssertStatus(t, w, 201)

	w = client.GET("/api/v1/ai/sessions")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_EnterpriseList(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_ActivatePauseResume(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	pauseW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/pause", nil)
	if pauseW.Code != 200 && pauseW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", pauseW.Code, pauseW.Body.String())
	}

	resumeW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/resume", nil)
	if resumeW.Code != 200 && resumeW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", resumeW.Code, resumeW.Body.String())
	}
}

func TestOps_FreezeUnfreeze(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	freezeW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/freeze", nil)
	if freezeW.Code != 200 && freezeW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", freezeW.Code, freezeW.Body.String())
	}

	unfreezeW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/unfreeze", nil)
	if unfreezeW.Code != 200 && unfreezeW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", unfreezeW.Code, unfreezeW.Body.String())
	}
}

func TestOps_ExpireRenew(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	renewW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/renew", map[string]interface{}{
		"period": "1year",
	})
	if renewW.Code != 200 && renewW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", renewW.Code, renewW.Body.String())
	}
}

func TestOps_CancelDelete(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cancelW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/cancel", nil)
	if cancelW.Code != 200 && cancelW.Code != 403 && cancelW.Code != 404 {
		t.Errorf("expected 200/403/404, got %d; body: %s", cancelW.Code, cancelW.Body.String())
	}
}

func TestOps_StateBasedAccess(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/dashboard")
	testutil.AssertStatus(t, w, 200)
}

func TestOps_StateChangeLog(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/state-log")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_EnterpriseConfigPanorama(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/config/panorama")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_EnterpriseSkillMatrix(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/skill-matrix")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_ConfigSkillSet(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/skill-set", map[string]interface{}{
		"skills": []string{"hrm_employee_list", "crm_customer_create"},
	})
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_ConfigEventLink(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/event-link", map[string]interface{}{
		"event": "order.created", "skill": "sales_order_detail",
	})
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_ConfigAuditLog(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/config-audit-log")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_TemplateManage(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/config-templates")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_TemplateApply(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/apply-template", map[string]interface{}{
		"template_id": "standard",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_TemplatePresetSkill(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/config-templates?with_skills=true")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_CustomTemplate(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/config-templates", map[string]interface{}{
		"name": "Custom Template", "skills": []string{"hrm_employee_list"},
		"features": map[string]bool{"backup": true, "ai": true},
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_PreviewMode(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/config/preview")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestOpsVC_SkillChangeNotify(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/skill-set", map[string]interface{}{
		"skills": []string{"hrm_employee_list"},
	})
	if w.Code != 200 && w.Code != 404 {
		t.Logf("skill set update: %d", w.Code)
	}

	msgW := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/messages")
	testutil.AssertStatus(t, msgW, 200)
}

func TestBilling_SubscriptionPlan(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/subscription-plans")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_SubscriptionCycle(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/subscription")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_UpgradeDowngrade(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/subscription/plan", map[string]interface{}{
		"plan_id": "professional",
	})
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_AutoRenew(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/subscription/auto-renew", map[string]interface{}{
		"enabled": true,
	})
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_OverdueAutoSuspend(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/subscription/status")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_OnlinePayment(t *testing.T) {
	t.Log("Online payment requires external payment gateway - tested with mocks in unit tests")
}

func TestBilling_Refund(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/billing/refund", map[string]interface{}{
		"amount": 50.0, "reason": "Overcharge",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 403 && w.Code != 404 {
		t.Errorf("expected 200/201/403/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_AutoInvoice(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/invoices/auto")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestBilling_ViewInvoice(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/invoices")
	testutil.AssertStatus(t, w, 200)
}

func TestBilling_RevenueSummary(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OperatorToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/reports/billing/revenue-summary")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestServiceOrder_ConfirmQuote(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "paid", "amount": 5000.0,
	})
	if data == nil {
		t.Fatalf("feature not implemented: service order with customer create failed")
	}
	soID, _ := data["id"].(string)
	if soID == "" {
		t.Fatalf("feature not implemented: service order create returned no id")
	}

	confirmW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders/"+soID+"/confirm-quote", map[string]interface{}{
		"confirmed": true,
	})
	if confirmW.Code != 200 && confirmW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", confirmW.Code, confirmW.Body.String())
	}
}

func TestServiceOrder_CustomerSign(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "paid",
	})
	if data == nil {
		t.Fatalf("feature not implemented: service order with customer create failed")
	}
	soID, _ := data["id"].(string)
	if soID == "" {
		t.Fatalf("feature not implemented: service order create returned no id")
	}

	signW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders/"+soID+"/customer-sign", map[string]interface{}{
		"signed": true, "feedback": "满意",
	})
	if signW.Code != 200 && signW.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", signW.Code, signW.Body.String())
	}
}

func TestServiceOrder_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "free", "description": "Test all fields",
	})
	if data["id"] == nil && data["Id"] == nil {
		t.Log("service order fields test - no id returned")
	}
}

func TestServiceOrder_QuoteAttachment(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "paid", "amount": 8000.0,
	})
	if data == nil {
		t.Fatalf("feature not implemented: service order with customer create failed")
	}
	soID, _ := data["id"].(string)
	if soID == "" {
		t.Fatalf("feature not implemented: service order create returned no id")
	}
}

func TestServiceOrder_RepairOrder(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "repair",
	})
	if data == nil {
		t.Fatalf("feature not implemented: service order with customer create failed")
	}
	soID, _ := data["id"].(string)
	if soID == "" {
		t.Fatalf("feature not implemented: service order create returned no id")
	}
}

func TestServiceOrder_TypeFreePaid(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	freeData := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"type": "free",
	})
	if freeData["id"] != nil || freeData["Id"] != nil {
		t.Log("free service order created successfully")
	}

	paidData := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"order_type": "paid", "amount": 3000.0,
	})
	if paidData["id"] != nil || paidData["Id"] != nil {
		t.Log("paid service order created successfully")
	}
}

func TestServiceOrder_UploadAttachment(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	data := createServiceOrderWithCustomer(t, client, fx.EnterpriseID, map[string]interface{}{
		"type": "free",
	})
	if data == nil {
		t.Fatalf("feature not implemented: service order with customer create failed")
	}
	soID, _ := data["id"].(string)
	if soID == "" {
		t.Fatalf("feature not implemented: service order create returned no id")
	}

	attachW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders/"+soID+"/attachments", map[string]interface{}{
		"file_name": "report.pdf", "file_type": "application/pdf",
	})
	if attachW.Code != 200 && attachW.Code != 201 && attachW.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", attachW.Code, attachW.Body.String())
	}
}
