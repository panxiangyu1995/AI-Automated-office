import { invoke } from '@tauri-apps/api/core';
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
  return invoke('warehouse_list_inventory_detail', { request });
}

export async function stocktaking(request: StocktakingRequest): Promise<StocktakingResponse> {
  return invoke('warehouse_stocktaking', { request });
}

export async function listStocktaking(): Promise<StocktakingResponse[]> {
  return invoke('warehouse_list_stocktaking');
}

export async function getWarehouseStats(): Promise<WarehouseStats> {
  return invoke('warehouse_get_stats');
}
