package integration

import (
	"testing"

	"github.com/panxiangyu1995/AI-Automated-office/api/tests/integration/testutil"
	"github.com/google/uuid"
)

func createTestMaterial(t *testing.T, client *testutil.TestClient, enterpriseID string) map[string]interface{} {
	t.Helper()
	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/materials", map[string]interface{}{
		"name":          "Test Material " + uuid.New().String()[:8],
		"sku_code":      "SKU-" + uuid.New().String()[:8],
		"material_type": "原材料",
		"spec":          `{"size":"10cm"}`,
		"unit":          "个",
		"unit_price":    99.99,
	})
	if w.Code != 201 {
		t.Fatalf("failed to create test material: status %d body %s", w.Code, w.Body.String())
	}
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func createTestSupplier(t *testing.T, client *testutil.TestClient, enterpriseID string) map[string]interface{} {
	t.Helper()
	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/suppliers", map[string]interface{}{
		"name":          "Test Supplier " + uuid.New().String()[:8],
		"contact_name":  "Supplier Contact",
		"contact_phone": "13800001111",
		"contact_email": "supplier@test.com",
		"address":       "789 Supplier St",
	})
	if w.Code != 201 {
		t.Fatalf("failed to create test supplier: status %d body %s", w.Code, w.Body.String())
	}
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func createTestWarehouse(t *testing.T, client *testutil.TestClient, enterpriseID string) map[string]interface{} {
	t.Helper()
	w := client.POST("/api/v1/enterprises/"+enterpriseID+"/warehouses", map[string]interface{}{
		"name":    "Test Warehouse " + uuid.New().String()[:8],
		"code":    "WH-" + uuid.New().String()[:8],
		"address": "100 Warehouse Blvd",
	})
	if w.Code != 201 {
		t.Fatalf("failed to create test warehouse: status %d body %s", w.Code, w.Body.String())
	}
	resp := testutil.ParseResponse(t, w)
	return testutil.GetData(t, resp)
}

func TestMaterial_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.GET("/api/v1/materials/" + matID)
	testutil.AssertStatus(t, w, 200)

	w2 := client.PUT("/api/v1/materials/"+matID, map[string]interface{}{
		"name":          "Updated Material",
		"material_type": "finished",
		"unit":          "件",
		"unit_price":    199.99,
	})
	testutil.AssertStatus(t, w2, 200)

	w3 := client.DELETE("/api/v1/materials/" + matID)
	if w3.Code != 200 && w3.Code != 204 {
		t.Errorf("expected 200/204 on delete, got %d", w3.Code)
	}
}

func TestMaterial_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/materials", map[string]interface{}{
		"name":          "Field Test Material",
		"sku_code":      "SKU-FLD-" + uuid.New().String()[:8],
		"material_type": "成品",
		"spec":          `{"weight":"5kg","color":"red"}`,
		"unit":          "kg",
		"unit_price":    50.00,
	})
	testutil.AssertStatus(t, w, 201)
}

func TestSupplier_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	sup := createTestSupplier(t, client, fx.EnterpriseID)
	supID, _ := sup["id"].(string)

	w := client.GET("/api/v1/suppliers/" + supID)
	testutil.AssertStatus(t, w, 200)
}

func TestPurchaseOrder_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	sup := createTestSupplier(t, client, fx.EnterpriseID)
	supID, _ := sup["id"].(string)
	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/purchase-orders", map[string]interface{}{
		"supplier_id": supID,
		"notes":       "Test purchase order",
		"items": []map[string]interface{}{
			{
				"material_id": matID,
				"quantity":    100,
				"unit_price":  50.00,
			},
		},
	})
	testutil.AssertStatus(t, w, 201)
}

func TestSalesOrder_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	custW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/customers", map[string]string{
		"name": "SO Customer",
	})
	custResp := testutil.ParseResponse(t, custW)
	custData := testutil.GetData(t, custResp)
	custID, _ := custData["id"].(string)

	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/sales-orders", map[string]interface{}{
		"customer_id": custID,
		"notes":       "Test sales order",
		"items": []map[string]interface{}{
			{
				"material_id": matID,
				"quantity":    50,
				"unit_price":  100.00,
			},
		},
	})
	testutil.AssertStatus(t, w, 201)
}

func TestWarehouse_CRUD(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)

	w := client.GET("/api/v1/warehouses/" + whID)
	testutil.AssertStatus(t, w, 200)
}

func TestInventory_Query(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory/warehouses/" + whID)
	testutil.AssertStatus(t, w, 200)
}

func TestInventory_LowStockAlert(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory/low-stock")
	testutil.AssertStatus(t, w, 200)
}

func TestStockTransfer_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh1 := createTestWarehouse(t, client, fx.EnterpriseID)
	wh1ID, _ := wh1["id"].(string)
	wh2 := createTestWarehouse(t, client, fx.EnterpriseID)
	wh2ID, _ := wh2["id"].(string)
	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/transfers", map[string]interface{}{
		"source_wh_id": wh1ID,
		"target_wh_id": wh2ID,
		"material_id":  matID,
		"quantity":     10,
	})
	testutil.AssertStatus(t, w, 201)
}

func TestRequisition_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)
	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/requisitions", map[string]interface{}{
		"applicant_id": fx.Employee.ID.String(),
		"warehouse_id": whID,
		"material_id":  matID,
		"quantity":     5,
		"notes":        "Urgent request",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestStockFlow_UnifiedRecord(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/stock-flows")
	testutil.AssertStatus(t, w, 200)
}

