package model

import "time"

type User struct {
	BaseModel
	EnterpriseID  string    `gorm:"type:uuid;not null;index" json:"enterprise_id"`
	EmployeeID    *string   `gorm:"type:uuid;index" json:"employee_id,omitempty"`
	Email         string    `gorm:"type:varchar(255);uniqueIndex:idx_user_email_enterprise,priority:2;not null" json:"email"`
	PasswordHash  string    `gorm:"type:varchar(255);not null" json:"-"`
	Name          string    `gorm:"type:varchar(100);not null" json:"name"`
	Role          string    `gorm:"type:varchar(50);not null;default:'employee'" json:"role"`
	Status        string    `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
}

func (User) TableName() string {
	return "users"
}
