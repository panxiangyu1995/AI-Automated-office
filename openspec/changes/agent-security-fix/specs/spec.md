# Agent模块安全漏洞修复 - 规格说明

## Spec

### 1. XSS防护规格

| 项目 | 规格 |
|------|------|
| 输入 | markdown渲染后的HTML字符串 |
| 处理 | sanitize-html过滤 |
| 输出 | 安全的HTML字符串 |
| 允许标签 | h1-h6, p, br, hr, ul, ol, li, blockquote, pre, code, em, strong, a, img, table |
| 允许属性 | href, title, target, src, alt, class |
| 允许协议 | http, https, mailto |

### 2. SQL安全规格

| 项目 | 规格 |
|------|------|
| 查询方式 | 参数化查询 (?占位符) |
| 绑定方式 | sqlx bind()方法 |
| 禁止 | format!宏拼接SQL |

### 3. 存储安全规格

| 项目 | 规格 |
|------|------|
| 检查点数据 | 评估后决定存储方式 |
| 敏感字段 | 使用Tauri secure storage |
| 非敏感字段 | localStorage (添加注释) |

---

## 验收测试用例

### XSS测试用例

| 输入 | 期望输出 |
|------|---------|
| `<script>alert(1)</script>` | 脚本被移除 |
| `<img src=x onerror=alert(1)>` | onerror属性被移除 |
| `<a href="javascript:alert(1)">` | javascript:协议被禁止 |
| `<p>正常内容</p>` | 内容保留 |

### SQL测试用例

| 输入 | 期望结果 |
|------|---------|
| `'; DROP TABLE users; --` | 作为普通字符串处理，不执行 |
| `name=' OR 1=1 --` | 作为普通字符串处理 |
