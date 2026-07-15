package masking

import "testing"

func TestMaskPhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"13812341234", "138****1234"},
		{"1234567", "123****4567"},
		{"123", "123"},
		{"", ""},
	}
	for _, tt := range tests {
		got := ApplyMask(tt.input, "phone")
		if got != tt.expected {
			t.Errorf("maskPhone(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMaskEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"alice@example.com", "a***@example.com"},
		{"b@test.com", "b***@test.com"},
		{"@", "@"},
		{"noemail", "noemail"},
		{"", ""},
	}
	for _, tt := range tests {
		got := ApplyMask(tt.input, "email")
		if got != tt.expected {
			t.Errorf("maskEmail(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMaskIDCard(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"310101199001011234", "310***********1234"},
		{"1234567", "1234567"},
		{"123", "123"},
		{"", ""},
	}
	for _, tt := range tests {
		got := ApplyMask(tt.input, "idcard")
		if got != tt.expected {
			t.Errorf("maskIDCard(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMaskName(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"张三", "张*"},
		{"李四五", "李**"},
		{"A", "A"},
		{"", ""},
	}
	for _, tt := range tests {
		got := ApplyMask(tt.input, "name")
		if got != tt.expected {
			t.Errorf("maskName(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestMaskBankAccount(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"6222021234561234", "************1234"},
		{"1234", "1234"},
		{"123", "123"},
		{"", ""},
	}
	for _, tt := range tests {
		got := ApplyMask(tt.input, "bank_account")
		if got != tt.expected {
			t.Errorf("maskBankAccount(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestApplyMaskUnknownStrategy(t *testing.T) {
	got := ApplyMask("test", "unknown")
	if got != "test" {
		t.Errorf("ApplyMask with unknown strategy should return original value, got %q", got)
	}
}
