package service

import (
	"testing"

	"cloud-server/internal/model"

	"github.com/stretchr/testify/assert"
)

// Test Field Masking Functions

func TestMaskPhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"13812345678", "138****5678"},
		{"15111112222", "151****2222"},
		{"123", "****"},
		{"1234567", "123****4567"},
	}
	
	for _, tt := range tests {
		result := maskPhone(tt.input)
		assert.Equal(t, tt.expected, result)
	}
}

func TestMaskEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"test@example.com", "t***@example.com"},
		{"admin@test.org", "a***@test.org"},
		{"a@b.com", "****"},  // atIndex <= 1
		{"invalid", "****"},
	}
	
	for _, tt := range tests {
		result := maskEmail(tt.input)
		assert.Equal(t, tt.expected, result)
	}
}

func TestMaskIDCard(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"320123199001011234", "320***********1234"},
		{"110101199001011111", "110***********1111"},
		{"123", "****"},
	}
	
	for _, tt := range tests {
		result := maskIDCard(tt.input)
		assert.Equal(t, tt.expected, result)
	}
}

func TestMaskBankCard(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"6222021234567890", "6222****7890"},
		{"6217001234567891234", "6217****1234"},
		{"123", "****"},
	}
	
	for _, tt := range tests {
		result := maskBankCard(tt.input)
		assert.Equal(t, tt.expected, result)
	}
}

func TestApplyCustomMask(t *testing.T) {
	tests := []struct {
		value    string
		pattern  string
		expected string
	}{
		{"1234567890", "3,4", "123****7890"},
		{"ABCDEFGHIJ", "2,2", "AB****IJ"},
		{"12345", "2,2", "12****45"},
	}
	
	for _, tt := range tests {
		result := applyCustomMask(tt.value, tt.pattern)
		assert.Equal(t, tt.expected, result)
	}
}

// Test FieldRestriction Merging

func TestMergeFieldRestrictions_Single(t *testing.T) {
	service := &FieldPermissionService{}
	
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			OverrideType: model.OverrideTypeGrant,
			FieldRestrictions: model.FieldRestrictionsMap{
				"salary": {Mode: model.FieldModeHidden},
				"phone":  {Mode: model.FieldModeMasked, MaskRule: model.MaskRulePhone},
			},
		},
	}
	
	restrictions := service.mergeFieldRestrictions(overrides)
	
	assert.Len(t, restrictions, 2)
	assert.Equal(t, model.FieldModeHidden, restrictions["salary"].Mode)
	assert.Equal(t, model.FieldModeMasked, restrictions["phone"].Mode)
}

func TestMergeFieldRestrictions_DenyPriority(t *testing.T) {
	service := &FieldPermissionService{}
	
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			OverrideType: model.OverrideTypeGrant,
			FieldRestrictions: model.FieldRestrictionsMap{
				"salary": {Mode: model.FieldModeVisible},
			},
		},
		{
			ID:           "2",
			OverrideType: model.OverrideTypeDeny,
			FieldRestrictions: model.FieldRestrictionsMap{
				"salary": {Mode: model.FieldModeHidden},
			},
		},
	}
	
	restrictions := service.mergeFieldRestrictions(overrides)
	
	// Deny should take priority
	assert.Equal(t, model.FieldModeHidden, restrictions["salary"].Mode)
}

func TestMergeFieldRestrictions_VisibleOnlyOverride(t *testing.T) {
	service := &FieldPermissionService{}
	
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			OverrideType: model.OverrideTypeGrant,
			FieldRestrictions: model.FieldRestrictionsMap{
				"salary": {Mode: model.FieldModeReadonly},
			},
		},
		{
			ID:           "2",
			OverrideType: model.OverrideTypeGrant,
			FieldRestrictions: model.FieldRestrictionsMap{
				"salary": {Mode: model.FieldModeHidden},
			},
		},
	}
	
	restrictions := service.mergeFieldRestrictions(overrides)
	
	// First grant sets readonly, second grant doesn't override because readonly != visible
	// So the first restriction remains
	assert.Equal(t, model.FieldModeReadonly, restrictions["salary"].Mode)
}

