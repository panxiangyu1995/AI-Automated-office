package dto

// RefreshResponse 刷新响应
type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// RefreshTokenResponse 兼容旧调用
// Deprecated: use RefreshResponse
type RefreshTokenResponse = RefreshResponse
