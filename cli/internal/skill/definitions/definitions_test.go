package definitions

import (
	"testing"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func TestAllSkillsRegistered(t *testing.T) {
	skill.Clear()

	RegisterAll()

	skills := skill.List()
	if len(skills) == 0 {
		t.Fatal("expected skills to be registered, got 0")
	}

	categories := map[string]int{}
	expectedSkills := map[string]bool{}

	for _, s := range skills {
		if s.Name == "" {
			t.Error("found skill with empty name")
		}
		if s.Description == "" {
			t.Errorf("skill %q has empty description", s.Name)
		}
		categories[s.Category]++
		expectedSkills[s.Name] = true
	}

	expectedCounts := map[string]int{
		"export":    4,
		"crm":       20,
		"hrm":       14,
		"ims":       28,
		"contract":  12,
		"service":   9,
		"sales":     5,
		"finance":   7,
		"message":   8,
		"knowledge": 9,
		"workflow":  11,
		"org":       24,
		"auth":      1,
	}

	for cat, expected := range expectedCounts {
		actual := categories[cat]
		if actual != expected {
			t.Errorf("category %q: expected %d skills, got %d", cat, expected, actual)
		}
	}
}

func TestSkillDefinitions_HaveValidEndpoints(t *testing.T) {
	skill.Clear()
	RegisterAll()

	for _, s := range skill.List() {
		if len(s.Actions) > 0 {
			for name, action := range s.Actions {
				if action.Endpoint == "" {
					t.Errorf("skill %q action %q has empty endpoint", s.Name, name)
				}
				if action.Method == "" {
					t.Errorf("skill %q action %q has empty method", s.Name, name)
				}
			}
		} else {
			if s.APIEndpoint == "" {
				t.Errorf("skill %q has no endpoint", s.Name)
			}
			if s.Method == "" {
				t.Errorf("skill %q has no method", s.Name)
			}
		}
	}
}

func TestNoDuplicateSkillNames(t *testing.T) {
	skill.Clear()
	RegisterAll()

	seen := map[string]bool{}
	for _, s := range skill.List() {
		if seen[s.Name] {
			t.Errorf("duplicate skill name: %q", s.Name)
		}
		seen[s.Name] = true
	}
}

func TestGetEachSkill(t *testing.T) {
	skill.Clear()
	RegisterAll()

	for _, s := range skill.List() {
		found, err := skill.Get(s.Name)
		if err != nil {
			t.Errorf("Get(%q) failed: %v", s.Name, err)
			continue
		}
		if found.Name != s.Name {
			t.Errorf("Get(%q) returned wrong skill name: %q", s.Name, found.Name)
		}
	}
}