// Test ApplyFieldMasking

func TestApplyFieldMasking_Hidden(t *testing.T) {
	service := &FieldPermissionService{}
	
	data := map[string]interface{}{
		"name":   "张三",
		"salary": 10000,
		"phone":  "13812345678",
	}
	
	restrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
	}
	
	result := service.applyMaskingToMap(data, restrictions)
	
	_, hasSalary := result["salary"]
	assert.False(t, hasSalary, "salary should be hidden")
	assert.Equal(t, "张三", result["name"])
}

func TestApplyFieldMasking_Masked(t *testing.T) {
	service := &FieldPermissionService{}
	
	data := map[string]interface{}{
		"name":  "张三",
		"phone": "13812345678",
		"email": "test@example.com",
	}
	
	restrictions := model.FieldRestrictionsMap{
		"phone": {Mode: model.FieldModeMasked, MaskRule: model.MaskRulePhone},
		"email": {Mode: model.FieldModeMasked, MaskRule: model.MaskRuleEmail},
	}
	
	result := service.applyMaskingToMap(data, restrictions)
	
	assert.Equal(t, "138****5678", result["phone"])
	assert.Equal(t, "t***@example.com", result["email"])
	assert.Equal(t, "张三", result["name"])
}

func TestApplyFieldMasking_Readonly(t *testing.T) {
	service := &FieldPermissionService{}
	
	data := map[string]interface{}{
		"name":  "张三",
		"title": "工程师",
	}
	
	restrictions := model.FieldRestrictionsMap{
		"title": {Mode: model.FieldModeReadonly},
	}
	
	result := service.applyMaskingToMap(data, restrictions)
	
	// Readonly fields should still be visible
	assert.Equal(t, "张三", result["name"])
	assert.Equal(t, "工程师", result["title"])
}

// Test FieldPermissionCache

func TestFieldPermissionCache_SetGet(t *testing.T) {
	cache := NewFieldPermissionCache(60)
	
	restrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
	}
	
	cache.Set("user1:resource1", restrictions)
	
	result, ok := cache.Get("user1:resource1")
	assert.True(t, ok)
	assert.Equal(t, model.FieldModeHidden, result["salary"].Mode)
}

func TestFieldPermissionCache_Delete(t *testing.T) {
	cache := NewFieldPermissionCache(60)
	
	restrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
	}
	
	cache.Set("user1:resource1", restrictions)
	cache.Delete("user1:resource1")
	
	_, ok := cache.Get("user1:resource1")
	assert.False(t, ok)
}

func TestFieldPermissionCache_DeleteByPrefix(t *testing.T) {
	cache := NewFieldPermissionCache(60)
	
	restrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
	}
	
	cache.Set("user1:resource1", restrictions)
	cache.Set("user1:resource2", restrictions)
	cache.Set("user2:resource1", restrictions)
	
	cache.DeleteByPrefix("user1")
	
	_, ok1 := cache.Get("user1:resource1")
	_, ok2 := cache.Get("user1:resource2")
	_, ok3 := cache.Get("user2:resource1")
	
	assert.False(t, ok1)
	assert.False(t, ok2)
	assert.True(t, ok3)
}

// Benchmark tests

func BenchmarkMaskPhone(b *testing.B) {
	phone := "13812345678"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		maskPhone(phone)
	}
}

func BenchmarkApplyFieldMasking(b *testing.B) {
	service := &FieldPermissionService{}
	
	data := map[string]interface{}{
		"name":   "张三",
		"salary": 10000,
		"phone":  "13812345678",
		"email":  "test@example.com",
	}
	
	restrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
		"phone":  {Mode: model.FieldModeMasked, MaskRule: model.MaskRulePhone},
		"email":  {Mode: model.FieldModeMasked, MaskRule: model.MaskRuleEmail},
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.applyMaskingToMap(data, restrictions)
	}
}