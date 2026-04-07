# Design: MVP最终集成测试

## 测试计划

### 1. P0核心功能测试

| 模块 | 测试用例 | 预期结果 |
|------|----------|----------|
| Agent-to-Agent | 消息发送接收 | 正常 |
| 群聊 | 邀请/移除成员 | 正常 |
| 审批委托 | 设置/取消委托 | 正常 |
| 检查点 | 创建/回滚 | 正常 |

### 2. E2E测试用例

```typescript
test('complete approval workflow', async ({ page }) => {
  await page.goto('/approval');
  await page.click('text=新建审批');
  await page.fill('amount', '1000');
  await page.click('text=提交');
  await expect(page.locator('text=提交成功')).toBeVisible();
});
```