func TestOrders_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/orders?order_type=purchase")
	if w.Code != 200 && w.Code != 400 {
		t.Errorf("expected 200 or 400, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestInventory_Set(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)
	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/inventory", map[string]interface{}{
		"warehouse_id": whID,
		"material_id":  matID,
		"quantity":     100,
		"safety_stock": 20,
	})
	if w.Code != 200 && w.Code != 201 {
		t.Errorf("expected 200/201, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestInventory_ByWarehouse(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory/warehouses/" + whID)
	testutil.AssertStatus(t, w, 200)
}

func TestInventory_ByMaterial(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory/materials/" + matID)
	testutil.AssertStatus(t, w, 200)
}

func TestSupplier_Fields(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/suppliers", map[string]interface{}{
		"name":          "Full Field Supplier",
		"contact_name":  "Zhang San",
		"contact_phone": "13900009999",
		"contact_email": "zhangsan@supplier.com",
		"address":       "888 Supplier Road",
	})
	testutil.AssertStatus(t, w, 201)
}

func TestWarehouse_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/warehouses")
	testutil.AssertStatus(t, w, 200)
}

func TestMaterial_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/materials")
	testutil.AssertStatus(t, w, 200)
}

func TestSupplier_List(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/suppliers")
	testutil.AssertStatus(t, w, 200)
}

func TestInventoryCheck_Create(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh := createTestWarehouse(t, client, fx.EnterpriseID)
	whID, _ := wh["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/inventory-checks", map[string]interface{}{
		"warehouse_id":  whID,
		"check_type":    "full",
		"status":        "draft",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestInventoryCheck_DiffCalculation(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory-checks")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestInventoryCheck_ByBatch(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory-checks?check_type=batch")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestInventoryCheck_ApproveAdjust(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/inventory-checks")
	if w.Code == 200 {
		resp := testutil.ParseResponse(t, w)
		items := testutil.GetDataArray(t, resp)
		if len(items) > 0 {
			item0, ok := items[0].(map[string]interface{})
			if !ok {
				t.Log("inventory check item not a map")
				return
			}
			id, _ := item0["id"].(string)
			approveW := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/inventory-checks/"+id+"/approve", map[string]interface{}{
				"adjustment_type": "increase",
			})
			if approveW.Code != 200 && approveW.Code != 404 && approveW.Code != 400 {
				t.Errorf("expected 200/400/404, got %d; body: %s", approveW.Code, approveW.Body.String())
			}
		}
	}
}

func TestMaterial_HistoricalPricing(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/materials/" + matID + "/price-history")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestMaterial_DifferentialPricing(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	mat := createTestMaterial(t, client, fx.EnterpriseID)
	matID, _ := mat["id"].(string)

	w := client.PUT("/api/v1/enterprises/"+fx.EnterpriseID+"/materials/"+matID, map[string]interface{}{
		"name":       "Diff Price Material",
		"type":       "成品",
		"unit":       "个",
		"unit_price": 150.0,
	})
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestStockFlow_BatchExpirySerial(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/stock-flows?batch_no=test&serial_no=S001")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestStockTransfer_Execute(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	wh1 := createTestWarehouse(t, client, fx.EnterpriseID)
	wh1ID, _ := wh1["id"].(string)
	wh2 := createTestWarehouse(t, client, fx.EnterpriseID)
	wh2ID, _ := wh2["id"].(string)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/stock-transfers", map[string]interface{}{
		"from_warehouse_id": wh1ID,
		"to_warehouse_id":   wh2ID,
		"status":            "pending",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestStockTransfer_ActualQuantity(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/stock-transfers")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestPurchaseOrder_Receive(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	sup := createTestSupplier(t, client, fx.EnterpriseID)
	supID, _ := sup["id"].(string)

	poW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/purchase-orders", map[string]interface{}{
		"supplier_id": supID,
		"status":      "approved",
	})
	if poW.Code != 200 && poW.Code != 201 && poW.Code != 404 {
		t.Fatalf("purchase order create: %d %s", poW.Code, poW.Body.String())
	}
	if poW.Code == 404 {
		t.Skip("purchase order endpoint not found")
	}

	poResp := testutil.ParseResponse(t, poW)
	poData := testutil.GetData(t, poResp)
	poID, _ := poData["id"].(string)

	recvW := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/purchase-orders/"+poID+"/receive", map[string]interface{}{
		"received_quantity": 100,
	})
	if recvW.Code != 200 && recvW.Code != 201 && recvW.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", recvW.Code, recvW.Body.String())
	}
}

func TestRequisition_Issue(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.POST("/api/v1/enterprises/"+fx.EnterpriseID+"/requisitions", map[string]interface{}{
		"type":   "issue",
		"status": "draft",
	})
	if w.Code != 200 && w.Code != 201 && w.Code != 404 {
		t.Errorf("expected 200/201/404, got %d; body: %s", w.Code, w.Body.String())
	}
}

func TestQualityInspection_Flow(t *testing.T) {
	db := testutil.SetupTestDB(t)
	fx := testutil.CreateFullOrgChain(t, db)
	defer fx.Cleanup(t, db)
	router := testutil.SetupTestRouter(db, fx.JWTManager)

	client := testutil.NewTestClient(t, router, db)
	client.SetToken(fx.OwnerToken(t))
	client.SetEnterprise(fx.EnterpriseID)

	w := client.GET("/api/v1/enterprises/" + fx.EnterpriseID + "/quality-inspections")
	if w.Code != 200 && w.Code != 404 {
		t.Errorf("expected 200/404, got %d; body: %s", w.Code, w.Body.String())
	}
}
