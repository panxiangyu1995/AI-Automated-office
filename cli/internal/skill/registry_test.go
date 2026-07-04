package skill

import (
	"testing"
)

func TestRegisterAndList(t *testing.T) {
	registry = nil

	Register(SkillDefinition{Name: "hrm_employee_create", Description: "Create employee", Category: "hrm"})
	Register(SkillDefinition{Name: "crm_customer_list", Description: "List customers", Category: "crm"})

	skills := List()
	if len(skills) != 2 {
		t.Errorf("expected 2 skills, got %d", len(skills))
	}
}

func TestGet_Found(t *testing.T) {
	registry = nil
	Register(SkillDefinition{Name: "test_skill", Description: "test", Category: "test"})

	s, err := Get("test_skill")
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if s.Name != "test_skill" {
		t.Errorf("expected name test_skill, got %s", s.Name)
	}
}

func TestGet_NotFound(t *testing.T) {
	registry = nil
	_, err := Get("nonexistent")
	if err == nil {
		t.Fatal("expected error for nonexistent skill")
	}
}
