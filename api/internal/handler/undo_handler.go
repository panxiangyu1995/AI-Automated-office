package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/service"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/response"
)

type UndoHandler struct {
	undoService *service.UndoService
}

func NewUndoHandler(undoService *service.UndoService) *UndoHandler {
	return &UndoHandler{undoService: undoService}
}

func (h *UndoHandler) Undo(c *gin.Context) {
	operationID := c.Param("operation_id")
	if operationID == "" {
		response.ValidationError(c, "operation_id", "操作ID不能为空")
		return
	}

	appErr := h.undoService.UndoOperation(operationID)
	if appErr != nil {
		response.Error(c, appErr)
		return
	}

	response.Success(c, gin.H{"message": "操作已撤销"})
}
