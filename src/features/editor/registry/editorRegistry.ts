import type { ReactNode } from 'react'
import type { WorkbenchPageContext } from '@/components/common'

export interface EditorDescriptor {
  id: string
  label: string
  priority: number
  matches: (resourceId: string) => boolean
  render: (context: WorkbenchPageContext) => ReactNode
}

interface RegisteredEditorDescriptor {
  descriptor: EditorDescriptor
  order: number
}

export class EditorRegistry {
  private descriptors: RegisteredEditorDescriptor[] = []
  private registrationOrder = 0
  private readonly fallbackDescriptor: EditorDescriptor

  constructor(fallbackDescriptor: EditorDescriptor) {
    this.fallbackDescriptor = fallbackDescriptor
  }

  register(descriptor: EditorDescriptor) {
    const existingIndex = this.descriptors.findIndex((item) => item.descriptor.id === descriptor.id)
    if (existingIndex >= 0) {
      this.descriptors[existingIndex] = {
        descriptor,
        order: this.descriptors[existingIndex].order,
      }
      return
    }

    this.descriptors.push({
      descriptor,
      order: this.registrationOrder,
    })
    this.registrationOrder += 1
  }

  resolve(resourceId: string): EditorDescriptor {
    const matches = this.descriptors
      .filter((item) => item.descriptor.matches(resourceId))
      .sort((left, right) => {
        if (left.descriptor.priority !== right.descriptor.priority) {
          return right.descriptor.priority - left.descriptor.priority
        }

        return left.order - right.order
      })

    return matches.at(0)?.descriptor ?? this.fallbackDescriptor
  }

  list(): EditorDescriptor[] {
    return this.descriptors
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((item) => item.descriptor)
  }
}

