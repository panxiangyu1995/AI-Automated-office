package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/config"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/olog"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/poller"
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
	"github.com/panxiangyu1995/AI-Automated-office/cli/pkg/api_client"
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

	describeCmd := &cobra.Command{
		Use:   "describe [skill-name]",
		Short: "查看 Skill 详情",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			role, _ := cmd.Flags().GetString("role")
			return describeSkill(args[0], role)
		},
	}
	describeCmd.Flags().String("role", "", "指定角色查看角色专属开场白")

	cmd.AddCommand(describeCmd)

	execCmd := &cobra.Command{
		Use:   "execute [skill-name]",
		Short: "执行 Skill",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			action, _ := cmd.Flags().GetString("action")
			params, _ := cmd.Flags().GetString("params")
			filePath, _ := cmd.Flags().GetString("file")
			return executeSkill(args[0], action, params, filePath)
		},
	}
	execCmd.Flags().String("action", "", "指定 Skill action")
	execCmd.Flags().String("params", "", "参数 JSON 字符串")
	execCmd.Flags().String("file", "", "上传文件路径（用于附件上传类 Skill）")

	cmd.AddCommand(execCmd)

	linkCmd := &cobra.Command{
		Use:   "link",
		Short: "将 ~/.ao-cli/skills 中的技能部署到已检测的 AI 助手",
		RunE:  runSkillLink,
	}
	linkCmd.PersistentPreRunE = nil
	cmd.AddCommand(linkCmd)

	unlinkCmd := &cobra.Command{
		Use:   "unlink [skill-name]",
		Short: "从 AI 助手目录移除已部署的技能",
		Args:  cobra.ExactArgs(1),
		RunE:  runSkillUnlink,
	}
	unlinkCmd.PersistentPreRunE = nil
	cmd.AddCommand(unlinkCmd)

	updateCmd := &cobra.Command{
		Use:   "update",
		Short: "从服务器更新技能包",
		RunE:  runSkillUpdate,
	}
	updateCmd.PersistentPreRunE = nil
	cmd.AddCommand(updateCmd)

	return cmd
}

func listSkills() error {
	skills := skill.List()
	if len(skills) == 0 {
		fmt.Println("可用 Skill: (暂无)")
		return nil
	}
	fmt.Println("可用 Skill:")
	for _, s := range skills {
		fmt.Printf("  %-20s %s\n", s.Name, s.Description)
	}
	return nil
}

func describeSkill(name, role string) error {
	s, err := skill.Get(name)
	if err != nil {
		return err
	}
	fmt.Printf("Skill: %s\n", s.Name)
	fmt.Printf("描述: %s\n", s.Description)
	fmt.Printf("分类: %s\n", s.Category)
	fmt.Printf("端点: %s %s\n", s.Method, s.APIEndpoint)
	if s.OpeningMessage != "" {
		fmt.Printf("开场白: %s\n", s.OpeningMessage)
	}
	if role != "" {
		if ro, ok := s.RoleOpenings[role]; ok {
			fmt.Printf("\n角色 [%s] 专属开场白:\n", role)
			fmt.Printf("  %s\n", ro.OpeningText)
			if ro.AvailableActions != "" {
				fmt.Printf("  可用操作: %s\n", ro.AvailableActions)
			}
		} else {
			fmt.Printf("\n角色 [%s] 无专属开场白\n", role)
		}
	} else if len(s.RoleOpenings) > 0 {
		fmt.Println("角色开场白:")
		for r, ro := range s.RoleOpenings {
			fmt.Printf("  [%s] %s\n", r, ro.OpeningText)
		}
	}
	if len(s.Parameters) > 0 {
		fmt.Println("参数:")
		for _, p := range s.Parameters {
			reqStr := "必填"
			if !p.Required {
				reqStr = "可选"
				if p.Default != "" {
					reqStr = fmt.Sprintf("可选, 默认: %s", p.Default)
				}
			}
			fmt.Printf("  %-15s %-7s (%s)   %s\n", p.Name, p.Type, reqStr, p.Description)
		}
	}
	if len(s.Actions) > 0 {
		fmt.Println("可用操作:")
		for actionName, actionDef := range s.Actions {
			fmt.Printf("  %-15s %s %s\n", actionName, actionDef.Method, actionDef.Endpoint)
		}
	}
	fmt.Println("操作日志位置: ~/.ai-office-cli/logs/ (JSONL 格式，按日期归档)")
	return nil
}

var preHookEnabled = true

