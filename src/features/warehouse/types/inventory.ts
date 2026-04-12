import type { LucideIcon } from 'lucide-react';

// ==================== Product Types ====================

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: '台' | '件' | '箱' | '个' | '套' | '批';
  unit_cost: number;
  min_stock: number;
  max_stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  category: string;
  unit: Product['unit'];
  unit_cost: number;
  min_stock?: number;
  max_stock?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// ==================== Location Types ====================

export interface Location {
  id: string;
  code: string;
  name: string;
  zone: string;
  capacity: number;
  current_count: number;
  status: 'available' | 'full' | 'disabled';
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequest {
  code: string;
  name: string;
  zone: string;
  capacity: number;
  remark?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  id: string;
  status?: Location['status'];
}

// ==================== Inventory Types ====================

export type StockStatus = 'low' | 'normal' | 'excess';

export interface Inventory {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  updated_at: string;
}

export interface InventoryItem extends Inventory {
  product: Product;
  location: Location;
  stock_status: StockStatus;
}

export interface InventoryDetailItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  stock_status: StockStatus;
  min_stock: number;
  max_stock: number;
}

export interface WarehouseStats {
  total_inventory: number;
  low_stock_count: number;
  pending_inbound: number;
  pending_outbound: number;
}

export interface ListInventoryRequest {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  location_id?: string;
  stock_status?: StockStatus | 'all';
}

export interface ListInventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
}

export interface GetInventoryRequest {
  product_id: string;
  location_id?: string;
}

export interface GetInventoryResponse {
  inventory: InventoryItem;
  recent_movements: MovementRecord[];
}

// ==================== Stocktaking Types ====================

export interface StocktakingRequest {
  product_id: string;
  location_id: string;
  actual_quantity: number;
  remark?: string;
}

export interface StocktakingResponse {
  id: string;
  product_id: string;
  location_id: string;
  before_quantity: number;
  after_quantity: number;
  adjustment: number;
  created_at: string;
}

export interface ListStocktakingRequest {
  page?: number;
  pageSize?: number;
  start_date?: string;
  end_date?: string;
  product_id?: string;
}

