package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var cfgFile string

var rootCmd = &cobra.Command{
	Use:   "ao-cli",
	Short: "AI-Automated-office CLI - 企业经营管理助手",
	Long: `ao-cli 是 AI-Automated-office 的命令行工具，
通过 Agent 调用后端 API 驱动企业业务流程。

支持模块：组织架构、HRM、CRM、进销存、合同管理、财务管理等。`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		return initConfig(cmd)
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		return cmd.Help()
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfigFile)

	rootCmd.PersistentFlags().StringVarP(&cfgFile, "config", "c", "", "config file path (default $HOME/.ao-cli/config.yaml)")
	rootCmd.PersistentFlags().StringP("server", "s", "http://localhost:8080", "API server URL")
	rootCmd.PersistentFlags().StringP("format", "f", "text", "output format (text, json)")

	rootCmd.AddCommand(newAuthCmd())
	rootCmd.AddCommand(newPollCmd())
	rootCmd.AddCommand(newSkillCmd())
}

func initConfigFile() {
	if cfgFile == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return
		}
		cfgFile = home + "/.ao-cli/config.yaml"
	}
}

func initConfig(cmd *cobra.Command) error {
	return nil
}

func getFlagString(cmd *cobra.Command, name string) string {
	val, _ := cmd.Flags().GetString(name)
	return val
}
