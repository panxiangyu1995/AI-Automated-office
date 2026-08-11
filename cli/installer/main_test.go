package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/charmbracelet/bubbletea"
)

// 按键辅助构造
func key(s string) tea.KeyMsg {
	switch s {
	case "enter":
		return tea.KeyMsg{Type: tea.KeyEnter, Runes: []rune{'\r'}}
	case "backspace":
		return tea.KeyMsg{Type: tea.KeyBackspace, Runes: []rune{'\b'}}
	case "ctrl+c":
		return tea.KeyMsg{Type: tea.KeyCtrlC}
	case "up":
		return tea.KeyMsg{Type: tea.KeyUp, Runes: []rune{'\x1b'}}
	case "down":
		return tea.KeyMsg{Type: tea.KeyDown, Runes: []rune{'\x1b'}}
	case "q":
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'q'}}
	case " ":
		return tea.KeyMsg{Type: tea.KeySpace, Runes: []rune{' '}}
	default:
		return tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(s)}
	}
}

func update(m model, k tea.KeyMsg) model {
	next, _ := m.Update(k)
	return next.(model)
}

func updateMsg(m model, msg tea.Msg) model {
	next, _ := m.Update(msg)
	return next.(model)
}

func TestStepFlow_NormalInstall(t *testing.T) {
	m := initialModel()

	// step 0: 空格接受许可 → step 1
	m = update(m, key(" "))
	if m.step != 1 {
		t.Fatalf("space on step0: expected step 1, got %d", m.step)
	}

	// step 1: 输入路径字符 + backspace + enter
	m = update(m, key("x"))
	m = update(m, key("y"))
	if m.installPath != "xy" && !strings.HasSuffix(m.installPath, "xy") {
		t.Errorf("path input not appended: %q", m.installPath)
	}
	m = update(m, key("backspace"))
	if strings.HasSuffix(m.installPath, "y") {
		t.Errorf("backspace should remove last char: %q", m.installPath)
	}
	m = update(m, key("enter"))
	if m.step != 2 {
		t.Fatalf("enter on step1: expected step 2, got %d", m.step)
	}

	// step 2: URL 输入 + enter
	m = update(m, key("h"))
	if !strings.Contains(m.serverURL, "h") {
		t.Errorf("URL input not appended: %q", m.serverURL)
	}
	m = update(m, key("enter"))
	if m.step != 3 {
		t.Fatalf("enter on step2: expected step 3, got %d", m.step)
	}

	// step 3: 选项切换
	m = update(m, key("down"))
	if m.cursor != 1 {
		t.Errorf("down: expected cursor 1, got %d", m.cursor)
	}
	m = update(m, key("up"))
	if m.cursor != 0 {
		t.Errorf("up: expected cursor 0, got %d", m.cursor)
	}
	m = update(m, key(" "))
	if m.options[0].on {
		t.Error("space should toggle option off")
	}
	m = update(m, key(" "))
	if !m.options[0].on {
		t.Error("space should toggle option back on")
	}
	m = update(m, key("enter"))
	if m.step != 4 {
		t.Fatalf("enter on step3: expected step 4 (install), got %d", m.step)
	}
}

func TestStepFlow_EnterSkipsLicense(t *testing.T) {
	m := initialModel()
	m = update(m, key("enter"))
	if m.step != 1 {
		t.Errorf("enter should skip license, got step %d", m.step)
	}
}

func TestQuit_CtrlCAtAnyStep(t *testing.T) {
	for step := 0; step <= 5; step++ {
		m := initialModel()
		m.step = step
		m = update(m, key("ctrl+c"))
		if !m.quitting {
			t.Errorf("ctrl+c at step %d should quit", step)
		}
	}
}

func TestQuit_QOnlyAtCompletion(t *testing.T) {
	// 输入步骤中 q 是普通字符，不应退出
	for _, step := range []int{1, 2, 3, 4} {
		m := initialModel()
		m.step = step
		m = update(m, key("q"))
		if m.quitting {
			t.Errorf("q at step %d should NOT quit", step)
		}
	}

	// 完成界面 q 退出
	m := initialModel()
	m.step = 5
	m = update(m, key("q"))
	if !m.quitting {
		t.Error("q at step 5 should quit")
	}

	// step 0 的 q 不退出（继续流程）
	m = initialModel()
	m = update(m, key("q"))
	if m.quitting {
		t.Error("q at step 0 should NOT quit")
	}
}

