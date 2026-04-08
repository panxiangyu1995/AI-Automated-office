/**
 * Template Engine
 * 
 * Story 22.1 - Editor RichText/Markdown Support
 * FR1201-FR1212
 * 
 * Dynamic template rendering engine with variable substitution.
 */

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  description?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any
  required?: boolean
}

export interface Template {
  id: string
  name: string
  description?: string
  content: string
  variables: TemplateVariable[]
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface RenderOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: Record<string, any>
  strict?: boolean
  dateFormat?: string
  nullValue?: string
}

export interface RenderResult {
  success: boolean
  content: string
  errors: string[]
  warnings: string[]
}

export class TemplateEngine {
  private templates: Map<string, Template> = new Map()
  private dateFormat: string = 'YYYY-MM-DD'

  /**
   * Register a template
   */
  register(template: Template): void {
    this.templates.set(template.id, template)
  }

  /**
   * Unregister a template
   */
  unregister(id: string): boolean {
    return this.templates.delete(id)
  }

  /**
   * Get a template by ID
   */
  get(id: string): Template | undefined {
    return this.templates.get(id)
  }

  /**
   * Get all templates
   */
  getAll(): Template[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by category
   */
  getByCategory(category: string): Template[] {
    return this.getAll().filter(t => t.category === category)
  }

  /**
   * Render a template with variables
   */
  render(templateId: string, options: RenderOptions): RenderResult {
    const template = this.templates.get(templateId)
    
    if (!template) {
      return {
        success: false,
        content: '',
        errors: [`Template not found: ${templateId}`],
        warnings: [],
      }
    }

    const errors: string[] = []
    const warnings: string[] = []
    const variables = options.variables || {}
    const strict = options.strict ?? false
    const nullValue = options.nullValue ?? ''

    // Check required variables
    for (const varDef of template.variables) {
      if (varDef.required && !(varDef.name in variables)) {
        if (strict) {
          errors.push(`Required variable missing: ${varDef.name}`)
        } else {
          warnings.push(`Required variable missing: ${varDef.name}`)
        }
      }
    }

    // Replace variables in content
    let content = template.content

    // Replace {{variable}} patterns
    content = content.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, varPath) => {
      const value = this.resolvePath(variables, varPath)
      
      if (value === undefined || value === null) {
        if (strict && !template.variables.some(v => v.name === varPath)) {
          errors.push(`Unknown variable: ${varPath}`)
        }
        return nullValue
      }
      
      return this.formatValue(value, options.dateFormat || this.dateFormat)
    })

