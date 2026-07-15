package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type KnowledgeVersionService struct {
	knowledgeRepo repository.KnowledgeRepository
}

func NewKnowledgeVersionService(knowledgeRepo repository.KnowledgeRepository) *KnowledgeVersionService {
	return &KnowledgeVersionService{knowledgeRepo: knowledgeRepo}
}

func (s *KnowledgeVersionService) CreateVersion(docID string) (*model.KnowledgeDoc, error) {
	id, err := uuid.Parse(docID)
	if err != nil {
		return nil, apperrors.NewValidationError("doc_id", "无效")
	}
	doc, dbErr := s.knowledgeRepo.FindDocByID(id)
	if dbErr != nil {
		return nil, dbErr
	}
	if doc == nil {
		return nil, apperrors.ErrNotFound.WithDetail("文档不存在")
	}

	parentID := doc.ID.String()
	snapshot := &model.KnowledgeDoc{
		Title:                doc.Title,
		CategoryID:           doc.CategoryID,
		Content:              doc.Content,
		Summary:              doc.Summary,
		Tags:                 doc.Tags,
		Status:               doc.Status,
		Version:              doc.Version + 1,
		ParentVersionID:      &parentID,
		Visibility:           doc.Visibility,
		AllowedDepartmentIDs: doc.AllowedDepartmentIDs,
	}
	snapshot.EnterpriseID = doc.EnterpriseID

	if err := s.knowledgeRepo.CreateDoc(snapshot); err != nil {
		return nil, err
	}
	return snapshot, nil
}

func (s *KnowledgeVersionService) ListVersions(docID string) ([]model.KnowledgeDoc, error) {
	id, err := uuid.Parse(docID)
	if err != nil {
		return nil, apperrors.NewValidationError("doc_id", "无效")
	}
	versions, dbErr := s.knowledgeRepo.ListDocVersions(id)
	if dbErr != nil {
		return nil, dbErr
	}
	return versions, nil
}

func (s *KnowledgeVersionService) GetVersion(docID string, version int) (*model.KnowledgeDoc, error) {
	id, err := uuid.Parse(docID)
	if err != nil {
		return nil, apperrors.NewValidationError("doc_id", "无效")
	}
	doc, dbErr := s.knowledgeRepo.FindDocByVersion(id, version)
	if dbErr != nil {
		return nil, dbErr
	}
	if doc == nil {
		return nil, apperrors.ErrNotFound.WithDetail("版本不存在")
	}
	return doc, nil
}

func (s *KnowledgeVersionService) CompareVersions(docID string, v1, v2 int) (map[string]interface{}, error) {
	id, err := uuid.Parse(docID)
	if err != nil {
		return nil, apperrors.NewValidationError("doc_id", "无效")
	}
	doc1, dbErr := s.knowledgeRepo.FindDocByVersion(id, v1)
	if dbErr != nil {
		return nil, dbErr
	}
	if doc1 == nil {
		return nil, apperrors.ErrNotFound.WithDetail("版本不存在")
	}
	doc2, dbErr := s.knowledgeRepo.FindDocByVersion(id, v2)
	if dbErr != nil {
		return nil, dbErr
	}
	if doc2 == nil {
		return nil, apperrors.ErrNotFound.WithDetail("版本不存在")
	}
	return map[string]interface{}{
		"version_1": doc1,
		"version_2": doc2,
	}, nil
}
