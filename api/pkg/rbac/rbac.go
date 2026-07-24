package rbac

import "fmt"

type Role string

const (
	RoleOperator Role = "operator"
	RoleOwner    Role = "owner"
	RoleAdmin    Role = "admin"
	RoleManager  Role = "manager"
	RoleEmployee Role = "employee"
)

type Permission string

const (
	PermUserCreate   Permission = "user:create"
	PermUserRead     Permission = "user:read"
	PermUserUpdate   Permission = "user:update"
	PermUserDelete   Permission = "user:delete"
	PermUserList     Permission = "user:list"

	PermRoleCreate  Permission = "role:create"
	PermRoleRead    Permission = "role:read"
	PermRoleUpdate  Permission = "role:update"
	PermRoleDelete  Permission = "role:delete"
	PermRoleAssign  Permission = "role:assign"
	PermRoleList    Permission = "role:list"

	PermDepartmentCreate Permission = "department:create"
	PermDepartmentRead   Permission = "department:read"
	PermDepartmentUpdate Permission = "department:update"
	PermDepartmentDelete Permission = "department:delete"
	PermDepartmentList   Permission = "department:list"

	PermEmployeeCreate Permission = "employee:create"
	PermEmployeeRead   Permission = "employee:read"
	PermEmployeeUpdate Permission = "employee:update"
	PermEmployeeDelete Permission = "employee:delete"
	PermEmployeeList   Permission = "employee:list"

	PermCustomerCreate Permission = "customer:create"
	PermCustomerRead   Permission = "customer:read"
	PermCustomerUpdate Permission = "customer:update"
	PermCustomerDelete Permission = "customer:delete"
	PermCustomerList   Permission = "customer:list"

	PermProductCreate Permission = "product:create"
	PermProductRead   Permission = "product:read"
	PermProductUpdate Permission = "product:update"
	PermProductDelete Permission = "product:delete"
	PermProductList   Permission = "product:list"

	PermOrderCreate Permission = "order:create"
	PermOrderRead   Permission = "order:read"
	PermOrderUpdate Permission = "order:update"
	PermOrderDelete Permission = "order:delete"
	PermOrderList   Permission = "order:list"

	PermContractCreate Permission = "contract:create"
	PermContractRead   Permission = "contract:read"
	PermContractUpdate Permission = "contract:update"
	PermContractDelete Permission = "contract:delete"
	PermContractList   Permission = "contract:list"

	PermFinanceRead   Permission = "finance:read"
	PermFinanceUpdate Permission = "finance:update"
	PermFinanceList   Permission = "finance:list"

	PermWorkflowCreate Permission = "workflow:create"
	PermWorkflowRead   Permission = "workflow:read"
	PermWorkflowUpdate Permission = "workflow:update"
	PermWorkflowDelete Permission = "workflow:delete"
	PermWorkflowList   Permission = "workflow:list"

	PermSystemConfig  Permission = "system:config"
	PermSystemLogs    Permission = "system:logs"
	PermSystemBackup  Permission = "system:backup"
	PermSystemDebug   Permission = "system:debug"

	PermAll Permission = "*"
)

type PermissionSet map[Permission]bool

