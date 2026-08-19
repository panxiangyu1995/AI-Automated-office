package poller

import (
	"os/exec"
	"runtime"
)

// CheckNotifyDeps 探测当前平台发送 OS 通知所需的命令。
// 返回缺失命令列表与安装指引；纯探测，不发送通知。
// Linux 下 notify-send 与 kdialog 任一存在即可用（B4 多路降级）。
func CheckNotifyDeps() (missing []string, hint string, err error) {
	switch runtime.GOOS {
	case "darwin":
		if _, err := exec.LookPath("osascript"); err != nil {
			return []string{"osascript"}, "macOS 自带 osascript，请检查 PATH 是否异常", nil
		}
	case "linux":
		_, nsErr := exec.LookPath("notify-send")
		_, kdErr := exec.LookPath("kdialog")
		if nsErr != nil && kdErr != nil {
			return []string{"notify-send", "kdialog"}, "安装其一：apt install libnotify-bin (GNOME) / apt install kdialog (KDE)；dnf 对应 libnotify / kdialog", nil
		}
	case "windows":
		if _, err := exec.LookPath("powershell"); err != nil {
			return []string{"powershell"}, "Windows 自带 PowerShell，请检查 PATH 是否异常", nil
		}
	}
	return nil, "", nil
}