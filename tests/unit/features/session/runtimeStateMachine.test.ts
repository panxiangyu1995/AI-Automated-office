/**
 * Runtime State Machine Tests
 * Task 64: Story 44.1 - Agent Runtime State Machine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  RuntimeStateMachine,
  createRuntimeStateMachine,
  VALID_RUNTIME_TRANSITIONS,
  RUNTIME_TRANSITION_TARGETS,
  isRuntimeActive,
  isRuntimeTerminal,
  isRuntimeWaitingForInput,
  getRuntimeStateName,
  calculateOverallProgress,
  getActiveTask,
  getPendingTasksCount,
  getCompletedTasksCount,
  getFailedTasksCount,
  type RuntimeState,
  type RuntimeTransition,
  type StepRecord,
  type TaskRecord,
} from '../../../../src/features/session/runtime/runtimeStateMachine'

// ==================== Test Setup ====================

function createTestMachine(sessionId = 'test-session'): RuntimeStateMachine {
  return createRuntimeStateMachine(sessionId, { persistState: false })
}

function createTestTask(
  machine: RuntimeStateMachine,
  name = 'Test Task',
  priority: TaskRecord['priority'] = 'normal'
): TaskRecord {
  return machine.createTask(name, 'Test task description', priority)
}

function createTestStep(
  machine: RuntimeStateMachine,
  taskId: string,
  name = 'Test Step',
  type: StepRecord['type'] = 'execution'
): StepRecord {
  const step = machine.createStep(taskId, name, type)
  if (!step) throw new Error('Failed to create test step')
  return step
}

// ==================== State Transitions ====================

describe('RuntimeStateMachine - State Transitions', () => {
  let machine: RuntimeStateMachine

  beforeEach(() => {
    machine = createTestMachine()
  })

  describe('initial state', () => {
    it('should start in idle state', () => {
      expect(machine.getState()).toBe('idle')
    })

    it('should not be active initially', () => {
      expect(machine.isActive()).toBe(false)
    })

    it('should not be terminal initially', () => {
      expect(machine.isTerminal()).toBe(false)
    })
  })

  describe('start transition', () => {
    it('should transition from idle to planning on start', () => {
      const result = machine.start('User request')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('planning')
    })

    it('should not allow start from non-idle states', () => {
      machine.start()
      const result = machine.start()
      expect(result).toBe(false)
      expect(machine.getState()).toBe('planning')
    })

    it('should set startedAt timestamp', () => {
      machine.start()
      const context = machine.getContext()
      expect(context.startedAt).toBeDefined()
      expect(typeof context.startedAt).toBe('number')
    })

    it('should clear previous error on start', () => {
      machine.start()
      machine.beginExecution()
      machine.fail('Test error')
      expect(machine.getError()).toBeDefined()

      machine.reset()
      machine.start()
      expect(machine.getError()).toBeUndefined()
    })
  })

  describe('plan transition', () => {
    it('should transition from planning to running', () => {
      machine.start()
      const result = machine.beginExecution()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('running')
    })

    it('should not allow plan from non-planning states', () => {
      const result = machine.beginExecution()
      expect(result).toBe(false)
    })
  })

  describe('pause/resume transitions', () => {
    it('should pause from running state', () => {
      machine.start()
      machine.beginExecution()
      const result = machine.pause('User requested')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('paused')
    })

    it('should not pause from non-running states', () => {
      const result = machine.pause()
      expect(result).toBe(false)
    })

    it('should resume from paused state', () => {
      machine.start()
      machine.beginExecution()
      machine.pause()
      const result = machine.resume()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('running')
    })

    it('should not resume from non-paused states', () => {
      machine.start()
      machine.beginExecution()
      const result = machine.resume()
      expect(result).toBe(false)
    })
  })

  describe('confirmation transitions', () => {
    beforeEach(() => {
      machine.start()
      machine.beginExecution()
    })

    it('should request confirmation from running state', () => {
      const result = machine.requestConfirmation('user', 'Please confirm', ['Yes', 'No'])
      expect(result).toBe(true)
      expect(machine.getState()).toBe('confirming')
    })

    it('should store confirmation details', () => {
      machine.requestConfirmation('permission', 'Allow access?', ['Allow', 'Deny'], 60000)
      const confirmation = machine.getConfirmation()
      expect(confirmation).toBeDefined()
      expect(confirmation?.type).toBe('permission')
      expect(confirmation?.message).toBe('Allow access?')
      expect(confirmation?.options).toEqual(['Allow', 'Deny'])
      expect(confirmation?.timeout).toBe(60000)
    })

    it('should confirm and return to running', () => {
      machine.requestConfirmation('user', 'Confirm?')
      const result = machine.confirm()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('running')
      expect(machine.getConfirmation()).toBeUndefined()
    })

    it('should reject and transition to failed', () => {
      machine.requestConfirmation('user', 'Confirm?')
      const result = machine.reject('User rejected')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('failed')
    })
  })

  describe('complete/finish transitions', () => {
    beforeEach(() => {
      machine.start()
      machine.beginExecution()
    })

    it('should transition to completing on complete', () => {
      const result = machine.complete()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('completing')
    })

    it('should transition to completed on finish', () => {
      machine.complete()
      const result = machine.finish()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('completed')
    })

    it('should not allow finish from non-completing states', () => {
      const result = machine.finish()
      expect(result).toBe(false)
    })
  })

  describe('fail transition', () => {
    it('should fail from planning state', () => {
      machine.start()
      const result = machine.fail('Planning failed')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('failed')
    })

    it('should fail from running state', () => {
      machine.start()
      machine.beginExecution()
      const result = machine.fail('Execution error')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('failed')
    })

    it('should store error information', () => {
      machine.start()
      machine.beginExecution()
      machine.fail('Test error message')
      const error = machine.getError()
      expect(error).toBeDefined()
      expect(error?.message).toBe('Test error message')
      expect(error?.code).toBe('RUNTIME_ERROR')
    })
  })

  describe('cancel transition', () => {
    it('should cancel from planning state', () => {
      machine.start()
      const result = machine.cancel('User cancelled')
      expect(result).toBe(true)
      expect(machine.getState()).toBe('cancelled')
    })

    it('should cancel from running state', () => {
      machine.start()
      machine.beginExecution()
      const result = machine.cancel()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('cancelled')
    })

    it('should cancel from paused state', () => {
      machine.start()
      machine.beginExecution()
      machine.pause()
      const result = machine.cancel()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('cancelled')
    })

    it('should cancel from confirming state', () => {
      machine.start()
      machine.beginExecution()
      machine.requestConfirmation('user', 'Confirm?')
      const result = machine.cancel()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('cancelled')
    })
  })

  describe('timeout transition', () => {
    it('should timeout from running state', () => {
      machine.start()
      machine.beginExecution()
      const result = machine.markTimeout()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('timeout')
    })

    it('should store timeout error', () => {
      machine.start()
      machine.beginExecution()
      machine.markTimeout()
      const error = machine.getError()
      expect(error).toBeDefined()
      expect(error?.code).toBe('TIMEOUT')
    })
  })

  describe('retry transition', () => {
    it('should retry from failed state', () => {
      machine.start()
      machine.fail('Error')
      const result = machine.retry()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('planning')
    })

    it('should not retry from non-failed states', () => {
      machine.start()
      const result = machine.retry()
      expect(result).toBe(false)
    })
  })

  describe('reset transition', () => {
    it('should reset from completed state', () => {
      machine.start()
      machine.beginExecution()
      machine.complete()
      machine.finish()
      const result = machine.reset()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('idle')
    })

    it('should reset from failed state', () => {
      machine.start()
      machine.fail('Error')
      const result = machine.reset()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('idle')
    })

    it('should reset from cancelled state', () => {
      machine.start()
      machine.cancel()
      const result = machine.reset()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('idle')
    })

    it('should reset from timeout state', () => {
      machine.start()
      machine.beginExecution()
      machine.markTimeout()
      const result = machine.reset()
      expect(result).toBe(true)
      expect(machine.getState()).toBe('idle')
    })

    it('should clear context on reset', () => {
      machine.start()
      machine.beginExecution()
      machine.fail('Error')
      machine.reset()
      const context = machine.getContext()
      expect(context.currentTask).toBeUndefined()
      expect(context.currentStep).toBeUndefined()
      expect(context.error).toBeUndefined()
      expect(context.confirmation).toBeUndefined()
    })
  })
})

// ==================== Task Management ====================

describe('RuntimeStateMachine - Task Management', () => {
  let machine: RuntimeStateMachine

  beforeEach(() => {
    machine = createTestMachine()
  })

  describe('createTask', () => {
    it('should create a task with default values', () => {
      const task = machine.createTask('Test Task')
      expect(task).toBeDefined()
      expect(task.name).toBe('Test Task')
      expect(task.status).toBe('pending')
      expect(task.priority).toBe('normal')
      expect(task.steps).toEqual([])
      expect(task.progress).toBe(0)
    })

    it('should create a task with custom priority', () => {
      const task = machine.createTask('High Priority Task', 'Description', 'high')
      expect(task.priority).toBe('high')
    })

    it('should generate unique task IDs', () => {
      const task1 = machine.createTask('Task 1')
      const task2 = machine.createTask('Task 2')
      expect(task1.id).not.toBe(task2.id)
    })

    it('should add task to tasks list', () => {
      machine.createTask('Task 1')
      machine.createTask('Task 2')
      const tasks = machine.getTasks()
      expect(tasks).toHaveLength(2)
    })
  })

  describe('startTask', () => {
    it('should start a pending task', () => {
      const task = createTestTask(machine)
      const result = machine.startTask(task.id)
      expect(result).toBe(true)
      expect(machine.getTask(task.id)?.status).toBe('running')
    })

    it('should set current task', () => {
      const task = createTestTask(machine)
      machine.startTask(task.id)
      expect(machine.getCurrentTask()?.id).toBe(task.id)
    })

    it('should set startedAt timestamp', () => {
      const task = createTestTask(machine)
      machine.startTask(task.id)
      const updatedTask = machine.getTask(task.id)
      expect(updatedTask?.startedAt).toBeDefined()
    })

    it('should return false for non-existent task', () => {
      const result = machine.startTask('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      const task = createTestTask(machine)
      machine.startTask(task.id)
      machine.updateTaskStatus(task.id, 'completed')
      expect(machine.getTask(task.id)?.status).toBe('completed')
    })

    it('should set completedAt for terminal statuses', () => {
      const task = createTestTask(machine)
      machine.startTask(task.id)
      machine.updateTaskStatus(task.id, 'completed')
      const updatedTask = machine.getTask(task.id)
      expect(updatedTask?.completedAt).toBeDefined()
      expect(updatedTask?.duration).toBeDefined()
    })

    it('should store error message', () => {
      const task = createTestTask(machine)
      machine.startTask(task.id)
      machine.updateTaskStatus(task.id, 'failed', 'Task failed')
      expect(machine.getTask(task.id)?.error).toBe('Task failed')
    })
  })

  describe('updateTaskProgress', () => {
    it('should update task progress', () => {
      const task = createTestTask(machine)
      machine.updateTaskProgress(task.id, 50)
      expect(machine.getTask(task.id)?.progress).toBe(50)
    })

    it('should clamp progress to 0-100', () => {
      const task = createTestTask(machine)
      machine.updateTaskProgress(task.id, 150)
      expect(machine.getTask(task.id)?.progress).toBe(100)

      machine.updateTaskProgress(task.id, -10)
      expect(machine.getTask(task.id)?.progress).toBe(0)
    })
  })

  describe('getTask', () => {
    it('should return task by ID', () => {
      const task = createTestTask(machine)
      const found = machine.getTask(task.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(task.id)
    })

    it('should return undefined for non-existent task', () => {
      const found = machine.getTask('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getTasks', () => {
    it('should return copy of tasks array', () => {
      machine.createTask('Task 1')
      machine.createTask('Task 2')
      const tasks = machine.getTasks()
      expect(tasks).toHaveLength(2)
      // Verify it's a copy
      tasks.pop()
      expect(machine.getTasks()).toHaveLength(2)
    })
  })
})

// ==================== Step Management ====================

describe('RuntimeStateMachine - Step Management', () => {
  let machine: RuntimeStateMachine
  let taskId: string

  beforeEach(() => {
    machine = createTestMachine()
    const task = createTestTask(machine)
    taskId = task.id
  })

  describe('createStep', () => {
    it('should create a step with default values', () => {
      const step = machine.createStep(taskId, 'Test Step', 'execution')
      expect(step).toBeDefined()
      expect(step?.name).toBe('Test Step')
      expect(step?.type).toBe('execution')
      expect(step?.status).toBe('pending')
      expect(step?.taskId).toBe(taskId)
    })

    it('should create step with input', () => {
      const input = { query: 'test' }
      const step = machine.createStep(taskId, 'Step', 'planning', input)
      expect(step?.input).toEqual(input)
    })

    it('should assign order based on existing steps', () => {
      machine.createStep(taskId, 'Step 1', 'execution')
      machine.createStep(taskId, 'Step 2', 'execution')
      const step3 = machine.createStep(taskId, 'Step 3', 'execution')
      expect(step3?.order).toBe(2)
    })

    it('should return null for non-existent task', () => {
      const step = machine.createStep('non-existent', 'Step', 'execution')
      expect(step).toBeNull()
    })

    it('should add step to task steps array', () => {
      machine.createStep(taskId, 'Step 1', 'execution')
      machine.createStep(taskId, 'Step 2', 'execution')
      const task = machine.getTask(taskId)
      expect(task?.steps).toHaveLength(2)
    })
  })

  describe('startStep', () => {
    it('should start a pending step', () => {
      const step = createTestStep(machine, taskId)
      const result = machine.startStep(step.id)
      expect(result).toBe(true)
      expect(machine.getStep(step.id)?.status).toBe('running')
    })

    it('should set current step', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      expect(machine.getCurrentStep()?.id).toBe(step.id)
    })

    it('should update task currentStepId', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      const task = machine.getTask(taskId)
      expect(task?.currentStepId).toBe(step.id)
    })

    it('should set startedAt timestamp', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      const updatedStep = machine.getStep(step.id)
      expect(updatedStep?.startedAt).toBeDefined()
    })

    it('should return false for non-existent step', () => {
      const result = machine.startStep('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('completeStep', () => {
    it('should complete a running step', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      const result = machine.completeStep(step.id)
      expect(result).toBe(true)
      expect(machine.getStep(step.id)?.status).toBe('completed')
    })

    it('should store output', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      const output = { result: 'success' }
      machine.completeStep(step.id, output)
      expect(machine.getStep(step.id)?.output).toEqual(output)
    })

    it('should set completedAt and duration', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      machine.completeStep(step.id)
      const updatedStep = machine.getStep(step.id)
      expect(updatedStep?.completedAt).toBeDefined()
      expect(updatedStep?.duration).toBeDefined()
    })

    it('should update task progress', () => {
      const step1 = createTestStep(machine, taskId, 'Step 1')
      const step2 = createTestStep(machine, taskId, 'Step 2')
      machine.startStep(step1.id)
      machine.completeStep(step1.id)
      machine.startStep(step2.id)
      machine.completeStep(step2.id)

      const task = machine.getTask(taskId)
      expect(task?.progress).toBe(100)
    })
  })

  describe('updateStepStatus', () => {
    it('should update step status', () => {
      const step = createTestStep(machine, taskId)
      machine.startStep(step.id)
      machine.updateStepStatus(step.id, 'failed', 'Step error')
      expect(machine.getStep(step.id)?.status).toBe('failed')
      expect(machine.getStep(step.id)?.error).toBe('Step error')
    })
  })

  describe('getStep', () => {
    it('should return step by ID', () => {
      const step = createTestStep(machine, taskId)
      const found = machine.getStep(step.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(step.id)
    })

    it('should return undefined for non-existent step', () => {
      const found = machine.getStep('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getTaskSteps', () => {
    it('should return all steps for a task', () => {
      createTestStep(machine, taskId, 'Step 1')
      createTestStep(machine, taskId, 'Step 2')
      const steps = machine.getTaskSteps(taskId)
      expect(steps).toHaveLength(2)
    })

    it('should return empty array for non-existent task', () => {
      const steps = machine.getTaskSteps('non-existent')
      expect(steps).toEqual([])
    })
  })
})

// ==================== Listeners ====================

describe('RuntimeStateMachine - Listeners', () => {
  let machine: RuntimeStateMachine

  beforeEach(() => {
    machine = createTestMachine()
  })

  describe('state listeners', () => {
    it('should notify state listeners on transition', () => {
      const listener = vi.fn()
      machine.addStateListener(listener)

      machine.start('Test reason')

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          previousState: 'idle',
          newState: 'planning',
          transition: 'start',
          reason: 'Test reason',
        })
      )
    })

    it('should allow multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      machine.addStateListener(listener1)
      machine.addStateListener(listener2)

      machine.start()

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = machine.addStateListener(listener)

      machine.start()
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      machine.beginExecution()
      expect(listener).toHaveBeenCalledTimes(1) // Not called again
    })
  })

  describe('task listeners', () => {
    it('should notify task listeners on status change', () => {
      const listener = vi.fn()
      machine.addTaskListener(listener)

      const task = createTestTask(machine)
      machine.startTask(task.id)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: task.id }),
        'pending'
      )
    })
  })

  describe('step listeners', () => {
    it('should notify step listeners on status change', () => {
      const listener = vi.fn()
      machine.addStepListener(listener)

      const task = createTestTask(machine)
      const step = createTestStep(machine, task.id)
      machine.startStep(step.id)

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: step.id }),
        'pending'
      )
    })
  })
})

// ==================== Helper Functions ====================

describe('Helper Functions', () => {
  describe('isRuntimeActive', () => {
    it('should return true for active states', () => {
      expect(isRuntimeActive('planning')).toBe(true)
      expect(isRuntimeActive('running')).toBe(true)
      expect(isRuntimeActive('confirming')).toBe(true)
      expect(isRuntimeActive('paused')).toBe(true)
      expect(isRuntimeActive('completing')).toBe(true)
    })

    it('should return false for non-active states', () => {
      expect(isRuntimeActive('idle')).toBe(false)
      expect(isRuntimeActive('completed')).toBe(false)
      expect(isRuntimeActive('failed')).toBe(false)
      expect(isRuntimeActive('cancelled')).toBe(false)
      expect(isRuntimeActive('timeout')).toBe(false)
    })
  })

  describe('isRuntimeTerminal', () => {
    it('should return true for terminal states', () => {
      expect(isRuntimeTerminal('completed')).toBe(true)
      expect(isRuntimeTerminal('failed')).toBe(true)
      expect(isRuntimeTerminal('cancelled')).toBe(true)
      expect(isRuntimeTerminal('timeout')).toBe(true)
    })

    it('should return false for non-terminal states', () => {
      expect(isRuntimeTerminal('idle')).toBe(false)
      expect(isRuntimeTerminal('planning')).toBe(false)
      expect(isRuntimeTerminal('running')).toBe(false)
      expect(isRuntimeTerminal('confirming')).toBe(false)
      expect(isRuntimeTerminal('paused')).toBe(false)
      expect(isRuntimeTerminal('completing')).toBe(false)
    })
  })

  describe('isRuntimeWaitingForInput', () => {
    it('should return true for waiting states', () => {
      expect(isRuntimeWaitingForInput('confirming')).toBe(true)
      expect(isRuntimeWaitingForInput('paused')).toBe(true)
    })

    it('should return false for non-waiting states', () => {
      expect(isRuntimeWaitingForInput('idle')).toBe(false)
      expect(isRuntimeWaitingForInput('planning')).toBe(false)
      expect(isRuntimeWaitingForInput('running')).toBe(false)
      expect(isRuntimeWaitingForInput('completed')).toBe(false)
    })
  })

  describe('getRuntimeStateName', () => {
    it('should return display names for all states', () => {
      expect(getRuntimeStateName('idle')).toBe('Idle')
      expect(getRuntimeStateName('planning')).toBe('Planning')
      expect(getRuntimeStateName('running')).toBe('Running')
      expect(getRuntimeStateName('confirming')).toBe('Waiting for Confirmation')
      expect(getRuntimeStateName('paused')).toBe('Paused')
      expect(getRuntimeStateName('completing')).toBe('Completing')
      expect(getRuntimeStateName('completed')).toBe('Completed')
      expect(getRuntimeStateName('failed')).toBe('Failed')
      expect(getRuntimeStateName('cancelled')).toBe('Cancelled')
      expect(getRuntimeStateName('timeout')).toBe('Timeout')
    })
  })

  describe('calculateOverallProgress', () => {
    it('should calculate average progress', () => {
      const tasks = [
        { progress: 50, status: 'running' } as TaskRecord,
        { progress: 100, status: 'completed' } as TaskRecord,
        { progress: 0, status: 'pending' } as TaskRecord,
      ]
      expect(calculateOverallProgress(tasks)).toBe(50)
    })

    it('should return 0 for empty array', () => {
      expect(calculateOverallProgress([])).toBe(0)
    })
  })

  describe('getActiveTask', () => {
    it('should return running or paused task', () => {
      const tasks = [
        { status: 'completed', id: '1' } as TaskRecord,
        { status: 'running', id: '2' } as TaskRecord,
        { status: 'pending', id: '3' } as TaskRecord,
      ]
      const active = getActiveTask(tasks)
      expect(active?.id).toBe('2')
    })

    it('should return undefined when no active task', () => {
      const tasks = [
        { status: 'completed', id: '1' } as TaskRecord,
        { status: 'pending', id: '2' } as TaskRecord,
      ]
      expect(getActiveTask(tasks)).toBeUndefined()
    })
  })

  describe('task count helpers', () => {
    const tasks = [
      { status: 'pending', id: '1' } as TaskRecord,
      { status: 'queued', id: '2' } as TaskRecord,
      { status: 'completed', id: '3' } as TaskRecord,
      { status: 'completed', id: '4' } as TaskRecord,
      { status: 'failed', id: '5' } as TaskRecord,
      { status: 'cancelled', id: '6' } as TaskRecord,
    ]

    it('should count pending tasks', () => {
      expect(getPendingTasksCount(tasks)).toBe(2)
    })

    it('should count completed tasks', () => {
      expect(getCompletedTasksCount(tasks)).toBe(2)
    })

    it('should count failed tasks', () => {
      expect(getFailedTasksCount(tasks)).toBe(2)
    })
  })
})

// ==================== Configuration ====================

describe('RuntimeStateMachine - Configuration', () => {
  it('should accept custom configuration', () => {
    const onStateChange = vi.fn()
    const machine = createRuntimeStateMachine('test-session', {
      persistState: false,
      stateTimeout: 60000,
      onStateChange,
    })

    machine.start()
    expect(onStateChange).toHaveBeenCalled()
  })

  it('should return session ID', () => {
    const machine = createRuntimeStateMachine('custom-session-id')
    expect(machine.getSessionId()).toBe('custom-session-id')
  })
})

// ==================== Valid Transitions Map ====================

describe('Valid Transitions Map', () => {
  it('should have transitions for all states', () => {
    const states: RuntimeState[] = [
      'idle', 'planning', 'running', 'confirming', 'paused',
      'completing', 'completed', 'failed', 'cancelled', 'timeout',
    ]

    for (const state of states) {
      expect(VALID_RUNTIME_TRANSITIONS[state]).toBeDefined()
    }
  })

  it('should have targets for all transitions', () => {
    const transitions: RuntimeTransition[] = [
      'start', 'plan', 'request_confirm', 'confirm', 'reject',
      'pause', 'resume', 'complete', 'finish', 'fail',
      'cancel', 'timeout', 'retry', 'reset',
    ]

    for (const transition of transitions) {
      expect(RUNTIME_TRANSITION_TARGETS[transition]).toBeDefined()
    }
  })
})
