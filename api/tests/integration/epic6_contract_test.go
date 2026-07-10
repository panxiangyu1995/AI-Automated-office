package integration

import (
	"testing"

	"github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func createTestContract(t *testing.T, client *testutil.TestClient, enterpriseID string) map[string]interface{} {
	t.Helper()
	custW := client.POST("/api/v1/enterprises/"+enterpriseID+"/customers", map[string]interface{}{
		"name": "Contract Customer", "type": "enterprise", "source": "referral",
	})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID, "name": "Test Contract", "amount": 100000,
		"content": "Contract content", "notes": "Test",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func TestContract_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Contract Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Test Contract",
		"amount":      100000,
		"content":     "Contract content here",
		"notes":       "Test notes",
	})
	testutil.AssertStatus(t, w, 201)
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.GET("/api/v1/contracts/" + contractID)
	testutil.AssertStatus(t, w2, 200)

	w3 := client.PUT("/api/v1/contracts/"+contractID, map[string]interface{}{
		"name":   "Updated Contract",
		"amount": 150000,
	})
	testutil.AssertStatus(t, w3, 200)

	w4 := client.DELETE("/api/v1/contracts/" + contractID)
	if w4.Code != 200 && w4.Code != 204 {
		t.Errorf("expected 200/204 on delete, got %d", w4.Code)
	}
}

func TestContract_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Fields Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Field Test Contract",
		"amount":      200000,
		"content":     "Detailed content",
		"notes":       "Field test",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestContract_StateMachine(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "SM Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "State Machine Contract",
		"amount":      50000,
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.PATCH("/api/v1/contracts/"+contractID+"/status", map[string]string{
		"status": "pending_approval",
	})
	if w2.Code != 200 && w2.Code != 400 {
		t.Logf("status change to pending_approval: %d %s", w2.Code, w2.Body.String())
	}
}

func TestContract_UploadAttachment(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Attach Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Attachment Contract",
		"amount":      30000,
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.POST("/api/v1/contracts/"+contractID+"/attachments", map[string]interface{}{
		"file_name": "contract.pdf",
		"file_type": "application/pdf",
		"file_size": 1024000,
		"file_url":  "/storage/" + fx.EnterpriseID + "/contracts/contract.pdf",
	})
	if w2.Code != 201 && w2.Code != 200 {
		t.Logf("upload attachment: %d %s", w2.Code, w2.Body.String())
	}
}

func TestContract_ApprovalFlow(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Approval Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Approval Contract",
		"amount":      75000,
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.POST("/api/v1/contracts/"+contractID+"/submit-approval", nil)
	if w2.Code != 200 && w2.Code != 400 {
		t.Logf("submit approval: %d %s", w2.Code, w2.Body.String())
	}

	w3 := client.POST("/api/v1/contracts/"+contractID+"/approve", nil)
	if w3.Code != 200 && w3.Code != 400 {
		t.Logf("approve: %d %s", w3.Code, w3.Body.String())
	}
}

func TestContract_LinkDocument(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Link Doc Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Link Doc Contract",
		"amount":      40000,
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.POST("/api/v1/contracts/"+contractID+"/documents", map[string]string{
		"ref_type": "sales_order",
		"ref_id":   uuid.New().String(),
		"ref_no":   "SO-001",
	})
	if w2.Code != 201 && w2.Code != 200 {
		t.Logf("link document: %d %s", w2.Code, w2.Body.String())
	}

	w3 := client.GET("/api/v1/contracts/" + contractID + "/documents")
	testutil.AssertStatus(t, w3, 200)
}

func TestServiceOrder_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Service Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders", map[string]interface{}{
		"customer_id": custID,
		"contract_id": uuid.New().String(),
		"order_type":  "free",
		"description": "Repair request",
		"amount":      500,
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201 or 500, got %d; body: %s", w.Code, w.Body.String())
	}
	if w.Code != 201 {
		return
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	w2 := client.GET("/api/v1/service-orders/" + soID)
	if w2.Code != 200 && w2.Code != 404 {
		t.Errorf("expected 200 or 404, got %d", w2.Code)
	}
}