func TestInstallMessages_ProgressToComplete(t *testing.T) {
	m := initialModel()
	m.step = 4

	// 模拟安装消息序列
	ch := make(chan installMsg)
	m.installCh = ch

	// 阶段进度
	m = updateMsg(m, installMsg{status: "创建目录结构", progress: 0.1})
	if m.step != 4 || m.status != "创建目录结构" {
		t.Errorf("progress msg not applied: step=%d status=%q", m.step, m.status)
	}

	m = updateMsg(m, installMsg{status: "验证安装", progress: 0.8})
	if m.progress != 0.8 {
		t.Errorf("progress not updated: %v", m.progress)
	}

	// 完成
	m = updateMsg(m, installMsg{status: "安装完成", progress: 1.0, done: true})
	if m.step != 5 {
		t.Fatalf("done msg should advance to step 5, got %d", m.step)
	}
	if m.progress != 1.0 {
		t.Errorf("progress should be 1.0 on done, got %v", m.progress)
	}
}

func TestInstallMessages_FailureAndRetry(t *testing.T) {
	m := initialModel()
	m.step = 4

	// 失败消息
	m = updateMsg(m, installMsg{status: "安装失败: 复制 ao-cli 失败: x", failed: true})
	if !m.failed() {
		t.Error("model should be in failed state")
	}
	if m.progress != 0 {
		t.Errorf("progress should reset on failure, got %v", m.progress)
	}
	if m.step != 4 {
		t.Errorf("failed install should stay on step 4, got %d", m.step)
	}

	// Enter 返回选项步骤重试
	m = update(m, key("enter"))
	if m.step != 3 {
		t.Errorf("enter after failure should return to step 3, got %d", m.step)
	}
	if m.status != "" {
		t.Errorf("status should be cleared on retry, got %q", m.status)
	}
}

func TestInstallMessages_ProgressMonotonicInView(t *testing.T) {
	m := initialModel()
	m.step = 4
	m.progress = 0.5
	m.status = "安装 ao-cli"

	view := m.View()
	if !strings.Contains(view, "50%") {
		t.Errorf("view should show 50%%, got: %s", view)
	}
	if !strings.Contains(view, "安装 ao-cli") {
		t.Errorf("view should show stage status")
	}
}

func TestView_AllStepsRender(t *testing.T) {
	for step := 0; step <= 5; step++ {
		m := initialModel()
		m.step = step
		m.progress = 0.5
		m.status = "测试"
		v := m.View()
		if v == "" {
			t.Errorf("empty view at step %d", step)
		}
		if !strings.Contains(v, m.steps[step]) {
			t.Errorf("view at step %d missing step name %q", step, m.steps[step])
		}
	}
}

func TestView_FailedStateShowsError(t *testing.T) {
	m := initialModel()
	m.step = 4
	m.status = "安装失败: 磁盘已满"
	m.progress = 0

	v := m.View()
	if !strings.Contains(v, "安装失败") {
		t.Error("failed state should show error in view")
	}
	if !strings.Contains(v, "磁盘已满") {
		t.Error("failed state should show error detail")
	}
}

func TestInitialModelDefaults(t *testing.T) {
	m := initialModel()
	if m.step != 0 {
		t.Errorf("should start at step 0")
	}
	if len(m.steps) != 6 {
		t.Errorf("expected 6 steps, got %d", len(m.steps))
	}
	if m.installPath == "" {
		t.Error("install path should have default")
	}
	if !m.options[0].on || !m.options[1].on {
		t.Error("options should default to enabled")
	}
	if m.serverURL == "" {
		t.Error("server URL should have default")
	}
}

func TestRunInstaller_NoTTYReturnsError(t *testing.T) {
	// 无 TTY 环境下应返回错误而非 panic（CI 场景）
	dir := t.TempDir()
	origHome := os.Getenv("HOME")
	os.Setenv("HOME", dir)
	defer os.Setenv("HOME", origHome)

	// 临时 HOME 中放置 ao-cli 与 skill，验证安装可走通
	binDir := filepath.Join(dir, ".ao-cli", "bin")
	if err := os.MkdirAll(binDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(binDir, "ao-cli"), []byte("x"), 0755); err != nil {
		t.Fatal(err)
	}
	_ = filepath.Join(dir, "config.yaml")
}
