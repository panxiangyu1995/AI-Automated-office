package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"cloud-server/internal/config"
	"cloud-server/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

const passwordCost = 12

type AuthHandler struct {
	SQLDB      *sql.DB
	JWT        config.JWTConfig
	BypassAuth bool
}

type loginRequest struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`
}

type registerRequest struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	Department string `json:"department"`
}

type forgotPasswordRequest struct {
	Username string `json:"username"`
}

type authUser struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	Name       string `json:"name"`
	Department string `json:"department"`
	Role       string `json:"role"`
}

type loginResponse struct {
	User  authUser `json:"user"`
	Token string   `json:"token"`
}

type registerResponse struct {
	User authUser `json:"user"`
}

type forgotPasswordResponse struct {
	Accepted bool `json:"accepted"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.SQLDB == nil {
		// 开发模式绕过认证
		if h.BypassAuth {
			mockUser := authUser{
				ID:         "dev-user-001",
				Username:   "dev@example.com",
				Name:       "开发用户",
				Department: "技术部",
				Role:       "admin",
			}
			token, err := h.createToken(mockUser.ID, false)
			if err != nil {
				response.Error(c, http.StatusInternalServerError, "ERR_TOKEN", "登录失败", nil)
				return
			}
			response.Success(c, loginResponse{
				User:  mockUser,
				Token: token,
			}, "登录成功 (开发模式)")
			return
		}
		response.Error(c, http.StatusServiceUnavailable, "ERR_AUTH_UNAVAILABLE", "认证服务不可用", nil)
		return
	}

	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "请求参数错误", nil)
		return
	}

	username := strings.TrimSpace(req.Username)
	password := req.Password
	if username == "" || password == "" {
		response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "账号和密码不能为空", nil)
		return
	}

	var (
		user         authUser
		passwordHash string
	)

	err := h.SQLDB.QueryRow(
		`SELECT u.id,
		        u.email,
		        u.name,
		        COALESCE(u.preferences->>'department', '未分配') AS department,
		        COALESCE(r.code, 'employee') AS role,
		        u.password_hash
		   FROM users u
		   LEFT JOIN user_roles ur ON ur.user_id = u.id
		   LEFT JOIN roles r ON r.id = ur.role_id
		  WHERE u.email = $1
		    AND u.deleted_at IS NULL
		  LIMIT 1`,
		username,
	).Scan(&user.ID, &user.Username, &user.Name, &user.Department, &user.Role, &passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			response.Error(c, http.StatusUnauthorized, "ERR_INVALID_CREDENTIALS", "账号或密码错误", nil)
			return
		}
		response.Error(c, http.StatusInternalServerError, "ERR_DB", "登录失败", nil)
		return
	}

	if err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "ERR_INVALID_CREDENTIALS", "账号或密码错误", nil)
		return
	}

	token, err := h.createToken(user.ID, req.RememberMe)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ERR_TOKEN", "登录失败", nil)
		return
	}

	response.Success(c, loginResponse{
		User:  user,
		Token: token,
	}, "登录成功")
}

