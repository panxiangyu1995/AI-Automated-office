package acceptance

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/config"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func connectTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := "host=localhost user=ai_office password=ai_office_pass dbname=ai_office sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	require.NoError(t, err, "failed to connect to test database")
	return db
}

func connectTestRedis(t *testing.T) *rc.Client {
	t.Helper()
	client, err := rc.NewClient(config.RedisConfig{Host: "localhost", Port: 6379, Password: "", DB: 0})
	require.NoError(t, err, "failed to connect to Redis")
	t.Cleanup(func() { client.Close() })
	return client
}

func setupInventoryTables(t *testing.T, db *gorm.DB) {
	t.Helper()
	db.Exec(`CREATE TABLE IF NOT EXISTS warehouse_inventories (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		warehouse_id UUID NOT NULL,
		material_id UUID NOT NULL,
		quantity INTEGER NOT NULL DEFAULT 0,
		safety_stock INTEGER NOT NULL DEFAULT 0,
		in_transit INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_mat ON warehouse_inventories (warehouse_id, material_id)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS purchase_orders (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		order_no VARCHAR(50) NOT NULL,
		supplier_id UUID,
		status VARCHAR(20) NOT NULL DEFAULT 'draft',
		total_amount DECIMAL(12,2) DEFAULT 0,
		notes TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS purchase_order_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		order_id UUID NOT NULL,
		material_id UUID NOT NULL,
		quantity INTEGER NOT NULL,
		unit_price DECIMAL(12,2) NOT NULL,
		received_qty INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW()
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS sales_orders (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		order_no VARCHAR(50) NOT NULL,
		customer_id UUID,
		status VARCHAR(20) NOT NULL DEFAULT 'draft',
		total_amount DECIMAL(12,2) DEFAULT 0,
		notes TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS sales_order_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		order_id UUID NOT NULL,
		material_id UUID NOT NULL,
		quantity INTEGER NOT NULL,
		unit_price DECIMAL(12,2) NOT NULL,
		shipped_qty INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW()
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS transfer_orders (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		order_no VARCHAR(50) NOT NULL,
		source_wh_id UUID,
		target_wh_id UUID,
		material_id UUID,
		quantity INTEGER NOT NULL DEFAULT 0,
		received_qty INTEGER NOT NULL DEFAULT 0,
		status VARCHAR(20) NOT NULL DEFAULT 'draft',
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS requisitions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		requisition_no VARCHAR(50) NOT NULL,
		applicant_id UUID,
		warehouse_id UUID,
		material_id UUID,
		quantity INTEGER NOT NULL DEFAULT 0,
		issued_qty INTEGER NOT NULL DEFAULT 0,
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		notes TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS suppliers (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS customers (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS materials (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		code VARCHAR(100) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS warehouses (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		name VARCHAR(255) NOT NULL,
		code VARCHAR(100) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS quality_inspections (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		enterprise_id UUID NOT NULL,
		inspection_no VARCHAR(50) NOT NULL,
		purchase_order_id VARCHAR(100),
		status VARCHAR(20) NOT NULL DEFAULT 'pending',
		inspector_id UUID,
		inspected_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`)
	db.Exec(`CREATE TABLE IF NOT EXISTS quality_inspection_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		inspection_id UUID NOT NULL,
		item_name VARCHAR(255),
		result VARCHAR(20),
		created_at TIMESTAMP DEFAULT NOW()
	)`)
}

