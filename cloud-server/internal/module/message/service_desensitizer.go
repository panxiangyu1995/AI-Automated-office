package message

import (
	"regexp"
	"strings"
)

// PIIPattern PII正则模式
type PIIPattern struct {
	Pattern *regexp.Regexp
	Replace string
	Name    string
}

// 默认PII模式
var defaultPIIPatterns = []PIIPattern{
	{
		Pattern: regexp.MustCompile(`\b\d{11}\b`), // 手机号
		Replace: "***",
		Name:    "phone",
	},
	{
		Pattern: regexp.MustCompile(`\b\d{15}|\d{18}\b`), // 身份证
		Replace: "***",
		Name:    "idcard",
	},
	{
		Pattern: regexp.MustCompile(`\b[\w.-]+@[\w.-]+\.\w+\b`), // 邮箱
		Replace: "***@***.***",
		Name:    "email",
	},
	{
		Pattern: regexp.MustCompile(`\b\d{4}[-/]\d{2}[-/]\d{2}\b`), // 日期
		Replace: "****-**-**",
		Name:    "date",
	},
	{
		Pattern: regexp.MustCompile(`\b\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}\b`), // 日期时间
		Replace: "****-**-** **:**:**",
		Name:    "datetime",
	},
	{
		Pattern: regexp.MustCompile(`\b\d{3}[-/]\d{8}\b`), // 银行卡
		Replace: "***/****",
		Name:    "bankcard",
	},
	{
		Pattern: regexp.MustCompile(`(工资|薪酬|薪资)[^\n]{0,20}(?:[\d,]+\.?\d*)元`), // 工资
		Replace: "$1 *** 元",
		Name:    "salary",
	},
}

// Desensitizer 消息脱敏器
type Desensitizer struct {
	patterns []PIIPattern
}

// NewDesensitizer 创建脱敏器
func NewDesensitizer() *Desensitizer {
	return &Desensitizer{patterns: defaultPIIPatterns}
}

// Desensitize 对文本进行脱敏
func (d *Desensitizer) Desensitize(text string) string {
	for _, p := range d.patterns {
		text = p.Pattern.ReplaceAllString(text, p.Replace)
	}
	return text
}

// DesensitizeMessage 对消息内容进行脱敏
func (d *Desensitizer) DesensitizeMessage(content string, level string) string {
	switch level {
	case "high":
		return d.highDesensitize(content)
	case "medium":
		return d.mediumDesensitize(content)
	case "low":
		return d.lowDesensitize(content)
	default:
		return d.mediumDesensitize(content)
	}
}

// highDesensitize 高强度脱敏
func (d *Desensitizer) highDesensitize(content string) string {
	content = d.Desensitize(content)
	// 移除所有连续超过4个非空白字符的替换
	re := regexp.MustCompile(`(?i)(密码|密钥|token|secret)[:\s]*[^\s]{4,}`)
	content = re.ReplaceAllStringFunc(content, func(s string) string {
		return regexp.MustCompile(`[^\s]{4,}`).ReplaceAllString(s, "***")
	})
	return content
}

// mediumDesensitize 中等强度脱敏
func (d *Desensitizer) mediumDesensitize(content string) string {
	return d.Desensitize(content)
}

// lowDesensitize 低强度脱敏（仅敏感关键词）
func (d *Desensitizer) lowDesensitize(content string) string {
	sensitive := []string{"密码", "密钥", "token", "secret", "api_key", "apiKey"}
	for _, s := range sensitive {
		content = strings.ReplaceAll(content, s, "***")
	}
	return content
}

// AddPattern 添加自定义PII模式
func (d *Desensitizer) AddPattern(pattern *regexp.Regexp, replace, name string) {
	d.patterns = append(d.patterns, PIIPattern{
		Pattern: pattern,
		Replace: replace,
		Name:    name,
	})
}

// GlobalDesensitizer 全局脱敏器
var GlobalDesensitizer = NewDesensitizer()
