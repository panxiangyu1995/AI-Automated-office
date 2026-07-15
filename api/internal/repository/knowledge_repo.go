package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type KnowledgeRepository interface {
	CreateFile(r *model.FileRecord) error
	ListFiles(enterpriseID uuid.UUID, page, pageSize int) ([]model.FileRecord, int64, error)
	CreateMessage(m *model.Message) error
	ListMessages(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error)
	CreateDoc(d *model.KnowledgeDoc) error
	ListDocs(enterpriseID uuid.UUID, page, pageSize int) ([]model.KnowledgeDoc, int64, error)
	FindDocByID(id uuid.UUID) (*model.KnowledgeDoc, error)
	CreateChunk(chunk *model.DocChunk) error
	ListChunksByDocID(docID uuid.UUID) ([]model.DocChunk, error)
	SearchChunks(query string, limit int) ([]model.DocChunk, error)
	FindDocByIDSimple(id uuid.UUID) (*model.KnowledgeDoc, error)
	CreateCategory(c *model.KBCategory) error
	ListCategories(enterpriseID uuid.UUID) ([]model.KBCategory, error)
	ListDocVersions(docID uuid.UUID) ([]model.KnowledgeDoc, error)
	FindDocByVersion(docID uuid.UUID, version int) (*model.KnowledgeDoc, error)
	KeywordSearch(enterpriseID uuid.UUID, query string, page, pageSize int) ([]model.KnowledgeDoc, int64, error)
	ListDocsByVisibility(enterpriseID uuid.UUID, userID string, departmentIDs []string, page, pageSize int) ([]model.KnowledgeDoc, int64, error)
	SearchChunksByEnterprise(query string, enterpriseID uuid.UUID, limit int) ([]model.DocChunk, error)
	KeywordSearchChunks(enterpriseID uuid.UUID, query string, limit int) ([]model.DocChunk, error)
}