func TestAcceptance_ConcurrentInventory_NoOversell(t *testing.T) {
	db := connectTestDB(t)
	redisClient := connectTestRedis(t)
	setupInventoryTables(t, db)

	eid := uuid.New()
	whID := uuid.New()
	matID := uuid.New()

	db.Exec(`DELETE FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID)
	db.Exec(`INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit)
		VALUES (?, ?, ?, 30, 0, 0)`, eid, whID, matID)

	lockProvider := rc.NewLockProvider(redisClient)
	invRepo := repository.NewInventoryRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	whRepo := repository.NewWarehouseRepository(db)
	supRepo := repository.NewSupplierRepository(db)
	custRepo := repository.NewCustomerRepository(db)
	qiRepo := repository.NewQualityInspectionRepository(db)

	orderSvc := service.NewOrderService(orderRepo, invRepo, matRepo, whRepo, supRepo, custRepo, qiRepo, lockProvider)

	soID := uuid.New()
	custID := uuid.New()
	db.Exec(`INSERT INTO sales_orders (id, enterprise_id, order_no, status, customer_id) VALUES (?, ?, 'SO-TEST', 'confirmed', ?)`, soID, eid, custID)
	db.Exec(`INSERT INTO sales_order_items (id, order_id, material_id, quantity, unit_price, shipped_qty) VALUES (?, ?, ?, 30, 10.0, 0)`, uuid.New(), soID, matID)

	numConcurrent := 5
	var wg sync.WaitGroup
	var successCount atomic.Int32
	var failCount atomic.Int32

	for i := 0; i < numConcurrent; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			result, appErr := orderSvc.ShipSalesOrder(soID.String(), whID.String())
			if appErr != nil {
				t.Logf("ShipSalesOrder failed: %v (result=%v)", appErr, result)
				failCount.Add(1)
			} else {
				successCount.Add(1)
			}
		}()
	}
	wg.Wait()

	var finalQty int
	db.Raw(`SELECT quantity FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID).Scan(&finalQty)

	t.Logf("Results: %d succeeded, %d failed, final quantity: %d", successCount.Load(), failCount.Load(), finalQty)

	assert.Equal(t, int32(1), successCount.Load(), "exactly one shipment should succeed")
	assert.Equal(t, int32(numConcurrent-1), failCount.Load(), "all other shipments should fail")
	assert.Equal(t, 0, finalQty, "quantity should be 30 - 30 = 0")
	assert.GreaterOrEqual(t, finalQty, 0, "quantity must never go negative")
}

func TestAcceptance_ConcurrentReceive_NoLostIncrement(t *testing.T) {
	db := connectTestDB(t)
	redisClient := connectTestRedis(t)
	setupInventoryTables(t, db)

	eid := uuid.New()
	whID := uuid.New()
	matID := uuid.New()

	db.Exec(`DELETE FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID)
	db.Exec(`INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit)
		VALUES (?, ?, ?, 0, 0, 0)`, eid, whID, matID)

	lockProvider := rc.NewLockProvider(redisClient)
	invRepo := repository.NewInventoryRepository(db)

	numConcurrent := 10
	incrementPerOp := 10
	var wg sync.WaitGroup
	var successCount atomic.Int32

	for i := 0; i < numConcurrent; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for retry := 0; retry < 3; retry++ {
				lock, acquired := lockProvider.AcquireInventoryLock(context.Background(), whID.String(), matID.String())
				if acquired {
					err := invRepo.AdjustQuantity(eid, whID, matID, incrementPerOp)
					lock.Release(context.Background())
					if err == nil {
						successCount.Add(1)
					}
					return
				}
				time.Sleep(50 * time.Millisecond)
			}
		}()
	}
	wg.Wait()

	var finalQty int
	db.Raw(`SELECT quantity FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID).Scan(&finalQty)

	expectedQty := int(successCount.Load()) * incrementPerOp
	t.Logf("Results: %d succeeded, final quantity: %d, expected: %d", successCount.Load(), finalQty, expectedQty)

	assert.Equal(t, int32(numConcurrent), successCount.Load(), "all receives should succeed")
	assert.Equal(t, numConcurrent*incrementPerOp, finalQty, "quantity should be exactly N * increment")
}

