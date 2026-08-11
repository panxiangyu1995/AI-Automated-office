package pkg

import (
	"archive/zip"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// makeZipEntries 直接构造 zip 文件（支持任意 entry 名）
func makeZipEntries(t *testing.T, names []string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "entries.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	for _, name := range names {
		zw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := zw.Write([]byte("content-" + name)); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestExtractZipSlipVariants(t *testing.T) {
	cases := []string{
		"../evil.txt",                // 简单上跳
		"../../../../tmp/evil.txt",   // 多次上跳
		"a/../../evil.txt",           // 嵌套上跳
		"..\\evil.txt",               // Windows 分隔符
		"a\\..\\..\\evil.txt",        // Windows 嵌套
		"/etc/passwd",                // 绝对路径
		"sub/../../../evil",          // 深层上跳
	}
	for _, name := range cases {
		t.Run(strings.ReplaceAll(name, "/", "_"), func(t *testing.T) {
			dir := t.TempDir()
			archive := makeZipEntries(t, []string{name})
			err := InstallSkills([]string{archive}, dir)
			if err == nil {
				t.Fatalf("expected rejection of zip-slip path %q", name)
			}
			// 确保没有逃逸文件被创建
			findEscaped := func() bool {
				err := filepath.Walk(dir, func(_ string, info os.FileInfo, _ error) error {
					return nil // 只检查外部
				})
				_ = err
				return false
			}
			_ = findEscaped
			// 检查父目录未被污染
			parent := filepath.Dir(dir)
			entries, _ := os.ReadDir(parent)
			for _, e := range entries {
				if e.Name() == "evil.txt" || e.Name() == "passwd" || e.Name() == "evil" {
					t.Errorf("escaped file created: %s", e.Name())
				}
			}
		})
	}
}

func TestExtractSkillToEmptyZip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(t.TempDir(), "empty.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	f.Close()

	if err := InstallSkills([]string{path}, dir); err != nil {
		t.Errorf("empty zip should install cleanly, got: %v", err)
	}
}

func TestExtractSkillToCorruptZip(t *testing.T) {
	dir := t.TempDir()
	corrupt := filepath.Join(dir, "corrupt.skill")
	// 合法 zip 头但截断内容
	data := []byte("PK\x03\x04truncated-garbage-data-here")
	if err := os.WriteFile(corrupt, data, 0644); err != nil {
		t.Fatal(err)
	}
	if err := InstallSkills([]string{corrupt}, dir); err == nil {
		t.Error("expected error for corrupt zip")
	}
}

func TestExtractSkillToMissingFile(t *testing.T) {
	if err := InstallSkills([]string{"/no/such/archive.skill"}, t.TempDir()); err == nil {
		t.Error("expected error for missing archive")
	}
}

func TestExtractSkillToTargetDirIsFile(t *testing.T) {
	dir := t.TempDir()
	archive := makeZip(t, map[string]string{"a.md": "x"})

	// targetDir 是文件 → 应报错
	fileAsDir := filepath.Join(dir, "notadir")
	if err := os.WriteFile(fileAsDir, []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := InstallSkills([]string{archive}, fileAsDir); err == nil {
		t.Error("expected error when target is a file")
	}
}

func TestExtractSkillDuplicateNames(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(t.TempDir(), "dup.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	// 同一文件名写两次
	for i := 0; i < 2; i++ {
		zw, err := w.Create("same.md")
		if err != nil {
			t.Fatal(err)
		}
		zw.Write([]byte("v"))
	}
	w.Close()
	f.Close()

	if err := InstallSkills([]string{path}, dir); err != nil {
		t.Fatalf("duplicate names should be tolerated (last wins), got: %v", err)
	}
}

func TestExtractSkillDeepNesting(t *testing.T) {
	dir := t.TempDir()
	deep := strings.Repeat("d/", 30) + "file.md"
	archive := makeZipEntries(t, []string{deep})
	if err := InstallSkills([]string{archive}, dir); err != nil {
		t.Fatalf("deep nesting extraction failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, deep)); err != nil {
		t.Errorf("deep file not extracted: %v", err)
	}
}

func TestExtractSkillManyFiles(t *testing.T) {
	dir := t.TempDir()
	var names []string
	for i := 0; i < 500; i++ {
		names = append(names, filepath.Join("files", fmt.Sprintf("f%03d.md", i)))
	}
	archive := makeZipEntries(t, names)
	if err := InstallSkills([]string{archive}, dir); err != nil {
		t.Fatalf("500-file extraction failed: %v", err)
	}
	count := 0
	filepath.Walk(dir, func(_ string, info os.FileInfo, _ error) error {
		if !info.IsDir() {
			count++
		}
		return nil
	})
	if count != 500 {
		t.Errorf("expected 500 extracted files, got %d", count)
	}
}

func TestExtractLargeZip(t *testing.T) {
	dir := t.TempDir()
	// 30 个文件各 1MB → 30MB zip
	path := filepath.Join(t.TempDir(), "large.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	w := zip.NewWriter(f)
	big := make([]byte, 1024*1024)
	for i := 0; i < 30; i++ {
		zw, err := w.Create(filepath.Join("big", "f"+string(rune('0'+i/10))+"_"+string(rune('0'+i%10))+".bin"))
		if err != nil {
			t.Fatal(err)
		}
		if _, err := zw.Write(big); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	f.Close()

	if err := InstallSkills([]string{path}, dir); err != nil {
		t.Fatalf("30MB extraction failed: %v", err)
	}
}
