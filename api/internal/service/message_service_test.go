package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type svcMsgRepo struct {
	mock.Mock
}

func (m *svcMsgRepo) Create(msg *model.Message) error                 { return nil }
func (m *svcMsgRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Message, error) {
	return nil, nil
}
func (m *svcMsgRepo) ListByReceiver(enterpriseID uuid.UUID, receiverID string, page, pageSize int) ([]model.Message, int64, error) {
	return nil, 0, nil
}
func (m *svcMsgRepo) ListUnreadByReceiver(enterpriseID uuid.UUID, receiverID string, since time.Time, limit int) ([]model.Message, error) {
	args := m.Called(enterpriseID, receiverID, since, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.Message), args.Error(1)
}
func (m *svcMsgRepo) CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error) {
	return 0, nil
}
func (m *svcMsgRepo) MarkRead(id, enterpriseID uuid.UUID) error { return nil }
func (m *svcMsgRepo) BatchMarkAsRead(ids []uuid.UUID, enterpriseID uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *svcMsgRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error) {
	return nil, 0, nil
}

type svcAnnRepo struct {
	mock.Mock
}

func (m *svcAnnRepo) Create(ann *model.Announcement) error { return nil }
func (m *svcAnnRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Announcement, int64, error) {
	return nil, 0, nil
}
func (m *svcAnnRepo) MarkRead(announcementID, employeeID uuid.UUID) error { return nil }
func (m *svcAnnRepo) IsRead(announcementID, employeeID uuid.UUID) (bool, error) {
	return false, nil
}

func newTestMessageService() (*MessageService, *svcMsgRepo) {
	msgRepo := new(svcMsgRepo)
	svc := NewMessageService(msgRepo, new(svcAnnRepo), nil)
	return svc, msgRepo
}

func TestMessageService_Poll_UnreadSincePassed(t *testing.T) {
	svc, msgRepo := newTestMessageService()

	entID := uuid.New()
	userID := uuid.New().String()
	since := time.Date(2026, 8, 18, 9, 0, 0, 0, time.UTC)
	msgs := []model.Message{{Title: "a"}}

	msgRepo.On("ListUnreadByReceiver", entID, userID, since, 50).Return(msgs, nil)

	got, appErr := svc.Poll(entID.String(), userID, since.Format(time.RFC3339Nano), 0)
	assert.Nil(t, appErr)
	assert.Equal(t, 1, len(got))
	msgRepo.AssertExpectations(t)
}

func TestMessageService_Poll_EmptySinceIsZeroTime(t *testing.T) {
	svc, msgRepo := newTestMessageService()

	entID := uuid.New()
	userID := uuid.New().String()

	msgRepo.On("ListUnreadByReceiver", entID, userID, time.Time{}, 50).Return([]model.Message{}, nil)

	got, appErr := svc.Poll(entID.String(), userID, "", 0)
	assert.Nil(t, appErr)
	assert.NotNil(t, got)
	msgRepo.AssertExpectations(t)
}

func TestMessageService_Poll_InvalidSince(t *testing.T) {
	svc, _ := newTestMessageService()

	_, appErr := svc.Poll(uuid.New().String(), "user", "not-a-timestamp", 50)
	assert.NotNil(t, appErr)
	assert.Equal(t, "VAL_INVALID_PARAMS", appErr.Code)
}

func TestMessageService_Poll_InvalidEnterprise(t *testing.T) {
	svc, msgRepo := newTestMessageService()

	_, appErr := svc.Poll("bad-enterprise", "user", "", 50)
	assert.NotNil(t, appErr)
	assert.Equal(t, "VAL_INVALID_PARAMS", appErr.Code)
	msgRepo.AssertNotCalled(t, "ListUnreadByReceiver", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestMessageService_Poll_LimitCap(t *testing.T) {
	svc, msgRepo := newTestMessageService()

	entID := uuid.New()
	userID := uuid.New().String()
	entid := entID

	msgRepo.On("ListUnreadByReceiver", entid, userID, time.Time{}, 100).Return([]model.Message{}, nil)

	_, appErr := svc.Poll(entID.String(), userID, "", 9999)
	assert.Nil(t, appErr)
	msgRepo.AssertExpectations(t)
}