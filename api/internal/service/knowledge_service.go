package service

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

var allowedFileTypes = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".pdf": true,
	".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".zip": true,
	".txt": true, ".csv": true,
}

const maxFileSize int64 = 50 * 1024 * 1024

const rrfK = 60

type KnowledgeService struct{ repo repository.KnowledgeRepository }
func NewKnowledgeService(repo repository.KnowledgeRepository) *KnowledgeService { return &KnowledgeService{repo} }

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

	r := &model.FileRecord{FileName: name, FilePath: path, FileType: ftype, FileSize: size, Category: category, RefID: strPtr(refID), RefType: refType}
	r.EnterpriseID = id
	if err := s.repo.CreateFile(r); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建文件记录失败") }
	return r, nil
}

func (s *KnowledgeService) ListFiles(eid string, p, ps int) ([]model.FileRecord, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	items, total, dbErr := s.repo.ListFiles(id, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	return items, total, nil
}

func (s *KnowledgeService) SendMessage(eid, senderID, receiverID, title, content, msgType string) (*model.Message, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	m := &model.Message{SenderID: senderID, ReceiverID: receiverID, Title: title, Content: content, MsgType: msgType}
	m.EnterpriseID = id
	if err := s.repo.CreateMessage(m); err != nil { return nil, apperrors.ErrInternal.WithDetail("发送消息失败") }
	return m, nil
}

func (s *KnowledgeService) ListMessages(eid string, p, ps int) ([]model.Message, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	items, total, dbErr := s.repo.ListMessages(id, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	return items, total, nil
}

func (s *KnowledgeService) CreateDoc(eid, title, categoryID, content, summary, tags string) (*model.KnowledgeDoc, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	d := &model.KnowledgeDoc{Title: title, CategoryID: strPtr(categoryID), Content: content, Summary: summary, Tags: tags, Status: "draft", Version: 1, Visibility: "public"}
	d.EnterpriseID = id
	if err := s.repo.CreateDoc(d); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建文档失败") }
	return d, nil
}

func (s *KnowledgeService) ListDocs(eid string, p, ps int) ([]model.KnowledgeDoc, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	items, total, dbErr := s.repo.ListDocs(id, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	return items, total, nil
}

func (s *KnowledgeService) ListDocsByVisibility(eid, userID string, departmentIDs []string, p, ps int) ([]model.KnowledgeDoc, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	items, total, dbErr := s.repo.ListDocsByVisibility(id, userID, departmentIDs, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	return items, total, nil
}

func (s *KnowledgeService) CreateCategory(eid, name, parentID string) (*model.KBCategory, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	c := &model.KBCategory{Name: name, ParentID: strPtr(parentID)}
	c.EnterpriseID = id
	if err := s.repo.CreateCategory(c); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建分类失败") }
	return c, nil
}

func (s *KnowledgeService) ChunkDocument(docID string) ([]model.DocChunk, *apperrors.AppError) {
	id, err := uuid.Parse(docID)
	if err != nil { return nil, apperrors.NewValidationError("doc_id", "无效") }
	doc, dbErr := s.repo.FindDocByID(id, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询文档失败") }
	if doc == nil { return nil, apperrors.ErrNotFound.WithDetail("文档不存在") }

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
		s.repo.CreateChunk(&chunk)
		chunks = append(chunks, chunk)
	}
	return chunks, nil
}

func (s *KnowledgeService) GetChunks(docID string) ([]model.DocChunk, *apperrors.AppError) {
	id, err := uuid.Parse(docID)
	if err != nil { return nil, apperrors.NewValidationError("doc_id", "无效") }
	chunks, dbErr := s.repo.ListChunksByDocID(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询文档块失败")
	}
	return chunks, nil
}

func (s *KnowledgeService) SemanticSearch(eid, query, mode string, limit int) ([]map[string]interface{}, *apperrors.AppError) {
	eidUUID, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	if limit < 1 { limit = 10 }

	switch mode {
	case "keyword":
		return s.keywordSearch(eidUUID, query, limit)
	case "hybrid":
		return s.hybridSearch(eidUUID, query, limit)
	default:
		return s.semanticSearchDefault(eidUUID, query, limit)
	}
}

func (s *KnowledgeService) semanticSearchDefault(eidUUID uuid.UUID, query string, limit int) ([]map[string]interface{}, *apperrors.AppError) {
	chunks, _ := s.repo.SearchChunksByEnterprise(query, eidUUID, limit)

	results := make([]map[string]interface{}, 0, len(chunks))
	for i, c := range chunks {
		doc, _ := s.repo.FindDocByIDSimple(uuid.MustParse(c.DocID), eidUUID)
		docTitle := ""
		if doc != nil {
			docTitle = doc.Title
		}
		results = append(results, map[string]interface{}{
			"doc_id":      c.DocID,
			"doc_title":   docTitle,
			"chunk_index": c.ChunkIndex,
			"content":     c.Content,
			"score":       0.95 - float64(i)*0.01,
		})
	}
	return results, nil
}

func (s *KnowledgeService) keywordSearch(eidUUID uuid.UUID, query string, limit int) ([]map[string]interface{}, *apperrors.AppError) {
	docs, _, dbErr := s.repo.KeywordSearch(eidUUID, query, 1, limit)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("关键词搜索失败") }

	results := make([]map[string]interface{}, 0, len(docs))
	for i, d := range docs {
		results = append(results, map[string]interface{}{
			"doc_id":    d.ID.String(),
			"doc_title": d.Title,
			"content":   d.Content,
			"score":     1.0 - float64(i)*0.01,
		})
	}
	return results, nil
}

func (s *KnowledgeService) hybridSearch(eidUUID uuid.UUID, query string, limit int) ([]map[string]interface{}, *apperrors.AppError) {
	semResults, _ := s.semanticSearchDefault(eidUUID, query, limit)
	kwResults, _ := s.keywordSearch(eidUUID, query, limit)

	scoreMap := make(map[string]float64)
	dataMap := make(map[string]map[string]interface{})

	for i, r := range semResults {
		key := fmt.Sprintf("%v", r["doc_id"])
		if chunkIdx, ok := r["chunk_index"]; ok {
			key = fmt.Sprintf("%v_%v", r["doc_id"], chunkIdx)
		}
		scoreMap[key] += 1.0 / float64(rrfK + i + 1)
		dataMap[key] = r
	}
	for i, r := range kwResults {
		key := fmt.Sprintf("%v", r["doc_id"])
		scoreMap[key] += 1.0 / float64(rrfK + i + 1)
		if _, exists := dataMap[key]; !exists {
			dataMap[key] = r
		}
	}

	type scored struct {
		key   string
		score float64
	}
	var sorted []scored
	for k, v := range scoreMap {
		sorted = append(sorted, scored{k, v})
	}
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].score > sorted[j].score })

	if len(sorted) > limit {
		sorted = sorted[:limit]
	}

	results := make([]map[string]interface{}, 0, len(sorted))
	for _, s := range sorted {
		r := dataMap[s.key]
		r["score"] = s.score
		results = append(results, r)
	}
	return results, nil
}

func (s *KnowledgeService) ListCategories(eid string) ([]model.KBCategory, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	cats, dbErr := s.repo.ListCategories(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询分类失败")
	}
	return cats, nil
}
