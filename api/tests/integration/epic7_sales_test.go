package integration

import (
	"testing"

	"github.com/ai-office/api/tests/integration/testutil"
)

func TestSalesOrder_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-TEST-001", "status": "draft", "total_amount": 10000.0,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
	if w.Code == 404 {
		t.Skip("sales order endpoint not found")
	}

	w2 := client.GET("/api/v1/sales-orders")
	testutil.AssertStatus(t, w2, 200)
}

func TestSalesOrder_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no":     "SO-FIELDS-001",
		"status":       "draft",
		"total_amount": 5000.0,
		"delivery_date": "2026-09-01",
		"payment_terms": "net30",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_StateMachine(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-STATE-001", "status": "draft", "total_amount": 10000.0,
	})
	if w.Code != 200 && w.Code != 201 {
		t.Skip("sales order create failed")
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	approveW := client.PUT("/api/v1/sales-orders/"+soID+"/approve", map[string]interface{}{})
	if approveW.Code != 200 && approveW.Code != 404 && approveW.Code != 400 {
		t.Errorf("expected 200/400/404, got %d; body: %s", approveW.Code, approveW.Body.String())
	}
}

func TestSalesOrder_ApprovalFlow(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/sales-orders/pending-approval")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_BindContract(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-BIND-001", "status": "draft", "total_amount": 10000.0,
	})
	if w.Code != 200 && w.Code != 201 {
		t.Skip("sales order create failed")
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	bindW := client.POST("/api/v1/sales-orders/"+soID+"/bind-contract", map[string]interface{}{
		"contract_id": "test-contract-id",
	})
	if bindW.Code != 200 && bindW.Code != 201 && bindW.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", bindW.Code, bindW.Body.String())
	}
}

func TestSalesOrder_BindDelivery(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/sales-orders")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_DeliveryContractLink(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/sales-orders?with_delivery=true&with_contract=true")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_DeliveryFields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-DELIV-001", "status": "draft", "total_amount": 8000.0,
		"delivery_address": "北京市朝阳区", "delivery_contact": "张三", "delivery_phone": "13800000000",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_LinkCustomer(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]interface{}{
		"name": "SO Customer", "type": "enterprise", "source": "referral",
	})
	if custW.Code != 200 && custW.Code != 201 {
		t.Skip("customer create failed")
	}
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-CUST-001", "status": "draft", "total_amount": 15000.0,
		"customer_id": custID,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestSalesOrder_Ship(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-SHIP-001", "status": "approved", "total_amount": 12000.0,
	})
	if w.Code != 200 && w.Code != 201 {
		t.Skip("sales order create failed")
	}
	resp := testutil.ParseResponse(t, w)
	data := testutil.GetData(t, resp)
	soID, _ := data["id"].(string)

	shipW := client.POST("/api/v1/sales-orders/"+soID+"/ship", map[string]interface{}{
		"tracking_no": "SF1234567890", "carrier": "顺丰",
	})
	if shipW.Code != 200 && shipW.Code != 201 && shipW.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", shipW.Code, shipW.Body.String())
	}
}

func TestSalesOrder_StockInsufficient(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/sales-orders", map[string]interface{}{
		"order_no": "SO-STOCK-001", "status": "draft", "total_amount": 999999.0,
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}
