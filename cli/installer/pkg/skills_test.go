package pkg

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func makeZip(t *testing.T, entries map[string]string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "test.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	for name, content := range entries {
		zw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := zw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestExtractSkillTo(t *testing.T) {
	dir := t.TempDir()
	archive := makeZip(t, map[string]string{
		"SKILL.md":        "# skill",
		"references/a.md": "ref",
	})

	if err := InstallSkills([]string{archive}, dir); err != nil {
		t.Fatalf("InstallSkills failed: %v", err)
	}

	if _, err := os.Stat(filepath.Join(dir, "SKILL.md")); err != nil {
		t.Errorf("SKILL.md not extracted: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "references", "a.md")); err != nil {
		t.Errorf("nested file not extracted: %v", err)
	}
}

func TestExtractSkillToInvalidZip(t *testing.T) {
	dir := t.TempDir()
	bad := filepath.Join(dir, "bad.skill")
	if err := os.WriteFile(bad, []byte("not a zip"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := InstallSkills([]string{bad}, dir); err == nil {
		t.Error("expected error for invalid zip")
	}
}

func TestExtractSkillToZipSlip(t *testing.T) {
	dir := t.TempDir()
	archive := makeZip(t, map[string]string{
		"../evil.txt": "pwned",
	})

	err := InstallSkills([]string{archive}, dir)
	if err == nil {
		t.Fatal("expected error for zip slip path")
	}
	if _, statErr := os.Stat(filepath.Join(dir, "..", "evil.txt")); statErr == nil {
		t.Error("zip slip escaped target dir!")
	}
}
