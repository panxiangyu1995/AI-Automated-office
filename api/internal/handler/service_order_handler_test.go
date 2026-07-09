package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestServiceOrderHandler_UploadAttachment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("missing file returns error", func(t *testing.T) {
		h := &ServiceOrderHandler{}
		r := gin.New()
		r.POST("/enterprises/:enterprise_id/service-orders/:id/attachments", h.UploadAttachment)
		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/enterprises/ent-1/service-orders/so-1/attachments", nil)
		r.ServeHTTP(w, req)
		if w.Code == http.StatusOK {
			t.Error("expected error for missing file")
		}
	})
}
