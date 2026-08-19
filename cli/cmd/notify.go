package cmd

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/poller"
)

func newNotifyCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "notify",
		Short: "系统桌面通知（测试/开启/关闭）",
		Long: `管理系统桌面通知。
使用 ao-cli notify test 发送一条测试通知并输出平台诊断。
使用 ao-cli notify enable/disable 开启或关闭系统弹窗。`,
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "test",
		Short: "发送测试通知并输出平台诊断",
		RunE:  runNotifyTest,
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "enable",
		Short: "开启系统通知",
		RunE: func(cmd *cobra.Command, args []string) error {
			return setNotifyEnable(true)
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "disable",
		Short: "关闭系统通知",
		RunE: func(cmd *cobra.Command, args []string) error {
			return setNotifyEnable(false)
		},
	})

	return cmd
}

func runNotifyTest(cmd *cobra.Command, args []string) error {
	fmt.Printf("平台: %s\n", runtime.GOOS)

	missing, hint, err := poller.CheckNotifyDeps()
	if err != nil {
		return fmt.Errorf("依赖检查失败: %w", err)
	}
	if len(missing) > 0 {
		fmt.Printf("依赖缺失: %v\n", missing)
		fmt.Printf("安装指引: %s\n", hint)
	} else {
		fmt.Println("依赖探测: OK")
	}

	if cfg, err := config.Load(); err == nil {
		fmt.Printf("通知开关: %v\n", cfg.Notify.Enable)
	} else {
		fmt.Println("通知开关: 未配置（运行 ao-cli init 初始化；测试通知不受开关限制）")
	}

	if err := poller.SendNotification("ao-cli 测试通知", "系统通知链路正常", poller.NotifyConfig{Enable: true}); err != nil {
		return fmt.Errorf("发送测试通知失败: %w", err)
	}
	fmt.Println("测试通知已发送")
	return nil
}

func setNotifyEnable(enable bool) error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("读取配置失败，请先运行 ao-cli init: %w", err)
	}
	cfg.Notify.Enable = enable
	if err := config.Save(cfg); err != nil {
		return fmt.Errorf("保存配置失败: %w", err)
	}
	if enable {
		fmt.Println("系统通知已开启")
	} else {
		fmt.Println("系统通知已关闭")
	}
	return nil
}