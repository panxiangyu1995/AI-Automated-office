import { z } from 'zod'

export const commonSchemas = {
  requiredString: (minLen: number = 1, maxLen: number = 255) =>
    z.string().min(minLen, `不能为空`).max(maxLen, `最多${maxLen}个字符`),

  email: z.string().email('请输入有效的邮箱地址'),

  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),

  optionalString: z.string().optional().or(z.literal('')),

  positiveNumber: z.number().positive('必须为正数'),

  nonEmptyArray: <T>(schema: z.ZodType<T>) => z.array(schema).min(1, '至少选择一项'),

  dateRange: z.object({
    start: z.string().min(1, '请选择开始日期'),
    end: z.string().min(1, '请选择结束日期'),
  }),

  pagination: z.object({
    page: z.number().int().positive().default(1),
    page_size: z.number().int().positive().max(100).default(20),
  }),
}

export function createFormSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape)
}

export type FormSchemaType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T>>