func TestAcceptance_AdjustQuantityWithCheck_PreventsNegative(t *testing.T) {
	db := connectTestDB(t)
	setupInventoryTables(t, db)

	whID := uuid.New()
	matID := uuid.New()
	eid := uuid.New()

	db.Exec(`DELETE FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID)
	db.Exec(`INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit)
		VALUES (?, ?, ?, 5, 0, 0)`, eid, whID, matID)

	invRepo := repository.NewInventoryRepository(db)

	err := invRepo.AdjustQuantityWithCheck(eid, whID, matID, -3)
	assert.NoError(t, err, "decrementing 5 by 3 should succeed")

	err = invRepo.AdjustQuantityWithCheck(eid, whID, matID, -5)
	assert.Error(t, err, "decrementing 2 by 5 should fail (would go negative)")

	var finalQty int
	db.Raw(`SELECT quantity FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, whID, matID).Scan(&finalQty)
	assert.Equal(t, 2, finalQty, "quantity should remain at 2 after failed decrement")
}

func TestAcceptance_Transfer_AcquiresBothLocks(t *testing.T) {
	db := connectTestDB(t)
	redisClient := connectTestRedis(t)
	setupInventoryTables(t, db)

	eid := uuid.New()
	srcWh := uuid.New()
	tgtWh := uuid.New()
	matID := uuid.New()

	db.Exec(`DELETE FROM warehouse_inventories WHERE material_id = ?`, matID)
	db.Exec(`INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit)
		VALUES (?, ?, ?, 50, 0, 0)`, eid, srcWh, matID)
	db.Exec(`INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit)
		VALUES (?, ?, ?, 0, 0, 0)`, eid, tgtWh, matID)

	lockProvider := rc.NewLockProvider(redisClient)
	invRepo := repository.NewInventoryRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	matRepo := repository.NewMaterialRepository(db)
	whRepo := repository.NewWarehouseRepository(db)
	supRepo := repository.NewSupplierRepository(db)
	custRepo := repository.NewCustomerRepository(db)
	qiRepo := repository.NewQualityInspectionRepository(db)

	orderSvc := service.NewOrderService(orderRepo, invRepo, matRepo, whRepo, supRepo, custRepo, qiRepo, lockProvider)

	toID := uuid.New()
	db.Exec(`INSERT INTO transfer_orders (id, enterprise_id, order_no, source_wh_id, target_wh_id, material_id, quantity, status)
		VALUES (?, ?, 'TO-TEST', ?, ?, ?, 20, 'draft')`, toID, eid, srcWh, tgtWh, matID)

	result, appErr := orderSvc.ExecuteTransfer(toID.String())
	require.Nil(t, appErr, "transfer should succeed")
	assert.Equal(t, "completed", result.Status)

	var srcQty, tgtQty int
	db.Raw(`SELECT quantity FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, srcWh, matID).Scan(&srcQty)
	db.Raw(`SELECT quantity FROM warehouse_inventories WHERE warehouse_id = ? AND material_id = ?`, tgtWh, matID).Scan(&tgtQty)
	assert.Equal(t, 30, srcQty, "source should be 50 - 20 = 30")
	assert.Equal(t, 20, tgtQty, "target should be 0 + 20 = 20")
}

func TestAcceptance_LockGracefulDegradation_NoRedis(t *testing.T) {
	lockProvider := rc.NewLockProvider(nil)
	lock, acquired := lockProvider.AcquireInventoryLock(context.Background(), uuid.New().String(), uuid.New().String())
	assert.True(t, acquired, "lock should succeed gracefully when Redis is nil")
	lock.Release(context.Background())
}

func TestAcceptance_RedisLock_ExclusiveAccess(t *testing.T) {
	redisClient := connectTestRedis(t)
	lockProvider := rc.NewLockProvider(redisClient)

	key1 := fmt.Sprintf("test_lock_%s", uuid.New().String())

	lock1, acquired1 := lockProvider.AcquireInventoryLock(context.Background(), key1, "mat1")
	require.True(t, acquired1, "first lock should be acquired")

	_, acquired2 := lockProvider.AcquireInventoryLock(context.Background(), key1, "mat1")
	assert.False(t, acquired2, "second lock on same key should fail while first is held")

	lock1.Release(context.Background())

	time.Sleep(50 * time.Millisecond)
	lock3, acquired3 := lockProvider.AcquireInventoryLock(context.Background(), key1, "mat1")
	assert.True(t, acquired3, "lock should be acquirable after release")
	lock3.Release(context.Background())
}
