package entity

// Token holds issued access and refresh token outputs.
type Token struct {
	AccessToken  string `gorm:"-" json:"access_token"`
	RefreshToken string `gorm:"-" json:"refresh_token"`
	ExpiresIn    int64  `gorm:"-" json:"expires_in"`
}
