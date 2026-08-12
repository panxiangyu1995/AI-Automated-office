package repository

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"gorm.io/gorm"
)

type DeviceAuthRepository interface {
	Save(dc *model.DeviceCode) error
	FindByDeviceCode(deviceCode string) (*model.DeviceCode, error)
	FindByUserCode(userCode string) (*model.DeviceCode, error)
	MarkVerified(deviceCode string, userID uuid.UUID) error
	MarkExchanged(deviceCode string) error
}

type deviceAuthRepo struct {
	db *gorm.DB
}

func NewDeviceAuthRepository(db *gorm.DB) DeviceAuthRepository {
	return &deviceAuthRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *deviceAuthRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *deviceAuthRepo) Save(dc *model.DeviceCode) error {
	return r.fresh().Create(dc).Error
}

func (r *deviceAuthRepo) FindByDeviceCode(deviceCode string) (*model.DeviceCode, error) {
	var dc model.DeviceCode
	err := r.fresh().Where("device_code = ?", deviceCode).First(&dc).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dc, nil
}

func (r *deviceAuthRepo) FindByUserCode(userCode string) (*model.DeviceCode, error) {
	var dc model.DeviceCode
	err := r.fresh().Where("user_code = ?", userCode).First(&dc).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &dc, nil
}

func (r *deviceAuthRepo) MarkVerified(deviceCode string, userID uuid.UUID) error {
	return r.fresh().Model(&model.DeviceCode{}).
		Where("device_code = ? AND verified = false", deviceCode).
		Updates(map[string]interface{}{
			"verified": true,
			"user_id":  userID.String(),
		}).Error
}

func (r *deviceAuthRepo) MarkExchanged(deviceCode string) error {
	result := r.fresh().Model(&model.DeviceCode{}).
		Where("device_code = ? AND exchanged = false", deviceCode).
		Update("exchanged", true)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("device code already exchanged or not found")
	}
	return nil
}
