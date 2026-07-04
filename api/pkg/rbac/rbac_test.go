package rbac

import (
	"testing"
)

func TestValidateRole(t *testing.T) {
	tests := []struct {
		input string
		want  Role
		valid bool
	}{
		{"operator", RoleOperator, true},
		{"owner", RoleOwner, true},
		{"admin", RoleAdmin, true},
		{"manager", RoleManager, true},
		{"employee", RoleEmployee, true},
		{"superadmin", "", false},
		{"", "", false},
		{"admin ", "", false},
	}
	for _, tt := range tests {
		got, ok := ValidateRole(tt.input)
		if ok != tt.valid || got != tt.want {
			t.Errorf("ValidateRole(%q) = (%q, %v), want (%q, %v)", tt.input, got, ok, tt.want, tt.valid)
		}
	}
}

func TestHasPermission_Operator(t *testing.T) {
	if !HasPermission(RoleOperator, PermSystemConfig) {
		t.Error("operator should have system:config")
	}
	if HasPermission(RoleOperator, PermUserCreate) {
		t.Error("operator should NOT have user:create")
	}
}

func TestHasPermission_Owner(t *testing.T) {
	if !HasPermission(RoleOwner, PermUserCreate) {
		t.Error("owner should have user:create")
	}
	if !HasPermission(RoleOwner, PermSystemConfig) {
		t.Error("owner should have system:config")
	}
}

func TestHasPermission_Admin(t *testing.T) {
	if !HasPermission(RoleAdmin, PermUserCreate) {
		t.Error("admin should have user:create")
	}
	if !HasPermission(RoleAdmin, PermRoleRead) {
		t.Error("admin should have role:read")
	}
	if HasPermission(RoleAdmin, PermRoleCreate) {
		t.Error("admin should NOT have role:create")
	}
	if HasPermission(RoleAdmin, PermSystemConfig) {
		t.Error("admin should NOT have system:config")
	}
}

func TestHasPermission_Manager(t *testing.T) {
	if !HasPermission(RoleManager, PermEmployeeCreate) {
		t.Error("manager should have employee:create")
	}
	if !HasPermission(RoleManager, PermOrderCreate) {
		t.Error("manager should have order:create")
	}
	if HasPermission(RoleManager, PermUserCreate) {
		t.Error("manager should NOT have user:create")
	}
	if HasPermission(RoleManager, PermSystemConfig) {
		t.Error("manager should NOT have system:config")
	}
}

func TestHasPermission_Employee(t *testing.T) {
	if !HasPermission(RoleEmployee, PermEmployeeRead) {
		t.Error("employee should have employee:read")
	}
	if HasPermission(RoleEmployee, PermEmployeeCreate) {
		t.Error("employee should NOT have employee:create")
	}
	if HasPermission(RoleEmployee, PermUserCreate) {
		t.Error("employee should NOT have user:create")
	}
	if HasPermission(RoleEmployee, PermSystemConfig) {
		t.Error("employee should NOT have system:config")
	}
}

func TestHasPermission_UnknownRole(t *testing.T) {
	if HasPermission("unknown", PermUserRead) {
		t.Error("unknown role should not have any permission")
	}
}

func TestHasAnyPermission(t *testing.T) {
	if !HasAnyPermission(RoleEmployee, PermEmployeeRead, PermUserCreate) {
		t.Error("employee should have employee:read")
	}
	if HasAnyPermission(RoleEmployee, PermEmployeeCreate, PermUserCreate) {
		t.Error("employee should NOT have any of these")
	}
}

func TestHasAllPermissions(t *testing.T) {
	if !HasAllPermissions(RoleOwner, PermUserCreate, PermUserRead) {
		t.Error("owner should have all user permissions")
	}
	if HasAllPermissions(RoleEmployee, PermEmployeeRead, PermEmployeeCreate) {
		t.Error("employee should NOT have all employee permissions")
	}
}

func TestGetPermissions(t *testing.T) {
	perms := GetPermissions(RoleEmployee)
	if len(perms) == 0 {
		t.Error("employee should have permissions")
	}
	hasRead := false
	for _, p := range perms {
		if p == PermEmployeeRead {
			hasRead = true
			break
		}
	}
	if !hasRead {
		t.Error("employee permissions should include employee:read")
	}
}

func TestRoleWeight(t *testing.T) {
	tests := []struct {
		role    Role
		want    int
		wantErr bool
	}{
		{RoleOperator, 100, false},
		{RoleOwner, 80, false},
		{RoleAdmin, 60, false},
		{RoleManager, 40, false},
		{RoleEmployee, 20, false},
		{"unknown", 0, true},
	}
	for _, tt := range tests {
		got, err := RoleWeight(tt.role)
		if (err != nil) != tt.wantErr || got != tt.want {
			t.Errorf("RoleWeight(%q) = (%d, %v), want (%d, %v)", tt.role, got, err, tt.want, tt.wantErr)
		}
	}
}

func TestHasHigherOrEqualRole(t *testing.T) {
	tests := []struct {
		current Role
		target  Role
		want    bool
	}{
		{RoleOwner, RoleAdmin, true},
		{RoleAdmin, RoleOwner, false},
		{RoleAdmin, RoleAdmin, true},
		{RoleManager, RoleEmployee, true},
		{RoleEmployee, RoleManager, false},
	}
	for _, tt := range tests {
		got, err := HasHigherOrEqualRole(tt.current, tt.target)
		if err != nil {
			t.Errorf("HasHigherOrEqualRole(%q, %q) unexpected error: %v", tt.current, tt.target, err)
			continue
		}
		if got != tt.want {
			t.Errorf("HasHigherOrEqualRole(%q, %q) = %v, want %v", tt.current, tt.target, got, tt.want)
		}
	}
}

func TestAllRoles(t *testing.T) {
	if len(AllRoles) != 5 {
		t.Errorf("expected 5 roles, got %d", len(AllRoles))
	}
}

func TestRoleHierarchyIntegrity(t *testing.T) {
	for _, role := range AllRoles {
		_, err := RoleWeight(role)
		if err != nil {
			t.Errorf("role %s has no weight defined", role)
		}
		perms := GetPermissions(role)
		if len(perms) == 0 {
			t.Errorf("role %s has no permissions defined", role)
		}
	}
}
