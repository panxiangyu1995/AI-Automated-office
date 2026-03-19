package dto

// RefreshRequest 刷新请求
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshTokenRequest 兼容旧调用
// Deprecated: use RefreshRequest
type RefreshTokenRequest = RefreshRequest
