/**
 * Planner Module
 * Task 65: Story 44.2 - Structured Planner
 */

// Structured Planner Types and Functions
export {
  // Types
  type PlanStepType,
  type PlanStepStatus,
  type ConfirmationType,
  type ToolRequirement,
  type ConfirmationRequirement,
  type StepDependency,
  type PlanStep,
  type PlanStatus,
  type PlanPriority,
  type Plan,
  type PlanGenerationRequest,
  type PlanConstraints,
  type PlanPreferences,
  type PlanGenerationResult,
  type PlanStorage,
  type PlanFilter,

  // Classes
  StructuredPlanner,
  InMemoryPlanStorage,

  // Functions
  generatePlanId,
  generateStepId,
  generatePlanName,
  parseGoalIntoSteps,
  createStepFromGoalPart,
  detectStepType,
  generateStepName,
  extractToolInfo,
  calculatePlanProgress,
  getPlanSummary,
  isPlanTerminal,
  getPendingSteps,
  getFailedSteps,
  createStructuredPlanner,
} from './structuredPlanner'

// Planner Context
export {
  // Context
  PlannerProvider,
  usePlannerContext,
  usePlan,
  usePlanGeneration,
  usePlanExecution,
  useStepManagement,
  usePlanHelpers,

  // Factory Functions
  createWorkbenchPlannerContext,
  createDashboardPlannerContext,

  // Types
  type PlannerContextValue,
  type PlannerProviderProps,
} from './plannerContext'
