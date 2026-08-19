package cmd

import (
	"testing"
)

func TestRootCmd_Help(t *testing.T) {
	// Smoke test: verify command tree builds without panic
	if rootCmd == nil {
		t.Fatal("rootCmd should not be nil")
	}
	if len(rootCmd.Commands()) != 9 {
		t.Errorf("expected 9 subcommands (auth, poll, notify, message, skill, service, init, log, which), got %d", len(rootCmd.Commands()))
	}
}

func TestAuthCmd_Subcommands(t *testing.T) {
	authCmd := newAuthCmd()
	if authCmd == nil {
		t.Fatal("auth command should not be nil")
	}
	if len(authCmd.Commands()) != 5 {
		t.Errorf("expected 5 auth subcommands (login, logout, status, refresh, switch), got %d", len(authCmd.Commands()))
	}
}

func TestPollCmd_Subcommands(t *testing.T) {
	pollCmd := newPollCmd()
	if pollCmd == nil {
		t.Fatal("poll command should not be nil")
	}
	if len(pollCmd.Commands()) != 2 {
		t.Errorf("expected 2 poll subcommands (start, stop), got %d", len(pollCmd.Commands()))
	}
}

func TestSkillCmd_Subcommands(t *testing.T) {
	skillCmd := newSkillCmd()
	if skillCmd == nil {
		t.Fatal("skill command should not be nil")
	}
	if len(skillCmd.Commands()) != 6 {
		t.Errorf("expected 6 skill subcommands (list, describe, execute, link, unlink, update), got %d", len(skillCmd.Commands()))
	}
}

func TestServiceCmd_Subcommands(t *testing.T) {
	serviceCmd := newServiceCmd()
	if serviceCmd == nil {
		t.Fatal("service command should not be nil")
	}
	if len(serviceCmd.Commands()) != 5 {
		t.Errorf("expected 5 service subcommands (install, start, stop, uninstall, status), got %d", len(serviceCmd.Commands()))
	}
}
