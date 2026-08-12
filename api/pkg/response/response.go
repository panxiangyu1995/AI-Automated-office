package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type Response struct {
	Data  interface{} `json:"data,omitempty"`
	Error *ErrorInfo  `json:"error,omitempty"`
	Meta  *MetaInfo   `json:"meta,omitempty"`
}

type ErrorInfo struct {
	Code               string                        `json:"code"`
	Message            string                        `json:"message"`
	Detail             string                        `json:"detail,omitempty"`
	Details            []string                      `json:"details,omitempty"`
	DetailItems        []apperrors.ErrorDetail       `json:"detail_items,omitempty"`
	Level              string                        `json:"level,omitempty"`
	Recoverable        bool                          `json:"recoverable,omitempty"`
	RecoveryAction     string                        `json:"recovery_action,omitempty"`
	RecoveryActionInfo *apperrors.RecoveryActionInfo `json:"recovery_action_info,omitempty"`
	RequestID          string                        `json:"request_id,omitempty"`
	Timestamp          string                        `json:"timestamp,omitempty"`
}

type MetaInfo struct {
	Page       int   `json:"page,omitempty"`
	PageSize   int   `json:"page_size,omitempty"`
	TotalCount int64 `json:"total_count,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{Data: data})
}

func SuccessWithMeta(c *gin.Context, data interface{}, meta *MetaInfo) {
	c.JSON(http.StatusOK, Response{Data: data, Meta: meta})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{Data: data})
}

func NoContent(c *gin.Context) {
	c.JSON(http.StatusNoContent, Response{})
}

func Error(c *gin.Context, appErr *apperrors.AppError) {
	if reqID, exists := c.Get("request_id"); exists {
		if id, ok := reqID.(string); ok && appErr.RequestID == "" {
			appErr.RequestID = id
		}
	}
	if appErr.Timestamp.IsZero() {
		appErr.Timestamp = time.Now()
	}

	ei := &ErrorInfo{
		Code:               appErr.Code,
		Message:            appErr.Message,
		Detail:             appErr.Detail,
		Level:              appErr.Level,
		Recoverable:        appErr.Recoverable,
		RecoveryAction:     appErr.RecoveryAction,
		RecoveryActionInfo: appErr.RecoveryActionInfo,
		RequestID:          appErr.RequestID,
	}
	if !appErr.Timestamp.IsZero() {
		ei.Timestamp = appErr.Timestamp.Format("2006-01-02T15:04:05Z07:00")
	}
	if len(appErr.Details) > 0 {
		ei.Details = appErr.Details
	}
	if len(appErr.DetailItems) > 0 {
		ei.DetailItems = appErr.DetailItems
	}
	status := appErr.Status
	if status == 0 {
		status = http.StatusInternalServerError
	}
	c.JSON(status, Response{Error: ei})
}

func HandleError(c *gin.Context, err error) {
	if appErr, ok := err.(*apperrors.AppError); ok {
		Error(c, appErr)
		return
	}
	Error(c, apperrors.ErrInternal)
}

func ValidationError(c *gin.Context, field, message string) {
	Error(c, apperrors.NewValidationError(field, message))
}

func ValidationErrors(c *gin.Context, errs []apperrors.ValidationError) {
	Error(c, apperrors.NewValidationErrors(errs))
}
