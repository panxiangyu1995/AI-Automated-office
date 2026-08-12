package model

import (
	"time"

	"github.com/google/uuid"
)

type FileRecord struct {
	TenantModel
	FileName string  `gorm:"type:varchar(255);not null" json:"file_name"`
	FilePath string  `gorm:"type:text;not null" json:"file_path"`
	FileType string  `gorm:"type:varchar(100)" json:"file_type"`
	FileSize int64   `json:"file_size"`
	Version  int     `gorm:"default:1" json:"version"`
	Category string  `gorm:"type:varchar(100)" json:"category,omitempty"`
	RefID    *string `gorm:"type:uuid" json:"ref_id,omitempty"`
	RefType  string  `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
}

func (FileRecord) TableName() string { return "file_records" }

type Message struct {
	TenantModel
	SenderID       string  `gorm:"type:uuid;index" json:"sender_id"`
	ReceiverID     string  `gorm:"type:uuid;index" json:"receiver_id"`
	Title          string  `gorm:"type:varchar(255)" json:"title"`
	Content        string  `gorm:"type:text" json:"content"`
	MsgType        string  `gorm:"type:varchar(50);not null" json:"msg_type"`
	IsRead         bool    `gorm:"default:false" json:"is_read"`
	RefID          *string `gorm:"type:uuid" json:"ref_id,omitempty"`
	RefType        string  `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
	Priority       string  `gorm:"type:varchar(20);default:'normal'" json:"priority"`
	AnnouncementID *string `gorm:"type:uuid" json:"announcement_id,omitempty"`
}

func (Message) TableName() string { return "messages" }

type Announcement struct {
	TenantModel
	Title      string     `gorm:"type:varchar(255);not null" json:"title"`
	Content    string     `gorm:"type:text;not null" json:"content"`
	SenderID   string     `gorm:"type:uuid;not null" json:"sender_id"`
	Priority   string     `gorm:"type:varchar(20);default:'normal'" json:"priority"`
	TargetType string     `gorm:"type:varchar(50);default:'all'" json:"target_type"`
	TargetID   *string    `gorm:"type:uuid" json:"target_id,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
}

func (Announcement) TableName() string { return "announcements" }

type AnnouncementReadStatus struct {
	BaseModel
	AnnouncementID uuid.UUID `gorm:"type:uuid;not null;index" json:"announcement_id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
}

func (AnnouncementReadStatus) TableName() string { return "announcement_read_statuses" }

type KnowledgeDoc struct {
	TenantModel
	Title                string  `gorm:"type:varchar(255);not null" json:"title"`
	CategoryID           *string `gorm:"type:text;index" json:"category_id,omitempty"`
	Content              string  `gorm:"type:text" json:"content"`
	Summary              string  `gorm:"type:text" json:"summary,omitempty"`
	Tags                 string  `gorm:"type:varchar(500)" json:"tags,omitempty"`
	Status               string  `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	Version              int     `gorm:"default:1" json:"version"`
	ParentVersionID      *string `gorm:"type:uuid" json:"parent_version_id,omitempty"`
	Visibility           string  `gorm:"type:varchar(20);default:'public'" json:"visibility"`
	AllowedDepartmentIDs string  `gorm:"type:jsonb" json:"allowed_department_ids,omitempty"`
	CreatorID            string  `gorm:"type:uuid;index" json:"creator_id,omitempty"`
}

func (KnowledgeDoc) TableName() string { return "knowledge_docs" }

type VectorRecord struct {
	BaseModel
	DocID      string    `gorm:"type:uuid;not null;index" json:"doc_id"`
	ChunkIndex int       `json:"chunk_index"`
	Content    string    `gorm:"type:text" json:"content"`
	Embedding  []float32 `gorm:"-" json:"-"`
}

func (VectorRecord) TableName() string { return "vector_records" }

type DocChunk struct {
	BaseModel
	DocID      string `gorm:"type:uuid;not null;index" json:"doc_id"`
	ChunkIndex int    `json:"chunk_index"`
	Content    string `gorm:"type:text" json:"content"`
	TokenCount int    `json:"token_count"`
}

func (DocChunk) TableName() string { return "doc_chunks" }

type ChatSession struct {
	TenantModel
	UserID  string `gorm:"type:text;index" json:"user_id"`
	Title   string `gorm:"type:varchar(255)" json:"title"`
	Model   string `gorm:"type:varchar(50);default:'gpt-4o-mini'" json:"model"`
	Context string `gorm:"type:text" json:"context,omitempty"`
}

func (ChatSession) TableName() string { return "chat_sessions" }

type ChatMessage struct {
	BaseModel
	SessionID string `gorm:"type:uuid;not null;index" json:"session_id"`
	Role      string `gorm:"type:varchar(20);not null" json:"role"`
	Content   string `gorm:"type:text;not null" json:"content"`
}

func (ChatMessage) TableName() string { return "chat_messages" }

type KBCategory struct {
	TenantModel
	Name      string  `gorm:"type:varchar(100);not null" json:"name"`
	ParentID  *string `gorm:"type:uuid" json:"parent_id,omitempty"`
	SortOrder int     `gorm:"default:0" json:"sort_order"`
}

func (KBCategory) TableName() string { return "kb_categories" }
