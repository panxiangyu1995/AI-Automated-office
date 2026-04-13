//! Service 模块状态管理

import { create } from 'zustand';
import type {
  ServiceTicket,
  TicketListItem,
  PersonnelListItem,
  QueryTicketsParams,
  TicketStatistics,
} from '../types/service';
import * as api from '../api/service';

interface ServiceState {
  // 工单相关
  tickets: TicketListItem[];
  currentTicket: ServiceTicket | null;
  ticketsTotal: number;
  ticketsPage: number;
  ticketsPageSize: number;
  ticketsLoading: boolean;
  ticketsError: string | null;
  
  // 服务人员相关
  personnel: PersonnelListItem[];
  personnelLoading: boolean;
  personnelError: string | null;
  
  // 统计
  statistics: TicketStatistics | null;
  
  // 筛选
  filters: QueryTicketsParams;
  
  // 工单 Actions
  fetchTickets: (params?: QueryTicketsParams) => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  createTicket: (request: Parameters<typeof api.createTicket>[0]) => Promise<ServiceTicket>;
  updateTicket: (id: string, request: Parameters<typeof api.updateTicket>[1]) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  updateTicketStatus: (id: string, status: Parameters<typeof api.updateTicketStatus>[1]['status']) => Promise<void>;
  assignTicket: (id: string, assignedTo: string, assignedName: string) => Promise<void>;
  
  // 服务人员 Actions
  fetchPersonnel: () => Promise<void>;
  
  // 统计 Actions
  fetchStatistics: () => Promise<void>;
  
  // 筛选 Actions
  setFilters: (filters: Partial<QueryTicketsParams>) => void;
  clearFilters: () => void;
  
  // 工具方法
  clearError: () => void;
  clearCurrentTicket: () => void;
}

const defaultFilters: QueryTicketsParams = {
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useServiceStore = create<ServiceState>((set, get) => ({
  // 初始状态
  tickets: [],
  currentTicket: null,
  ticketsTotal: 0,
  ticketsPage: 1,
  ticketsPageSize: 20,
  ticketsLoading: false,
  ticketsError: null,
  
  personnel: [],
  personnelLoading: false,
  personnelError: null,
  
  statistics: null,
  
  filters: defaultFilters,
  
  // 工单 Actions
  fetchTickets: async (params) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      const filters = { ...get().filters, ...params };
      const result = await api.listTickets(filters);
      set({
        tickets: result.items,
        ticketsTotal: result.total,
        ticketsPage: result.page,
        ticketsPageSize: result.pageSize,
        filters,
        ticketsLoading: false,
      });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
    }
  },
  
  fetchTicket: async (id) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      const ticket = await api.getTicket(id);
      set({ currentTicket: ticket, ticketsLoading: false });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
    }
  },
  
  createTicket: async (request) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      const ticket = await api.createTicket(request);
      // 刷新列表
      await get().fetchTickets();
      set({ ticketsLoading: false });
      return ticket;
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
      throw error;
    }
  },
  
  updateTicket: async (id, request) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      await api.updateTicket(id, request);
      // 刷新列表和当前工单
      await get().fetchTickets();
      if (get().currentTicket?.id === id) {
        await get().fetchTicket(id);
      }
      set({ ticketsLoading: false });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
      throw error;
    }
  },
  
  deleteTicket: async (id) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      await api.deleteTicket(id);
      // 刷新列表
      await get().fetchTickets();
      if (get().currentTicket?.id === id) {
        set({ currentTicket: null });
      }
      set({ ticketsLoading: false });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
      throw error;
    }
  },
  
  updateTicketStatus: async (id, status) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      await api.updateTicketStatus(id, { status });
      // 刷新列表和当前工单
      await get().fetchTickets();
      if (get().currentTicket?.id === id) {
        await get().fetchTicket(id);
      }
      set({ ticketsLoading: false });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
      throw error;
    }
  },
  
  assignTicket: async (id, assignedTo, assignedName) => {
    set({ ticketsLoading: true, ticketsError: null });
    try {
      await api.assignTicket(id, { assignedTo, assignedName });
      // 刷新列表和当前工单
      await get().fetchTickets();
      if (get().currentTicket?.id === id) {
        await get().fetchTicket(id);
      }
      set({ ticketsLoading: false });
    } catch (error) {
      set({ ticketsError: String(error), ticketsLoading: false });
      throw error;
    }
  },
  
  // 服务人员 Actions
  fetchPersonnel: async () => {
    set({ personnelLoading: true, personnelError: null });
    try {
      const result = await api.listPersonnel();
      set({ personnel: result.items, personnelLoading: false });
    } catch (error) {
      set({ personnelError: String(error), personnelLoading: false });
    }
  },
  
  // 统计 Actions
  fetchStatistics: async () => {
    try {
      // 获取所有状态的工单统计
      const [newResult, processingResult, pendingResult, completedResult, cancelledResult] = await Promise.all([
        api.listTickets({ status: ['new'], pageSize: 1 }),
        api.listTickets({ status: ['processing'], pageSize: 1 }),
        api.listTickets({ status: ['pending_confirm'], pageSize: 1 }),
        api.listTickets({ status: ['completed'], pageSize: 1 }),
        api.listTickets({ status: ['cancelled'], pageSize: 1 }),
      ]);
      
      set({
        statistics: {
          total: newResult.total + processingResult.total + pendingResult.total + completedResult.total + cancelledResult.total,
          new: newResult.total,
          processing: processingResult.total,
          pendingConfirm: pendingResult.total,
          completed: completedResult.total,
          cancelled: cancelledResult.total,
        },
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  },
  
  // 筛选 Actions
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchTickets();
  },
  
  clearFilters: () => {
    set({ filters: defaultFilters });
    get().fetchTickets();
  },
  
  // 工具方法
  clearError: () => set({ ticketsError: null, personnelError: null }),
  clearCurrentTicket: () => set({ currentTicket: null }),
}));
