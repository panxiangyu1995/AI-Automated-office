package response

import (
	"net/http"

	"github.com/gin-gonic/gin"

	apperrors "github.com/ai-office/api/pkg/errors"
)

type Response struct {
	Data  interface{} `json:"data,omitempty"`
	Error *ErrorInfo  `json:"error,omitempty"`
	Meta  *MetaInfo   `json:"meta,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
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
	c.JSON(appErr.Status, Response{
		Error: &ErrorInfo{
			Code:    appErr.Code,
			Message: appErr.Message,
			Detail:  appErr.Detail,
		},
	})
}

func HandleError(c *gin.Context, err error) {
	if appErr, ok := err.(*apperrors.AppError); ok {
		Error(c, appErr)
		return
	}
	Error(c, apperrors.ErrInternal)
}
