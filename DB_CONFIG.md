# 数据库配置文档

## 概述

本项目使用 PostgreSQL 作为主数据库，数据库名称为 `ai_office`。

---

## 连接配置

| 配置项 | 值 |
|--------|-----|
| **主机** | localhost |
| **端口** | 5432 |
| **数据库名** | ai_office |
| **用户名** | postgres |
| **密码** | postgres (本地trust模式) |
| **SSL模式** | disable |

### 环境变量配置

在 `.env` 文件中配置：

```env
DB_PASSWORD=postgres
```

---

## 数据库管理

### 客户端工具

- **Windows**: `J:\PostgreSQL\bin\psql.exe`
- **macOS/Linux**: `psql`

### 连接示例

```bash
# Windows
J:\PostgreSQL\bin\psql.exe -U postgres -h localhost -d ai_office

# 或使用环境变量
set PGPASSWORD=postgres
psql -U postgres -h localhost -d ai_office
```

---

## 数据库管理

### 常用命令

```sql
-- 查看所有数据库
\l

-- 切换到项目数据库
\c ai_office

-- 查看所有表
\dt

-- 查看表结构
\d table_name

-- 查看数据
SELECT * FROM table_name LIMIT 10;
```

### 迁移管理

迁移脚本位于 `cloud-server/migrations/` 目录。

**手动执行迁移：**

```bash
# 执行所有迁移
for f in cloud-server/migrations/*.up.sql; do
  psql -U postgres -h localhost -d ai_office -f "$f"
done

# 或逐个执行
psql -U postgres -h localhost -d ai_office -f cloud-server/migrations/001_init_schema.up.sql
```

**回滚迁移：**

```bash
psql -U postgres -h localhost -d ai_office -f cloud-server/migrations/001_init_schema.down.sql
```

---

## 数据字典

### 核心表

| 表名 | 说明 |
|------|------|
| `tenants` | 租户表 |
| `users` | 用户表 |
| `roles` | 角色表 |
| `permissions` | 权限表 |
| `departments` | 部门表 |
| `sessions` | 会话表 |
| `positions` | 职位表 |

### 消息相关表

| 表名 | 说明 |
|------|------|
| `messages` | 消息表 |
| `group_messages` | 群组消息表 |
| `message_status` | 消息状态表 |
| `message_audit_logs` | 消息审计日志 |

### 审计相关表

| 表名 | 说明 |
|------|------|
| `audit_logs` | 审计日志表 |
| `login_attempts` | 登录尝试表 |
| `announcements` | 公告表 |
| `announcement_reads` | 公告阅读记录 |

---

## 测试账号

迁移脚本会创建默认角色，管理员账号需要手动创建：

```sql
-- 创建管理员用户（需要先设置密码哈希）
INSERT INTO users (tenant_id, email, password_hash, name)
VALUES (
  (SELECT id FROM tenants LIMIT 1),
  'admin@ai-office.local',
  'your_password_hash',
  '管理员'
);
```

---

## 备份与恢复

### 备份

```bash
pg_dump -U postgres -h localhost -d ai_office > ai_office_backup.sql
```

### 恢复

```bash
psql -U postgres -h localhost -d ai_office < ai_office_backup.sql
```

---

## 故障排除

### 连接被拒绝

检查 PostgreSQL 服务是否运行：

```powershell
Get-Service -Name 'postgresql-x64-16'
```

### 密码认证失败

本地开发环境可临时修改 `pg_hba.conf` 为 trust 模式：

```conf
# 修改
host    all    all    127.0.0.1/32    trust
host    all    all    ::1/128         trust

# 重启服务
Restart-Service -Name 'postgresql-x64-16'
```
