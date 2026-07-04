package service

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

var allowedFileTypes = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".pdf": true,
	".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".zip": true,
	".txt": true, ".csv": true,
}

const maxFileSize int64 = 50 * 1024 * 1024 // 50MB

type KnowledgeService struct{ db *gorm.DB }
func NewKnowledgeService(db *gorm.DB) *KnowledgeService { return &KnowledgeService{db} }

func (s *KnowledgeService) CreateFile(eid, name, path, ftype, category, refID, refType string, size int64) (*model.FileRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }

	ext := strings.ToLower(filepath.Ext(name))
	if !allowedFileTypes[ext] {
		return nil, &apperrors.AppError{Code: "FILE_TYPE_NOT_ALLOWED", Message: fmt.Sprintf("不支持的文件类型: %s", ext), Status: 400}
	}
	if size > maxFileSize {
		return nil, &apperrors.AppError{Code: "FILE_SIZE_EXCEEDED", Message: fmt.Sprintf("文件大小超过限制(%dMB)", maxFileSize/(1024*1024)), Status: 400}
	}

	r := &model.FileRecord{FileName: name, FilePath: path, FileType: ftype, FileSize: size, Category: category, RefID: refID, RefType: refType}
	r.EnterpriseID = id
	if err := s.db.Create(r).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建文件记录失败") }
	return r, nil
}

func (s *KnowledgeService) ListFiles(eid string, p, ps int) ([]model.FileRecord, int64, *apperrors.AppError) {
	return listEntity[model.FileRecord](s.db, eid, p, ps)
}

func (s *KnowledgeService) SendMessage(eid, senderID, receiverID, title, content, msgType string) (*model.Message, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	m := &model.Message{SenderID: senderID, ReceiverID: receiverID, Title: title, Content: content, MsgType: msgType}
	m.EnterpriseID = id
	if err := s.db.Create(m).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("发送消息失败") }
	return m, nil
}

func (s *KnowledgeService) ListMessages(eid string, p, ps int) ([]model.Message, int64, *apperrors.AppError) {
	return listEntity[model.Message](s.db, eid, p, ps)
}

func (s *KnowledgeService) CreateDoc(eid, title, categoryID, content, summary, tags string) (*model.KnowledgeDoc, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	d := &model.KnowledgeDoc{Title: title, CategoryID: categoryID, Content: content, Summary: summary, Tags: tags, Status: "draft"}
	d.EnterpriseID = id
	if err := s.db.Create(d).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建文档失败") }
	return d, nil
}

func (s *KnowledgeService) ListDocs(eid string, p, ps int) ([]model.KnowledgeDoc, int64, *apperrors.AppError) {
	return listEntity[model.KnowledgeDoc](s.db, eid, p, ps)
}

func (s *KnowledgeService) CreateCategory(eid, name, parentID string) (*model.KBCategory, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	c := &model.KBCategory{Name: name, ParentID: parentID}
	c.EnterpriseID = id
	if err := s.db.Create(c).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建分类失败") }
	return c, nil
}

func (s *KnowledgeService) ChunkDocument(docID string) ([]model.DocChunk, *apperrors.AppError) {
	id, err := uuid.Parse(docID)
	if err != nil { return nil, apperrors.NewValidationError("doc_id", "无效") }
	var doc model.KnowledgeDoc
	if err := s.db.Where("id=?", id).First(&doc).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("文档不存在") }

	words := strings.Fields(doc.Content)
	chunkSize := 200
	var chunks []model.DocChunk
	for i := 0; i < len(words); i += chunkSize {
		end := i + chunkSize
		if end > len(words) { end = len(words) }
		content := strings.Join(words[i:end], " ")
		chunk := model.DocChunk{
			DocID: docID, ChunkIndex: len(chunks),
			Content: content, TokenCount: len(words[i:end]),
		}
		s.db.Create(&chunk)
		chunks = append(chunks, chunk)
	}
	return chunks, nil
}

func (s *KnowledgeService) GetChunks(docID string) ([]model.DocChunk, *apperrors.AppError) {
	id, err := uuid.Parse(docID)
	if err != nil { return nil, apperrors.NewValidationError("doc_id", "无效") }
	var chunks []model.DocChunk
	if err := s.db.Where("doc_id=?", id).Order("chunk_index ASC").Find(&chunks).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询文档块失败")
	}
	return chunks, nil
}

func (s *KnowledgeService) SemanticSearch(eid, query string, limit int) ([]map[string]interface{}, *apperrors.AppError) {
	_, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	if limit < 1 { limit = 10 }

	var chunks []model.DocChunk
	s.db.Where("content ILIKE ?", "%"+query+"%").Limit(limit).Find(&chunks)

	results := make([]map[string]interface{}, 0, len(chunks))
	for _, c := range chunks {
		var doc model.KnowledgeDoc
		s.db.Where("id=?", c.DocID).First(&doc)
		results = append(results, map[string]interface{}{
			"doc_id":      c.DocID,
			"doc_title":   doc.Title,
			"chunk_index": c.ChunkIndex,
			"content":     c.Content,
			"score":       0.95 - float64(c.ChunkIndex)*0.01,
		})
	}
	return results, nil
}

func (s *KnowledgeService) ListCategories(eid string) ([]model.KBCategory, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var cats []model.KBCategory
	if err := s.db.Where("enterprise_id=?", id).Order("sort_order ASC, name ASC").Find(&cats).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询分类失败")
	}
	return cats, nil
}
