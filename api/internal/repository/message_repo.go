package repository

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(msg *model.Message) error
	FindByID(id uuid.UUID) (*model.Message, error)
	ListByReceiver(enterpriseID uuid.UUID, receiverID string, page, pageSize int) ([]model.Message, int64, error)
	CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error)
	MarkRead(id uuid.UUID) error
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error)
}

type messageRepo struct {
	db *gorm.DB
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepo{db: db}
}

func (r *messageRepo) Create(msg *model.Message) error {
	return r.db.Create(msg).Error
}

func (r *messageRepo) FindByID(id uuid.UUID) (*model.Message, error) {
	var msg model.Message
	err := r.db.Where("id = ?", id).First(&msg).Error
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
	q := r.db.Where("enterprise_id = ? AND receiver_id = ?", enterpriseID, receiverID)
	q.Model(&model.Message{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&msgs).Error
	return msgs, total, err
}

func (r *messageRepo) CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Message{}).Where("enterprise_id = ? AND receiver_id = ? AND is_read = false", enterpriseID, receiverID).Count(&count).Error
	return count, err
}

func (r *messageRepo) MarkRead(id uuid.UUID) error {
	return r.db.Model(&model.Message{}).Where("id = ?", id).Update("is_read", true).Error
}

func (r *messageRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error) {
	var msgs []model.Message
	var total int64
	q := r.db.Where("enterprise_id = ?", enterpriseID)
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

func (r *announcementRepo) Create(ann *model.Announcement) error {
	return r.db.Create(ann).Error
}

func (r *announcementRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Announcement, int64, error) {
	var anns []model.Announcement
	var total int64
	q := r.db.Where("enterprise_id = ?", enterpriseID)
	q.Model(&model.Announcement{}).Count(&total)
	err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&anns).Error
	return anns, total, err
}

func (r *announcementRepo) MarkRead(announcementID, employeeID uuid.UUID) error {
	status := model.AnnouncementReadStatus{
		AnnouncementID: announcementID,
		EmployeeID:     employeeID,
	}
	return r.db.Create(&status).Error
}

func (r *announcementRepo) IsRead(announcementID, employeeID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&model.AnnouncementReadStatus{}).
		Where("announcement_id = ? AND employee_id = ?", announcementID, employeeID).
		Count(&count).Error
	return count > 0, err
}
