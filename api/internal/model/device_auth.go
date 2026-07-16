package model

import "time"

type DeviceCode struct {
	ID                  string     `gorm:"type:varchar(100);primary_key" json:"id"`
	DeviceCode          string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"device_code"`
	UserCode            string     `gorm:"type:varchar(20);uniqueIndex;not null" json:"user_code"`
	ClientID            string     `gorm:"type:varchar(100);not null" json:"client_id"`
	CodeChallenge       string     `gorm:"type:varchar(128)" json:"code_challenge,omitempty"`
	CodeChallengeMethod string     `gorm:"type:varchar(10)" json:"code_challenge_method,omitempty"`
	ExpiresAt           time.Time  `gorm:"not null" json:"expires_at"`
	Interval            int        `gorm:"default:5" json:"interval"`
	Verified            bool       `gorm:"default:false" json:"verified"`
	Exchanged           bool       `gorm:"default:false" json:"exchanged"`
	UserID              *string    `gorm:"type:uuid" json:"user_id,omitempty"`
	Scopes              string     `gorm:"type:text" json:"scopes"`
	CreatedAt           time.Time  `gorm:"autoCreateTime" json:"created_at"`
}

func (DeviceCode) TableName() string {
	return "device_codes"
}