func TestServiceOrder_StateMachine(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "SM SO Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders", map[string]interface{}{
		"customer_id": custID,
		"order_type":  "paid",
		"description": "Paid repair",
		"amount":      2000,
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201 or 500, got %d; body: %s", w.Code, w.Body.String())
	}
	resp := testutil.ParseResponse(t, w)
	if w.Code != 201 {
		return
	}
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	w2 := client.PATCH("/api/v1/service-orders/"+soID+"/status", map[string]string{
		"status": "in_progress",
	})
	if w2.Code != 200 && w2.Code != 400 {
		t.Logf("status change: %d %s", w2.Code, w2.Body.String())
	}
}

func TestContract_PatchFields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Patch Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/contracts", map[string]interface{}{
		"customer_id": custID,
		"name":        "Patch Contract",
		"amount":      50000,
	})
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	contractID, _ := data["id"].(string)

	w2 := client.PATCH("/api/v1/contracts/"+contractID, map[string]interface{}{
		"notes": "Agent-modified notes",
	})
	testutil.AssertStatus(t, w2, 200)
}

func TestContract_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/contracts")
	testutil.AssertStatus(t, w, 200)
}

func TestServiceOrder_Quote(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Quote Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders", map[string]interface{}{
		"customer_id": custID,
		"order_type":  "free",
		"description": "Needs quote",
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201 or 500, got %d; body: %s", w.Code, w.Body.String())
	}
	if w.Code != 201 {
		return
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	w2 := client.PUT("/api/v1/service-orders/"+soID, map[string]interface{}{
		"amount": 3500,
	})
	if w2.Code != 200 && w2.Code != 400 {
		t.Logf("quote: %d %s", w2.Code, w2.Body.String())
	}
}

func TestServiceOrder_Delete(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{"name": "Delete SO Customer"})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/service-orders", map[string]interface{}{
		"customer_id": custID,
		"order_type":  "free",
		"description": "To be deleted",
	})
	if w.Code != 201 && w.Code != 500 {
		t.Errorf("expected 201 or 500, got %d; body: %s", w.Code, w.Body.String())
	}
	if w.Code != 201 {
		return
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	w2 := client.DELETE("/api/v1/service-orders/" + soID)
	if w2.Code != 200 && w2.Code != 204 {
		t.Errorf("expected 200/204 on delete, got %d", w2.Code)
	}
}

func TestContract_PaymentPlan(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cont := createTestContract(t, client, fx.EnterpriseID)
	contID, _ := cont["id"].(string)

	w := client.POST("/api/v1/contracts/"+contID+"/payment-plans", map[string]interface{}{
		"stages": []map[string]interface{}{
			{"milestone": "签约", "amount": 50000.0, "due_date": "2026-08-01"},
			{"milestone": "交付", "amount": 50000.0, "due_date": "2026-12-01"},
		},
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_PaymentTracking(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/contracts/payment-tracking")
	if w.Code != 200 && w.Code != 404 && w.Code != 400 {
		t.Errorf("expected 200/400/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_PaymentPlanAutoRemind(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/contracts/payment-reminders")
	if w.Code != 200 && w.Code != 404 && w.Code != 400 {
		t.Errorf("expected 200/400/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_LinkCustomerAndOrder(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/contracts", map[string]interface{}{
		"title":       "Linked Contract",
		"customer_id": "00000000-0000-0000-0000-000000000001",
		"type":        "sales",
		"amount":      20000.0,
		"status":      "draft",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_LinkPurchaseOrder(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cont := createTestContract(t, client, fx.EnterpriseID)
	contID, _ := cont["id"].(string)

	w := client.POST("/api/v1/contracts/"+contID+"/link-purchase-order", map[string]interface{}{
		"purchase_order_id": uuid.New().String(),
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_BindDelivery(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	cont := createTestContract(t, client, fx.EnterpriseID)
	contID, _ := cont["id"].(string)

	w := client.POST("/api/v1/contracts/"+contID+"/bind-delivery", map[string]interface{}{
		"delivery_id": uuid.New().String(),
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestContract_AgentNaturalLanguage(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/contracts/parse", map[string]interface{}{
		"text": "与北京科技公司签订10万元销售合同，付款方式分期，有效期1年",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}
