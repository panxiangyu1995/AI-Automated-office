/**
 * WorkCard API 封装
 * Story 24.1 - 工作卡片消息系统
 *
 * 封装 Tauri 命令，提供工作卡片 CRUD、操作和模板功能
 */

import { safeInvoke } from '@/lib/tauri'
import type {
  WorkCard,
  WorkCardTemplate,
  CardStatus,
  CardPriority,
  CardActionType,
  CreateCardRequest,
} from '../types/workcard.types'

// ==================== Card CRUD API ====================

/**
 * 创建工作卡片
 */
export async function createWorkCard(request: CreateCardRequest): Promise<WorkCard> {
  const result = await safeInvoke<WorkCard>('create_work_card', {
    title: request.title,
    cardType: request.card_type,
    priority: request.priority,
    senderId: request.sender_id,
    senderName: request.sender_name,
    fields: request.fields,
    actions: request.actions,
  })
  return result ?? ({} as WorkCard)
}

/**
 * 获取工作卡片
 */
export async function getWorkCard(cardId: string): Promise<WorkCard | null> {
  const result = await safeInvoke<WorkCard | null>('get_work_card', { cardId })
  return result ?? null
}

/**
 * 列出所有工作卡片
 */
export async function listWorkCards(): Promise<WorkCard[]> {
  const result = await safeInvoke<WorkCard[]>('list_work_cards')
  return result ?? []
}

/**
 * 删除工作卡片
 */
export async function deleteWorkCard(cardId: string): Promise<boolean> {
  const result = await safeInvoke<boolean>('delete_work_card', { cardId })
  return result ?? false
}

// ==================== Action API ====================

/**
 * 执行卡片操作
 */
export async function executeCardAction(
  cardId: string,
  actionId: string,
  actorId: string,
  actorName: string
): Promise<{ type: string; message: string }> {
  const result = await safeInvoke<{ type: string; message: string }>('execute_card_action', {
    cardId,
    actionId,
    actorId,
    actorName,
  })
  return result ?? { type: '', message: '' }
}

// ==================== Template API ====================

/**
 * 从模板生成工作卡片
 */
export async function generateCardFromTemplate(
  templateId: string,
  title: string,
  senderId: string,
  senderName: string,
  context: Record<string, string>
): Promise<WorkCard> {
  const result = await safeInvoke<WorkCard>('generate_card_from_template', {
    templateId,
    title,
    senderId,
    senderName,
    context,
  })
  return result ?? ({} as WorkCard)
}

/**
 * 列出所有卡片模板
 */
export async function listCardTemplates(): Promise<WorkCardTemplate[]> {
  const result = await safeInvoke<WorkCardTemplate[]>('list_card_templates')
  return result ?? []
}

// ==================== Utility API ====================

/**
 * 获取卡片状态列表
 */
export async function getCardStatuses(): Promise<CardStatus[]> {
  const result = await safeInvoke<CardStatus[]>('get_card_statuses')
  return result ?? []
}

/**
 * 获取卡片优先级列表
 */
export async function getCardPriorities(): Promise<CardPriority[]> {
  const result = await safeInvoke<CardPriority[]>('get_card_priorities')
  return result ?? []
}

/**
 * 获取卡片操作类型列表
 */
export async function getCardActionTypes(): Promise<CardActionType[]> {
  const result = await safeInvoke<CardActionType[]>('get_card_action_types')
  return result ?? []
}

// ==================== API 汇总导出 ====================

export const workcardApi = {
  // Card CRUD
  createCard: createWorkCard,
  getCard: getWorkCard,
  listCards: listWorkCards,
  deleteCard: deleteWorkCard,

  // Actions
  executeAction: executeCardAction,

  // Templates
  generateFromTemplate: generateCardFromTemplate,
  listTemplates: listCardTemplates,

  // Utilities
  getStatuses: getCardStatuses,
  getPriorities: getCardPriorities,
  getActionTypes: getCardActionTypes,
}
