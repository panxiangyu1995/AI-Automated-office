package middleware

import (
	"context"
	"database/sql"

	"cloud-server/internal/model"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// TenantMiddleware 租户隔离中间件
func TenantMiddleware(db *sql.DB, log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 生成 trace_id
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}
		c.Set("trace_id", traceID)

		// 优先检查 context 中是否已有 tenant_id（由 AuthMiddleware 设置）
		// 如果 AuthMiddleware 已经从数据库获取了用户的 tenant_id，直接跳过租户验证
		if existingTenantID := c.GetString("tenant_id"); existingTenantID != "" {
			c.Next()
			return
		}

		// 从请求头获取租户ID
		tenantID := c.GetHeader("X-Tenant-ID")

		// 如果请求头没有，尝试从路径参数获取
		if tenantID == "" {
			tenantID = c.Param("tenant_id")
		}

		// 如果仍然没有，尝试从查询参数获取
		if tenantID == "" {
			tenantID = c.Query("tenant_id")
		}

		if tenantID == "" {
			response.TenantError(c, response.ErrTenantRequired, "缺少租户标识")
			c.Abort()
			return
		}

		// 验证租户ID格式
		if _, err := uuid.Parse(tenantID); err != nil {
			response.TenantError(c, response.ErrTenantInvalid, "无效的租户标识格式")
			c.Abort()
			return
		}

		// 验证租户有效性
		tenant, err := getTenantByID(c.Request.Context(), db, tenantID)
		if err != nil {
			if err == sql.ErrNoRows {
				response.TenantError(c, response.ErrTenantInvalid, "租户不存在")
				c.Abort()
				return
			}
			if log != nil {
				log.Error("failed to get tenant", zap.Error(err), zap.String("tenantID", tenantID))
			}
			response.Error(c, 500, "ERR_DB", "数据库错误", nil)
			c.Abort()
			return
		}

		// 检查租户状态
		if tenant.Status != "active" {
			response.TenantError(c, response.ErrTenantInactive, "租户已停用")
			c.Abort()
			return
		}

		// 设置租户上下文
		c.Set("tenant_id", tenantID)
		c.Set("tenant", tenant)

		c.Next()
	}
}

// getTenantByID 从数据库获取租户信息
func getTenantByID(ctx context.Context, db *sql.DB, tenantID string) (*model.Tenant, error) {
	query := `
		SELECT id, name, slug, plan, max_users, max_storage_gb, status, created_at, updated_at
		FROM tenants
		WHERE id = $1 AND deleted_at IS NULL
	`

	tenant := &model.Tenant{}
	err := db.QueryRowContext(ctx, query, tenantID).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Plan,
		&tenant.MaxUsers,
		&tenant.MaxStorageGB,
		&tenant.Status,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return tenant, nil
}
