package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
)

func newWhichCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "which",
		Short: "输出 ao-cli 可执行文件的绝对路径",
		Long:  "输出 ao-cli 可执行文件的绝对路径，供 Agent 在 non-interactive shell 中定位 CLI。",
		RunE:  runWhich,
	}
}

func runWhich(cmd *cobra.Command, args []string) error {
	cfg, err := config.Load()
	if err == nil && cfg.CLIPath != "" {
		if _, err := os.Stat(cfg.CLIPath); err == nil {
			fmt.Println(cfg.CLIPath)
			return nil
		}
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("cannot determine ao-cli path: %w", err)
	}
	abs, err := filepath.Abs(exe)
	if err != nil {
		fmt.Println(exe)
		return nil
	}
	fmt.Println(abs)
	return nil
}