var rolePermissions = map[Role]PermissionSet{
	RoleOperator: {
		PermUserRead:     true,
		PermUserList:     true,
		PermRoleRead:     true,
		PermRoleList:     true,
		PermEmployeeRead: true,
		PermEmployeeList: true,
		PermCustomerRead: true,
		PermCustomerList: true,
		PermProductRead:  true,
		PermProductList:  true,
		PermOrderRead:    true,
		PermOrderList:    true,
		PermContractRead: true,
		PermContractList: true,
		PermFinanceRead:  true,
		PermFinanceList:  true,
		PermWorkflowRead: true,
		PermWorkflowList: true,
		PermSystemConfig: true,
		PermSystemLogs:   true,
		PermSystemBackup: true,
		PermSystemDebug:  true,
	},
	RoleOwner: {
		PermUserCreate:   true,
		PermUserRead:     true,
		PermUserUpdate:   true,
		PermUserDelete:   true,
		PermUserList:     true,
		PermRoleCreate:   true,
		PermRoleRead:     true,
		PermRoleUpdate:   true,
		PermRoleDelete:   true,
		PermRoleAssign:   true,
		PermRoleList:     true,
		PermDepartmentCreate: true,
		PermDepartmentRead:   true,
		PermDepartmentUpdate: true,
		PermDepartmentDelete: true,
		PermDepartmentList:   true,
		PermEmployeeCreate: true,
		PermEmployeeRead:   true,
		PermEmployeeUpdate: true,
		PermEmployeeDelete: true,
		PermEmployeeList:   true,
		PermCustomerCreate: true,
		PermCustomerRead:   true,
		PermCustomerUpdate: true,
		PermCustomerDelete: true,
		PermCustomerList:   true,
		PermProductCreate:  true,
		PermProductRead:    true,
		PermProductUpdate:  true,
		PermProductDelete:  true,
		PermProductList:    true,
		PermOrderCreate: true,
		PermOrderRead:   true,
		PermOrderUpdate: true,
		PermOrderDelete: true,
		PermOrderList:   true,
		PermContractCreate: true,
		PermContractRead:   true,
		PermContractUpdate: true,
		PermContractDelete: true,
		PermContractList:   true,
		PermFinanceRead:   true,
		PermFinanceUpdate: true,
		PermFinanceList:   true,
		PermWorkflowCreate: true,
		PermWorkflowRead:   true,
		PermWorkflowUpdate: true,
		PermWorkflowDelete: true,
		PermWorkflowList:   true,
		PermSystemConfig: true,
		PermSystemLogs:   true,
		PermSystemBackup: true,
		PermAll:          true,
	},
	RoleAdmin: {
		PermUserCreate:   true,
		PermUserRead:     true,
		PermUserUpdate:   true,
		PermUserDelete:   true,
		PermUserList:     true,
		PermRoleRead:     true,
		PermRoleList:     true,
		PermRoleAssign:   true,
		PermDepartmentCreate: true,
		PermDepartmentRead:   true,
		PermDepartmentUpdate: true,
		PermDepartmentDelete: true,
		PermDepartmentList:   true,
		PermEmployeeCreate: true,
		PermEmployeeRead:   true,
		PermEmployeeUpdate: true,
		PermEmployeeDelete: true,
		PermEmployeeList:   true,
		PermCustomerRead:   true,
		PermCustomerList:   true,
		PermProductRead:    true,
		PermProductList:    true,
		PermOrderRead:   true,
		PermOrderList:   true,
		PermContractRead:   true,
		PermContractList:   true,
		PermFinanceRead:   true,
		PermFinanceList:   true,
		PermWorkflowRead:   true,
		PermWorkflowList:   true,
		PermSystemLogs: true,
	},
	RoleManager: {
		PermUserRead:     true,
		PermEmployeeCreate: true,
		PermEmployeeRead:   true,
		PermEmployeeUpdate: true,
		PermEmployeeList:   true,
		PermCustomerCreate: true,
		PermCustomerRead:   true,
		PermCustomerUpdate: true,
		PermCustomerList:   true,
		PermProductRead:    true,
		PermProductList:    true,
		PermOrderCreate: true,
		PermOrderRead:   true,
		PermOrderUpdate: true,
		PermOrderList:   true,
		PermContractCreate: true,
		PermContractRead:   true,
		PermContractUpdate: true,
		PermContractList:   true,
		PermFinanceRead:   true,
		PermFinanceList:   true,
		PermWorkflowCreate: true,
		PermWorkflowRead:   true,
		PermWorkflowUpdate: true,
		PermWorkflowList:   true,
	},
	RoleEmployee: {
		PermUserRead:       true,
		PermEmployeeRead:   true,
		PermEmployeeList:   true,
		PermCustomerRead:   true,
		PermCustomerList:   true,
		PermProductRead:    true,
		PermProductList:    true,
		PermOrderRead:      true,
		PermOrderCreate:    true,
		PermOrderList:      true,
		PermContractRead:   true,
		PermContractList:   true,
		PermDepartmentRead: true,
		PermDepartmentList: true,
	},
}

var roleHierarchy = map[Role]int{
	RoleOperator: 100,
	RoleOwner:    80,
	RoleAdmin:    60,
	RoleManager:  40,
	RoleEmployee: 20,
}

func HasPermission(role Role, perm Permission) bool {
	if perms, ok := rolePermissions[role]; ok {
		if perms[PermAll] {
			return true
		}
		return perms[perm]
	}
	return false
}

func HasExactPermission(role Role, perm Permission) bool {
	if perms, ok := rolePermissions[role]; ok {
		return perms[perm]
	}
	return false
}

func HasAnyPermission(role Role, perms ...Permission) bool {
	for _, p := range perms {
		if HasPermission(role, p) {
			return true
		}
	}
	return false
}

func HasAllPermissions(role Role, perms ...Permission) bool {
	for _, p := range perms {
		if !HasPermission(role, p) {
			return false
		}
	}
	return true
}

func GetPermissions(role Role) []Permission {
	perms, ok := rolePermissions[role]
	if !ok {
		return nil
	}
	result := make([]Permission, 0, len(perms))
	for p := range perms {
		if p != PermAll {
			result = append(result, p)
		}
	}
	return result
}

func RoleWeight(role Role) (int, error) {
	if w, ok := roleHierarchy[role]; ok {
		return w, nil
	}
	return 0, fmt.Errorf("unknown role: %s", role)
}

func ValidateRole(r string) (Role, bool) {
	role := Role(r)
	switch role {
	case RoleOperator, RoleOwner, RoleAdmin, RoleManager, RoleEmployee:
		return role, true
	}
	return "", false
}

func HasHigherOrEqualRole(current, target Role) (bool, error) {
	cw, ok := roleHierarchy[current]
	if !ok {
		return false, fmt.Errorf("unknown role: %s", current)
	}
	tw, ok := roleHierarchy[target]
	if !ok {
		return false, fmt.Errorf("unknown role: %s", target)
	}
	return cw >= tw, nil
}

var AllRoles = []Role{RoleOperator, RoleOwner, RoleAdmin, RoleManager, RoleEmployee}