func executeSkill(name, action, paramsJSON, filePath string) error {
	startTime := time.Now()

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("not logged in, run 'ao-cli auth login' first: %w", err)
	}

	if preHookEnabled && name != "message_unread_check" && name != "message_unread" {
		if err := poller.UnreadCheckOnConversationStart(cfg); err != nil {
			fmt.Fprintf(os.Stderr, "[Hook] 未读检查失败: %v\n", err)
		}
	}

	if cfg.IsTokenExpired() && cfg.RefreshToken != "" {
		client := api_client.NewAPIClient(cfg.ServerURL)
		accessToken, refreshToken, expiresIn, err := client.RefreshToken(cfg.RefreshToken)
		if err != nil {
			return fmt.Errorf("token expired and refresh failed, please login again: %w", err)
		}
		cfg.Token = accessToken
		cfg.RefreshToken = refreshToken
		cfg.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)
		if saveErr := config.Save(cfg); saveErr != nil {
			fmt.Fprintf(os.Stderr, "warning: failed to save refreshed token: %v\n", saveErr)
		}
	}

	var paramsMap map[string]interface{}
	if paramsJSON != "" {
		if err := json.Unmarshal([]byte(paramsJSON), &paramsMap); err != nil {
			return fmt.Errorf("invalid params JSON: %w", err)
		}
	}

	enterpriseID := cfg.EnterpriseID
	if eid, ok := paramsMap["enterprise_id"].(string); ok && eid != "" {
		enterpriseID = eid
	}

	client := api_client.NewAPIClient(cfg.ServerURL)
	client.SetToken(cfg.Token)
	if enterpriseID != "" {
		client.SetEnterpriseID(enterpriseID)
	}
	if cfg.HMACSecret != "" {
		client.SetHMACSecret(cfg.HMACSecret)
	}

	s, err := skill.Get(name)
	if err != nil {
		return fmt.Errorf("skill not found: %s", name)
	}

	var checkParams []skill.ParamDef
	if action != "" {
		if actDef, ok := s.Actions[action]; ok {
			checkParams = actDef.Params
		}
	}
	if len(checkParams) == 0 {
		checkParams = s.Parameters
	}
	for _, p := range checkParams {
		if !p.Required {
			continue
		}
		if p.Type == "file" {
			if filePath == "" {
				return fmt.Errorf("missing required file parameter: %s (%s) — use --file flag", p.Name, p.Description)
			}
			continue
		}
		if _, ok := paramsMap[p.Name]; !ok {
			return fmt.Errorf("missing required parameter: %s (%s)", p.Name, p.Description)
		}
	}

	var endpoint, method string
	if action != "" {
		if actDef, ok := s.Actions[action]; ok {
			endpoint = actDef.Endpoint
			method = actDef.Method
		}
	}
	if endpoint == "" {
		endpoint = s.APIEndpoint
		method = s.Method
	}
	if enterpriseID != "" {
		endpoint = strings.ReplaceAll(endpoint, "{enterprise_id}", enterpriseID)
	}
	for k, v := range paramsMap {
		placeholder := "{" + k + "}"
		if strings.Contains(endpoint, placeholder) {
			endpoint = strings.ReplaceAll(endpoint, placeholder, fmt.Sprintf("%v", v))
			delete(paramsMap, k)
		}
	}
	if method == "" {
		method = "POST"
	}

	if strings.Contains(s.APIEndpoint, "{enterprise_id}") {
		delete(paramsMap, "enterprise_id")
	}

	if filePath != "" {
		result, err := client.UploadFile(endpoint, filePath)
		durationMs := time.Since(startTime).Milliseconds()
		entry := olog.Entry{
			TS:         time.Now().Format(time.RFC3339),
			Skill:      name,
			Action:     action,
			DurationMs: durationMs,
		}
		if err != nil {
			entry.Status = "error"
			entry.Error = err.Error()
		} else {
			entry.Status = "success"
		}
		if logErr := olog.Record(entry); logErr != nil {
			fmt.Fprintf(os.Stderr, "warning: failed to record operation log: %v\n", logErr)
		}
		if len(result) == 0 && err == nil {
			fmt.Println(`{"data":{"message":"操作成功","status":"no_content"}}`)
		} else {
			fmt.Println(string(result))
		}
		return err
	}

	var params interface{} = paramsMap

	var result []byte
	switch method {
	case "GET":
		if len(paramsMap) > 0 {
			qs := buildQueryString(paramsMap)
			if strings.Contains(endpoint, "?") {
				endpoint += "&" + qs
			} else {
				endpoint += "?" + qs
			}
		}
		result, err = client.Get(endpoint)
	case "PUT":
		result, err = client.Put(endpoint, params)
	case "DELETE":
		result, err = client.Delete(endpoint)
	case "PATCH":
		result, err = client.Patch(endpoint, params)
	default:
		result, err = client.Post(endpoint, params)
	}

	durationMs := time.Since(startTime).Milliseconds()

	entry := olog.Entry{
		TS:          time.Now().Format(time.RFC3339),
		Skill:       name,
		Action:      action,
		DurationMs:  durationMs,
	}
	if params != nil {
		entry.ParamsSummary = params
	}
	if err != nil {
		entry.Status = "error"
		entry.Error = err.Error()
	} else {
		entry.Status = "success"
	}
	if logErr := olog.Record(entry); logErr != nil {
		fmt.Fprintf(os.Stderr, "warning: failed to record operation log: %v\n", logErr)
	}

	if len(result) == 0 && err == nil {
		fmt.Println(`{"data":{"message":"操作成功","status":"no_content"}}`)
	} else {
		fmt.Println(string(result))
	}

	return err
}

