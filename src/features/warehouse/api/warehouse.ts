import { safeInvoke } from '@/lib/tauri';
import type {
  ListInventoryRequest,
  ListInventoryResponse,
  StocktakingRequest,
  StocktakingResponse,
  WarehouseStats,
} from '../types/inventory';

export async function listInventoryDetail(
  request?: ListInventoryRequest
): Promise<ListInventoryResponse> {
  const result = await safeInvoke<ListInventoryResponse>('warehouse_list_inventory_detail', { request });
  return result ?? ({} as ListInventoryResponse);
}

export async function stocktaking(request: StocktakingRequest): Promise<StocktakingResponse> {
  const result = await safeInvoke<StocktakingResponse>('warehouse_stocktaking', { request });
  return result ?? ({} as StocktakingResponse);
}

export async function listStocktaking(): Promise<StocktakingResponse[]> {
  const result = await safeInvoke<StocktakingResponse[]>('warehouse_list_stocktaking');
  return result ?? [];
}

export async function getWarehouseStats(): Promise<WarehouseStats> {
  const result = await safeInvoke<WarehouseStats>('warehouse_get_stats');
  return result ?? ({} as WarehouseStats);
}
