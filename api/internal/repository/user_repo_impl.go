package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *userRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *userRepo) Create(user *model.User) error {
	return r.fresh().Create(user).Error
}

func (r *userRepo) FindByID(id, enterpriseID uuid.UUID) (*model.User, error) {
	var user model.User
	query := r.fresh().Where("id = ?", id)
	if enterpriseID != uuid.Nil {
		query = query.Where("enterprise_id = ?", enterpriseID)
	}
	err := query.First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByEmail(email string, enterpriseID string) (*model.User, error) {
	var user model.User
	query := r.fresh().Where("email = ?", email)
	if enterpriseID != "" {
		query = query.Where("enterprise_id = ?", enterpriseID)
	}
	err := query.First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) Update(user *model.User) error {
	return r.fresh().Save(user).Error
}

func (r *userRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.User{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *userRepo) List(enterpriseID string, offset, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := r.fresh().Model(&model.User{})
	if enterpriseID != "" {
		query = query.Where("enterprise_id = ?", enterpriseID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *userRepo) UpdateLastLogin(id uuid.UUID) error {
	return r.fresh().Model(&model.User{}).Where("id = ?", id).UpdateColumn("last_login_at", gorm.Expr("CURRENT_TIMESTAMP")).Error
}

func (r *userRepo) FindByIDString(id string) (*model.User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, nil
	}
	var user model.User
	if err := r.fresh().Where("id = ?", uid).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}
