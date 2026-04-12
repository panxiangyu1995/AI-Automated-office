/**
 * Warehouse Data API
 * 
 * Provides API methods for other modules (sales, finance, management) to access warehouse data.
 * These APIs are designed for cross-department data access with permission control.
 */

import { invoke } from '@tauri-apps/api/core';
import type { InventoryDetailItem, WarehouseStats } from '../types/inventory';

/**
 * Get inventory summary for dashboard
 */
export async function getWarehouseSummary(): Promise<{
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  excessStockCount: number;
  pendingInbound: number;
  pendingOutbound: number;
}> {
  const stats = await invoke<WarehouseStats>('warehouse_get_stats');
  return {
    totalProducts: stats.total_inventory,
    totalQuantity: stats.total_inventory * 100, // Mock: assume avg 100 per product
    lowStockCount: stats.low_stock_count,
    excessStockCount: 0,
    pendingInbound: stats.pending_inbound,
    pendingOutbound: stats.pending_outbound,
  };
}

/**
 * Check inventory availability for sales order
 */
export async function checkInventoryForSales(
  items: Array<{ productId: string; quantity: number }>
): Promise<{
  available: boolean;
  checks: Array<{
    productId: string;
    requested: number;
    available: number;
    sufficient: boolean;
  }>;
}> {
  const inventory = await invoke<InventoryDetailItem[]>('warehouse_list_inventory_detail', {
    request: {
      page: 1,
      page_size: 1000,
      stock_status: null,
    },
  });

  const checks = items.map((item) => {
    const inv = inventory.find((i) => i.product_id === item.productId);
    return {
      productId: item.productId,
      requested: item.quantity,
      available: inv?.available_quantity ?? 0,
      sufficient: (inv?.available_quantity ?? 0) >= item.quantity,
    };
  });

  return {
    available: checks.every((c) => c.sufficient),
    checks,
  };
}

/**
 * Get low stock products for alert
 */
export async function getLowStockProducts(): Promise<
  Array<{
    productId: string;
    productName: string;
    currentQuantity: number;
    minStock: number;
    shortage: number;
  }>
> {
  const inventory = await invoke<InventoryDetailItem[]>('warehouse_list_inventory_detail', {
    request: {
      page: 1,
      page_size: 1000,
      stock_status: 'low',
    },
  });

  return inventory.map((item) => ({
    productId: item.product_id,
    productName: item.product_name,
    currentQuantity: item.available_quantity,
    minStock: item.min_stock,
    shortage: item.min_stock - item.available_quantity,
  }));
}

/**
 * Get inventory value for finance module
 */
export async function getInventoryValue(): Promise<{
  totalValue: number;
  byCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}> {
  const inventory = await invoke<InventoryDetailItem[]>('warehouse_list_inventory_detail', {
    request: {
      page: 1,
      page_size: 1000,
    },
  });

  const byCategory: Record<string, { count: number; value: number }> = {};
  let totalValue = 0;

  for (const item of inventory) {
    const value = item.quantity * (item.min_stock * 100); // Mock unit cost
    totalValue += value;

    if (!byCategory[item.category]) {
      byCategory[item.category] = { count: 0, value: 0 };
    }
    byCategory[item.category].count += 1;
    byCategory[item.category].value += value;
  }

  return {
    totalValue,
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    })),
  };
}

/**
 * Reserve inventory for outbound
 */
export async function reserveInventory(
  _productId: string,
  _quantity: number
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    // In a real implementation, this would call a Tauri command to reserve inventory
    // For now, return a mock success response
    return {
      success: true,
      reservationId: `res-${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Release reserved inventory
 */
export async function releaseReservation(
  _reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, this would call a Tauri command to release reservation
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
