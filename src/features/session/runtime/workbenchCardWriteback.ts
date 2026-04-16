/**
 * Workbench Card Writeback (Story 49.3)
 * Task 86: Write Agent output into workbench card targets.
 *
 * Barrel re-export from sub-modules:
 *  - workbenchCardWritebackTypes.ts      (type definitions)
 *  - workbenchCardWritebackFactories.ts  (ID gen + factories + permissions)
 *  - workbenchCardWritebackExecution.ts  (execution)
 *  - workbenchCardWritebackStore.ts      (store + serialization + debug)
 */

export type {
  CardSize,
  CardVisibility,
  CardStatus,
  CardContainerReference,
  CardReference,
  CardContentType,
  MetricCardContent,
  ChartCardContent,
  ListItem,
  ListCardContent,
  TableCardContent,
  TextCardContent,
  ActionCardContent,
  ImageCardContent,
  CustomCardContent,
  CardContent,
  WorkbenchCard,
  CardUpdateOperation,
  CardWritebackAction,
  CardWritebackContract,
  CardWritebackResult,
  CardWritebackOutcome,
  CardWritebackTrace,
  CardWritebackStore,
} from './workbenchCardWritebackTypes'

export {
  generateCardId,
  generateCardOperationId,
  generateCardActionId,
  generateCardContractId,
  generateCardTraceId,
  createCardContainerReference,
  createCardReference,
  createMetricCardContent,
  createChartCardContent,
  createListCardContent,
  createTableCardContent,
  createTextCardContent,
  createActionCardContent,
  createImageCardContent,
  createCustomCardContent,
  createWorkbenchCard,
  createCardUpdateOperation,
  createCardWritebackAction,
  createCardWritebackContract,
  isContentTypeAllowed,
  checkCardPermission,
  checkVisibilityPermission,
  checkPlacementPermission,
} from './workbenchCardWritebackFactories'

export {
  executeCardOperation,
  executeCardWriteback,
} from './workbenchCardWritebackExecution'

export {
  createCardWritebackStore,
  registerCardContract,
  getCardContract,
  addCardToStore,
  getCardFromStore,
  getCardsByContainer,
  addCardAction,
  getCardAction,
  getCardActionsBySession,
  addCardOutcome,
  getCardOutcome,
  addCardTraces,
  getCardTraces,
  serializeCardContainerRef,
  deserializeCardContainerRef,
  serializeCardRef,
  deserializeCardRef,
  serializeWorkbenchCard,
  deserializeWorkbenchCard,
  serializeCardAction,
  deserializeCardAction,
  serializeCardContract,
  deserializeCardContract,
  serializeCardOutcome,
  deserializeCardOutcome,
  serializeCardWritebackStore,
  deserializeCardWritebackStore,
  formatCardContainerRef,
  formatCardRef,
  formatCardContent,
  formatWorkbenchCard,
  formatCardWritebackResult,
  formatCardWritebackOutcome,
  formatCardTrace,
} from './workbenchCardWritebackStore'
