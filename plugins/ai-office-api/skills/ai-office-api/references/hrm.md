# HRM 人力资源模块

Base: `/api/v1`

## Departments（部门）

### GET /enterprises/:enterprise_id/departments/tree
获取部门树。
- **Auth**: JWT + `department:read`
- **角色**: owner, admin

### POST /enterprises/:enterprise_id/departments
创建部门。
- **Auth**: JWT + `department:create`
- **Body**: `{ "name": "string", "parent_id?": "UUID" }`
- **角色**: owner, admin

### PUT /departments/:id
更新部门。
- **Auth**: JWT + `department:update`
- **Body**: `{ "name?", "manager_id?" }`
- **角色**: owner, admin

### PUT /departments/:id/manager
设置部门经理。
- **Auth**: JWT + `department:update`
- **Body**: `{ "employee_id": "UUID" }`
- **角色**: owner, admin

### DELETE /departments/:id
删除部门。
- **Auth**: JWT + `department:delete`
- **角色**: owner, admin

## Employees（员工）

### POST /enterprises/:enterprise_id/employees
创建员工。
- **Auth**: JWT + `employee:create`
- **Body**: `{ "department_id": "UUID", "name": "string", "email": "string", "phone?": "string", "position?": "string", "employee_no?": "string", "role?": "string", "hire_date?": "date" }`
- **角色**: owner, admin, manager

### POST /enterprises/:enterprise_id/employees/batch-import
批量导入员工。
- **Auth**: JWT + `employee:create`
- **Body**: `{ "employees": [{ "department_id", "name", "email", ... }] }`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/employees
列出员工（分页、可筛选）。
- **Auth**: JWT + `employee:list`
- **Query**: `?page=1&page_size=20&department_id=&role=&status=&search=`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/employees/sales-performance
获取员工销售业绩。
- **Auth**: JWT + `employee:read`
- **Query**: `?employee_id=&start_time=&end_time=`

### GET /employees/:id
获取员工详情。
- **Auth**: JWT + `employee:read`

### PUT /employees/:id
更新员工。
- **Auth**: JWT + `employee:update`
- **Body**: `{ "name?", "email?", "phone?", "position?", "employee_no?", "role?", "status?" }`
- **角色**: owner, admin, manager

### DELETE /employees/:id
删除员工（软删除）。
- **Auth**: JWT + `employee:delete`
- **角色**: owner, admin

### PUT /employees/:id/transfer
员工调岗。
- **Auth**: JWT + `employee:update`
- **Body**: `{ "department_id": "UUID" }`
- **角色**: owner, admin

## Positions（岗位）

### POST /enterprises/:enterprise_id/positions
创建岗位。
- **Auth**: JWT + `employee:create`
- **Body**: `{ "department_id": "UUID", "name": "string", "description?": "string" }`
- **角色**: owner, admin

### GET /enterprises/:enterprise_id/positions
列出岗位。
- **Auth**: JWT + `employee:read`

### PUT /positions/:id
更新岗位。
- **Auth**: JWT + `employee:update`
- **Body**: `{ "name?", "description?" }`
- **角色**: owner, admin

## Employee Permissions（自定义权限）

### POST /employees/:id/permissions
设置员工自定义权限。
- **Auth**: JWT + `role:assign`
- **Body**: `{ "permission": "string", "effect": "allow|deny" }`
- **角色**: owner

### DELETE /employees/:id/permissions
撤销员工自定义权限。
- **Auth**: JWT + `role:assign`
- **Query**: `?permission=xxx`
- **角色**: owner

### GET /employees/:id/permissions
查询员工自定义权限。
- **Auth**: JWT + `role:read`
- **角色**: owner, admin, operator
