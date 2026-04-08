/**
 * WorkCard API 封装
 * Story 24.1 - 工作卡片消息系统
 *
 * 封装 Tauri 命令，提供工作卡片 CRUD、操作和模板功能
 */

import { invoke } from '@tauri-apps/api/core'
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
  return invoke('create_work_card', {
    title: request.title,
    cardType: request.card_type,
    priority: request.priority,
    senderId: request.sender_id,
    senderName: request.sender_name,
    fields: request.fields,
    actions: request.actions,
  })
}

/**
 * 获取工作卡片
 */
export async function getWorkCard(cardId: string): Promise<WorkCard | null> {
  return invoke('get_work_card', { cardId })
}

/**
 * 列出所有工作卡片
 */
export async function listWorkCards(): Promise<WorkCard[]> {
  return invoke('list_work_cards')
}

/**
 * 删除工作卡片
 */
export async function deleteWorkCard(cardId: string): Promise<boolean> {
  return invoke('delete_work_card', { cardId })
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
  return invoke('execute_card_action', {
    cardId,
    actionId,
    actorId,
    actorName,
  })
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
  return invoke('generate_card_from_template', {
    templateId,
    title,
    senderId,
    senderName,
    context,
  })
}

/**
 * 列出所有卡片模板
 */
export async function listCardTemplates(): Promise<WorkCardTemplate[]> {
  return invoke('list_card_templates')
}

// ==================== Utility API ====================

/**
 * 获取卡片状态列表
 */
export async function getCardStatuses(): Promise<CardStatus[]> {
  return invoke('get_card_statuses')
}

/**
 * 获取卡片优先级列表
 */
export async function getCardPriorities(): Promise<CardPriority[]> {
  return invoke('get_card_priorities')
}

/**
 * 获取卡片操作类型列表
 */
export async function getCardActionTypes(): Promise<CardActionType[]> {
  return invoke('get_card_action_types')
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
