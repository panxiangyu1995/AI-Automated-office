package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

func newSkillCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "skill",
		Short: "Skill 管理（列出/查看/执行）",
	}

	cmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "列出所有可用 Skill",
		RunE: func(cmd *cobra.Command, args []string) error {
			return listSkills()
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "describe [skill-name]",
		Short: "查看 Skill 详情",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return describeSkill(args[0])
		},
	})

	cmd.AddCommand(&cobra.Command{
		Use:   "execute [skill-name]",
		Short: "执行 Skill",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return executeSkill(args[0])
		},
	})

	return cmd
}

func listSkills() error {
	fmt.Println("可用 Skill:")
	fmt.Println("  (暂无 - 将在后续 Epic 中实现)")
	return nil
}

func describeSkill(name string) error {
	fmt.Printf("Skill: %s\n", name)
	fmt.Println("  (详情将在后续 Epic 中实现)")
	return nil
}

func executeSkill(name string) error {
	fmt.Printf("执行 Skill: %s\n", name)
	fmt.Println("  (执行逻辑将在后续 Epic 中实现)")
	return nil
}
