package poller

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEscapeAppleScript(t *testing.T) {
	got := escapeAppleScript(`a\b"c'd`)
	want := `a\\b\"c\'d`
	if got != want {
		t.Fatalf("escapeAppleScript: want %q, got %q", want, got)
	}
}

func TestEscapeXML(t *testing.T) {
	got := escapeXML(`<a>&"b"'`)
	want := `&lt;a&gt;&amp;&quot;b&quot;&apos;`
	if got != want {
		t.Fatalf("escapeXML: want %q, got %q", want, got)
	}
}

func TestOsNotifyCommand_Darwin(t *testing.T) {
	name, args, err := osNotifyCommand("darwin", `t"t`, `c\c`)
	if err != nil {
		t.Fatal(err)
	}
	if name != "osascript" || len(args) != 2 || args[0] != "-e" {
		t.Fatalf("unexpected command: %s %v", name, args)
	}
	if !strings.Contains(args[1], `display notification "c\\c" with title "t\"t"`) {
		t.Fatalf("unexpected script: %s", args[1])
	}
}

func TestOsNotifyCommand_Linux(t *testing.T) {
	name, args, err := osNotifyCommand("linux", "标题", "内容")
	if err != nil {
		t.Fatal(err)
	}
	if name != "notify-send" || len(args) != 2 || args[0] != "标题" || args[1] != "内容" {
		t.Fatalf("unexpected command: %s %v", name, args)
	}
}

func TestOsNotifyCommand_Windows(t *testing.T) {
	name, args, err := osNotifyCommand("windows", `<t>`, `a&b`)
	if err != nil {
		t.Fatal(err)
	}
	if name != "powershell" || len(args) != 2 || args[0] != "-Command" {
		t.Fatalf("unexpected command: %s %v", name, args)
	}
	if !strings.Contains(args[1], `&lt;t&gt;`) || !strings.Contains(args[1], `a&amp;b`) {
		t.Fatalf("expected XML-escaped content in script: %s", args[1])
	}
	if !strings.Contains(args[1], `"ao-cli"`) {
		t.Fatalf("expected AppID ao-cli in script: %s", args[1])
	}
}

func TestOsNotifyCommand_Unsupported(t *testing.T) {
	if _, _, err := osNotifyCommand("plan9", "t", "c"); err == nil {
		t.Fatal("expected error for unsupported OS")
	}
}

func TestLinuxNotifyFallbacks(t *testing.T) {
	candidates := linuxNotifyFallbacks("标题", "内容")
	if len(candidates) != 2 {
		t.Fatalf("expected 2 candidates, got %d", len(candidates))
	}
	ns := candidates[0]
	if len(ns) != 3 || ns[0] != "notify-send" || ns[1] != "标题" || ns[2] != "内容" {
		t.Fatalf("unexpected notify-send candidate: %v", ns)
	}
	kd := candidates[1]
	if len(kd) != 6 || kd[0] != "kdialog" || kd[1] != "--title" || kd[2] != "标题" ||
		kd[3] != "--passivepopup" || kd[4] != "内容" || kd[5] != "5" {
		t.Fatalf("unexpected kdialog candidate: %v", kd)
	}
}

func TestSendNotification_Disabled(t *testing.T) {
	called := false
	orig := osNotifyFunc
	osNotifyFunc = func(title, content string) error {
		called = true
		return nil
	}
	defer func() { osNotifyFunc = orig }()

	markFile := filepath.Join(t.TempDir(), "mark.txt")
	cfg := NotifyConfig{Enable: false, MarkFile: markFile}
	if err := SendNotification("t", "c", cfg); err != nil {
		t.Fatalf("SendNotification: %v", err)
	}
	if called {
		t.Fatal("OS notification should not be sent when disabled")
	}
	if _, err := os.Stat(markFile); !os.IsNotExist(err) {
		t.Fatal("mark file should not be written when disabled")
	}
}

func TestSendNotification_EnabledWithMarkFile(t *testing.T) {
	called := 0
	orig := osNotifyFunc
	osNotifyFunc = func(title, content string) error {
		called++
		if title != "标题" || content != "内容" {
			t.Fatalf("unexpected payload: %s / %s", title, content)
		}
		return nil
	}
	defer func() { osNotifyFunc = orig }()

	markFile := filepath.Join(t.TempDir(), "mark.txt")
	cfg := NotifyConfig{Enable: true, MarkFile: markFile}
	if err := SendNotification("标题", "内容", cfg); err != nil {
		t.Fatalf("SendNotification: %v", err)
	}
	if called != 1 {
		t.Fatalf("expected exactly 1 OS notification, got %d", called)
	}
	data, err := os.ReadFile(markFile)
	if err != nil {
		t.Fatalf("read mark file: %v", err)
	}
	if string(data) != "[标题]\n内容\n---\n" {
		t.Fatalf("unexpected mark file content: %q", string(data))
	}
}