func buildQueryString(params map[string]interface{}) string {
	vals := url.Values{}
	for k, v := range params {
		vals.Set(k, fmt.Sprintf("%v", v))
	}
	return vals.Encode()
}

func runSkillLink(cmd *cobra.Command, args []string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("cannot determine home directory: %w", err)
	}

	aoCliSkillsDir := filepath.Join(home, ".ao-cli", "skills")
	if _, err := os.Stat(aoCliSkillsDir); os.IsNotExist(err) {
		return fmt.Errorf("no skills found at %s — run installation first", aoCliSkillsDir)
	}

	entries, err := os.ReadDir(aoCliSkillsDir)
	if err != nil {
		return fmt.Errorf("failed to read skills directory: %w", err)
	}

	var skillNames []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".skill" {
			skillNames = append(skillNames, e.Name())
		}
	}

	if len(skillNames) == 0 {
		fmt.Println("未找到任何 .skill 文件在 ~/.ao-cli/skills/")
		return nil
	}

	deployed := 0
	for _, skillName := range skillNames {
		src := filepath.Join(aoCliSkillsDir, skillName)
		if err := deploySkillToAgents(src, home); err != nil {
			fmt.Fprintf(os.Stderr, "  ! %s: %v\n", skillName, err)
		} else {
			fmt.Printf("  ✓ %s deployed to %d agent(s)\n", skillName, countAgents(home))
			deployed++
		}
	}

	if deployed > 0 {
		fmt.Printf("\n成功部署 %d 个技能到 AI 助手。\n", deployed)
		fmt.Println("重新启动 AI 助手即可使用。")
	} else {
		fmt.Println("\n未部署任何技能（可能已存在或无权限）")
	}

	return nil
}

func runSkillUnlink(cmd *cobra.Command, args []string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("cannot determine home directory: %w", err)
	}

	skillName := args[0]
	removed := 0

	for _, agent := range knownAgents() {
		targetDir := filepath.Join(home, agent.Dir, agent.Skills)
		targetSkill := filepath.Join(targetDir, skillName)
		if _, err := os.Stat(targetSkill); err == nil {
			if err := os.Remove(targetSkill); err != nil {
				fmt.Fprintf(os.Stderr, "  ! %s/%s: %v\n", agent.Name, skillName, err)
			} else {
				fmt.Printf("  ✓ 从 %s 移除 %s\n", agent.Name, skillName)
				removed++
			}
		}
	}

	if removed > 0 {
		fmt.Printf("\n成功移除 %d 处技能。\n", removed)
	} else {
		fmt.Println("\n未找到该技能（可能未部署）")
	}

	return nil
}

func runSkillUpdate(cmd *cobra.Command, args []string) error {
	fmt.Println("从服务器更新技能包...")
	fmt.Println("功能开发中（待 Phase 4 实现）")
	return nil
}

type agentInfo struct {
	Name   string
	Dir    string
	Skills string
}

var knownAgentsList = []agentInfo{
	{Name: "OpenCode", Dir: ".config/opencode", Skills: "skills"},
	{Name: "Claude Code", Dir: ".claude", Skills: "skills"},
	{Name: "Codex", Dir: ".codex", Skills: "skills"},
}

func knownAgents() []agentInfo {
	var result []agentInfo
	home, _ := os.UserHomeDir()
	for _, a := range knownAgentsList {
		skillsPath := filepath.Join(home, a.Dir, a.Skills)
		if _, err := os.Stat(skillsPath); err == nil {
			result = append(result, a)
		}
	}
	return result
}

func countAgents(home string) int {
	count := 0
	for _, a := range knownAgentsList {
		skillsPath := filepath.Join(home, a.Dir, a.Skills)
		if _, err := os.Stat(skillsPath); err == nil {
			count++
		}
	}
	return count
}

func deploySkillToAgents(skillPath, home string) error {
	deployed := 0
	for _, agent := range knownAgentsList {
		targetDir := filepath.Join(home, agent.Dir, agent.Skills)
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			continue
		}
		srcFile, err := os.Open(skillPath)
		if err != nil {
			continue
		}
		dstFile, err := os.Create(filepath.Join(targetDir, filepath.Base(skillPath)))
		if err != nil {
			srcFile.Close()
			continue
		}
		io.Copy(dstFile, srcFile)
		srcFile.Close()
		dstFile.Close()
		deployed++
	}
	if deployed == 0 {
		return fmt.Errorf("no writable agent directories found")
	}
	return nil
}
