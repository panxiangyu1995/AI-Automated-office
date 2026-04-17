/**
 * 仓库插件入口
 * 
 * 仓库管理模块 - 出入库、盘点、库存预警
 */

export const pluginInfo = {
  id: 'warehouse',
  name: '仓库管理',
  version: '1.0.0',
  description: '仓库管理模块',
};

export async function onInit(): Promise<void> {
  console.log('[WarehousePlugin] Initialized');
}

export async function onMount(): Promise<void> {
  console.log('[WarehousePlugin] Mounted');
}

export async function onUnmount(): Promise<void> {
  console.log('[WarehousePlugin] Unmounted');
}

export const warehousePlugin = {
  info: pluginInfo,
  init: onInit,
  mount: onMount,
  unmount: onUnmount,
};

export default warehousePlugin;
