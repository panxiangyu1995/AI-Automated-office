package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(msg *model.Message) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Message, error)
	ListByReceiver(enterpriseID uuid.UUID, receiverID string, page, pageSize int) ([]model.Message, int64, error)
	ListUnreadByReceiver(enterpriseID uuid.UUID, receiverID string, since time.Time, limit int) ([]model.Message, error)
	CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error)
	MarkRead(id, enterpriseID uuid.UUID) error
	BatchMarkAsRead(ids []uuid.UUID, enterpriseID uuid.UUID) (int64, error)
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error)
}

type messageRepo struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *messageRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *messageRepo) Create(msg *model.Message) error {
	return r.fresh().Create(msg).Error
}

func (r *messageRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Message, error) {
	var msg model.Message
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&msg).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &msg, nil
}

func (r *messageRepo) ListByReceiver(enterpriseID uuid.UUID, receiverID string, page, pageSize int) ([]model.Message, int64, error) {
	var msgs []model.Message
	var total int64
	q := r.fresh().Where("enterprise_id = ? AND receiver_id = ?", enterpriseID, receiverID)
	q.Model(&model.Message{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&msgs).Error
	return msgs, total, err
}

func (r *messageRepo) CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error) {
	var count int64
	err := r.fresh().Model(&model.Message{}).Where("enterprise_id = ? AND receiver_id = ? AND is_read = false", enterpriseID, receiverID).Count(&count).Error
	return count, err
}

func (r *messageRepo) ListUnreadByReceiver(enterpriseID uuid.UUID, receiverID string, since time.Time, limit int) ([]model.Message, error) {
	query := r.fresh().Where("enterprise_id = ? AND receiver_id = ? AND is_read = false", enterpriseID, receiverID)
	if !since.IsZero() {
		query = query.Where("created_at > ?", since.UTC().Format("2006-01-02 15:04:05.000000-07:00"))
	}
	var msgs []model.Message
	err := query.Order("created_at ASC").Limit(limit).Find(&msgs).Error
	return msgs, err
}

func (r *messageRepo) MarkRead(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.Message{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("is_read", true).Error
}

func (r *messageRepo) BatchMarkAsRead(ids []uuid.UUID, enterpriseID uuid.UUID) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	result := r.fresh().Model(&model.Message{}).Where("id IN ? AND enterprise_id = ? AND is_read = false", ids, enterpriseID).Update("is_read", true)
	return result.RowsAffected, result.Error
}

func (r *messageRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error) {
	var msgs []model.Message
	var total int64
	q := r.fresh().Where("enterprise_id = ?", enterpriseID)
	q.Model(&model.Message{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&msgs).Error
	return msgs, total, err
}

type AnnouncementRepository interface {
	Create(ann *model.Announcement) error
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Announcement, int64, error)
	MarkRead(announcementID, employeeID uuid.UUID) error
	IsRead(announcementID, employeeID uuid.UUID) (bool, error)
}

type announcementRepo struct {
	db *gorm.DB
}

func NewAnnouncementRepository(db *gorm.DB) AnnouncementRepository {
	return &announcementRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *announcementRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *announcementRepo) Create(ann *model.Announcement) error {
	return r.fresh().Create(ann).Error
}

func (r *announcementRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Announcement, int64, error) {
	var anns []model.Announcement
	var total int64
	q := r.fresh().Where("enterprise_id = ?", enterpriseID)
	q.Model(&model.Announcement{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&anns).Error
	return anns, total, err
}

func (r *announcementRepo) MarkRead(announcementID, employeeID uuid.UUID) error {
	status := model.AnnouncementReadStatus{
		AnnouncementID: announcementID,
		UserID:         employeeID,
	}
	return r.fresh().Create(&status).Error
}

func (r *announcementRepo) IsRead(announcementID, employeeID uuid.UUID) (bool, error) {
	var count int64
	err := r.fresh().Model(&model.AnnouncementReadStatus{}).
		Where("announcement_id = ? AND employee_id = ?", announcementID, employeeID).
		Count(&count).Error
	return count > 0, err
}
