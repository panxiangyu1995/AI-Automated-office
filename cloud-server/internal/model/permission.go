package model

type Permission struct {
	ID          string `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Code        string `gorm:"size:100;not null;uniqueIndex" json:"code"`
	Resource    string `gorm:"size:100;not null" json:"resource"`
	Action      string `gorm:"size:50;not null" json:"action"`
	Description string `gorm:"type:text" json:"description,omitempty"`
}
