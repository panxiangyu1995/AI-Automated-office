package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type knowledgeRepo struct {
	db *gorm.DB
}

func NewKnowledgeRepository(db *gorm.DB) KnowledgeRepository {
	return &knowledgeRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *knowledgeRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *knowledgeRepo) CreateFile(rec *model.FileRecord) error {
	return r.fresh().Create(rec).Error
}

func (r *knowledgeRepo) ListFiles(enterpriseID uuid.UUID, page, pageSize int) ([]model.FileRecord, int64, error) {
	var items []model.FileRecord
	var total int64
	q := r.fresh().Model(&model.FileRecord{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *knowledgeRepo) CreateMessage(m *model.Message) error {
	return r.fresh().Create(m).Error
}

func (r *knowledgeRepo) ListMessages(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error) {
	var items []model.Message
	var total int64
	q := r.fresh().Model(&model.Message{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *knowledgeRepo) CreateDoc(d *model.KnowledgeDoc) error {
	return r.fresh().Create(d).Error
}

func (r *knowledgeRepo) ListDocs(enterpriseID uuid.UUID, page, pageSize int) ([]model.KnowledgeDoc, int64, error) {
	var items []model.KnowledgeDoc
	var total int64
	q := r.fresh().Model(&model.KnowledgeDoc{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *knowledgeRepo) FindDocByID(id, enterpriseID uuid.UUID) (*model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &doc, nil
}

func (r *knowledgeRepo) CreateChunk(chunk *model.DocChunk) error {
	return r.fresh().Create(chunk).Error
}

func (r *knowledgeRepo) ListChunksByDocID(docID uuid.UUID) ([]model.DocChunk, error) {
	var chunks []model.DocChunk
	if err := r.fresh().Where("doc_id=?", docID).Order("chunk_index ASC").Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}

func (r *knowledgeRepo) SearchChunks(query string, enterpriseID uuid.UUID, limit int) ([]model.DocChunk, error) {
	var chunks []model.DocChunk
	subQuery := r.fresh().Model(&model.KnowledgeDoc{}).Select("id").Where("enterprise_id=?", enterpriseID)
	if err := r.fresh().Where("content ILIKE ? AND doc_id IN (?)", "%"+query+"%", subQuery).Limit(limit).Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}

func (r *knowledgeRepo) FindDocByIDSimple(id, enterpriseID uuid.UUID) (*model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &doc, nil
}

func (r *knowledgeRepo) CreateCategory(c *model.KBCategory) error {
	return r.fresh().Create(c).Error
}

func (r *knowledgeRepo) ListCategories(enterpriseID uuid.UUID) ([]model.KBCategory, error) {
	var cats []model.KBCategory
	err := r.fresh().Where("enterprise_id=?", enterpriseID).Order("sort_order ASC, name ASC").Find(&cats).Error
	return cats, err
}

func (r *knowledgeRepo) ListDocVersions(docID uuid.UUID) ([]model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	if err := r.fresh().Where("id=?", docID).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	var versions []model.KnowledgeDoc
	if err := r.fresh().Where("enterprise_id=? AND (id=? OR parent_version_id=?)", doc.EnterpriseID, docID, docID).
		Order("version ASC").Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}

func (r *knowledgeRepo) FindDocByVersion(docID uuid.UUID, version int) (*model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	if err := r.fresh().Where("id=? AND version=?", docID, version).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			var parentDoc model.KnowledgeDoc
			if err2 := r.fresh().Where("parent_version_id=? AND version=?", docID, version).First(&parentDoc).Error; err2 != nil {
				if err2 == gorm.ErrRecordNotFound {
					return nil, nil
				}
				return nil, err2
			}
			return &parentDoc, nil
		}
		return nil, err
	}
	return &doc, nil
}

func (r *knowledgeRepo) KeywordSearch(enterpriseID uuid.UUID, query string, page, pageSize int) ([]model.KnowledgeDoc, int64, error) {
	var items []model.KnowledgeDoc
	var total int64
	q := r.fresh().Model(&model.KnowledgeDoc{}).Where("enterprise_id=? AND to_tsvector('simple', content) @@ to_tsquery('simple', ?)", enterpriseID, query)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 { page = 1 }
	if pageSize < 1 || pageSize > 100 { pageSize = 20 }
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *knowledgeRepo) ListDocsByVisibility(enterpriseID uuid.UUID, userID string, departmentIDs []string, page, pageSize int) ([]model.KnowledgeDoc, int64, error) {
	var items []model.KnowledgeDoc
	var total int64
	q := r.fresh().Model(&model.KnowledgeDoc{}).Where("enterprise_id=?", enterpriseID)
	q = q.Where("visibility = 'public' OR (visibility = 'private' AND creator_id = ?) OR (visibility = 'department' AND allowed_department_ids ??| ?)", userID, departmentIDs)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 { page = 1 }
	if pageSize < 1 || pageSize > 100 { pageSize = 20 }
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *knowledgeRepo) SearchChunksByEnterprise(query string, enterpriseID uuid.UUID, limit int) ([]model.DocChunk, error) {
	var chunks []model.DocChunk
	subQuery := r.fresh().Model(&model.KnowledgeDoc{}).Select("id").Where("enterprise_id=?", enterpriseID)
	if err := r.fresh().Where("content ILIKE ? AND doc_id IN (?)", "%"+query+"%", subQuery).Limit(limit).Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}

func (r *knowledgeRepo) KeywordSearchChunks(enterpriseID uuid.UUID, query string, limit int) ([]model.DocChunk, error) {
	var chunks []model.DocChunk
	subQuery := r.fresh().Model(&model.KnowledgeDoc{}).Select("id").Where("enterprise_id=? AND to_tsvector('simple', content) @@ to_tsquery('simple', ?)", enterpriseID, query)
	if err := r.fresh().Where("doc_id IN (?)", subQuery).Limit(limit).Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}
