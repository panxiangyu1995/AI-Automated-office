package parser

import "strings"

// FieldMapper 字段映射器
type FieldMapper struct {
	// 中文列名到标准字段名的映射
	headerToField map[string]string
	// 标准字段名到中文列名的映射
	fieldToHeader map[string]string
}

// NewFieldMapper 创建字段映射器
func NewFieldMapper() *FieldMapper {
	m := &FieldMapper{
		headerToField: make(map[string]string),
		fieldToHeader: make(map[string]string),
	}

	// 初始化标准映射
	mappings := map[string]string{
		// 用户名
		"用户名":       "username",
		"username": "username",
		"账号":       "username",
		"登录名":      "username",

		// 密码
		"密码":       "password",
		"password": "password",
		"初始密码":     "password",

		// 姓名
		"姓名":    "name",
		"name":  "name",
		"员工姓名":  "name",
		"真实姓名":  "name",

		// 工号
		"工号":            "employee_code",
		"employee_code": "employee_code",
		"员工工号":          "employee_code",
		"员工编号":          "employee_code",

		// 部门
		"部门":              "department_name",
		"部门名称":            "department_name",
		"department_name": "department_name",
		"department":      "department_name",
		"部门编码":            "department_code",
		"department_code": "department_code",

		// 岗位
		"岗位":           "position_name",
		"岗位名称":         "position_name",
		"position_name": "position_name",
		"position":      "position_name",
		"岗位编码":         "position_code",
		"position_code": "position_code",

		// 上级
		"上级":             "manager_username",
		"直属上级":           "manager_username",
		"上级用户名":          "manager_username",
		"manager":         "manager_username",
		"manager_username": "manager_username",

		// 邮箱
		"邮箱":    "email",
		"email": "email",
		"邮箱地址":  "email",

		// 手机
		"手机":    "phone",
		"手机号":   "phone",
		"手机号码":  "phone",
		"phone": "phone",
		"电话":    "phone",

		// 状态
		"状态":     "status",
		"status": "status",
		"员工状态":   "status",
	}

	for header, field := range mappings {
		m.headerToField[strings.ToLower(header)] = field
		m.fieldToHeader[field] = header
	}

	return m
}

// MapHeaderToField 将列名映射到标准字段名
func (m *FieldMapper) MapHeaderToField(header string) string {
	return m.headerToField[strings.ToLower(strings.TrimSpace(header))]
}

// MapFieldToHeader 将标准字段名映射到中文列名
func (m *FieldMapper) MapFieldToHeader(field string) string {
	return m.fieldToHeader[field]
}

// GetStandardFields 获取所有标准字段名
func (m *FieldMapper) GetStandardFields() []string {
	fields := make([]string, 0, len(m.fieldToHeader))
	for field := range m.fieldToHeader {
		fields = append(fields, field)
	}
	return fields
}

// RequiredFields 获取必填字段
func (m *FieldMapper) RequiredFields() []string {
	return []string{"username", "name"}
}

// OptionalFields 获取可选字段
func (m *FieldMapper) OptionalFields() []string {
	return []string{
		"password",
		"employee_code",
		"department_code",
		"department_name",
		"position_code",
		"position_name",
		"manager_username",
		"email",
		"phone",
		"status",
	}
}
