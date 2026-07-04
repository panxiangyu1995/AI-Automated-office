package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type KnowledgeService struct{ db *gorm.DB }
func NewKnowledgeService(db *gorm.DB) *KnowledgeService { return &KnowledgeService{db} }

func (s *KnowledgeService) CreateFile(eid, name, path, ftype, category, refID, refType string, size int64) (*model.FileRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
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

func (s *KnowledgeService) ListCategories(eid string) ([]model.KBCategory, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	var cats []model.KBCategory
	if err := s.db.Where("enterprise_id=?", id).Order("sort_order ASC, name ASC").Find(&cats).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询分类失败")
	}
	return cats, nil
}