    // Replace conditional blocks {{#if condition}}...{{/if}}
    content = content.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, innerContent) => {
      const value = this.resolvePath(variables, condition)
      const isTruthy = Boolean(value) && value !== null && value !== undefined
      
      if (!isTruthy) {
        return ''
      }
      
      // Also handle {{else}}
      return innerContent.replace(/\{\{else\}\}/g, '')
    })

    // Replace {{else}} (remove if preceding condition was true)
    content = content.replace(/\{\{#if[\s\S]*?\}\}[\s\S]*?\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, (match) => {
      return match.replace(/\{\{else\}\}[\s\S]*$/, '')
    })

    // Replace loops {{#each array}}...{{/each}}
    content = content.replace(/\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, itemTemplate) => {
      const array = this.resolvePath(variables, arrayPath)
      
      if (!Array.isArray(array)) {
        warnings.push(`Variable ${arrayPath} is not an array`)
        return ''
      }
      
      const results: string[] = []
      for (const item of array) {
        let itemContent = itemTemplate
        
        // Replace {{this}} with current item
        if (typeof item === 'object') {
          itemContent = itemContent.replace(/\{\{this\.(\w+)\}\}/g, (_: string, prop: string) => {
            return item[prop as keyof typeof item] !== undefined ? String(item[prop as keyof typeof item]) : ''
          })
          itemContent = itemContent.replace(/\{\{this\}\}/g, JSON.stringify(item))
        } else {
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
        }
        
        results.push(itemContent)
      }
      
      return results.join('')
    })

    // Replace default values {{variable|default}}
    content = content.replace(/\{\{(\w+(?:\.\w+)*)\|([^{}]+)\}\}/g, (match, varPath, defaultValue) => {
      const value = this.resolvePath(variables, varPath)
      return value !== undefined && value !== null ? String(value) : defaultValue
    })

    // Apply filters {{variable|filter}}
    content = content.replace(/\{\{(\w+(?:\.\w+)*)\|(\w+)\}\}/g, (match, varPath, filter) => {
      const value = this.resolvePath(variables, varPath)
      if (value === undefined || value === null) return ''
      
      return this.applyFilter(String(value), filter)
    })

    return {
      success: errors.length === 0,
      content,
      errors,
      warnings,
    }
  }

  /**
   * Resolve nested path in object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolvePath(obj: Record<string, any>, path: string): any {
    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  /**
   * Format value based on type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatValue(value: any, dateFormat: string): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    if (value instanceof Date) {
      return this.formatDate(value, dateFormat)
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  /**
   * Format date
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  /**
   * Apply filter to value
   */
  private applyFilter(value: string, filter: string): string {
    switch (filter) {
      case 'uppercase':
        return value.toUpperCase()
      case 'lowercase':
        return value.toLowerCase()
      case 'capitalize':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      case 'trim':
        return value.trim()
      case 'length':
        return String(value.length)
      case 'json':
        try {
          return JSON.stringify(JSON.parse(value))
        } catch {
          return value
        }
      default:
        return value
    }
  }

  /**
   * Validate template syntax
   */
  validate(template: Template): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for unclosed braces
    const openBraces = (template.content.match(/\{\{/g) || []).length
    const closeBraces = (template.content.match(/\}\}/g) || []).length
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces in template')
    }
    
    // Check for invalid variable references
    const varPattern = /\{\{(\w+(?:\.\w+)*)\}\}/g
    let match
    while ((match = varPattern.exec(template.content)) !== null) {
      const varName = match[1]
      if (!template.variables.some(v => v.name === varName)) {
        errors.push(`Reference to undefined variable: ${varName}`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Default template engine instance
export const templateEngine = new TemplateEngine()

// Predefined templates
export function initializeDefaultTemplates(): void {
  // 日报模板
  templateEngine.register({
    id: 'daily-report',
    name: '日报模板',
    description: '每日工作汇报模板',
    category: 'work',
    variables: [
      { name: 'date', type: 'date', description: '日期', required: true },
      { name: 'author', type: 'string', description: '汇报人', required: true },
      { name: 'tasks', type: 'array', description: '今日完成的任务' },
      { name: 'tomorrow', type: 'string', description: '明日计划' },
      { name: 'issues', type: 'string', description: '遇到的问题' },
    ],
    content: `# 日报 - {{date}}

## 汇报人
{{author}}

## 今日完成
{{#each tasks}}
- {{this}}
{{/each}}

## 明日计划
{{tomorrow}}

## 遇到的问题
{{issues}}
`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 周报模板
  templateEngine.register({
    id: 'weekly-report',
    name: '周报模板',
    description: '每周工作汇报模板',
    category: 'work',
    variables: [
      { name: 'weekStart', type: 'date', description: '周开始日期', required: true },
      { name: 'weekEnd', type: 'date', description: '周结束日期', required: true },
      { name: 'author', type: 'string', description: '汇报人', required: true },
      { name: 'summary', type: 'string', description: '本周总结' },
      { name: 'achievements', type: 'array', description: '本周成就' },
      { name: 'nextWeek', type: 'array', description: '下周计划' },
    ],
    content: `# 周报 - {{weekStart}} 至 {{weekEnd}}

## 汇报人
{{author}}

## 本周总结
{{summary}}

## 本周成就
{{#each achievements}}
1. {{this}}
{{/each}}

## 下周计划
{{#each nextWeek}}
- {{this}}
{{/each}}
`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}
