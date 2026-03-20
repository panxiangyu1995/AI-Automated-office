package model

import (
	"testing"
)

func TestPermissionSet_NewPermissionSet(t *testing.T) {
	ps := NewPermissionSet()
	if ps == nil {
		t.Fatal("NewPermissionSet returned nil")
	}
	if ps.Permissions == nil {
		t.Error("Permissions map should not be nil")
	}
	if ps.ByLayer == nil {
		t.Error("ByLayer map should not be nil")
	}
	if ps.ByResource == nil {
		t.Error("ByResource map should not be nil")
	}
}

func TestPermissionSet_Add(t *testing.T) {
	ps := NewPermissionSet()
	perm := &Permission{
		ID:        "perm-1",
		Code:      "auth_profile_read",
		Name:      "查看个人信息",
		Resource:  "auth.profile",
		Action:    PermActionRead,
		Layer:     LayerBase,
	}

	ps.Add(perm)

	// Test Permissions map
	if !ps.Contains("auth_profile_read") {
		t.Error("Should contain added permission")
	}

	// Test ByLayer map
	basePerms := ps.GetByLayer(LayerBase)
	if len(basePerms) != 1 {
		t.Errorf("Expected 1 base permission, got %d", len(basePerms))
	}

	// Test ByResource map
	resourcePerms := ps.GetByResource("auth.profile")
	if len(resourcePerms) != 1 {
		t.Errorf("Expected 1 resource permission, got %d", len(resourcePerms))
	}
}

func TestPermissionSet_Merge(t *testing.T) {
	ps1 := NewPermissionSet()
	ps2 := NewPermissionSet()

	perm1 := &Permission{
		ID:       "perm-1",
		Code:     "auth_profile_read",
		Resource: "auth.profile",
		Action:   PermActionRead,
		Layer:    LayerBase,
	}
	perm2 := &Permission{
		ID:       "perm-2",
		Code:     "hr_employee_read",
		Resource: "hr.employee",
		Action:   PermActionRead,
		Layer:    LayerDepartment,
	}

	ps1.Add(perm1)
	ps2.Add(perm2)

	ps1.Merge(ps2)

	if !ps1.Contains("auth_profile_read") {
		t.Error("Should contain perm1")
	}
	if !ps1.Contains("hr_employee_read") {
		t.Error("Should contain perm2 after merge")
	}
}

func TestPermissionSet_Contains(t *testing.T) {
	ps := NewPermissionSet()
	perm := &Permission{
		ID:       "perm-1",
		Code:     "auth_profile_read",
		Resource: "auth.profile",
		Action:   PermActionRead,
		Layer:    LayerBase,
	}

	ps.Add(perm)

	if !ps.Contains("auth_profile_read") {
		t.Error("Should contain added permission")
	}
	if ps.Contains("non_existent") {
		t.Error("Should not contain non-existent permission")
	}
}

func TestPermissionSet_ContainsAny(t *testing.T) {
	ps := NewPermissionSet()
	perm := &Permission{
		ID:       "perm-1",
		Code:     "auth_profile_read",
		Resource: "auth.profile",
		Action:   PermActionRead,
		Layer:    LayerBase,
	}
	ps.Add(perm)

	tests := []struct {
		name     string
		codes    []string
		expected bool
	}{
		{"contains one", []string{"auth_profile_read", "non_existent"}, true},
		{"contains none", []string{"non_existent", "another_non_existent"}, false},
		{"empty codes", []string{}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ps.ContainsAny(tt.codes)
			if result != tt.expected {
				t.Errorf("ContainsAny(%v) = %v, want %v", tt.codes, result, tt.expected)
			}
		})
	}
}

func TestPermissionSet_ContainsAll(t *testing.T) {
	ps := NewPermissionSet()
	perm1 := &Permission{
		ID:       "perm-1",
		Code:     "auth_profile_read",
		Resource: "auth.profile",
		Action:   PermActionRead,
		Layer:    LayerBase,
	}
	perm2 := &Permission{
		ID:       "perm-2",
		Code:     "auth_profile_write",
		Resource: "auth.profile",
		Action:   PermActionWrite,
		Layer:    LayerBase,
	}
	ps.Add(perm1)
	ps.Add(perm2)

	tests := []struct {
		name     string
		codes    []string
		expected bool
	}{
		{"contains all", []string{"auth_profile_read", "auth_profile_write"}, true},
		{"contains one of two", []string{"auth_profile_read", "non_existent"}, false},
		{"contains none", []string{"non_existent", "another_non_existent"}, false},
		{"empty codes", []string{}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ps.ContainsAll(tt.codes)
			if result != tt.expected {
				t.Errorf("ContainsAll(%v) = %v, want %v", tt.codes, result, tt.expected)
			}
		})
	}
}

func TestPermissionSet_Count(t *testing.T) {
	ps := NewPermissionSet()

	if ps.Count() != 0 {
		t.Errorf("Empty set should have count 0, got %d", ps.Count())
	}

	ps.Add(&Permission{ID: "1", Code: "perm1", Layer: LayerBase})
	ps.Add(&Permission{ID: "2", Code: "perm2", Layer: LayerDepartment})

	if ps.Count() != 2 {
		t.Errorf("Set should have count 2, got %d", ps.Count())
	}
}

func TestPermissionSet_ToCodeList(t *testing.T) {
	ps := NewPermissionSet()
	ps.Add(&Permission{ID: "1", Code: "perm1", Layer: LayerBase})
	ps.Add(&Permission{ID: "2", Code: "perm2", Layer: LayerDepartment})

	codes := ps.ToCodeList()
	if len(codes) != 2 {
		t.Errorf("Expected 2 codes, got %d", len(codes))
	}

	// Check that both codes are present
	codeMap := make(map[string]bool)
	for _, code := range codes {
		codeMap[code] = true
	}
	if !codeMap["perm1"] || !codeMap["perm2"] {
		t.Error("ToCodeList should contain both perm1 and perm2")
	}
}

func TestPermission_IsGlobal(t *testing.T) {
	tests := []struct {
		name     string
		perm     *Permission
		expected bool
	}{
		{
			name: "global permission",
			perm: &Permission{
				ID:        "perm-1",
				Code:      "global_perm",
				TenantID:  nil,
			},
			expected: true,
		},
		{
			name: "tenant permission",
			perm: &Permission{
				ID:        "perm-2",
				Code:      "tenant_perm",
				TenantID:  strPtr("tenant-1"),
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.perm.IsGlobal()
			if result != tt.expected {
				t.Errorf("IsGlobal() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func strPtr(s string) *string {
	return &s
}