// --- 模拟验收：Linux / Windows 弹窗执行链（fake 命令 + PATH 注入） ---

// writeFakeCmd 创建可执行 fake 命令：把收到的 argv 追加到 $FAKE_LOG，按 FAKE_EXIT 退出。
func writeFakeCmd(t *testing.T, dir, name string) {
	t.Helper()
	bin := filepath.Join(dir, "bin")
	if err := os.MkdirAll(bin, 0755); err != nil {
		t.Fatal(err)
	}
	script := `#!/bin/sh
echo "$@" >> "$FAKE_LOG"
[ "$FAKE_FAIL_ON" = "$(basename "$0")" ] && exit 1
exit 0
`
	path := filepath.Join(bin, name)
	if err := os.WriteFile(path, []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
}

func setupFakePath(t *testing.T, dir, logFile string) {
	t.Helper()
	t.Setenv("FAKE_LOG", logFile)
	t.Setenv("PATH", filepath.Join(dir, "bin")+string(os.PathListSeparator)+os.Getenv("PATH"))
}

func TestSimulateLinux_NotifySendAvailable(t *testing.T) {
	dir := t.TempDir()
	logFile := filepath.Join(dir, "log")
	writeFakeCmd(t, dir, "notify-send")
	setupFakePath(t, dir, logFile)

	if err := sendLinuxNotification("标题", "内容"); err != nil {
		t.Fatalf("sendLinuxNotification: %v", err)
	}
	data, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("read log: %v", err)
	}
	if string(data) != "标题 内容\n" {
		t.Fatalf("notify-send should receive title+content, got %q", string(data))
	}
}

func TestSimulateLinux_FallbackToKdialog(t *testing.T) {
	dir := t.TempDir()
	logFile := filepath.Join(dir, "log")
	writeFakeCmd(t, dir, "kdialog")
	setupFakePath(t, dir, logFile)

	if err := sendLinuxNotification("标题", "内容"); err != nil {
		t.Fatalf("sendLinuxNotification: %v", err)
	}
	data, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("read log: %v", err)
	}
	if string(data) != "--title 标题 --passivepopup 内容 5\n" {
		t.Fatalf("kdialog should receive fallback args, got %q", string(data))
	}
}

func TestSimulateLinux_BothMissing_AggregatedError(t *testing.T) {
	dir := t.TempDir()
	setupFakePath(t, dir, filepath.Join(dir, "log"))

	err := sendLinuxNotification("标题", "内容")
	if err == nil {
		t.Fatal("expected aggregated error when both commands missing")
	}
	if !strings.Contains(err.Error(), "notify-send") || !strings.Contains(err.Error(), "kdialog") {
		t.Fatalf("error should name both failed commands, got: %v", err)
	}
}

func TestSimulateLinux_NotifySendFails_FallsBack(t *testing.T) {
	dir := t.TempDir()
	logFile := filepath.Join(dir, "log")
	writeFakeCmd(t, dir, "notify-send")
	writeFakeCmd(t, dir, "kdialog")
	setupFakePath(t, dir, logFile)
	t.Setenv("FAKE_FAIL_ON", "notify-send")

	if err := sendLinuxNotification("标题", "内容"); err != nil {
		t.Fatalf("sendLinuxNotification should recover via kdialog: %v", err)
	}
	data, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("read log: %v", err)
	}
	if string(data) != "标题 内容\n--title 标题 --passivepopup 内容 5\n" {
		t.Fatalf("expected notify-send attempt then kdialog fallback, got %q", string(data))
	}
}

func TestSimulateWindows_PowerShellToast(t *testing.T) {
	dir := t.TempDir()
	logFile := filepath.Join(dir, "log")
	writeFakeCmd(t, dir, "powershell")
	setupFakePath(t, dir, logFile)

	name, args, err := osNotifyCommand("windows", "标题", "内容")
	if err != nil {
		t.Fatal(err)
	}
	if err := runNotifyCommand(name, args); err != nil {
		t.Fatalf("runNotifyCommand: %v", err)
	}
	data, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("read log: %v", err)
	}
	got := string(data)
	if !strings.Contains(got, "-Command") || !strings.Contains(got, "ToastNotificationManager") {
		t.Fatalf("powershell should receive toast script, got %q", got)
	}
}

func TestSimulateWindows_PowerShellMissing_Error(t *testing.T) {
	dir := t.TempDir()
	setupFakePath(t, dir, filepath.Join(dir, "log"))

	name, args, err := osNotifyCommand("windows", "标题", "内容")
	if err != nil {
		t.Fatal(err)
	}
	err = runNotifyCommand(name, args)
	if err == nil {
		t.Fatal("expected error when powershell missing")
	}
	if !strings.Contains(err.Error(), "powershell") {
		t.Fatalf("error should name the missing command, got: %v", err)
	}
}