export interface ListStocktakingResponse {
  items: StocktakingResponse[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Movement Types ====================

export type MovementType = 'inbound' | 'outbound' | 'stocktaking' | 'adjustment';

export interface MovementRecord {
  id: string;
  type: MovementType;
  ref_type: string;
  ref_id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  remark?: string;
  created_by: string;
  created_at: string;
}

export interface ListMovementsRequest {
  page?: number;
  pageSize?: number;
  product_id?: string;
  location_id?: string;
  type?: MovementType;
  start_date?: string;
  end_date?: string;
}

export interface ListMovementsResponse {
  items: MovementRecord[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    total_inbound: number;
    total_outbound: number;
    net_change: number;
  };
}

// ==================== Inbound Types ====================

export type InboundType = 'purchase' | 'return' | 'transfer';
export type InboundStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled';

export interface InboundItem {
  id: string;
  inbound_id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  unit_cost: number;
  amount: number;
  batch_no?: string;
  production_date?: string;
  expiry_date?: string;
  remark?: string;
}

export interface InboundOrder {
  id: string;
  inbound_no: string;
  type: InboundType;
  supplier_id?: string;
  supplier_name?: string;
  warehouse_id: string;
  status: InboundStatus;
  total_quantity: number;
  total_amount: number;
  remark?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInboundRequest {
  type: InboundType;
  supplier_id?: string;
  supplier_name?: string;
  warehouse_id: string;
  items: Array<{
    product_id: string;
    location_id: string;
    quantity: number;
    unit_cost: number;
    batch_no?: string;
    production_date?: string;
    expiry_date?: string;
    remark?: string;
  }>;
  remark?: string;
}

// ==================== Outbound Types ====================

export type OutboundType = 'sale' | 'return' | 'transfer' | 'damage';
export type OutboundStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled';

export interface OutboundItem {
  id: string;
  outbound_id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  unit_price?: number;
  amount?: number;
  batch_no?: string;
  remark?: string;
}

export interface OutboundOrder {
  id: string;
  outbound_no: string;
  type: OutboundType;
  customer_id?: string;
  customer_name?: string;
  sales_order_id?: string;
  warehouse_id: string;
  status: OutboundStatus;
  total_quantity: number;
  total_amount: number;
  remark?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOutboundRequest {
  type: OutboundType;
  customer_id?: string;
  customer_name?: string;
  sales_order_id?: string;
  warehouse_id: string;
  items: Array<{
    product_id: string;
    location_id: string;
    quantity: number;
    unit_price?: number;
    batch_no?: string;
    remark?: string;
  }>;
  remark?: string;
}

export interface CheckInventoryRequest {
  items: Array<{
    product_id: string;
    location_id: string;
    quantity: number;
  }>;
}

export interface CheckInventoryResponse {
  available: boolean;
  checks: Array<{
    product_id: string;
    location_id: string;
    requested: number;
    available: number;
    sufficient: boolean;
  }>;
}

// ==================== Warning Types ====================

export type WarningLevel = 'info' | 'warning' | 'critical';
export type WarningType = 'low' | 'high' | 'expiring';

export interface InventoryWarning {
  id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  current_quantity: number;
  min_stock: number;
  max_stock: number;
  shortage: number;
  level: WarningLevel;
  type: WarningType;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface ListWarningsRequest {
  page?: number;
  pageSize?: number;
  level?: WarningLevel;
  type?: WarningType;
  is_read?: boolean;
}

export interface ListWarningsResponse {
  items: InventoryWarning[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    low_count: number;
    high_count: number;
    expiring_count: number;
  };
}

// ==================== Logistics Types ====================

export type LogisticsStatus = 'pending' | 'in_transit' | 'delivered' | 'exception';

export interface LogisticsEvent {
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface LogisticsRecord {
  id: string;
  tracking_no: string;
  carrier: string;
  outbound_id: string;
  status: LogisticsStatus;
  current_location: string;
  estimated_arrival?: string;
  events: LogisticsEvent[];
  created_at: string;
  updated_at: string;
}

// ==================== Warehouse Plugin Types ====================

export interface WarehousePluginConfig {
  pluginId: 'warehouse';
  pluginName: '仓储管理';
  icon: LucideIcon;
  capabilities: WarehouseCapability[];
}

export interface WarehouseCapability {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  commandId: string;
  icon?: LucideIcon;
}

export const WAREHOUSE_CAPABILITIES: WarehouseCapability[] = [
  {
    id: 'inventory-view',
    name: '库存查询',
    description: '查看当前库存状况',
    keywords: ['库存', '商品', '查询', '盘点'],
    commandId: 'warehouse.inventory',
  },
  {
    id: 'inbound-create',
    name: '入库登记',
    description: '创建入库单',
    keywords: ['入库', '采购', '收货'],
    commandId: 'warehouse.inbound',
  },
  {
    id: 'outbound-create',
    name: '出库登记',
    description: '创建出库单',
    keywords: ['出库', '发货', '销售'],
    commandId: 'warehouse.outbound',
  },
  {
    id: 'stocktaking',
    name: '库存盘点',
    description: '进行库存盘点',
    keywords: ['盘点', '清点', '核对'],
    commandId: 'warehouse.stocktaking',
  },
  {
    id: 'warning-view',
    name: '库存预警',
    description: '查看库存预警',
    keywords: ['预警', '警告', '不足', '补货'],
    commandId: 'warehouse.warning',
  },
  {
    id: 'movement-view',
    name: '库存流水',
    description: '查看库存变动记录',
    keywords: ['流水', '变动', '历史', '记录'],
    commandId: 'warehouse.movement',
  },
];
