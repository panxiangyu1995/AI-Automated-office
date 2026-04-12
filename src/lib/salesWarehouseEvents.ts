/**
 * Sales - Warehouse Event Bus
 * 
 * Implements event-driven integration between Sales and Warehouse modules.
 * Sales module publishes events, Warehouse module subscribes to handle:
 * - Sales order created → prepare outbound
 * - Sales order cancelled → cancel outbound
 * - Outbound confirmed → update sales order status
 */

export interface SalesOrderCreatedEvent {
  event: 'sales:order_created';
  orderId: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddress?: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface SalesOrderCancelledEvent {
  event: 'sales:order_cancelled';
  orderId: string;
  reason: string;
  createdAt: string;
}

export interface OutboundConfirmedEvent {
  event: 'warehouse:outbound_confirmed';
  outboundId: string;
  salesOrderId?: string;
  customerId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  createdAt: string;
}

export type SalesWarehouseEvent = SalesOrderCreatedEvent | SalesOrderCancelledEvent | OutboundConfirmedEvent;

type EventHandler<T extends SalesWarehouseEvent = SalesWarehouseEvent> = (event: T) => void | Promise<void>;

class SalesWarehouseEventBusImpl {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: SalesWarehouseEvent[] = [];

  /**
   * Publish an event
   */
  publish(event: SalesWarehouseEvent): void {
    this.eventHistory.push(event);
    
    const handlers = this.handlers.get(event.event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.event}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to events
   * @param eventType Event type to subscribe to (e.g., 'sales:order_created')
   * @param handler Handler function
   * @returns Unsubscribe function
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Get event history
   */
  getHistory(): SalesWarehouseEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get pending outbound preparations for a sales order
   */
  getPendingPreparations(salesOrderId: string): SalesWarehouseEvent[] {
    return this.eventHistory.filter(e => 
      e.event === 'sales:order_created' && 'orderId' in e && e.orderId === salesOrderId
    );
  }
}

export const salesWarehouseEventBus = new SalesWarehouseEventBusImpl();

// ==================== Warehouse Event Handlers ====================

/**
 * Initialize warehouse event handlers
 * This should be called when the warehouse module loads
 */
export function initWarehouseEventHandlers() {
  // Handle sales order created
  salesWarehouseEventBus.subscribe('sales:order_created', async (event) => {
    const typedEvent = event as SalesOrderCreatedEvent;
    console.log('[Warehouse] Received sales order:', typedEvent.orderId);
    
    // In a real implementation:
    // 1. Check inventory availability
    // 2. If available, create outbound draft
    // 3. Notify warehouse staff
    // 4. If not available, send alert
  });

  // Handle sales order cancelled
  salesWarehouseEventBus.subscribe('sales:order_cancelled', (event) => {
    const typedEvent = event as SalesOrderCancelledEvent;
    console.log('[Warehouse] Sales order cancelled:', typedEvent.orderId);
    
    // In a real implementation:
    // 1. Find pending outbound for this order
    // 2. Cancel the outbound
    // 3. Restore inventory
  });

  console.log('[Warehouse] Event handlers initialized');
}

// ==================== Sales Event Publishers ====================

/**
 * Publish sales order created event
 * This should be called from the sales module when an order is created
 */
export function publishSalesOrderCreated(order: Omit<SalesOrderCreatedEvent, 'event' | 'createdAt'>) {
  salesWarehouseEventBus.publish({
    event: 'sales:order_created',
    ...order,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Publish outbound confirmed event
 * This should be called when an outbound is confirmed
 */
export function publishOutboundConfirmed(outbound: Omit<OutboundConfirmedEvent, 'event' | 'createdAt'>) {
  salesWarehouseEventBus.publish({
    event: 'warehouse:outbound_confirmed',
    ...outbound,
    createdAt: new Date().toISOString(),
  });
}
