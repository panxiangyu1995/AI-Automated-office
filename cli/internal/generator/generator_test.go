package generator

import (
	"strings"
	"testing"
)

func TestGenerateClaudeMD(t *testing.T) {
	config := ClaudeMDConfig{
		EnterpriseName: "测试企业",
		APIEndpoint:    "http://localhost:8080",
		Role:           "admin",
		AvailableSkills: []SkillInfo{
			{
				Name:        "hrm_employee_list",
				Description: "列出员工",
				Parameters: []ParamInfo{
					{Name: "page", Type: "int", Required: false},
					{Name: "page_size", Type: "int", Required: false},
				},
			},
			{
				Name:        "crm_customer_create",
				Description: "创建客户",
				Parameters: []ParamInfo{
					{Name: "name", Type: "string", Required: true},
				},
			},
		},
	}

	result := GenerateClaudeMD(config)

	if !strings.Contains(result, "测试企业") {
		t.Error("should contain enterprise name")
	}
	if !strings.Contains(result, "http://localhost:8080") {
		t.Error("should contain API endpoint")
	}
	if !strings.Contains(result, "admin") {
		t.Error("should contain role")
	}
	if !strings.Contains(result, "hrm_employee_list") {
		t.Error("should contain skill name")
	}
	if !strings.Contains(result, "列出员工") {
		t.Error("should contain skill description")
	}
	if !strings.Contains(result, "(必填)") {
		t.Error("should contain required marker")
	}
	if !strings.Contains(result, "ao-cli skill execute") {
		t.Error("should contain example command")
	}
	if len(result) == 0 {
		t.Error("result should not be empty")
	}
}

func TestGenerateClaudeMDEmptySkills(t *testing.T) {
	config := ClaudeMDConfig{
		EnterpriseName:  "空企业",
		APIEndpoint:     "http://localhost:8080",
		Role:            "employee",
		AvailableSkills: []SkillInfo{},
	}

	result := GenerateClaudeMD(config)
	if !strings.Contains(result, "空企业") {
		t.Error("should contain enterprise name")
	}
	if !strings.Contains(result, "ao-cli skill execute") {
		t.Error("should contain example command")
	}
}

func TestGenerateAgentMD(t *testing.T) {
	config := ClaudeMDConfig{
		EnterpriseName: "测试企业",
		APIEndpoint:    "http://localhost:8080",
		Role:           "admin",
		AvailableSkills: []SkillInfo{
			{
				Name:        "hrm_employee_list",
				Description: "列出员工",
				Parameters: []ParamInfo{
					{Name: "page", Type: "int", Required: false},
				},
			},
		},
	}

	result := GenerateAgentMD(config)

	if !strings.Contains(result, "测试企业") {
		t.Error("should contain enterprise name")
	}
	if !strings.Contains(result, "hrm_employee_list") {
		t.Error("should contain skill name")
	}
	if !strings.Contains(result, "| Skill |") {
		t.Error("should contain table header")
	}
	if !strings.Contains(result, "page") {
		t.Error("should contain parameter name")
	}
	if len(result) == 0 {
		t.Error("result should not be empty")
	}
}

func TestGenerateAgentMDEmptySkills(t *testing.T) {
	config := ClaudeMDConfig{
		EnterpriseName:  "空企业",
		APIEndpoint:     "http://localhost:8080",
		Role:            "employee",
		AvailableSkills: []SkillInfo{},
	}

	result := GenerateAgentMD(config)
	if !strings.Contains(result, "空企业") {
		t.Error("should contain enterprise name")
	}
	if !strings.Contains(result, "| Skill |") {
		t.Error("should contain table header")
	}
}