func (h *AuthHandler) Register(c *gin.Context) {
	if h.SQLDB == nil {
		response.Error(c, http.StatusServiceUnavailable, "ERR_AUTH_UNAVAILABLE", "认证服务不可用", nil)
		return
	}

	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "请求参数错误", nil)
		return
	}

	username := strings.TrimSpace(req.Username)
	name := strings.TrimSpace(req.Name)
	department := strings.TrimSpace(req.Department)
	if len(username) < 3 || len(username) > 50 {
		response.Error(c, http.StatusUnprocessableEntity, "ERR_INVALID_INPUT", "用户名长度需在 3 到 50 个字符之间", nil)
		return
	}
	if len(req.Password) < 6 || len(req.Password) > 100 {
		response.Error(c, http.StatusUnprocessableEntity, "ERR_INVALID_INPUT", "密码长度需在 6 到 100 个字符之间", nil)
		return
	}
	if name == "" {
		response.Error(c, http.StatusUnprocessableEntity, "ERR_INVALID_INPUT", "姓名不能为空", nil)
		return
	}

	tenantID, err := h.defaultTenantID()
	if err != nil {
		response.Error(c, http.StatusServiceUnavailable, "ERR_TENANT_UNAVAILABLE", "默认租户未初始化", nil)
		return
	}

	var exists bool
	err = h.SQLDB.QueryRow(
		`SELECT EXISTS(
			SELECT 1 FROM users
			 WHERE tenant_id = $1
			   AND email = $2
			   AND deleted_at IS NULL
		)`,
		tenantID,
		username,
	).Scan(&exists)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ERR_DB", "注册失败", nil)
		return
	}
	if exists {
		response.Error(c, http.StatusConflict, "ERR_USERNAME_EXISTS", "用户名已存在", nil)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), passwordCost)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ERR_HASH", "注册失败", nil)
		return
	}

	preferences := map[string]string{}
	if department != "" {
		preferences["department"] = department
	}
	preferencesJSON, err := json.Marshal(preferences)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ERR_JSON", "注册失败", nil)
		return
	}

	var userID string
	err = h.SQLDB.QueryRow(
		`INSERT INTO users (tenant_id, email, password_hash, name, status, email_verified, preferences, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, 'active', FALSE, $5::jsonb, NOW(), NOW())
		 RETURNING id`,
		tenantID,
		username,
		string(passwordHash),
		name,
		string(preferencesJSON),
	).Scan(&userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "ERR_DB", "注册失败", nil)
		return
	}

	_ = h.bindDefaultRole(tenantID, userID)

	role := "employee"
	_ = h.SQLDB.QueryRow(
		`SELECT COALESCE(r.code, 'employee')
		   FROM user_roles ur
		   JOIN roles r ON r.id = ur.role_id
		  WHERE ur.user_id = $1
		  LIMIT 1`,
		userID,
	).Scan(&role)

	response.Success(c, registerResponse{
		User: authUser{
			ID:         userID,
			Username:   username,
			Name:       name,
			Department: defaultDepartment(department),
			Role:       role,
		},
	}, "注册成功")
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	if h.SQLDB == nil {
		response.Error(c, http.StatusServiceUnavailable, "ERR_AUTH_UNAVAILABLE", "认证服务不可用", nil)
		return
	}

	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "请求参数错误", nil)
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		response.Error(c, http.StatusBadRequest, "ERR_INVALID_INPUT", "请输入账号", nil)
		return
	}

	response.Success(c, forgotPasswordResponse{
		Accepted: true,
	}, "若账号存在，重置指引将发送至对应账号")
}

func (h *AuthHandler) createToken(userID string, rememberMe bool) (string, error) {
	if h.JWT.Secret == "" {
		return "", errors.New("jwt secret is empty")
	}

	expire := h.JWT.Expire
	if expire <= 0 {
		expire = 24 * time.Hour
	}
	if rememberMe {
		expire = 7 * 24 * time.Hour
	}

	now := time.Now()
	expireAt := now.Add(expire).Unix()
	payload := fmt.Sprintf("%s|%s|%d|%d", userID, h.JWT.Issuer, now.Unix(), expireAt)
	mac := hmac.New(sha256.New, []byte(h.JWT.Secret))
	_, _ = mac.Write([]byte(payload))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	token := base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%s|%s", payload, signature)))
	return token, nil
}

func (h *AuthHandler) defaultTenantID() (string, error) {
	var tenantID string
	err := h.SQLDB.QueryRow(
		`SELECT id
		   FROM tenants
		  WHERE slug = 'default'
		  LIMIT 1`,
	).Scan(&tenantID)
	if err != nil {
		return "", err
	}
	return tenantID, nil
}

func (h *AuthHandler) bindDefaultRole(tenantID, userID string) error {
	var roleID string
	err := h.SQLDB.QueryRow(
		`SELECT id
		   FROM roles
		  WHERE tenant_id = $1
		    AND code = 'employee'
		  LIMIT 1`,
		tenantID,
	).Scan(&roleID)
	if err != nil {
		return err
	}

	_, err = h.SQLDB.Exec(
		`INSERT INTO user_roles (user_id, role_id, created_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (user_id, role_id) DO NOTHING`,
		userID,
		roleID,
	)
	return err
}

func defaultDepartment(department string) string {
	if strings.TrimSpace(department) == "" {
		return "未分配"
	}
	return department
}
