# Specification: 统一消息通知系统

## 需求来源

### PRD 需求
- FR44: 用户可以发送和接收消息
- FR45: 用户可以接收系统公告
- FR46: 用户可以查看未读消息提醒
- FR47: 用户可以设置免打扰模式
- FR48: 用户可以管理消息订阅

### 架构约束
- ARCH-01: 分层微内核架构

### UX 规范
- UX-01: VSCode 风格四栏布局
- UX-04: 自然语言交互优先

## 功能规格

### 用户故事

As a 用户,
I want 接收和管理消息通知,
So that 不错过重要信息并保持专注。

### 验收场景

#### Scenario 1: 接收新消息
- **GIVEN** 用户已登录
- **WHEN** 系统发送新消息
- **THEN** 用户看到未读提醒，消息在列表中

#### Scenario 2: 免打扰模式
- **GIVEN** 用户设置了免打扰时间
- **WHEN** 在免打扰时间内收到消息
- **THEN** 消息不推送，但在列表中可见

## 数据规格

### 消息输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| type | string | 是 | system/approval/task/mention/chat |
| title | string | 是 | 1-100字符 |
| content | string | 是 | 1-2000字符 |
| recipientId | string | 是 | 用户/部门ID |
| recipientType | string | 是 | user/department/all |
| priority | string | 否 | low/normal/high/urgent |
