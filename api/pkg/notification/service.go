package notification

import "fmt"

type NotificationService struct {
	smsClient   *AliyunSMSClient
	emailClient *EmailClient
}

func NewNotificationService(smsClient *AliyunSMSClient, emailClient *EmailClient) *NotificationService {
	return &NotificationService{smsClient: smsClient, emailClient: emailClient}
}

func (s *NotificationService) SendSMS(phone, templateCode string, params map[string]string) error {
	if s.smsClient == nil {
		return fmt.Errorf("SMS client not configured")
	}
	return s.smsClient.Send(phone, templateCode, params)
}

func (s *NotificationService) SendEmail(to, subject, body string) error {
	if s.emailClient == nil {
		return fmt.Errorf("email client not configured")
	}
	return s.emailClient.Send(to, subject, body)
}
