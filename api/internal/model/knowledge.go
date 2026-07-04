package model

type FileRecord struct {
	TenantModel
	FileName   string `gorm:"type:varchar(255);not null" json:"file_name"`
	FilePath   string `gorm:"type:text;not null" json:"file_path"`
	FileType   string `gorm:"type:varchar(100)" json:"file_type"`
	FileSize   int64  `json:"file_size"`
	Version    int    `gorm:"default:1" json:"version"`
	Category   string `gorm:"type:varchar(100)" json:"category,omitempty"`
	RefID      string `gorm:"type:uuid" json:"ref_id,omitempty"`
	RefType    string `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
}

func (FileRecord) TableName() string { return "file_records" }

type Message struct {
	TenantModel
	SenderID    string `gorm:"type:uuid;index" json:"sender_id"`
	ReceiverID  string `gorm:"type:uuid;index" json:"receiver_id"`
	Title       string `gorm:"type:varchar(255)" json:"title"`
	Content     string `gorm:"type:text" json:"content"`
	MsgType     string `gorm:"type:varchar(50);not null" json:"msg_type"`
	IsRead      bool   `gorm:"default:false" json:"is_read"`
	RefID       string `gorm:"type:uuid" json:"ref_id,omitempty"`
	RefType     string `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
}

func (Message) TableName() string { return "messages" }

type KnowledgeDoc struct {
	TenantModel
	Title      string `gorm:"type:varchar(255);not null" json:"title"`
	CategoryID string `gorm:"type:uuid;index" json:"category_id,omitempty"`
	Content    string `gorm:"type:text" json:"content"`
	Summary    string `gorm:"type:text" json:"summary,omitempty"`
	Tags       string `gorm:"type:varchar(500)" json:"tags,omitempty"`
	Status     string `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
}

func (KnowledgeDoc) TableName() string { return "knowledge_docs" }

type KBCategory struct {
	TenantModel
	Name     string `gorm:"type:varchar(100);not null" json:"name"`
	ParentID string `gorm:"type:uuid" json:"parent_id,omitempty"`
	SortOrder int   `gorm:"default:0" json:"sort_order"`
}

func (KBCategory) TableName() string { return "kb_categories" }
