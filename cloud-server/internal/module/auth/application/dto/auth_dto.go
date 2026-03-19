package dto

// LogoutRequest 登出请求
type LogoutRequest struct {
	AllSessions bool `json:"all_sessions"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username   string `json:"username" binding:"required,min=3,max=50"`
	Password   string `json:"password" binding:"required,min=8,max=100"`
	Name       string `json:"name" binding:"required,min=2,max=50"`
	Email      string `json:"email" binding:"required,email"`
	Department string `json:"department"`
}

// ForgotPasswordRequest 忘记密码请求
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8,max=100"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}
