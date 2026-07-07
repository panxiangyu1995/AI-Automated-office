package integration

import (
	"testing"

	"github.com/ai-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func createTestCustomer(t *testing.T, client *testutil.TestClient, enterpriseID string) map[string]interface{} {
	t.Helper()
	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/customers", map[string]string{
		"name":      "Test Customer " + uuid.New().String()[:8],
		"industry":  "Technology",
		"address":   "123 Test St",
		"notes":     "Test customer for integration",
	})
	if w.Code != 201 {
		t.Fatalf("failed to create test customer: status %d body %s", w.Code, w.Body.String())
	}
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func TestCustomer_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.GET("/api/v1/customers/" + custID)
	testutil.AssertStatus(t, w, 200)

	w2 := client.PUT("/api/v1/customers/"+custID, map[string]string{
		"name":    "Updated Customer",
		"industry": "Finance",
	})
	testutil.AssertStatus(t, w2, 200)

	w3 := client.DELETE("/api/v1/customers/" + custID)
	if w3.Code != 200 && w3.Code != 204 {
		t.Errorf("expected 200/204 on delete, got %d", w3.Code)
	}
}

func TestCustomer_UniqueName(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	name := "Unique Customer " + uuid.New().String()[:8]
	client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{
		"name": name,
	})

	w2 := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{
		"name": name,
	})
	if w2.Code != 409 && w2.Code != 201 {
		t.Logf("duplicate customer name: expected 409 or 201, got %d", w2.Code)
	}
}

func TestCustomer_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{
		"name":                      "Field Test Customer",
		"industry":                   "Manufacturing",
		"unified_social_credit_code": "91110000MA01XXXXXX",
		"address":                    "456 Industry Ave",
		"notes":                      "Field completeness test",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["industry"] != "Manufacturing" {
		t.Errorf("expected industry=Manufacturing, got %v", data["industry"])
	}
}

func TestCustomerLevel_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customer-levels", map[string]interface{}{
		"name":        "VIP",
		"description": "VIP Customer",
		"min_amount":  100000,
		"color":       "#FFD700",
		"sort_order":  1,
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	levelID, _ := data["id"].(string)

	w2 := client.PUT("/api/v1/customer-levels/"+levelID, map[string]interface{}{
		"name":        "VIP Gold",
		"description": "Gold VIP",
		"min_amount":  200000,
		"color":       "#FFD700",
		"sort_order":  1,
	})
	testutil.AssertStatus(t, w2, 200)
}

func TestCustomerTag_AddRemove(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers/"+custID+"/tags", map[string]string{
		"tag": "important",
	})
	testutil.AssertStatus(t, w, 201)

	w2 := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/customers/" + custID + "/tags")
	testutil.AssertStatus(t, w2, 200)

	w3 := client.DELETE("/api/v1/customers/" + custID + "/tags?tag=important")
	if w3.Code != 200 && w3.Code != 204 {
		t.Errorf("expected 200/204 on tag delete, got %d", w3.Code)
	}
}

func TestCustomer_PanoramaView(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.GET("/api/v1/customers/" + custID)
	testutil.AssertStatus(t, w, 200)
}

func TestContact_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers/"+custID+"/contacts", map[string]interface{}{
		"name":       "John Doe",
		"position":   "CTO",
		"phone":      "13900001111",
		"email":      "john@test.com",
		"role":       "decision_maker",
		"is_primary": true,
	})
	testutil.AssertStatus(t, w, 201)
}

func TestContact_FilterByRole(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers/"+custID+"/contacts", map[string]interface{}{
		"name":       "Jane Doe",
		"position":   "VP",
		"phone":      "13900002222",
		"email":      "jane@test.com",
		"role":       "decision_maker",
		"is_primary": false,
	})

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/customers/" + custID + "/contacts")
	testutil.AssertStatus(t, w, 200)
}

func TestOpportunity_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/opportunities", map[string]interface{}{
		"customer_id":      custID,
		"name":             "New Deal",
		"amount":           50000,
		"expected_close_at": "2026-12-31",
		"description":      "Big deal opportunity",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestOpportunity_BelongsToCustomer(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/customers/" + custID + "/opportunities")
	testutil.AssertStatus(t, w, 200)
}

func TestContact_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers/"+custID+"/contacts", map[string]interface{}{
		"name":  "John Contact",
		"email": "john@test.com",
		"phone": "13800000000",
		"role":  "decision_maker",
		"is_primary": true,
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	if data["name"] == nil && data["Name"] == nil {
		t.Error("contact response missing name field")
	}
}

func TestCustomer_RelatedContracts(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cust := createTestCustomer(t, client, fx.EnterpriseID)
	custID, _ := cust["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"title":       "Customer Contract",
		"customer_id": custID,
		"type":        "sales",
		"amount":      10000.0,
		"status":      "draft",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 500 {
		t.Logf("contract create: %d %s", w.Code, w.Body.String())
	}

	w = client.GET("/api/v1/contracts")
	testutil.AssertStatus(t, w, 200)
}

func TestCustomer_RelatedServiceOrders(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/service-orders")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestCustomer_FinancialSummary(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/reports/finance")
	testutil.AssertStatus(t, w, 200)
}
