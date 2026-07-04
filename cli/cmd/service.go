package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/kardianos/service"
	"github.com/spf13/cobra"
)

type program struct{}

func (p *program) Start(s service.Service) error {
	return nil
}

func (p *program) Stop(s service.Service) error {
	return nil
}

var serviceConfig = &service.Config{
	Name:        "ao-cli",
	DisplayName: "AI-Automated-office CLI",
	Description: "AI-Automated-office CLI background poller service",
}

func newServiceCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "service",
		Short: "管理 ao-cli 后台服务",
		Long:  "安装、启动、停止、卸载 ao-cli 后台轮询服务",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "install",
		Short: "安装 ao-cli 后台服务",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServiceAction("install")
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "start",
		Short: "启动 ao-cli 后台服务",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServiceAction("start")
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "stop",
		Short: "停止 ao-cli 后台服务",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServiceAction("stop")
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "uninstall",
		Short: "卸载 ao-cli 后台服务",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runServiceAction("uninstall")
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "status",
		Short: "查看 ao-cli 后台服务状态",
		RunE: func(cmd *cobra.Command, args []string) error {
			s, err := service.New(&program{}, serviceConfig)
			if err != nil {
				return fmt.Errorf("创建服务实例失败: %w", err)
			}
			status, err := s.Status()
			if err != nil {
				return fmt.Errorf("获取服务状态失败: %w", err)
			}
			switch status {
			case service.StatusRunning:
				fmt.Println("ao-cli 服务状态: 运行中")
			case service.StatusStopped:
				fmt.Println("ao-cli 服务状态: 已停止")
			default:
				fmt.Println("ao-cli 服务状态: 未知")
			}
			return nil
		},
	})

	return cmd
}

func runServiceAction(action string) error {
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("获取可执行文件路径失败: %w", err)
	}
	execPath, err = filepath.Abs(execPath)
	if err != nil {
		return fmt.Errorf("获取绝对路径失败: %w", err)
	}

	serviceConfig.Executable = execPath

	s, err := service.New(&program{}, serviceConfig)
	if err != nil {
		return fmt.Errorf("创建服务实例失败: %w", err)
	}

	switch action {
	case "install":
		return s.Install()
	case "start":
		return s.Start()
	case "stop":
		return s.Stop()
	case "uninstall":
		return s.Uninstall()
	}
	return nil
}
