package repository

import (
	"reflect"
	"testing"

	"github.com/google/uuid"
)

var tenantScopedRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"EmployeeRepository", (*EmployeeRepository)(nil), "FindByID"},
	{"CustomerRepository", (*CustomerRepository)(nil), "FindByID"},
	{"ContactRepository", (*ContactRepository)(nil), "FindByID"},
	{"OpportunityRepository", (*OpportunityRepository)(nil), "FindByID"},
	{"CustomerLevelRepository", (*CustomerLevelRepository)(nil), "FindByID"},
	{"DepartmentRepository", (*DepartmentRepository)(nil), "FindByID"},
	{"PositionRepository", (*PositionRepository)(nil), "FindByID"},
	{"MaterialRepository", (*MaterialRepository)(nil), "FindByID"},
	{"SupplierRepository", (*SupplierRepository)(nil), "FindByID"},
	{"WarehouseRepository", (*WarehouseRepository)(nil), "FindByID"},
	{"InventoryRepository", (*InventoryRepository)(nil), "FindByID"},
	{"QualityInspectionRepository", (*QualityInspectionRepository)(nil), "FindByID"},
	{"AuditLogRepository", (*AuditLogRepository)(nil), "FindByID"},
	{"BackupConfigRepository", (*BackupConfigRepository)(nil), "FindByID"},
	{"BackupRecordRepository", (*BackupRecordRepository)(nil), "FindByID"},
	{"MessageRepository", (*MessageRepository)(nil), "FindByID"},
	{"FileMetadataRepository", (*FileMetadataRepository)(nil), "FindByID"},
	{"ExportRepository", (*ExportRepository)(nil), "FindTaskByID"},
	{"WorkflowRepository", (*WorkflowRepository)(nil), "FindDefinitionByID"},
	{"WorkflowRepository", (*WorkflowRepository)(nil), "FindInstanceByID"},
}

func TestTenantScopedFindByIDRequiresEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range tenantScopedRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			if method.Type.NumIn() != 2 {
				t.Fatalf("%s.%s has %d params, expected 2 (id uuid.UUID, enterpriseID uuid.UUID)", tc.name, tc.methodName, method.Type.NumIn())
			}
			if method.Type.In(0) != uuidType {
				t.Errorf("%s.%s param[0] = %v, want uuid.UUID (id)", tc.name, tc.methodName, method.Type.In(0))
			}
			if method.Type.In(1) != uuidType {
				t.Errorf("%s.%s param[1] = %v, want uuid.UUID (enterpriseID)", tc.name, tc.methodName, method.Type.In(1))
			}
		})
	}
}

var platformRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"UserRepository", (*UserRepository)(nil), "FindByID"},
	{"EnterpriseRepository", (*EnterpriseRepository)(nil), "FindByID"},
	{"GroupRepository", (*GroupRepository)(nil), "FindByID"},
}

func TestPlatformFindByIDDoesNotRequireEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range platformRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			if method.Type.NumIn() != 1 {
				t.Errorf("%s.%s has %d params, expected 1 (id) — platform repos must NOT require enterpriseID", tc.name, tc.methodName, method.Type.NumIn())
			}
			if method.Type.NumIn() >= 1 && method.Type.In(0) != uuidType {
				t.Errorf("%s.%s param[0] = %v, want uuid.UUID", tc.name, tc.methodName, method.Type.In(0))
			}
		})
	}
}

func TestCrossEnterpriseRepoUsesSourceEnterpriseID(t *testing.T) {
	ifaceType := reflect.TypeOf((*CrossEnterpriseRepository)(nil)).Elem()
	method, ok := ifaceType.MethodByName("FindByID")
	if !ok {
		t.Fatal("FindByID not found on CrossEnterpriseRepository")
	}
	uuidType := reflect.TypeOf(uuid.UUID{})
	if method.Type.NumIn() != 2 {
		t.Fatalf("CrossEnterpriseRepository.FindByID has %d params, expected 2 (id, source_enterprise_id)", method.Type.NumIn())
	}
	if method.Type.In(1) != uuidType {
		t.Errorf("CrossEnterpriseRepository.FindByID param[1] = %v, want uuid.UUID (source_enterprise_id)", method.Type.In(1))
	}
}

var tenantScopedDeleteRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"CustomerRepository", (*CustomerRepository)(nil), "Delete"},
	{"EmployeeRepository", (*EmployeeRepository)(nil), "Delete"},
	{"DepartmentRepository", (*DepartmentRepository)(nil), "Delete"},
	{"ContactRepository", (*ContactRepository)(nil), "Delete"},
	{"WarehouseRepository", (*WarehouseRepository)(nil), "Delete"},
	{"MaterialRepository", (*MaterialRepository)(nil), "Delete"},
	{"SupplierRepository", (*SupplierRepository)(nil), "Delete"},
	{"OpportunityRepository", (*OpportunityRepository)(nil), "Delete"},
	{"CustomerLevelRepository", (*CustomerLevelRepository)(nil), "Delete"},
	{"CustomerTagRepository", (*CustomerTagRepository)(nil), "Delete"},
	{"EmployeePermissionRepository", (*EmployeePermissionRepository)(nil), "Delete"},
	{"BackupConfigRepository", (*BackupConfigRepository)(nil), "Delete"},
	{"FeatureFlagRepository", (*FeatureFlagRepository)(nil), "Delete"},
	{"FileMetadataRepository", (*FileMetadataRepository)(nil), "Delete"},
	{"CrossEnterpriseRepository", (*CrossEnterpriseRepository)(nil), "Delete"},
	{"PaymentPlanRepository", (*PaymentPlanRepository)(nil), "Delete"},
}

func TestTenantScopedDeleteRequiresEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range tenantScopedDeleteRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			if method.Type.NumIn() < 2 {
				t.Fatalf("%s.%s has %d params, expected at least 2 (must include enterpriseID)", tc.name, tc.methodName, method.Type.NumIn())
			}
			lastParam := method.Type.In(method.Type.NumIn() - 1)
			if lastParam != uuidType {
				t.Errorf("%s.%s last param = %v, want uuid.UUID (enterpriseID)", tc.name, tc.methodName, lastParam)
			}
		})
	}
}

var tenantScopedDeleteByRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"CustomerTagRepository", (*CustomerTagRepository)(nil), "DeleteByCustomerAndTag"},
	{"EmployeePermissionRepository", (*EmployeePermissionRepository)(nil), "DeleteByEmployeeAndPermission"},
}

func TestTenantScopedDeleteByRequiresEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range tenantScopedDeleteByRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			lastParam := method.Type.In(method.Type.NumIn() - 1)
			if lastParam != uuidType {
				t.Errorf("%s.%s last param = %v, want uuid.UUID (enterpriseID)", tc.name, tc.methodName, lastParam)
			}
		})
	}
}

var tenantScopedModelDeleteRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"ContractRepository", (*ContractRepository)(nil), "Delete"},
	{"ServiceOrderRepository", (*ServiceOrderRepository)(nil), "Delete"},
	{"PaymentRequestRepository", (*PaymentRequestRepository)(nil), "Delete"},
}

func TestTenantScopedModelDeleteRequiresEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range tenantScopedModelDeleteRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			if method.Type.NumIn() != 2 {
				t.Fatalf("%s.%s has %d params, expected 2 (model, enterpriseID)", tc.name, tc.methodName, method.Type.NumIn())
			}
			lastParam := method.Type.In(method.Type.NumIn() - 1)
			if lastParam != uuidType {
				t.Errorf("%s.%s last param = %v, want uuid.UUID (enterpriseID)", tc.name, tc.methodName, lastParam)
			}
		})
	}
}

var tenantScopedSpecialDeleteRepos = []struct {
	name       string
	iface      interface{}
	methodName string
}{
	{"RoleRepository", (*RoleRepository)(nil), "DeleteRole"},
	{"EmployeePermissionABACRepository", (*EmployeePermissionABACRepository)(nil), "Delete"},
	{"CustomRuleRepository", (*CustomRuleRepository)(nil), "Delete"},
	{"CustomFieldRepository", (*CustomFieldRepository)(nil), "DeleteField"},
	{"RelationRepository", (*RelationRepository)(nil), "DeleteRelation"},
	{"WorkflowRepository", (*WorkflowRepository)(nil), "DeleteDefinition"},
}

func TestTenantScopedSpecialDeleteRequiresEnterpriseID(t *testing.T) {
	uuidType := reflect.TypeOf(uuid.UUID{})
	for _, tc := range tenantScopedSpecialDeleteRepos {
		t.Run(tc.name+"."+tc.methodName, func(t *testing.T) {
			ifaceType := reflect.TypeOf(tc.iface).Elem()
			method, ok := ifaceType.MethodByName(tc.methodName)
			if !ok {
				t.Fatalf("method %s not found on %s", tc.methodName, tc.name)
			}
			lastParam := method.Type.In(method.Type.NumIn() - 1)
			if lastParam != uuidType {
				t.Errorf("%s.%s last param = %v, want uuid.UUID (enterpriseID)", tc.name, tc.methodName, lastParam)
			}
		})
	}
}
