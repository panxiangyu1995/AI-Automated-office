/**
 * 销售插件入口
 * 
 * 销售自动化模块 - 客户、报价、合同、订单管理
 */

export const pluginInfo = {
  id: 'sales',
  name: '销售管理',
  version: '1.0.0',
  description: '销售自动化模块',
};

export async function onInit(): Promise<void> {
  console.log('[SalesPlugin] Initialized');
}

export async function onMount(): Promise<void> {
  console.log('[SalesPlugin] Mounted');
}

export async function onUnmount(): Promise<void> {
  console.log('[SalesPlugin] Unmounted');
}

export const salesPlugin = {
  info: pluginInfo,
  init: onInit,
  mount: onMount,
  unmount: onUnmount,
};

export default salesPlugin;
