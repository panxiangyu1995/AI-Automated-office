package masking

type MaskingRule struct {
	Field    string `json:"field"`
	Strategy string `json:"strategy"`
	Enabled  bool   `json:"enabled"`
}

func ApplyMask(value, strategy string) string {
	switch strategy {
	case "phone":
		return maskPhone(value)
	case "email":
		return maskEmail(value)
	case "idcard":
		return maskIDCard(value)
	case "name":
		return maskName(value)
	case "bank_account":
		return maskBankAccount(value)
	default:
		return value
	}
}

func maskPhone(v string) string {
	if len(v) < 7 {
		return v
	}
	return v[:3] + "****" + v[len(v)-4:]
}

func maskEmail(v string) string {
	at := -1
	for i := 0; i < len(v); i++ {
		if v[i] == '@' {
			at = i
			break
		}
	}
	if at <= 0 {
		return v
	}
	return v[:1] + "***" + v[at:]
}

func maskIDCard(v string) string {
	if len(v) < 7 {
		return v
	}
	return v[:3] + stringsRepeat("*", len(v)-7) + v[len(v)-4:]
}

func maskName(v string) string {
	runes := []rune(v)
	if len(runes) <= 1 {
		return v
	}
	return string(runes[:1]) + stringsRepeat("*", len(runes)-1)
}

func maskBankAccount(v string) string {
	if len(v) < 4 {
		return v
	}
	return stringsRepeat("*", len(v)-4) + v[len(v)-4:]
}

func stringsRepeat(s string, n int) string {
	result := ""
	for i := 0; i < n; i++ {
		result += s
	}
	return result
}
